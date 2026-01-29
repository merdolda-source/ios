import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';

const COLORS = {
  bg: '#000000',
  card: '#1C1C1E',
  primary: '#FFD700',
  text: '#FFFFFF',
  up: '#32D74B',
  down: '#FF453A'
};

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHaremData = async () => {
    try {
      // Form verilerini senin verdiğin birebir yapıda hazırlıyoruz
      const formData = new FormData();
      formData.append('device_id', '6f8a00c36020b7f4');
      formData.append('dil_kodu', 'tr');
      formData.append('interval', 'dakika');
      
      const codes = ['USDTRY', 'EURTRY', 'JPYTRY', 'GBPTRY'];
      codes.forEach(code => formData.append('kod[]', code));

      // Tarihleri dinamik yapalım ki sunucu "eski veri" diyerek reddetmesin
      const now = new Date();
      const before = new Date(now.getTime() - 10 * 60000);
      const fmt = (d) => d.toISOString().replace('T', ' ').split('.')[0];
      
      formData.append('tarih1', fmt(before));
      formData.append('tarih2', fmt(now));

      // SENİN PAYLAŞTIĞIN TÜM BİLGİLER BURADA:
      const response = await fetch('https://mobil.haremaltin.com/index.php?islem=cur__history&device_id=6f8a00c36020b7f4&dil_kodu=tr', {
        method: 'POST',
        headers: {
          'Host': 'mobil.haremaltin.com', // İstediğin Host bilgisi
          'Accept-Encoding': 'gzip',
          'User-Agent': 'okhttp/4.9.2',
          'Cookie': 'PHPSESSID=dtckdctcili54mmrmmudsf3dcm; AWSALB=nCxKHuwvi5Tb5wafu4GaiGBeptFoVopCXyiat0jDaCv9U4PMkoiZYBUg3MRVM6mzumLcspUoK/UaZF6kD1WteRuJdrEBNd6sVqluYi3RF4b2UirW5kan3so8H2+Y; AWSALBCORS=nCxKHuwvi5Tb5wafu4GaiGBeptFoVopCXyiat0jDaCv9U4PMkoiZYBUg3MRVM6mzumLcspUoK/UaZF6kD1WteRuJdrEBNd6sVqluYi3RF4b2UirW5kan3so8H2+Y',
          // 'Content-Type': 'multipart/form-data; boundary=b637ad9c-65e7-4cb9-ac2e-e9df7e2cae18' 
          // Not: React Native'de Content-Type'ı elle yazmak boundary hatasına yol açabilir, 
          // FormData kullanınca sistem en doğru boundary'yi kendisi ekler.
        },
        body: formData,
      });

      const json = await response.json();
      
      if (json.sonuc === "1") {
        const list = Object.keys(json.data).map(key => {
          const last = json.data[key][json.data[key].length - 1];
          return {
            id: key,
            price: last.satis,
            change: last.yuzde,
            isUp: parseFloat(last.yuzde.replace(',', '.')) >= 0
          };
        });
        setData(list);
      }
    } catch (e) {
      console.error("Bağlantı Hatası:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHaremData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Harem Pro</Text>
        <Text style={styles.subTitle}>Host: mobil.haremaltin.com</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="large" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.symbol}>{item.id}</Text>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.price}>{item.price} ₺</Text>
                <Text style={{color: item.isUp ? COLORS.up : COLORS.down, fontWeight: 'bold'}}>
                  {item.isUp ? '▲' : '▼'} %{item.change}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={{padding: 20}}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 25 },
  headerTitle: { fontSize: 34, fontWeight: 'bold', color: COLORS.text },
  subTitle: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: COLORS.card, 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  symbol: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  price: { color: COLORS.text, fontSize: 20, fontWeight: '800' }
});
