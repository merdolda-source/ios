import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, Image, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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
  accent: '#7C4DFF',
  text: '#FFFFFF',
  gray: '#A0A0A0',
  error: '#FF3D00'
};

const Stack = createStackNavigator();

// --- LOGIN SCREEN ---
function LoginScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('user_creds');
      if (saved) navigation.replace('Dashboard');
    })();
  }, []);

  const handleLogin = async () => {
    if (!url || !username || !password) return Alert.alert('Hata', 'Tüm alanları doldurun.');
    setLoading(true);

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http')) cleanUrl = `http://${cleanUrl}`;
    if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);

    try {
      const api = `${cleanUrl}/player_api.php?username=${username}&password=${password}`;
      const response = await fetch(api);
      const data = await response.json();

      if (data.user_info && data.user_info.auth === 1) {
        await AsyncStorage.setItem('user_creds', JSON.stringify({ url: cleanUrl, username, password }));
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Hata', 'Giriş başarısız. Bilgileri kontrol edin.');
      }
    } catch (e) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı. URL\'yi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="play-circle" size={100} color={COLORS.primary} style={{alignSelf: 'center', marginBottom: 20}} />
      <Text style={styles.title}>EminXtream Pro</Text>
      <TextInput style={styles.input} placeholder="URL (http://...:8080)" placeholderTextColor={COLORS.gray} onChangeText={setUrl} value={url} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Kullanıcı Adı" placeholderTextColor={COLORS.gray} onChangeText={setUsername} value={username} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={COLORS.gray} onChangeText={setPassword} value={password} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>SİSTEME GİRİŞ YAP</Text>}
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
      <Text style={[styles.sectionTitle, {marginBottom: 20}]}>Ana Menü</Text>
      <View style={styles.grid}>
        {menu.map(item => (
          <TouchableOpacity key={item.id} style={styles.menuCard} onPress={() => navigation.navigate('List', { type: item.id, action: item.action, title: item.name })}>
            <Ionicons name={item.icon} size={45} color={COLORS.primary} />
            <Text style={styles.menuText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// --- CONTENT LIST ---
function ListScreen({ route, navigation }) {
  const { action, title, type } = route.params;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const credsData = await AsyncStorage.getItem('user_creds');
      const creds = JSON.parse(credsData);
      try {
        const response = await fetch(`${creds.url}/player_api.php?username=${creds.username}&password=${creds.password}&action=${action}`);
        const json = await response.json();
        setData(Array.isArray(json) ? json : []);
      } catch (e) { console.log(e); } finally { setLoading(false); }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={30} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} /> :
      <FlatList 
        data={data} 
        keyExtractor={(item) => (item.stream_id || item.series_id).toString()}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.listCard} onPress={() => navigation.navigate('Player', { item, type })}>
            <Image source={{ uri: item.stream_icon || item.last_modified_icon || 'https://via.placeholder.com/100' }} style={styles.listIcon} />
            <Text style={styles.listText} numberOfLines={2}>{item.name || item.title}</Text>
            <Ionicons name="play-circle-outline" size={32} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      />}
    </SafeAreaView>
  );
}

// --- PLAYER SCREEN (iPHONE SPECIAL FIX) ---
function PlayerScreen({ route, navigation }) {
  useKeepAwake();
  const { item, type } = route.params;
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const credsData = await AsyncStorage.getItem('user_creds');
      const creds = JSON.parse(credsData);
      const id = item.stream_id || item.series_id;
      
      // Senin link formatın için dinamik URL inşası
      let streamUrl = "";
      if (type === 'live') {
        const ext = Platform.OS === 'ios' ? 'm3u8' : 'ts';
        streamUrl = `${creds.url}/live/${creds.username}/${creds.password}/${id}.${ext}`;
      } else {
        // Dizi ve Filmler için mkv/mp4 kontrolü
        const ext = item.container_extension || 'mp4';
        streamUrl = `${creds.url}/${type}/${creds.username}/${creds.password}/${id}.${ext}`;
      }
      
      setUrl(streamUrl);
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close-circle" size={45} color="white" />
      </TouchableOpacity>

      {url && !error ? (
        <Video
          source={{ uri: url }}
          style={{ width: '100%', height: 300 }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onError={(e) => {
            console.log("Oynatma Hatası:", e);
            setError(true);
          }}
        />
      ) : <ActivityIndicator size="large" color={COLORS.primary} />}

      {error && (
        <View style={{padding: 20}}>
          <Text style={{color: 'red', textAlign: 'center', fontWeight: 'bold'}}>
            iPhone Hatası: Bu yayın formatı (MKV/TS) iOS ile uyumsuz olabilir.
          </Text>
          <Text style={{color: COLORS.gray, textAlign: 'center', marginTop: 10, fontSize: 12}}>
            iPhone Safari player motoru MKV dosyalarını doğrudan oynatamaz. Sunucunuzdan MP4 veya HLS çıkışı isteyin.
          </Text>
        </View>
      )}
      <Text style={styles.videoTitle}>{item.name}</Text>
    </View>
  );
}

// --- NAVİGASYON ---
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
  title: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: COLORS.card, color: '#fff', padding: 18, borderRadius: 15, marginBottom: 15 },
  button: { backgroundColor: COLORS.accent, padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuCard: { backgroundColor: COLORS.card, width: '48%', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 15 },
  menuText: { color: '#fff', marginTop: 15, fontWeight: 'bold' },
  sectionTitle: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginLeft: 15 },
  listCard: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 12, borderRadius: 15, marginBottom: 10, alignItems: 'center' },
  listIcon: { width: 55, height: 55, borderRadius: 10, marginRight: 15 },
  listText: { color: '#fff', flex: 1, fontSize: 16, fontWeight: '500' },
  videoTitle: { color: '#fff', textAlign: 'center', marginTop: 20, fontSize: 18 },
  closeBtn: { position: 'absolute', top: 40, right: 20, zIndex: 10 }
});
