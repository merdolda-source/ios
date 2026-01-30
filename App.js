import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, ActivityIndicator, StatusBar, TouchableOpacity, Alert } from 'react-native';
import remoteConfig from '@react-native-firebase/remote-config';

// 1. SABİT URL (Firebase bozulursa bu çalışacak)
const YEDEK_URL = "https://imdatgel.site/harem/piyasa_cache.json";

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugMsg, setDebugMsg] = useState(""); // Ekrana hata basmak için

  const veriCek = async () => {
    setLoading(true);
    setDebugMsg(""); // Mesajı temizle

    let hedefUrl = YEDEK_URL;

    try {
      // --- ADIM 1: FIREBASE ---
      try {
        await remoteConfig().setConfigSettings({ minimumFetchIntervalMillis: 0 });
        await remoteConfig().setDefaults({ json_url: YEDEK_URL });
        await remoteConfig().fetchAndActivate();
        const firebaseLink = remoteConfig().getValue('json_url').asString();
        
        // Eğer Firebase'den geçerli bir link gelirse onu kullan
        if (firebaseLink && firebaseLink.startsWith("http")) {
          hedefUrl = firebaseLink;
        }
      } catch (err) {
        console.log("Firebase hatası (Önemli değil, yedek kullanılıyor)");
      }

      // --- ADIM 2: VERİYİ İNDİR ---
      // setDebugMsg(`Bağlanıyor: ${hedefUrl}`); // İstersen bu satırı açıp hangi linke gittiğini görebilirsin.
      
      const response = await fetch(hedefUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json'
        }
      });

      // --- ADIM 3: KONTROL ET ---
      const textVeri = await response.text(); // Gelen şeyi önce yazı olarak al

      // Gelen şey HTML mi? (Hata sayfası mı?)
      if (textVeri.includes("<html") || textVeri.includes("<!DOCTYPE")) {
        setDebugMsg("HATA: Sunucu JSON yerine HTML gönderiyor! Linki tarayıcıda kontrol et.");
        Alert.alert("Sunucu Hatası", "Sunucu veriyi engelliyor veya hata sayfası gönderiyor.");
        return;
      }

      // --- ADIM 4: ÇEVİR VE GÖSTER ---
      try {
        const jsonVeri = JSON.parse(textVeri);
        if (Array.isArray(jsonVeri)) {
          setData(jsonVeri);
        } else {
          setDebugMsg("HATA: Gelen veri liste formatında değil.");
        }
      } catch (parseError) {
        setDebugMsg("HATA: Veri bozuk, JSON'a çevrilemedi.\n" + textVeri.substring(0, 100));
      }

    } catch (error) {
      setDebugMsg("BAĞLANTI HATASI: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    veriCek();
  }, []);

  // --- EKRAN TASARIMI ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Piyasa Pro</Text>
        <TouchableOpacity onPress={veriCek} style={styles.btn}>
          <Text style={styles.btnText}>YENİLE</Text>
        </TouchableOpacity>
      </View>

      {/* HATA VARSA BURASI GÖRÜNÜR */}
      {debugMsg !== "" && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {debugMsg}</Text>
        </View>
      )}

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
            !loading && debugMsg === "" && <Text style={{color:'#fff', textAlign:'center', marginTop:20}}>Liste Boş (Veri Gelmedi)</Text>
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
  errorBox: { margin: 10, padding: 10, backgroundColor: '#300', borderRadius: 8, borderWidth: 1, borderColor: 'red' },
  errorText: { color: '#FF453A', fontWeight: 'bold' },
  card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1C1C1E', padding: 16, marginHorizontal: 10, marginBottom: 8, borderRadius: 10 },
  symbol: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  time: { color: '#888', fontSize: 12 },
  price: { color: '#FFD60A', fontSize: 18, fontWeight: 'bold' },
  buy: { color: '#888', fontSize: 12 }
});
