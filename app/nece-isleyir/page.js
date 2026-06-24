"use client";
import SiteLayout from "../../components/SiteLayout";

const steps = [
  { label: "Xidməti seçin",        text: "MeatBox platformasında qurbanlıq sifarişi, kollektiv qurban və ya ət satışı seçimlərindən birini seçin." },
  { label: "Sifarişi təsdiqləyin", text: "Şəxsi məlumatlarınızı daxil edin, ödəniş metodunu seçin və sifarişinizi təsdiqləyin." },
  { label: "Video hesabat alın",   text: "MeatBox komandası kəsim prosesini video ilə qeydə alır və sizə göndərir." },
  { label: "Çatdırılmanı qəbul edin", text: "Sifarişiniz soyuq zəncir nəqliyyatla ən qısa zamanda birbaşa qapınıza çatdırılır." },
];

export default function HowItWorksPage() {
  return (
    <SiteLayout>
      <section className="bg-[#fbf7f2] px-6 py-10 text-[#1d0c08] md:px-12 md:py-14">
        <div className="rounded-[1.5rem] border border-[#ead9cf] bg-white/90 p-6 shadow-[0_18px_50px_rgba(35,18,8,0.10)] md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#e10d0d]">Necə işləyir?</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">Sifarişdən çatdırılmaya qədər proses sadə və şəffafdır.</h1>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.label} className="rounded-2xl border border-[#ead9cf] bg-[#fff8f1] p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e10d0d] font-black text-white">{i + 1}</span>
                <h3 className="mt-4 text-lg font-black">{step.label}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
