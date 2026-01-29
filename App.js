import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { useKeepAwake } from 'expo-keep-awake';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#050710',
  card: '#111320',
  primary: '#00E5FF',
  accent: '#7C4DFF',
  text: '#FFF',
  gray: '#A0A0A0'
};

const Stack = createStackNavigator();

const safeJson = async (res) => {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return null; }
};

const normalizeUrl = (u) => {
  let clean = (u || '').trim();
  if (!clean) return '';
  if (!clean.startsWith('http')) clean = `http://${clean}`;
  // sondaki slash'ları kırp
  clean = clean.replace(/\/+$/, '');
  return clean;
};

// --- LOGIN ---
function LoginScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl || !username || !password) {
      return Alert.alert('Hata', 'Tüm alanları doldurun.');
    }

    setLoading(true);
    try {
      const api = `${cleanUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(api);
      const data = await safeJson(response);

      if (data?.user_info?.auth === 1) {
        await AsyncStorage.setItem('user_creds', JSON.stringify({ url: cleanUrl, username, password }));
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Hata', 'Giriş başarısız.');
      }
    } catch (e) {
      Alert.alert('Hata', 'Sunucu bağlantısı sağlanamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="tv-outline" size={80} color={COLORS.primary} style={{ alignSelf: 'center', marginBottom: 20 }} />
      <Text style={styles.title}>EminXtream Pro</Text>

      <TextInput
        style={styles.input}
        placeholder="URL (http://...)"
        placeholderTextColor={COLORS.gray}
        onChangeText={setUrl}
        value={url}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Kullanıcı"
        placeholderTextColor={COLORS.gray}
        onChangeText={setUsername}
        value={username}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Şifre"
        placeholderTextColor={COLORS.gray}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      />

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
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            onPress={() => navigation.navigate('List', { type: item.id, action: item.action, title: item.name })}
          >
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
      const credsRaw = await AsyncStorage.getItem('user_creds');
      const creds = JSON.parse(credsRaw || '{}');

      try {
        const api = `${creds.url}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&action=${encodeURIComponent(action)}`;
        const response = await fetch(api);
        const json = await safeJson(response);
        setData(Array.isArray(json) ? json : []);
      } catch (e) {
        console.log('LIST ERROR:', e);
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const keyExtractor = (item, index) => {
    const k = item?.stream_id ?? item?.series_id ?? item?.id ?? index;
    return String(k);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listCard}
              onPress={() =>
                type === 'series'
                  ? navigation.navigate('SeriesInfo', { item })
                  : navigation.navigate('Player', { item, type })
              }
            >
              <Image
                source={{ uri: item.stream_icon || item.last_modified_icon || 'https://via.placeholder.com/50' }}
                style={styles.listIcon}
              />
              <Text style={styles.listText} numberOfLines={1}>
                {item.name}
              </Text>
              <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        />
      )}
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
      const credsRaw = await AsyncStorage.getItem('user_creds');
      const creds = JSON.parse(credsRaw || '{}');

      try {
        const api = `${creds.url}/player_api.php?username=${encodeURIComponent(creds.username)}&password=${encodeURIComponent(creds.password)}&action=get_series_info&series_id=${encodeURIComponent(item.series_id)}`;
        const res = await fetch(api);
        const json = await safeJson(res);
        setInfo(json || null);
      } catch (e) {
        console.log('SERIES INFO ERROR:', e);
        setInfo(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const episodesObj = info?.episodes && typeof info.episodes === 'object' ? info.episodes : null;
  const seasons = episodesObj ? Object.keys(episodesObj) : [];

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : !episodesObj ? (
        <View style={{ padding: 10 }}>
          <Text style={{ color: 'white', textAlign: 'center' }}>
            Bölüm bilgisi alınamadı.
          </Text>
          <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>GERİ DÖN</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView>
          <Text style={[styles.title, { marginBottom: 15 }]}>{item.name}</Text>

          {seasons.map(season => (
            <View key={season} style={{ marginBottom: 20 }}>
              <Text style={{ color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                Sezon {season}
              </Text>

              {Array.isArray(episodesObj[season]) && episodesObj[season].map(ep => (
                <TouchableOpacity
                  key={String(ep.id ?? `${season}-${ep.episode_num}`)}
                  style={styles.listCard}
                  onPress={() => navigation.navigate('Player', { item: ep, type: 'series' })}
                >
                  <Text style={styles.listText} numberOfLines={1}>
                    Bölüm {ep.episode_num}: {ep.title}
                  </Text>
                  <Ionicons name="play-circle-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// --- PLAYER (iOS FIX: Fallback + Debug + Headers) ---
function PlayerScreen({ route, navigation }) {
  useKeepAwake();
  const { item, type } = route.params;

  const [candidates, setCandidates] = useState([]);
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState(false);
  const [lastErr, setLastErr] = useState(null);

  const buildUrls = (creds) => {
    const rawId = item?.stream_id ?? item?.id;
    const id = encodeURIComponent(String(rawId ?? ''));
    const path = type === 'series' ? 'series' : (type === 'live' ? 'live' : 'movie');

    const extFromApi = (item?.container_extension || 'mp4').toLowerCase();
    const preferIOS = Platform.OS === 'ios';

    const exts = [];

    // iOS AVPlayer uyumlu denemeler
    if (type === 'live') {
      if (preferIOS) exts.push('m3u8');
      exts.push(extFromApi, 'm3u8', 'ts', 'mp4');
    } else {
      if (preferIOS) exts.push('m3u8', 'mp4');
      exts.push(extFromApi, 'm3u8', 'mp4');
    }

    const uniqExts = [...new Set(exts)].filter(Boolean);

    const u = normalizeUrl(creds.url);
    const user = encodeURIComponent(creds.username || '');
    const pass = encodeURIComponent(creds.password || '');

    return uniqExts.map(ext => `${u}/${path}/${user}/${pass}/${id}.${ext}`);
  };

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('user_creds');
      const creds = JSON.parse(raw || '{}');

      const list = buildUrls(creds);
      console.log('🎬 PLAYER ITEM:', {
        type,
        id: item?.stream_id ?? item?.id,
        ext: item?.container_extension
      });
      console.log('🎯 CANDIDATE URLS:', list);

      setCandidates(list);
      setIdx(0);
      setReady(true);
      setFatal(false);
      setLastErr(null);
    })();
  }, []);

  const nextTry = (e) => {
    console.log('❌ VIDEO ERROR:', e);
    setLastErr(e);

    if (idx + 1 < candidates.length) {
      setIdx(prev => prev + 1);
      return;
    }
    setFatal(true);
  };

  const uri = candidates[idx];

  // Bazı paneller User-Agent ister -> açılma ihtimalini artırır
  const headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile'
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close-circle" size={45} color="white" />
      </TouchableOpacity>

      {!ready ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : fatal ? (
        <View style={{ padding: 20 }}>
          <Text style={{ color: 'red', textAlign: 'center', fontSize: 16, marginBottom: 10 }}>
            iOS bu içeriği oynatamadı.
          </Text>
          <Text style={{ color: '#aaa', fontSize: 12, textAlign: 'center' }}>
            Denenen link sayısı: {candidates.length}
          </Text>

          <Text style={{ color: '#aaa', fontSize: 12, marginTop: 10 }}>Son denen link:</Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>{uri}</Text>

          <Text style={{ color: '#aaa', fontSize: 12, marginTop: 10 }}>Son hata:</Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>{JSON.stringify(lastErr)}</Text>
        </View>
      ) : (
        <Video
          source={{ uri, headers }}     // headers istemezsen: source={{ uri }}
          style={{ width: '100%', height: 320 }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onError={nextTry}
        />
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
