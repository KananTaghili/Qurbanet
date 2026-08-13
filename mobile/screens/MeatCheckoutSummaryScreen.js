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
import MobileGrowModal from "../components/meat/MobileGrowModal";
import MeatDeliveryLocationModal from "../components/meat/MeatDeliveryLocationModal";
import api from "../lib/api";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#4B0F0F";
const TINT = "#F1E5E5";

export default function MeatCheckoutSummaryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { items, itemsTotal, markOrderPending, clearOrderPending, removeUnavailableItems } = useMeatCart();
  const { location, setLocation, deliveryPrice: deliveryFee } = useMeatDeliveryLocation();
  const { user, isGuest } = useAuth();
  const { lang } = useLanguage();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  const hasValidPhones = Boolean(location?.phones?.length);

  // Web-dəki kimi: bu ekrana keçərkən vəziyyət etibarsızdırsa (səbət boşdur,
  // ünvan seçilməyib, telefon yoxdur) uyğun ekrana geri göndərir.
  useFocusEffect(
    useCallback(() => {
      if (isGuest) {
        navigation.replace("MeatOrderContact");
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
      setError(res.data.message || t(lang, "meatCheckout_orderFailed"));
    } catch (err) {
      const unavailableItems = err.response?.data?.errors;
      if (Array.isArray(unavailableItems) && unavailableItems.length > 0) {
        removeUnavailableItems(unavailableItems);
        const names = unavailableItems.map((u) => `"${u.name}"`).join(", ");
        setError(`${names} artıq stokda qalmayıb — səbətdən silindi.`);
      } else {
        setError(err.response?.data?.message || t(lang, "meatCheckout_orderFailed"));
      }
    }
    clearOrderPending(lineIds);
    setSubmitting(false);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <MeatStepHeader currentStep={2} backTo="MeatProducts" />

      <ScrollView contentContainerStyle={{ padding: scale(14), paddingBottom: insets.bottom + 24, gap: scale(12) }}>
        <Text style={styles.pageTitle}>{t(lang, "orderSummary")}</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <ShoppingBag size={19} color={BRAND} strokeWidth={2.2} />
              <Text style={styles.cardHeaderText}>{t(lang, "meatCheckout_cartItemsTitle")}</Text>
            </View>
            <View style={styles.cardHeaderChip}>
              <Text style={styles.cardHeaderChipText}>{items.length} {t(lang, "meatCheckout_productsUnit")}</Text>
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
                    <Text style={styles.itemQtyLabel}>{t(lang, "meatCheckout_qtyLabel")}</Text>
                    <Text style={styles.itemQtyValue}>
                      {it.quantityKg.toFixed(2)} {t(lang, "kgUnit")} × {it.pricePerKg} AZN
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.card} onPress={() => setDeliveryOpen(true)}>
          <View style={[styles.cardHeader, { backgroundColor: "#fff", borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.addrRow}>
              <View style={styles.addrIconWrap}>
                <MapPin size={20} color={BRAND} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.addrLabel}>{t(lang, "deliveryAddress")}</Text>
                <Text style={styles.addrValue} numberOfLines={2}>{location.address}</Text>
                <Text style={styles.addrSub}>{location.cityNameAz}, {location.countryNameAz}</Text>
              </View>
              <ChevronRight size={19} color="#A8A29E" strokeWidth={2.2} style={{ marginTop: scale(4) }} />
            </View>
          </View>
        </Pressable>

        <View style={styles.card}>
          <View style={[styles.cardBody, { paddingTop: scale(14) }]}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t(lang, "meatCheckout_productsAmount")}</Text>
              <Text style={styles.priceValue}>{itemsTotal.toFixed(2)} AZN</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t(lang, "deliveryFeeLabel")}</Text>
              <Text style={styles.priceValue}>{deliveryFee.toFixed(2)} AZN</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t(lang, "meatCheckout_finalAmount")}</Text>
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: scale(8) }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.confirmBtnText}>{t(lang, "meatCheckout_confirming")}</Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(9) }}>
                <CreditCard size={20} color="#fff" strokeWidth={2.2} />
                <Text style={styles.confirmBtnText}>{t(lang, "meatCheckout_confirmBtn")}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                <View style={styles.confirmBtnAmountChip}>
                  <Text style={styles.confirmBtnAmountText}>{total.toFixed(2)} AZN</Text>
                </View>
                <ChevronRight size={20} color="#fff" strokeWidth={2.2} />
              </View>
            </>
          )}
        </Pressable>
      </ScrollView>

      <MobileGrowModal
        open={deliveryOpen}
        anchor={{ x: 0, y: 0 }}
        onClose={() => setDeliveryOpen(false)}
        panelHeight="82%"
      >
        <MeatDeliveryLocationModal
          initialLocation={location}
          defaultPhone={user?.phone}
          onClose={() => setDeliveryOpen(false)}
          onConfirm={(loc) => {
            setLocation(loc);
            setDeliveryOpen(false);
          }}
        />
      </MobileGrowModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF8F5" },
  pageTitle: { fontSize: scaleFont(21), fontWeight: "900", color: "#292524" },

  card: { backgroundColor: "#fff", borderRadius: scale(18), borderWidth: 1, borderColor: "#E7E2DA", overflow: "hidden" },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(13),
    backgroundColor: TINT,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: scale(10) },
  cardHeaderText: { fontSize: scaleFont(15.5), fontWeight: "800", color: BRAND, textTransform: "uppercase" },
  cardHeaderChip: { backgroundColor: "rgba(255,255,255,0.7)", borderRadius: scale(999), paddingHorizontal: scale(11), paddingVertical: scale(5) },
  cardHeaderChipText: { color: "#6b1717", fontSize: scaleFont(14), fontWeight: "700" },
  cardBody: { paddingHorizontal: scale(16), paddingBottom: scale(16) },

  itemsList: { padding: scale(13), gap: scale(11), backgroundColor: "#FBF8F4" },
  itemRow: {
    flexDirection: "row",
    gap: scale(13),
    padding: scale(12),
    borderRadius: scale(14),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(231,226,218,0.7)",
  },
  itemImgWrap: { width: scale(66), height: scale(66), borderRadius: scale(13), backgroundColor: TINT, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  itemImg: { width: "100%", height: "100%" },
  itemName: { fontSize: scaleFont(16), fontWeight: "800", color: "#292524" },
  itemMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: scale(8), marginTop: scale(3) },
  itemMeta: { flex: 1, fontSize: scaleFont(13.5), color: "#78716C" },
  itemLineTotal: { fontSize: scaleFont(15), fontWeight: "900", color: BRAND },
  itemQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: scale(9),
    paddingTop: scale(9),
    borderTopWidth: 1,
    borderTopColor: "rgba(231,226,218,0.6)",
  },
  itemQtyLabel: { fontSize: scaleFont(13), color: "#A8A29E" },
  itemQtyValue: { fontSize: scaleFont(14), fontWeight: "700", color: "#292524" },

  addrRow: { flexDirection: "row", alignItems: "flex-start", gap: scale(13), flex: 1 },
  addrIconWrap: { width: scale(44), height: scale(44), borderRadius: scale(13), backgroundColor: TINT, alignItems: "center", justifyContent: "center" },
  addrLabel: { fontSize: scaleFont(13), fontWeight: "800", color: "#78716C", textTransform: "uppercase" },
  addrValue: { fontSize: scaleFont(16.5), fontWeight: "800", color: "#292524", marginTop: scale(3) },
  addrSub: { fontSize: scaleFont(14), fontWeight: "600", color: "#A8A29E", marginTop: scale(3) },

  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: scale(9) },
  priceLabel: { fontSize: scaleFont(15), color: "#78716C" },
  priceValue: { fontSize: scaleFont(15), fontWeight: "700", color: "#292524" },
  totalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingTop: scale(11),
    marginTop: scale(3),
    borderTopWidth: 1,
    borderTopColor: "#F3F0EA",
  },
  totalLabel: { fontSize: scaleFont(16), fontWeight: "800", color: "#292524" },
  totalValue: { fontSize: scaleFont(22), fontWeight: "900", color: BRAND },

  errorBox: { borderRadius: scale(12), borderWidth: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2", padding: scale(13) },
  errorText: { color: "#b91c1c", fontSize: scaleFont(15), fontWeight: "700" },

  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BRAND,
    borderRadius: scale(14),
    paddingVertical: scale(16),
    paddingHorizontal: scale(19),
  },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmBtnText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "800" },
  confirmBtnAmountChip: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: scale(8), paddingHorizontal: scale(11), paddingVertical: scale(6) },
  confirmBtnAmountText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "900" },
});
