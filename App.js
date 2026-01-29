import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  TextInput
} from 'react-native';

const COLORS = {
  bg: '#09090b',
  card: '#18181b',
  border: '#27272a',
  text: '#e4e4e7',
  gold: '#eab308',
  green: '#22c55e',
  red: '#ef4444',
  dim: '#71717a'
};

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // PHP'deki _x1 fonksiyonu (Rastgele ID üretici)
  const generateID = (n) => {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < n; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const fetchHaremPro = async () => {
    try {
      const deviceId = generateID(16);
      const sessionId = generateID(20);
      const boundary = "----WebKitFormBoundary" + generateID(8);

      // PHP'deki tarih mantığı
      const now = new Date();
      const t2 = now.toISOString().replace('T', ' ').split('.')[0];
      const t1 = new Date(now.setHours(0, 0, 0, 0)).toISOString().replace('T', ' ').split('.')[0];

      const codes = ["USDTRY", "EURTRY", "GBPTRY", "ALTIN", "ONS", "CEYREK_YENI", "AYAR22", "GUMUSTRY"];
      
      const formData = new FormData();
      formData.append('device_id', deviceId);
      formData.append('dil_kodu', 'tr');
      formData.append('tarih1', t1);
      formData.append('tarih2', t2);
      formData.append('interval', 'dakika');
      codes.forEach(c => formData.append('kod[]', c));

      const response = await fetch(`https://mobil.haremaltin.com/index.php?islem=cur__history&device_id=${deviceId}&dil_kodu=tr`, {
        method: 'POST',
        headers: {
          'User-Agent': 'okhttp/4.9.2',
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Cookie': `PHPSESSID=${sessionId}`
        },
        body: formData
      });

      const json = await response.json();
      
      if (json.sonuc === "1") {
        const processed = Object.keys(json.data).map(key => {
          const history = json.data[key];
          const last = history[history.length - 1];
          const isGold = key.includes('ALTIN') || key.includes('AYAR') || key.includes('ONS');
          
          return {
            k: key,
            s: last.satis,
            a: last.alis,
            y: parseFloat(last.yuzde.replace(',', '.'))
          };
        });
        setData(processed);
      }
    } catch (err) {
      console.error("Harem API Hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHaremPro();
    const timer = setInterval(fetchHaremPro, 10000);
    return () => clearInterval(timer);
  }, []);

  const filteredData = data.filter(item => item.k.includes(search.toUpperCase()));

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.cellLeft}>
        <View style={[styles.dot, { backgroundColor: item.k.includes('TRY') ? COLORS.green : COLORS.gold }]} />
        <View>
          <Text style={styles.symbolName}>{item.k.replace('TRY', '')}</Text>
          <Text style={styles.subText}>Harem Pro</Text>
        </View>
      </View>
      <View style={styles.cellRight}>
        <Text style={styles.priceText}>{item.s} ₺</Text>
        <Text style={[styles.changeText, { color: item.y >= 0 ? COLORS.green : COLORS.red }]}>
          {item.y >= 0 ? '▲' : '▼'} %{Math.abs(item.y).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>PİYASA EKRANI</Text>
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{new Date().toLocaleTimeString('tr-TR')}</Text>
        </View>
      </View>

      <TextInput 
        style={styles.searchBox} 
        placeholder="Sembol filtrele..." 
        placeholderTextColor={COLORS.dim}
        onChangeText={setSearch}
      />

      {loading && data.length === 0 ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={item => item.k}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      <View style={styles.footer}>
        <Text style={styles.footerText}>System v4.4 • By dersev Enigma</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  logo: { color: COLORS.gold, fontWeight: '800', fontSize: 18 },
  timeBadge: { backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  timeText: { color: COLORS.green, fontFamily: 'Courier', fontSize: 12 },
  searchBox: { backgroundColor: '#000', color: '#fff', margin: 10, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: 'center' },
  cellLeft: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  symbolName: { color: COLORS.text, fontWeight: '700', fontSize: 16 },
  subText: { color: COLORS.dim, fontSize: 10, marginTop: 2 },
  cellRight: { alignItems: 'flex-end' },
  priceText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: -0.5 },
  changeText: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 10, backgroundColor: '#000', alignItems: 'center' },
  footerText: { color: COLORS.dim, fontSize: 10 }
});
