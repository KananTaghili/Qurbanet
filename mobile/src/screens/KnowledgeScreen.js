import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Colors } from "../theme/colors";
import api from "../config/api";

export default function KnowledgeScreen() {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/orders/knowledge");
        setInfo(res.data.data.info);
      } catch (err) {
        setInfo(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Məlumatlandırıcı bölmə</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Qurbanın əhkamları</Text>
        {(info?.qurbanEhkami || []).map((item, idx) => (
          <Text key={String(idx)} style={styles.itemText}>
            • {item}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Qurban tipləri</Text>
        {(info?.qurbanTipleri || []).map((item) => (
          <Text key={item.type} style={styles.itemText}>
            • {item.nameAz}: {item.description}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Yetimləri Sevindir</Text>
        <Text style={styles.itemText}>
          {info?.yetimleriSevindir?.description}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 24 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { color: Colors.primary, fontWeight: "700", marginBottom: 8 },
  itemText: { color: Colors.textPrimary, lineHeight: 20, marginBottom: 5 },
});
