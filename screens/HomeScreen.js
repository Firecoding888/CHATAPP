import { useNavigation } from '@react-navigation/native';
import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../firebaseConfig';
// 1. NEW IMPORTS
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  // ... (Keep all your existing state variables and useEffect logic exactly the same) ...
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [myGroups, setMyGroups] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const currentUserEmail = auth.currentUser?.email;

  useEffect(() => {
    const usersRef = collection(database, 'users');
    const unsubUsers = onSnapshot(usersRef, (querySnapshot) => {
      const usersList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email !== currentUserEmail) usersList.push({ id: doc.id, ...userData });
      });
      setUsers(usersList);
    });
    const groupsRef = collection(database, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', currentUserEmail));
    const unsubGroups = onSnapshot(q, (querySnapshot) => {
      const groupsList = [];
      querySnapshot.forEach((doc) => groupsList.push({ id: doc.id, ...doc.data() }));
      setMyGroups(groupsList);
      setLoading(false);
    });
    return () => { unsubUsers(); unsubGroups(); };
  }, []);

  const handleUserPress = (user) => {
      if (isGroupMode) {
        if (selectedUsers.includes(user.email)) setSelectedUsers(selectedUsers.filter(email => email !== user.email));
        else setSelectedUsers([...selectedUsers, user.email]);
      } else {
        navigation.navigate('Chat', { chatId: [currentUserEmail.toLowerCase(), user.email.toLowerCase()].sort().join('_'), chatName: user.username || user.email });
      }
  };

  const createGroup = async () => {
    if (!groupName || selectedUsers.length === 0) return Alert.alert("Error", "Enter name & select users.");
    const newGroupId = `GROUP_${Math.random().toString(36).substring(7)}`;
    try {
      await setDoc(doc(database, 'groups', newGroupId), {
        groupId: newGroupId, name: groupName, members: [...selectedUsers, currentUserEmail], createdAt: new Date(), createdBy: currentUserEmail
      });
      navigation.navigate('Chat', { chatId: newGroupId, chatName: groupName });
      setIsGroupMode(false); setSelectedUsers([]); setGroupName('');
    } catch (error) { Alert.alert("Error", error.message); }
  };

  if (loading) return <View style={[styles.loadingContainer]}><ActivityIndicator size="large" color="#00f3ff"/></View>;

  return (
    // 2. AURORA BACKGROUND
    <LinearGradient
        colors={['#000000', '#1A1A2E', '#16213E', '#0f3460']} // Darker, cooler aurora
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={styles.container}
    >
      {/* 3. GLASSY HEADER */}
      <BlurView intensity={20} tint="dark" style={styles.glassHeader}>
        <Text style={styles.header}>NEON NETWORK</Text>
        <TouchableOpacity onPress={() => setIsGroupMode(!isGroupMode)}>
          <Text style={styles.groupToggle}>{isGroupMode ? 'CANCEL' : '+ NEW GROUP'}</Text>
        </TouchableOpacity>
      </BlurView>

      {isGroupMode && (
        <BlurView intensity={20} tint="dark" style={styles.glassInputContainer}>
          <TextInput
            style={styles.input} placeholder="ENTER GROUP NAME..." placeholderTextColor="#aaa"
            value={groupName} onChangeText={setGroupName}
          />
          <TouchableOpacity style={styles.createButton} onPress={createGroup}>
            <Text style={styles.createText}>CREATE</Text>
          </TouchableOpacity>
        </BlurView>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 15 }}>
        {/* MY GROUPS */}
        {myGroups.length > 0 && !isGroupMode && (
          <View>
            <Text style={styles.sectionTitle}>MY SQUADS</Text>
            {myGroups.map((group) => (
              // 4. GLASSY CARDS
              <BlurView key={group.id} intensity={15} tint="dark" style={styles.glassCardOuter}>
                  <TouchableOpacity style={[styles.cardInner, {borderLeftColor: '#39ff14'}]} onPress={() => navigation.navigate('Chat', { chatId: group.id, chatName: group.name })}>
                    <View style={styles.groupAvatar}><Text style={styles.groupAvatarText}>{group.name[0].toUpperCase()}</Text></View>
                    <View><Text style={styles.nameText}>{group.name}</Text><Text style={styles.subText}>{group.members.length} Members</Text></View>
                  </TouchableOpacity>
              </BlurView>
            ))}
          </View>
        )}

        {/* AVAILABLE AGENTS */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>AVAILABLE AGENTS</Text>
        {users.map((item) => {
          const isSelected = selectedUsers.includes(item.email);
          return (
             // 4. GLASSY CARDS
            <BlurView key={item.id} intensity={15} tint="dark" style={[styles.glassCardOuter, isSelected && styles.selectedGlass]}>
                <TouchableOpacity style={[styles.cardInner, {borderLeftColor: '#00f3ff'}]} onPress={() => handleUserPress(item)}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{(item.username ? item.username[0] : item.email[0]).toUpperCase()}</Text></View>
                <View style={styles.userInfo}><Text style={styles.nameText}>{item.username || item.email}</Text><Text style={styles.statusText}>● ONLINE</Text></View>
                {isGroupMode && (<View style={[styles.checkbox, isSelected && styles.checkedBox]}>{isSelected && <Text style={{color:'#000'}}>✓</Text>}</View>)}
                </TouchableOpacity>
            </BlurView>
          );
        })}

        <TouchableOpacity style={styles.logoutButton} onPress={() => auth.signOut()}>
          <Text style={styles.logoutText}>TERMINATE SESSION</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: '#121212', justifyContent:'center', alignItems:'center'},
  
  // NEW GLASS STYLES
  glassHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50, // More padding for top status bar
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  header: { color: '#bc13fe', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  groupToggle: { color: '#00f3ff', fontWeight: 'bold' },
  
  glassInputContainer: { flexDirection: 'row', padding: 15, margin: 15, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1, color: '#fff', padding: 10 },
  createButton: { backgroundColor: '#00f3ff', justifyContent: 'center', paddingHorizontal: 15, marginLeft: 10, borderRadius: 5 },
  createText: { color: '#000', fontWeight: 'bold' },

  sectionTitle: { color: '#aaa', fontSize: 12, marginBottom: 10, marginTop: 10, letterSpacing: 1, fontWeight: 'bold', marginLeft: 5 },

  // GLASS CARD STYLES
  glassCardOuter: {
    marginBottom: 10, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  cardInner: {
      flexDirection: 'row', alignItems: 'center', padding: 15,
      backgroundColor: 'rgba(255, 255, 255, 0.03)', // Very subtle fill
      borderLeftWidth: 4,
  },
  selectedGlass: { borderColor: '#39ff14', backgroundColor: 'rgba(57, 255, 20, 0.1)' },

  // Common Elements
  groupAvatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  groupAvatarText: { color: '#39ff14', fontWeight: 'bold', fontSize: 18 },
  nameText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subText: { color: '#aaa', fontSize: 12 },
  
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: '#bc13fe', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#bc13fe', fontSize: 18, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  statusText: { color: '#00f3ff', fontSize: 10, marginTop: 4 },
  
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#666', justifyContent: 'center', alignItems: 'center' },
  checkedBox: { backgroundColor: '#39ff14', borderColor: '#39ff14' },

  logoutButton: { marginTop: 30, marginBottom: 20, padding: 15, borderWidth: 1, borderColor: '#ff0055', borderRadius: 8, alignItems: 'center', marginHorizontal: 15 },
  logoutText: { color: '#ff0055', fontWeight: 'bold', letterSpacing: 1 }
});