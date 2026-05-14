import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../theme/colors";

const CHARITY_TARGETS = [
  {
    key: "usaqlar_evi",
    title: "Uşaqlar evi",
    description: "Uşaqlar üçün yemək və dəstək istiqamətinə yönləndirilir.",
    icon: "home",
    accent: "#1B5E20",
  },
  {
    key: "qocalar_evi",
    title: "Qocalar evi",
    description: "Yaşlılar üçün ayrılmış dəstək proqramı ilə davam edir.",
    icon: "home-heart",
    accent: "#8E24AA",
  },
  {
    key: "ehtiyac_sahibleri",
    title: "Ehtiyac sahibləri",
    description: "Birbaşa ehtiyaclı ailələr üçün yardım bölməsi.",
    icon: "handshake",
    accent: "#1565C0",
  },
];

export default function NeedSupportScreen({ navigation }) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const insets = useSafeAreaInsets();

  const selectedItem = useMemo(
    () => CHARITY_TARGETS.find((item) => item.key === selectedTarget) ?? null,
    [selectedTarget],
  );

  const handleContinue = () => {
    if (!selectedItem) return;

    navigation.navigate("NeedSupportDetail", {
      target: selectedItem.key,
      label: selectedItem.title,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <MaterialCommunityIcons
              name="hand-heart-outline"
              size={36}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.heroTitle}>Xeyriyyə yönünü seçin</Text>
          <Text style={styles.heroText}>
            Davam etmək üçün aşağıdakı 3 seçimdən birini seçin. Sonrakı səhifə
            bu seçimə görə açılacaq.
          </Text>
        </View>

        <View style={styles.cardsList}>
          {CHARITY_TARGETS.map((item, index) => {
            const active = selectedTarget === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.targetCard,
                  active && {
                    borderColor: item.accent,
                    backgroundColor: Colors.primarySurface,
                  },
                ]}
                onPress={() => setSelectedTarget(item.key)}
                activeOpacity={0.9}
              >
                <View
                  style={[
                    styles.cardIconWrap,
                    { backgroundColor: `${item.accent}14` },
                  ]}
                >
                  {/* Əsas Dolu Ev İkonu */}
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={40} // Evi bir az daha böyütdüm ki, içindəki boşluq artsın
                    color={item.accent}
                  />

                  {item.key === "usaqlar_evi" && (
                    <View
                      style={{
                        position: "absolute",
                        alignSelf: "center",
                        top: 13, // Evin mərkəzinə görə tənzimləmə
                        backgroundColor: "#1B5E20", // Arxa fon üçün yaşıl rəng
                        width: 24,
                        height: 24,
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="flower"
                        size={18}
                        color="#FFFFFF" // Yaşılın üzərində ağ gül
                      />
                    </View>
                  )}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardHeaderRow}>
                    <Text
                      style={[
                        styles.cardTitle,
                        active && { color: item.accent },
                      ]}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                </View>

                <View
                  style={[styles.radio, active && { borderColor: item.accent }]}
                >
                  {active ? (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: item.accent },
                      ]}
                    />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[styles.button, !selectedTarget && styles.buttonDisabled]}
          disabled={!selectedTarget}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Seçin</Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={Colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.bottomHint}>
          {selectedItem
            ? `${selectedItem.title} seçildi`
            : "Bir seçim edin və davam edin"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 14,
    gap: 14,
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  cardsList: {
    gap: 12,
  },
  targetCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
    paddingRight: 6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  cardIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    textAlign: "center",
    textAlignVertical: "center",
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  button: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  bottomHint: {
    marginTop: 8,
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
