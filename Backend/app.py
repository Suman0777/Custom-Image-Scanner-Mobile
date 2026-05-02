import cv2
import numpy as np
import base64
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

# ---------- LOAD TEMPLATES ----------
def load_folder(folder):
    images = []
    for root, _, files in os.walk(folder):
        for file in sorted(files):
            if file.lower().endswith((".jpg", ".png")):
                img = cv2.imread(os.path.join(root, file), cv2.IMREAD_GRAYSCALE)
                if img is not None:
                    images.append(cv2.resize(img, (300, 300)))
    return images

correct_templates = load_folder("correct-Images")
wrong_templates   = load_folder("Wrong-images")
print(f"Templates loaded — correct: {len(correct_templates)}, wrong: {len(wrong_templates)}")

# ---------- MATCHER ----------
_orb = cv2.ORB_create(nfeatures=2000)
FLANN_INDEX_LSH = 6
_flann = cv2.FlannBasedMatcher(
    {"algorithm": FLANN_INDEX_LSH, "table_number": 6, "key_size": 12, "multi_probe_level": 1},
    {"checks": 50}
)

def orb_match(img, template):
    _, d1 = _orb.detectAndCompute(img, None)
    _, d2 = _orb.detectAndCompute(template, None)
    if d1 is None or d2 is None or len(d1) < 2 or len(d2) < 2:
        return 0
    try:
        matches = _flann.knnMatch(d1, d2, k=2)
        good = [m for m, n in matches if len([m, n]) == 2 and m.distance < 0.7 * n.distance]
        return len(good)
    except Exception:
        return 0

def best_score(img, templates):
    return max((orb_match(img, t) for t in templates), default=0)

# ---------- PREPROCESS ----------
def preprocess(gray):
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    eq = clahe.apply(gray)
    blur = cv2.GaussianBlur(eq, (3, 3), 0)
    return blur

# ---------- PERSPECTIVE WARP ----------
def warp_quad(approx, gray):
    pts = approx.reshape(4, 2).astype("float32")
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    dst = np.array([[0,0],[299,0],[299,299],[0,299]], dtype="float32")
    M = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(gray, M, (300, 300))

# ---------- EXTRACT ROI CANDIDATES ----------
def extract_rois(gray):
    rois = []
    h, w = gray.shape

    # 1. Quad contour candidates from multiple thresholds
    for block in [cv2.THRESH_BINARY, cv2.THRESH_BINARY_INV]:
        _, thresh = cv2.threshold(gray, 0, 255, block + cv2.THRESH_OTSU)
        contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        quads = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 1500 or area > 0.9 * h * w:
                continue
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
            if len(approx) == 4:
                quads.append((area, approx))
        for _, approx in sorted(quads, key=lambda x: -x[0])[:6]:
            try:
                rois.append(warp_quad(approx, gray))
            except Exception:
                pass

    # 2. Multi-scale center crops (handles when no quad is detected)
    for scale in [1.0, 0.85, 0.7, 0.55]:
        ch, cw = int(h * scale), int(w * scale)
        y1, x1 = (h - ch) // 2, (w - cw) // 2
        crop = gray[y1:y1+ch, x1:x1+cw]
        rois.append(cv2.resize(crop, (300, 300)))

    return rois

# ---------- DETECT ----------
def detect_marker(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Normalise to fixed width keeping aspect ratio
    h, w = gray.shape
    scale = 900 / max(h, w)
    gray = cv2.resize(gray, (int(w * scale), int(h * scale)))
    gray = preprocess(gray)

    rois = extract_rois(gray)

    best_sc, best_sw = 0, 0
    for roi in rois:
        sc = best_score(roi, correct_templates)
        sw = best_score(roi, wrong_templates)
        print(f"  roi → correct={sc}, wrong={sw}")
        if sc > best_sc:
            best_sc = sc
        if sw > best_sw:
            best_sw = sw

    total = best_sc + best_sw
    print(f"Final → correct={best_sc}, wrong={best_sw}, total={total}")

    if total == 0:
        return "UNKNOWN"

    ratio_c = best_sc / total
    ratio_w = best_sw / total

    # Need at least 8 good matches AND >60% of total to win
    MIN_MATCHES = 8
    MIN_RATIO   = 0.60

    if best_sc >= MIN_MATCHES and ratio_c >= MIN_RATIO:
        return "CORRECT"
    elif best_sw >= MIN_MATCHES and ratio_w >= MIN_RATIO:
        return "WRONG"
    else:
        return "UNKNOWN"

# ---------- API ----------
@app.route('/detect', methods=['POST'])
def detect():
    data = request.json.get('base64')
    if not data:
        return jsonify({"result": "UNKNOWN", "error": "No base64 data"}), 400
    try:
        img_data = base64.b64decode(data)
        np_arr   = np.frombuffer(img_data, np.uint8)
        img      = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return jsonify({"result": "UNKNOWN", "error": "Failed to decode image"}), 400
        result = detect_marker(img)
        return jsonify({"result": result})
    except Exception as e:
        print("detect error:", e)
        return jsonify({"result": "UNKNOWN", "error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
