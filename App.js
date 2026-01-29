import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';

// --- RENK PALETİ ---
const COLORS = {
  bg: '#050710',
  card: '#111320',
  primary: '#00E5FF',
  purple: '#7C4DFF',
  text: '#FFFFFF',
  gray: '#888'
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- 1. LOGIN SCREEN ---
function LoginScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const savedUser = await AsyncStorage.getItem('user_creds');
    if (savedUser) navigation.replace('Main');
  };

  const handleLogin = async () => {
    if (!url || !username || !password) return Alert.alert('Hata', 'Tüm alanları doldurun.');
    setLoading(true);

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = `http://${cleanUrl}`;
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

    const api = `${cleanUrl}/player_api.php?username=${username}&password=${password}`;

    try {
      const response = await fetch(api);
      const data = await response.json();

      if (data.user_info && data.user_info.auth === 1) {
        await AsyncStorage.setItem('user_creds', JSON.stringify({ url: cleanUrl, username, password }));
        navigation.replace('Main');
      } else {
        Alert.alert('Hata', 'Giriş başarısız. Bilgileri kontrol edin.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EminXtream Pro</Text>
      <TextInput style={styles.input} placeholder="Sunucu URL" placeholderTextColor="#666" onChangeText={setUrl} value={url} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Kullanıcı Adı" placeholderTextColor="#666" onChangeText={setUsername} value={username} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor="#666" onChangeText={setPassword} value={password} secureTextEntry />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>GİRİŞ YAP</Text>}
      </TouchableOpacity>
    </View>
  );
}

// --- 2. LIVE TV SCREEN ---
function LiveTVScreen({ navigation }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const credsData = await AsyncStorage.getItem('user_creds');
      if (!credsData) return;
      const creds = JSON.parse(credsData);
      
      const api = `${creds.url}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_live_streams`;
      
      const response = await fetch(api);
      const data = await response.json();
      setChannels(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Kanal çekme hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('Player', { stream: item, type: 'live' })}
    >
      <Image 
        source={{ uri: item.stream_icon || 'https://via.placeholder.com/50' }} 
        style={styles.icon} 
        resizeMode="contain"
      />
      <View style={{flex: 1}}>
        <Text style={styles.cardText} numberOfLines={1}>{item.name}</Text>
        <Text style={{color: COLORS.gray, fontSize: 12}}>ID: {item.stream_id}</Text>
      </View>
      <Ionicons name="play-circle" size={24} color={COLORS.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} /> :
      <FlatList 
        data={channels} 
        keyExtractor={(item) => item.stream_id.toString()} 
        renderItem={renderItem}
        initialNumToRender={15}
      />}
    </View>
  );
}

// --- 3. PLAYER SCREEN ---
function PlayerScreen({ route, navigation }) {
  useKeepAwake();
  const { stream, type } = route.params;
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);
  const video = React.useRef(null);

  useEffect(() => {
    prepareUrl();
  }, []);

  const prepareUrl = async () => {
    const credsData = await AsyncStorage.getItem('user_creds');
    const creds = JSON.parse(credsData);
    
    // iOS için m3u8 formatı genellikle daha kararlıdır
    const ext = Platform.OS === 'ios' ? 'm3u8' : 'ts';
    const path = type === 'live' ? 'live' : 'movie';
    const streamUrl = `${creds.url}/${path}/${creds.username}/${creds.password}/${stream.stream_id}.${ext}`;
    
    setUrl(streamUrl);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center' }}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close-circle" size={40} color="white" />
      </TouchableOpacity>
      
      {url ? (
        <Video
          ref={video}
          style={{ width: '100%', height: 280 }}
          source={{ uri: url }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onError={(e) => {
            console.log("Video Hatası:", e);
            setError(true);
          }}
        />
      ) : <ActivityIndicator color={COLORS.primary} />}

      {error && (
        <Text style={{color: 'red', textAlign: 'center', marginTop: 10}}>
          Yayın şu an iPhone'da oynatılamıyor. Format uyumsuz olabilir.
        </Text>
      )}
      
      <Text style={{color:'white', textAlign:'center', marginTop: 20, fontSize: 18, fontWeight: 'bold'}}>
        {stream.name}
      </Text>
    </View>
  );
}

// --- NAVIGASYON ---
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: COLORS.card, borderTopWidth: 0 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        headerStyle: { backgroundColor: COLORS.bg },
        headerTintColor: COLORS.text,
      }}
    >
      <Tab.Screen name="Canlı TV" component={LiveTVScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="tv" size={24} color={color} /> }} />
      <Tab.Screen name="Ayarlar" component={LoginScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="settings" size={24} color={color} /> }} /> 
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Player" component={PlayerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 15, paddingTop: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: COLORS.card, color: 'white', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  button: { backgroundColor: COLORS.purple, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: COLORS.purple, shadowOpacity: 0.5, shadowRadius: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  card: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 12, marginBottom: 8, borderRadius: 12, alignItems: 'center' },
  icon: { width: 50, height: 50, marginRight: 15, borderRadius: 8 },
  cardText: { color: 'white', fontSize: 16, fontWeight: '500' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 }
});
