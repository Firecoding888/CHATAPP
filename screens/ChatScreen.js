import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { auth, database } from '../firebaseConfig';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  
  // UPDATED PARAMS: Now we just take the ID and Name directly
  const { chatId, chatName } = route.params; 
  const currentUser = auth.currentUser.email;

  useLayoutEffect(() => {
    navigation.setOptions({ 
      title: chatName || 'Chat', // Show Group Name or User Name
      headerStyle: { backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#00f3ff' },
      headerTintColor: '#00f3ff',
    });
  }, [navigation, chatName]);

  useEffect(() => {
    // We use the chatId passed from Home Screen
    const collectionRef = collection(database, 'chats', chatId, 'messages');
    const q = query(collectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, querySnapshot => {
      setMessages(
        querySnapshot.docs.map(doc => ({
          _id: doc.id,
          createdAt: doc.data().createdAt.toDate(),
          text: doc.data().text,
          user: doc.data().user, // This includes user.name so we know who sent it
          image: doc.data().image || null, 
        }))
      );
    });
    return unsubscribe;
  }, []);

  const onSend = (messages = []) => {
    const { _id, createdAt, text, user, image } = messages[0];
    addDoc(collection(database, 'chats', chatId, 'messages'), {
      _id,
      createdAt,
      text: text || '',
      user, // Contains _id (email) and name (optional)
      image: image || null 
    });
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.5, 
      });

      if (result.canceled) return;
      setLoading(true);

      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 300 } }], 
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const base64Img = `data:image/jpeg;base64,${manipResult.base64}`;

      onSend([{
        _id: Math.random().toString(36).substring(7),
        createdAt: new Date(),
        user: { _id: currentUser },
        image: base64Img, 
        text: ''
      }]);

    } catch (error) {
      Alert.alert("Image Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderActions = () => {
    return (
      <TouchableOpacity style={styles.neonButton} onPress={pickImage}>
        <Text style={styles.neonPlus}>+</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00f3ff" />
        </View>
      )}

      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{ 
            _id: auth.currentUser?.email,
            name: auth.currentUser?.email // Send name so others see who spoke in group
        }}
        renderActions={renderActions}
        alwaysShowSend
        renderUsernameOnMessage={true} // SHOW NAMES IN GROUPS
        
        bubbleStyle={{
          right: { backgroundColor: '#39ff14', borderRadius: 0, borderBottomRightRadius: 15, borderWidth: 1, borderColor: '#39ff14' },
          left: { backgroundColor: '#2A2A2A', borderRadius: 0, borderTopLeftRadius: 15, borderWidth: 1, borderColor: '#bc13fe' }
        }}
        textStyle={{
          right: { color: '#000000', fontWeight: 'bold' },
          left: { color: '#101010ff' }
        }}
        textInputStyle={{ color: '#000', backgroundColor: '#fff', borderRadius: 20, paddingTop: 10, marginTop: 5 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  neonButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#bc13fe', justifyContent: 'center', alignItems: 'center', marginLeft: 10, marginBottom: 5 },
  neonPlus: { color: '#bc13fe', fontWeight: 'bold', fontSize: 24, marginTop: -2 },
  loadingOverlay: { position: 'absolute', zIndex: 10, top: '50%', left: '50%', marginLeft: -25, marginTop: -25 }
});