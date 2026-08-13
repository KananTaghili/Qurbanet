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
  ArrowLeft,
  User,
} from "lucide-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/format";
import NotificationBell from "../components/NotificationBell";
import HeaderUserMenu from "../components/HeaderUserMenu";
import MeatBottomNav from "../components/MeatBottomNav";
import { scale, moderateScale, scaleFont } from "../lib/scale";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/i18n";

const BRAND = "#4B0F0F";

function stepsList(lang) {
  return [
    {
      num: 1,
      Icon: MousePointerClick,
      title: t(lang, "meatHiw_step1Title"),
      text: t(lang, "meatHiw_step1Text"),
      img: require("../assets/images/meat-hiw-1.jpg"),
    },
    {
      num: 2,
      Icon: Beef,
      title: t(lang, "meatHiw_step2Title"),
      text: t(lang, "meatHiw_step2Text"),
      img: require("../assets/images/meat-hiw-2.jpg"),
    },
    {
      num: 3,
      Icon: ClipboardCheck,
      title: t(lang, "meatHiw_step3Title"),
      text: t(lang, "meatHiw_step3Text"),
      img: require("../assets/images/meat-hiw-3.jpg"),
    },
    {
      num: 4,
      Icon: PackageCheck,
      title: t(lang, "meatHiw_step4Title"),
      text: t(lang, "meatHiw_step4Text"),
      img: require("../assets/images/meatbox-qutu.png"),
    },
    {
      num: 5,
      Icon: Truck,
      title: t(lang, "meatHiw_step5Title"),
      text: t(lang, "meatHiw_step5Text"),
      img: require("../assets/images/meat-hiw-4.jpg"),
    },
  ];
}

function miniBadges(lang) {
  return [
    { Icon: ShieldCheck, title: t(lang, "meatHiw_badgeHalal") },
    { Icon: Zap, title: t(lang, "meatHiw_badgePackaged") },
    { Icon: Award, title: t(lang, "meatHiw_badgeHygiene") },
  ];
}

const AUTOPLAY_MS = 3200;
const MANUAL_DELAY_MS = 10000;
const SWIPE_THRESHOLD = 40;

function comingSoon(lang) {
  Alert.alert(t(lang, "comingSoonTitle"), t(lang, "comingSoonBody"));
}

function HeroBanner({ lang }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroImageBox}>
        <ImageBackground
          source={require("../assets/images/meat-hero.png")}
          style={{ flex: 1 }}
          resizeMode="cover"
        />
      </View>
      {/* Fotodan mətn sahəsinə keçid — MeatHomeScreen-dəki hero ilə eyni,
          daha çox aralıq nöqtəli enli və tədricən yumşalan zolaq. */}
      <LinearGradient
        colors={[
          "#F8F5EF",
          "#F8F5EF",
          "rgba(248,245,239,0.92)",
          "rgba(248,245,239,0.7)",
          "rgba(248,245,239,0.45)",
          "rgba(248,245,239,0.22)",
          "rgba(248,245,239,0.08)",
          "rgba(248,245,239,0)",
          "rgba(248,245,239,0)",
        ]}
        locations={[0, 0.2, 0.32, 0.42, 0.52, 0.62, 0.7, 0.78, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroText}>
        <Text style={styles.heroTitle}>{t(lang, "meatHiw_heroTitle")}</Text>
        <Text style={styles.heroSub}>
          {t(lang, "meatHiw_heroSub")}
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
            <step.Icon size={20} color={BRAND} strokeWidth={2} />
          </Animated.View>
          <View style={styles.slideNumBadge}>
            <Text style={styles.slideNumText}>{step.num}</Text>
          </View>
        </View>
        <Text style={styles.slideTitle} numberOfLines={2}>{step.title}</Text>
      </View>
      <Text style={styles.slideDesc}>{step.text}</Text>
    </View>
  );
}

