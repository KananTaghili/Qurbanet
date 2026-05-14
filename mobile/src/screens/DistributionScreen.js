import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../theme/colors";
import OrderStepHeader from "../components/OrderStepHeader";
import useCategoryActiveGuard from "../hooks/useCategoryActiveGuard";

const DISTRIBUTION_OPTIONS = [
  {
    key: "catdirilsin",
    icon: "truck-delivery-outline",
    title: "Sizə çatdırılsın",
  },
  { key: "ozun_gotur", icon: "storefront-outline", title: "Özünüz götürün" },
];

export default function DistributionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <OrderStepHeader currentStep={2} />
        <Text style={styles.sectionTitle}>Ət paylanması</Text>

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
            <View
              style={[
                styles.optionIconWrap,
                selected === option.key && styles.optionIconWrapSelected,
              ]}
            >
              <MaterialCommunityIcons
                name={option.icon}
                size={20}
                color={selected === option.key ? Colors.white : Colors.primary}
              />
            </View>
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
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.button,
          styles.buttonFloating,
          { bottom: insets.bottom + 10 },
          !isValid && styles.buttonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!isValid}
      >
        <View style={styles.buttonContentRow}>
          <Text style={styles.buttonText}>Ödəniş</Text>
          <MaterialCommunityIcons
            name="chevron-double-right"
            size={28}
            color={Colors.white}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
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
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primarySurface,
  },
  optionIconWrapSelected: {
    backgroundColor: Colors.primary,
  },
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
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    width: "48.5%",
  },
  buttonFloating: {
    position: "absolute",
    right: 16,
  },
  buttonContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 16,
    paddingLeft: 7,
  },
});
