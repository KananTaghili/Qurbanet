"use client";
import { Phone, Mail, MapPin, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import SiteLayout from "../../components/SiteLayout";

const contacts = [
  { icon: Phone, title: "Telefon",      text: "+994 10 399 02 22" },
  { icon: Mail,  title: "Email",        text: "info@meatbox.az" },
  { icon: MapPin, title: "Ünvan",       text: "Bakı, Azərbaycan" },
  { icon: Clock, title: "İş saatları",  text: "Hər gün 09:00–20:00" },
];

function InfoCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-[#ead9cf] bg-[#fff8f1] p-4 sm:p-5">
      <Icon className="h-8 w-8 text-[#e10d0d] sm:h-9 sm:w-9" />
      <h3 className="mt-3 text-lg font-black sm:mt-4 sm:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-700 sm:text-base sm:leading-7">{text}</p>
    </div>
  );
}

export default function ContactPage() {
  return (
    <SiteLayout>
      <section className="bg-[#fbf7f2] px-4 py-4 text-[#1d0c08] sm:px-6 md:px-8 md:py-5">
        <div className="relative rounded-[1.25rem] border border-[#ead9cf] bg-white/90 p-4 shadow-[0_18px_50px_rgba(35,18,8,0.10)] sm:p-5 md:rounded-[1.5rem] md:p-6">
          {/* Mobile: fixed quarter-circle back button at top-left corner */}
          <Link href="/"
            className="lg:hidden fixed top-0 left-0 z-50 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
            style={{ background: "#f20b32", width: 62, height: 62, borderRadius: "0 0 100% 0", paddingBottom: 14, paddingRight: 14 }}>
            <ArrowLeft className="h-5 w-5 text-white" strokeWidth={2.5} />
          </Link>
          {/* Desktop: absolute circle at card corner */}
          <Link href="/" className="hidden lg:flex absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full hover:opacity-80 active:scale-95 transition-all" style={{ background: "#f20b32" }}>
            <ArrowLeft className="h-4 w-4 text-white" strokeWidth={2.5} />
          </Link>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#e10d0d] md:text-xs md:tracking-[0.28em]">Əlaqə</p>
          <h1 className="mt-2 max-w-3xl text-xl font-black leading-snug sm:text-2xl md:text-3xl">
            Sualınız var? MeatBox komandası ilə əlaqə saxlayın.
          </h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:mt-5 md:gap-4 lg:grid-cols-4">
            {contacts.map((c) => (
              <InfoCard key={c.title} {...c} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
