import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  PanResponder,
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

const BRAND = "#4B0F0F";
const PARTS_PAGE_SIZE = 6;

function comingSoon() {
  Alert.alert("Tezliklə", "Bu bölmə hələ hazırlanır.");
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
        numberOfLines={1}
      >
        {part.displayName || part.nameAz}
      </Text>
    </Pressable>
  );
}

/* ── Bədən hissəsi seçici — 2 sətir x 3 sütun, lazım olanda < > ilə səhifələnir ── */
function PartsPager({ parts, selectedPartKey, onSelectPart }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(parts.length / PARTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageParts = parts.slice(
    safePage * PARTS_PAGE_SIZE,
    safePage * PARTS_PAGE_SIZE + PARTS_PAGE_SIZE,
  );
  const hasPager = totalPages > 1;

  return (
    <View style={styles.partsPagerWrap}>
      {hasPager && (
        <Pressable
          style={[styles.partsArrow, { left: 0 }]}
          onPress={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
        >
          <ChevronLeft size={16} color={BRAND} />
        </Pressable>
      )}
      <View style={[styles.partsGrid, hasPager && { marginHorizontal: 28 }]}>
        {pageParts.map((part) => (
          <PartButton
            key={part.key}
            part={part}
            isSelected={selectedPartKey === part.key}
            onPress={() => onSelectPart(part.key)}
          />
        ))}
      </View>
      {hasPager && (
        <Pressable
          style={[styles.partsArrow, { right: 0 }]}
          onPress={() => setPage((p) => (p + 1) % totalPages)}
        >
          <ChevronRight size={16} color={BRAND} />
        </Pressable>
      )}
    </View>
  );
}

/* ── Kəsim kartı (məhsul) ── */
function CutCard({ animal, part, cut }) {
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
        pricePerKg: cut.pricePerKg,
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
        {cut.imageUrl ? (
          <Image
            source={{ uri: cut.imageUrl }}
            style={styles.cutImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cutImgFallback}>
            <ShoppingCart size={20} color="rgba(75,15,15,0.3)" />
          </View>
        )}

        {!outOfStock && (
          <View style={styles.cutQtyBadge}>
            <Text style={styles.cutBadgeText}>{displayQty} kq</Text>
          </View>
        )}
        <View style={styles.cutPriceBadge}>
          <Text style={styles.cutBadgeText}>{totalPrice.toFixed(2)} AZN</Text>
        </View>

        {inCartQty > 0 && (
          <View style={styles.cutInCartOverlay}>
            <View style={styles.cutInCartCircle}>
              <ShoppingCart size={15} color={BRAND} strokeWidth={2.4} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.cutBody}>
        <Text style={styles.cutName} numberOfLines={1}>
          {cut.nameAz}
        </Text>

        <View style={styles.cutRow}>
          {outOfStock ? (
            <Text style={styles.cutOutOfStock}>Stokda qalmayıb</Text>
          ) : soldByWeight ? (
            <View style={styles.stepper}>
              <Pressable style={styles.stepperBtn} onPress={dec}>
                <Minus size={12} color="#57534e" />
              </Pressable>
              <Text style={styles.stepperText}>{qty} kq</Text>
              <Pressable
                style={styles.stepperBtn}
                onPress={inc}
                disabled={qty >= remaining}
              >
                <Plus size={12} color="#57534e" />
              </Pressable>
            </View>
          ) : (
            <Text style={styles.cutPriceLabel}>{cut.pricePerKg} AZN/kq</Text>
          )}

          <Pressable
            style={[
              styles.cutAddBtn,
              isRemove ? styles.cutAddBtnRemove : styles.cutAddBtnAdd,
            ]}
            disabled={outOfStock && !isRemove}
            onPress={isRemove ? () => removeItem(lineId) : handleAdd}
          >
            {isRemove ? (
              <Trash2 size={13} color="#fff" />
            ) : (
              <ShoppingCart size={13} color="#fff" />
            )}
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
  const { items, itemsTotal, itemCount, updateQuantity, removeItem } =
    useMeatCart();
  const { location, setLocation, deliveryPrice } = useMeatDeliveryLocation();

  const [animals, setAnimals] = useState([]);
  const [foods, setFoods] = useState([]);
  const [foodFilterIds, setFoodFilterIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimalKey, setSelectedAnimalKey] = useState(
    route.params?.animal || "qoyun",
  );
  const [selectedPartKey, setSelectedPartKey] = useState(null);
  const [extraMode, setExtraMode] = useState(null); // null | "organs" | "ground"

  // Sol (çatdırılma) və sağ (yeməyə görə filtr) üzən dairələr — basılan
  // düymənin ekrandakı mərkəzini ölçüb MobileGrowModal-a ötürürük ki, panel
  // məhz o nöqtədən "böyüyərək" açılsın (web-dəki kimi).
  const deliveryBtnRef = useRef(null);
  const foodBtnRef = useRef(null);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [deliveryAnchor, setDeliveryAnchor] = useState(null);
  const [foodAnchor, setFoodAnchor] = useState(null);
  // Veb-dəki kimi: panel rail-in altından HÜNDÜRLÜYÜ (0 → maxHeight) artaraq
  // "açılır" — sürüşərək aşağıdan gəlmir. Bu, "translateY" sürüşməsindən
  // fərqli olaraq veb-in maxHeight-transition davranışının məhz özüdür.
  const cartPanelHeight = useRef(new Animated.Value(0)).current;
  const cartSwipeStartY = useRef(null);
  // PanResponder callback-ləri yalnız YARADILDIQLARI anda tutulan "closure"
  // dəyərlərini görür (useRef(PanResponder.create(...)) yalnız ilk render-i
  // saxlayır) — ona görə cari showCartSheet/cartSheetMaxHeight-i bu ref-lər
  // üzərindən oxuyuruq ki, sürüşdürmə həmişə həqiqi vəziyyətə uyğun olsun.
  const showCartSheetRef = useRef(showCartSheet);
  const cartSheetMaxHeightRef = useRef(0);

  const total = itemsTotal + (items.length ? deliveryPrice : 0);
  const canCheckout =
    itemCount > 0 && !!location && location.phones?.length > 0;
  const cartThumbnailCount = viewportWidth >= 420 ? 4 : 3;
  const cartSheetMaxHeight = Math.min(Math.round(viewportHeight * 0.68), 520);
  const floatingBtnTop = insets.top + 8;
  const contentTopPadding = Math.max(66, insets.top + 72);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (itemCount === 0 && showCartSheet) setShowCartSheet(false);
  }, [itemCount, showCartSheet]);

  useEffect(() => {
    showCartSheetRef.current = showCartSheet;
  }, [showCartSheet]);

  useEffect(() => {
    cartSheetMaxHeightRef.current = cartSheetMaxHeight;
  }, [cartSheetMaxHeight]);

  useEffect(() => {
    // "height" layout xüsusiyyətidir — native driver dəstəkləmir (yalnız
    // transform/opacity dəstəklənir), ona görə useNativeDriver: false.
    Animated.timing(cartPanelHeight, {
      toValue: showCartSheet ? cartSheetMaxHeight : 0,
      duration: 320,
      easing: Easing.bezier(0.22, 0.85, 0.28, 1),
      useNativeDriver: false,
    }).start();
  }, [showCartSheet, cartPanelHeight, cartSheetMaxHeight]);

  const cartSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 8,
      onPanResponderGrant: () => {
        cartSwipeStartY.current = null;
      },
      onPanResponderMove: (_, gestureState) => {
        if (cartSwipeStartY.current == null) {
          cartSwipeStartY.current = gestureState.y0;
        }
        const isOpen = showCartSheetRef.current;
        const maxHeight = cartSheetMaxHeightRef.current;
        const deltaY = gestureState.dy;
        if (deltaY > 0 && isOpen) {
          // Aşağı sürüşdürmə — bağlı vəziyyətə doğru kiçilir.
          cartPanelHeight.setValue(Math.max(0, maxHeight - deltaY));
        } else if (deltaY < 0 && !isOpen) {
          // Yuxarı sürüşdürmə — açıq vəziyyətə doğru böyüyür.
          cartPanelHeight.setValue(Math.min(maxHeight, -deltaY));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const isOpen = showCartSheetRef.current;
        if (gestureState.dy > 70 && isOpen) {
          setShowCartSheet(false);
        } else if (gestureState.dy < -70 && !isOpen) {
          setShowCartSheet(true);
        } else {
          Animated.timing(cartPanelHeight, {
            toValue: isOpen ? cartSheetMaxHeightRef.current : 0,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start();
        }
        cartSwipeStartY.current = null;
      },
    }),
  ).current;

  const selectedAnimal = animals.find((a) => a.key === selectedAnimalKey);
  const displayParts = useMemo(
    () => getDisplayParts(selectedAnimalKey, selectedAnimal?.bodyParts || []),
    [selectedAnimalKey, selectedAnimal],
  );
  const selectedPart = selectedAnimal?.bodyParts?.find(
    (p) => p.key === selectedPartKey,
  );

  const handleSelectAnimal = (key) => {
    setSelectedAnimalKey(key);
    setExtraMode(null);
    const animal = animals.find((a) => a.key === key);
    setSelectedPartKey(getFirstDisplayPartKey(key, animal?.bodyParts));
  };

  const handleSelectPart = (key) => {
    setExtraMode(null);
    setSelectedPartKey(key);
  };

  const handleCheckout = () => {
    if (itemCount <= 0) return;
    if (!location || !location.phones?.length) {
      openDelivery();
      return;
    }
    setShowCartSheet(false);
    navigation.navigate("MeatCart");
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {/* Qurbanlıq axınındakı (OrderQuantityScreen) kimi — bu dərinlik
          səhifəsində əsas "Ət Satışı" üst zolağı yoxdur, yalnız geri
          düyməsi + addım göstəricisi ən üstdə gəlir. */}
      <MeatStepHeader currentStep={1} />

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
          <MapPin size={18} color="#fff" strokeWidth={2.3} />
          {!!location && <View style={styles.iconDot} />}
        </Pressable>
        <Pressable
          ref={foodBtnRef}
          style={[styles.iconBtnRight, { top: floatingBtnTop }]}
          onPress={openFood}
        >
          <UtensilsCrossed size={18} color="#dc2626" strokeWidth={2.3} />
          {foodFilterIds.length > 0 && (
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>{foodFilterIds.length}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 14,
            paddingTop: contentTopPadding,
            paddingBottom: 110,
            gap: 12,
          }}
        >
          {selectedAnimal && (
            <>
              <View style={styles.card}>
                <AnimalSwitcher
                  animals={animals}
                  selectedKey={selectedAnimalKey}
                  onSelect={handleSelectAnimal}
                />

                <View style={styles.diagramWrap}>
                  <AnimalBodyMap
                    animalKey={selectedAnimalKey}
                    parts={selectedAnimal.bodyParts || []}
                    selectedPartKey={extraMode ? null : selectedPartKey}
                    onSelectPart={handleSelectPart}
                    foodFilterIds={foodFilterIds}
                  />
                </View>

                <PartsPager
                  parts={displayParts}
                  selectedPartKey={extraMode ? null : selectedPartKey}
                  onSelectPart={handleSelectPart}
                />

                <View style={styles.extraRow}>
                  <Pressable
                    style={[
                      styles.extraBtn,
                      extraMode === "organs" && styles.extraBtnActive,
                    ]}
                    onPress={() => {
                      setExtraMode("organs");
                      comingSoon();
                    }}
                  >
                    <Text
                      style={[
                        styles.extraBtnText,
                        extraMode === "organs" && styles.extraBtnTextActive,
                      ]}
                    >
                      Daxili orqanlar
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.extraBtn,
                      extraMode === "ground" && styles.extraBtnActive,
                    ]}
                    onPress={() => {
                      setExtraMode("ground");
                      comingSoon();
                    }}
                  >
                    <Text
                      style={[
                        styles.extraBtnText,
                        extraMode === "ground" && styles.extraBtnTextActive,
                      ]}
                    >
                      Çəkilmiş ət
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.productsGrid}>
                {(selectedPart?.cuts || []).length === 0 ? (
                  <Text style={styles.emptyText}>
                    Bu hissə üçün hələ məhsul əlavə olunmayıb.
                  </Text>
                ) : (
                  selectedPart.cuts.map((cut) => (
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
      )}

      {itemCount > 0 && (
        <>
          {/* Sadə, birbaşa showCartSheet-ə bağlı göstərmə — heç bir animasiya
              və ya "finished callback"-dan asılı deyil, ona görə bağlananda
              ekranda TƏK bir kadr belə qaralma qala bilməz. */}
          {showCartSheet && (
            <Pressable
              style={styles.cartSheetBackdrop}
              onPress={() => setShowCartSheet(false)}
            />
          )}

          <View style={styles.cartDock}>
            <Animated.View
              style={styles.cartTopRail}
              {...cartSheetPanResponder.panHandlers}
            >
              <Pressable
                style={styles.cartToggleArea}
                onPress={() => setShowCartSheet((v) => !v)}
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
                          resizeMode="contain"
                        />
                      ) : (
                        <Beef size={19} color="rgba(75,15,15,0.6)" />
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
                  <Text style={styles.cartPayBtnText}>Ödə</Text>
                  <View style={styles.cartPayDivider} />
                  <View style={styles.cartPayAmountWrap}>
                    <Text style={styles.cartPayAmountText}>
                      {total.toFixed(2)}
                    </Text>
                    <Text style={styles.cartPayAznText}>AZN</Text>
                  </View>
                </Pressable>
              )}
            </Animated.View>

            <Animated.View
              style={styles.cartSheetPanel}
              pointerEvents={showCartSheet ? "auto" : "none"}
            >
              {/* maxHeight (height DEYİL!) birbaşa ScrollView-un özündə —
                  veb-in "maxHeight + overflow-y:auto" davranışının eynisi:
                  məzmun bu tavandan qısadırsa qutu ONA sıxılır (boşluq
                  qalmır), uzundursa daxildə scroll aktivləşir. */}
              <ScrollView
                  style={[styles.cartSheetList, { maxHeight: cartPanelHeight }]}
                  contentContainerStyle={styles.cartSheetListContent}
                  showsVerticalScrollIndicator={true}
                >
                  {items.length === 0 ? (
                    <View style={styles.cartEmptyState}>
                      <ShoppingBag size={26} color="#e7e5e4" />
                      <Text style={styles.cartEmptyText}>Səbətiniz boşdur</Text>
                    </View>
                  ) : (
                    items.map((it) => (
                      <View key={it.lineId} style={styles.sheetItemRow}>
                        <View style={styles.sheetItemImageWrap}>
                          {it.imageUrl ? (
                            <Image
                              source={{ uri: it.imageUrl }}
                              style={styles.sheetItemImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <Beef size={22} color="rgba(75,15,15,0.7)" />
                          )}
                        </View>

                        <View style={styles.sheetItemBody}>
                          <View style={styles.sheetItemTop}>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                style={styles.sheetItemTitle}
                                numberOfLines={1}
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
                              <Trash2 size={16} color="#d6d3d1" />
                            </Pressable>
                          </View>

                          <View style={styles.sheetItemBottom}>
                            {it.soldByWeight === false ? (
                              <Text style={styles.sheetQtyText}>
                                {it.quantityKg.toFixed(2)} kq
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
                                  <Minus size={13} color="#57534e" />
                                </Pressable>
                                <Text style={styles.sheetStepperText}>
                                  {it.quantityKg.toFixed(2)} kq
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
                                  <Plus size={13} color="#57534e" />
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
                      <Text style={styles.sheetSummaryLabel}>Məhsullar</Text>
                      <Text style={styles.sheetSummaryLabel}>
                        {itemsTotal.toFixed(2)} AZN
                      </Text>
                    </View>
                    <View style={styles.sheetSummaryRow}>
                      <Text style={styles.sheetSummaryLabel}>Çatdırılma</Text>
                      <Text style={styles.sheetSummaryLabel}>
                        {items.length
                          ? `${deliveryPrice.toFixed(2)} AZN`
                          : "—"}
                      </Text>
                    </View>
                    <View style={styles.sheetSummaryTotalRow}>
                      <Text style={styles.sheetSummaryTotalText}>Cəmi</Text>
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
                    <Text style={styles.sheetCheckoutBtnText}>Ödə</Text>
                  </Pressable>
                </ScrollView>
            </Animated.View>
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
    left: 14,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    right: 14,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },
  iconBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  iconBadgeText: { color: "#fff", fontSize: 9, fontWeight: "900" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 10,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  switcher: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#f5f5f4",
    borderRadius: 10,
    padding: 3,
  },
  switcherTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  switcherTabActive: { backgroundColor: BRAND },
  switcherText: { fontSize: 12, fontWeight: "700", color: "#57534e" },
  switcherTextActive: { color: "#fff" },

  diagramWrap: { height: 210, width: "100%" },

  partsPagerWrap: {
    position: "relative",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  partsArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -14,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
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
    rowGap: 6,
  },
  partBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: "32%",
    borderWidth: 1,
    borderColor: "#efe9e2",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  partBtnDisabled: { backgroundColor: "#f5f5f4", borderColor: "#eee" },
  partBtnSelected: { backgroundColor: "#B01818", borderWidth: 0 },
  partBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#57534e",
    flexShrink: 1,
  },
  partBtnTextDisabled: { color: "#a8a29e" },
  partBtnTextSelected: { color: "#fff" },
  partBadge: {
    height: 15,
    minWidth: 15,
    borderRadius: 8,
    backgroundColor: "#F1E5E5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  partBadgeSelected: { backgroundColor: "#fff" },
  partBadgeText: { fontSize: 9, fontWeight: "900", color: BRAND },
  partBadgeTextSelected: { color: "#B01818" },

  extraRow: { flexDirection: "row", gap: 6 },
  extraBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  extraBtnActive: { backgroundColor: "#B01818", borderColor: "#B01818" },
  extraBtnText: { fontSize: 11.5, fontWeight: "800", color: "#57534e" },
  extraBtnTextActive: { color: "#fff" },

  productsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  emptyText: {
    width: "100%",
    textAlign: "center",
    paddingVertical: 30,
    color: "#a8a29e",
    fontSize: 12,
    fontWeight: "600",
  },

  cutCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cutImgWrap: { width: "100%", aspectRatio: 1.4, backgroundColor: "#F1E5E5" },
  cutImg: { width: "100%", height: "100%" },
  cutImgFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  cutQtyBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(75,15,15,0.85)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cutPriceBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(75,15,15,0.85)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cutBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  cutInCartOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  cutInCartCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cutBody: { padding: 8, gap: 6 },
  cutName: { fontSize: 12.5, fontWeight: "800", color: "#292524" },
  cutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  cutOutOfStock: { fontSize: 10, fontWeight: "700", color: "#dc2626" },
  cutPriceLabel: { fontSize: 10.5, fontWeight: "600", color: "#a8a29e" },
  cutAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cutAddBtnAdd: { backgroundColor: "#15803d" },
  cutAddBtnRemove: { backgroundColor: "#dc2626" },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5f5f4",
    borderRadius: 8,
    paddingHorizontal: 2,
  },
  stepperBtn: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: { fontSize: 10.5, fontWeight: "800", color: "#292524" },

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
    height: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#F1E5E5",
    borderWidth: 2,
    borderColor: BRAND,
    borderBottomWidth: 0,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    gap: 8,
  },
  cartBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    zIndex: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  cartBubbleBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 23,
    height: 23,
    borderRadius: 11.5,
    backgroundColor: "#B01818",
    borderWidth: 2,
    borderColor: "#F1E5E5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBubbleBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 13,
  },
  cartThumbsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    paddingLeft: 2,
  },
  cartThumb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: BRAND,
    marginTop: -26,
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cartThumbStack: { marginLeft: -14 },
  cartThumbImage: { width: "100%", height: "100%", resizeMode: "contain" },
  cartExpandedTotal: {
    fontSize: 15,
    color: "#292524",
    fontWeight: "900",
    paddingHorizontal: 4,
  },
  cartPayBtn: {
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND,
    paddingLeft: 14,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  cartPayBtnDisabled: { opacity: 0.45 },
  cartPayBtnText: { color: "#fff", fontSize: 14.5, fontWeight: "900" },
  cartPayDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  cartPayAmountWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  cartPayAmountText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  cartPayAznText: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 10,
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
    overflow: "hidden",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
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
  cartSheetListContent: { gap: 8, paddingBottom: 8 },
  cartEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 6,
  },
  cartEmptyText: { fontSize: 13, color: "#a8a29e", fontWeight: "600" },
  sheetItemRow: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f0ede8",
    padding: 8,
  },
  sheetItemImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
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
    gap: 6,
  },
  sheetItemTitle: { fontSize: 14, fontWeight: "800", color: "#292524" },
  sheetItemMeta: {
    marginTop: 1,
    fontSize: 12,
    color: "#a8a29e",
    fontWeight: "600",
  },
  sheetTrashBtn: { padding: 2 },
  sheetItemBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 6,
  },
  sheetQtyText: { fontSize: 13, fontWeight: "800", color: "#292524" },
  sheetStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5f5f4",
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  sheetStepperBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetStepperText: { fontSize: 12.5, fontWeight: "800", color: "#292524" },
  sheetItemPrice: { fontSize: 14, fontWeight: "900", color: BRAND },
  sheetSummaryCard: {
    borderRadius: 12,
    backgroundColor: "#FBF8F4",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
  },
  sheetSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetSummaryLabel: { fontSize: 12, color: "#78716c", fontWeight: "600" },
  sheetSummaryTotalRow: {
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f0ede8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetSummaryTotalText: { fontSize: 15, fontWeight: "900", color: "#292524" },
  sheetCheckoutBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCheckoutBtnDisabled: { opacity: 0.45 },
  sheetCheckoutBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
