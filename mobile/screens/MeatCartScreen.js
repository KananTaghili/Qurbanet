import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
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

const BRAND = "#4B0F0F";

export default function MeatCartScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? RNStatusBar.currentHeight || 0 : 0,
  );
  const { user, isGuest } = useAuth();
  const { items, updateQuantity, removeItem, itemsTotal } = useMeatCart();
  const { location, setLocation, deliveryPrice } = useMeatDeliveryLocation();
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [error, setError] = useState("");

  const total = itemsTotal + (items.length ? deliveryPrice : 0);
  const canCheckout =
    items.length > 0 && !!location && location.phones?.length > 0;

  const goToProducts = () => navigation.navigate("MeatProducts");

  const handleCheckout = () => {
    setError("");
    if (!canCheckout) {
      setError("Çatdırılma ünvanı və əlaqə nömrəsi seçilməlidir.");
      return;
    }
    if (isGuest) {
      navigation.navigate("Login");
      return;
    }
    navigation.navigate("MeatCheckoutSummary");
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
          <Text style={styles.headerTitle}>Səbətim</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{items.length} məhsul</Text>
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
              <Text style={styles.cardHeaderText}>Səbətdəki məhsullar</Text>
            </View>
            <View style={styles.cardHeaderChip}>
              <Text style={styles.cardHeaderChipText}>
                {items.length} məhsul
              </Text>
            </View>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingBag size={40} color="#d6d3d1" />
              <Text style={styles.emptyTitle}>Səbətiniz boşdur</Text>
              <Text style={styles.emptySubtitle}>
                Məhsullara baxıb seçiminizi edin.
              </Text>
              <Pressable style={styles.emptyBtn} onPress={goToProducts}>
                <Text style={styles.emptyBtnText}>Məhsullara bax</Text>
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
                          {it.quantityKg.toFixed(2)} kq
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
                            {it.quantityKg.toFixed(2)} kq
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
            <Text style={styles.sectionLabel}>Çatdırılma yeri</Text>
            <Text style={styles.sectionValue} numberOfLines={2}>
              {location
                ? location.address
                : "Ünvan seçilməyib — seçmək üçün toxunun"}
            </Text>
            {location?.phones?.length > 0 ? (
              <Text style={styles.sectionSubValue}>{location.phones[0]}</Text>
            ) : null}
          </View>
          <ChevronRight size={18} color="#a8a29e" />
        </Pressable>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Məhsulların məbləği</Text>
            <Text style={styles.summaryValue}>{itemsTotal.toFixed(2)} AZN</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Çatdırılma haqqı</Text>
            <Text style={styles.summaryValue}>
              {items.length ? `${deliveryPrice.toFixed(2)} AZN` : "—"}
            </Text>
          </View>
          <View style={styles.summaryRowTotal}>
            <Text style={styles.summaryTotalLabel}>Yekun məbləğ</Text>
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
            {items.length > 0 ? "Alış-verişə davam et" : "Alış-verişə başla"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.primaryBtn, !canCheckout && styles.primaryBtnDisabled]}
          onPress={handleCheckout}
          disabled={!canCheckout}
        >
          <View style={styles.primaryBtnIconWrap}>
            <CreditCard size={17} color="#fff" />
          </View>
          <Text style={styles.primaryBtnText}>
            Ödə · {total.toFixed(2)} AZN
          </Text>
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
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: BRAND,
    borderBottomWidth: 1,
    borderBottomColor: "#6b1717",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  headerTitle: { fontSize: 21, fontWeight: "900", color: "#fff" },
  headerBadge: {
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  headerBadgeText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  scroll: { flex: 1 },
  content: { padding: 14, gap: 12 },
  card: {
    backgroundColor: "#FBF8F4",
    borderRadius: 20,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#F1E5E5",
    borderBottomWidth: 1,
    borderBottomColor: "#e7e2da",
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
  cardHeaderText: {
    fontSize: 15,
    fontWeight: "800",
    color: BRAND,
    textTransform: "uppercase",
  },
  cardHeaderChip: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  cardHeaderChipText: { color: "#6b1717", fontSize: 13, fontWeight: "700" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 34,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#292524" },
  emptySubtitle: { fontSize: 14.5, color: "#a8a29e", textAlign: "center" },
  emptyBtn: {
    marginTop: 5,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#F1E5E5",
  },
  emptyBtnText: { color: BRAND, fontSize: 15, fontWeight: "800" },
  itemsList: { padding: 12, gap: 10 },
  itemRow: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ede7e2",
  },
  itemImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 13,
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
    gap: 6,
  },
  itemName: { fontSize: 15, fontWeight: "800", color: "#292524" },
  itemMeta: { fontSize: 12.5, color: "#78716c", marginTop: 2 },
  removeBtn: { padding: 5 },
  itemBottomRow: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemQtyText: { fontSize: 13.5, fontWeight: "700", color: "#292524" },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f5f5f4",
    borderRadius: 9,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: { fontSize: 12.5, fontWeight: "800", color: "#292524" },
  itemPrice: { fontSize: 15, fontWeight: "900", color: BRAND },
  sectionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e2da",
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#F1E5E5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionBody: { flex: 1, minWidth: 0 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#78716c",
    textTransform: "uppercase",
  },
  sectionValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "700",
    color: "#292524",
  },
  sectionSubValue: { marginTop: 3, fontSize: 13.5, color: "#78716c" },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e7e2da",
    padding: 15,
    gap: 9,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: { fontSize: 14.5, color: "#78716c" },
  summaryValue: { fontSize: 15, fontWeight: "700", color: "#292524" },
  summaryRowTotal: {
    marginTop: 3,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "#f3f0ea",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTotalLabel: { fontSize: 15, fontWeight: "800", color: "#292524" },
  summaryTotalValue: { fontSize: 19, fontWeight: "900", color: BRAND },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    padding: 11,
  },
  errorText: { color: "#b91c1c", fontSize: 14.5, fontWeight: "700" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 8,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 13,
    paddingVertical: 12,
    backgroundColor: "#F1E5E5",
  },
  secondaryBtnText: { color: BRAND, fontSize: 15, fontWeight: "800" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 13,
    paddingVertical: 14,
    backgroundColor: BRAND,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
