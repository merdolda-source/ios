import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, ActivityIndicator, StatusBar, TextInput, TouchableOpacity, Alert } from 'react-native';
import remoteConfig from '@react-native-firebase/remote-config';

const COLORS = { bg: '#000', card: '#1C1C1E', gold: '#FFD60A', green: '#32D74B', text: '#FFF', muted: '#8E8E93', red: '#FF453A' };

// YEDEK URL (Firebase çalışmazsa buraya gider)
const FALLBACK_URL = 'https://imdatgel.site/harem/piyasa_cache.json';

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState(null); // Hata mesajını ekranda göstermek için

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    try {
      // 1. Önce Firebase'i dene
      let targetUrl = FALLBACK_URL;
      try {
        await remoteConfig().setDefaults({ json_url: FALLBACK_URL });
        await remoteConfig().fetchAndActivate();
        const remoteUrl = remoteConfig().getValue('json_url').asString();
        if (remoteUrl && remoteUrl.startsWith('http')) {
          targetUrl = remoteUrl;
        }
      } catch (firebaseError) {
        console.log("Firebase hatası (Önemli değil, yedek URL kullanılıyor):", firebaseError);
      }

      // 2. Veriyi Çek
      const response = await fetch(targetUrl);
      
      // Yanıt başarısızsa hata fırlat
      if (!response.ok) {
        throw new Error(`Sunucu Hatası: ${response.status}`);
      }

      const json = await response.json();

      if (Array.isArray(json) && json.length > 0) {
        setData(json);
      } else {
        throw new Error("Veri boş veya format hatalı.");
      }

    } catch (e) {
      setErrorMsg(e.toString());
      Alert.alert("Hata", "Veriler güncellenemedi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <SafeAreaView style={styles.c}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.h}>
        <View>
          <Text style={styles.t}>Piyasa Pro</Text>
          <Text style={styles.st}>{data.length > 0 ? 'CANLI' : 'BAĞLANTI YOK'}</Text>
        </View>
        <TouchableOpacity onPress={fetchData} style={styles.rBtn}>
          <Text style={styles.rTxt}>YENİLE</Text>
        </TouchableOpacity>
      </View>

      <TextInput 
        style={styles.s} 
        placeholder="Sembol ara..." 
        placeholderTextColor="#8E8E93" 
        onChangeText={setSearch} 
      />

      {/* İÇERİK ALANI */}
      <View style={{flex: 1}}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.gold} style={{marginTop: 50}} />
        ) : errorMsg ? (
          // HATA VARSA GÖSTER
          <View style={styles.errBox}>
            <Text style={styles.errTxt}>⚠️ Veri Alınamadı</Text>
            <Text style={styles.errSub}>{errorMsg}</Text>
            <TouchableOpacity onPress={fetchData} style={styles.retryBtn}>
              <Text style={styles.retryTxt}>TEKRAR DENE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // VERİ VARSA LİSTELE
          <FlatList
            data={data.filter(i => i.k.includes(search.toUpperCase()))}
            keyExtractor={item => item.k}
            renderItem={({ item }) => (
              <View style={styles.cd}>
                <View>
                  <Text style={styles.sym}>{item.k.replace('_', ' ')}</Text>
                  <Text style={styles.tm}>{item.t.split(' ')[1]}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.pr}>{parseFloat(item.s).toFixed(2)} ₺</Text>
                  <Text style={styles.buy}>Alış: {parseFloat(item.a).toFixed(2)}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{color: '#fff', textAlign: 'center', marginTop: 20}}>
                Liste boş. Arama kriterini değiştirin.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: COLORS.bg },
  h: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  t: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  st: { color: COLORS.muted, fontWeight: 'bold', fontSize: 10, marginTop: 4 },
  rBtn: { backgroundColor: '#1C1C1E', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  rTxt: { color: COLORS.gold, fontWeight: 'bold', fontSize: 12 },
  s: { backgroundColor: '#1C1C1E', color: '#FFF', marginHorizontal: 15, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  cd: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 16, marginHorizontal: 15, marginBottom: 10, borderRadius: 16, borderWidth: 1, borderColor: '#2C2C2E' },
  sym: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  tm: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  pr: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  buy: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  
  // Hata Ekranı Stilleri
  errBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errTxt: { color: COLORS.red, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  errSub: { color: COLORS.muted, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
  retryTxt: { color: '#000', fontWeight: 'bold' }
});
