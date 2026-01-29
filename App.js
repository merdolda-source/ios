import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, Image, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';

// --- TEMA VE RENKLER ---
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
const Tab = createBottomTabNavigator();

// --- YARDIMCI FONKSİYON: URL TEMİZLEME ---
const getCleanUrl = (url) => {
  let clean = url.trim();
  if (!clean.startsWith('http')) clean = `http://${clean}`;
  if (clean.endsWith('/')) clean = clean.slice(0, -1);
  return clean;
};

// --- 1. LOGIN SCREEN ---
function LoginScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('user_creds');
      if (saved) navigation.replace('Main');
    })();
  }, []);

  const handleLogin = async () => {
    if (!url || !username || !password) return Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
    setLoading(true);
    const cleanUrl = getCleanUrl(url);

    try {
      const response = await fetch(`${cleanUrl}/player_api.php?username=${username}&password=${password}`);
      const data = await response.json();

      if (data.user_info && data.user_info.auth === 1) {
        await AsyncStorage.setItem('user_creds', JSON.stringify({ url: cleanUrl, username, password }));
        navigation.replace('Main');
      } else {
        Alert.alert('Giriş Başarısız', 'Kullanıcı adı veya şifre hatalı.');
      }
    } catch (e) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı. URL\'yi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="play-circle" size={80} color={COLORS.primary} style={{ alignSelf: 'center', marginBottom: 20 }} />
      <Text style={styles.title}>EminXtream Pro</Text>
      <TextInput style={styles.input} placeholder="Sunucu URL (http://...)" placeholderTextColor={COLORS.gray} onChangeText={setUrl} value={url} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Kullanıcı Adı" placeholderTextColor={COLORS.gray} onChangeText={setUsername} value={username} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={COLORS.gray} onChangeText={setPassword} value={password} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>GİRİŞ YAP</Text>}
      </TouchableOpacity>
    </View>
  );
}

// --- 2. DASHBOARD (ANA MENÜ) ---
function Dashboard({ navigation }) {
  const menuItems = [
    { id: 'live', name: 'CANLI TV', icon: 'tv', action: 'get_live_streams' },
    { id: 'movie', name: 'FİLMLER', icon: 'film', action: 'get_vod_streams' },
    { id: 'series', name: 'DİZİLER', icon: 'library', action: 'get_series' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Hoş Geldiniz</Text>
      <View style={styles.grid}>
        {menuItems.map(item => (
          <TouchableOpacity key={item.id} style={styles.menuCard} onPress={() => navigation.navigate('ContentList', { type: item.id, action: item.action, title: item.name })}>
            <Ionicons name={item.icon} size={40} color={COLORS.primary} />
            <Text style={styles.menuText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await AsyncStorage.clear(); navigation.replace('Login'); }}>
        <Text style={{ color: COLORS.error }}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- 3. İÇERİK LİSTESİ ---
function ContentList({ route, navigation }) {
  const { type, action, title } = route.params;
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
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} /> :
        <FlatList
          data={data}
          keyExtractor={(item) => (item.stream_id || item.series_id).toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listCard} onPress={() => navigation.navigate('Player', { item, type })}>
              <Image source={{ uri: item.stream_icon || item.last_modified_icon || 'https://via.placeholder.com/100' }} style={styles.listIcon} />
              <Text style={styles.listText} numberOfLines={2}>{item.name}</Text>
              <Ionicons name="play-circle-outline" size={30} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        />
      }
    </View>
  );
}

// --- 4. PLAYER SCREEN (İPHONE OYNATMA ÇÖZÜMÜ) ---
function PlayerScreen({ route, navigation }) {
  useKeepAwake();
  const { item, type } = route.params;
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const creds = JSON.parse(await AsyncStorage.getItem('user_creds'));
      const id = item.stream_id || item.series_id;
      
      // iPHONE ÇÖZÜMÜ: Sadece uzantı değil, output=m3u8 parametresi eklenir.
      // Xtream server'larda HLS (m3u8) iPhone için en güvenli yoldur.
      let streamUrl = "";
      if (Platform.OS === 'ios') {
        streamUrl = `${creds.url}/live/${creds.username}/${creds.password}/${id}.m3u8`;
      } else {
        streamUrl = `${creds.url}/live/${creds.username}/${creds.password}/${id}.ts`;
      }
      
      // Eğer film ise formatı mp4 veya mkv olarak ayarla
      if (type === 'movie') {
        streamUrl = `${creds.url}/movie/${creds.username}/${creds.password}/${id}.mp4`;
      }

      console.log("Oynatılan URL:", streamUrl);
      setUrl(streamUrl);
    })();
  }, []);

  return (
    <View style={styles.playerContainer}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={35} color="white" />
      </TouchableOpacity>

      {url ? (
        <Video
          source={{ uri: url }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onError={(e) => { console.log(e); setError(true); }}
        />
      ) : <ActivityIndicator size="large" color={COLORS.primary} />}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Yayın iPhone formatıyla uyumsuz (HLS/M3U8 desteği yok).</Text>
          <Text style={{color: COLORS.gray, marginTop: 10, textAlign: 'center'}}>Lütfen sunucu ayarlarınızdan HLS çıkışını aktif edin.</Text>
        </View>
      )}
      <Text style={styles.videoTitle}>{item.name}</Text>
    </View>
  );
}

// --- NAVİGASYON YAPISI ---
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="ContentList" component={ContentList} />
      <Stack.Screen name="Player" component={PlayerScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- STİLLER ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20, paddingTop: 60 },
  playerContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: COLORS.card, color: '#fff', padding: 18, borderRadius: 15, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: COLORS.accent, padding: 18, borderRadius: 15, alignItems: 'center', shadowColor: COLORS.accent, shadowOpacity: 0.4, shadowRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 },
  menuCard: { backgroundColor: COLORS.card, width: '48%', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 15 },
  menuText: { color: '#fff', marginTop: 15, fontWeight: '600', fontSize: 14 },
  sectionTitle: { color: COLORS.primary, fontSize: 22, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  listCard: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 12, borderRadius: 15, marginBottom: 10, alignItems: 'center' },
  listIcon: { width: 60, height: 60, borderRadius: 10, marginRight: 15 },
  listText: { color: '#fff', flex: 1, fontSize: 16, fontWeight: '500' },
  video: { width: '100%', height: 300 },
  videoTitle: { color: '#fff', textAlign: 'center', marginTop: 20, fontSize: 18, paddingHorizontal: 20 },
  backBtn: { position: 'absolute', top: 50, right: 25, zIndex: 10 },
  errorBox: { padding: 30, alignItems: 'center' },
  errorText: { color: COLORS.error, textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { marginTop: 'auto', alignSelf: 'center', padding: 10 }
});
