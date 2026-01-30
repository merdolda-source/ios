import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, ActivityIndicator, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import remoteConfig from '@react-native-firebase/remote-config';

// SENİN VERDİĞİN LİNK (YEDEK OLARAK)
const DEFAULT_URL = "https://imdatgel.site/harem/piyasa_cache.json";

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]); // Ekrana durum basmak için log sistemi

  // Ekrana log ekleyen yardımcı fonksiyon
  const addLog = (msg) => {
    console.log(msg);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} -> ${msg}`]);
  };

  const initApp = async () => {
    setLoading(true);
    setLogs([]); // Logları temizle
    addLog("Uygulama Başlatılıyor...");

    let targetUrl = DEFAULT_URL;

    // 1. FIREBASE BAĞLANTISI
    try {
      addLog("Firebase Remote Config hazırlanıyor...");
      await remoteConfig().setConfigSettings({ minimumFetchIntervalMillis: 0 });
      await remoteConfig().setDefaults({ json_url: DEFAULT_URL });
      
      addLog("Firebase'den veri çekiliyor (Fetch)...");
      const fetched = await remoteConfig().fetchAndActivate();
      addLog(`Fetch Durumu: ${fetched ? 'Yeni veri alındı' : 'Cache kullanılıyor'}`);
      
      const remoteVal = remoteConfig().getValue('json_url');
      const remoteString = remoteVal.asString();
      addLog(`Firebase'den gelen URL: ${remoteString}`);

      if (remoteString && remoteString.startsWith("http")) {
        targetUrl = remoteString;
      } else {
        addLog("⚠️ Firebase URL'si geçersiz, varsayılan kullanılıyor.");
      }

    } catch (err) {
      addLog(`❌ Firebase Hatası: ${err.message}`);
      addLog("Varsayılan URL ile devam ediliyor...");
    }

    // 2. VERİ ÇEKME (FETCH)
    try {
      addLog(`Veri çekiliyor: ${targetUrl}`);
      const response = await fetch(targetUrl);
      addLog(`Sunucu Yanıt Kodu: ${response.status}`);

      if (!response.ok) throw new Error(`HTTP Hatası: ${response.status}`);

      const textData = await response.text();
      // addLog(`Gelen Ham Veri (İlk 50 krktr): ${textData.substring(0, 50)}...`);

      let jsonData;
      try {
        jsonData = JSON.parse(textData);
        addLog(`JSON Ayrıştırıldı. Veri Sayısı: ${jsonData.length}`);
      } catch (parseErr) {
        throw new Error("Gelen veri JSON formatında değil! HTML dönüyor olabilir.");
      }

      if (Array.isArray(jsonData)) {
        setData(jsonData);
        addLog("✅ Veriler başarıyla yüklendi!");
      } else {
        throw new Error("JSON formatı beklenen Dizi (Array) yapısında değil.");
      }

    } catch (e) {
      addLog(`❌ KRİTİK HATA: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initApp();
  }, []);

  // HATA AYIKLAMA EKRANI (Veri yoksa burası görünür)
  if (data.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.debugContainer}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.debugTitle}>TANI RAPORU</Text>
        <ScrollView style={styles.logBox}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.retryBtn} onPress={initApp}>
          <Text style={styles.retryText}>TEKRAR DENE</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // NORMAL UYGULAMA EKRANI (Veri varsa burası görünür)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Piyasa Pro</Text>
        <TouchableOpacity onPress={initApp} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>⟳</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFD60A" />
          <Text style={{color:'#888', marginTop:10}}>Veriler Güncelleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.k}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.symbol}>{item.k.replace('_', ' ')}</Text>
                <Text style={styles.time}>{item.t?.split(' ')[1]}</Text>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={styles.price}>{parseFloat(item.s).toFixed(2)} ₺</Text>
                <Text style={styles.buy}>Alış: {parseFloat(item.a).toFixed(2)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  debugContainer: { flex: 1, backgroundColor: '#111', padding: 20 },
  debugTitle: { color: '#FF453A', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign:'center' },
  logBox: { flex: 1, backgroundColor: '#000', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  logText: { color: '#0F0', fontFamily: 'Courier', fontSize: 11, marginBottom: 4 },
  
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth:1, borderColor:'#222' },
  title: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  refreshBtn: { padding: 10 },
  refreshText: { color: '#FFD60A', fontSize: 24, fontWeight: 'bold' },
  
  card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1C1C1E', padding: 16, marginHorizontal: 16, marginBottom: 10, borderRadius: 12 },
  symbol: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  time: { color: '#666', fontSize: 11, marginTop: 4 },
  price: { color: '#FFD60A', fontSize: 18, fontWeight: '800' },
  buy: { color: '#666', fontSize: 12 },
  
  retryBtn: { backgroundColor: '#FFD60A', padding: 15, borderRadius: 10, alignItems: 'center' },
  retryText: { color: '#000', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
