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
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#000000',
  card: '#1C1C1E',
  primary: '#FFD700',
  up: '#32D74B',
  down: '#FF453A',
  text: '#FFFFFF',
  gray: '#8E8E93'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('doviz');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHaremData = async () => {
    try {
      // multipart/form-data hazırlığı
      const formData = new FormData();
      formData.append('device_id', '6f8a00c36020b7f4');
      formData.append('dil_kodu', 'tr');
      formData.append('interval', 'dakika');
      
      // Tarihleri dinamik yapalım (Hata almamak için son 5 dakikayı çekiyoruz)
      const now = new Date();
      const fiveMinsAgo = new Date(now.getTime() - 5 * 60000);
      
      const formatDate = (date) => date.toISOString().replace('T', ' ').split('.')[0];
      
      formData.append('tarih1', formatDate(fiveMinsAgo));
      formData.append('tarih2', formatDate(now));

      // İstediğin döviz kodları
      const codes = ['USDTRY', 'EURTRY', 'JPYTRY', 'GBPTRY', 'ALTIN', 'CEYREK_YENI', 'AYAR22'];
      codes.forEach(code => formData.append('kod[]', code));

      const response = await fetch('https://mobil.haremaltin.com/index.php?islem=cur__history&device_id=6f8a00c36020b7f4&dil_kodu=tr', {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'okhttp/4.9.2',
          // Content-Type FormData kullanıldığında React Native tarafından otomatik belirlenir
        },
        body: formData,
      });

      const json = await response.json();
      
      if (json.sonuc === "1") {
        const processed = [];
        // Gelen veriler history olduğu için her sembolün son verisini alıyoruz
        Object.keys(json.data).forEach(key => {
          const historyArray = json.data[key];
          if (historyArray && historyArray.length > 0) {
            const lastEntry = historyArray[historyArray.length - 1];
            const isGold = key.includes('ALTIN') || key.includes('AYAR') || key.includes('CEYREK');

            const item = {
              id: key,
              name: key.replace('TRY', '').replace('_', ' '),
              price: lastEntry.satis,
              change: lastEntry.yuzde || "0.00",
              isUp: parseFloat((lastEntry.yuzde || "0").replace(',', '.')) >= 0
            };

            if (activeTab === 'altin' && isGold) processed.push(item);
            else if (activeTab === 'doviz' && !isGold) processed.push(item);
          }
        });
        setData(processed);
      }
    } catch (error) {
      console.error("İstek Hatası:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHaremData();
    const interval = setInterval(fetchHaremData, 30000); // 30 saniyede bir history yenile
    return () => clearInterval(interval);
  }, [activeTab]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.symbolIcon, { backgroundColor: item.isUp ? '#32D74B20' : '#FF453A20' }]}>
          <Text style={{ color: item.isUp ? COLORS.up : COLORS.down, fontWeight: 'bold' }}>{item.id.substring(0,2)}</Text>
        </View>
        <View>
          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.subText}>Harem Live</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.priceText}>{item.price} ₺</Text>
        <Text style={{ color: item.isUp ? COLORS.up : COLORS.down, fontSize: 13, fontWeight: 'bold' }}>
          {item.isUp ? '▲' : '▼'} %{item.change}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Harem Pro</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>BAĞLI</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        {['doviz', 'altin'].map(tab => (
          <TouchableOpacity 
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]} 
            onPress={() => {setLoading(true); setActiveTab(tab);}}
          >
            <Text style={[styles.tabText, activeTab === tab && {color: '#000'}]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchHaremData();}} tintColor={COLORS.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 25 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
  statusBadge: { backgroundColor: '#32D74B20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: COLORS.up, fontSize: 10, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.card, marginHorizontal: 20, borderRadius: 15, padding: 5 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.gray, fontWeight: 'bold' },
  card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 16, borderRadius: 20, marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  symbolIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  nameText: { color: COLORS.text, fontSize: 17, fontWeight: 'bold' },
  subText: { color: COLORS.gray, fontSize: 12 },
  priceText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  center: { flex: 1, justifyContent: 'center' }
});
