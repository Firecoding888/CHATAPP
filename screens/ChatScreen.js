import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Composer, GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import { auth, database } from '../firebaseConfig';
// 1. NEW IMPORTS
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatScreen() {
  // ... (Keep your existing logic exactly the same) ...
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { chatId, chatName } = route.params; 
  const currentUser = auth.currentUser.email;

  useLayoutEffect(() => {
    navigation.setOptions({ 
      title: chatName || 'Chat',
      headerTransparent: true, // Make header transparent for glass effect
      headerBackground: () => (
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      ),
      headerTintColor: '#00f3ff',
      headerTitleStyle: { fontWeight: 'bold' }
    });
  }, [navigation, chatName]);

  useEffect(() => {
    const collectionRef = collection(database, 'chats', chatId, 'messages');
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, querySnapshot => {
      setMessages(
        querySnapshot.docs.map(doc => ({
          _id: doc.id, createdAt: doc.data().createdAt.toDate(), text: doc.data().text, user: doc.data().user, image: doc.data().image || null, 
        }))
      );
    });
    return unsubscribe;
  }, []);

  const onSend = (messages = []) => {
    const { _id, createdAt, text, user, image } = messages[0];
    addDoc(collection(database, 'chats', chatId, 'messages'), { _id, createdAt, text: text || '', user, image: image || null });
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8, });
      if (result.canceled) return;
      setLoading(true);
      const manipResult = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 300 } }], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true });
      const base64Img = `data:image/jpeg;base64,${manipResult.base64}`;
      onSend([{ _id: Math.random().toString(36).substring(7), createdAt: new Date(), user: { _id: currentUser }, image: base64Img, text: '' }]);
    } catch (error) { Alert.alert("Image Error", error.message); } finally { setLoading(false); }
  };

  // --- CUSTOM GLASS INPUT BAR COMPONENTS ---
  const renderInputToolbar = (props) => (
    <BlurView intensity={40} tint="dark" style={styles.glassInputToolbar}>
       <InputToolbar {...props} containerStyle={{ backgroundColor: 'transparent', borderTopWidth: 0 }} />
    </BlurView>
  );

  const renderComposer = (props) => (
    <Composer {...props} textInputStyle={styles.glassComposer} placeholderTextColor="#aaa" />
  );

  const renderActions = () => (
    <TouchableOpacity style={styles.neonButton} onPress={pickImage}>
      <Text style={styles.neonPlus}>+</Text>
    </TouchableOpacity>
  );

  return (
    // 2. AURORA BACKGROUND
    <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']} // Slightly different aurora blend
        style={{ flex: 1 }}
    >
      {loading && (<View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#00f3ff" /></View>)}

      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{ _id: auth.currentUser?.email, name: auth.currentUser?.email }}
        alwaysShowSend
        renderUsernameOnMessage={true}
        
        // Inject Custom Glass Components
        renderActions={renderActions}
        renderInputToolbar={renderInputToolbar}
        renderComposer={renderComposer}

        // Bubble Styles (Keep Neon)
        bubbleStyle={{
          right: { backgroundColor: 'rgba(57, 255, 20, 0.8)', borderRadius: 0, borderBottomRightRadius: 15, borderWidth: 1, borderColor: '#39ff14' },
          left: { backgroundColor: 'rgba(42, 42, 42, 0.8)', borderRadius: 0, borderTopLeftRadius: 15, borderWidth: 1, borderColor: '#bc13fe' }
        }}
        textStyle={{
          right: { color: '#000000', fontWeight: 'bold' },
          left: { color: '#ffffff' }
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // New Glass Input Styles
  glassInputToolbar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 5,
    paddingBottom: 5, // Adjust for specific phone models if needed
  },
  glassComposer: {
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.05)', // Subtle fill for input area
    borderRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 15,
    marginRight: 10,
  },

  neonButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#bc13fe', justifyContent: 'center', alignItems: 'center', marginLeft: 10, marginBottom: 5 },
  neonPlus: { color: '#bc13fe', fontWeight: 'bold', fontSize: 24, marginTop: -2 },
  loadingOverlay: { position: 'absolute', zIndex: 10, top: '50%', left: '50%', marginLeft: -25, marginTop: -25 }
});