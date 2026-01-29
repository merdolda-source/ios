import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  StatusBar
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

  const genId = (n) => [...Array(n)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

  const fetchHaremData = async () => {
    try {
      const deviceId = genId(16);
      const boundary = "----WebKitFormBoundary" + genId(8);
      
      // PHP ile birebir aynı tarih formatı
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now - offset)).toISOString().slice(0, 19).replace('T', ' ');
      const todayStart = localISOTime.split(' ')[0] + " 00:00:00";

      const codes = ["USDTRY", "EURTRY", "GBPTRY", "ALTIN", "ONS", "CEYREK_YENI", "AYAR22"];
      
      // Manuel Multipart Body Oluşturma
      let body = "";
      const params = {
        device_id: deviceId,
        dil_kodu: 'tr',
        tarih1: todayStart,
        tarih2: localISOTime,
        interval: 'dakika'
      };

      for (let key in params) {
        body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${params[key]}\r\n`;
      }
      codes.forEach(c => {
        body += `--${boundary}\r\nContent-Disposition: form-data; name="kod[]"\r\n\r\n${c}\r\n`;
      });
      body += `--${boundary}--\r\n`;

      const response = await fetch(`https://mobil.haremaltin.com/index.php?islem=cur__history&device_id=${deviceId}&dil_kodu=tr`, {
        method: 'POST',
        headers: {
          'User-Agent': 'okhttp/4.9.2',
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Cookie': `PHPSESSID=${genId(20)}`,
          'Accept': '*/*'
        },
        body: body
      });

      const json = await response.json();
      
      if (json && json.data) {
        const items = Object.keys(json.data).map(key => {
          const history = json.data[key];
          const last = history[history.length - 1];
          return {
            k: key,
            s: last.satis,
            y: parseFloat(last.yuzde.replace(',', '.'))
          };
        });
        setData(items);
      }
    } catch (e) {
      console.log("Hata:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHaremData();
    const t = setInterval(fetchHaremData, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>PİYASA EKRANI</Text>
        <Text style={styles.time}>{new Date().toLocaleTimeString('tr-TR')}</Text>
      </View>

      <TextInput 
        style={styles.search} 
        placeholder="Sembol filtrele..." 
        placeholderTextColor={COLORS.dim}
        onChangeText={setSearch}
      />

      {loading && data.length === 0 ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={data.filter(i => i.k.includes(search.toUpperCase()))}
          keyExtractor={item => item.k}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View>
                <Text style={styles.symbol}>{item.k}</Text>
                <Text style={styles.sub}>Harem Altın</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>{item.s} ₺</Text>
                <Text style={{ color: item.y >= 0 ? COLORS.green : COLORS.red, fontWeight: 'bold' }}>
                  {item.y >= 0 ? '▲' : '▼'} %{Math.abs(item.y).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: COLORS.border },
  logo: { color: COLORS.gold, fontSize: 20, fontWeight: '900' },
  time: { color: COLORS.green, fontFamily: 'Courier' },
  search: { backgroundColor: '#000', color: '#fff', margin: 15, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderColor: COLORS.border },
  symbol: { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  sub: { color: COLORS.dim, fontSize: 10 },
  price: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
