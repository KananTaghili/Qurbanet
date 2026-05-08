import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";
import OrderStepHeader from "../components/OrderStepHeader";
import useCategoryActiveGuard from "../hooks/useCategoryActiveGuard";

const DISTRIBUTION_OPTIONS = [
  { key: "catdirilsin", icon: "🚚", title: "Sizə çatdırılsın" },
  { key: "ozun_gotur", icon: "🏠", title: "Özünüz götürün" },
  { key: "usaqlar_evi", icon: "🏫", title: "Uşaqlar evinə verilsin" },
  { key: "qocalar_evi", icon: "👵", title: "Qocalar evinə verilsin" },
  {
    key: "ehtiyac_sahibleri",
    icon: "🤲",
    title: "Ehtiyac sahiblərinə paylanılsın",
  },
];

const CHARITY_TARGETS = [
  { key: "usaqlar_evi", label: "Uşaqlar evi" },
  { key: "qocalar_evi", label: "Qocalar evi" },
  { key: "ehtiyac_sahibleri", label: "Ehtiyac sahibləri" },
];

export default function DistributionScreen({ navigation, route }) {
  const { user } = useAuth();
  const draft = route.params || {};
  useCategoryActiveGuard({
    animalType: draft?.animal?.type,
    navigation,
    enabled: !!draft?.animal?.type,
  });

  const [selected, setSelected] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(
    route.params?.pickedLocation || null,
  );
  const [contactInfo, setContactInfo] = useState(null);
  const [orphanEnabled, setOrphanEnabled] = useState(false);
  const [orphanTarget, setOrphanTarget] = useState("usaqlar_evi");
  const [orphanAmount, setOrphanAmount] = useState("0");

  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem("contact_info");
      if (raw) {
        setContactInfo(JSON.parse(raw));
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (route.params?.pickedLocation) {
      setDeliveryLocation(route.params.pickedLocation);
    }
  }, [route.params?.pickedLocation]);

  const needsLocation = selected === "catdirilsin";
  const isValid = selected && (!needsLocation || !!deliveryLocation?.address);

  const handleContinue = () => {
    if (!isValid) return;

    const nextDraft = {
      ...draft,
      distribution: {
        type: selected,
        location: needsLocation ? deliveryLocation?.address : undefined,
        coordinates: needsLocation ? deliveryLocation?.coordinates : undefined,
      },
      orphanDelight: {
        enabled: orphanEnabled,
        target: orphanTarget,
        extraAmount: orphanEnabled ? Number(orphanAmount || 0) : 0,
      },
    };

    if (
      contactInfo?.firstName &&
      contactInfo?.lastName &&
      contactInfo?.mobile
    ) {
      navigation.navigate("OrderSummary", {
        draft: {
          ...nextDraft,
          contactInfo,
        },
      });
      return;
    }

    navigation.navigate("ContactInfo", {
      draft: nextDraft,
      initialContact: {
        firstName: user?.name || "",
        lastName: user?.lastName || "",
        mobile: user?.phone || "",
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OrderStepHeader currentStep={2} />
      <Text style={styles.sectionTitle}>Çatdırılma seç</Text>

      {DISTRIBUTION_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.optionCard,
            selected === option.key && styles.optionCardSelected,
          ]}
          onPress={() => setSelected(option.key)}
          activeOpacity={0.85}
        >
          <Text style={styles.optionIcon}>{option.icon}</Text>
          <Text style={styles.optionTitle}>{option.title}</Text>
        </TouchableOpacity>
      ))}

      {selected === "catdirilsin" ? (
        <View style={styles.card}>
          <Text style={styles.label}>Çatdırılma ünvanı</Text>
          <Text style={styles.deliveryFreeText}>Çatdırılma pulsuzdur</Text>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() =>
              navigation.navigate("DeliveryLocationPicker", {
                initialLocation: deliveryLocation,
                animalType: draft?.animal?.type,
              })
            }
          >
            <Text style={styles.mapBtnText}>Xəritədə konum seç</Text>
          </TouchableOpacity>
          <Text style={styles.addressPreview}>
            {deliveryLocation?.address || "Hələ ünvan seçilməyib"}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Yetimləri Sevindir</Text>
        <TouchableOpacity
          style={styles.toggle}
          onPress={() => setOrphanEnabled((v) => !v)}
        >
          <Text style={styles.toggleText}>
            {orphanEnabled ? "Aktivdir" : "Aktiv et"}
          </Text>
        </TouchableOpacity>

        {orphanEnabled ? (
          <>
            <View style={styles.rowWrap}>
              {CHARITY_TARGETS.map((target) => (
                <TouchableOpacity
                  key={target.key}
                  style={[
                    styles.chip,
                    orphanTarget === target.key && styles.chipActive,
                  ]}
                  onPress={() => setOrphanTarget(target.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      orphanTarget === target.key && styles.chipTextActive,
                    ]}
                  >
                    {target.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={orphanAmount}
              onChangeText={setOrphanAmount}
              placeholder="Əlavə ödəniş (AZN)"
            />
          </>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.button, !isValid && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!isValid}
      >
        <Text style={styles.buttonText}>Növbəti: Ödəniş seç</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 30 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  optionIcon: { fontSize: 22 },
  optionTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: "700",
    marginBottom: 8,
  },
  mapBtn: {
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  mapBtnText: { color: Colors.primary, fontWeight: "700" },
  deliveryFreeText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  addressPreview: { marginTop: 8, color: Colors.textSecondary, fontSize: 12 },
  toggle: {
    backgroundColor: Colors.accentLight,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  toggleText: { color: Colors.primaryDark, fontWeight: "700" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  chipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: Colors.primary },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 14,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
});
