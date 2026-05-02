import { CameraView, useCameraPermissions } from "expo-camera";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import Buttonrender from "./Buttonrender";
import { useRef, useState } from "react";


export default function CameraPermission({ onBack }) {
  const [permission, requestPermission] = useCameraPermissions();

  const camerRef = useRef(null);
  const [result, setResult] = useState(null); // null | 'CORRECT' | 'WRONG' | 'UNKNOWN'

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Initializing Camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        {/* <Text style={styles.permIcon}>🔒</Text> */}
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permMsg}>Allow camera access to scan QR codes and barcodes.</Text>
        <Buttonrender label="Grant Permission" onPress={requestPermission} />
        <Buttonrender label="Go Back" onPress={onBack} variant="secondary" />
      </View>
    );
  }

  const CaptureImg = async () => {
    if (!camerRef.current) return;
    try {
      const photo = await camerRef.current.takePictureAsync({ base64: true });
      if (photo?.base64) await sedtobackend(photo.base64);
    } catch (e) {
      console.error("Capture error:", e.message);
    }
  };

  const sedtobackend = async (base64) => {
    try {
      const res = await fetch("https://custom-image-scanner-mobile.onrender.com/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64 }),
      });
      const text = await res.text();
      console.log("Server response:", res.status, text);
      if (!res.ok) {
        console.error("Server error:", res.status, text);
        setResult("UNKNOWN");
        return;
      }
      const data = JSON.parse(text);
      const trimmed = data.result?.trim();
      setResult(trimmed === "CORRECT" ? "CORRECT" : trimmed === "WRONG" ? "WRONG" : "UNKNOWN");
    } catch (error) {
      console.error("Error sending image to backend:", error.message);
      setResult("UNKNOWN");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Scanner</Text>
      <View style={styles.cameraWrapper}>
        <CameraView style={styles.camera} ref={camerRef} facing="back" />
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
      </View>
      <Text style={styles.scanHint}>Align the <Text style={{ color: "#6f73bc" }}>Given Image</Text> within the frame {"\n"} <Text style={{ color: "#00C896" }}>Green Color</Text> </Text>
      <Buttonrender label="Capture Image" onPress={CaptureImg} />
      <Buttonrender label="← Go Back" onPress={onBack} variant="secondary" />

      {result && (
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setResult(null)}>
          <View style={styles.gifWrapper}>
            <Image
              source={
                result === "CORRECT"
                  ? require("../assets/images/verified.gif")
                  : require("../assets/images/x.gif")
              }
              style={styles.gif}
            />
            <Text style={[styles.resultText, { color: result === "CORRECT" ? "#00C896" : "#ff4d4d" }]}>
              {result === "CORRECT" ? "Verified!" : result === "WRONG" ? "Invalid!" : "Unknown Marker"}
            </Text>
            <Text style={styles.dismissText}>Tap to dismiss</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const CORNER = 24;
const BORDER = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 32,
  },
  cameraWrapper: {
    width: 280,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  // Corner brackets
  cornerTL: { position: 'absolute', top: 0, left: 0, width: CORNER, height: CORNER, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderColor: '#00C896', borderTopLeftRadius: 8 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: CORNER, height: CORNER, borderTopWidth: BORDER, borderRightWidth: BORDER, borderColor: '#00C896', borderTopRightRadius: 8 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: CORNER, height: CORNER, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderColor: '#00C896', borderBottomLeftRadius: 8 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: CORNER, height: CORNER, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderColor: '#00C896', borderBottomRightRadius: 8 },
  scanHint: {
    color: '#9999bb',
    fontSize: 13,
    marginTop: 20,
    marginBottom: 4,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: { color: '#9999bb', fontSize: 16 },
  permIcon: { fontSize: 52, marginBottom: 16 },
  permTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  permMsg: { fontSize: 14, color: '#9999bb', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gifWrapper: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 28,
  },
  gif: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  resultText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
    letterSpacing: 1,
  },
  dismissText: {
    color: '#666688',
    fontSize: 12,
    marginTop: 8,
  },
});
