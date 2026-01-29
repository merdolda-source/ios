import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#050710',
  card: '#111320',
  primary: '#00E5FF',
  up: '#00C853',
  down: '#FF1744',
  text: '#FFF',
  gray: '#A0A0A0'
};

export default function App() {
  const [activeTab, setActiveTab] = useState('doviz'); // 'doviz' veya 'altin'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastData, setLastData] = useState({}); // Önceki fiyatları saklamak için
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    // 30 saniyede bir otomatik güncelleme (Anlık hissi verir)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async () => {
    try {
      // Not: Gerçek projede altın ve döviz için farklı uç noktalar kullanılabilir.
      // Bu API her ikisini de kapsayan genel bir settir.
      const response = await fetch('https://finans.truncgil.com/today.json');
      const json = await response.json();
      
      const items = [];
      for (let key in json) {
        if (key === 'Update_Date') continue;

        const currentPrice = parseFloat(json[key].Selling.replace(',', '.'));
        const previousPrice = lastData[key] || currentPrice;
        
        // Değişim yönünü belirle
        let direction = 'stable';
        if (currentPrice > previousPrice) direction = 'up';
        else if (currentPrice < previousPrice) direction = 'down';

        const isGold = key.includes('Altın') || key.includes('Gram') || key.includes('Çeyrek');
        
        if (activeTab === 'altin' && isGold) {
          items.push({ name: key, price: json[key].Selling, change: json[key].Change, direction });
        } else if (activeTab === 'doviz' && !isGold) {
          // Sadece popüler dövizleri alalım
          if (['USD', 'EUR', 'GBP', 'CHF', 'CAD'].includes(key)) {
            items.push({ name: key, price: json[key].Selling, change: json[key].Change, direction });
          }
        }
      }

      // Mevcut fiyatları bir sonraki karşılaştırma için kaydet
      const newLastData = {};
      items.forEach(item => { newLastData[item.name] = parseFloat(item.price.replace(',', '.')); });
      setLastData(newLastData);
      
      setData(items);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isUp = item.direction === 'up';
    const isDown = item.direction === 'down';
    const color = isUp ? COLORS.up : isDown ? COLORS.down : COLORS.text;
    const icon = isUp ? 'caret-up' : isDown ? 'caret-down' : 'remove-outline';

    return (
      <View style={styles.card}>
        <View style={styles.leftSide}>
          <View style={[styles.iconBadge, { backgroundColor: color + '20' }]}>
            <Ionicons name={activeTab === 'doviz' ? 'logo-usd' : 'medal-outline'} size={24} color={color} />
          </View>
          <View>
            <Text style={styles.symbolText}>{item.name}</Text>
            <Text style={styles.updateText}>Anlık Güncel</Text>
          </View>
        </View>

        <View style={styles.rightSide}>
          <Text style={[styles.priceText, { color: color }]}>{item.price}</Text>
          <View style={styles.changeRow}>
            <Ionicons name={icon} size={16} color={color} />
            <Text style={[styles.changeText, { color: color }]}>%{item.change || '0.00'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Piyasalar</Text>
        <TouchableOpacity onPress={() => { setLoading(true); fetchData(); }}>
          <Ionicons name="refresh-circle" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* TABS SECTION */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'doviz' && styles.activeTab]} 
          onPress={() => setActiveTab('doviz')}
        >
          <Text style={[styles.tabText, activeTab === 'doviz' && styles.activeTabText]}>DÖVİZ</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'altin' && styles.activeTab]} 
          onPress={() => setActiveTab('altin')}
        >
          <Text style={[styles.tabText, activeTab === 'altin' && styles.activeTabText]}>ALTIN</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: COLORS.text, letterSpacing: 1 },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.card, 
    marginHorizontal: 20, 
    borderRadius: 12, 
    padding: 5,
    marginBottom: 10
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.gray, fontWeight: 'bold' },
  activeTabText: { color: '#000' },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: COLORS.card, 
    padding: 15, 
    borderRadius: 18, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1d2133'
  },
  leftSide: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: { padding: 10, borderRadius: 12, marginRight: 15 },
  symbolText: { color: COLORS.text, fontSize: 17, fontWeight: 'bold' },
  updateText: { color: COLORS.gray, fontSize: 11, marginTop: 2 },
  rightSide: { alignItems: 'flex-end' },
  priceText: { fontSize: 18, fontWeight: 'bold' },
  changeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  changeText: { fontSize: 13, fontWeight: '600', marginLeft: 4 }
});
