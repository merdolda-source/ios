import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';

const COLORS = {
  bg: '#09090b',
  card: '#18181b',
  gold: '#eab308',
  green: '#22c55e',
  red: '#ef4444',
  text: '#ffffff'
};

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFromMyJson = async () => {
    try {
      // BURAYA KENDİ PHP LİNKİNİ YAZ (Örn: https)
      const response = await fetch('https://imdatgel.site/harem/'); 
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error("JSON çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFromMyJson();
    const timer = setInterval(fetchFromMyJson, 10000); // 10 saniyede bir sessizce yeniler
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>CANLI PİYASA</Text>
        <View style={styles.liveBadge}><Text style={styles.liveText}>CANLI</Text></View>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.k}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.symbol}>{item.k.replace('TRY', '')}</Text>
                <Text style={styles.time}>{item.t.split(' ')[1]}</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.price}>{item.s} ₺</Text>
                <Text style={{color: item.y === 1 ? COLORS.green : item.y === -1 ? COLORS.red : COLORS.text}}>
                  {item.y === 1 ? '▲ Yükselişte' : item.y === -1 ? '▼ Düşüşte' : '● Sabit'}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={{padding: 15}}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: COLORS.gold, fontSize: 22, fontWeight: '900' },
  liveBadge: { backgroundColor: COLORS.green + '20', padding: 5, borderRadius: 5 },
  liveText: { color: COLORS.green, fontSize: 10, fontWeight: 'bold' },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    backgroundColor: COLORS.card, 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272a'
  },
  symbol: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  time: { color: '#71717a', fontSize: 12 },
  price: { color: '#fff', fontSize: 20, fontWeight: 'bold' }
});
