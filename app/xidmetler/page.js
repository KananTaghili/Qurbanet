"use client";
import { ArrowRight, HeartHandshake, Beef } from "lucide-react";
import { PiKnifeBold } from "react-icons/pi";
import SiteLayout from "../../components/SiteLayout";

const cards = [
  { title: "Qurbanlıq Sifarişi", text: "Qurbanlığınızı onlayn seçin, sifariş edin və kəsim prosesini video ilə izləyin. Etibarlı və şəffaf xidmət.", color: "emerald", Icon: PiKnifeBold, button: "SİFARİŞ ET" },
  { title: "Kollektiv Qurban",   text: "Birlikdə qurban kəsdirək, ehtiyacı olanlara pay göndərək. Şəffaf və etibarlı xeyriyyə platforması.",       color: "violet",  Icon: HeartHandshake, button: "QOŞUL" },
  { title: "Ət Satışı",          text: "Təzə və keyfiyyətli ət məhsullarını onlayn sifariş edin, soyudulmuş şəkildə qapınıza çatdıraq.",             color: "orange",  Icon: Beef, button: "MƏHSULLARA BAX" },
];

const colorMap = {
  emerald: { text: "text-[#0b6c24]", border: "border-[#0b6c24]", borderCard: "border-[#0b6c24]/25", bg: "bg-[#0b6c24]", bgLight: "bg-[#0b6c24]" },
  violet:  { text: "text-[#6820a3]", border: "border-[#6820a3]", borderCard: "border-[#6820a3]/25", bg: "bg-[#6820a3]", bgLight: "bg-[#6820a3]" },
  orange:  { text: "text-[#c85a13]", border: "border-[#c85a13]", borderCard: "border-[#c85a13]/25", bg: "bg-[#c85a13]", bgLight: "bg-[#c85a13]" },
};

function ServiceDetailCard({ item, index }) {
  const c = colorMap[item.color];
  const Icon = item.Icon;
  return (
    <div className="relative mt-9">
      {/* Icon half outside top */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
        <div className={`grid h-16 w-16 place-items-center rounded-full border-2 bg-white shadow-md ${c.text} ${c.border}`}>
          <Icon className="h-9 w-9" />
        </div>
      </div>
      <article className="relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-[#ead9cf] bg-[#fff8f1] pt-10 px-6 pb-6 shadow-[0_16px_45px_rgba(35,18,8,0.08)]">
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${c.bg} opacity-10`} />
      <div className="relative">
          <span className="text-xs font-black uppercase tracking-[0.24em] text-neutral-400">0{index + 1} / Xidmət</span>
          <h3 className={`mt-2 text-2xl font-black leading-7 ${c.text}`}>{item.title}</h3>
      </div>
      <p className="relative mt-5 min-h-24 flex-1 text-[15px] leading-7 text-neutral-700">{item.text}</p>
      <button className={`relative mt-6 inline-flex w-fit items-center gap-3 border-b-2 pb-1 text-sm font-black ${c.text} ${c.border}`}>
        Ətraflı bax <ArrowRight className="h-4 w-4" />
      </button>
      </article>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <SiteLayout>
      <section className="bg-[#fbf7f2] px-6 py-10 text-[#1d0c08] md:px-12 md:py-14">
        <div className="rounded-[1.5rem] border border-[#ead9cf] bg-white/90 p-6 shadow-[0_18px_50px_rgba(35,18,8,0.10)] md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#e10d0d]">Xidmətlər</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">Üç əsas xidmət — qurbanlıq, kollektiv qurban və təzə ət satışı.</h1>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {cards.map((item, index) => <ServiceDetailCard key={item.title} item={item} index={index} />)}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
