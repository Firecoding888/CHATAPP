import { useNavigation } from '@react-navigation/native';
import { collection, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, database } from '../firebaseConfig';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [myGroups, setMyGroups] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');

  const currentUserEmail = auth.currentUser?.email;

  useEffect(() => {
    // 1. Fetch Users
    const usersRef = collection(database, 'users');
    const unsubUsers = onSnapshot(usersRef, (querySnapshot) => {
      const usersList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.email !== currentUserEmail) {
          usersList.push({ id: doc.id, ...userData });
        }
      });
      setUsers(usersList);
    });

    // 2. Fetch My Groups
    const groupsRef = collection(database, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', currentUserEmail));
    
    const unsubGroups = onSnapshot(q, (querySnapshot) => {
      const groupsList = [];
      querySnapshot.forEach((doc) => {
        groupsList.push({ id: doc.id, ...doc.data() });
      });
      setMyGroups(groupsList);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubGroups();
    };
  }, []);

  const handleUserPress = (user) => {
    if (isGroupMode) {
      if (selectedUsers.includes(user.email)) {
        setSelectedUsers(selectedUsers.filter(email => email !== user.email));
      } else {
        setSelectedUsers([...selectedUsers, user.email]);
      }
    } else {
      navigation.navigate('Chat', { 
        chatId: [currentUserEmail.toLowerCase(), user.email.toLowerCase()].sort().join('_'),
        chatName: user.username || user.email 
      });
    }
  };

  const createGroup = async () => {
    if (!groupName || selectedUsers.length === 0) {
      Alert.alert("Error", "Enter a name and select at least 1 user.");
      return;
    }

    const newGroupId = `GROUP_${Math.random().toString(36).substring(7)}`;
    const membersList = [...selectedUsers, currentUserEmail]; 

    try {
      await setDoc(doc(database, 'groups', newGroupId), {
        groupId: newGroupId,
        name: groupName,
        members: membersList,
        createdAt: new Date(),
        createdBy: currentUserEmail
      });

      navigation.navigate('Chat', { 
        chatId: newGroupId, 
        chatName: groupName
      });
      
      setIsGroupMode(false);
      setSelectedUsers([]);
      setGroupName('');
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  if (loading) {
    return (
       <View style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
          <ActivityIndicator size="large" color="#00f3ff"/>
       </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>NEON NETWORK</Text>
        <TouchableOpacity onPress={() => setIsGroupMode(!isGroupMode)}>
          <Text style={styles.groupToggle}>{isGroupMode ? 'CANCEL' : '+ NEW GROUP'}</Text>
        </TouchableOpacity>
      </View>

      {isGroupMode && (
        <View style={styles.groupInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="ENTER GROUP NAME..."
            placeholderTextColor="#666"
            value={groupName}
            onChangeText={setGroupName}
          />
          <TouchableOpacity style={styles.createButton} onPress={createGroup}>
            <Text style={styles.createText}>CREATE</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* MY GROUPS */}
        {myGroups.length > 0 && !isGroupMode && (
          <View>
            <Text style={styles.sectionTitle}>MY SQUADS</Text>
            {myGroups.map((group) => (
              <TouchableOpacity 
                key={group.id}
                style={styles.groupCard}
                onPress={() => navigation.navigate('Chat', { chatId: group.id, chatName: group.name })}
              >
                <View style={styles.groupAvatar}>
                  <Text style={styles.groupAvatarText}>{group.name[0].toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.groupNameText}>{group.name}</Text>
                  <Text style={styles.groupMembersText}>{group.members.length} Members</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* AVAILABLE AGENTS */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>AVAILABLE AGENTS</Text>
        {users.map((item) => {
          const isSelected = selectedUsers.includes(item.email);
          return (
            <TouchableOpacity 
              key={item.id}
              style={[styles.userCard, isSelected && styles.selectedCard]} 
              onPress={() => handleUserPress(item)}
            >
              <View style={styles.avatar}>
                 <Text style={styles.avatarText}>
                   {(item.username ? item.username[0] : item.email[0]).toUpperCase()}
                 </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.usernameText}>
                  {item.username || item.email} 
                </Text>
                <Text style={styles.statusText}>● ONLINE</Text>
              </View>
              
              {isGroupMode && (
                <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
                  {isSelected && <Text style={{color:'#000'}}>✓</Text>}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* --- TERMINATE SESSION BUTTON --- */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => auth.signOut()}>
          <Text style={styles.logoutText}>TERMINATE SESSION</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 15 },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  header: { color: '#bc13fe', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  groupToggle: { color: '#00f3ff', fontWeight: 'bold' },
  sectionTitle: { color: '#666', fontSize: 12, marginBottom: 10, letterSpacing: 1, fontWeight: 'bold' },
  
  groupInputContainer: { flexDirection: 'row', marginBottom: 15 },
  input: { flex: 1, backgroundColor: '#1E1E1E', color: '#fff', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#333' },
  createButton: { backgroundColor: '#00f3ff', justifyContent: 'center', paddingHorizontal: 15, marginLeft: 10, borderRadius: 5 },
  createText: { color: '#000', fontWeight: 'bold' },

  groupCard: { 
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 15,
    backgroundColor: '#1E1E1E', borderRadius: 8,
    borderLeftWidth: 4, borderLeftColor: '#39ff14', 
  },
  groupAvatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  groupAvatarText: { color: '#39ff14', fontWeight: 'bold', fontSize: 18 },
  groupNameText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  groupMembersText: { color: '#666', fontSize: 12 },

  userCard: { 
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 15,
    backgroundColor: '#1E1E1E', borderRadius: 8,
    borderLeftWidth: 4, borderLeftColor: '#00f3ff', 
  },
  selectedCard: { backgroundColor: '#2a2a2a', borderColor: '#39ff14', borderWidth: 1 },
  
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 15, backgroundColor: '#121212', borderWidth: 1, borderColor: '#bc13fe', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#bc13fe', fontSize: 18, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  usernameText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statusText: { color: '#00f3ff', fontSize: 10, marginTop: 4 },
  
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#666', justifyContent: 'center', alignItems: 'center' },
  checkedBox: { backgroundColor: '#39ff14', borderColor: '#39ff14' },

  // LOGOUT BUTTON STYLES
  logoutButton: { 
    marginTop: 30, 
    marginBottom: 20, 
    padding: 15, 
    borderWidth: 1, 
    borderColor: '#ff0055', 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  logoutText: { color: '#ff0055', fontWeight: 'bold', letterSpacing: 1 }
});