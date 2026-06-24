"use client";
import { CheckCircle2 } from "lucide-react";
import SiteLayout from "../../components/SiteLayout";

function PageShell({ eyebrow, title, children }) {
  return (
    <section className="bg-[#fbf7f2] px-6 py-10 text-[#1d0c08] md:px-12 md:py-14">
      <div className="rounded-[1.5rem] border border-[#ead9cf] bg-white/90 p-6 shadow-[0_18px_50px_rgba(35,18,8,0.10)] md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#e10d0d]">Haqqımızda</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">{title}</h1>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function Info({ title, text, icon: Icon = CheckCircle2 }) {
  return (
    <div className="rounded-2xl border border-[#ead9cf] bg-[#fff8f1] p-5">
      <Icon className="h-9 w-9 text-[#e10d0d]" />
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-2 leading-7 text-neutral-700">{text}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <SiteLayout>
      <PageShell title="MEATBOX — təbiiliyi, dürüstlüyü və rəqəmsal rahatlığı bir araya gətirən platforma.">
        <div className="rounded-[1.35rem] border border-[#ead9cf] bg-[#fff8f1] p-6 text-lg leading-8 text-neutral-800 md:p-8">
          <p>
            MEATBOX — təbiiliyi, dürüstlüyü və rəqəmsal rahatlığı bir araya gətirən müasir ət və qurbanlıq sifarişi platformasıdır. Bizim məqsədimiz, Azərbaycanın zəngin təbiətində bəslənən ən sağlam heyvanları seçərək, yüksək gigiyenik şəraitdə süfrənizə çatdırmaqdır.
          </p>
          <p className="mt-5">
            İnnovativ texnologiyamız və sahəsində mütəxəssis komandamızla həm ailənizin sağlamlığını qorumaq, həm də rəqəmsal dünyanın rahatlığını sizə yaşatmaq üçün xidmətinizdəyik!
          </p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <Info title="Etibarlı" text="Kəsimdən çatdırılmaya qədər olan hər bir mərhələdə tam şəffaflığa zəmanət veririk. İstər gündəlik ət satışı, istərsə də şəffaf Kollektiv Qurban layihələrimiz vasitəsilə xeyriyyə və ibadətlərinizin tam arxayınlıqla, doğru ünvana çatdırılmasını təmin edirik." />
          <Info title="Halal" text="Bütün proseslərimiz İslami qaydalara, halal kəsim standartlarına və ciddi sanitariya-gigiyena normalarına tam uyğun şəkildə, peşəkar qəssablar tərəfindən icra olunur." />
          <Info title="Sürətli" text="Sifarişləriniz xüsusi soyuq zəncir (soyuduculu) nəqliyyat sistemimizlə, təravətini və qida dəyərini itirmədən, ən qısa zamanda birbaşa qapınıza çatdırılır." />
        </div>
      </PageShell>
    </SiteLayout>
  );
}
