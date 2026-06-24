import {
  Home, List, CheckCircle, HelpCircle, FileText,
} from "lucide-react";

export const AZ_MONTHS = ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
export const ANIMAL_IMG_FALLBACK = { "Dana":"/dana.png","Qoyun":"/qoyun.png","Qoç":"/qoc.png","Dəvə":"/deve.png" };
export const CAMPAIGN_STATUS_MAP = { collecting:"Davam edir", completed:"Tamamlandı", cancelled:"Ləğv olundu" };

export const STATUS_CFG = {
  "Tamamlandı": { label: "Tamamlanıb",        badge: "bg-emerald-50 text-emerald-700", color: "#2f8b58", track: "#dff4e9" },
  "Davam edir": { label: "Açılış davam edir", badge: "bg-amber-50 text-amber-600",    color: "#5a19c9", track: "#eee4ff" },
  "Ləğv olundu":{ label: "Ləğv olundu",       badge: "bg-rose-50 text-rose-500",      color: "#fb4c61", track: "#ffe0e5" },
};

export const AVATAR_PALETTE = [
  { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#dbeafe", text: "#1d4ed8" },
  { bg: "#d1fae5", text: "#065f46" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#ccfbf1", text: "#115e59" },
  { bg: "#e0e7ff", text: "#3730a3" },
  { bg: "#ffedd5", text: "#9a3412" },
];

export const SIDEBAR_NAV = [
  { icon: Home,        label: "Əsas",          short: "Əsas",        href: "/charity"             },
  { icon: List,        label: "İanələrim",     short: "İanələrim",   href: "/charity/donations"    },
  { icon: CheckCircle, label: "Tamamlanmış",   short: "Bitənlər",    href: "/charity/completed"    },
  { icon: HelpCircle,  label: "Necə işləyir", short: "Necə işlər",  href: "/charity/how-it-works"  },
  { icon: FileText,    label: "Şərtlərimiz",  short: "Şərtlər",     href: "/charity/terms"         },
];

export const FEATURES = [
  { icon: "Eye",    title: "Tam şəffaflıq",       desc: "Hər addımı izləyə bilərsiniz" },
  { icon: "Video",  title: "Canlı izləmə",        desc: "Kəsim anını canlı izləyin"    },
  { icon: "Heart",  title: "Ehtiyac sahiblərinə", desc: "Birbaşa çatdırılır"           },
  { icon: "Users",  title: "Birlikdə xeyir",      desc: "Paylaş, birlikdə eylə"        },
];

export const TAB_OPTIONS    = ["Hamısı","Açdığım açılışlar","İştirak etdiyim açılışlar"];
export const STATUS_OPTIONS = ["Hamısı","Davam edir","Tamamlandı","Ləğv olundu"];

export function avatarColor(name) {
  if (!name || name === "Anonim") return { bg: "#f1f5f9", text: "#64748b" };
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

export function initials(name) {
  if (!name || name === "Anonim") return "?";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getDate()} ${AZ_MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function fmtAmt(v) {
  const n = Number(v || 0);
  return isNaN(n) ? "0" : n.toLocaleString();
}

export function fmtTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
}

export function mapMyCampaign(c) {
  const img = (c.animal?.image?.startsWith?.("http") ? c.animal.image : null)
    || ANIMAL_IMG_FALLBACK[c.animal?.nameAz] || "/qoyun.png";
  const video = (c.media || []).find(m => m.type === "video");
  return {
    id: c._id, campaignId: c._id, campaignNumber: c.campaignNumber || "",
    type: c.animal?.nameAz || "Qurban",
    amount: fmtAmt(c.myPaidAmount), amountRaw: c.myPaidAmount || 0,
    collectedAmount: fmtAmt(c.collectedAmount), totalAmount: fmtAmt(c.totalAmount),
    totalAmountRaw: c.totalAmount || 0, collectedAmountRaw: c.collectedAmount || 0,
    progressPercent: c.percent || 0,
    startDate: fmtDate(c.createdAt),
    endDate: c.status === "completed" ? fmtDate(c.completedAt) : "—",
    date: fmtDate(c.status === "completed" ? c.completedAt : c.createdAt),
    status: CAMPAIGN_STATUS_MAP[c.status] || "Davam edir",
    createdAtRaw: c.createdAt || null,
    organizer: c.iAmOpener ? "Siz açmısınız" : "Siz iştirak etmisiniz",
    participants: c.participantCount || 1,
    img, videoUrl: video?.url || null, media: c.media || [], iAmOpener: !!c.iAmOpener,
    weightRange: c.animal?.weightRange || "",
    donations: c.donations || [],
  };
}

export function mapCompletedCampaign(c) {
  const img = (c.animal?.image?.startsWith?.("http") ? c.animal.image : null)
    || ANIMAL_IMG_FALLBACK[c.animal?.nameAz] || "/qoyun.png";
  const video = (c.media || []).find(m => m.type === "video");
  return {
    id: c._id, campaignNumber: c.campaignNumber || "",
    type: c.animal?.nameAz || "Qurban",
    amount: fmtAmt(c.collectedAmount), amountRaw: c.collectedAmount || 0,
    collectedAmount: fmtAmt(c.collectedAmount), totalAmount: fmtAmt(c.totalAmount),
    progressPercent: 100,
    date: fmtDate(c.completedAt), startDate: fmtDate(c.createdAt), endDate: fmtDate(c.completedAt),
    status: "Tamamlandı",
    organizer: c.opener?.isAnonymous ? "Anonim" : ([c.opener?.name, c.opener?.lastName].filter(Boolean).join(" ") || "—"),
    participants: c.participantCount || 0,
    img, videoUrl: video?.url || null, media: c.media || [],
    weightRange: c.animal?.weightRange || "",
    donations: c.donations || [],
  };
}

export function mapHomeCampaign(c, minDonation) {
  const img = (c.animal?.imageHome?.startsWith?.("http") ? c.animal.imageHome : null)
    || (c.animal?.image?.startsWith?.("http") ? c.animal.image : null)
    || ANIMAL_IMG_FALLBACK[c.animal?.nameAz] || "/qoyun.png";
  return {
    campaignId: c._id,
    type: c.animal?.nameAz || "Qurban",
    progressPercent: c.percent || 0,
    collected: fmtAmt(c.collectedAmount),
    target: fmtAmt(c.totalAmount),
    currency: "AZN",
    organizer: c.opener?.isAnonymous ? "Anonim" : ([c.opener?.name, c.opener?.lastName].filter(Boolean).join(" ") || "—"),
    participants: c.participantCount || 0,
    shareMin: String(minDonation || 10),
    shareMinRaw: Number(minDonation || 10),
    targetRaw: Number(c.totalAmount || 0),
    totalMin: fmtAmt(Number(Math.max(0, c.totalAmount - c.collectedAmount).toFixed(2))),
    totalMax: fmtAmt(c.totalAmount),
    startTime: fmtDate(c.createdAt),
    img, remainingAmount: c.remainingAmount, status: c.status,
    weightRange: c.animal?.weightRange || "",
  };
}
