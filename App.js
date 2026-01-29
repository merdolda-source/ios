import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Alert, Image, ActivityIndicator, Platform, SafeAreaView, ScrollView } from 'react-native';
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

// --- 1. LOGIN SCREEN ---
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
        Alert.alert('Hata', 'Giriş başarısız.');
      }
    } catch (e) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="play-circle" size={100} color={COLORS.primary} style={{alignSelf: 'center', marginBottom: 20}} />
      <Text style={styles.title}>EminXtream Pro</Text>
      <TextInput style={styles.input} placeholder="Sunucu URL" placeholderTextColor={COLORS.gray} onChangeText={setUrl} value={url} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Kullanıcı Adı" placeholderTextColor={COLORS.gray} onChangeText={setUsername} value={username} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={COLORS.gray} onChangeText={setPassword} value={password} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>SİSTEME GİRİŞ YAP</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- 2. DASHBOARD ---
function Dashboard({ navigation }) {
  const menu = [
    { id: 'live', name: 'CANLI TV', icon: 'tv', action: 'get_live_streams' },
    { id: 'movie', name: 'FİLMLER', icon: 'film', action: 'get_vod_streams' },
    { id: 'series', name: 'DİZİLER', icon: 'library', action: 'get_series' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={[styles.sectionTitle, {marginBottom: 20}]}>Kategoriler</Text>
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

// --- 3. LIST SCREEN (Canlı, Film ve Diziler) ---
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
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} /> :
      <FlatList 
        data={data} 
        keyExtractor={(item) => (item.stream_id || item.series_id).toString()}
        renderItem={({item}) => (
          <TouchableOpacity 
            style={styles.listCard} 
            onPress={() => {
              if (type === 'series') navigation.navigate('SeriesInfo', { item });
              else navigation.navigate('Player', { item, type });
            }}
          >
            <Image source={{ uri: item.stream_icon || item.last_modified_icon || 'https://via.placeholder.com/100' }} style={styles.listIcon} />
            <Text style={styles.listText} numberOfLines={2}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      />}
    </SafeAreaView>
  );
}

// --- 4. SERIES INFO SCREEN (Dizi Bölümleri) ---
function SeriesInfoScreen({ route, navigation }) {
  const { item } = route.params;
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const creds = JSON.parse(await AsyncStorage.getItem('user_creds'));
      try {
        const response = await fetch(`${creds.url}/player_api.php?username=${creds.username}&password=${creds.password}&action=get_series_info&series_id=${item.series_id}`);
        const json = await response.json();
        setInfo(json);
      } catch (e) { console.log(e); } finally { setLoading(false); }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={30} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{item.name}</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> :
      <ScrollView>
        {Object.keys(info.episodes).map(season => (
          <View key={season} style={{marginBottom: 20}}>
            <Text style={{color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>Sezon {season}</Text>
            {info.episodes[season].map(episode => (
              <TouchableOpacity 
                key={episode.id} 
                style={styles.listCard} 
                onPress={() => navigation.navigate('Player', { item: episode, type: 'series' })}
              >
                <Text style={styles.listText}>Bölüm {episode.episode_num}: {episode.title}</Text>
                <Ionicons name="play-circle" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>}
    </SafeAreaView>
  );
}

// --- 5. PLAYER SCREEN (iOS & Format Fix) ---
function PlayerScreen({ route, navigation }) {
  useKeepAwake();
  const { item, type } = route.params;
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      const creds = JSON.parse(await AsyncStorage.getItem('user_creds'));
      const id = item.stream_id || item.id;
      
      let finalUrl = "";
      if (type === 'live') {
        // Canlı TV için iPhone'da m3u8 şart
        const ext = Platform.OS === 'ios' ? 'm3u8' : 'ts';
        finalUrl = `${creds.url}/live/${creds.username}/${creds.password}/${id}.${ext}`;
      } else {
        // Dizi ve Film için senin verdiğin .mkv / .mp4 / .ts formatlarını destekliyoruz
        let path = type === 'series' ? 'series' : 'movie';
        let ext = item.container_extension || 'mp4';
        finalUrl = `${creds.url}/${path}/${creds.username}/${creds.password}/${id}.${ext}`;
      }
      
      console.log("Denenen URL:", finalUrl);
      setUrl(finalUrl);
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
            console.log("Hata:", e);
            setError(true);
          }}
        />
      ) : <ActivityIndicator size="large" color={COLORS.primary} />}

      {error && (
        <View style={{padding: 20}}>
          <Text style={{color: 'red', textAlign: 'center', fontWeight: 'bold'}}>
            iPhone Hatası: Bu yayın formatı (MKV/TS) iOS Safari motoruyla uyumsuz.
          </Text>
          <Text style={{color: COLORS.gray, textAlign: 'center', marginTop: 10}}>
            Lütfen sunucu panelinden MP4 veya HLS çıkışı alın.
          </Text>
        </View>
      )}
    </View>
  );
}

// --- NAVIGATION ---
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
  title: { fontSize: 36, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: COLORS.card, color: '#fff', padding: 18, borderRadius: 15, marginBottom: 15 },
  button: { backgroundColor: COLORS.accent, padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuCard: { backgroundColor: COLORS.card, width: '48%', padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 15 },
  menuText: { color: '#fff', marginTop: 15, fontWeight: 'bold' },
  sectionTitle: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15, flex: 1 },
  listCard: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 12, borderRadius: 15, marginBottom: 10, alignItems: 'center' },
  listIcon: { width: 50, height: 50, borderRadius: 10, marginRight: 15 },
  listText: { color: '#fff', flex: 1, fontSize: 16 },
  closeBtn: { position: 'absolute', top: 40, right: 20, zIndex: 10 }
});
