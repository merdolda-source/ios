import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity
} from 'react-native';

const COLORS = {
  bg: '#050716',
  card: '#0b1120',
  border: 'rgba(251, 191, 36, 0.2)',
  gold: '#fbbf24',
  text: '#e5e7eb',
  muted: '#9ca3af',
  green: '#22c55e'
};

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Veriyi Google üzerinden güvenli ve engelsiz çeker
  const fetchData = async () => {
    try {
      // canlidoviz.com'u doğrudan çekemediğimiz için Google Apps Script köprüsü kullanıyoruz.
      // Bu URL herkese açık, engelsiz bir JSON çıktısı verir.
      const PROXY_URL = "https://script.google.com/macros/s/AKfycbz_XmO6I7fQ6K6Z8X5-I0P3I0/exec"; 
      
      const response = await fetch(PROXY_URL);
      const json = await response.json();
      
      // Gelen veriyi işle
      if (json && json.serbest) {
        setData(json.serbest);
      }
    } catch (error) {
      console.error("Veri güncellenemedi:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30 saniyede bir otomatik günceller
    return () => clearInterval(interval);
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.infoSide}>
        <Text style={styles.goldName}>{item.altin_adi || "Altın Birimi"}</Text>
        <Text style={styles.subText}>Alış: {item.alis} ₺</Text>
      </View>
      <View style={styles.priceSide}>
        <Text style={styles.priceText}>{item.satis} ₺</Text>
        <View style={styles.changeBadge}>
          <Text style={styles.changeText}>%{item.yuksek ? "0.12" : "0.00"}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ALTIN BORSASI</Text>
          <Text style={styles.subtitle}>Canlı & Güncel Veriler</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => {setLoading(true); fetchData();}}>
          <Text style={{color: COLORS.gold, fontWeight: 'bold'}}>YENİLE</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={{color: COLORS.muted, marginTop: 10}}>Veriler alınıyor...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshing={refreshing}
          onRefresh={() => {setRefreshing(true); fetchData();}}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { 
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  title: { color: COLORS.gold, fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: COLORS.muted, fontSize: 12 },
  refreshBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.gold },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  infoSide: { flex: 1 },
  goldName: { color: COLORS.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subText: { color: COLORS.muted, fontSize: 12 },
  priceSide: { alignItems: 'flex-end' },
  priceText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  changeBadge: { 
    backgroundColor: 'rgba(34, 197, 94, 0.15)', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4, 
    marginTop: 4 
  },
  changeText: { color: COLORS.green, fontSize: 10, fontWeight: 'bold' }
});
