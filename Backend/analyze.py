import cv2
import numpy as np
import os

def load(folder):
    images, names = [], []
    for root, dirs, files in os.walk(folder):
        for file in sorted(files):
            if file.lower().endswith(('.jpg', '.png')):
                path = os.path.join(root, file)
                img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
                if img is not None:
                    images.append(cv2.resize(img, (300, 300)))
                    names.append(file)
    return images, names

orb = cv2.ORB_create(nfeatures=1000)
bf  = cv2.BFMatcher(cv2.NORM_HAMMING)

def match(img1, img2):
    _, d1 = orb.detectAndCompute(img1, None)
    _, d2 = orb.detectAndCompute(img2, None)
    if d1 is None or d2 is None or len(d1) < 2 or len(d2) < 2:
        return 0
    matches = bf.knnMatch(d1, d2, k=2)
    good = [m for m, n in matches if m.distance < 0.75 * n.distance]
    return len(good)

correct_imgs, correct_names = load('correct-Images')
wrong_imgs,   wrong_names   = load('Wrong-images')

print(f"Correct templates: {len(correct_imgs)}, Wrong templates: {len(wrong_imgs)}\n")

print("=== Wrong images vs ALL templates ===")
for wi, wn in zip(wrong_imgs, wrong_names):
    sc = max((match(wi, c) for c in correct_imgs), default=0)
    sw = max((match(wi, w) for w in wrong_imgs), default=0)
    verdict = "CORRECT" if sc > sw else "WRONG" if sw > sc else "TIE"
    print(f"  {wn:45s} correct={sc:3d}  wrong={sw:3d}  -> {verdict}")

print()
print("=== Correct images vs ALL templates ===")
for ci, cn in zip(correct_imgs, correct_names):
    sc = max((match(ci, c) for c in correct_imgs), default=0)
    sw = max((match(ci, w) for w in wrong_imgs), default=0)
    verdict = "CORRECT" if sc > sw else "WRONG" if sw > sc else "TIE"
    print(f"  {cn:45s} correct={sc:3d}  wrong={sw:3d}  -> {verdict}")
