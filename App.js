import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { auth } from './firebaseConfig';

import ChatScreen from './screens/ChatScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';

const Stack = createStackNavigator();

// Define our Custom Neon Theme for Navigation
const NeonTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#121212', // Deep Black
    card: '#1E1E1E',       // Dark Header
    text: '#00f3ff',       // Neon Blue Text
    border: '#333333',
  },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor: '#121212'}}>
        <ActivityIndicator size="large" color="#00f3ff" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NeonTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#121212', borderBottomWidth: 1, borderBottomColor: '#00f3ff' },
          headerTintColor: '#00f3ff', // Neon Blue Back Button/Title
          headerTitleStyle: { fontWeight: 'bold', textShadowColor: 'rgba(0, 243, 255, 0.7)', textShadowRadius: 10 },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="NeonChat" component={HomeScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}