function StepsCarousel({ lang }) {
  const STEPS = stepsList(lang);
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

        <Pressable style={[styles.carouselArrow, { left: scale(6) }]} onPress={goPrev}>
          <ChevronLeft size={21} color={BRAND} strokeWidth={2.5} />
        </Pressable>
        <Pressable style={[styles.carouselArrow, { right: scale(6) }]} onPress={goNext}>
          <ChevronRight size={21} color={BRAND} strokeWidth={2.5} />
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
  const { lang } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      NavigationBar.setButtonStyleAsync("dark").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#ffffff").catch(() => {});
    }, [])
  );

  const initials = getInitials(user);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.homeBtn} onPress={() => navigation.navigate("Home")}>
            <ArrowLeft size={20} color="#fff" />
            <Image source={require("../assets/images/app-icon.png")} style={styles.homeBtnLogo} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{t(lang, "meatHiw_headerTitle")}</Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationBell accentColor={BRAND} iconColor="#fff" />
          {isGuest ? (
            <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
              <User size={22} color="#fff" />
              <Text style={styles.loginText}>{t(lang, "login")}</Text>
            </Pressable>
          ) : (
            <HeaderUserMenu initials={initials} accentColor="rgba(255,255,255,0.2)" />
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: scale(14), paddingBottom: scale(16), gap: scale(14) }}>
        <HeroBanner lang={lang} />

        <View>
          <Text style={styles.sectionTitle}>{t(lang, "meatHiw_sectionTitle")}</Text>
          <View style={{ marginTop: scale(12) }}>
            <StepsCarousel lang={lang} />
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
            {miniBadges(lang).map(({ Icon, title }) => (
              <View key={title} style={styles.badgeItem}>
                <Icon size={16} color={BRAND} />
                <Text style={styles.badgeText}>{title}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.ctaBtn} onPress={() => comingSoon(lang)}>
            <Text style={styles.ctaText}>{t(lang, "meatHiw_startOrderBtn")}</Text>
            <ShoppingCart size={16} color="#fff" strokeWidth={2.5} />
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
    gap: scale(10),
    paddingHorizontal: scale(12),
    paddingBottom: scale(12),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: scale(10), flex: 1, minWidth: 0 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: scale(10), flexShrink: 0 },
  homeBtn: { flexDirection: "row", alignItems: "center", gap: scale(6) },
  homeBtnLogo: { width: scale(28), height: scale(28), borderRadius: scale(7) },
  headerTitle: { flex: 1, color: "#fff", fontSize: scaleFont(18.5), fontWeight: "800" },
  loginBtn: { flexDirection: "row", alignItems: "center", gap: scale(6), marginRight: scale(5) },
  loginText: { color: "#fff", fontSize: scaleFont(16), fontWeight: "700" },

  hero: {
    borderRadius: scale(16),
    overflow: "hidden",
    backgroundColor: "#F8F5EF",
    minHeight: scale(136),
    justifyContent: "center",
  },
  heroImageBox: { position: "absolute", top: 0, bottom: 0, right: 0, width: "58%", overflow: "hidden" },
  heroText: { padding: scale(16), maxWidth: "56%" },
  heroTitle: { fontSize: scaleFont(21), fontWeight: "900", color: "#0a0a0a", letterSpacing: -0.2, lineHeight: moderateScale(25) },
  heroSub: { fontSize: scaleFont(13.5), color: "#525252", lineHeight: moderateScale(18), fontWeight: "500", marginTop: scale(7) },

  sectionTitle: { fontSize: scaleFont(18), fontWeight: "900", color: "#171717" },

  carouselWrap: { position: "relative" },
  carouselViewport: { overflow: "hidden", borderRadius: scale(12) },
  carouselArrow: {
    position: "absolute",
    top: scale(94),
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
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

  slide: { paddingHorizontal: scale(4) },
  // Kvadrat qutu (eni = hündürlüyü) — hər addımda eyni sabit ölçü, mənbə
  // fotonun öz nisbətindən asılı olmayaraq (məsələn kvadratabənzər qoyun
  // sxemi əvvəlki dar-hündürlükdə həddindən artıq üfüqi kəsilirdi).
  slidePhoto: {
    height: scale(220),
    width: scale(220),
    alignSelf: "center",
    borderRadius: scale(14),
    overflow: "hidden",
    borderWidth: 2,
    borderColor: BRAND,
    backgroundColor: "#fff",
  },
  slidePhotoImg: { width: "100%", height: "100%" },
  slideHeadRow: { flexDirection: "row", alignItems: "center", gap: scale(11), marginTop: scale(14) },
  slideIconWrap: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    borderWidth: 2,
    borderColor: BRAND,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  slideNumBadge: {
    position: "absolute",
    top: scale(-5),
    right: scale(-5),
    width: scale(19),
    height: scale(19),
    borderRadius: scale(9.5),
    backgroundColor: BRAND,
    alignItems: "center",
    justifyContent: "center",
  },
  slideNumText: { color: "#fff", fontSize: scaleFont(10.5), fontWeight: "900" },
  slideTitle: { flex: 1, fontSize: scaleFont(17.5), fontWeight: "900", color: "#171717" },
  slideDesc: { fontSize: scaleFont(15), color: "#737373", fontWeight: "500", marginTop: scale(8), lineHeight: moderateScale(20) },

  dotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: scale(6), marginTop: scale(10) },
  dot: { height: scale(6), borderRadius: scale(3) },
  dotActive: { width: scale(20), backgroundColor: BRAND },
  dotInactive: { width: scale(6), backgroundColor: "#d4d4d4" },

  bottomBarWrap: { paddingHorizontal: scale(14), paddingBottom: scale(8), backgroundColor: "#FAF8F5" },
  bottomBar: {
    borderRadius: scale(14),
    borderWidth: 1,
    borderColor: "rgba(75,15,15,0.1)",
    backgroundColor: "#FDFBF7",
    padding: scale(13),
    gap: scale(11),
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: scale(13), justifyContent: "center" },
  badgeItem: { flexDirection: "row", alignItems: "center", gap: scale(7) },
  badgeText: { fontSize: scaleFont(13.5), fontWeight: "700", color: "#404040" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: scale(7),
    backgroundColor: BRAND,
    borderRadius: scale(11),
    paddingVertical: scale(13),
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: scaleFont(15.5) },
});
