import { useState } from "react";
import { Text, View, StyleSheet, Image } from "react-native";
import Buttonrender from "./Buttonrender";
import CameraPermission from "./CameraPermission";

export default function Index() {
  const [showCamera, setShowCamera] = useState(false);

  if (showCamera) {
    return <CameraPermission onBack={() => setShowCamera(false)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Image source={require('../assets/images/shutter.gif')} style={styles.icon} />
      </View>
      <Text style={styles.title}>Custom Barcode{"\n"} Detection</Text>
      <Text style={styles.subtitle}>Scan The Custom Barcodes {"\n"} instantly with your camera</Text>
      <View style={styles.divider} />
      <Text style={styles.hint}>Point your camera at a Image to get started Between the box To get the <Text style={{ color: "#359b82b1" }}>Best Result</Text></Text>
      <Buttonrender label="Start Scanning" onPress={() => setShowCamera(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#00C896',
  },
  icon: { width: 64, height: 64, resizeMode: 'contain' , borderRadius: 32},
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#9999bb',
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: '#00C896',
    borderRadius: 10,
    marginVertical: 24,
  },
  hint: {
    fontSize: 13,
    color: '#555577',
    textAlign: 'center',
    marginBottom: 8,
  },
});
