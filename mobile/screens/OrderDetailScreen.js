import { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { VideoView, useVideoPlayer } from "expo-video";
import {
  ArrowLeft,
  CheckCircle2,
  Package,
  Truck,
  Star,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
  X,
  Banknote,
  FileText,
  ShoppingBag,
  Wallet,
  Play,
  Clock,
  CreditCard,
  XCircle,
  Scale,
} from "lucide-react-native";
import { Knife } from "phosphor-react-native/src/icons/Knife";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { scale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#1c5e20";

function fmtDate(ds, lang) {
  if (!ds) return "—";
  const d = new Date(ds);
  return `${d.getDate()} ${t(lang, "months_short")[d.getMonth()]} ${d.getFullYear()}`;
}

function statusCfg(lang) {
  return {
    awaiting_payment: { label: t(lang, "orderStatus_awaitingPayment"), Icon: CreditCard, step: 0 },
    placed: { label: t(lang, "orderStatus_placed"), Icon: Clock, step: 0 },
    pending_payment: { label: t(lang, "orderStatus_awaitingPayment"), Icon: CreditCard, step: 0 },
    confirmed: { label: t(lang, "orderStatus_confirmed"), Icon: CheckCircle2, step: 1 },
    paid: { label: t(lang, "orderStatus_paid"), Icon: CreditCard, step: 1 },
    slaughtering: { label: t(lang, "orderStatus_slaughtering"), Icon: Knife, step: 2 },
    preparing: { label: t(lang, "orderStatus_preparing"), Icon: Package, step: 3 },
    delivering: { label: t(lang, "orderStatus_delivering"), Icon: Truck, step: 4 },
    completed: { label: t(lang, "orderStatus_completed"), Icon: CheckCircle2, step: 5 },
    cancelled: { label: t(lang, "orderStatus_cancelled"), Icon: XCircle, step: -1 },
  };
}

function pipelineSteps(lang) {
  return [
    { label: t(lang, "orderStatus_placed"), Icon: Clock },
    { label: t(lang, "orderStatus_confirmed"), Icon: CheckCircle2 },
    { label: t(lang, "orderStatus_slaughtering"), Icon: Knife },
    { label: t(lang, "orderStatus_preparing"), Icon: Package },
    { label: t(lang, "orderStatus_delivering"), Icon: Truck },
    { label: t(lang, "orderStatus_completed"), Icon: Star },
  ];
}

function distLabels(lang) {
  return {
    catdirilsin: t(lang, "detailOrder_distDeliver"),
    ozun_gotur: t(lang, "detailOrder_distPickup"),
    ozum: t(lang, "detailOrder_distPickup"),
    usaqlar_evi: t(lang, "detailOrder_distChildren"),
    qocalar_evi: t(lang, "detailOrder_distElderly"),
    ehtiyac_sahibleri: t(lang, "detailOrder_distNeedy"),
  };
}
function cutLabels(lang) {
  return {
    tam_cemdek: t(lang, "detailOrder_cutFullCarcass"),
    kababliq: t(lang, "detailOrder_cutKababliq"),
    qazan_yemekleri: t(lang, "detailOrder_cutPotDishes"),
    qiyma: t(lang, "detailOrder_cutMince"),
  };
}

function VerticalTimeline({ step, lang }) {
  if (step < 0) return null;
  const steps = pipelineSteps(lang);
  return (
    <View>
      {steps.map(({ label, Icon }, i) => {
        const done = i <= step;
        const active = i === step;
        const isLast = i === steps.length - 1;
        return (
          <View key={i} style={{ flexDirection: "row", gap: scale(10) }}>
            <View style={{ alignItems: "center" }}>
              <View style={[styles.tlCircle, { backgroundColor: done ? BRAND : "#f0f7f0", borderColor: done ? BRAND : "#d1d5db" }, active && styles.tlCircleActive]}>
                <Icon size={13} color={done ? "#fff" : "#9ca3af"} />
              </View>
              {!isLast && <View style={[styles.tlConnector, { backgroundColor: done && i < step ? BRAND : "#e5e7eb" }]} />}
            </View>
            <View style={{ paddingTop: scale(3), paddingBottom: isLast ? 0 : 16 }}>
              <Text style={[styles.tlLabel, { color: done ? "#071b0d" : "#9ca3af" }]}>{label}</Text>
              {active && <Text style={styles.tlActiveText}>{t(lang, "detailOrder_currentlyLabel")}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowSep]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "—"}</Text>
    </View>
  );
}

function SectionHead({ Icon, label, iconBg = "#e8f5e9", iconColor = BRAND }) {
  return (
    <View style={styles.sectionHead}>
      <View style={[styles.sectionHeadIcon, { backgroundColor: iconBg }]}>
        <Icon size={15} color={iconColor} />
      </View>
      <Text style={styles.sectionHeadText}>{label}</Text>
    </View>
  );
}

function MediaThumb({ item, index, onOpen, token, lang }) {
  const isVideo = item.type === "video";
  const label = isVideo ? t(lang, "detailOrder_videoLabel") : t(lang, "detailOrder_photoLabel");
  return (
    <Pressable style={styles.mediaThumb} onPress={() => onOpen(index)}>
      {isVideo ? (
        <View style={styles.mediaVideoThumb}>
          <View style={styles.mediaPlayBtn}>
            <Play size={18} color={BRAND} style={{ marginLeft: scale(2) }} />
          </View>
          <Text style={styles.mediaThumbLabel}>{label}</Text>
        </View>
      ) : (
        <>
          <Image source={{ uri: token ? `${item.url}?token=${token}` : item.url }} style={styles.mediaImg} resizeMode="cover" />
          <View style={styles.mediaImgOverlay}>
            <ImageIcon size={9} color="#fff" />
            <Text style={styles.mediaOverlayText}>{label}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

function GalleryVideo({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });
  return <VideoView style={{ width: "100%", height: "100%" }} player={player} allowsFullscreen contentFit="contain" />;
}

function GalleryModal({ items, startIdx, onClose, token }) {
  const [idx, setIdx] = useState(startIdx);
  const item = items[idx];
  const uri = token ? `${item.url}?token=${token}` : item.url;

  return (
    <View style={styles.galleryRoot}>
      <View style={styles.galleryHeader}>
        <Text style={styles.galleryCount}>{idx + 1} / {items.length}</Text>
        <Pressable style={styles.galleryCloseBtn} onPress={onClose}>
          <X size={18} color="#fff" />
        </Pressable>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {item.type === "video" ? (
          <GalleryVideo uri={uri} key={uri} />
        ) : (
          <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
        )}
      </View>
      {items.length > 1 && (
        <View style={styles.galleryDots}>
          {items.map((_, i) => (
            <Pressable key={i} onPress={() => setIdx(i)} style={[styles.galleryDot, i === idx && styles.galleryDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { orderId } = route.params || {};
  const { lang } = useLanguage();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [gallery, setGallery] = useState(null);
  const [meatPickupLocation, setMeatPickupLocation] = useState(null);
  const [cashPickupLocation, setCashPickupLocation] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const fetchOrder = useCallback(() => {
    if (!orderId) return;
    api.get(`/orders/${orderId}`)
      .then(async (res) => {
        const o = res.data.data?.order;
        setOrder(o);
        if (o?.review) {
          setRating(o.review.rating || 0);
          setComment(o.review.comment || "");
          setReviewed(true);
        }
        const isSelf = ["ozun_gotur", "ozum"].includes(o?.distribution?.type) || o?.selfPickup;
        if (isSelf || o?.cashPickupCode) {
          try {
            const cfg = await api.get("/app-config/settings");
            const d = cfg.data?.data;
            if (isSelf && d?.meatPickupLocation?.address) setMeatPickupLocation(d.meatPickupLocation);
            if (o?.cashPickupCode && d?.cashPickupLocation?.address) setCashPickupLocation(d.cashPickupLocation);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      fetchOrder();
    }, [fetchOrder])
  );

  const handleReview = async () => {
    if (!rating) return;
    setReviewing(true);
    try {
      await api.post(`/orders/${orderId}/review`, { rating, comment });
      setReviewed(true);
    } catch (err) {
      Alert.alert(t(lang, "detailOrder_errorTitle"), err.response?.data?.message || t(lang, "donateModal_genericError"));
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }
  if (!order) return null;

  const status = order.status || "placed";
  const cfg = statusCfg(lang)[status] || statusCfg(lang).placed;
  const StatusIcon = cfg.Icon;
  const step = cfg.step;
  const PipeIcon = pipelineSteps(lang)[Math.max(0, step)]?.Icon || StatusIcon;

  const animalImg = order.animalImageUrl;
  const animalName = order.animalNameAz || t(lang, "myOrders_animalFallback");
  const totalAmt = order.totalPrice ?? 0;
  const orderNum = order.orderNumber || String(orderId).slice(-6).toUpperCase();
  const allMedia = order.media || [];
  const weight = order.lambSelection?.weightCategoryLabel || null;
  const isSelfPickup = ["ozun_gotur", "ozum"].includes(order.distribution?.type) || order.selfPickup;

  const detailRows = [
    { label: t(lang, "detailOrder_orderTypeLabel"), value: order.orderMode === "serikli" ? t(lang, "detailOrder_sharedType") : t(lang, "detailOrder_fullAnimalType") },
    { label: t(lang, "detailOrder_quantityLabel"), value: `${order.quantity || 1} ${t(lang, "detailOrder_unitSuffix")}` },
    ...(weight ? [{ label: t(lang, "detailOrder_liveWeightLabel"), value: weight }] : []),
    { label: t(lang, "detailOrder_deliveryLabel"), value: distLabels(lang)[order.distribution?.type] || "—" },
    { label: t(lang, "detailOrder_slaughterDateLabel"), value: fmtDate(order.slaughterDate, lang) },
    { label: t(lang, "detailOrder_deliveryTimeLabel"), value: order.deliveryWindow || "—" },
    ...(order.distribution?.location ? [{ label: t(lang, "detailOrder_addressLabel"), value: order.distribution.location }] : []),
    ...(order.distribution?.phones?.length > 0 ? [{ label: t(lang, "detailOrder_numberLabel"), value: order.distribution.phones.join(", ") }] : []),
    ...(order.distribution?.note ? [{ label: t(lang, "detailOrder_noteLabel"), value: order.distribution.note }] : []),
    ...(order.contactInfo ? [
      { label: t(lang, "detailOrder_contactLabel"), value: `${order.contactInfo.firstName || ""} ${order.contactInfo.lastName || ""}`.trim() },
      { label: t(lang, "detailOrder_phoneLabel"), value: order.contactInfo.mobile || "—" },
    ] : []),
    ...(order.userNote ? [{ label: t(lang, "detailOrder_customerNoteLabel"), value: order.userNote }] : []),
  ];

  const cutEntries = (() => {
    const cs = order.cutStyle;
    if (!cs) return [];
    if (Array.isArray(cs.allocations)) return cs.allocations.filter((a) => a.count > 0).map((a) => [a.key, a.count]);
    return Object.entries(cs).filter(([k, v]) => k !== "extraFee" && v > 0);
  })();

  const openMaps = (loc) => {
    const url = loc?.lat && loc?.lng
      ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc?.address || "")}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable style={[styles.backBtn, { top: insets.top }]} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color="#fff" strokeWidth={2.5} />
        </Pressable>
        <Text style={[styles.headerTitle, { paddingTop: insets.top + 18 }]}>{t(lang, "detailOrder_headerTitle")}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: scale(14), paddingBottom: insets.bottom + 24, gap: scale(12) }}>
        <View style={{ marginTop: scale(14) }}>
          <View style={styles.statusFloat}>
            <PipeIcon size={22} color="#fff" />
          </View>
          <View style={styles.heroCard}>
            <View style={styles.heroImgWrap}>
              {animalImg ? (
                <Image source={{ uri: animalImg }} style={styles.heroImg} resizeMode="cover" />
              ) : (
                <Image source={require("../assets/images/qoyun-fallback.jpg")} style={styles.heroImg} resizeMode="cover" />
              )}
              <View style={styles.heroImgOverlay}>
                <Text style={styles.heroOrderNum}>{orderNum}</Text>
              </View>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroAnimalName}>{animalName}</Text>
              <View style={styles.heroChipsRow}>
                <View style={styles.heroChip}>
                  <ShoppingBag size={11} color="#2d5a2d" />
                  <Text style={styles.heroChipText}>{order.quantity || order.sharedPortion || 1} {t(lang, "detailOrder_unitSuffix")}</Text>
                </View>
                <View style={styles.heroChip}>
                  <Wallet size={11} color={BRAND} />
                  <Text style={[styles.heroChipText, { color: BRAND }]}>{totalAmt} AZN</Text>
                </View>
                {weight && (
                  <View style={styles.heroChip}>
                    <Scale size={11} color="#2d5a2d" />
                    <Text style={styles.heroChipText}>{weight}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroDate}>{fmtDate(order.createdAt, lang)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <SectionHead Icon={CheckCircle2} label={t(lang, "detailOrder_pipelineTitle")} />
          <View style={{ padding: scale(14) }}>
            <VerticalTimeline step={step} lang={lang} />
          </View>
        </View>

        <View style={styles.card}>
          <SectionHead Icon={FileText} label={t(lang, "detailOrder_orderInfoTitle")} />
          {detailRows.map((row, i) => (
            <InfoRow key={row.label} label={row.label} value={row.value} last={i === detailRows.length - 1 && cutEntries.length === 0} />
          ))}
          {cutEntries.length > 0 && (
            <>
              <View style={styles.cutHeadWrap}>
                <Text style={styles.cutHeadText}>{t(lang, "detailOrder_cutTypeSectionLabel")}</Text>
              </View>
              {cutEntries.map(([k, v], i) => (
                <InfoRow key={k} label={cutLabels(lang)[k] || k} value={`${v} ${t(lang, "detailOrder_unitSuffix")}`} last={i === cutEntries.length - 1} />
              ))}
            </>
          )}
        </View>

        {allMedia.length > 0 && (
          <View style={styles.card}>
            <SectionHead Icon={ImageIcon} label={t(lang, "detailOrder_photoVideoTitle")} />
            <View style={{ padding: scale(14), flexDirection: "row", flexWrap: "wrap", gap: scale(8) }}>
              {allMedia.map((m, i) => (
                <MediaThumb key={i} item={m} index={i} token={token} lang={lang} onOpen={(idx) => setGallery({ items: allMedia, idx })} />
              ))}
            </View>
          </View>
        )}

        {order.cashPickupCode && (
          <View style={styles.card}>
            <SectionHead Icon={Banknote} label={t(lang, "detailOrder_cashCodeTitle")} iconBg="#fef9ec" iconColor="#d97706" />
            <View style={{ padding: scale(16), alignItems: "center", gap: scale(10) }}>
              <Text style={styles.pickupHint}>{t(lang, "detailOrder_showInStoreHint")}</Text>
              <View style={styles.codeBoxAmber}>
                <Text style={styles.codeTextAmber}>{order.cashPickupCode}</Text>
              </View>
              {cashPickupLocation && (
                <View style={{ alignItems: "center", gap: scale(6) }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: scale(6) }}>
                    <MapPin size={13} color={BRAND} />
                    <Text style={styles.pickupAddr}>{cashPickupLocation.address}</Text>
                  </View>
                  <Pressable style={styles.mapLink} onPress={() => openMaps(cashPickupLocation)}>
                    <ExternalLink size={13} color={BRAND} />
                    <Text style={styles.mapLinkText}>{t(lang, "detailOrder_openInMap")}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {isSelfPickup && meatPickupLocation && (
          <View style={styles.card}>
            <SectionHead Icon={ShoppingBag} label={t(lang, "detailOrder_pickupLocationTitle")} />
            <View style={{ padding: scale(14), gap: scale(10) }}>
              <View style={styles.pickupBox}>
                <MapPin size={14} color={BRAND} />
                <Text style={styles.pickupBoxText}>{meatPickupLocation.address}</Text>
              </View>
              <Pressable style={styles.mapBtn} onPress={() => openMaps(meatPickupLocation)}>
                <ExternalLink size={14} color={BRAND} />
                <Text style={styles.mapBtnText}>{t(lang, "detailOrder_openInGoogleMaps")}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {order.deliveryConfirmCode && (
          <View style={styles.card}>
            <SectionHead Icon={Truck} label={t(lang, "detailOrder_deliveryCodeTitle")} iconBg="#eff6ff" iconColor="#3b82f6" />
            <View style={{ padding: scale(16), alignItems: "center", gap: scale(8) }}>
              <View style={styles.codeBoxBlue}>
                <Text style={styles.codeTextBlue}>{order.deliveryConfirmCode}</Text>
              </View>
              <Text style={styles.pickupHintSmall}>{t(lang, "detailOrder_deliveryCodeHint")}</Text>
            </View>
          </View>
        )}

        {order.status === "completed" && (
          <View style={styles.card}>
            <SectionHead Icon={Star} label={t(lang, "detailOrder_reviewTitle")} iconBg="#fef9ec" iconColor="#f59e0b" />
            <View style={{ padding: scale(14) }}>
              <View style={{ flexDirection: "row", justifyContent: "center", gap: scale(10), marginBottom: scale(14) }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => !reviewed && setRating(star)} disabled={reviewed}>
                    <Star size={28} color={star <= rating ? "#fbbf24" : "#e5e7eb"} fill={star <= rating ? "#fbbf24" : "none"} />
                  </Pressable>
                ))}
              </View>
              {!reviewed ? (
                <>
                  <TextInput
                    style={styles.reviewInput}
                    value={comment}
                    onChangeText={setComment}
                    placeholder={t(lang, "detailOrder_reviewPlaceholder")}
                    placeholderTextColor="#9ca3af"
                    multiline
                  />
                  <Pressable
                    style={[styles.reviewBtn, (!rating || reviewing) && { opacity: 0.5 }]}
                    onPress={handleReview}
                    disabled={!rating || reviewing}
                  >
                    <Text style={styles.reviewBtnText}>{reviewing ? t(lang, "detailOrder_sending") : t(lang, "detailOrder_sendReview")}</Text>
                  </Pressable>
                </>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(6), paddingVertical: scale(6) }}>
                  <CheckCircle2 size={16} color={BRAND} />
                  <Text style={{ color: BRAND, fontWeight: "700", fontSize: scaleFont(13) }}>{t(lang, "detailOrder_reviewSubmitted")}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {gallery && (
        <GalleryModal items={gallery.items} startIdx={gallery.idx} onClose={() => setGallery(null)} token={token} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f7f4" },

  header: { backgroundColor: "#f4f7f4", borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: scale(10) },
  backBtn: {
    position: "absolute",
    left: 0,
    zIndex: 10,
    width: scale(56),
    height: scale(56),
    borderBottomRightRadius: scale(56),
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: scaleFont(15), fontWeight: "800", color: "#171717", paddingLeft: scale(90) },

  statusFloat: { position: "absolute", top: scale(-12), right: scale(8), zIndex: 10, width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: BRAND, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  heroCard: { backgroundColor: "#fff", borderRadius: scale(18), overflow: "hidden", borderWidth: 1.5, borderColor: "#e8f0e8" },
  heroImgWrap: { width: "100%", height: scale(200), backgroundColor: "#f0f7f0" },
  heroImg: { width: "100%", height: "100%" },
  heroImgOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: scale(8), paddingVertical: scale(6), backgroundColor: "rgba(0,0,0,0.4)" },
  heroOrderNum: { fontSize: scaleFont(10), fontWeight: "800", color: "rgba(255,255,255,0.9)" },
  heroInfo: { paddingHorizontal: scale(14), paddingVertical: scale(14), gap: scale(8) },
  heroAnimalName: { fontSize: scaleFont(17), fontWeight: "900", color: "#071b0d" },
  heroChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: scale(6) },
  heroChip: { flexDirection: "row", alignItems: "center", gap: scale(5), backgroundColor: "#f0f7f0", borderRadius: scale(8), paddingHorizontal: scale(9), paddingVertical: scale(5) },
  heroChipText: { fontSize: scaleFont(11), fontWeight: "800", color: "#2d5a2d" },
  heroDate: { fontSize: scaleFont(11), color: "#9ca3af" },

  card: { backgroundColor: "#fff", borderRadius: scale(16), overflow: "hidden", borderWidth: 1.5, borderColor: "#e8f0e8" },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: scale(10), paddingHorizontal: scale(14), paddingTop: scale(14), paddingBottom: scale(12), borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  sectionHeadIcon: { width: scale(30), height: scale(30), borderRadius: scale(10), alignItems: "center", justifyContent: "center" },
  sectionHeadText: { fontSize: scaleFont(13.5), fontWeight: "800", color: "#071b0d" },

  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: scale(14), paddingVertical: scale(10), gap: scale(10) },
  infoRowSep: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  infoLabel: { fontSize: scaleFont(11), color: "#9ca3af", fontWeight: "600" },
  infoValue: { fontSize: scaleFont(11.5), fontWeight: "800", color: "#374151", textAlign: "right", maxWidth: "60%" },
  cutHeadWrap: { paddingHorizontal: scale(14), paddingTop: scale(10), paddingBottom: scale(5), borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  cutHeadText: { fontSize: scaleFont(9.5), fontWeight: "900", color: "#9ca3af", letterSpacing: 0.6 },

  tlCircle: { width: scale(30), height: scale(30), borderRadius: scale(15), borderWidth: 2, alignItems: "center", justifyContent: "center" },
  tlCircleActive: { shadowColor: BRAND, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  tlConnector: { width: scale(2), flex: 1, marginVertical: scale(3), minHeight: scale(18) },
  tlLabel: { fontSize: scaleFont(13), fontWeight: "700" },
  tlActiveText: { fontSize: scaleFont(10), fontWeight: "700", color: BRAND, marginTop: scale(1) },

  mediaThumb: { width: "31%", aspectRatio: 4 / 3, borderRadius: scale(12), overflow: "hidden", backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  mediaImg: { width: "100%", height: "100%" },
  mediaImgOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: scale(4), paddingHorizontal: scale(6), paddingVertical: scale(4), backgroundColor: "rgba(0,0,0,0.4)" },
  mediaOverlayText: { fontSize: scaleFont(9), fontWeight: "800", color: "#fff" },
  mediaVideoThumb: { flex: 1, alignItems: "center", justifyContent: "center", gap: scale(6), backgroundColor: BRAND },
  mediaPlayBtn: { width: scale(34), height: scale(34), borderRadius: scale(17), backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  mediaThumbLabel: { fontSize: scaleFont(10), fontWeight: "800", color: "rgba(255,255,255,0.9)" },

  pickupHint: { fontSize: scaleFont(10), fontWeight: "800", color: "#9ca3af", letterSpacing: 0.6 },
  codeBoxAmber: { borderRadius: scale(16), paddingHorizontal: scale(32), paddingVertical: scale(12), backgroundColor: "#fde68a", borderWidth: 1.5, borderColor: "rgba(245,158,11,0.3)" },
  codeTextAmber: { fontSize: scaleFont(24), fontWeight: "900", letterSpacing: 4, color: "#92400e" },
  pickupAddr: { fontSize: scaleFont(13), fontWeight: "600", color: "#6b7280" },
  mapLink: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  mapLinkText: { fontSize: scaleFont(13), fontWeight: "800", color: BRAND },

  pickupBox: { flexDirection: "row", alignItems: "flex-start", gap: scale(8), backgroundColor: "#f0f9f0", borderWidth: 1, borderColor: BRAND + "30", borderRadius: scale(12), paddingHorizontal: scale(12), paddingVertical: scale(10) },
  pickupBoxText: { flex: 1, fontSize: scaleFont(13), fontWeight: "600", color: BRAND },
  mapBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: scale(8), borderWidth: 2, borderColor: BRAND, borderRadius: scale(12), paddingVertical: scale(11) },
  mapBtnText: { fontSize: scaleFont(13), fontWeight: "800", color: BRAND },

  codeBoxBlue: { borderRadius: scale(16), paddingHorizontal: scale(32), paddingVertical: scale(12), backgroundColor: "#dbeafe", borderWidth: 1.5, borderColor: "rgba(59,130,246,0.25)" },
  codeTextBlue: { fontSize: scaleFont(24), fontWeight: "900", letterSpacing: 4, color: "#1e40af" },
  pickupHintSmall: { fontSize: scaleFont(11), color: "#9ca3af" },

  reviewInput: { minHeight: scale(70), borderWidth: 1, borderColor: "#e5e7eb", borderRadius: scale(12), paddingHorizontal: scale(12), paddingVertical: scale(10), fontSize: scaleFont(13), color: "#171717", textAlignVertical: "top", marginBottom: scale(12) },
  reviewBtn: { backgroundColor: BRAND, borderRadius: scale(12), paddingVertical: scale(12), alignItems: "center" },
  reviewBtnText: { color: "#fff", fontSize: scaleFont(13), fontWeight: "800" },

  galleryRoot: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.92)", zIndex: 999 },
  galleryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: scale(18), paddingTop: scale(50), paddingBottom: scale(14) },
  galleryCount: { color: "#fff", fontWeight: "800", fontSize: scaleFont(14) },
  galleryCloseBtn: { width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  galleryDots: { flexDirection: "row", justifyContent: "center", gap: scale(8), paddingVertical: scale(16) },
  galleryDot: { width: scale(8), height: scale(8), borderRadius: scale(4), backgroundColor: "rgba(255,255,255,0.35)" },
  galleryDotActive: { width: scale(20), backgroundColor: "#fff" },
});
