import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#000000',
  card: '#1C1C1E',
  primary: '#0A84FF', // iOS Blue
  up: '#32D74B',      // iOS Green
  down: '#FF453A',    // iOS Red
  text: '#FFFFFF',
  secondaryText: '#8E8E93',
  accent: '#BF5AF2'   // iOS Purple
};

export default function App() {
  const [activeTab, setActiveTab] = useState('doviz');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Türkiye piyasası için en hızlı ve açık kaynaklı API
      const response = await fetch('https://finans.truncgil.com/today.json');
      const json = await response.json();
      
      const items = [];
      Object.keys(json).forEach(key => {
        if (key === 'Update_Date') return;

        const val = json[key];
        // Sayı formatını düzeltme (Virgülü noktaya çevir)
        const price = val.Selling ? val.Selling.replace('.', '').replace(',', '.') : "0.00";
        const change = val.Change ? val.Change.replace(',', '.') : "0.00";
        
        const isGold = key.toLowerCase().includes('altin') || 
                       key.toLowerCase().includes('gram') || 
                       key.toLowerCase().includes('ceyrek');

        const itemObj = {
          id: key,
          name: key.replace('İ', 'I'), // Karakter düzeltme
          price: parseFloat(price).toLocaleString('tr-TR', { minimumFractionDigits: 2 }),
          change: parseFloat(change).toFixed(2),
          isUp: parseFloat(change) >= 0
        };

        if (activeTab === 'altin' && isGold) {
          items.push(itemObj);
        } else if (activeTab === 'doviz' && !isGold) {
          const mainList = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'JPY', 'AUD'];
          if (mainList.some(c => key.includes(c))) items.push(itemObj);
        }
      });

      setData(items);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // 15 saniyede bir oto-güncelleme
    return () => clearInterval(interval);
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.symbolIcon, { backgroundColor: item.isUp ? '#32D74B20' : '#FF453A20' }]}>
          <Text style={{ color: item.isUp ? COLORS.up : COLORS.down, fontWeight: 'bold' }}>
            {item.id.substring(0, 2)}
          </Text>
        </View>
        <View>
          <Text style={styles.symbolText}>{item.name}</Text>
          <Text style={styles.timeText}>Canlı Veri</Text>
        </View>
      </View>
      
      <View style={styles.cardRight}>
        <Text style={styles.priceText}>{item.price} ₺</Text>
        <View style={[styles.changeBadge, { backgroundColor: item.isUp ? COLORS.up : COLORS.down }]}>
          <Ionicons name={item.isUp ? "trending-up" : "trending-down"} size={12} color="white" />
          <Text style={styles.changeText}>%{Math.abs(item.change)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</Text>
          <Text style={styles.headerTitle}>Piyasalar</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="stats-chart" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Modern Tab Selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          onPress={() => { setLoading(true); setActiveTab('doviz'); }}
          style={[styles.tabItem, activeTab === 'doviz' && styles.tabItemActive]}
        >
          <Text style={[styles.tabLabel, activeTab === 'doviz' && styles.tabLabelActive]}>Döviz</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => { setLoading(true); setActiveTab('altin'); }}
          style={[styles.tabItem, activeTab === 'altin' && styles.tabItemActive]}
        >
          <Text style={[styles.tabLabel, activeTab === 'altin' && styles.tabLabelActive]}>Altın</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
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
    alignItems: 'flex-end', 
    paddingHorizontal: 20, 
    paddingBottom: 20,
    paddingTop: 10
  },
  headerTitle: { fontSize: 34, fontWeight: '800', color: COLORS.text, letterSpacing: -1 },
  dateText: { color: COLORS.secondaryText, fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  profileBtn: { backgroundColor: '#1C1C1E', padding: 10, borderRadius: 20 },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#1C1C1E', 
    marginHorizontal: 20, 
    borderRadius: 10, 
    padding: 2,
    marginBottom: 10
  },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabItemActive: { backgroundColor: '#3A3A3C' },
  tabLabel: { color: COLORS.secondaryText, fontWeight: '600', fontSize: 15 },
  tabLabelActive: { color: COLORS.text },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: COLORS.card, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12 
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  symbolIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  symbolText: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  timeText: { color: COLORS.secondaryText, fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  priceText: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  changeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6 
  },
  changeText: { color: 'white', fontSize: 12, fontWeight: '800', marginLeft: 3 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
