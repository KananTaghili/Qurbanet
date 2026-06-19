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
  if (icon === "register") return <UserRoundCheck size={24} strokeWidth={2.4} className="text-[#ea580c]" />;
  if (icon === "opening")  return <PlusCircle size={24} strokeWidth={2.4} className="text-[#0891b2]" />;
  if (icon === "payment")  return <Coins size={24} strokeWidth={2.2} className="text-[#7c3aed]" />;
  if (icon === "video")    return <Video size={24} strokeWidth={2.2} className="text-[#db2777]" />;
  return <HandHeart size={24} strokeWidth={2.2} className="text-[#16a34a]" />;
}

export default function NecePage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#fbfaff] px-4 py-5 pb-20 lg:pb-6">
      <div className="mb-6">
        <h1 className="text-[22px] font-black tracking-[-.02em] text-[#241a4d]">Necə işləyir?</h1>
        <p className="mt-1 text-[13px] font-semibold text-[#8778a8]">Kollektiv platformasında qurban prosesi</p>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-7 bottom-7 w-0.5 bg-gradient-to-b from-[#e9d9ff] via-[#c4b5fd] to-[#e9d9ff]" />
        <div className="space-y-4">
          {NECE_STEPS.map((s, i) => (
            <div key={i} className="flex gap-4 relative">
              <div className="h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center z-10 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                style={{ background: s.bg }}>
                <NeceStepIcon icon={s.icon} />
              </div>
              <div className="flex-1 rounded-2xl border border-[#ece6f5] bg-white p-4 shadow-[0_3px_10px_rgba(46,23,92,0.06)]">
                <div className="mb-2 inline-flex items-center justify-center rounded-full bg-[#f1ecff] h-6 w-6">
                  <span className="text-[11px] font-black text-[#5b22c7]">{i + 1}</span>
                </div>
                <div className="text-[14px] font-extrabold leading-snug text-[#241a4d] mb-1.5">{s.title}</div>
                <div className="text-[13px] leading-relaxed text-[#6b7280]">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#e7e1f0] bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#6a24d1] to-[#3d0aa8] text-white shadow-[0_4px_10px_rgba(83,25,188,.22)]">
            <Heart size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[13px] font-extrabold text-[#241a4d]">Birlikdə xeyir, birlikdə paylaşaq</div>
            <div className="mt-0.5 text-[12px] text-[#8778a8]">Tam şəffaflıq · Halal kəsim · Ehtiyac sahiblərinə çatdırılır</div>
          </div>
        </div>
      </div>
    </div>
  );
}
