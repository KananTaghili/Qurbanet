"use client";
import Link from "next/link";
import { ArrowRight, HeartHandshake, Beef } from "lucide-react";
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
    <article className="relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-[#ead9cf] bg-[#fff8f1] p-4 shadow-[0_16px_45px_rgba(35,18,8,0.08)] sm:p-6 md:rounded-[1.5rem]">
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full ${c.bg} opacity-10`} />
      <div className="relative flex items-start gap-4 sm:gap-5">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 bg-white sm:h-16 sm:w-16 ${c.text} ${c.border}`}>
          <Icon className="h-8 w-8 sm:h-9 sm:w-9" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-[0.24em] text-neutral-400">0{index + 1} / Xidmət</span>
          <h3 className={`mt-2 text-xl font-black leading-6 sm:text-2xl sm:leading-7 ${c.text}`}>{item.title}</h3>
        </div>
      </div>
      <p className="relative mt-4 flex-1 text-sm leading-6 text-neutral-700 sm:mt-5 sm:text-[15px] sm:leading-7">{item.text}</p>
      {item.href ? (
        <Link href={item.href} className={`relative mt-6 inline-flex w-fit items-center gap-3 border-b-2 pb-1 text-sm font-black transition hover:opacity-75 ${c.text} ${c.border}`}>
          Ətraflı bax <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="relative mt-6 inline-flex w-fit cursor-not-allowed items-center gap-3 border-b-2 pb-1 text-sm font-black opacity-40 border-neutral-300 text-neutral-400">
          Tezliklə <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </article>
  );
}

export default function ServicesPage() {
  return (
    <SiteLayout>
      <section className="bg-[#fbf7f2] px-4 py-4 text-[#1d0c08] sm:px-6 md:px-8 md:py-5">
        <div className="rounded-[1.25rem] border border-[#ead9cf] bg-white/90 p-4 shadow-[0_18px_50px_rgba(35,18,8,0.10)] sm:p-5 md:rounded-[1.5rem] md:p-6">
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
