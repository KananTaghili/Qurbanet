"use client";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import SiteLayout from "../../components/SiteLayout";

const contacts = [
  { icon: Phone,  title: "Telefon",      text: "+994 10 399 02 22" },
  { icon: Mail,   title: "Email",        text: "info@meatbox.az" },
  { icon: MapPin, title: "Ünvan",        text: "Bakı, Azərbaycan" },
  { icon: Clock,  title: "İş saatları", text: "Hər gün 09:00–20:00" },
];

export default function ContactPage() {
  return (
    <SiteLayout>
      <section className="bg-[#fbf7f2] px-6 py-10 text-[#1d0c08] md:px-12 md:py-14">
        <div className="rounded-[1.5rem] border border-[#ead9cf] bg-white/90 p-6 shadow-[0_18px_50px_rgba(35,18,8,0.10)] md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#e10d0d]">Əlaqə</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">Sualınız var? MeatBox komandası ilə əlaqə saxlayın.</h1>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {contacts.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-[#ead9cf] bg-[#fff8f1] p-5">
                <Icon className="h-9 w-9 text-[#e10d0d]" />
                <h3 className="mt-4 text-xl font-black">{title}</h3>
                <p className="mt-2 leading-7 text-neutral-700">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
