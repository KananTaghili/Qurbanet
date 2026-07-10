// Bədən xəritəsi üçün paylaşılan koordinatlar (viewBox 480x300).
// Hər bölgə bir SVG poliqonudur (sərhədlər AnimalBodyMap-da "hand-drawn"
// filtri ilə yüngülcə dalğalandırılır) və heyvanın öz konturuna klip olunur.

export const VIEWBOX = "0 0 480 300";

// Qoyun / Qoç / Keçi — eyni bədən planı, 10 bölgə
export const QUAD_REGION_GEOMETRY = {
  bas:     "M 30,55 L 83,55 L 101,245 L 30,245 Z",
  boyun:   "M 83,55 L 114,55 L 132,245 L 101,245 Z",
  kurek:   "M 114,55 L 160,55 L 169,150 L 123,150 Z",
  dos:     "M 123,150 L 169,150 L 178,245 L 132,245 Z",
  qaburga: "M 160,55 L 204,55 L 222,245 L 178,245 Z",
  bel:     "M 204,55 L 249,55 L 258,150 L 213,150 Z",
  boyur:   "M 213,150 L 258,150 L 267,245 L 222,245 Z",
  but:     "M 249,55 L 294,55 L 303,150 L 258,150 Z",
  incik:   "M 258,150 L 303,150 L 312,245 L 267,245 Z",
  quyruq:  "M 294,55 L 358,55 L 358,245 L 312,245 Z",
};

// Dana — ən böyük heyvan, 13 bölgə
export const DANA_REGION_GEOMETRY = {
  bas:        "M 35,70 L 88,70 L 88,280 L 35,280 Z",
  boyun:      "M 88,70 L 114,70 L 114,280 L 88,280 Z",
  kurek:      "M 114,70 L 150,70 L 150,170 L 114,170 Z",
  dos:        "M 114,170 L 150,170 L 150,280 L 114,280 Z",
  on_incik:   "M 150,70 L 212,70 L 212,280 L 150,280 Z",
  qaburga:    "M 212,70 L 240,70 L 240,170 L 212,170 Z",
  qarin_alti: "M 212,170 L 240,170 L 240,280 L 212,280 Z",
  bel:        "M 240,70 L 266,70 L 266,170 L 240,170 Z",
  boyur:      "M 240,170 L 266,170 L 266,280 L 240,280 Z",
  sagri:      "M 266,70 L 330,70 L 330,170 L 266,170 Z",
  arxa_incik: "M 266,170 L 330,170 L 330,280 L 266,280 Z",
  but:        "M 330,70 L 350,70 L 350,280 L 330,280 Z",
  quyruq:     "M 350,70 L 370,70 L 370,280 L 350,280 Z",
};

// Dəvə — 12 bölgə (hörgüc əlavə)
export const DEVE_REGION_GEOMETRY = {
  bas:        "M 65,55 L 108,55 L 108,270 L 65,270 Z",
  boyun:      "M 108,55 L 148,55 L 148,270 L 108,270 Z",
  kurek:      "M 148,55 L 172,55 L 172,170 L 148,170 Z",
  dos:        "M 148,170 L 172,170 L 172,270 L 148,270 Z",
  on_incik:   "M 172,55 L 225,55 L 225,270 L 172,270 Z",
  horguc:     "M 225,55 L 250,55 L 250,270 L 225,270 Z",
  qaburga:    "M 250,55 L 264,55 L 264,270 L 250,270 Z",
  bel:        "M 264,55 L 278,55 L 278,170 L 264,170 Z",
  boyur:      "M 264,170 L 278,170 L 278,270 L 264,270 Z",
  arxa_incik: "M 278,55 L 335,55 L 335,270 L 278,270 Z",
  but:        "M 335,55 L 358,55 L 358,270 L 335,270 Z",
  quyruq:     "M 358,55 L 375,55 L 375,270 L 358,270 Z",
};

export const ANIMAL_COLOR = {
  qoyun: "#C9A876",
  qoc:   "#B08E5E",
  keci:  "#A99A78",
  dana:  "#B9906A",
  deve:  "#C7A876",
};

export const ACCENT = "#f97316";

export function getRegionGeometry(animalKey) {
  if (animalKey === "dana") return DANA_REGION_GEOMETRY;
  if (animalKey === "deve") return DEVE_REGION_GEOMETRY;
  return QUAD_REGION_GEOMETRY;
}
