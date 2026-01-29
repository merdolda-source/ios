import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
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
  const [activeTab, setActiveTab] = useState('doviz');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      // Daha stabil bir yedek API: CollectAPI veya benzeri yerine genelde açık olan bu kaynağı kullanıyoruz
      const response = await fetch('https://finans.truncgil.com/today.json');
      const json = await response.json();
      
      const items = [];
      
      // JSON içindeki tüm anahtarları dönüyoruz
      Object.keys(json).forEach(key => {
        if (key === 'Update_Date') return;

        const item = json[key];
        const isGold = key.toLowerCase().includes('altin') || 
                       key.toLowerCase().includes('gram') || 
                       key.toLowerCase().includes('ceyrek');

        // Filtreleme Mantığı
        if (activeTab === 'altin' && isGold) {
          items.push({
            id: key,
            name: key,
            price: item.Selling,
            change: item.Change,
            // API'den gelen veriye göre yön tayini
            direction: item.Change && item.Change.includes('-') ? 'down' : 'up'
          });
        } else if (activeTab === 'doviz' && !isGold) {
          // Önemli dövizleri listeye ekle
          const mainCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'JPY'];
          if (mainCurrencies.some(c => key.includes(c))) {
            items.push({
              id: key,
              name: key,
              price: item.Selling,
              change: item.Change,
              direction: item.Change && item.Change.includes('-') ? 'down' : 'up'
            });
          }
        }
      });

      setData(items);
    } catch (error) {
      console.error("Veri çekilemedi:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderItem = ({ item }) => {
    const isDown = item.direction === 'down';
    const color = isDown ? COLORS.down : COLORS.up;
    const icon = isDown ? 'arrow-down-outline' : 'arrow-up-outline';

    return (
      <View style={styles.card}>
        <View style={styles.leftSide}>
          <View style={[styles.iconBadge, { backgroundColor: color + '15' }]}>
            <Ionicons name={activeTab === 'doviz' ? 'cash-outline' : 'trending-up-outline'} size={24} color={color} />
          </View>
          <View>
            <Text style={styles.symbolText}>{item.name}</Text>
            <Text style={styles.updateText}>Türkiye Finans</Text>
          </View>
        </View>

        <View style={styles.rightSide}>
          <Text style={[styles.priceText, { color: COLORS.text }]}>{item.price} ₺</Text>
          <View style={[styles.changeBadge, { backgroundColor: color }]}>
            <Ionicons name={icon} size={14} color="#000" />
            <Text style={styles.changeText}>%{item.change || '0.00'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Piyasalar</Text>
          <Text style={{color: COLORS.gray, fontSize: 12}}>Canlı Veri Akışı</Text>
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="notifications-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'doviz' && styles.activeTab]} 
          onPress={() => { setLoading(true); setActiveTab('doviz'); }}
        >
          <Text style={[styles.tabText, activeTab === 'doviz' && styles.activeTabText]}>DÖVİZ</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'altin' && styles.activeTab]} 
          onPress={() => { setLoading(true); setActiveTab('altin'); }}
        >
          <Text style={[styles.tabText, activeTab === 'altin' && styles.activeTabText]}>ALTIN</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{color: COLORS.gray, marginTop: 10}}>Veriler Yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <Text style={{color: 'white', textAlign: 'center', marginTop: 20}}>Veri bulunamadı.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingVertical: 20 
  },
  headerTitle: { fontSize: 30, fontWeight: 'bold', color: COLORS.text },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.card, 
    marginHorizontal: 20, 
    borderRadius: 15, 
    padding: 6
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.gray, fontWeight: 'bold', fontSize: 15 },
  activeTabText: { color: '#000' },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: COLORS.card, 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 15,
    alignItems: 'center',
    elevation: 5 // Android gölge
  },
  leftSide: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: { padding: 12, borderRadius: 15, marginRight: 15 },
  symbolText: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  updateText: { color: COLORS.gray, fontSize: 12, marginTop: 3 },
  rightSide: { alignItems: 'flex-end' },
  priceText: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  changeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  changeText: { fontSize: 12, fontWeight: '900', marginLeft: 3, color: '#000' }
});
