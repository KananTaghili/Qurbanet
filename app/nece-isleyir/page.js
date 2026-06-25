"use client";
import SiteLayout from "../../components/SiteLayout";

const steps = [
  { title: "Xidməti seçin",          text: "Qurbanlıq sifarişi, Kollektiv Qurban və ya Ət Satışı xidmətlərindən birini seçin." },
  { title: "Sifarişi təsdiqləyin",    text: "MeatBox komandası sifarişinizi qəbul edib, prosesi addım-addım idarə edir." },
  { title: "Video hesabat alın",      text: "Kəsim prosesini real vaxt rejimində video ilə izləyin və arxayın olun." },
  { title: "Çatdırılmanı qəbul edin", text: "Soyuq zəncir nəqliyyatla ətiniz və ya payınız ən qısa zamanda çatdırılır." },
];

export default function HowItWorksPage() {
  return (
    <SiteLayout>
      <section className="bg-[#fbf7f2] px-4 py-4 text-[#1d0c08] sm:px-6 md:px-8 md:py-5">
        <div className="rounded-[1.25rem] border border-[#ead9cf] bg-white/90 p-4 shadow-[0_18px_50px_rgba(35,18,8,0.10)] sm:p-5 md:rounded-[1.5rem] md:p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#e10d0d] md:text-xs md:tracking-[0.28em]">Necə işləyir?</p>
          <h1 className="mt-2 max-w-3xl text-xl font-black leading-snug sm:text-2xl md:text-3xl">
            Sifarişdən çatdırılmaya qədər proses sadə və şəffafdır.
          </h1>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:mt-5 md:gap-4 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-[#ead9cf] bg-[#fff8f1] p-4 sm:p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e10d0d] font-black text-white">
                  {i + 1}
                </span>
                <h3 className="mt-3 text-base font-black sm:mt-4 sm:text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
