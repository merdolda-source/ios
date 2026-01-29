import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, Image, ActivityIndicator, Platform, SafeAreaView, ScrollView } from 'react-native';
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
    if (!url || !username || !password) return Alert.alert('Hata', 'Tüm alanları doldurun.');
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
    } catch (e) { Alert.alert('Hata', 'Sunucu bağlantısı sağlanamadı.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="tv-outline" size={80} color={COLORS.primary} style={{alignSelf: 'center', marginBottom: 20}} />
      <Text style={styles.title}>EminXtream Pro</Text>
      <TextInput style={styles.input} placeholder="URL" placeholderTextColor={COLORS.gray} onChangeText={setUrl} value={url} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Kullanıcı" placeholderTextColor={COLORS.gray} onChangeText={setUsername} value={username} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={COLORS.gray} onChangeText={setPassword} value={password} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'BAĞLANILIYOR...' : 'GİRİŞ YAP'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- DASHBOARD ---
function Dashboard({ navigation }) {
  const menu = [
    { id: 'live', name: 'CANLI TV', icon: 'radio-outline', action: 'get_live_streams' },
    { id: 'movie', name: 'FİLMLER', icon: 'film-outline', action: 'get_vod_streams' },
    { id: 'series', name: 'DİZİLER', icon: 'library-outline', action: 'get_series' }
  ];
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sectionTitle}>İçerik Türü Seçin</Text>
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

// --- LIST SCREEN ---
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
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={30} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> :
      <FlatList 
        data={data} 
        keyExtractor={(item) => (item.stream_id || item.series_id).toString()}
        renderItem={({item}) => (
          <TouchableOpacity 
            style={styles.listCard} 
            onPress={() => type === 'series' ? navigation.navigate('SeriesInfo', { item }) : navigation.navigate('Player', { item, type })}
          >
            <Image source={{ uri: item.stream_icon || item.last_modified_icon || 'https://via.placeholder.com/50' }} style={styles.listIcon} />
            <Text style={styles.listText} numberOfLines={1}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      />}
    </SafeAreaView>
  );
}

// --- SERIES INFO ---
function SeriesInfoScreen({ route, navigation }) {
  const { item } = route.params;
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const creds = JSON.parse(await AsyncStorage.getItem('user_creds'));
      try {
        const res = await fetch(`${creds.url}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_series_info&series_id=${item.series_id}`);
        const json = await res.json();
        setInfo(json);
      } catch (e) { console.log(e); } finally { setLoading(false); }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> :
      <ScrollView>
        <Text style={styles.title}>{item.name}</Text>
        {Object.keys(info.episodes).map(season => (
          <View key={season} style={{marginBottom: 20}}>
            <Text style={{color: COLORS.primary, fontSize: 18, fontWeight: 'bold'}}>Sezon {season}</Text>
            {info.episodes[season].map(ep => (
              <TouchableOpacity key={ep.id} style={styles.listCard} onPress={() => navigation.navigate('Player', { item: ep, type: 'series' })}>
                <Text style={styles.listText}>Bölüm {ep.episode_num}: {ep.title}</Text>
                <Ionicons name="play-circle-outline" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>}
    </SafeAreaView>
  );
}

// --- PLAYER (HLS & Multi-Format) ---
function PlayerScreen({ route, navigation }) {
  useKeepAwake();
  const { item, type } = route.params;
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const creds = JSON.parse(await AsyncStorage.getItem('user_creds'));
      const id = item.stream_id || item.id;
      let path = type === 'series' ? 'series' : (type === 'live' ? 'live' : 'movie');
      
      // iPHONE FIX: Canlıda m3u8, VOD'da orijinal format
      let ext = item.container_extension || 'mp4';
      if (type === 'live' && Platform.OS === 'ios') ext = 'm3u8';
      
      setUrl(`${creds.url}/${path}/${creds.username}/${creds.password}/${id}.${ext}`);
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}><Ionicons name="close-circle" size={45} color="white" /></TouchableOpacity>
      {url && !error ? (
        <Video source={{ uri: url }} style={{ width: '100%', height: 300 }} useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay onError={() => setError(true)} />
      ) : <ActivityIndicator size="large" color={COLORS.primary} />}
      {error && <Text style={{color: 'red', textAlign: 'center'}}>Format Hatası: Bu içerik iPhone motoruyla uyumsuz.</Text>}
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
        <Stack.Screen name="SeriesInfo" component={SeriesInfoScreen} />
        <Stack.Screen name="Player" component={PlayerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20, paddingTop: 50 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: COLORS.card, color: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
  button: { backgroundColor: COLORS.accent, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 30 },
  menuCard: { backgroundColor: COLORS.card, width: '48%', padding: 25, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  menuText: { color: '#fff', marginTop: 10, fontWeight: 'bold' },
  sectionTitle: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  listCard: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 12, borderRadius: 15, marginBottom: 8, alignItems: 'center' },
  listIcon: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  listText: { color: '#fff', flex: 1 },
  closeBtn: { position: 'absolute', top: 40, right: 20, zIndex: 10 }
});
