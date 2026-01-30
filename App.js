import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  TextInput,
  TouchableOpacity
} from 'react-native';
import remoteConfig from '@react-native-firebase/remote-config';

const COLORS = {
  bg: '#000000',
  card: '#1C1C1E',
  border: '#2C2C2E',
  gold: '#FFD60A',
  green: '#32D74B',
  red: '#FF453A',
  text: '#FFFFFF',
  muted: '#8E8E93'
};

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const initRemoteConfig = async () => {
      try {
        // iOS için anlık veri çekme ayarı
        await remoteConfig().setConfigSettings({ minimumFetchIntervalMillis: 0 });
        // Varsayılan linki tanımlıyoruz
        await remoteConfig().setDefaults({ json_url: 'https://imdatgel.site/harem/piyasa_cache.json' });
        
        await remoteConfig().fetchAndActivate();
        const url = remoteConfig().getValue('json_url').asString();
        loadData(url);
      } catch (e) {
        loadData('https://imdatgel.site/harem/piyasa_cache.json');
      }
    };

    initRemoteConfig();
    const interval = setInterval(() => initRemoteConfig(), 60000); // Dakikada bir kontrol
    return () => clearInterval(interval);
  }, []);

  const loadData = async (url) => {
    try {
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.log("Hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.symbol}>{item.k.replace('_', ' ')}</Text>
        <Text style={styles.time}>{item.t.split(' ')[1]}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>{parseFloat(item.s).toFixed(2)} ₺</Text>
        <View style={styles.buyBadge}>
          <Text style={styles.buyText}>Alış: {parseFloat(item.a).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Piyasa Pro</Text>
          <Text style={styles.subTitle}>iOS Live Terminal</Text>
        </View>
        <TouchableOpacity style={styles.statusBox} onPress={() => {setLoading(true); loadData('https://imdatgel.site/harem/piyasa_cache.json');}}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>CANLI</Text>
        </TouchableOpacity>
      </View>

      <TextInput 
        style={styles.search}
        placeholder="Sembol filtrele..."
        placeholderTextColor={COLORS.muted}
        onChangeText={setSearch}
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.gold} /></View>
      ) : (
        <FlatList
          data={data.filter(i => i.k.includes(search.toUpperCase()))}
          keyExtractor={item => item.k}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },
  subTitle: { fontSize: 12, color: COLORS.gold, fontWeight: 'bold', textTransform: 'uppercase' },
  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', padding: 8, borderRadius: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green, marginRight: 6 },
  statusText: { color: COLORS.green, fontSize: 10, fontWeight: '900' },
  search: { backgroundColor: '#1C1C1E', color: '#FFF', marginHorizontal: 16, padding: 15, borderRadius: 14, marginBottom: 10 },
  card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 20, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  left: { justifyContent: 'center' },
  symbol: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  time: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  right: { alignItems: 'flex-end' },
  price: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  buyBadge: { marginTop: 6, backgroundColor: '#2C2C2E', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  buyText: { color: COLORS.muted, fontSize: 11, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center' }
});
