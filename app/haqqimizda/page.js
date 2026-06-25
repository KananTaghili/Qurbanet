"use client";
import { CheckCircle2 } from "lucide-react";
import SiteLayout from "../../components/SiteLayout";

function Info({ title, text, icon: Icon = CheckCircle2 }) {
  return (
    <div className="rounded-2xl border border-[#ead9cf] bg-[#fff8f1] p-4 sm:p-5">
      <Icon className="h-8 w-8 text-[#e10d0d] sm:h-9 sm:w-9" />
      <h3 className="mt-3 text-lg font-black sm:mt-4 sm:text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-700 sm:text-base sm:leading-7">{text}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <SiteLayout>
      <section className="bg-[#fbf7f2] px-4 py-4 text-[#1d0c08] sm:px-6 md:px-8 md:py-5">
        <div className="rounded-[1.25rem] border border-[#ead9cf] bg-white/90 p-4 shadow-[0_18px_50px_rgba(35,18,8,0.10)] sm:p-5 md:rounded-[1.5rem] md:p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#e10d0d] md:text-xs md:tracking-[0.28em]">Haqqımızda</p>
          <h1 className="mt-2 max-w-3xl text-xl font-black leading-snug sm:text-2xl md:text-3xl">
            MEATBOX — təbiiliyi, dürüstlüyü və rəqəmsal rahatlığı bir araya gətirən platforma.
          </h1>

          <div className="mt-4 md:mt-4">
            <div className="rounded-[1.25rem] border border-[#ead9cf] bg-[#fff8f1] p-4 text-sm leading-6 text-neutral-800 sm:p-4 md:rounded-[1.35rem] md:p-5">
              <p>
                MEATBOX — təbiiliyi, dürüstlüyü və rəqəmsal rahatlığı bir araya gətirən müasir ət və qurbanlıq sifarişi platformasıdır. Bizim məqsədimiz, Azərbaycanın zəngin təbiətində bəslənən ən sağlam heyvanları seçərək, yüksək gigiyenik şəraitdə süfrənizə çatdırmaqdır.
              </p>
              <p className="mt-5">
                İnnovativ texnologiyamız və sahəsində mütəxəssis komandamızla həm ailənizin sağlamlığını qorumaq, həm də rəqəmsal dünyanın rahatlığını sizə yaşatmaq üçün xidmətinizdəyik!
              </p>
            </div>

            <div className="mt-3 grid gap-3 md:mt-4 md:grid-cols-3 md:gap-4">
              <Info title="Etibarlı" text="Kəsimdən çatdırılmaya qədər olan hər bir mərhələdə tam şəffaflığa zəmanət veririk. İstər gündəlik ət satışı, istərsə də şəffaf Kollektiv Qurban layihələrimiz vasitəsilə xeyriyyə və ibadətlərinizin tam arxayınlıqla, doğru ünvana çatdırılmasını təmin edirik." />
              <Info title="Halal" text="Bütün proseslərimiz İslami qaydalara, halal kəsim standartlarına və ciddi sanitariya-gigiyena normalarına tam uyğun şəkildə, peşəkar qəssablar tərəfindən icra olunur." />
              <Info title="Sürətli" text="Sifarişləriniz xüsusi soyuq zəncir (soyuduculu) nəqliyyat sistemimizlə, təravətini və qida dəyərini itirmədən, ən qısa zamanda birbaşa qapınıza çatdırılır." />
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
