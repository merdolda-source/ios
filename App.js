import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, SafeAreaView } from 'react-native';
import { load } from 'cheerio'; // HTML parçalayıcı

export default function DirectScraper() {
  const [data, setData] = useState([]);

  const scrapeDirectly = async () => {
    try {
      // 1. Web sitesinin HTML kodunu indir
      const response = await fetch('https://canlidoviz.com/altin-fiyatlari/');
      const htmlString = await response.text();

      // 2. Cheerio ile HTML'i işle (Tıpkı JQuery gibi)
      const $ = load(htmlString);
      const list = [];

      // Sitedeki tablo satırlarını bul (Seçiciler sitenin yapısına göre değişir)
      $('table tbody tr').each((i, el) => {
        const name = $(el).find('td').eq(0).text().trim();
        const buy = $(el).find('td').eq(1).text().trim();
        const sell = $(el).find('td').eq(2).text().trim();

        if (name) {
          list.push({ id: i.toString(), name, buy, sell });
        }
      });

      setData(list);
    } catch (error) {
      console.error("Doğrudan çekim hatası:", error);
    }
  };

  useEffect(() => { scrapeDirectly(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <View style={{ padding: 15, borderBottomWidth: 1, borderColor: '#333' }}>
            <Text style={{ color: '#fff' }}>{item.name}</Text>
            <Text style={{ color: '#fbbf24' }}>Satış: {item.sell}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
