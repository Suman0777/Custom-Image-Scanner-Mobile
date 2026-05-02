import { StyleSheet, Text, TouchableOpacity } from 'react-native'

const Buttonrender = ({ label = 'Open Camera', onPress, variant = 'primary' }) => {
  return (
    <TouchableOpacity style={[styles.button, styles[variant]]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  )
}

export default Buttonrender

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  primary: {
    backgroundColor: '#00C896',
  },
  secondary: {
    backgroundColor: '#2a2a3d',
    borderWidth: 1,
    borderColor: '#00C896',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
})