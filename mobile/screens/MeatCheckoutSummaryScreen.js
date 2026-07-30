import { useCallback, useEffect, useState } from "react";
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MapPin, ShoppingBag, CreditCard, ChevronRight, Beef } from "lucide-react-native";
import { useMeatCart } from "../context/MeatCartContext";
import { useMeatDeliveryLocation } from "../context/MeatDeliveryLocationContext";
import { useAuth } from "../context/AuthContext";
import MeatStepHeader from "../components/meat/MeatStepHeader";
import api from "../lib/api";

const BRAND = "#4B0F0F";
const TINT = "#F1E5E5";

export default function MeatCheckoutSummaryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { items, itemsTotal, markOrderPending, clearOrderPending, removeUnavailableItems } = useMeatCart();
  const { location, deliveryPrice: deliveryFee } = useMeatDeliveryLocation();
  const { user, isGuest } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hasValidPhones = Boolean(location?.phones?.length);

  // Web-dəki kimi: bu ekrana keçərkən vəziyyət etibarsızdırsa (səbət boşdur,
  // ünvan seçilməyib, telefon yoxdur) uyğun ekrana geri göndərir.
  useFocusEffect(
    useCallback(() => {
      if (isGuest) {
        navigation.replace("Login");
        return;
      }
      if (items.length === 0 || !location) {
        navigation.replace("MeatHome");
      } else if (!hasValidPhones) {
        navigation.replace("MeatProducts");
      }
    }, [isGuest, items.length, location, hasValidPhones]),
  );

  if (isGuest || items.length === 0 || !location || !hasValidPhones) return null;

  const total = itemsTotal + deliveryFee;

  const handleConfirm = async () => {
    setError("");
    setSubmitting(true);
    const lineIds = items.map((i) => i.lineId);
    markOrderPending(lineIds);
    try {
      const res = await api.post("/meat/orders", {
        items: items.map((i) => ({
          animalKey: i.animalKey,
          partKey: i.partKey,
          cutId: i.cutId,
          quantityKg: i.quantityKg,
        })),
        deliveryLocation: location,
        contactInfo: {
          firstName: user?.name || "",
          lastName: user?.lastName || "",
          mobile: location.phones[0],
          additionalMobiles: location.phones.slice(1),
        },
      });
      if (res.data.success) {
        const order = res.data.data.order;
        // DİQQƏT: səbət burada TƏMİZLƏNMİR — ödəniş hələ təsdiqlənməyib
        // (yalnız sifariş yaradılıb). Bax [[project-unpaid-orders-hidden]] —
        // ödəniş təsdiqlənməyən sifariş "Sifarişlərim"də görünmür. Səbət
        // yalnız MeatCheckoutPaymentScreen-də, ödəniş TƏSDİQLƏNƏNDƏ təmizlənir.
        navigation.replace("MeatCheckoutPayment", {
          orderId: order._id,
          totalPrice: order.totalPrice,
        });
        return;
      }
      setError(res.data.message || "Sifariş yaradıla bilmədi.");
    } catch (err) {
      const unavailableItems = err.response?.data?.errors;
      if (Array.isArray(unavailableItems) && unavailableItems.length > 0) {
        removeUnavailableItems(unavailableItems);
      } else {
        setError(err.response?.data?.message || "Sifariş yaradıla bilmədi.");
      }
    }
    clearOrderPending(lineIds);
    setSubmitting(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MeatStepHeader currentStep={2} />

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <Text style={styles.pageTitle}>Sifariş xülasəsi</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <ShoppingBag size={19} color={BRAND} strokeWidth={2.2} />
              <Text style={styles.cardHeaderText}>Səbətdəki məhsullar</Text>
            </View>
            <View style={styles.cardHeaderChip}>
              <Text style={styles.cardHeaderChipText}>{items.length} məhsul</Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {items.map((it) => (
              <View key={it.lineId} style={styles.itemRow}>
                <View style={styles.itemImgWrap}>
                  {it.imageUrl ? (
                    <Image source={{ uri: it.imageUrl }} style={styles.itemImg} resizeMode="cover" />
                  ) : (
                    <Beef size={26} color="rgba(75,15,15,0.7)" />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.itemName} numberOfLines={2}>{it.cutNameAz}</Text>
                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemMeta} numberOfLines={1}>{it.animalNameAz} • {it.partNameAz}</Text>
                    <Text style={styles.itemLineTotal}>
                      {(it.pricePerKg * it.quantityKg).toFixed(2)} AZN
                    </Text>
                  </View>
                  <View style={styles.itemQtyRow}>
                    <Text style={styles.itemQtyLabel}>Miqdar:</Text>
                    <Text style={styles.itemQtyValue}>
                      {it.quantityKg.toFixed(2)} kq × {it.pricePerKg} AZN
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardHeader, { backgroundColor: "#fff", borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.addrRow}>
              <View style={styles.addrIconWrap}>
                <MapPin size={20} color={BRAND} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.addrLabel}>Çatdırılma ünvanı</Text>
                <Text style={styles.addrValue} numberOfLines={2}>{location.address}</Text>
                <Text style={styles.addrSub}>{location.cityNameAz}, {location.countryNameAz}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardBody, { paddingTop: 14 }]}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Məhsulların məbləği</Text>
              <Text style={styles.priceValue}>{itemsTotal.toFixed(2)} AZN</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Çatdırılma haqqı</Text>
              <Text style={styles.priceValue}>{deliveryFee.toFixed(2)} AZN</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Yekun məbləğ</Text>
              <Text style={styles.totalValue}>{total.toFixed(2)} AZN</Text>
            </View>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.confirmBtnText}>Sifariş təsdiqlənir...</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                <CreditCard size={20} color="#fff" strokeWidth={2.2} />
                <Text style={styles.confirmBtnText}>Sifarişi təsdiqlə</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={styles.confirmBtnAmountChip}>
                  <Text style={styles.confirmBtnAmountText}>{total.toFixed(2)} AZN</Text>
                </View>
                <ChevronRight size={20} color="#fff" strokeWidth={2.2} />
              </View>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF8F5" },
  pageTitle: { fontSize: 21, fontWeight: "900", color: "#292524" },

  card: { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: "#E7E2DA", overflow: "hidden" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: TINT,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardHeaderText: { fontSize: 15.5, fontWeight: "800", color: BRAND, textTransform: "uppercase" },
  cardHeaderChip: { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 },
  cardHeaderChipText: { color: "#6b1717", fontSize: 14, fontWeight: "700" },
  cardBody: { paddingHorizontal: 16, paddingBottom: 16 },

  itemsList: { padding: 13, gap: 11, backgroundColor: "#FBF8F4" },
  itemRow: {
    flexDirection: "row",
    gap: 13,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(231,226,218,0.7)",
  },
  itemImgWrap: { width: 66, height: 66, borderRadius: 13, backgroundColor: TINT, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  itemImg: { width: "100%", height: "100%" },
  itemName: { fontSize: 16, fontWeight: "800", color: "#292524" },
  itemMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 3 },
  itemMeta: { flex: 1, fontSize: 13.5, color: "#78716C" },
  itemLineTotal: { fontSize: 15, fontWeight: "900", color: BRAND },
  itemQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "rgba(231,226,218,0.6)",
  },
  itemQtyLabel: { fontSize: 13, color: "#A8A29E" },
  itemQtyValue: { fontSize: 14, fontWeight: "700", color: "#292524" },

  addrRow: { flexDirection: "row", alignItems: "flex-start", gap: 13, flex: 1 },
  addrIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: TINT, alignItems: "center", justifyContent: "center" },
  addrLabel: { fontSize: 13, fontWeight: "800", color: "#78716C", textTransform: "uppercase" },
  addrValue: { fontSize: 16.5, fontWeight: "800", color: "#292524", marginTop: 3 },
  addrSub: { fontSize: 14, fontWeight: "600", color: "#A8A29E", marginTop: 3 },

  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 9 },
  priceLabel: { fontSize: 15, color: "#78716C" },
  priceValue: { fontSize: 15, fontWeight: "700", color: "#292524" },
  totalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingTop: 11,
    marginTop: 3,
    borderTopWidth: 1,
    borderTopColor: "#F3F0EA",
  },
  totalLabel: { fontSize: 16, fontWeight: "800", color: "#292524" },
  totalValue: { fontSize: 22, fontWeight: "900", color: BRAND },

  errorBox: { borderRadius: 12, borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2", padding: 13 },
  errorText: { color: "#b91c1c", fontSize: 15, fontWeight: "700" },

  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 19,
  },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  confirmBtnAmountChip: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 11, paddingVertical: 6 },
  confirmBtnAmountText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});
