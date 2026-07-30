import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Animated,
} from "react-native";
import {
  MousePointerClick,
  Beef,
  ClipboardCheck,
  PackageCheck,
  Truck,
  ShieldCheck,
  Zap,
  Award,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Menu,
  User,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import MeatSideMenu from "../components/MeatSideMenu";
import MeatBottomNav from "../components/MeatBottomNav";

const BRAND = "#4B0F0F";

const STEPS = [
  {
    num: 1,
    Icon: MousePointerClick,
    title: "Seçiminizi edin",
    text: "Qoyun, dana və ya yemək növünü seçin.",
    img: require("../assets/images/meat-hiw-1.jpg"),
  },
  {
    num: 2,
    Icon: Beef,
    title: "Hissəni seçin",
    text: "Ət hissələrindən istədiyinizi seçin və səbətə əlavə edin.",
    img: require("../assets/images/meat-hiw-2.jpg"),
  },
  {
    num: 3,
    Icon: ClipboardCheck,
    title: "Sifarişinizi təsdiqləyin",
    text: "Çatdırılma ünvanı və ödəniş üsulunu tamamlayın.",
    img: require("../assets/images/meat-hiw-3.jpg"),
  },
  {
    num: 4,
    Icon: PackageCheck,
    title: "Paketləmə və hazırlıq",
    text: "Ətiniz gigiyenik şəkildə paketlənir və hazırlanır.",
    img: require("../assets/images/meatbox-qutu.png"),
  },
  {
    num: 5,
    Icon: Truck,
    title: "Çatdırılma",
    text: "Ətiniz təzə və təhlükəsiz şəkildə qapınıza çatdırılır.",
    img: require("../assets/images/meat-hiw-4.jpg"),
  },
];

const MINI_BADGES = [
  { Icon: ShieldCheck, title: "Halal kəsim" },
  { Icon: Zap, title: "Paketlənib çatdırılma" },
  { Icon: Award, title: "Yüksək Gigiyena Zəmanəti" },
];

const AUTOPLAY_MS = 3200;
const MANUAL_DELAY_MS = 10000;
const SWIPE_THRESHOLD = 40;

function comingSoon() {
  Alert.alert("Tezliklə", "Bu bölmə hələ hazırlanır.");
}

function HeroBanner() {
  return (
    <View style={styles.hero}>
      <View style={styles.heroImageBox}>
        <ImageBackground
          source={require("../assets/images/meat-hero.png")}
          style={{ flex: 1 }}
          resizeMode="cover"
        />
      </View>
      <LinearGradient
        colors={["#F8F5EF", "#F8F5EF", "rgba(248,245,239,0.6)", "rgba(248,245,239,0)", "rgba(248,245,239,0)"]}
        locations={[0, 0.3, 0.42, 0.58, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroText}>
        <Text style={styles.heroTitle}>Biz Necə İşləyirik</Text>
        <Text style={styles.heroSub}>
          Tapşırığınızdan süfrənizə qədər olan hər addımda keyfiyyət, halal və etibar prinsipindən ayrılmırıq.
        </Text>
      </View>
    </View>
  );
}

function StepSlide({ step, isActive, pulse }) {
  const scale = pulse;
  return (
    <View style={styles.slide}>
      {/* Foto qutusu bütün addımlarda sabit (eyni) ölçüdədir — bura heç bir
          animasiya transformu tətbiq olunmur ki, ölçü fərqli görünməsin. */}
      <View style={styles.slidePhoto}>
        <Image source={step.img} style={styles.slidePhotoImg} resizeMode="cover" />
      </View>
      <View style={styles.slideHeadRow}>
        <View style={styles.slideIconWrap}>
          <Animated.View style={isActive && { transform: [{ scale }] }}>
            <step.Icon size={17} color={BRAND} strokeWidth={2} />
          </Animated.View>
          <View style={styles.slideNumBadge}>
            <Text style={styles.slideNumText}>{step.num}</Text>
          </View>
        </View>
        <Text style={styles.slideTitle} numberOfLines={1}>{step.title}</Text>
      </View>
      <Text style={styles.slideDesc}>{step.text}</Text>
    </View>
  );
}

function StepsCarousel() {
  const [stepIndex, setStepIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const autoplayDelay = useRef(AUTOPLAY_MS);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);
  const isLastStep = stepIndex === STEPS.length - 1;

  useEffect(() => {
    if (!containerWidth) return;
    Animated.timing(translateX, {
      toValue: -stepIndex * containerWidth,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [stepIndex, containerWidth]);

  useEffect(() => {
    pulse.setValue(0.94);
    Animated.spring(pulse, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [stepIndex]);

  useEffect(() => {
    const id = setTimeout(() => {
      setStepIndex((s) => (s + 1) % STEPS.length);
      autoplayDelay.current = AUTOPLAY_MS;
    }, autoplayDelay.current);
    return () => clearTimeout(id);
  }, [stepIndex]);

  const goToStep = (next) => {
    setStepIndex(next);
    autoplayDelay.current = MANUAL_DELAY_MS;
  };
  const goPrev = () => goToStep((stepIndex - 1 + STEPS.length) % STEPS.length);
  const goNext = () => goToStep((stepIndex + 1) % STEPS.length);

  const handleTouchStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchDeltaX.current = 0;
  };
  const handleTouchMove = (e) => {
    if (touchStartX.current == null) return;
    touchDeltaX.current = e.nativeEvent.pageX - touchStartX.current;
  };
  const handleTouchEnd = () => {
    if (touchDeltaX.current > SWIPE_THRESHOLD) goPrev();
    else if (touchDeltaX.current < -SWIPE_THRESHOLD) goNext();
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  return (
    <View>
      <View style={styles.carouselWrap}>
        <View
          style={styles.carouselViewport}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Animated.View style={{ flexDirection: "row", transform: [{ translateX }] }}>
            {STEPS.map((step, i) => (
              <View key={step.num} style={{ width: containerWidth }}>
                <StepSlide step={step} isActive={i === stepIndex} pulse={pulse} />
              </View>
            ))}
          </Animated.View>
        </View>

        <Pressable style={[styles.carouselArrow, { left: 6 }]} onPress={goPrev}>
          <ChevronLeft size={18} color={BRAND} strokeWidth={2.5} />
        </Pressable>
        <Pressable style={[styles.carouselArrow, { right: 6 }]} onPress={goNext}>
          <ChevronRight size={18} color={BRAND} strokeWidth={2.5} />
        </Pressable>
      </View>

      <View style={styles.dotsRow}>
        {STEPS.map((step, i) => (
          <Pressable
            key={step.num}
            onPress={() => goToStep(i)}
            style={[styles.dot, i === stepIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>
    </View>
  );
}

export default function MeatHowItWorksScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isGuest, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const initials = [user?.name, user?.lastName].filter(Boolean).map((n) => n[0]).join("").toUpperCase() || "?";

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.menuBtn} onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Ət Satışı</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={BRAND} iconColor="#fff" />
          {isGuest ? (
            <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
              <User size={18} color="#fff" />
              <Text style={styles.loginText}>Daxil ol</Text>
            </Pressable>
          ) : (
            <HeaderUserMenu initials={initials} accentColor="rgba(255,255,255,0.2)" />
          )}
        </View>
      </View>

      <MeatSideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 16, gap: 14 }}>
        <HeroBanner />

        <View>
          <Text style={styles.sectionTitle}>5 sadə addımda sifarişiniz süfrənizdə</Text>
          <View style={{ marginTop: 12 }}>
            <StepsCarousel />
          </View>
        </View>

      </ScrollView>

      {/* Scroll-un içində olsaydı, uzun məzmunda ortada "sıxılıb" qalırdı —
          buranı ScrollView-dan çıxarıb alt naviqasiyanın düz üstünə sabit
          bir sıra kimi qoyuruq (RN-də flex düzülüşü ilə heç bir "fixed"
          hiylə lazım deyil). */}
      <View style={styles.bottomBarWrap}>
        <View style={styles.bottomBar}>
          <View style={styles.badgesRow}>
            {MINI_BADGES.map(({ Icon, title }) => (
              <View key={title} style={styles.badgeItem}>
                <Icon size={13} color={BRAND} />
                <Text style={styles.badgeText}>{title}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.ctaBtn} onPress={comingSoon}>
            <Text style={styles.ctaText}>Sifarişə başla</Text>
            <ShoppingCart size={13} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      <MeatBottomNav active="MeatHowItWorks" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    backgroundColor: BRAND,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 },
  menuBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 5 },
  loginText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  hero: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F8F5EF",
    minHeight: 128,
    justifyContent: "center",
  },
  heroImageBox: { position: "absolute", top: 0, bottom: 0, right: 0, width: "58%", overflow: "hidden" },
  heroText: { padding: 16, maxWidth: "56%" },
  heroTitle: { fontSize: 18, fontWeight: "900", color: "#0a0a0a", letterSpacing: -0.2, lineHeight: 21 },
  heroSub: { fontSize: 11, color: "#525252", lineHeight: 15, fontWeight: "500", marginTop: 6 },

  sectionTitle: { fontSize: 14, fontWeight: "900", color: "#171717" },

  carouselWrap: { position: "relative" },
  carouselViewport: { overflow: "hidden", borderRadius: 12 },
  carouselArrow: {
    position: "absolute",
    top: 94,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  slide: { paddingHorizontal: 4 },
  // Kvadrat qutu (eni = hündürlüyü) — hər addımda eyni sabit ölçü, mənbə
  // fotonun öz nisbətindən asılı olmayaraq (məsələn kvadratabənzər qoyun
  // sxemi əvvəlki dar-hündürlükdə həddindən artıq üfüqi kəsilirdi).
  slidePhoto: {
    height: 220,
    width: 220,
    alignSelf: "center",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: BRAND,
    backgroundColor: "#fff",
  },
  slidePhotoImg: { width: "100%", height: "100%" },
  slideHeadRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  slideIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BRAND,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  slideNumBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  slideNumText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  slideTitle: { flex: 1, fontSize: 15, fontWeight: "900", color: "#171717" },
  slideDesc: { fontSize: 12.5, color: "#737373", fontWeight: "500", marginTop: 6, lineHeight: 17 },

  dotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 10 },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 20, backgroundColor: BRAND },
  dotInactive: { width: 6, backgroundColor: "#d4d4d4" },

  bottomBarWrap: { paddingHorizontal: 14, paddingBottom: 8, backgroundColor: "#FAF8F5" },
  bottomBar: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(75,15,15,0.1)",
    backgroundColor: "#FDFBF7",
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  badgeItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#404040" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: BRAND,
    borderRadius: 10,
    paddingVertical: 11,
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
