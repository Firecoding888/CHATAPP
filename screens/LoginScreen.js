import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../firebaseConfig';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
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
          email: user.email,
          username: username,
          uid: user.uid
        });
      }
    } catch (error) {
      Alert.alert("Auth Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* --- ANIMATED GIF HERE --- */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/login_logo.gif')}
          // OR use this online URL I found for you (Neon Robot):
          //source={{ uri: 'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z0ZWF4eWF4eWF4eWF4eWF4eWF4eWF4eWF4eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1TVq2ZSgnS/giphy.gif' }}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>
        {isLogin ? 'PINGSTER APP' : 'NEW USER'}
      </Text>
      
      {!isLogin && (
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder="USERNAME" 
            placeholderTextColor="#555"
            value={username} 
            onChangeText={setUsername} 
            autoCapitalize="words"
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="ENTER EMAIL" 
          placeholderTextColor="#555"
          value={email} 
          onChangeText={setEmail} 
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="ENTER PASSWORD" 
          placeholderTextColor="#555"
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry
        />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#bc13fe" />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.mainButton} onPress={handleAuth}>
            <Text style={styles.buttonText}>
              {isLogin ? 'LOG IN' : 'REGISTER ID'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{marginTop: 15}}>
            <Text style={styles.switchText}>
              {isLogin ? 'New User? Create ID' : 'Already have an ID? Login'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#121212' },
  
  logoContainer: { alignItems: 'center', marginBottom: 20 },

  title: { 
    fontSize: 32, marginBottom: 30, textAlign: 'center', color: '#fff', fontWeight: 'bold',
    textShadowColor: '#bc13fe', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 20
  },
  inputContainer: {
    marginBottom: 20, backgroundColor: '#1E1E1E', borderRadius: 10, borderWidth: 1,
    borderColor: '#00f3ff', shadowColor: '#00f3ff', shadowOpacity: 0.5, shadowRadius: 5, elevation: 5
  },
  input: { padding: 15, color: '#fff', fontSize: 16 },
  buttonContainer: { marginTop: 10, alignItems: 'center' },
  mainButton: {
    backgroundColor: '#00f3ff', padding: 15, borderRadius: 10, alignItems: 'center', width: '100%',
    shadowColor: '#00f3ff', shadowOpacity: 0.8, shadowRadius: 10, elevation: 10
  },
  buttonText: { fontWeight: 'bold', fontSize: 16, color: '#121212' },
  switchText: { color: '#bc13fe', fontWeight: 'bold' }
});