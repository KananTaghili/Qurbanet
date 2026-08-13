import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  useWindowDimensions,
  PanResponder,
  LayoutAnimation,
  UIManager,
  Animated,
  Easing,
} from "react-native";
import {
  ShoppingCart,
  ShoppingBag,
  Beef,
  Plus,
  Minus,
  Trash2,
  X,
  MapPin,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import {
  useRoute,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { LinearGradient } from "expo-linear-gradient";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useMeatCart } from "../context/MeatCartContext";
import { useMeatDeliveryLocation } from "../context/MeatDeliveryLocationContext";
import MeatBottomNav from "../components/MeatBottomNav";
import MeatStepHeader from "../components/meat/MeatStepHeader";
import MobileGrowModal from "../components/meat/MobileGrowModal";
import MeatFoodFilterModal from "../components/meat/MeatFoodFilterModal";
import MeatDeliveryLocationModal from "../components/meat/MeatDeliveryLocationModal";
import AnimalBodyMap, {
  getFirstDisplayPartKey,
  getDisplayParts,
} from "../components/meat/AnimalBodyMap";
import MeatSpinner from "../components/meat/MeatSpinner";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#4B0F0F";
const PARTS_PAGE_SIZE = 6;

// Köhnə arxitekturada (Fabric aktiv deyilsə) Android-də LayoutAnimation
// defolt söndürülüb — buna icazə verməsək səbət panelinin aç/bağla
// animasiyası Android-də sıçrayışlı (animasiyasız) görünər.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Yeməklərə görə filtr aktivdirsə, yalnız seçilmiş yeməklərdən ən azı birinə
// uyğun olan məhsul göstərilir. Filtr boşdursa hamısı keçir. (Veb-dəki
// cutMatchesFoods-un eynisi.)
function cutMatchesFoods(item, foodFilterIds) {
  if (!foodFilterIds || foodFilterIds.length === 0) return true;
  return (item.suitableFoods || []).some((id) =>
    foodFilterIds.includes(String(id?._id || id)),
  );
}

// Hər yeməyin hansı heyvan(lar)a aid olduğunu tapır — Food modelində birbaşa
// heyvan sahəsi yoxdur, bu, hər kəsim/orqan/çəkilmiş ət məhsulunun
// suitableFoods siyahısından geriyə doğru çıxarılır (bir yemək bir neçə
// heyvana aid ola bilər, ona görə Set istifadə olunur). Veb-dəki
// computeFoodAnimalKeys-in eynisi.
function computeFoodAnimalKeys(animals, organs, groundProducts) {
  const map = {};
  const add = (foodId, animalKey) => {
    if (!animalKey) return;
    const id = String(foodId?._id || foodId);
    if (!map[id]) map[id] = new Set();
    map[id].add(animalKey);
  };
  (animals || []).forEach((animal) => {
    (animal.bodyParts || []).forEach((part) => {
      (part.cuts || []).forEach((cut) => {
        (cut.suitableFoods || []).forEach((foodId) => add(foodId, animal.key));
      });
    });
  });
  (organs || []).forEach((organ) => {
    (organ.suitableFoods || []).forEach((foodId) => add(foodId, organ.animalKey));
  });
  (groundProducts || []).forEach((product) => {
    (product.suitableFoods || []).forEach((foodId) => add(foodId, product.animalKey));
  });
  return map;
}

/* ── Heyvan seçici tablar ── */
function AnimalSwitcher({ animals, selectedKey, onSelect }) {
  return (
    <View style={styles.switcher}>
      {animals.map((a) => {
        const isSel = a.key === selectedKey;
        return (
          <Pressable
            key={a.key}
            style={[styles.switcherTab, isSel && styles.switcherTabActive]}
            onPress={() => onSelect(a.key)}
          >
            <Text
              style={[styles.switcherText, isSel && styles.switcherTextActive]}
            >
              {a.nameAz}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── Bədən hissəsi düyməsi ── */
function PartButton({ part, isSelected, onPress }) {
  const hasStock = (part.cuts || []).some(
    (c) => c.soldByWeight === false || (c.stockKg ?? 0) > 0,
  );
  return (
    <Pressable
      disabled={!hasStock}
      onPress={onPress}
      style={[
        styles.partBtn,
        !hasStock && styles.partBtnDisabled,
        isSelected && styles.partBtnSelected,
      ]}
    >
      {part.displayBadge ? (
        <View
          style={[styles.partBadge, isSelected && styles.partBadgeSelected]}
        >
          <Text
            style={[
              styles.partBadgeText,
              isSelected && styles.partBadgeTextSelected,
            ]}
          >
            {part.displayBadge}
          </Text>
        </View>
      ) : null}
      <Text
        style={[
          styles.partBtnText,
          !hasStock && styles.partBtnTextDisabled,
          isSelected && styles.partBtnTextSelected,
        ]}
        numberOfLines={2}
      >
        {part.displayName || part.nameAz}
      </Text>
    </Pressable>
  );
}

/* ── Bədən hissəsi seçici — 2 sətir x 3 sütun, lazım olanda < > ilə səhifələnir ── */
function PartsPager({ parts, selectedPartKey, onSelectPart, onDragActive }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(parts.length / PARTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageParts = parts.slice(
    safePage * PARTS_PAGE_SIZE,
    safePage * PARTS_PAGE_SIZE + PARTS_PAGE_SIZE,
  );
  const hasPager = totalPages > 1;
  // Son səhifədə 6-dan az element olsa belə, sıra sayı (2 sətir) sabit
  // qalsın deyə boş "placeholder" xanalarla tamamlanır — veb-dəki kimi ox
  // düymələri səhifədən-səhifəyə tullanmasın.
  const placeholderCount = hasPager
    ? PARTS_PAGE_SIZE - pageParts.length
    : 0;

  const partsTranslateX = useRef(new Animated.Value(0)).current;
  const partsOpacity = useRef(new Animated.Value(1)).current;
  const safePageRef = useRef(safePage);
  safePageRef.current = safePage;

  const goToPage = (nextPage, dir) => {
    partsTranslateX.setValue(dir === "right" ? 14 : -14);
    partsOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(partsTranslateX, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(partsOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    setPage(nextPage);
  };

  // DİQQƏT: sadə onTouchStart/onTouchEnd bəzən üst ScrollView-un öz şaquli
  // scroll jesti ilə "yarışırdı" (barmaq bir az əyri hərəkət edəndə scroll
  // udurdu, sürüşdürmə işləmirdi). PanResponder-in "capture" mərhələsi ilə —
  // yalnız aydın üfüqi hərəkət başlayanda (adi tıklamalarda YOX) — jesti
  // ScrollView-dan ƏVVƏL tuturuq, bu da problemi tam həll edir.
  const partsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        hasPager &&
        Math.abs(g.dx) > 12 &&
        Math.abs(g.dy) < Math.abs(g.dx) * 1.8,
      onPanResponderGrant: () => {
        onDragActive?.(true);
      },
      onPanResponderRelease: (_, g) => {
        onDragActive?.(false);
        const dx = g.dx;
        const dy = g.dy;
        if (Math.abs(dx) < 30 || Math.abs(dy) > Math.abs(dx) * 1.8) return;
        const total = Math.max(
          1,
          Math.ceil(parts.length / PARTS_PAGE_SIZE),
        );
        if (dx < 0) {
          goToPage((safePageRef.current + 1) % total, "right");
        } else {
          goToPage((safePageRef.current - 1 + total) % total, "left");
        }
      },
      onPanResponderTerminate: () => {
        onDragActive?.(false);
      },
    }),
  ).current;

  return (
    <View style={styles.partsPagerWrap}>
      {hasPager && (
        <Pressable
          style={[styles.partsArrow, { left: 0 }]}
          onPress={() =>
            goToPage((safePage - 1 + totalPages) % totalPages, "left")
          }
        >
          <ChevronLeft size={18} color={BRAND} />
        </Pressable>
      )}
      <Animated.View
        style={[
          styles.partsGrid,
          hasPager && { marginHorizontal: scale(28) },
          {
            opacity: partsOpacity,
            transform: [{ translateX: partsTranslateX }],
          },
        ]}
        {...partsPanResponder.panHandlers}
      >
        {pageParts.map((part) => (
          <PartButton
            key={part.key}
            part={part}
            isSelected={selectedPartKey === part.key}
            onPress={() => onSelectPart(part.key)}
          />
        ))}
        {Array.from({ length: placeholderCount }).map((_, i) => (
          <View key={`ph-${i}`} style={styles.partBtnPlaceholder} />
        ))}
      </Animated.View>
      {hasPager && (
        <Pressable
          style={[styles.partsArrow, { right: 0 }]}
          onPress={() => goToPage((safePage + 1) % totalPages, "right")}
        >
          <ChevronRight size={18} color={BRAND} />
        </Pressable>
      )}
    </View>
  );
}

/* ── Kəsim kartı (məhsul) ── */
function CutCard({ animal, part, cut }) {
  const { lang } = useLanguage();
  const { items, addToCart, removeItem } = useMeatCart();
  const lineId = `${animal.key}__${part.key}__${cut._id}`;
  const inCartQty = items.find((i) => i.lineId === lineId)?.quantityKg || 0;
  const isWholePiece = cut.soldByWeight === false && cut.weightKg > 0;
  const soldByWeight = !isWholePiece;
  const pieceWeight = cut.weightKg || 0;
  const remaining = isWholePiece
    ? pieceWeight
    : Math.max(0, (cut.stockKg || 0) - inCartQty);
  const step = isWholePiece ? cut.stepKg || 1 : 0.5;
  const min = isWholePiece ? pieceWeight : Math.min(0.5, remaining || 0.5);
  const [qty, setQty] = useState(min);
  const outOfStock = isWholePiece ? false : remaining <= 0;
  const displayQty = isWholePiece ? pieceWeight : qty;
  const totalPrice = Math.round(cut.pricePerKg * displayQty * 100) / 100;
  const hasDiscount = cut.discountPercent > 0;
  const discountedPricePerKg = hasDiscount
    ? Math.round(cut.pricePerKg * (1 - cut.discountPercent / 100) * 100) / 100
    : cut.pricePerKg;
  const discountedTotalPrice = hasDiscount
    ? Math.round(displayQty * discountedPricePerKg * 100) / 100
    : totalPrice;

  const clamp = (v) => Math.max(min, Math.min(v, remaining));
  const dec = () => setQty((q) => Math.max(min, q - step));
  const inc = () => setQty((q) => clamp(q + step));

  const handleAdd = () => {
    if (outOfStock) return;
    addToCart(
      {
        animalKey: animal.key,
        animalNameAz: animal.nameAz,
        partKey: part.key,
        partNameAz: part.displayName || part.nameAz,
        cutId: cut._id,
        cutNameAz: cut.nameAz,
        imageUrl: cut.imageUrl,
        pricePerKg: discountedPricePerKg,
        stockKg: isWholePiece ? pieceWeight : cut.stockKg,
        stepKg: step,
        minKg: cut.minKg,
        soldByWeight,
      },
      soldByWeight ? qty : pieceWeight,
    );
    if (soldByWeight) setQty(min);
  };

  const isRemove = inCartQty > 0 && (isWholePiece || outOfStock);

  return (
    <View style={styles.cutCard}>
      <View style={styles.cutImgWrap}>
        {/* Veb-dəki kimi: foto kartın tam kənarına yox, nazik ağ "çərçivə"
            içində (yuxarı/sol/sağ 10px, alt 0) göstərilir — künc nişanları
            bu boşluqda fotonun üstünə çıxır. */}
        <View style={styles.cutImgFrame}>
          {cut.imageUrl ? (
            <Image
              source={{ uri: cut.imageUrl }}
              style={styles.cutImg}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.cutImgFallback}>
              <ShoppingCart size={23} color="rgba(75,15,15,0.3)" />
            </View>
          )}

          {inCartQty > 0 && (
            <View style={styles.cutInCartOverlay}>
              <View style={styles.cutInCartCircle}>
                <ShoppingCart size={17} color={BRAND} strokeWidth={2.4} />
              </View>
            </View>
          )}
        </View>

        {!outOfStock && (
          <View style={styles.cutQtyBadge}>
            <Text style={styles.cutQtyBadgeText}>
              {isWholePiece
                ? `${pieceWeight} ${t(lang, "kgUnit")}`
                : `${t(lang, "meatProducts_stockPrefix")} ${remaining} ${t(lang, "kgUnit")}`}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.cutPriceBadge,
            hasDiscount && styles.cutPriceBadgeDiscount,
          ]}
        >
          {hasDiscount && (
            <Text style={styles.cutBadgeStrikeText}>
              {isWholePiece ? totalPrice.toFixed(2) : cut.pricePerKg}
            </Text>
          )}
          <Text
            style={[
              styles.cutBadgeText,
              hasDiscount && styles.cutBadgeTextDiscount,
            ]}
          >
            {isWholePiece
              ? discountedTotalPrice.toFixed(2)
              : discountedPricePerKg}{" "}
            AZN
            {soldByWeight ? `/${t(lang, "kgUnit")}` : ""}
          </Text>
        </View>

        {hasDiscount && (
          <View style={styles.discountRibbonClip} pointerEvents="none">
            <View style={styles.discountRibbon}>
              <Text style={styles.discountRibbonText}>
                -{cut.discountPercent}%
              </Text>
            </View>
          </View>
        )}

        {/* Veb-dəki kimi: kəsimin adı fotonun aşağı-sol küncündə, tünd
            (qaradımtıl) fonlu, yalnız sağ-üst küncü yumru nişan — sol və
            alt kənarlara bitişik, tam eni əhatə edən qradient yox. */}
        <Text style={styles.cutNameOverlay} numberOfLines={1}>
          {cut.nameAz}
        </Text>
      </View>

      <View style={styles.cutBody}>
        <View style={styles.cutRow}>
          {outOfStock ? (
            <Text style={styles.cutOutOfStock}>{t(lang, "meatProducts_outOfStock")}</Text>
          ) : soldByWeight ? (
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepperBtn}
                onPress={dec}
                hitSlop={8}
              >
                <Minus size={16} color="#57534e" />
              </Pressable>
              <Text style={styles.stepperText}>{qty} {t(lang, "kgUnit")}</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={inc}
                disabled={qty >= remaining}
                hitSlop={8}
              >
                <Plus size={16} color="#57534e" />
              </Pressable>
            </View>
          ) : (
            <Text style={styles.cutPriceLabel}>
              {hasDiscount && (
                <Text style={styles.cutPriceLabelStrike}>
                  {cut.pricePerKg}{" "}
                </Text>
              )}
              {discountedPricePerKg} AZN/{t(lang, "kgUnit")}
            </Text>
          )}

          {/* Veb-dəki kimi: dairəvi düymə həmişə səbət ikonu göstərir, yalnız
              künc nişanı ("+" / "−") və rəng (yaşıl/qırmızı) dəyişir. */}
          <Pressable
            style={[
              styles.cutAddBtn,
              isRemove ? styles.cutAddBtnRemove : styles.cutAddBtnAdd,
            ]}
            disabled={outOfStock && !isRemove}
            onPress={isRemove ? () => removeItem(lineId) : handleAdd}
            hitSlop={6}
          >
            <ShoppingCart size={19} color="#fff" strokeWidth={2.2} />
            <View style={styles.cutAddBtnBadge}>
              <Text
                style={[
                  styles.cutAddBtnBadgeText,
                  { color: isRemove ? "#dc2626" : "#15803d" },
                ]}
              >
                {isRemove ? "−" : "+"}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MeatProductsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth, height: viewportHeight } =
    useWindowDimensions();
  const { user } = useAuth();
  const { lang } = useLanguage();
  const { items, itemsTotal, itemCount, updateQuantity, removeItem } =
    useMeatCart();
  const { location, setLocation, deliveryPrice, isLoaded: locationLoaded } =
    useMeatDeliveryLocation();

  const [animals, setAnimals] = useState([]);
  const [foods, setFoods] = useState([]);
  const [foodFilterIds, setFoodFilterIds] = useState([]);
  const [organs, setOrgans] = useState([]);
  // Admin panelindən (backend /app-config/settings) gələn heyvan hissəsi
  // ad/nömrə override-ları — veb-dəki eyni məntiq (bax: getDisplayParts).
  const [animalPartSettings, setAnimalPartSettings] = useState({});
  const [groundProducts, setGroundProducts] = useState([]);
  const foodAnimalMap = useMemo(
    () => computeFoodAnimalKeys(animals, organs, groundProducts),
    [animals, organs, groundProducts],
  );
  const [loading, setLoading] = useState(true);
  // Diaqram/hissə seçicisində üfüqi sürüşdürmə gedərkən əsas səhifənin
  // şaquli scroll-u müvəqqəti söndürülür — barmaq bir az əyri getsə belə
  // scroll "udmasın", sürüşdürmə hər dəfə düzgün işləsin.
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [selectedAnimalKey, setSelectedAnimalKey] = useState(
    route.params?.animal || "qoyun",
  );
  const [selectedPartKey, setSelectedPartKey] = useState(null);
  const [extraMode, setExtraMode] = useState(null); // null | "organs" | "ground"
  const [swipeDir, setSwipeDir] = useState(null); // "left" | "right" | null
  const diagramTranslateX = useRef(new Animated.Value(0)).current;
  const diagramOpacity = useRef(new Animated.Value(1)).current;

  // Sol (çatdırılma) və sağ (yeməyə görə filtr) üzən dairələr — basılan
  // düymənin ekrandakı mərkəzini ölçüb MobileGrowModal-a ötürürük ki, panel
  // məhz o nöqtədən "böyüyərək" açılsın (web-dəki kimi).
  const deliveryBtnRef = useRef(null);
  const foodBtnRef = useRef(null);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);
  // Bu ekran ilk dəfə (fresh) açılanda, çatdırılma yeri hələ seçilməyibsə,
  // modal avtomatik açılsın — veb-dəki eyni davranış. "autoModalChecked"
  // bunu YALNIZ BİR DƏFƏ edir: React Navigation stack-də "geri" düyməsi
  // (məs. Ödəniş xülasəsindən) bu ekranı YENİDƏN MOUNT ETMİR (stack-də artıq
  // canlı qalır) — ona görə geri qayıdanda modal bir də açılmır, yalnız
  // TƏZƏ (ilk) girişdə açılır.
  const [autoModalChecked, setAutoModalChecked] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [deliveryAnchor, setDeliveryAnchor] = useState(null);
  const [foodAnchor, setFoodAnchor] = useState(null);
  const cartSwipeStartY = useRef(null);
  // PanResponder callback-ləri yalnız YARADILDIQLARI anda tutulan "closure"
  // dəyərlərini görür (useRef(PanResponder.create(...)) yalnız ilk render-i
  // saxlayır) — ona görə cari showCartSheet-i bu ref üzərindən oxuyuruq ki,
  // sürüşdürmə həmişə həqiqi vəziyyətə uyğun olsun.
  const showCartSheetRef = useRef(showCartSheet);

  // Panelin aç/bağla hündürlük keçidi "Animated.Value" ilə deyil, RN-in bunun
  // üçün nəzərdə tutulmuş "LayoutAnimation" API-si ilə edilir — JS-driven
  // (useNativeDriver:false) Animated.Value ilə height/maxHeight animasiya
  // etmək RN-də tanınmış "Cannot add new property '_tracking'" çökməsinə
  // səbəb olurdu (dev-də effektlərin təkrar işə düşməsi zamanı). Vəziyyəti
  // dəyişdirmədən BİR addım əvvəl çağırılmalıdır.
  const setCartSheetOpen = (next) => {
    LayoutAnimation.configureNext({
      duration: 280,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    setShowCartSheet(next);
  };

  const total = itemsTotal + (items.length ? deliveryPrice : 0);
  // Çatdırılma seçilməyəndə də düymə basıla bilməlidir — "handleCheckout"
  // artıq bu halda naviqasiya etmək əvəzinə çatdırılma modalını açır (aşağı
  // bax), veb-dəki eyni davranış. Düymə yalnız səbət boşdursa deaktivdir.
  const canCheckout = itemCount > 0;
  const cartThumbnailCount = viewportWidth >= 420 ? 4 : 3;
  const cartSheetMaxHeight = Math.min(Math.round(viewportHeight * 0.68), 520);
  // DİQQƏT: "insets.top" burada YENİDƏN əlavə edilməməlidir — MeatStepHeader
  // artıq öz daxilində insets.top-u hesaba qatıb (status bar-ın altına düşür),
  // "iconAnchor" isə HƏMİN header-dən dərhal SONRA gəlir, yəni artıq təhlükəsiz
  // zonanın altındadır. insets.top-u bir də əlavə etmək səhifənin lap
  // yuxarısında lazımsız boş sahə yaradırdı (bu, indi bildirilən bug idi).
  const floatingBtnTop = 8;
  const contentTopPadding = 58;

  const openDelivery = () => {
    if (!deliveryBtnRef.current?.measureInWindow) {
      setDeliveryAnchor({ x: 34, y: 124 });
      setDeliveryOpen(true);
      return;
    }
    deliveryBtnRef.current.measureInWindow((x, y, w, h) => {
      setDeliveryAnchor({ x: x + w / 2, y: y + h / 2 });
      setDeliveryOpen(true);
    });
  };
  const openFood = () => {
    foodBtnRef.current?.measureInWindow((x, y, w, h) => {
      setFoodAnchor({ x: x + w / 2, y: y + h / 2 });
      setFoodOpen(true);
    });
  };

  // İlk dəfə "Ət Satışı"na daxil olanda çatdırılma yeri seçilməyibsə modalı
  // aç (veb-dəki eyni məntiq). "locationLoaded" gözlənilir ki, AsyncStorage-
  // dən əvvəlki seçim oxunmamış modal bir anlıq yanlışlıqla açılıb-bağlanmasın.
  useEffect(() => {
    if (!locationLoaded || autoModalChecked) return;
    setAutoModalChecked(true);
    if (!location) openDelivery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationLoaded, autoModalChecked, location]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, []),
  );

  useEffect(() => {
    api
      .get("/meat/animals")
      .then((res) => {
        const list = res.data?.data?.animals || [];
        setAnimals(list);
        const requested = route.params?.animal;
        const hasRequested = requested && list.some((a) => a.key === requested);
        const initialAnimal = hasRequested ? requested : list[0]?.key;
        setSelectedAnimalKey(initialAnimal);
        const firstAnimal = list.find((a) => a.key === initialAnimal);
        setSelectedPartKey(
          getFirstDisplayPartKey(initialAnimal, firstAnimal?.bodyParts),
        );
      })
      .catch((err) => console.error("meat/animals fetch failed:", err.message))
      .finally(() => setLoading(false));

    api
      .get("/meat/foods")
      .then((res) => setFoods(res.data?.data?.foods || []))
      .catch(() => {}); // backend-də bu route hələ hər mühitdə mövcud olmaya bilər

    api
      .get("/meat/organs")
      .then((res) => setOrgans(res.data?.data?.organs || []))
      .catch(() => {});

    api
      .get("/meat/ground-products")
      .then((res) => setGroundProducts(res.data?.data?.products || []))
      .catch(() => {});

    api
      .get("/app-config/settings")
      .then((res) => setAnimalPartSettings(res.data?.data?.animalPartSettings || {}))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (itemCount === 0 && showCartSheet) setCartSheetOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCount, showCartSheet]);

  useEffect(() => {
    showCartSheetRef.current = showCartSheet;
  }, [showCartSheet]);

  useEffect(() => {
    // Yalnız sürüşdürmə ilə keçiddə animasiya edir (tab-a klikləmədə yox —
    // "handleTabSelectAnimal" swipeDir-i null edir). "opacity"/"transform"
    // native driver dəstəklədiyi üçün əvvəlki "height" bug-ına uğramır.
    if (!swipeDir) return;
    diagramTranslateX.setValue(swipeDir === "right" ? 18 : -18);
    diagramOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(diagramTranslateX, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(diagramOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnimalKey]);

  // Sadə sürüşdürmə: canlı izləmə (drag-follow) yoxdur — sadəcə buraxıldıqda
  // istiqaməti ölçüb aç/bağla vəziyyətini dəyişir, animasiyanı isə yenə
  // "setCartSheetOpen" (LayoutAnimation) idarə edir.
  const cartSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 8,
      onPanResponderGrant: () => {
        cartSwipeStartY.current = null;
      },
      onPanResponderRelease: (_, gestureState) => {
        const isOpen = showCartSheetRef.current;
        if (gestureState.dy > 40 && isOpen) {
          setCartSheetOpen(false);
        } else if (gestureState.dy < -40 && !isOpen) {
          setCartSheetOpen(true);
        }
        cartSwipeStartY.current = null;
      },
    }),
  ).current;

  const selectedAnimal = animals.find((a) => a.key === selectedAnimalKey);
  const displayParts = useMemo(
    () =>
      getDisplayParts(
        selectedAnimalKey,
        selectedAnimal?.bodyParts || [],
        animalPartSettings,
        lang,
      ),
    [selectedAnimalKey, selectedAnimal, animalPartSettings, lang],
  );
  const selectedPart = selectedAnimal?.bodyParts?.find(
    (p) => p.key === selectedPartKey,
  );
  // Stoku bitmiş (və səbətdə də olmayan) kəsim heç göstərilmir — veb-dəki
  // eyni qayda (bax: web/app/meat/products/page.js isAvailable). Səbətdə
  // olan (remaining=0 amma inCartQty>0) kəsim isə çıxarıla bilsin deyə qalır.
  const visiblePartCuts = useMemo(() => {
    if (!selectedAnimal || !selectedPart) return [];
    return (selectedPart.cuts || []).filter((cut) => {
      const lineId = `${selectedAnimal.key}__${selectedPart.key}__${cut._id}`;
      const stockKg = cut.soldByWeight === false ? cut.weightKg : cut.stockKg;
      const inCartQty = items.find((i) => i.lineId === lineId)?.quantityKg || 0;
      const remaining = Math.max(0, (stockKg || 0) - inCartQty);
      return remaining > 0 || inCartQty > 0;
    });
  }, [selectedAnimal, selectedPart, items]);
  const organsAvailable = organs.some(
    (o) =>
      o.animalKey === selectedAnimalKey && cutMatchesFoods(o, foodFilterIds),
  );
  const groundAvailable =
    groundProducts.some(
      (p) =>
        p.animalKey === selectedAnimalKey &&
        p.stockKg > 0 &&
        cutMatchesFoods(p, foodFilterIds),
    ) ||
    (selectedAnimal?.bodyParts || []).some((part) =>
      (part.cuts || []).some(
        (cut) =>
          cut.isGroundMeat &&
          (cut.soldByWeight === false ? cut.weightKg : cut.stockKg) > 0 &&
          cutMatchesFoods(cut, foodFilterIds),
      ),
    );

  const handleSelectAnimal = (key) => {
    setSelectedAnimalKey(key);
    setExtraMode(null);
    const animal = animals.find((a) => a.key === key);
    setSelectedPartKey(getFirstDisplayPartKey(key, animal?.bodyParts));
  };

  // Diaqramı barmaqla sağa/sola sürüşdürərək heyvanlar arası keçid — veb-
  // dəki eyni davranış: AnimalSwitcher tab sırası ilə, sonuncudan sonra
  // birinciyə (loop), yeni məzmun yüngül slide+fade ilə görünür.
  const handleTabSelectAnimal = (key) => {
    setSwipeDir(null);
    handleSelectAnimal(key);
  };

  // DİQQƏT: bunu artıq AnimalBodyMap-ın öz "onSwipe" prop-u çağırır (bax
  // components/meat/AnimalBodyMap.js) — diaqramın üzərinə əlavə etdiyimiz
  // ayrıca onTouchStart/onTouchEnd işləmirdi, çünki AnimalBodyMap toxunmanı
  // dərhal (onStartShouldSetResponder) özü tutur və buraxmır
  // (onResponderTerminationRequest: () => false) — ona görə valideyndəki
  // sadə toxunma dinləyiciləri ümumiyyətlə işə düşmürdü.
  const handleDiagramSwipe = (direction) => {
    if (animals.length < 2) return;
    const idx = animals.findIndex((a) => a.key === selectedAnimalKey);
    if (idx === -1) return;
    if (direction === "next") {
      // Sola sürüşdürmə → növbəti heyvan (yeni məzmun sağdan girir)
      const next = animals[(idx + 1) % animals.length];
      setSwipeDir("right");
      handleSelectAnimal(next.key);
    } else {
      // Sağa sürüşdürmə → əvvəlki heyvan (yeni məzmun soldan girir)
      const prev = animals[(idx - 1 + animals.length) % animals.length];
      setSwipeDir("left");
      handleSelectAnimal(prev.key);
    }
  };

  const handleSelectPart = (key) => {
    setExtraMode(null);
    setSelectedPartKey(key);
  };

  const handleSelectExtra = (mode) => {
    setExtraMode((prev) => (prev === mode ? null : mode));
    setSelectedPartKey(null);
  };

  const handleCheckout = () => {
    if (itemCount <= 0) return;
    if (!location || !location.phones?.length) {
      openDelivery();
      return;
    }
    setCartSheetOpen(false);
    navigation.navigate("MeatCheckoutSummary");
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {/* Qurbanlıq axınındakı (OrderQuantityScreen) kimi — bu dərinlik
          səhifəsində əsas "Ət Satışı" üst zolağı yoxdur, yalnız geri
          düyməsi + addım göstəricisi ən üstdə gəlir. */}
      <MeatStepHeader currentStep={1} />

      {loading ? (
        // Veb-dəki eyni erkən "return" davranışı — yüklənən zaman YALNIZ
        // başlıq + mərkəzləşmiş spinner görünür, çatdırılma/yemək filtri
        // dairələri (aşağıda) hələ göstərilmir (bu, əvvəlki bug idi).
        <View style={styles.centerBox}>
          <MeatSpinner size={32} />
        </View>
      ) : (
        <>
          {/* Çatdırılma ünvanı (sol) və yeməyə görə filtr (sağ) — "fixed" kimi
              scroll-dan təsirlənmirlər. Bu wrapper addım-başlığından dərhal sonra
              normal axında gəlir (hündürlüyü 0-dır), düymələr ona nisbətən mütləq
              mövqeləndiyi üçün ekranın yox, məhz addım-başlığının altında qalır. */}
          <View style={styles.iconAnchor}>
            <Pressable
              ref={deliveryBtnRef}
              style={[styles.iconBtnLeft, { top: floatingBtnTop }]}
              onPress={openDelivery}
            >
              <MapPin size={20} color="#fff" strokeWidth={2.3} />
              {!!location && <View style={styles.iconDot} />}
            </Pressable>
            <Pressable
              ref={foodBtnRef}
              style={[styles.iconBtnRight, { top: floatingBtnTop }]}
              onPress={openFood}
            >
              <UtensilsCrossed size={20} color="#dc2626" strokeWidth={2.3} />
              {foodFilterIds.length > 0 && (
                <View style={styles.iconBadge}>
                  <Text style={styles.iconBadgeText}>{foodFilterIds.length}</Text>
                </View>
              )}
            </Pressable>
          </View>

        <ScrollView
          style={{ flex: 1 }}
          scrollEnabled={scrollEnabled}
          contentContainerStyle={{
            padding: scale(14),
            paddingTop: contentTopPadding,
            paddingBottom: scale(110),
            gap: scale(12),
          }}
        >
          {selectedAnimal && (
            <>
              <View style={styles.card}>
                <AnimalSwitcher
                  animals={animals}
                  selectedKey={selectedAnimalKey}
                  onSelect={handleTabSelectAnimal}
                />

                <Animated.View
                  style={[
                    styles.diagramWrap,
                    {
                      opacity: diagramOpacity,
                      transform: [{ translateX: diagramTranslateX }],
                    },
                  ]}
                >
                  <AnimalBodyMap
                    animalKey={selectedAnimalKey}
                    parts={selectedAnimal.bodyParts || []}
                    selectedPartKey={extraMode ? null : selectedPartKey}
                    onSelectPart={handleSelectPart}
                    foodFilterIds={foodFilterIds}
                    onSwipe={handleDiagramSwipe}
                    onDragActive={(active) => setScrollEnabled(!active)}
                    animalPartSettings={animalPartSettings}
                    lang={lang}
                  />
                </Animated.View>

                <PartsPager
                  parts={displayParts}
                  selectedPartKey={extraMode ? null : selectedPartKey}
                  onSelectPart={handleSelectPart}
                  onDragActive={(active) => setScrollEnabled(!active)}
                />

                <View style={styles.extraRow}>
                  <Pressable
                    style={[
                      styles.extraBtn,
                      extraMode === "organs" && styles.extraBtnActive,
                      !organsAvailable && styles.extraBtnDisabled,
                    ]}
                    disabled={!organsAvailable}
                    onPress={() => handleSelectExtra("organs")}
                  >
                    <Text
                      style={[
                        styles.extraBtnText,
                        extraMode === "organs" && styles.extraBtnTextActive,
                        !organsAvailable && styles.extraBtnTextDisabled,
                      ]}
                    >
                      {t(lang, "meatProducts_organsBtn")}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.extraBtn,
                      extraMode === "ground" && styles.extraBtnActive,
                      !groundAvailable && styles.extraBtnDisabled,
                    ]}
                    disabled={!groundAvailable}
                    onPress={() => handleSelectExtra("ground")}
                  >
                    <Text
                      style={[
                        styles.extraBtnText,
                        extraMode === "ground" && styles.extraBtnTextActive,
                        !groundAvailable && styles.extraBtnTextDisabled,
                      ]}
                    >
                      {t(lang, "meatProducts_groundBtn")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.productsGrid}>
                {extraMode === "organs" ? (
                  (() => {
                    const matches = organs.filter(
                      (o) =>
                        o.animalKey === selectedAnimalKey &&
                        cutMatchesFoods(o, foodFilterIds),
                    );
                    return matches.length === 0 ? (
                      <Text style={styles.emptyText}>
                        {t(lang, "meatProducts_noOrgans")}
                      </Text>
                    ) : (
                      matches.map((organ) => (
                        <CutCard
                          key={organ._id}
                          animal={selectedAnimal}
                          part={{
                            key: "daxili-orqan",
                            nameAz: t(lang, "meatProducts_organPartLabel"),
                          }}
                          cut={{
                            _id: organ._id,
                            nameAz: organ.nameAz,
                            pricePerKg: organ.pricePerKg,
                            stockKg: organ.weightKg,
                            stepKg: organ.weightKg,
                            minKg: organ.weightKg,
                            imageUrl: organ.imageUrl,
                          }}
                        />
                      ))
                    );
                  })()
                ) : extraMode === "ground" ? (
                  (() => {
                    const syntheticPart = {
                      key: "cekilmis-et",
                      nameAz: t(lang, "meatProducts_groundBtn"),
                    };
                    const productEntries = groundProducts
                      .filter(
                        (p) =>
                          p.animalKey === selectedAnimalKey &&
                          cutMatchesFoods(p, foodFilterIds),
                      )
                      .map((product) => ({
                        part: syntheticPart,
                        cut: {
                          _id: product._id,
                          nameAz: product.nameAz,
                          pricePerKg: product.pricePerKg,
                          stockKg: product.stockKg,
                          stepKg: 0.5,
                          minKg: 0.5,
                          imageUrl: product.imageUrl,
                        },
                      }));
                    // Admin bir kəsimi "Bu qiymədir" işarələyəndə, ayrıca
                    // "Çəkilmiş ət" qeydi əlavə etməyə ehtiyac qalmır — həmin
                    // kəsim öz HƏQİQİ bölməsi (partKey) ilə burada da göstərilir,
                    // ona görə səbət sətri (lineId) hər iki yerdə eynidir və
                    // stok tək yerdə (bu kəsimdə) saxlanılır — veb-dəki eyni fix.
                    const cutEntries = (selectedAnimal?.bodyParts || []).flatMap(
                      (part) =>
                        (part.cuts || [])
                          .filter(
                            (cut) =>
                              cut.isGroundMeat &&
                              cutMatchesFoods(cut, foodFilterIds),
                          )
                          .map((cut) => ({ part, cut })),
                    );
                    const matches = [...cutEntries, ...productEntries];
                    return matches.length === 0 ? (
                      <Text style={styles.emptyText}>
                        {t(lang, "meatProducts_noGround")}
                      </Text>
                    ) : (
                      matches.map(({ part, cut }) => (
                        <CutCard
                          key={`${part.key}__${cut._id}`}
                          animal={selectedAnimal}
                          part={part}
                          cut={cut}
                        />
                      ))
                    );
                  })()
                ) : visiblePartCuts.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {t(lang, "meatProducts_noPartProducts")}
                  </Text>
                ) : (
                  visiblePartCuts.map((cut) => (
                    <CutCard
                      key={cut._id}
                      animal={selectedAnimal}
                      part={selectedPart}
                      cut={cut}
                    />
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
        </>
      )}

      {itemCount > 0 && (
        <>
          {/* Sadə, birbaşa showCartSheet-ə bağlı göstərmə — heç bir animasiya
              və ya "finished callback"-dan asılı deyil, ona görə bağlananda
              ekranda TƏK bir kadr belə qaralma qala bilməz. */}
          {showCartSheet && (
            <Pressable
              style={styles.cartSheetBackdrop}
              onPress={() => setCartSheetOpen(false)}
            />
          )}

          <View style={styles.cartDock}>
            <View
              style={styles.cartTopRail}
              {...cartSheetPanResponder.panHandlers}
            >
              <Pressable
                style={styles.cartToggleArea}
                onPress={() => setCartSheetOpen(!showCartSheet)}
              >
                <View style={styles.cartBubble}>
                  <ShoppingCart size={24} color="#fff" strokeWidth={2.25} />
                  <View style={styles.cartBubbleBadge}>
                    <Text style={styles.cartBubbleBadgeText}>
                      {items.length > 99 ? "99+" : items.length}
                    </Text>
                  </View>
                </View>

                <View style={styles.cartThumbsRow}>
                  {items.slice(-cartThumbnailCount).map((it, i) => (
                    <View
                      key={it.lineId}
                      style={[styles.cartThumb, i > 0 && styles.cartThumbStack]}
                    >
                      <LinearGradient
                        colors={["#F1E5E5", "#E3C9C9"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                      {it.imageUrl ? (
                        <Image
                          source={{ uri: it.imageUrl }}
                          style={styles.cartThumbImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Beef size={21} color="rgba(75,15,15,0.6)" />
                      )}
                    </View>
                  ))}
                </View>
              </Pressable>

              {showCartSheet ? (
                <Text style={styles.cartExpandedTotal}>
                  {itemsTotal.toFixed(2)} AZN
                </Text>
              ) : (
                <Pressable
                  style={[
                    styles.cartPayBtn,
                    !canCheckout && styles.cartPayBtnDisabled,
                  ]}
                  onPress={handleCheckout}
                  disabled={!canCheckout}
                >
                  <Text style={styles.cartPayBtnText}>{t(lang, "meatProducts_payBtn")}</Text>
                  <View style={styles.cartPayDivider} />
                  <View style={styles.cartPayAmountWrap}>
                    <Text style={styles.cartPayAmountText}>
                      {total.toFixed(2)}
                    </Text>
                    <Text style={styles.cartPayAznText}>AZN</Text>
                  </View>
                </Pressable>
              )}
            </View>

            <View
              style={styles.cartSheetPanel}
              pointerEvents={showCartSheet ? "auto" : "none"}
            >
              {/* maxHeight (height DEYİL!) birbaşa ScrollView-un özündə —
                  veb-in "maxHeight + overflow-y:auto" davranışının eynisi:
                  məzmun bu tavandan qısadırsa qutu ONA sıxılır (boşluq
                  qalmır), uzundursa daxildə scroll aktivləşir. */}
              <ScrollView
                  style={[
                    styles.cartSheetList,
                    { maxHeight: showCartSheet ? cartSheetMaxHeight : 0 },
                  ]}
                  contentContainerStyle={styles.cartSheetListContent}
                  showsVerticalScrollIndicator={true}
                >
                  {items.length === 0 ? (
                    <View style={styles.cartEmptyState}>
                      <ShoppingBag size={30} color="#e7e5e4" />
                      <Text style={styles.cartEmptyText}>{t(lang, "meatProducts_cartEmpty")}</Text>
                    </View>
                  ) : (
                    items.map((it) => (
                      <View key={it.lineId} style={styles.sheetItemRow}>
                        <View style={styles.sheetItemImageWrap}>
                          {it.imageUrl ? (
                            <Image
                              source={{ uri: it.imageUrl }}
                              style={styles.sheetItemImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Beef size={25} color="rgba(75,15,15,0.7)" />
                          )}
                        </View>

                        <View style={styles.sheetItemBody}>
                          <View style={styles.sheetItemTop}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                style={styles.sheetItemTitle}
                                numberOfLines={2}
                              >
                                {it.cutNameAz}
                              </Text>
                              <Text
                                style={styles.sheetItemMeta}
                                numberOfLines={1}
                              >
                                {it.animalNameAz} · {it.partNameAz}
                              </Text>
                            </View>
                            <Pressable
                              style={styles.sheetTrashBtn}
                              onPress={() => removeItem(it.lineId)}
                            >
                              <Trash2 size={18} color="#d6d3d1" />
                            </Pressable>
                          </View>

                          <View style={styles.sheetItemBottom}>
                            {it.soldByWeight === false ? (
                              <Text style={styles.sheetQtyText}>
                                {it.quantityKg.toFixed(2)} {t(lang, "kgUnit")}
                              </Text>
                            ) : (
                              <View style={styles.sheetStepper}>
                                <Pressable
                                  style={styles.sheetStepperBtn}
                                  onPress={() =>
                                    updateQuantity(
                                      it.lineId,
                                      it.quantityKg - it.stepKg,
                                    )
                                  }
                                >
                                  <Minus size={15} color="#57534e" />
                                </Pressable>
                                <Text style={styles.sheetStepperText}>
                                  {it.quantityKg.toFixed(2)} {t(lang, "kgUnit")}
                                </Text>
                                <Pressable
                                  style={styles.sheetStepperBtn}
                                  onPress={() =>
                                    updateQuantity(
                                      it.lineId,
                                      it.quantityKg + it.stepKg,
                                    )
                                  }
                                  disabled={it.quantityKg >= it.stockKg}
                                >
                                  <Plus size={15} color="#57534e" />
                                </Pressable>
                              </View>
                            )}

                            <Text style={styles.sheetItemPrice}>
                              {(it.pricePerKg * it.quantityKg).toFixed(2)} AZN
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}

                  <View style={styles.sheetSummaryCard}>
                    <View style={styles.sheetSummaryRow}>
                      <Text style={styles.sheetSummaryLabel}>{t(lang, "meatProducts_productsLabel")}</Text>
                      <Text style={styles.sheetSummaryLabel}>
                        {itemsTotal.toFixed(2)} AZN
                      </Text>
                    </View>
                    <View style={styles.sheetSummaryRow}>
                      <Text style={styles.sheetSummaryLabel}>{t(lang, "step2")}</Text>
                      <Text style={styles.sheetSummaryLabel}>
                        {items.length
                          ? `${deliveryPrice.toFixed(2)} AZN`
                          : "—"}
                      </Text>
                    </View>
                    <View style={styles.sheetSummaryTotalRow}>
                      <Text style={styles.sheetSummaryTotalText}>{t(lang, "totalRow")}</Text>
                      <Text style={styles.sheetSummaryTotalText}>
                        {total.toFixed(2)} AZN
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={[
                      styles.sheetCheckoutBtn,
                      !canCheckout && styles.sheetCheckoutBtnDisabled,
                    ]}
                    onPress={handleCheckout}
                    disabled={!canCheckout}
                  >
                    <Text style={styles.sheetCheckoutBtnText}>{t(lang, "meatProducts_payBtn")}</Text>
                  </Pressable>
                </ScrollView>
            </View>
          </View>
        </>
      )}

      <MeatBottomNav active="MeatHome" />

      <MobileGrowModal
        open={deliveryOpen}
        anchor={deliveryAnchor}
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

      <MobileGrowModal
        open={foodOpen}
        anchor={foodAnchor}
        onClose={() => setFoodOpen(false)}
        panelHeight="78%"
      >
        <MeatFoodFilterModal
          foods={foods}
          foodAnimalMap={foodAnimalMap}
          initialSelectedIds={foodFilterIds}
          onClose={() => setFoodOpen(false)}
          onApply={(ids) => {
            setFoodFilterIds(ids);
            setFoodOpen(false);
          }}
        />
      </MobileGrowModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF8F5" },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },

  iconAnchor: { height: 0, zIndex: 20 },
  iconBtnLeft: {
    position: "absolute",
    left: scale(14),
    zIndex: 20,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  iconBtnRight: {
    position: "absolute",
    right: scale(14),
    zIndex: 20,
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  iconDot: {
    position: "absolute",
    top: scale(-1),
    right: scale(-1),
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },
  iconBadge: {
    position: "absolute",
    top: scale(-4),
    right: scale(-4),
    minWidth: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(3),
  },
  iconBadgeText: { color: "#fff", fontSize: scaleFont(10.5), fontWeight: "900" },

  card: {
    backgroundColor: "#fff",
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: scale(10),
    gap: scale(10),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  switcher: {
    flexDirection: "row",
    gap: scale(4),
    backgroundColor: "#f5f5f4",
    borderRadius: scale(10),
    padding: scale(3),
  },
  switcherTab: {
    flex: 1,
    paddingVertical: scale(6),
    borderRadius: scale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  switcherTabActive: { backgroundColor: BRAND },
  switcherText: { fontSize: scaleFont(17), fontWeight: "700", color: "#57534e" },
  switcherTextActive: { color: "#fff" },

  // overflow:"hidden" — sürüşdürmə animasiyası (translateX) zamanı məzmun
  // kartın dəyirmi kənarlarından bayıra çıxıb "kart genəlirmiş" kimi
  // görünməsin deyə.
  diagramWrap: { height: scale(210), width: "100%", overflow: "hidden" },

  partsPagerWrap: {
    position: "relative",
    justifyContent: "center",
    paddingHorizontal: scale(5),
    overflow: "hidden",
  },
  partsArrow: {
    position: "absolute",
    top: "50%",
    marginTop: scale(-16),
    zIndex: 10,
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0ede8",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // "minWidth + flexGrow" fərqli mətn uzunluqlarında sıra sayını
  // qeyri-sabit edirdi (bəzən 2, bəzən 3 sütun) — sabit 3 sütun/2 sətir
  // (web-dəki grid-cols-3 kimi) üçün eni faizlə sərt təyin edirik.
  partsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scale(6),
  },
  partBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    width: "32%",
    borderWidth: 1,
    borderColor: "#efe9e2",
    backgroundColor: "#fff",
    borderRadius: scale(8),
    paddingVertical: scale(8),
    paddingHorizontal: scale(8),
  },
  partBtnPlaceholder: {
    width: "32%",
    height: scale(32),
  },
  partBtnDisabled: { backgroundColor: "#f5f5f4", borderColor: "#eee" },
  partBtnSelected: { backgroundColor: "#B01818", borderWidth: 0 },
  partBtnText: {
    fontSize: scaleFont(13),
    fontWeight: "700",
    color: "#57534e",
    flexShrink: 1,
  },
  partBtnTextDisabled: { color: "#a8a29e" },
  partBtnTextSelected: { color: "#fff" },
  partBadge: {
    height: scale(17),
    minWidth: scale(17),
    borderRadius: scale(9),
    backgroundColor: "#F1E5E5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(2),
  },
  partBadgeSelected: { backgroundColor: "#fff" },
  partBadgeText: { fontSize: scaleFont(10.5), fontWeight: "900", color: BRAND },
  partBadgeTextSelected: { color: "#B01818" },

  extraRow: { flexDirection: "row", gap: scale(6) },
  extraBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  extraBtnActive: { backgroundColor: "#B01818", borderColor: "#B01818" },
  extraBtnDisabled: { backgroundColor: "#f5f5f4", borderColor: "#eee" },
  extraBtnText: { fontSize: scaleFont(13), fontWeight: "800", color: "#57534e" },
  extraBtnTextActive: { color: "#fff" },
  extraBtnTextDisabled: { color: "#a8a29e" },

  productsGrid: { flexDirection: "row", flexWrap: "wrap", gap: scale(8) },
  emptyText: {
    width: "100%",
    textAlign: "center",
    paddingVertical: scale(30),
    color: "#a8a29e",
    fontSize: scaleFont(14),
    fontWeight: "600",
  },

  cutCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cutImgWrap: { width: "100%", aspectRatio: 1.4, backgroundColor: "#fff" },
  // Veb-dəki "çərçivə" effekti: foto tam kənara yox, yuxarı/sol/sağ 10px
  // ağ boşluqla göstərilir (alt kənar isə 0 — fotonun altı sarğının altına
  // bitişir), öz künclərində yumru. Bu boşluq sayəsində aşağıdakı künc
  // nişanları sarğının HƏQİQİ küncündə (0,0) qalıb fotonun üstünə çıxır.
  cutImgFrame: {
    position: "absolute",
    left: scale(10),
    right: scale(10),
    top: scale(10),
    bottom: 0,
    borderRadius: scale(8),
    overflow: "hidden",
    backgroundColor: "#F1E5E5",
  },
  cutImg: { width: "100%", height: "100%" },
  cutImgFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  // Veb-dəki kimi: nişanlar sarğının HƏQİQİ küncünə yapışır (offset yoxdur),
  // yalnız kartın öz künc dairəviliyinə baxan tərəf yumrudur (məs. sol-üst
  // nişanda yuxarı-sol və qarşı diaqonaldakı aşağı-sağ), qalan iki künc
  // kəskindir — "tab" görünüşü. Sol (stok/çəki) nişanı AĞ fon + QARA yazı,
  // sağ (qiymət) nişanı isə tünd fon + AĞ yazı.
  cutQtyBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderTopLeftRadius: scale(13),
    borderBottomRightRadius: scale(13),
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cutQtyBadgeText: { color: "#292524", fontSize: scaleFont(11.5), fontWeight: "800" },
  cutPriceBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: BRAND,
    borderTopRightRadius: scale(13),
    borderBottomLeftRadius: scale(13),
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
  },
  cutPriceBadgeDiscount: { backgroundColor: "#facc15" },
  cutBadgeText: { color: "#fff", fontSize: scaleFont(11.5), fontWeight: "800" },
  cutBadgeTextDiscount: { color: "#292524" },
  cutBadgeStrikeText: {
    color: "#78716c",
    fontSize: scaleFont(9),
    fontWeight: "600",
    textDecorationLine: "line-through",
  },
  discountRibbonClip: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: scale(78),
    height: scale(78),
    overflow: "hidden",
  },
  discountRibbon: {
    position: "absolute",
    width: scale(102),
    bottom: scale(10),
    right: scale(-29),
    backgroundColor: "#facc15",
    paddingVertical: scale(3),
    alignItems: "center",
    transform: [{ rotate: "-45deg" }],
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  discountRibbonText: {
    fontSize: scaleFont(12),
    fontWeight: "800",
    color: "#292524",
    letterSpacing: 0.3,
  },
  cutInCartOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  cutInCartCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cutBody: { padding: scale(9), gap: scale(7) },
  cutNameOverlay: {
    position: "absolute",
    left: 0,
    bottom: 0,
    maxWidth: "70%",
    backgroundColor: "rgba(0,0,0,0.65)",
    borderTopRightRadius: scale(12),
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    fontSize: scaleFont(12),
    fontWeight: "800",
    color: "#fff",
  },
  cutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(4),
  },
  cutOutOfStock: { fontSize: scaleFont(11.5), fontWeight: "700", color: "#dc2626" },
  cutPriceLabel: { fontSize: scaleFont(12), fontWeight: "600", color: "#a8a29e" },
  cutPriceLabelStrike: {
    color: "#c4c0ba",
    textDecorationLine: "line-through",
  },
  cutAddBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cutAddBtnAdd: { backgroundColor: "#15803d" },
  cutAddBtnRemove: { backgroundColor: "#dc2626" },
  // Veb-dəki kimi düymənin küncündə kiçik "+" / "−" nişanı.
  cutAddBtnBadge: {
    position: "absolute",
    bottom: scale(-2),
    right: scale(-2),
    width: scale(19),
    height: scale(19),
    borderRadius: scale(9.5),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cutAddBtnBadgeText: { fontSize: scaleFont(13), fontWeight: "900", lineHeight: moderateScale(15) },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
    backgroundColor: "#f5f5f4",
    borderRadius: scale(9),
    paddingHorizontal: scale(2),
  },
  // İstifadəçi rahat basa bilsin deyə toxunma sahəsi böyüdüldü (25 → 34).
  stepperBtn: {
    width: scale(34),
    height: scale(34),
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: { fontSize: scaleFont(13.5), fontWeight: "800", color: "#292524" },

  cartSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 35,
  },
  cartDock: {
    // Əvvəllər "position: absolute" + əl ilə hesablanmış "bottom" məsafəsi
    // istifadə olunurdu ki, MeatBottomNav-ın üstündə otursun — bu, nav-ın
    // həqiqi hündürlüyünü təxmin etməyə əsaslanırdı və dəqiq uyğun gəlməyəndə
    // altında lazımsız boşluq qalırdı. İndi ADİ axında, birbaşa
    // <MeatBottomNav>-dan HƏMİN ƏVVƏL render olunur — beləcə heç bir hesablama
    // olmadan, sıfır boşluqla, mütləq onun düz üstündə oturur.
    zIndex: 40,
  },
  cartTopRail: {
    height: scale(44),
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    backgroundColor: "#F1E5E5",
    borderWidth: 2,
    borderColor: BRAND,
    borderBottomWidth: 0,
    paddingHorizontal: scale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 3,
  },
  cartToggleArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: scale(8),
  },
  cartBubble: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    marginTop: scale(-40),
    zIndex: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  cartBubbleBadge: {
    position: "absolute",
    top: scale(-4),
    right: scale(-4),
    minWidth: scale(23),
    height: scale(23),
    borderRadius: scale(11.5),
    backgroundColor: "#B01818",
    borderWidth: 2,
    borderColor: "#F1E5E5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scale(3),
  },
  cartBubbleBadgeText: {
    color: "#fff",
    fontSize: scaleFont(12.5),
    fontWeight: "900",
    lineHeight: moderateScale(14.5),
  },
  cartThumbsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    paddingLeft: scale(2),
  },
  cartThumb: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    overflow: "hidden",
    borderWidth: 2,
    borderColor: BRAND,
    marginTop: scale(-36),
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cartThumbStack: { marginLeft: scale(-14) },
  cartThumbImage: { width: "100%", height: "100%", resizeMode: "contain" },
  cartExpandedTotal: {
    fontSize: scaleFont(16.5),
    color: "#292524",
    fontWeight: "900",
    paddingHorizontal: scale(4),
  },
  cartPayBtn: {
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: BRAND,
    paddingLeft: scale(14),
    paddingRight: scale(12),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(9),
    marginTop: scale(-37),
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cartPayBtnDisabled: { opacity: 0.45 },
  cartPayBtnText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "900" },
  cartPayDivider: {
    width: scale(1),
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  cartPayAmountWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: scale(4),
  },
  cartPayAmountText: { color: "#fff", fontSize: scaleFont(14.5), fontWeight: "900" },
  cartPayAznText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: scaleFont(11.5),
    fontWeight: "700",
  },

  cartSheetPanel: {
    // Panel HƏMİŞƏ mount olunur, aç/bağla animasiyası birbaşa "height"
    // dəyərini 0 ↔ maxHeight arası dəyişir (veb-dəki maxHeight-transition-un
    // eynisi). ADİ axında (position: absolute DEYİL!) qalmalıdır — veb-də
    // olduğu kimi bütün blok (rail+panel) BİR vahid kimi "bottom"-dan
    // sabitlənib: panel böyüyəndə cartDock-un tam hündürlüyü artır və bu,
    // üstündəki rail-i də yuxarı qaldırır (dock "bottom"-a görə mövqelənir).
    // Height 0-dan başladığı üçün bağlı olanda artıq yer tutmur — əvvəlki
    // "rail düşmür" bug-ı statik maxHeight-dən irəli gəlirdi, indi yoxdur.
    // DİQQƏT: bura paddingTop/Bottom YAZILMASIN — panel HƏMİŞƏ mount
    // olunduğu üçün (bağlı olanda da) belə bir padding ekranda kiçik ağ
    // boşluq kimi qalırdı, hətta ScrollView-un məzmunu 0 hündürlüyə enəndə
    // belə. Padding ona görə aşağıda ScrollView-un "contentContainerStyle"-
    // ində, yəni animasiya olunan sahənin ÖZÜNDƏ verilir.
    overflow: "hidden",
    backgroundColor: "#fff",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: BRAND,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  cartSheetList: { flexGrow: 0 },
  cartSheetListContent: {
    gap: scale(8),
    paddingHorizontal: scale(10),
    paddingTop: scale(8),
    paddingBottom: scale(10),
  },
  cartEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(30),
    gap: scale(6),
  },
  cartEmptyText: { fontSize: scaleFont(14.5), color: "#a8a29e", fontWeight: "600" },
  sheetItemRow: {
    flexDirection: "row",
    gap: scale(11),
    backgroundColor: "#fff",
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "#f0ede8",
    padding: scale(9),
  },
  sheetItemImageWrap: {
    width: scale(62),
    height: scale(62),
    borderRadius: scale(11),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1E5E5",
  },
  sheetItemImage: { width: "100%", height: "100%", resizeMode: "contain" },
  sheetItemBody: { flex: 1, justifyContent: "space-between", minWidth: 0 },
  sheetItemTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: scale(6),
  },
  sheetItemTitle: { fontSize: scaleFont(15.5), fontWeight: "800", color: "#292524" },
  sheetItemMeta: {
    marginTop: scale(2),
    fontSize: scaleFont(13.5),
    color: "#a8a29e",
    fontWeight: "600",
  },
  sheetTrashBtn: { padding: scale(3) },
  sheetItemBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: scale(8),
    marginTop: scale(7),
  },
  sheetQtyText: { fontSize: scaleFont(14.5), fontWeight: "800", color: "#292524" },
  sheetStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(5),
    backgroundColor: "#f5f5f4",
    borderRadius: scale(8),
    paddingHorizontal: scale(4),
    paddingVertical: scale(3),
  },
  sheetStepperBtn: {
    width: scale(29),
    height: scale(29),
    alignItems: "center",
    justifyContent: "center",
  },
  sheetStepperText: { fontSize: scaleFont(14), fontWeight: "800", color: "#292524" },
  sheetItemPrice: { fontSize: scaleFont(15.5), fontWeight: "900", color: BRAND },
  sheetSummaryCard: {
    borderRadius: scale(12),
    backgroundColor: "#FBF8F4",
    paddingHorizontal: scale(11),
    paddingVertical: scale(9),
    gap: scale(6),
  },
  sheetSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetSummaryLabel: { fontSize: scaleFont(13.5), color: "#78716c", fontWeight: "600" },
  sheetSummaryTotalRow: {
    marginTop: scale(3),
    paddingTop: scale(7),
    borderTopWidth: 1,
    borderTopColor: "#f0ede8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetSummaryTotalText: { fontSize: scaleFont(17), fontWeight: "900", color: "#292524" },
  sheetCheckoutBtn: {
    marginTop: scale(8),
    height: scale(48),
    borderRadius: scale(12),
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCheckoutBtnDisabled: { opacity: 0.45 },
  sheetCheckoutBtnText: { color: "#fff", fontSize: scaleFont(17), fontWeight: "900" },
});
