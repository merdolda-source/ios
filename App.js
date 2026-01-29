import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#050710',
  card: '#111320',
  primary: '#00E5FF',
  text: '#FFF',
  gray: '#A0A0A0'
};

export default function App() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseAmount, setBaseAmount] = useState('1');

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      // Herhangi bir anahtar gerektirmeyen ücretsiz API
      const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/try.json');
      const data = await response.json();
      
      // JSON içindeki TRY objesini alıp liste formatına çeviriyoruz
      const currencyList = Object.entries(data.try).map(([code, value]) => ({
        code: code.toUpperCase(),
        value: (1 / value).toFixed(4) // TL bazlı göstermek için tersini alıyoruz
      })).filter(item => ['USD', 'EUR', 'GBP', 'BTC', 'GOLD'].includes(item.code)); // Önemli olanları seç

      setRates(currencyList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Döviz Takip</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Miktar (TL)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={baseAmount}
          onChangeText={setBaseAmount}
          placeholderTextColor={COLORS.gray}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={rates}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.currencyCode}>{item.code}</Text>
                <Text style={styles.grayText}>1 {item.code} = {item.value} TRY</Text>
              </View>
              <Text style={styles.resultText}>
                {(parseFloat(baseAmount || 0) / parseFloat(item.value)).toFixed(2)}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginVertical: 20 },
  inputContainer: { marginBottom: 20, paddingHorizontal: 10 },
  label: { color: COLORS.gray, marginBottom: 5 },
  input: { backgroundColor: COLORS.card, color: '#fff', padding: 15, borderRadius: 10, fontSize: 18 },
  card: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: COLORS.card, 
    padding: 20, 
    borderRadius: 15, 
    marginBottom: 10 
  },
  currencyCode: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  grayText: { color: COLORS.gray, fontSize: 12 },
  resultText: { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' }
});
