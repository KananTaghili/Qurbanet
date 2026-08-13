import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  Beef,
  ChevronRight,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useMeatCart } from "../context/MeatCartContext";
import { useMeatDeliveryLocation } from "../context/MeatDeliveryLocationContext";
import MobileGrowModal from "../components/meat/MobileGrowModal";
import MeatDeliveryLocationModal from "../components/meat/MeatDeliveryLocationModal";
import api from "../lib/api";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#4B0F0F";

export default function MeatCartScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? RNStatusBar.currentHeight || 0 : 0,
  );
  const { user, isGuest } = useAuth();
  const { lang } = useLanguage();
  const { items, updateQuantity, removeItem, itemsTotal, markOrderPending, clearOrderPending, removeUnavailableItems } = useMeatCart();
  const { location, setLocation, deliveryPrice } = useMeatDeliveryLocation();
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = itemsTotal + (items.length ? deliveryPrice : 0);
  // Çatdırılma seçilməyəndə də düymə basıla bilməlidir — basanda naviqasiya
  // etmək əvəzinə çatdırılma modalı açılır (aşağı bax), veb-dəki eyni
  // davranış. Düymə yalnız səbət boşdursa deaktivdir.
  const canCheckout = items.length > 0;
  const hasDelivery = !!location && location.phones?.length > 0;

  const goToProducts = () => navigation.navigate("MeatProducts");

  // Veb-dəki Səbətim səhifəsi ilə eyni davranış — buradan "Sifariş xülasəsi"
  // addımı YOXDUR: sifariş birbaşa yaradılır, sonra Ödəniş ekranına
  // "autoPay" ilə keçirik — o ekran Epoint-i özü başladıb tətbiq-daxili
  // <WebView>-də açır (bax MeatCheckoutPaymentScreen.js), Epoint-in
  // özünü/WebView məntiqini burada TƏKRARLAMIRIQ. Yalnız Məhsullar
  // (MeatProductsScreen) səhifəsindəki "Ödə" xülasəyə aparır.
  const handleCheckout = async () => {
    setError("");
    if (!canCheckout || submitting) return;
    if (!hasDelivery) {
      setDeliveryOpen(true);
      return;
    }
    if (isGuest) {
      navigation.navigate("Login");
      return;
    }

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
      if (!res.data.success) {
        setError(res.data.message || t(lang, "meatCart_createOrderFailed"));
        clearOrderPending(lineIds);
        setSubmitting(false);
        return;
      }

      const order = res.data.data.order;
      navigation.navigate("MeatCheckoutPayment", {
        orderId: order._id,
        totalPrice: order.totalPrice,
        autoPay: true,
      });
    } catch (err) {
      const unavailableItems = err.response?.data?.errors;
      if (Array.isArray(unavailableItems) && unavailableItems.length > 0) {
        removeUnavailableItems(unavailableItems);
        const names = unavailableItems.map((u) => `"${u.name}"`).join(", ");
        setError(`${names} artıq stokda qalmayıb — səbətdən silindi.`);
      } else {
        setError(err.response?.data?.message || t(lang, "meatCart_createOrderFailed"));
      }
    }
    clearOrderPending(lineIds);
    setSubmitting(false);
  };

  return (
    <View style={styles.root}>
      <ExpoStatusBar style="light" backgroundColor={BRAND} />
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable
          style={styles.backBtn}
          onPress={() =>
            navigation.canGoBack
              ? navigation.goBack()
              : navigation.navigate("MeatProducts")
          }
        >
          <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t(lang, "meatCart_headerTitle")}</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{t(lang, "meatCart_productCountTemplate").replace("{count}", items.length)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <ShoppingCart size={19} color={BRAND} strokeWidth={2.2} />
              <Text style={styles.cardHeaderText}>{t(lang, "meatCart_cardHeaderTitle")}</Text>
            </View>
            <View style={styles.cardHeaderChip}>
              <Text style={styles.cardHeaderChipText}>
                {t(lang, "meatCart_productCountTemplate").replace("{count}", items.length)}
              </Text>
            </View>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingBag size={40} color="#d6d3d1" />
              <Text style={styles.emptyTitle}>{t(lang, "meatCart_emptyTitle")}</Text>
              <Text style={styles.emptySubtitle}>
                {t(lang, "meatCart_emptySub")}
              </Text>
              <Pressable style={styles.emptyBtn} onPress={goToProducts}>
                <Text style={styles.emptyBtnText}>{t(lang, "meatCart_browseProducts")}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {items.map((it) => (
                <View key={it.lineId} style={styles.itemRow}>
                  <View style={styles.itemImageWrap}>
                    {it.imageUrl ? (
                      <Image
                        source={{ uri: it.imageUrl }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Beef size={24} color="rgba(75,15,15,0.55)" />
                    )}
                  </View>

                  <View style={styles.itemBody}>
                    <View style={styles.itemTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {it.cutNameAz}
                        </Text>
                        <Text style={styles.itemMeta} numberOfLines={1}>
                          {it.animalNameAz} · {it.partNameAz}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => removeItem(it.lineId)}
                        style={styles.removeBtn}
                      >
                        <Trash2 size={17} color="#d6d3d1" />
                      </Pressable>
                    </View>

                    <View style={styles.itemBottomRow}>
                      {it.soldByWeight === false ? (
                        <Text style={styles.itemQtyText}>
                          {it.quantityKg.toFixed(2)} {t(lang, "meatCart_kgUnit")}
                        </Text>
                      ) : (
                        <View style={styles.stepper}>
                          <Pressable
                            style={styles.stepperBtn}
                            onPress={() =>
                              updateQuantity(
                                it.lineId,
                                it.quantityKg - it.stepKg,
                              )
                            }
                          >
                            <Minus size={13} color="#57534e" />
                          </Pressable>
                          <Text style={styles.stepperText}>
                            {it.quantityKg.toFixed(2)} {t(lang, "meatCart_kgUnit")}
                          </Text>
                          <Pressable
                            style={styles.stepperBtn}
                            onPress={() =>
                              updateQuantity(
                                it.lineId,
                                it.quantityKg + it.stepKg,
                              )
                            }
                            disabled={it.quantityKg >= it.stockKg}
                          >
                            <Plus size={13} color="#57534e" />
                          </Pressable>
                        </View>
                      )}
                      <Text style={styles.itemPrice}>
                        {(it.pricePerKg * it.quantityKg).toFixed(2)} AZN
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable
          style={styles.sectionCard}
          onPress={() => setDeliveryOpen(true)}
        >
          <View style={styles.sectionIconWrap}>
            <MapPin size={20} color={BRAND} strokeWidth={2.2} />
          </View>
          <View style={styles.sectionBody}>
            <Text style={styles.sectionLabel}>{t(lang, "meatCart_deliveryLocationLabel")}</Text>
            <Text style={styles.sectionValue} numberOfLines={2}>
              {location
                ? location.address
                : t(lang, "meatCart_addressNotSelected")}
            </Text>
            {location?.phones?.length > 0 ? (
              <Text style={styles.sectionSubValue}>{location.phones[0]}</Text>
            ) : null}
          </View>
          <ChevronRight size={18} color="#a8a29e" />
        </Pressable>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t(lang, "meatCart_productsAmountLabel")}</Text>
            <Text style={styles.summaryValue}>{itemsTotal.toFixed(2)} AZN</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t(lang, "meatCart_deliveryFeeLabel")}</Text>
            <Text style={styles.summaryValue}>
              {items.length ? `${deliveryPrice.toFixed(2)} AZN` : "—"}
            </Text>
          </View>
          <View style={styles.summaryRowTotal}>
            <Text style={styles.summaryTotalLabel}>{t(lang, "meatCart_finalAmountLabel")}</Text>
            <Text style={styles.summaryTotalValue}>{total.toFixed(2)} AZN</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable style={styles.secondaryBtn} onPress={goToProducts}>
          <ArrowLeft size={17} color={BRAND} />
          <Text style={styles.secondaryBtnText}>
            {items.length > 0 ? t(lang, "meatCart_continueShopping") : t(lang, "meatCart_startShopping")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.primaryBtn, (!canCheckout || submitting) && styles.primaryBtnDisabled]}
          onPress={handleCheckout}
          disabled={!canCheckout || submitting}
        >
          {submitting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.primaryBtnText}>{t(lang, "meatCart_redirecting")}</Text>
            </>
          ) : (
            <>
              <View style={styles.primaryBtnIconWrap}>
                <CreditCard size={17} color="#fff" />
              </View>
              <Text style={styles.primaryBtnText}>
                {t(lang, "meatCart_payTemplate").replace("{amount}", total.toFixed(2))}
              </Text>
            </>
          )}
        </Pressable>
      </View>

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(10),
    paddingHorizontal: scale(14),
    paddingTop: scale(12),
    paddingBottom: scale(10),
    backgroundColor: BRAND,
    borderBottomWidth: 1,
    borderBottomColor: "#6b1717",
  },
  backBtn: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: scaleFont(21), fontWeight: "900", color: "#fff" },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: scale(11),
    paddingVertical: scale(5),
    borderRadius: scale(999),
  },
  headerBadgeText: { color: "#fff", fontSize: scaleFont(13), fontWeight: "800" },
  scroll: { flex: 1 },
  content: { padding: scale(14), gap: scale(12) },
  card: {
    backgroundColor: "#FBF8F4",
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "#e7e2da",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    backgroundColor: "#F1E5E5",
    borderBottomWidth: 1,
    borderBottomColor: "#e7e2da",
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: scale(9) },
  cardHeaderText: {
    fontSize: scaleFont(15),
    fontWeight: "800",
    color: BRAND,
    textTransform: "uppercase",
  },
  cardHeaderChip: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: scale(999),
    paddingHorizontal: scale(9),
    paddingVertical: scale(4),
  },
  cardHeaderChipText: { color: "#6b1717", fontSize: scaleFont(13), fontWeight: "700" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(34),
    paddingHorizontal: scale(20),
    gap: scale(8),
  },
  emptyTitle: { fontSize: scaleFont(17), fontWeight: "800", color: "#292524" },
  emptySubtitle: { fontSize: scaleFont(14.5), color: "#a8a29e", textAlign: "center" },
  emptyBtn: {
    marginTop: scale(5),
    paddingHorizontal: scale(16),
    paddingVertical: scale(11),
    borderRadius: scale(999),
    backgroundColor: "#F1E5E5",
  },
  emptyBtnText: { color: BRAND, fontSize: scaleFont(15), fontWeight: "800" },
  itemsList: { padding: scale(12), gap: scale(10) },
  itemRow: {
    flexDirection: "row",
    gap: scale(10),
    padding: scale(10),
    borderRadius: scale(14),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ede7e2",
  },
  itemImageWrap: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(13),
    backgroundColor: "#F1E5E5",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemImage: { width: "100%", height: "100%" },
  itemBody: { flex: 1, minWidth: 0, justifyContent: "space-between" },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: scale(6),
  },
  itemName: { fontSize: scaleFont(15), fontWeight: "800", color: "#292524" },
  itemMeta: { fontSize: scaleFont(12.5), color: "#78716c", marginTop: scale(2) },
  removeBtn: { padding: scale(5) },
  itemBottomRow: {
    marginTop: scale(9),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemQtyText: { fontSize: scaleFont(13.5), fontWeight: "700", color: "#292524" },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(6),
    backgroundColor: "#f5f5f4",
    borderRadius: scale(9),
    paddingHorizontal: scale(4),
    paddingVertical: scale(3),
  },
  stepperBtn: {
    width: scale(26),
    height: scale(26),
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: { fontSize: scaleFont(12.5), fontWeight: "800", color: "#292524" },
  itemPrice: { fontSize: scaleFont(15), fontWeight: "900", color: BRAND },
  sectionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scale(10),
    padding: scale(13),
    borderRadius: scale(16),
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e2da",
  },
  sectionIconWrap: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(13),
    backgroundColor: "#F1E5E5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionBody: { flex: 1, minWidth: 0 },
  sectionLabel: {
    fontSize: scaleFont(13),
    fontWeight: "800",
    color: "#78716c",
    textTransform: "uppercase",
  },
  sectionValue: {
    marginTop: scale(3),
    fontSize: scaleFont(15),
    fontWeight: "700",
    color: "#292524",
  },
  sectionSubValue: { marginTop: scale(3), fontSize: scaleFont(13.5), color: "#78716c" },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "#e7e2da",
    padding: scale(15),
    gap: scale(9),
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: { fontSize: scaleFont(14.5), color: "#78716c" },
  summaryValue: { fontSize: scaleFont(15), fontWeight: "700", color: "#292524" },
  summaryRowTotal: {
    marginTop: scale(3),
    paddingTop: scale(9),
    borderTopWidth: 1,
    borderTopColor: "#f3f0ea",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTotalLabel: { fontSize: scaleFont(15), fontWeight: "800", color: "#292524" },
  summaryTotalValue: { fontSize: scaleFont(19), fontWeight: "900", color: BRAND },
  errorBox: {
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: scale(11),
  },
  errorText: { color: "#b91c1c", fontSize: scaleFont(14.5), fontWeight: "700" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: scale(12),
    paddingTop: scale(10),
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: scale(8),
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(7),
    borderRadius: scale(13),
    paddingVertical: scale(12),
    backgroundColor: "#F1E5E5",
  },
  secondaryBtnText: { color: BRAND, fontSize: scaleFont(15), fontWeight: "800" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(9),
    borderRadius: scale(13),
    paddingVertical: scale(14),
    backgroundColor: BRAND,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnIconWrap: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: scaleFont(15), fontWeight: "800" },
});
