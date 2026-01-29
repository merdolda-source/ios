import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#000000',
  card: '#1C1C1E',
  primary: '#FFD700', // Altın Sarısı
  up: '#32D74B',
  down: '#FF453A',
  text: '#FFFFFF',
  gray: '#8E8E93'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('doviz');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHaremData = async () => {
    try {
      // Harem Altın'ın en güncel ve hızlı anlık veri endpoint'i
      const response = await fetch('https://mobil.haremaltin.com/index.php?islem=cur__anlik');
      const json = await response.json();
      
      if (json.sonuc === "1") {
        const rawData = json.data;
        const items = [];

        // Veri eşleme
        Object.keys(rawData).forEach(key => {
          const item = rawData[key];
          const isGold = key.includes('ALTIN') || key.includes('AYAR') || key.includes('CEYREK');

          const formattedItem = {
            id: key,
            name: key.replace('TRY', '').replace('ALTIN', ' Altın'),
            price: item.satis,
            change: item.yuzde,
            isUp: parseFloat(item.yuzde.replace(',', '.')) >= 0
          };

          if (activeTab === 'altin' && isGold) {
            items.push(formattedItem);
          } else if (activeTab === 'doviz' && !isGold) {
            // Sadece ana dövizleri filtrele
            if (['USDTRY', 'EURTRY', 'GBPTRY', 'CHFTRY'].includes(key)) {
              items.push(formattedItem);
            }
          }
        });
        setData(items);
      }
    } catch (error) {
      console.error("Harem API Hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHaremData();
    const timer = setInterval(fetchHaremData, 10000); // 10 saniyede bir gerçek zamanlı güncelleme
    return () => clearInterval(timer);
  }, [activeTab]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconBox, { backgroundColor: item.isUp ? '#32D74B15' : '#FF453A15' }]}>
          <Text style={{ color: item.isUp ? COLORS.up : COLORS.down, fontWeight: 'bold', fontSize: 10 }}>
            {item.id.substring(0, 3)}
          </Text>
        </View>
        <View>
          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.subText}>Harem Altın Verisi</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.priceText}>{item.price} ₺</Text>
        <View style={[styles.badge, { backgroundColor: item.isUp ? COLORS.up : COLORS.down }]}>
          <Text style={styles.badgeText}>%{item.change}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Harem Piyasalar</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.dot} />
            <Text style={styles.liveText}>CANLI VERİ</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'doviz' && styles.activeTab]} 
          onPress={() => {setLoading(true); setActiveTab('doviz');}}
        >
          <Text style={[styles.tabText, activeTab === 'doviz' && {color: '#000'}]}>Döviz</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'altin' && styles.activeTab]} 
          onPress={() => {setLoading(true); setActiveTab('altin');}}
        >
          <Text style={[styles.tabText, activeTab === 'altin' && {color: '#000'}]}>Altın</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, letterSpacing: -0.5 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.up, marginRight: 6 },
  liveText: { color: COLORS.up, fontSize: 10, fontWeight: '800' },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.card, marginHorizontal: 20, borderRadius: 14, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.gray, fontWeight: 'bold' },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 18, borderRadius: 20, marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  nameText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  subText: { color: COLORS.gray, fontSize: 11, marginTop: 2 },
  priceText: { color: COLORS.text, fontSize: 19, fontWeight: 'bold', marginBottom: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
