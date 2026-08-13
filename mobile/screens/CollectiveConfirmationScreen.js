import { useEffect, useState, useCallback } from "react";
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Platform } from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { Heart } from "lucide-react-native";
import api from "../lib/api";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const PURPLE_MID = "#5b21b6";

export default function CollectiveConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { lang } = useLanguage();
  const { campaignId, amount, role } = route.params || {};
  const [campaign, setCampaign] = useState(null);
  const isOpener = role === "opener";

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
            <Heart size={30} color="#fff" fill="#fff" />
          </View>
          <Text style={styles.heroTitle}>{t(lang, isOpener ? "collectiveConfirm_heroTitleOpener" : "collectiveConfirm_heroTitle")}</Text>
        </View>

        <View style={{ padding: scale(16), gap: scale(10) }}>
          {campaign && (
            <View style={styles.campaignCard}>
              {campaign.animal?.image ? (
                <Image source={{ uri: campaign.animal.image }} style={styles.campaignImg} resizeMode="cover" />
              ) : (
                <View style={[styles.campaignImg, { backgroundColor: "#fff" }]} />
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.campaignName} numberOfLines={1}>{campaign.animal?.nameAz} {t(lang, "collectiveConfirm_campaignSuffix")}</Text>
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
            <Text style={{ fontSize: scaleFont(20), marginBottom: scale(4) }}>✅</Text>
            <Text style={styles.duaText}>{t(lang, "collectiveConfirm_duaText")}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ paddingHorizontal: scale(16), gap: scale(10) }}>
          {!!campaignId && (
            <Pressable style={styles.primaryBtn} onPress={handleViewCampaign}>
              <Text style={styles.primaryBtnText}>{t(lang, "collectiveConfirm_viewBtn")}</Text>
            </Pressable>
          )}
          <Pressable style={styles.outlineBtn} onPress={handleGoHome}>
            <Text style={styles.outlineBtnText}>{t(lang, "collectiveConfirm_homeBtn")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  hero: { alignItems: "center", paddingBottom: scale(22), paddingHorizontal: scale(20), backgroundColor: "#4513ad" },
  heroIcon: { width: scale(64), height: scale(64), borderRadius: scale(32), backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: scale(13) },
  heroTitle: { fontSize: scaleFont(22), fontWeight: "900", color: "#fff", textAlign: "center" },

  campaignCard: { flexDirection: "row", alignItems: "center", gap: scale(10), backgroundColor: "#f5f3ff", borderWidth: 1, borderColor: "#ede9fe", borderRadius: scale(14), padding: scale(11) },
  campaignImg: { width: scale(46), height: scale(46), borderRadius: scale(11) },
  campaignName: { fontSize: scaleFont(15.5), fontWeight: "900", color: "#33245f" },
  campaignAmount: { fontSize: scaleFont(14), fontWeight: "700", color: PURPLE_MID, marginTop: scale(2) },
  campaignPercent: { fontSize: scaleFont(13), fontWeight: "600", color: "#7c6fa0" },

  duaBox: { backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#d1fae5", borderRadius: scale(14), paddingVertical: scale(15), alignItems: "center" },
  duaText: { fontSize: scaleFont(14), fontWeight: "600", color: "#065f46", textAlign: "center", lineHeight: moderateScale(20) },

  primaryBtn: { backgroundColor: PURPLE_MID, borderRadius: scale(14), paddingVertical: scale(15), alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "800" },
  outlineBtn: { borderWidth: 2, borderColor: "#e9d5ff", borderRadius: scale(14), paddingVertical: scale(14), alignItems: "center" },
  outlineBtnText: { color: PURPLE_MID, fontSize: scaleFont(15), fontWeight: "800" },
});
