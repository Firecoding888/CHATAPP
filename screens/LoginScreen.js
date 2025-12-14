import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../firebaseConfig';
// 1. NEW IMPORTS
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    // ... (Keep your existing handleAuth logic exactly the same) ...
    if (!email || !password) return Alert.alert("Error", "Please fill in all fields");
    if (!isLogin && !username) return Alert.alert("Error", "Please enter a username");

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(database, 'users', user.email), {
          email: user.email, username: username, uid: user.uid
        });
      }
    } catch (error) {
      Alert.alert("Auth Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 2. AURORA BACKGROUND (Linear Gradient)
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e', '#000000']} // Deep purple/blue aurora vibes
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
         {/* Use your GIF url here */}
        <Image 
          source={{ uri: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z0ZWF4eWF4eWF4eWF4eWF4eWF4eWF4eWF4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1TVq2ZSgnS/giphy.gif' }}
          style={{ width: 180, height: 180 }} resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>{isLogin ? 'PINGSTER' : 'NEW USER'}</Text>
      
      {/* 3. GLASSMORPHISM CONTAINER (BlurView) */}
      <BlurView intensity={30} tint="dark" style={styles.glassContainer}>
          {!isLogin && (
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input} placeholder="USERNAME" placeholderTextColor="#aaa"
                value={username} onChangeText={setUsername} autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} placeholder="ENTER EMAIL" placeholderTextColor="#aaa"
              value={email} onChangeText={setEmail} autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} placeholder="ENTER PASSWORD" placeholderTextColor="#aaa"
              value={password} onChangeText={setPassword} secureTextEntry
            />
          </View>
      </BlurView>
      
      {loading ? (
        <ActivityIndicator size="large" color="#bc13fe" style={{marginTop: 20}} />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.mainButton} onPress={handleAuth}>
            <Text style={styles.buttonText}>{isLogin ? 'LOGIN' : 'REGISTER ID'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{marginTop: 20}}>
            <Text style={styles.switchText}>
              {isLogin ? 'New User Create ID' : 'Already have an ID? Login'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 10 },
  title: { 
    fontSize: 32, marginBottom: 20, textAlign: 'center', color: '#fff', fontWeight: 'bold',
    textShadowColor: '#bc13fe', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 20
  },
  // NEW GLASS STYLES
  glassContainer: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden', // Required for BlurView to respect borderRadius
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)', // Subtle white border defining the glass
  },
  inputWrapper: {
    marginBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Slightly darker inner part
    borderRadius: 10,
  },
  input: { padding: 15, color: '#fff', fontSize: 16 },
  buttonContainer: { marginTop: 30, alignItems: 'center' },
  mainButton: {
    backgroundColor: '#00f3ff', padding: 15, borderRadius: 10, alignItems: 'center', width: '100%',
    shadowColor: '#00f3ff', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10
  },
  buttonText: { fontWeight: 'bold', fontSize: 16, color: '#121212' },
  switchText: { color: '#bc13fe', fontWeight: 'bold' }
});