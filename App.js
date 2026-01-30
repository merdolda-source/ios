import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';

// FIREBASE'I KAPATTIK - SADECE DİREKT LİNK
const DIRECT_URL = "https://imdatgel.site/harem/piyasa_cache.json";

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Başlatılıyor...");

  const veriCek = async () => {
    setLoading(true);
    setStatus("Sunucuya bağlanıyor...");

    try {
      // Direkt fetch atıyoruz (Firebase yok)
      const response = await fetch(DIRECT_URL, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });

      setStatus(`Bağlantı Sonucu: ${response.status}`);
      
      if (!response.ok) throw new Error("Sunucu Hatası: " + response.status);

      const json = await response.json();
      
      if (Array.isArray(json)) {
        setData(json);
        setStatus("Veriler Hazır");
      } else {
        setStatus("Veri formatı hatalı (Dizi değil)");
      }

    } catch (e) {
      setStatus("HATA: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1 saniye bekleyip çekelim ki arayüz yüklensin
    setTimeout(veriCek, 1000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Piyasa Pro</Text>
        <TouchableOpacity onPress={veriCek} style={styles.btn}>
          <Text style={styles.btnText}>YENİLE</Text>
        </TouchableOpacity>
      </View>

      {/* DURUM BİLGİSİ */}
      <View style={styles.statusBox}>
         <Text style={styles.statusText}>{status}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFD60A" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.k}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.symbol}>{item.k.replace('_', ' ')}</Text>
                <Text style={styles.time}>{item.t.split(' ')[1]}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.price}>{parseFloat(item.s).toFixed(2)} ₺</Text>
                <Text style={styles.buy}>Alış: {parseFloat(item.a).toFixed(2)}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
             <Text style={{color:'#fff', textAlign:'center', marginTop:20}}>Liste Boş</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#333' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  btn: { backgroundColor: '#FFD60A', padding: 8, borderRadius: 5 },
  btnText: { fontWeight: 'bold', color: '#000' },
  statusBox: { padding: 10, backgroundColor: '#111', borderBottomWidth:1, borderColor:'#333' },
  statusText: { color: '#0F0', fontFamily: 'Courier', textAlign:'center', fontSize:12 },
  card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1C1C1E', padding: 16, marginHorizontal: 10, marginBottom: 8, borderRadius: 10 },
  symbol: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  time: { color: '#888', fontSize: 12 },
  price: { color: '#FFD60A', fontSize: 18, fontWeight: 'bold' },
  buy: { color: '#888', fontSize: 12 }
});
