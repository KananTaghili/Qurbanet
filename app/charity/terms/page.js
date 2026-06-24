"use client";

import { useState, useEffect } from "react";
import { BarChart3, Coins, Beef, UserRoundCheck, Lock, FileText } from "lucide-react";
import api from "../../../lib/api";

const SERTLER_STATIC = [
  {
    icon: Beef,
    color: { bg: "bg-amber-50",   icon: "text-amber-500",   title: "text-amber-700"   },
    value: "Hər heyvan növünə 1 ədəd",
    label: "Hər heyvan tipi üçün yalnız 1 açılış ola bilər. Yeni açılış üçün müvafiq heyvan tipinə uyğun davam edən açılışın bitməsi lazımdır.",
  },
  {
    icon: UserRoundCheck,
    color: { bg: "bg-blue-50",    icon: "text-blue-500",    title: "text-blue-700"    },
    value: "Yeni açılışa 1 nəfər",
    label: "Yeni açılışı yalnız bir nəfər edə bilər. Yeni açılış əlavə et səhifəsinə daxil olaraq aktiv görünən heyvan tipini seçib ilkin ödənişi etdikdən sonra açılış baş tutacaq.",
  },
  {
    icon: Lock,
    color: { bg: "bg-rose-50",    icon: "text-rose-500",    title: "text-rose-700"    },
    value: "Anonim açılış və ya ianə",
    label: "Əgər adınızın digər istifadəçilərə görünməsini istəmirsinizsə həm Anonim olaraq açılış edə bilərsiniz, həm də ianə verə bilərsiniz. Bu zaman qeydiyyat etməyə ehtiyac yoxdur.",
  },
  {
    icon: FileText,
    color: { bg: "bg-teal-50",    icon: "text-teal-500",    title: "text-teal-700"    },
    value: "Şəxsi səhifə",
    label: "Əgər qeydiyyatdan keçmisinizsə əsas səhifədən İanələrim bölməsinə keçərək etdiyiniz açılış və ianə detalları haqqında ətraflı məlumat əldə edə bilərsiniz.",
  },
];

export default function SertlerPage() {
  const [minDon, setMinDon]       = useState(10);
  const [minOpenPct, setMinOpenPct] = useState(30);

  useEffect(() => {
    api.get("/campaigns/settings")
      .then(res => {
        const s = res.data?.data?.settings || {};
        if (s.minDonation)    setMinDon(s.minDonation);
        if (s.minOpenPercent) setMinOpenPct(s.minOpenPercent);
      })
      .catch(() => {});
  }, []);

  const sertler = [
    {
      icon: BarChart3,
      color: { bg: "bg-violet-50",  icon: "text-violet-500",  title: "text-violet-700"  },
      value: `Yeni Açılış üçün minimum ${minOpenPct}%`,
      label: `Yeni ianə açılışı zamanı ümumi qurbanlıq məbləğinin minimum ${minOpenPct}%-ni açılış edən şəxs ödəməlidir.`,
    },
    {
      icon: Coins,
      color: { bg: "bg-emerald-50", icon: "text-emerald-500", title: "text-emerald-700" },
      value: `İanə üçün minimum ${minDon} AZN`,
      label: `Əsas səhifədə göstərilən açılışı davam edən qurbanlıqlara ianə vermək üçün minimum ${minDon} AZN tələb olunur.`,
    },
    ...SERTLER_STATIC,
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 pb-20 lg:pb-3">
      <h1 className="text-[#241a4d] mb-0.5 font-extrabold text-[18px]">Şərtlərimiz</h1>
      <p className="text-gray-500 text-[12px] mb-3">Platforma qaydaları və istifadə şərtləri</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {sertler.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.value} className="bg-white rounded-xl px-4 py-3 border border-[#eee8f6] shadow-sm flex gap-3 items-start">
              <div className={`mt-0.5 shrink-0 flex h-9 w-9 items-center justify-center rounded-xl ${s.color.bg}`}>
                <Icon size={18} className={s.color.icon} />
              </div>
              <div className="min-w-0">
                <div className={`font-extrabold text-[13px] leading-snug mb-0.5 ${s.color.title}`}>{s.value}</div>
                <div className="text-[12px] text-gray-500 leading-relaxed">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
