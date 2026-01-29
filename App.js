import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, Image, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';

const COLORS = { bg: '#050710', card: '#111320', primary: '#00E5FF', accent: '#7C4DFF', text: '#FFF', gray: '#A0A0A0' };
const Stack = createStackNavigator();

// --- LOGIN ---
function LoginScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!url || !username || !password) return Alert.alert('Hata', 'Bilgileri girin.');
    setLoading(true);
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = `http://${cleanUrl}`;
    try {
      const response = await fetch(`${cleanUrl}/player_api.php?username=${username}&password=${password}`);
      const data = await response.json();
      if (data.user_info?.auth === 1) {
        await AsyncStorage.setItem('user_creds', JSON.stringify({ url: cleanUrl, username, password }));
        navigation.replace('Dashboard');
      } else { Alert.alert('Hata', 'Giriş başarısız.'); }
    } catch (e) { Alert.alert('Hata', 'Bağlantı sorunu.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>EminXtream Pro</Text>
      <TextInput style={styles.input} placeholder="Sunucu URL" placeholderTextColor={COLORS.gray} onChangeText={setUrl} value={url} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Kullanıcı Adı" placeholderTextColor={COLORS.gray} onChangeText={setUsername} value={username} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={COLORS.gray} onChangeText={setPassword} value={password} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'GİRİLİYOR...' : 'GİRİŞ YAP'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- DASHBOARD ---
function Dashboard({ navigation }) {
  const menu = [
    { id: 'live', name: 'CANLI TV', icon: 'tv', action: 'get_live_streams' },
    { id: 'movie', name: 'FİLMLER', icon: 'film', action: 'get_vod_streams' },
    { id: 'series', name: 'DİZİLER', icon: 'library', action: 'get_series' }
  ];
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.grid}>
        {menu.map(item => (
          <TouchableOpacity key={item.id} style={styles.menuCard} onPress={() => navigation.navigate('List', { type: item.id, action: item.action, title: item.name })}>
            <Ionicons name={item.icon} size={40} color={COLORS.primary} />
            <Text style={styles.menuText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// --- LIST ---
function ListScreen({ route, navigation }) {
  const { action, title, type } = route.params;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const creds = JSON.parse(await AsyncStorage.getItem('user_creds'));
      try {
        const response = await fetch(`${creds.url}/player_api.php?username=${creds.username}&password=${creds.password}&action=${action}`);
        const json = await response.json();
        setData(Array.isArray(json) ? json : []);
      } catch (e) { console.log(e); } finally { setLoading(false); }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList 
        data={data} 
        keyExtractor={(item) => (item.stream_id || item.series_id).toString()}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.listCard} onPress={() => navigation.navigate('Player', { item, type })}>
            <Image source={{ uri: item.stream_icon || 'https://via.placeholder.com/50' }} style={styles.listIcon} />
            <Text style={styles.listText} numberOfLines={1}>{item.name}</Text>
            <Ionicons name="play" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

// --- PLAYER (iOS .mkv & .mp4 Fix) ---
function PlayerScreen({ route, navigation }) {
  useKeepAwake();
  const { item, type } = route.params;
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const creds = JSON.parse(await AsyncStorage.getItem('user_creds'));
      const id = item.stream_id || item.series_id;
      
      // Senin verdiğin örnek formata göre URL inşası
      let finalUrl = "";
      if (type === 'live') {
        const ext = Platform.OS === 'ios' ? 'm3u8' : 'ts';
        finalUrl = `${creds.url}/live/${creds.username}/${creds.password}/${id}.${ext}`;
      } else {
        // Dizi ve Filmler için senin verdiğin .mkv veya .mp4 uzantısını kullanıyoruz
        const ext = item.container_extension || 'mkv'; 
        finalUrl = `${creds.url}/${type}/${creds.username}/${creds.password}/${id}.${ext}`;
      }
      
      console.log("Oynatılan URL:", finalUrl);
      setUrl(finalUrl);
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={40} color="white" />
      </TouchableOpacity>

      {url && !error ? (
        <Video
          source={{ uri: url }}
          style={{ width: '100%', height: 300 }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onError={(e) => {
            console.log("Video Hatası:", e);
            setError(true);
          }}
        />
      ) : <ActivityIndicator size="large" color={COLORS.primary} />}

      {error && (
        <View style={{padding: 20}}>
          <Text style={{color: 'red', textAlign: 'center'}}>
            iPhone bu formatı (.mkv) doğrudan oynatamıyor olabilir.
            Lütfen sunucudan .mp4 veya HLS çıkışı isteyin.
          </Text>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="List" component={ListScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: COLORS.card, color: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  button: { backgroundColor: COLORS.accent, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 50 },
  menuCard: { backgroundColor: COLORS.card, width: '48%', padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  menuText: { color: '#fff', marginTop: 10, fontWeight: 'bold' },
  listCard: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 10, borderRadius: 10, marginBottom: 5, alignItems: 'center' },
  listIcon: { width: 40, height: 40, borderRadius: 5, marginRight: 10 },
  listText: { color: '#fff', flex: 1 },
  closeBtn: { position: 'absolute', top: 40, right: 20, zIndex: 10 }
});
