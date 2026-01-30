name: EminXtream Final Rescue

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  publish-preview:
    runs-on: ubuntu-latest

    steps:
      - name: 🏗 Depoyu Çek
        uses: actions/checkout@v4

      # 1. TEMİZLİK
      - name: 🧹 Ön Temizlik
        run: rm -rf node_modules package-lock.json package.json eas.json babel.config.js app.json assets metro.config.js

      - name: 🏗 Node.js Kurulumu (v20)
        uses: actions/setup-node@v4
        with:
          node-version: 20

      # 2. PACKAGE.JSON (Gerekli tüm kütüphaneler)
      - name: 📄 package.json Oluştur
        run: |
          cat > package.json <<'JSON'
          {
            "name": "eminxtream",
            "version": "1.0.0",
            "main": "node_modules/expo/AppEntry.js",
            "dependencies": {
              "expo": "~54.0.0",
              "react": "19.0.0",
              "react-native": "0.78.0",
              "fs-extra": "^11.2.0",
              "expo-status-bar": "~2.1.0",
              "expo-constants": "~18.0.0",
              "expo-font": "~14.0.0",
              "expo-updates": "~0.27.0",
              "@expo/vector-icons": "~14.0.0",
              "@react-native-async-storage/async-storage": "2.1.0",
              "@react-navigation/native": "^7.0.0",
              "@react-navigation/stack": "^7.0.0",
              "react-native-safe-area-context": "4.12.0",
              "react-native-screens": "~4.0.0",
              "react-native-gesture-handler": "~2.20.2",
              "react-native-reanimated": "~3.16.1"
            },
            "devDependencies": {
              "@babel/core": "^7.25.0",
              "babel-preset-expo": "~13.0.0"
            },
            "private": true
          }
          JSON

      # 3. BABEL CONFIG (İŞTE EKSİK OLAN PARÇA BU!)
      - name: ⚙️ Babel Config Oluştur
        run: |
          cat > babel.config.js <<'JS'
          module.exports = function(api) {
            api.cache(true);
            return {
              presets: ['babel-preset-expo'],
            };
          };
          JS

      # 4. APP.JS (Kodu Garantilemek İçin Buradan Yazdırıyoruz)
      # Firebase'siz, Direkt Link Modu - En Güvenli Kod
      - name: 📱 App.js Oluştur
        run: |
          cat > App.js <<'JS'
          import React, { useState, useEffect } from 'react';
          import { StyleSheet, Text, View, FlatList, SafeAreaView, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';

          const DIRECT_URL = "https://imdatgel.site/harem/piyasa_cache.json";

          export default function App() {
            const [data, setData] = useState([]);
            const [loading, setLoading] = useState(true);
            const [status, setStatus] = useState("Başlatılıyor...");

            const veriCek = async () => {
              setLoading(true);
              setStatus("Sunucuya bağlanıyor...");
              try {
                const response = await fetch(DIRECT_URL, {
                  method: 'GET',
                  headers: { 'Cache-Control': 'no-cache' }
                });
                if (!response.ok) throw new Error("Hata: " + response.status);
                const json = await response.json();
                if (Array.isArray(json)) {
                  setData(json);
                  setStatus("");
                } else {
                  setStatus("Veri formatı hatalı");
                }
              } catch (e) {
                setStatus("HATA: " + e.message);
              } finally {
                setLoading(false);
              }
            };

            useEffect(() => { setTimeout(veriCek, 500); }, []);

            return (
              <SafeAreaView style={{flex:1, backgroundColor:'#000'}}>
                <StatusBar barStyle="light-content" />
                <View style={{padding:20, flexDirection:'row', justifyContent:'space-between', borderBottomWidth:1, borderColor:'#333'}}>
                  <Text style={{fontSize:24, fontWeight:'bold', color:'#FFF'}}>Piyasa Pro</Text>
                  <TouchableOpacity onPress={veriCek} style={{backgroundColor:'#FFD60A', padding:8, borderRadius:5}}>
                    <Text style={{fontWeight:'bold', color:'#000'}}>YENİLE</Text>
                  </TouchableOpacity>
                </View>
                {status ? <Text style={{color:'#F00', textAlign:'center', margin:10}}>{status}</Text> : null}
                {loading ? <ActivityIndicator size="large" color="#FFD60A" style={{marginTop:50}} /> : (
                  <FlatList
                    data={data}
                    keyExtractor={(item, index) => item?.k || index.toString()}
                    renderItem={({ item }) => (
                      <View style={{flexDirection:'row', justifyContent:'space-between', backgroundColor:'#1C1C1E', padding:16, margin:10, borderRadius:10}}>
                        <View>
                          <Text style={{color:'#FFF', fontSize:16, fontWeight:'700'}}>{item.k}</Text>
                          <Text style={{color:'#888', fontSize:12}}>{item.t?.split(' ')[1]}</Text>
                        </View>
                        <View style={{alignItems:'flex-end'}}>
                          <Text style={{color:'#FFD60A', fontSize:18, fontWeight:'bold'}}>{parseFloat(item.s).toFixed(2)} ₺</Text>
                          <Text style={{color:'#888', fontSize:12}}>Alış: {parseFloat(item.a).toFixed(2)}</Text>
                        </View>
                      </View>
                    )}
                  />
                )}
              </SafeAreaView>
            );
          }
          JS

      # 5. METRO CONFIG
      - name: ⚙️ Metro Config Oluştur
        run: |
          cat > metro.config.js <<'JS'
          const { getDefaultConfig } = require('expo/metro-config');
          const config = getDefaultConfig(__dirname);
          config.resolver.sourceExts.push('cjs');
          module.exports = config;
          JS

      # 6. APP.JSON
      - name: 📄 app.json Oluştur
        run: |
          cat > app.json <<'JSON'
          {
            "expo": {
              "name": "Piyasa Pro",
              "slug": "eminxtream",
              "version": "1.0.0",
              "orientation": "portrait",
              "userInterfaceStyle": "dark",
              "ios": {
                "bundleIdentifier": "com.eminxtream.app",
                "infoPlist": { "NSAppTransportSecurity": { "NSAllowsArbitraryLoads": true } }
              },
              "android": { "package": "com.eminxtream.app" },
              "updates": { "url": "https://u.expo.dev/7b7866e2-688e-4e87-af97-88213b2670d4" },
              "runtimeVersion": { "policy": "appVersion" },
              "extra": { "eas": { "projectId": "7b7866e2-688e-4e87-af97-88213b2670d4" } }
            }
          }
          JSON

      - name: 🖼 Assets Oluştur
        run: |
          mkdir -p assets
          :> assets/icon.png
          :> assets/splash.png
          :> assets/adaptive-icon.png
          :> assets/favicon.png

      - name: 📦 Paket Kurulumu
        run: |
          npm install -g eas-cli
          npm install --legacy-peer-deps

      - name: 🚀 Gönder
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
        run: |
          eas update --branch preview --message "Added Babel Config Fix" --non-interactive
