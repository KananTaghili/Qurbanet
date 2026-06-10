"use client";

/**
 * ════════════════════════════════════════════════════════════
 *  MeatBox.az — Landing Page (tam responsiv, Tailwind CSS)
 *  Faylı app/page.jsx (App Router) içinə yapışdırın.
 *  Şəkillər /public qovluğunda qalmalıdır:
 *  logo.png · qoyun.jpg · qoyun_big.png · qutu.png · dana.jpg
 * ════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Menu,
  X,
  ArrowRight,
  Play,
  ShieldCheck,
  Video,
  Truck,
  Heart,
  Phone,
  Mail,
  Beef,
  Users,
  Scissors,
  MousePointerClick,
  CreditCard,
  PackageCheck,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";

/* ═══════════════════════ MƏLUMATLAR ═══════════════════════ */

const NAV_LINKS = [
  { label: "Haqqımızda", href: "#haqqimizda" },
  { label: "Xidmətlər", href: "#xidmetler" },
  { label: "Necə işləyir?", href: "#nece-isleyir" },
  { label: "Əlaqə", href: "#elaqe" },
];

const HERO_BADGES = [
  { Icon: ShieldCheck, label: "Halal kəsim" },
  { Icon: Video, label: "Video hesabat" },
  { Icon: Truck, label: "Sürətli çatdırılma" },
];

/* Bu rəqəmləri öz real göstəricilərinizlə əvəz edin */
const STATS = [
  { value: "100%", label: "Halal kəsim" },
  { value: "24/7", label: "Onlayn sifariş" },
  { value: "1000+", label: "Məmnun müştəri" },
];

const SERVICES = [
  {
    id: "qurban",
    title: "Qurbanlıq Sifarişi",
    description:
      "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Evdən çıxmadan etibarlı xidmət.",
    href: "/qurban",
    image: "/qoyun.jpg",
    imageClass: "object-cover",
    mediaBgClass: "bg-gray-100",
    btnText: "Sifariş Et",
    Icon: Scissors,
    titleClass: "text-[#1B5E20]",
    iconBgClass: "bg-[#1B5E20]",
    btnClass:
      "bg-[#2E7D32] hover:bg-[#1B5E20] shadow-[0_6px_18px_-4px_rgba(27,94,32,0.55)]",
    disabled: false,
  },
  {
    id: "xeyriyye",
    title: "Kollektiv Qurban-Xeyriyyə Platforması",
    description:
      "Birlikdə qurban kəsdirik, ehtiyacı olanlara pay göndəririk. Şəffaf və etibarlı xeyriyyə platformasına qoşulun.",
    href: "#",
    image: "/qutu.png",
    imageClass: "object-contain p-6",
    mediaBgClass: "bg-gradient-to-br from-violet-50 to-purple-100",
    btnText: "Qoşul",
    Icon: Users,
    titleClass: "text-[#6B21A8]",
    iconBgClass: "bg-[#6B21A8]",
    btnClass:
      "bg-[#7C3AED] hover:bg-[#6B21A8] shadow-[0_6px_18px_-4px_rgba(109,40,217,0.55)]",
    disabled: true,
  },
  {
    id: "et",
    title: "Ət Satışı",
    description:
      "Təzə və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdırırıq.",
    href: "#",
    image: "/dana.jpg",
    imageClass: "object-cover",
    mediaBgClass: "bg-gray-100",
    btnText: "Məhsullara Bax",
    Icon: Beef,
    titleClass: "text-[#B91C1C]",
    iconBgClass: "bg-[#B91C1C]",
    btnClass:
      "bg-[#DC2626] hover:bg-[#B91C1C] shadow-[0_6px_18px_-4px_rgba(185,28,28,0.55)]",
    disabled: true,
  },
];

const STEPS = [
  {
    Icon: MousePointerClick,
    num: "01",
    title: "Seçin",
    desc: "Qurbanlığınızı və ya ət məhsulunu onlayn kataloqdan seçin.",
  },
  {
    Icon: CreditCard,
    num: "02",
    title: "Sifariş edin",
    desc: "Məlumatlarınızı daxil edin, onlayn və ya qapıda ödəniş edin.",
  },
  {
    Icon: Video,
    num: "03",
    title: "Video ilə izləyin",
    desc: "Kəsim prosesinin video hesabatı birbaşa sizə göndərilir.",
  },
  {
    Icon: PackageCheck,
    num: "04",
    title: "Qəbul edin",
    desc: "Payınız soyuducu qutularda qapınıza çatdırılır.",
  },
];

