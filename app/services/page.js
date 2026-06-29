"use client";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Beef, ArrowLeft } from "lucide-react";
import { PiKnifeBold } from "react-icons/pi";
import SiteLayout from "../../components/SiteLayout";

const cards = [
  { title: "Qurbanlıq Sifarişi", text: "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Etibarlı və şəffaf xidmət.", color: "emerald", Icon: PiKnifeBold,    href: "/qurban" },
  { title: "Kollektiv Qurban",   text: "Birlikdə qurban kəsdirək, ehtiyacı olanlara pay göndərək. Şəffaf və etibarlı xeyriyyə platforması.",       color: "violet",  Icon: HeartHandshake, href: "/charity" },
  { title: "Ət Satışı",          text: "Təzə və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdıraq.",             color: "orange",  Icon: Beef,           href: null },
];

const colorMap = {
  emerald: { text: "text-[#0b6c24]", border: "border-[#0b6c24]", borderCard: "border-[#0b6c24]/25", bg: "bg-[#0b6c24]", bgDot: "bg-[#0b6c24]" },
  violet:  { text: "text-[#6820a3]", border: "border-[#6820a3]", borderCard: "border-[#6820a3]/25", bg: "bg-[#6820a3]", bgDot: "bg-[#6820a3]" },
  orange:  { text: "text-[#c85a13]", border: "border-[#c85a13]", borderCard: "border-[#c85a13]/25", bg: "bg-[#c85a13]", bgDot: "bg-[#c85a13]" },
};

function ServiceDetailCard({ item, index }) {
  const c = colorMap[item.color];
  const Icon = item.Icon;
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[1rem] border border-[#ead9cf] bg-[#fff8f1] p-3 shadow-[0_8px_24px_rgba(35,18,8,0.07)] sm:p-4">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full ${c.bg} opacity-10`} />
      <div className="relative flex items-center gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 bg-white ${c.text} ${c.border}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">0{index + 1} / Xidmət</span>
          <h3 className={`text-base font-black leading-5 ${c.text}`}>{item.title}</h3>
        </div>
      </div>
      <p className="relative mt-3 flex-1 text-sm leading-5 text-neutral-700">{item.text}</p>
      {item.href ? (
        <Link href={item.href} className={`relative mt-3 inline-flex w-fit items-center gap-2 border-b-2 pb-0.5 text-sm font-black transition hover:opacity-75 ${c.text} ${c.border}`}>
          Ətraflı bax <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span className="relative mt-3 inline-flex w-fit cursor-not-allowed items-center gap-2 border-b-2 pb-0.5 text-sm font-black opacity-40 border-neutral-300 text-neutral-400">
          Tezliklə <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </article>
  );
}

export default function ServicesPage() {
  return (
    <SiteLayout>
      <section className="bg-[#fbf7f2] px-4 py-4 text-[#1d0c08] sm:px-6 md:px-8 md:py-5">
        <div className="relative rounded-[1.25rem] border border-[#ead9cf] bg-white/90 p-4 shadow-[0_18px_50px_rgba(35,18,8,0.10)] sm:p-5 md:rounded-[1.5rem] md:p-6">
          <Link href="/" className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full hover:opacity-80 active:scale-95 transition-all" style={{ background: "#f20b32" }}>
            <ArrowLeft className="h-4 w-4 text-white" strokeWidth={2.5} />
          </Link>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#e10d0d] md:text-xs md:tracking-[0.28em]">Xidmətlər</p>
          <h1 className="mt-2 max-w-3xl text-xl font-black leading-snug sm:text-2xl md:text-3xl">
            Üç əsas xidmət — qurbanlıq, kollektiv qurban və təzə ət satışı.
          </h1>
          <div className="mt-4 grid gap-3 md:mt-5 md:gap-4 lg:grid-cols-3">
            {cards.map((item, index) => (
              <ServiceDetailCard key={item.title} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
