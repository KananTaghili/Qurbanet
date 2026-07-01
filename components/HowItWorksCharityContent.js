"use client";

import { Heart, UserRoundCheck, PlusCircle, Coins, Video, HandHeart } from "lucide-react";

const NECE_STEPS = [
  {
    icon: "register",
    title: "Qeydiyyatdan keçirsiz və ya Anonim davam edirsiz",
    desc: "Platformada hesab yaradın və ya qeydiyyatdan keçmədən anonim şəkildə davam edərək şəxsiyyətinizi təsdiqləyin.",
    bg: "linear-gradient(135deg, #fff7ed, #fed7aa)",
  },
  {
    icon: "opening",
    title: "Yeni Açılış edirsiz və ya Davam edən açılışlardan seçirsiz",
    desc: "Əgər hansısa qurbanlıq tipi açılışı yoxdursa yeni açılış edə bilərsiniz. Və ya davam edən qurban açılışlarına baxıb, sizə uyğun olanı seçə bilərsiniz.",
    bg: "linear-gradient(135deg, #ecfeff, #a5f3fc)",
  },
  {
    icon: "payment",
    title: "İanə məbləğini daxil edib, ödəniş səhifəsinə keçirsiz",
    desc: "Seçdiyiniz heyvana görə ianə məbləğini daxil edib, təhlükəsiz ödəniş səhifəsinə keçirsiz.",
    bg: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
  },
  {
    icon: "video",
    title: "Tamamlanmış qurbanlığın kəsim videosunu izləyə bilərsiz",
    desc: "Qurbanlığın tam məbləği toplandıqdan sonra qurbanlığı biz alırıq və kəsirik. Kəsim zamanı qurbanlığın kəsim videosu çəkilir və səhifəyə yüklənir.",
    bg: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
  },
  {
    icon: "delivery",
    title: "Kəsilmiş qurbanlığı biz çatdırırıq",
    desc: "Kəsilmiş qurbanlıq doğranaraq paylara bölünür və ehtiyac sahibi ailələrə paylanılır.",
    bg: "linear-gradient(135deg, #f0fdf4, #bbf7d0)",
  },
];

function NeceStepIcon({ icon }) {
  if (icon === "register") return <UserRoundCheck size={20} strokeWidth={2.4} className="text-[#ea580c]" />;
  if (icon === "opening")  return <PlusCircle size={20} strokeWidth={2.4} className="text-[#0891b2]" />;
  if (icon === "payment")  return <Coins size={20} strokeWidth={2.2} className="text-[#7c3aed]" />;
  if (icon === "video")    return <Video size={20} strokeWidth={2.2} className="text-[#db2777]" />;
  return <HandHeart size={20} strokeWidth={2.2} className="text-[#16a34a]" />;
}

export default function HowItWorksCharityContent() {
  return (
    <div>
      <div className="mb-2.5">
        <h1 className="text-[18px] font-black tracking-[-.02em] text-[#241a4d]">Necə işləyir?</h1>
        <p className="mt-0.5 text-[12px] font-semibold text-[#8778a8]">Kollektiv platformasında qurban prosesi</p>
      </div>

      <div className="relative">
        <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#e9d9ff] via-[#c4b5fd] to-[#e9d9ff]" />
        <div className="space-y-2">
          {NECE_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 relative">
              <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center z-10 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                style={{ background: s.bg }}>
                <NeceStepIcon icon={s.icon} />
              </div>
              <div className="flex-1 rounded-xl border border-[#ece6f5] bg-white px-3 py-2.5 shadow-[0_3px_10px_rgba(46,23,92,0.06)]">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="inline-flex items-center justify-center rounded-full bg-[#f1ecff] h-5 w-5 shrink-0">
                    <span className="text-[10px] font-black text-[#5b22c7]">{i + 1}</span>
                  </div>
                  <div className="text-[13px] font-extrabold leading-snug text-[#241a4d]">{s.title}</div>
                </div>
                <div className="text-[12px] leading-relaxed text-[#6b7280] pl-7">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2.5 rounded-xl border border-[#e7e1f0] bg-white px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#6a24d1] to-[#3d0aa8] text-white shadow-[0_4px_10px_rgba(83,25,188,.22)]">
            <Heart size={15} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[12px] font-extrabold text-[#241a4d]">Yaxşılıq elə ki, başına gəlsin.</div>
            <div className="mt-0.5 text-[11px] text-[#8778a8]">Tam şəffaflıq · Halal kəsim · Ehtiyac sahiblərinə çatdırılır</div>
          </div>
        </div>
      </div>
    </div>
  );
}