const WHY_FEATURES = [
  {
    Icon: ShieldCheck,
    label: "Halal Kəsim",
    desc: "Dini qaydalara tam uyğun, peşəkar kəsim xidməti",
  },
  {
    Icon: Video,
    label: "Video Hesabat",
    desc: "Kəsim prosesini addım-addım video ilə izləyin",
  },
  {
    Icon: Truck,
    label: "Sürətli Çatdırılma",
    desc: "Soyuducu qutularda etibarlı və vaxtında çatdırılma",
  },
  {
    Icon: Heart,
    label: "Şəffaf Xeyriyyə",
    desc: "Hər qəpiyin hesabatı, şəffaf pay bölgüsü",
  },
];

const SOCIALS = [
  { Icon: FaFacebook, href: "#", label: "Facebook" },
  { Icon: FaInstagram, href: "#", label: "Instagram" },
  { Icon: FaWhatsapp, href: "https://wa.me/994501234455", label: "WhatsApp" },
];

const PAYMENTS = ["VISA", "Mastercard", "tam."];

const PHONE = "+994 50 123 44 55";
const PHONE_HREF = "tel:+994501234455";
const EMAIL = "info@meatbox.az";

/* ═══════════════════════ SƏHİFƏ ═══════════════════════ */

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">
      {/* Anchor keçidləri üçün yumşaq sürüşmə */}
      <style>{`html { scroll-behavior: smooth; }`}</style>

      {/* ══════════════ NAVBAR ══════════════ */}
      <header
        className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
          scrolled
            ? "shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
            : "border-b border-gray-100"
        }`}
      >
        <nav
          aria-label="Əsas naviqasiya"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
        >
          {/* Loqo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-gray-100">
              <Image
                src="/logo.png"
                alt="MeatBox.az loqosu"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </span>
            <span className="leading-none">
              <span className="block text-lg font-black tracking-tight">
                MEAT<span className="text-[#1B5E20]">BOX</span>.AZ
              </span>
              <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 sm:block">
                Təzə Ət · Qurbanlıq · Xeyriyyə
              </span>
            </span>
          </Link>

          {/* Desktop keçidlər */}
          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-gray-600 transition-colors hover:text-[#1B5E20]"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Sağ tərəf */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              aria-label="Səbət"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>

            <Link
              href="/qurban"
              className="hidden rounded-xl bg-[#1B5E20] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(27,94,32,0.35)] transition-all hover:bg-[#2E7D32] hover:shadow-[0_6px_20px_rgba(27,94,32,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 md:inline-flex"
            >
              Daxil ol
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Menyunu bağla" : "Menyunu aç"}
              aria-expanded={mobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobil menyu */}
        <div
          className={`overflow-hidden transition-[max-height] duration-300 ease-in-out md:hidden ${
            mobileMenuOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          <div className="border-t border-gray-100 px-4 pb-4 pt-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#1B5E20]"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/qurban"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 block rounded-xl bg-[#1B5E20] px-3 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#2E7D32]"
            >
              Daxil ol
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-[#14532d]">
        {/* Arxa fon şəkli + gradient */}
        <div className="absolute inset-0">
          <Image
            src="/qoyun.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20]/95 via-[#1a6e25]/95 to-[#14532d]/95" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:gap-12 lg:py-20">
          {/* Mətn */}
          <div className="w-full max-w-2xl text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#86EFAC]" />
              Qurban bayramına hazırıq — sifarişlər açıqdır
            </span>

            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Qurbanlığınızı onlayn sifariş edin,{" "}
              <span className="text-[#86EFAC]">kəsimi video ilə izləyin</span>
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-emerald-100/90 sm:text-base lg:mx-0">
              MeatBox.az — təzə ət, qurbanlıq sifarişi və şəffaf xeyriyyə
              platforması. Halal kəsim, video hesabat və qapıya çatdırılma —
              hamısı bir ünvanda.
            </p>

            {/* CTA düymələri */}
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/qurban"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#1B5E20] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1B5E20] sm:w-auto"
              >
                Qurbanlıq Sifariş Et
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#nece-isleyir"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:w-auto"
              >
                <Play className="h-4 w-4 fill-white" />
                Necə işləyir?
              </a>
            </div>

            {/* Üstünlük nişanları */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              {HERO_BADGES.map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm"
                >
                  <Icon
                    className="h-3.5 w-3.5 text-[#86EFAC]"
                    strokeWidth={2.2}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Qoyun şəkli — yalnız böyük ekranlarda */}
          <div className="relative hidden shrink-0 lg:block">
            <div className="absolute -inset-8 rounded-full bg-white/5 blur-2xl" />
            <Image
              src="/qoyun_big.png"
              alt="Qurbanlıq qoyun"
              width={380}
              height={320}
              className="relative drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>

        {/* Statistika zolağı */}
        <div className="relative border-t border-white/10 bg-black/10 backdrop-blur-sm">
          <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-white/10 px-4 sm:px-6">
            {STATS.map(({ value, label }) => (
              <div key={label} className="py-4 text-center sm:py-5">
                <div className="text-lg font-black text-white sm:text-2xl">
                  {value}
                </div>
                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-200/70 sm:text-xs">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ XİDMƏTLƏR ══════════════ */}
      <section id="xidmetler" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionHeader
            eyebrow="Xidmətlərimiz"
            title="Sizin üçün nə edə bilərik?"
            subtitle="Qurbanlıq sifarişindən təzə ət çatdırılmasına qədər — hər şey bir platformada."
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ NECƏ İŞLƏYİR? ══════════════ */}
      <section
        id="nece-isleyir"
        className="scroll-mt-20 border-y border-gray-100 bg-[#F8FAF8]"
      >
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionHeader
            eyebrow="Proses"
            title="Necə işləyir?"
            subtitle="4 sadə addımda sifarişdən çatdırılmaya qədər."
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ Icon, num, title, desc }) => (
              <div
                key={num}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#A5D6A7] hover:shadow-[0_12px_28px_-10px_rgba(27,94,32,0.25)]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-1 -top-3 text-6xl font-black tracking-tighter text-gray-100 transition-colors duration-300 group-hover:text-[#E8F5E9]"
                >
                  {num}
                </span>
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F5E9] transition-colors duration-300 group-hover:bg-[#1B5E20]">
                    <Icon
                      className="h-6 w-6 text-[#1B5E20] transition-colors duration-300 group-hover:text-white"
                      strokeWidth={1.9}
                    />
                  </div>
                  <h3 className="mt-4 text-base font-extrabold text-gray-900">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ NİYƏ MEATBOX? ══════════════ */}
      <section id="haqqimizda" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <SectionHeader
            eyebrow="Üstünlüklərimiz"
            title="Niyə MeatBox?"
            subtitle="Etibar, şəffaflıq və keyfiyyət — işimizin təməlində dayanan dəyərlər."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {WHY_FEATURES.map(({ Icon, label, desc }) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-[0_1px_6px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#A5D6A7] hover:shadow-[0_12px_28px_-10px_rgba(27,94,32,0.25)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5E9]">
                  <Icon className="h-7 w-7 text-[#1B5E20]" strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 text-sm font-extrabold text-gray-900 sm:text-base">
                  {label}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500 sm:text-sm">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA BANNER ══════════════ */}
      <section className="px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B5E20] via-[#1a6e25] to-[#14532d] px-6 py-12 text-center sm:px-12 sm:py-16">
          {/* Dekorativ dairələr */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#86EFAC]/10 blur-3xl"
          />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              Bu Qurban bayramında savabınızı bizimlə bölüşün
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-emerald-100/90 sm:text-base">
              İndi sifariş edin — kəsimdən çatdırılmaya qədər hər addımı sizin
              üçün şəffaf şəkildə həyata keçirək.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/qurban"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#1B5E20] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
              >
                İndi Sifariş Et
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={PHONE_HREF}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                <Phone className="h-4 w-4" />
                {PHONE}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer id="elaqe" className="scroll-mt-20 bg-[#111827] text-white">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6 sm:pt-14">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brend */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5">
                <span className="relative block h-9 w-9 overflow-hidden rounded-lg">
                  <Image
                    src="/logo.png"
                    alt="MeatBox.az loqosu"
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </span>
                <span className="text-base font-black tracking-tight">
                  MEAT<span className="text-[#86EFAC]">BOX</span>.AZ
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
                Təzə ət, qurbanlıq və şəffaf xeyriyyə platforması. Halal kəsim,
                video hesabat, qapıya çatdırılma.
              </p>
            </div>

            {/* Keçidlər */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Keçidlər
              </h3>
              <ul className="mt-4 space-y-2.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Əlaqə */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Əlaqə
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <a
                    href={PHONE_HREF}
                    className="inline-flex items-center gap-2.5 text-sm text-gray-300 transition-colors hover:text-white"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-[#86EFAC]" />
                    {PHONE}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${EMAIL}`}
                    className="inline-flex items-center gap-2.5 text-sm text-gray-300 transition-colors hover:text-white"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-[#86EFAC]" />
                    {EMAIL}
                  </a>
                </li>
              </ul>

              <div className="mt-5 flex gap-2.5">
                {SOCIALS.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Ödəniş üsulları */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">
                Ödəniş üsulları
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {PAYMENTS.map((p) => (
                  <span
                    key={p}
                    className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-gray-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} MeatBox.az — Bütün hüquqlar qorunur.
          </div>
        </div>
      </footer>

      {/* ══════════════ WHATSAPP DÜYMƏSİ ══════════════ */}
      <a
        href="https://wa.me/994501234455"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp ilə yazın"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_8px_24px_-4px_rgba(37,211,102,0.6)] transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        <FaWhatsapp className="h-7 w-7 text-white" />
      </a>
    </div>
  );
}

/* ═══════════════════ KÖMƏKÇİ KOMPONENTLƏR ═══════════════════ */

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#2E7D32]">
        {eyebrow}
      </span>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900 sm:text-[32px]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ServiceCard({ service }) {
  const {
    title,
    description,
    href,
    image,
    imageClass,
    mediaBgClass,
    btnText,
    Icon,
    titleClass,
    iconBgClass,
    btnClass,
    disabled,
  } = service;

  const card = (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)] transition-all duration-300 ${
        disabled
          ? ""
          : "hover:-translate-y-1.5 hover:shadow-[0_18px_44px_-10px_rgba(0,0,0,0.18)]"
      }`}
    >
      {/* Şəkil hissəsi */}
      <div
        className={`relative h-48 shrink-0 overflow-hidden sm:h-52 ${mediaBgClass}`}
      >
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`${imageClass} transition-transform duration-500 ${
            disabled ? "opacity-70" : "group-hover:scale-105"
          }`}
        />
        <div className="absolute inset-0 bg-black/15" />

        {/* Video oynat düyməsi */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/50 backdrop-blur-sm transition-transform duration-300 ${
              disabled ? "" : "group-hover:scale-110"
            }`}
          >
            <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
          </span>
        </div>

        {/* Xidmət ikonu — sağ üst */}
        <span
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/85 shadow-md ${iconBgClass}`}
        >
          <Icon className="h-4 w-4 text-white" strokeWidth={2} />
        </span>

        {/* Video müddəti */}
        <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
          0:15
        </span>

        {/* Tezliklə nişanı */}
        {disabled && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            Tezliklə
          </span>
        )}
      </div>

      {/* Məzmun */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3
          className={`text-base font-extrabold leading-snug tracking-tight sm:text-lg ${titleClass}`}
        >
          {title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
          {description}
        </p>

        <span
          className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
            disabled
              ? "cursor-not-allowed bg-gray-100 text-gray-400"
              : `text-white ${btnClass}`
          }`}
        >
          {btnText}
          <ArrowRight
            className={`h-4 w-4 transition-transform duration-300 ${
              disabled ? "" : "group-hover:translate-x-1"
            }`}
            strokeWidth={2.5}
          />
        </span>
      </div>
    </article>
  );

  if (disabled) {
    return (
      <div aria-disabled="true" className="h-full">
        {card}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-4 rounded-3xl"
    >
      {card}
    </Link>
  );
}
