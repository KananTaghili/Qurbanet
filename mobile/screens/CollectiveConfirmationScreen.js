import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Heart } from "lucide-react-native";
import api from "../lib/api";

const PURPLE_MID = "#5b21b6";

export default function CollectiveConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { campaignId, amount } = route.params || {};
  const [campaign, setCampaign] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  useEffect(() => {
    if (!campaignId) return;
    api.get(`/campaigns/${campaignId}`)
      .then((res) => setCampaign(res.data?.data || null))
      .catch(() => {});
  }, [campaignId]);

  const displayAmount = amount || "";
  const percent = campaign && Number(campaign.totalAmount) > 0
    ? Math.round((Number(displayAmount) / Number(campaign.totalAmount)) * 100)
    : null;

  const handleViewCampaign = () => {
    navigation.reset({
      index: 1,
      routes: [{ name: "CollectiveQurban" }, { name: "CampaignDetail", params: { campaignId } }],
    });
  };
  const handleGoHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "CollectiveQurban" }] });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}>
        <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
          <View style={styles.heroIcon}>
            <Heart size={28} color="#fff" fill="#fff" />
          </View>
          <Text style={styles.heroTitle}>İanəniz qəbul edildi!</Text>
        </View>

        <View style={{ padding: 16, gap: 10 }}>
          {campaign && (
            <View style={styles.campaignCard}>
              {campaign.animal?.image ? (
                <Image source={{ uri: campaign.animal.image }} style={styles.campaignImg} resizeMode="cover" />
              ) : (
                <View style={[styles.campaignImg, { backgroundColor: "#fff" }]} />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.campaignName} numberOfLines={1}>{campaign.animal?.nameAz} Qurbanı</Text>
                {!!displayAmount && (
                  <Text style={styles.campaignAmount}>
                    {displayAmount} AZN
                    {percent != null && <Text style={styles.campaignPercent}>  · {percent}%</Text>}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.duaBox}>
            <Text style={{ fontSize: 20, marginBottom: 4 }}>✅</Text>
            <Text style={styles.duaText}>Sədəqəniz Allah qatında qəbul olsun!{"\n"}Allah sizdən razı olsun!</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {!!campaignId && (
            <Pressable style={styles.primaryBtn} onPress={handleViewCampaign}>
              <Text style={styles.primaryBtnText}>Qurbanınızı izləyin</Text>
            </Pressable>
          )}
          <Pressable style={styles.outlineBtn} onPress={handleGoHome}>
            <Text style={styles.outlineBtnText}>Əsas səhifəyə qayıt</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  hero: { alignItems: "center", paddingBottom: 20, paddingHorizontal: 20, backgroundColor: "#4513ad" },
  heroIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroTitle: { fontSize: 20, fontWeight: "900", color: "#fff", textAlign: "center" },

  campaignCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#f5f3ff", borderWidth: 1, borderColor: "#ede9fe", borderRadius: 14, padding: 10 },
  campaignImg: { width: 42, height: 42, borderRadius: 10 },
  campaignName: { fontSize: 14, fontWeight: "900", color: "#33245f" },
  campaignAmount: { fontSize: 12.5, fontWeight: "700", color: PURPLE_MID, marginTop: 2 },
  campaignPercent: { fontSize: 11.5, fontWeight: "600", color: "#7c6fa0" },

  duaBox: { backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#d1fae5", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  duaText: { fontSize: 12.5, fontWeight: "600", color: "#065f46", textAlign: "center", lineHeight: 18 },

  primaryBtn: { backgroundColor: PURPLE_MID, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 13.5, fontWeight: "800" },
  outlineBtn: { borderWidth: 2, borderColor: "#e9d5ff", borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  outlineBtnText: { color: PURPLE_MID, fontSize: 13.5, fontWeight: "800" },
});
