import { useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Path, G, Rect, Ellipse, Text as SvgText } from "react-native-svg";

// Web-dəki components/meat/AnimalDiagram.js-in RN portu — geometriya (path
// data) eynidir, sadəcə "əl ilə çəkilmiş" fetTurbulence effekti və
// dekorativ ağ nöqtələr (mobil SVG-də əlavə mürəkkəblik/performans xərci
// üçün dəyərli deyil) buraxılıb — bölgə şəkilləri, rəqəmlər və klik/toxunma
// davranışı 1:1 portlanıb.

export const VIEWBOX = "0 0 480 300";
const LABEL_VERTICAL_OFFSET = -1.5;

const SHEEP_REGION_GEOMETRY = {
  bas:
    "M 94.0,0.8 L 98.5,3.3 L 106.0,3.3 L 112.9,10.2 L 115.9,10.7 L 120.4,8.2 L " +
    "123.4,10.7 L 129.4,10.7 L 141.6,20.9 L 131.6,43.4 L 107.0,73.0 L 84.5,89.5 L " +
    "70.6,96.4 L 63.6,95.9 L 59.6,90.0 L 55.6,90.5 L 49.2,94.9 L 44.7,94.9 L " +
    "37.7,91.9 L 28.5,80.7 L 27.5,70.3 L 40.9,52.8 L 55.9,37.9 L 53.9,33.9 L " +
    "54.4,29.9 L 47.9,24.9 L 48.9,20.9 L 65.6,4.7 L 70.6,5.2 L 80.5,2.3 L " +
    "86.0,3.3 L 88.0,1.3 L 94.0,0.8 Z",
  boyun:
    "M 143.3,24.7 L 147.8,26.2 L 153.5,31.9 L 158.8,42.6 L 164.8,39.6 L " +
    "168.0,42.9 L 158.0,78.2 L 142.6,106.2 L 133.1,119.1 L 109.9,143.3 L " +
    "98.0,152.7 L 93.8,147.5 L 93.3,143.0 L 73.8,118.1 L 73.3,110.6 L 69.3,105.7 " +
    "L 68.8,100.2 L 72.6,96.4 L 99.5,82.0 L 114.2,69.3 L 130.1,49.3 L 140.1,27.9 " +
    "L 143.3,24.7 Z",
  kurek:
    "M 172.2,41.1 L 180.7,42.1 L 189.7,46.6 L 193.2,45.1 L 199.6,46.6 L " +
    "204.6,45.6 L 207.9,48.8 L 202.4,69.8 L 197.9,97.2 L 197.4,116.1 L " +
    "199.4,138.0 L 196.2,141.3 L 187.2,141.8 L 185.7,140.3 L 136.9,133.3 L " +
    "131.6,129.6 L 130.6,126.6 L 141.6,111.6 L 159.5,78.2 L 167.5,53.8 L " +
    "168.5,45.4 L 172.2,41.1 Z",
  incik:
    "M 124.9,131.3 L 192.7,142.8 L 197.6,141.8 L 201.4,146.0 L 219.3,190.9 L " +
    "222.8,201.8 L 219.6,205.1 L 216.6,203.6 L 214.6,204.6 L 208.4,211.3 L " +
    "205.4,219.3 L 197.9,265.1 L 199.9,273.6 L 198.9,285.5 L 193.2,293.3 L " +
    "189.7,293.8 L 183.7,299.2 L 169.2,298.7 L 163.5,291.5 L 165.0,281.5 L " +
    "174.5,266.1 L 176.5,256.1 L 176.5,244.7 L 171.5,237.2 L 172.5,229.7 L " +
    "170.0,211.8 L 162.5,204.3 L 160.3,199.1 L 155.8,203.6 L 150.3,204.6 L " +
    "144.3,200.1 L 133.9,196.6 L 129.4,192.6 L 123.9,190.6 L 118.7,183.9 L " +
    "119.2,177.4 L 99.2,157.0 L 124.9,131.3 Z",
  qaburga:
    "M 263.4,39.6 L 267.4,40.6 L 272.6,45.9 L 267.7,66.8 L 264.2,92.7 L " +
    "263.7,120.1 L 266.2,142.5 L 261.4,146.8 L 249.5,146.8 L 203.6,142.3 L " +
    "200.4,139.0 L 199.9,135.1 L 198.9,98.2 L 202.4,75.8 L 210.4,46.4 L " +
    "214.6,42.1 L 221.6,44.1 L 224.1,42.6 L 231.5,44.1 L 235.0,42.6 L 240.0,43.6 " +
    "L 243.5,40.6 L 249.0,40.6 L 253.5,43.6 L 263.4,39.6 Z",
  dos:
    "M 207.6,144.3 L 254.0,147.3 L 257.7,151.0 L 263.7,194.8 L 263.2,198.3 L " +
    "257.9,204.1 L 251.0,206.1 L 248.0,204.6 L 240.0,205.6 L 235.5,203.1 L " +
    "232.5,205.6 L 228.5,206.1 L 225.3,202.8 L 203.9,148.5 L 207.6,144.3 Z",
  bel:
    "M 321.7,34.6 L 328.7,36.1 L 331.7,34.6 L 338.2,36.1 L 344.6,34.6 L " +
    "348.1,36.6 L 354.6,34.6 L 361.3,39.4 L 345.4,87.7 L 338.4,122.1 L " +
    "336.4,141.5 L 332.2,145.8 L 271.4,147.3 L 266.7,140.5 L 264.7,106.2 L " +
    "266.7,80.7 L 274.1,42.9 L 277.9,38.6 L 280.9,39.1 L 284.8,36.6 L 289.8,36.6 " +
    "L 293.3,38.6 L 298.3,36.6 L 305.8,38.1 L 311.3,37.1 L 313.2,35.1 L " +
    "318.2,37.1 L 321.7,34.6 Z",
  boyur:
    "M 326.7,146.3 L 331.2,146.3 L 335.9,152.0 L 335.9,196.8 L 332.7,200.1 L " +
    "321.7,202.6 L 315.7,207.1 L 309.3,205.1 L 304.8,207.1 L 298.8,205.1 L " +
    "295.3,206.6 L 288.8,205.1 L 282.9,206.6 L 275.9,202.1 L 269.9,202.1 L " +
    "265.7,198.3 L 260.2,164.0 L 260.2,154.0 L 264.9,147.8 L 311.8,148.3 L " +
    "326.7,146.3 Z",
  but:
    "M 366.6,35.6 L 373.5,42.1 L 379.5,40.6 L 387.0,43.6 L 391.7,48.3 L " +
    "422.6,157.0 L 419.1,162.0 L 416.1,173.4 L 410.7,179.9 L 409.7,185.9 L " +
    "402.2,192.4 L 401.2,196.3 L 400.2,203.3 L 405.2,209.3 L 407.7,215.8 L " +
    "407.7,227.7 L 405.7,238.2 L 400.2,246.2 L 396.7,265.1 L 398.2,285.5 L " +
    "392.5,292.8 L 381.5,293.3 L 376.5,297.7 L 362.6,297.2 L 356.4,291.5 L " +
    "357.8,279.1 L 362.8,271.6 L 368.8,257.1 L 367.8,227.2 L 357.1,222.0 L " +
    "336.9,202.8 L 335.9,188.9 L 336.9,143.0 L 341.9,109.1 L 356.4,56.3 L " +
    "362.8,39.4 L 366.6,35.6 Z",
  quyruq:
    "M 398.0,49.1 L 408.9,54.6 L 415.9,63.0 L 424.9,67.5 L 430.1,72.8 L " +
    "431.1,76.3 L 435.8,80.5 L 440.3,82.0 L 446.5,89.7 L 445.5,95.7 L 449.5,101.7 " +
    "L 449.0,113.1 L 452.5,118.6 L 452.0,123.6 L 437.8,139.8 L 426.4,141.8 L " +
    "422.9,145.3 L 419.6,142.0 L 415.2,127.6 L 394.2,52.8 L 398.0,49.1 Z",
};

const SHEEP_LABELS = [
  { t: "1", x: 121.9, y: 92.1, s: 38.8 },
  { t: "2", x: 174.6, y: 98.2, s: 41.5 },
  { t: "3", x: 166.7, y: 167.4, s: 42.2 },
  { t: "4", x: 236.2, y: 98.4, s: 40.8 },
  { t: "5", x: 305.2, y: 98.3, s: 42.2 },
  { t: "6", x: 239.5, y: 173.4, s: 42.2 },
  { t: "7", x: 300.5, y: 171.7, s: 41.5 },
  { t: "8", x: 374.5, y: 145.3, s: 42.9 },
  { t: "9", x: 427.8, y: 104.4, s: 31.1 },
];

// Fotodan köçürülmüş ağ nöqtəli sərhəd xətti (bölgələr arası) — hər "M x,y h 0"
// dairəvi bir nöqtədir, strokeLinecap="round" ilə "· · · ·" effekti yaranır.
const SHEEP_DOTS =
  "M 139.7,27.6 h 0 M 137.1,34.1 h 0 M 134.0,40.2 h 0 M 361.1,43.5 h 0 M " +
  "168.5,45.5 h 0 M 130.6,46.4 h 0 M 358.6,50.0 h 0 M 126.7,52.2 h 0 M " +
  "208.2,52.0 h 0 M 167.0,52.3 h 0 M 271.4,54.7 h 0 M 356.0,56.5 h 0 M " +
  "395.2,56.6 h 0 M 122.8,57.7 h 0 M 206.2,58.6 h 0 M 165.2,59.0 h 0 M " +
  "269.9,61.5 h 0 M 396.8,62.2 h 0 M 118.2,63.2 h 0 M 353.6,62.9 h 0 M " +
  "204.5,65.3 h 0 M 163.2,65.4 h 0 M 398.3,67.8 h 0 M 113.6,68.3 h 0 M " +
  "268.3,68.3 h 0 M 351.6,69.6 h 0 M 160.7,72.0 h 0 M 202.8,71.9 h 0 M " +
  "108.5,73.3 h 0 M 399.8,73.5 h 0 M 267.2,75.3 h 0 M 349.5,76.4 h 0 M " +
  "103.2,77.7 h 0 M 158.3,78.4 h 0 M 201.3,78.9 h 0 M 401.4,79.3 h 0 M " +
  "266.3,82.1 h 0 M 97.7,82.2 h 0 M 347.8,83.0 h 0 M 155.4,84.6 h 0 M " +
  "403.0,85.0 h 0 M 91.8,86.0 h 0 M 200.3,85.7 h 0 M 265.2,89.0 h 0 M " +
  "345.9,89.6 h 0 M 85.8,89.7 h 0 M 152.4,91.0 h 0 M 404.4,90.7 h 0 M " +
  "199.2,92.4 h 0 M 79.7,92.9 h 0 M 264.7,96.0 h 0 M 344.3,96.5 h 0 M " +
  "406.1,96.3 h 0 M 149.2,96.9 h 0 M 198.6,99.4 h 0 M 407.7,101.9 h 0 M " +
  "145.6,103.0 h 0 M 264.4,102.9 h 0 M 342.8,103.3 h 0 M 198.2,106.3 h 0 M " +
  "409.3,107.6 h 0 M 142.1,108.6 h 0 M 264.2,109.8 h 0 M 341.5,110.0 h 0 M " +
  "198.0,113.3 h 0 M 410.7,113.3 h 0 M 138.0,114.4 h 0 M 264.3,116.7 h 0 M " +
  "340.3,116.8 h 0 M 412.3,118.8 h 0 M 133.9,119.9 h 0 M 198.2,120.2 h 0 M " +
  "264.6,123.5 h 0 M 339.1,123.6 h 0 M 413.8,124.3 h 0 M 129.4,125.3 h 0 M " +
  "198.6,127.2 h 0 M 124.7,130.5 h 0 M 265.2,130.3 h 0 M 338.3,130.4 h 0 M " +
  "415.3,129.8 h 0 M 131.6,132.5 h 0 M 138.6,133.6 h 0 M 199.4,134.0 h 0 M " +
  "145.4,134.8 h 0 M 416.9,135.2 h 0 M 119.8,135.6 h 0 M 152.2,135.8 h 0 M " +
  "159.1,137.0 h 0 M 265.9,137.3 h 0 M 337.3,137.2 h 0 M 166.0,137.9 h 0 M " +
  "173.0,139.0 h 0 M 179.8,140.2 h 0 M 115.0,140.5 h 0 M 186.7,141.0 h 0 M " +
  "200.5,141.9 h 0 M 418.4,140.6 h 0 M 193.6,142.0 h 0 M 207.3,143.7 h 0 M " +
  "214.3,144.2 h 0 M 266.9,144.0 h 0 M 336.6,144.3 h 0 M 109.8,145.1 h 0 M " +
  "221.3,144.8 h 0 M 228.2,145.4 h 0 M 235.3,145.8 h 0 M 242.3,146.3 h 0 M " +
  "333.4,146.3 h 0 M 249.2,146.7 h 0 M 326.4,146.8 h 0 M 256.2,147.1 h 0 M " +
  "263.2,147.3 h 0 M 319.3,147.3 h 0 M 202.8,147.8 h 0 M 270.1,147.5 h 0 M " +
  "277.2,147.7 h 0 M 284.2,147.7 h 0 M 291.3,147.8 h 0 M 298.2,147.7 h 0 M " +
  "305.4,147.6 h 0 M 312.3,147.5 h 0 M 104.6,149.5 h 0 M 336.3,151.2 h 0 M " +
  "259.5,153.8 h 0 M 205.4,154.5 h 0 M 335.7,158.2 h 0 M 259.6,160.7 h 0 M " +
  "207.8,161.0 h 0 M 335.4,165.1 h 0 M 210.4,167.3 h 0 M 260.0,167.7 h 0 M " +
  "335.3,172.0 h 0 M 213.1,173.9 h 0 M 260.7,174.6 h 0 M 335.4,179.0 h 0 M " +
  "215.7,180.4 h 0 M 261.5,181.6 h 0 M 335.4,185.9 h 0 M 218.3,186.7 h 0 M " +
  "262.7,188.5 h 0 M 335.9,192.7 h 0 M 220.8,193.4 h 0 M 264.3,195.2 h 0";
const SHEEP_DOT_W = 2.92;

const DANA_DOTS =
  "M 135.3,51.5 h 0 M 192.5,54.2 h 0 M 132.1,56.8 h 0 M 354.2,57.6 h 0 M " +
  "259.1,58.7 h 0 M 298.4,59.2 h 0 M 194.9,60.2 h 0 M 128.6,62.2 h 0 M " +
  "354.2,64.0 h 0 M 260.1,65.1 h 0 M 299.4,65.6 h 0 M 197.1,66.3 h 0 M " +
  "125.3,67.6 h 0 M 348.1,70.8 h 0 M 354.3,70.5 h 0 M 261.0,71.5 h 0 M " +
  "341.4,71.2 h 0 M 327.0,71.4 h 0 M 334.9,71.4 h 0 M 300.2,72.1 h 0 M " +
  "313.9,72.3 h 0 M 320.4,71.9 h 0 M 199.2,72.5 h 0 M 307.4,72.6 h 0 M " +
  "121.9,73.1 h 0 M 311.5,76.7 h 0 M 354.7,77.1 h 0 M 261.6,77.9 h 0 M " +
  "118.4,78.6 h 0 M 201.4,78.6 h 0 M 311.8,83.2 h 0 M 355.1,83.6 h 0 M " +
  "115.1,84.0 h 0 M 203.3,84.9 h 0 M 262.4,84.5 h 0 M 111.8,89.2 h 0 M " +
  "312.3,89.6 h 0 M 355.6,90.0 h 0 M 263.1,90.8 h 0 M 205.4,91.1 h 0 M " +
  "108.4,94.5 h 0 M 312.6,96.1 h 0 M 356.2,96.5 h 0 M 263.6,97.2 h 0 M " +
  "206.9,97.5 h 0 M 105.0,100.0 h 0 M 313.0,102.6 h 0 M 357.1,102.9 h 0 M " +
  "208.5,103.5 h 0 M 263.7,103.8 h 0 M 101.6,105.5 h 0 M 313.5,109.1 h 0 M " +
  "358.0,109.3 h 0 M 209.9,110.0 h 0 M 264.1,110.3 h 0 M 314.0,115.5 h 0 M " +
  "359.1,115.6 h 0 M 211.4,116.4 h 0 M 264.1,116.8 h 0 M 314.8,122.0 h 0 M " +
  "360.2,122.0 h 0 M 212.5,122.6 h 0 M 264.1,123.3 h 0 M 119.6,128.3 h 0 M " +
  "315.4,128.5 h 0 M 361.5,128.4 h 0 M 126.1,129.0 h 0 M 213.8,129.1 h 0 M " +
  "355.1,128.9 h 0 M 348.3,129.4 h 0 M 132.7,129.8 h 0 M 264.0,129.9 h 0 M " +
  "139.1,130.5 h 0 M 341.8,130.2 h 0 M 145.6,131.1 h 0 M 335.3,130.8 h 0 M " +
  "152.1,131.7 h 0 M 328.7,131.3 h 0 M 322.2,131.9 h 0 M 158.6,132.2 h 0 M " +
  "315.9,133.6 h 0 M 165.1,132.8 h 0 M 309.2,132.9 h 0 M 171.6,133.2 h 0 M " +
  "178.1,133.5 h 0 M 302.5,133.3 h 0 M 184.6,133.9 h 0 M 289.5,134.1 h 0 M " +
  "296.0,133.8 h 0 M 191.2,134.4 h 0 M 283.1,134.5 h 0 M 197.7,134.7 h 0 M " +
  "204.2,134.9 h 0 M 270.0,135.0 h 0 M 276.4,134.8 h 0 M 362.9,134.8 h 0 M " +
  "210.9,135.3 h 0 M 216.1,135.4 h 0 M 224.2,135.3 h 0 M 230.7,135.3 h 0 M " +
  "237.2,135.3 h 0 M 243.7,135.4 h 0 M 250.2,135.4 h 0 M 256.8,135.3 h 0 M " +
  "263.4,135.3 h 0 M 169.0,137.8 h 0 M 364.3,141.1 h 0 M 317.0,141.5 h 0 M " +
  "215.5,142.0 h 0 M 169.6,144.2 h 0 M 366.1,147.3 h 0 M 317.9,147.8 h 0 M " +
  "216.4,148.4 h 0 M 170.1,150.7 h 0 M 368.0,153.5 h 0 M 318.9,154.2 h 0 M " +
  "216.9,154.8 h 0 M 170.1,157.2 h 0 M 369.9,159.6 h 0 M 320.1,160.7 h 0 M " +
  "217.4,161.2 h 0 M 169.6,163.7 h 0 M 446.2,164.1 h 0 M 439.9,165.4 h 0 M " +
  "372.0,165.7 h 0 M 321.2,167.2 h 0 M 433.8,167.2 h 0 M 217.9,167.7 h 0 M " +
  "427.5,169.6 h 0 M 169.0,170.1 h 0 M 374.1,171.9 h 0 M 421.7,172.5 h 0 M " +
  "322.3,173.4 h 0 M 218.3,174.2 h 0 M 416.1,175.9 h 0 M 168.1,176.6 h 0 M " +
  "376.5,178.0 h 0 M 323.5,179.8 h 0 M 410.9,180.1 h 0 M 218.4,180.7 h 0 M " +
  "166.6,182.9 h 0 M 378.7,184.1 h 0 M 406.2,184.4 h 0 M 324.8,186.1 h 0 M " +
  "199.7,187.1 h 0 M 206.3,187.1 h 0 M 212.9,187.3 h 0 M 193.1,188.1 h 0 M " +
  "164.9,189.1 h 0 M 401.9,189.1 h 0 M 186.9,189.5 h 0 M 381.3,190.0 h 0 M " +
  "180.7,191.7 h 0 M 174.6,194.5 h 0 M 398.2,194.7 h 0 M 163.0,195.3 h 0 M " +
  "383.9,196.0 h 0 M 169.1,197.9 h 0 M 394.9,200.1 h 0 M 386.5,202.0 h 0 M " +
  "390.7,206.9 h 0 M 170.0,226.5 h 0 M 176.5,227.3 h 0 M 182.9,227.7 h 0 M " +
  "205.7,229.8 h 0 M 212.2,230.3 h 0 M 395.5,231.4 h 0 M 402.0,231.9 h 0 M " +
  "408.4,232.8 h 0 M 441.2,235.9 h 0 M 447.6,236.7 h 0";
const DANA_DOT_W = 2.63;

export const REGION_DOTS = { qoyun: SHEEP_DOTS, qoc: SHEEP_DOTS, dana: DANA_DOTS };
export const REGION_DOT_W = { qoyun: SHEEP_DOT_W, qoc: SHEEP_DOT_W, dana: DANA_DOT_W };

const SHEEP_OUTLINE =
  "M 94.0,3.8 L 96.5,4.2 L 98.0,6.2 L 104.5,5.7 L 107.0,6.7 L 109.2,9.0 L " +
  "110.4,13.2 L 116.4,13.7 L 117.9,11.7 L 120.4,11.2 L 122.9,13.7 L 130.4,14.2 " +
  "L 131.6,16.0 L 131.4,18.7 L 136.4,19.2 L 138.8,21.7 L 141.8,22.2 L " +
  "143.6,25.4 L 143.1,27.4 L 146.3,28.2 L 150.6,31.9 L 156.0,43.9 L 157.8,45.6 " +
  "L 159.8,45.6 L 163.8,42.6 L 167.7,42.1 L 172.2,44.1 L 185.2,46.6 L " +
  "189.7,49.6 L 193.2,48.1 L 203.1,49.6 L 206.1,47.6 L 211.1,47.1 L 214.6,45.1 " +
  "L 219.6,45.6 L 221.6,47.1 L 224.1,45.6 L 228.5,45.6 L 231.5,47.1 L " +
  "235.0,45.6 L 240.0,46.6 L 243.5,43.6 L 249.0,43.6 L 253.5,46.6 L 257.9,45.6 " +
  "L 259.9,43.6 L 263.4,42.6 L 267.4,43.6 L 272.4,49.6 L 273.9,49.6 L " +
  "275.1,48.3 L 274.6,46.9 L 271.1,46.4 L 273.4,43.6 L 277.9,41.6 L 280.9,42.1 " +
  "L 284.8,39.6 L 289.8,39.6 L 293.8,41.6 L 298.3,39.6 L 305.8,41.1 L " +
  "307.3,40.1 L 311.3,40.1 L 313.2,38.1 L 315.7,38.1 L 318.2,40.1 L 321.7,37.6 " +
  "L 326.7,37.6 L 328.7,39.1 L 331.7,37.6 L 336.2,37.6 L 338.2,39.1 L " +
  "344.6,37.6 L 348.1,39.6 L 353.1,37.6 L 357.6,39.1 L 360.6,38.1 L 366.6,38.6 " +
  "L 373.5,45.1 L 376.0,43.6 L 379.5,43.6 L 388.5,48.1 L 392.0,48.6 L " +
  "393.2,49.8 L 392.2,51.3 L 393.5,52.6 L 395.0,51.6 L 396.5,53.1 L 399.0,52.1 " +
  "L 407.4,56.6 L 411.7,60.3 L 413.4,64.5 L 419.9,67.0 L 424.9,70.5 L " +
  "428.1,74.8 L 427.6,76.8 L 431.8,79.5 L 434.8,83.5 L 440.3,85.0 L 443.6,89.7 " +
  "L 442.6,95.7 L 446.5,101.7 L 445.5,106.2 L 446.5,109.6 L 446.0,113.1 L " +
  "449.0,117.1 L 449.5,121.6 L 448.5,124.6 L 443.8,129.8 L 441.6,130.6 L " +
  "441.1,133.6 L 437.8,136.8 L 426.4,138.8 L 422.1,136.5 L 423.1,144.0 L " +
  "421.9,145.3 L 418.6,145.5 L 419.4,147.3 L 421.4,146.3 L 422.1,148.0 L " +
  "419.1,151.5 L 419.6,157.0 L 416.1,162.0 L 414.2,171.4 L 407.7,179.9 L " +
  "406.7,185.9 L 399.2,191.9 L 397.2,203.3 L 401.2,207.8 L 404.2,213.8 L " +
  "404.7,227.7 L 402.7,238.2 L 397.2,246.2 L 393.7,265.1 L 393.7,270.1 L " +
  "395.2,275.6 L 395.2,285.5 L 394.2,288.0 L 391.5,290.3 L 380.5,290.3 L " +
  "376.5,294.8 L 365.6,294.8 L 361.1,293.8 L 359.8,292.5 L 358.8,287.0 L " +
  "360.8,279.1 L 365.8,271.6 L 371.8,257.1 L 370.8,224.7 L 366.1,223.5 L " +
  "362.6,220.5 L 357.1,219.0 L 355.4,217.3 L 353.9,212.8 L 347.6,210.0 L " +
  "344.1,204.1 L 341.2,203.6 L 337.9,201.3 L 337.7,198.6 L 334.2,197.1 L " +
  "330.7,197.1 L 326.2,199.6 L 321.2,199.6 L 318.2,203.1 L 315.7,204.1 L " +
  "312.8,204.1 L 309.3,202.1 L 303.3,204.1 L 298.8,202.1 L 295.3,203.6 L " +
  "291.8,203.6 L 288.8,202.1 L 282.9,203.6 L 278.9,202.1 L 275.9,199.1 L " +
  "264.4,199.1 L 260.9,197.1 L 257.9,201.1 L 253.0,203.1 L 248.0,201.6 L " +
  "240.0,202.6 L 236.0,200.1 L 232.5,202.6 L 227.5,203.1 L 224.3,201.3 L " +
  "224.8,198.8 L 223.1,198.1 L 221.8,199.3 L 222.8,201.3 L 222.1,202.1 L " +
  "218.6,202.1 L 216.6,200.6 L 211.3,202.8 L 210.4,206.3 L 205.9,210.3 L " +
  "204.4,216.8 L 202.4,219.3 L 194.9,265.1 L 196.9,273.6 L 196.9,279.1 L " +
  "194.4,289.0 L 192.2,290.8 L 188.2,290.8 L 186.4,292.5 L 186.4,294.0 L " +
  "183.7,296.2 L 168.2,295.3 L 166.5,291.5 L 167.5,283.0 L 170.5,276.6 L " +
  "177.5,266.1 L 179.5,256.1 L 179.5,243.7 L 176.0,241.2 L 174.5,237.2 L " +
  "175.5,229.7 L 174.5,215.8 L 173.0,211.8 L 169.5,208.3 L 169.0,206.3 L " +
  "165.5,204.3 L 162.8,197.1 L 159.8,196.1 L 155.8,200.6 L 150.3,201.6 L " +
  "144.3,197.1 L 133.9,193.6 L 129.4,189.6 L 127.4,189.6 L 123.2,186.9 L " +
  "121.7,183.9 L 122.7,176.4 L 119.9,175.2 L 116.4,170.2 L 113.4,169.2 L " +
  "110.7,166.4 L 109.4,163.2 L 103.7,160.0 L 102.2,157.0 L 102.2,153.0 L " +
  "100.5,152.2 L 96.7,147.5 L 96.7,142.0 L 90.3,137.0 L 88.3,131.1 L 83.8,128.1 " +
  "L 76.8,118.1 L 75.8,115.6 L 76.3,110.6 L 71.8,104.2 L 72.3,98.7 L 74.8,96.2 " +
  "L 74.1,94.4 L 63.6,92.9 L 62.1,87.0 L 55.6,87.5 L 49.2,91.9 L 44.7,91.9 L " +
  "37.7,89.0 L 35.9,86.7 L 35.9,84.7 L 33.7,84.0 L 31.5,80.7 L 30.5,74.8 L " +
  "31.5,67.8 L 43.9,52.8 L 58.9,37.9 L 56.9,33.9 L 58.4,27.4 L 52.1,26.2 L " +
  "50.9,24.9 L 51.9,20.9 L 55.6,18.7 L 58.1,15.2 L 62.1,13.2 L 62.4,10.5 L " +
  "65.6,7.7 L 70.6,8.2 L 80.5,5.2 L 84.5,5.2 L 86.0,6.2 L 88.0,4.2 L 92.0,4.7 L " +
  "94.0,3.8 Z";

const SHEEP_HOOF_PATHS = [
  "M 362.6,277.3 L 364.1,278.3 L 394.0,277.8 L 395.2,279.1 L 394.7,286.5 L " +
    "392.5,289.8 L 380.0,290.3 L 376.0,294.8 L 361.6,293.8 L 359.3,291.0 L " +
    "359.3,284.5 L 362.6,277.3 Z",
  "M 195.2,278.8 L 196.4,282.0 L 194.4,288.5 L 192.7,290.3 L 187.7,290.8 L " +
    "184.2,295.8 L 172.2,295.8 L 167.5,294.0 L 167.5,284.0 L 170.2,279.3 L " +
    "194.2,279.8 L 195.2,278.8 Z",
];

const RAM_HORN =
  "M 86,37 C 99,41 104,54 96,64 C 89,73 75,72 69,63 " +
  "C 64,56 67,46 75,44 C 81,42 86,46 86,51";

const HOOF = "#2F0311";

function SheepShape({ color, withHorn }) {
  return (
    <G>
      <Path d={SHEEP_OUTLINE} fill={color} />
      <G fill={HOOF}>
        {SHEEP_HOOF_PATHS.map((d, i) => (
          <Path key={i} d={d} />
        ))}
      </G>
      {withHorn && (
        <Path
          d={RAM_HORN}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </G>
  );
}

const DANA_REGION_GEOMETRY = {
  bas:
    "M 56.2,0.8 L 79.6,15.7 L 85.8,13.0 L 84.3,7.5 L 88.5,3.3 L 90.0,3.8 L " +
    "99.0,14.2 L 109.2,20.9 L 109.7,29.9 L 115.4,35.6 L 134.8,42.1 L 138.0,45.3 L " +
    "99.7,107.0 L 93.0,113.7 L 81.1,114.2 L 71.1,110.2 L 61.2,110.7 L 52.2,107.7 " +
    "L 48.2,110.7 L 41.3,111.7 L 27.8,106.2 L 20.6,96.0 L 22.1,85.6 L 28.3,79.4 L " +
    "33.3,78.4 L 46.5,63.2 L 52.5,55.2 L 52.0,49.3 L 53.5,45.8 L 68.4,30.9 L " +
    "68.9,23.4 L 63.2,19.7 L 53.0,7.5 L 52.5,4.5 L 56.2,0.8 Z",
  boyun:
    "M 141.8,44.0 L 186.0,44.5 L 189.8,48.3 L 201.7,80.6 L 210.2,111.9 L " +
    "213.1,128.9 L 208.4,134.6 L 139.8,130.6 L 109.9,126.6 L 107.4,126.1 L " +
    "97.7,114.9 L 124.6,69.2 L 141.8,44.0 Z",
  kurek:
    "M 173.6,133.6 L 208.9,135.6 L 215.1,142.8 L 218.1,178.6 L 210.9,186.8 L " +
    "199.0,186.3 L 185.5,188.8 L 168.1,196.8 L 164.4,193.0 L 170.4,165.7 L " +
    "170.9,148.8 L 169.4,138.3 L 173.6,133.6 Z",
  dos:
    "M 113.9,127.6 L 162.6,132.6 L 168.4,138.8 L 169.4,164.7 L 162.9,192.0 L " +
    "165.4,198.5 L 158.7,204.2 L 146.7,198.7 L 130.1,180.6 L 129.1,169.2 L " +
    "120.6,153.7 L 116.1,138.3 L 110.7,130.8 L 113.9,127.6 Z",
  on_incik:
    "M 216.9,184.8 L 221.1,189.0 L 220.6,204.5 L 223.6,221.4 L 223.1,227.4 L " +
    "219.9,230.6 L 196.5,228.1 L 192.0,223.1 L 188.0,227.6 L 183.5,227.6 L " +
    "170.6,226.6 L 163.9,222.4 L 163.9,205.0 L 156.9,199.5 L 160.2,195.8 L " +
    "170.6,197.3 L 188.0,189.3 L 197.0,187.3 L 211.4,187.8 L 216.9,184.8 Z",
  qaburga:
    "M 303.4,133.1 L 312.9,133.1 L " +
    "316.1,136.3 L 320.6,168.7 L 325.6,190.5 L 322.3,194.8 L 305.4,196.8 L " +
    "266.1,191.8 L 239.8,189.8 L 220.4,190.3 L 215.6,185.6 L 218.1,182.6 L " +
    "216.6,181.1 L 219.1,178.6 L 216.1,138.8 L 219.4,135.6 L 256.7,136.1 L " +
    "303.4,133.1 Z",
  qarin_alti:
    "M 194.0,44.5 L 208.4,45.0 L 235.8,49.5 L 253.7,49.5 L 256.9,52.7 L " +
    "261.9,81.6 L 263.4,127.4 L 255.7,134.6 L 218.9,135.1 L 215.6,131.8 L " +
    "202.2,77.1 L 190.8,47.8 L 194.0,44.5 Z",
  bel:
    "M 261.6,49.5 L 271.1,50.0 L 278.6,53.0 L 293.5,51.5 L 297.2,55.2 L " +
    "299.2,70.2 L 301.9,72.9 L 305.9,72.9 L 311.1,78.1 L 314.6,126.9 L " +
    "308.4,132.1 L 271.1,134.6 L 264.4,128.4 L 262.9,81.1 L 258.4,55.7 L " +
    "258.4,52.7 L 261.6,49.5 Z",
  boyur:
    "M 355.7,128.6 L 358.1,128.6 L 361.9,132.8 L 375.8,179.6 L 382.8,196.5 L " +
    "390.2,208.0 L 390.7,215.9 L 387.5,219.1 L 384.0,218.6 L 379.8,214.4 L " +
    "379.0,207.7 L 378.8,209.9 L 373.6,215.2 L 368.1,214.7 L 363.9,210.4 L " +
    "364.9,202.0 L 362.4,196.5 L 348.7,186.3 L 330.3,191.8 L 326.1,188.6 L " +
    "317.1,135.8 L 320.3,132.6 L 325.8,131.1 L 355.7,128.6 Z",
  sagri:
    "M 342.2,70.9 L 346.2,70.9 L 354.4,78.6 L 359.4,121.4 L 352.7,128.6 L " +
    "320.8,131.1 L 316.1,126.9 L 315.1,122.9 L 312.1,77.1 L 316.4,72.4 L " +
    "342.2,70.9 Z",
  arxa_incik:
    "M 449.7,163.4 L 454.9,166.7 L 459.4,198.5 L 454.9,218.9 L 453.9,233.3 L " +
    "450.7,236.6 L 431.8,234.1 L 428.0,230.3 L 422.3,212.2 L 416.1,228.3 L " +
    "412.4,232.6 L 396.4,231.6 L 392.7,227.4 L 391.2,207.0 L 402.7,189.5 L " +
    "410.9,180.8 L 424.3,170.9 L 449.7,163.4 Z",
  but:
    "M 386.0,39.6 L 421.3,40.1 L 432.8,43.0 L 441.7,48.0 L 449.9,55.7 L " +
    "454.9,64.2 L 456.9,72.1 L 452.9,116.4 L 454.4,159.2 L 450.2,162.9 L " +
    "438.7,164.4 L 418.8,172.4 L 405.9,182.3 L 396.2,196.0 L 389.5,200.7 L " +
    "384.8,197.0 L 376.3,177.1 L 363.4,135.3 L 355.4,86.6 L 354.4,56.7 L " +
    "354.4,50.3 L 357.6,47.0 L 386.0,39.6 Z",
  quyruq:
    "M 349.2,48.5 L 353.4,51.8 L 353.9,62.2 L 346.2,70.4 L 333.8,70.9 L " +
    "329.3,67.4 L 325.8,70.9 L 322.3,69.9 L 319.3,71.9 L 303.4,72.4 L 300.2,69.2 " +
    "L 297.7,54.2 L 300.9,51.0 L 336.3,51.5 L 349.2,48.5 Z",
};

const DANA_OUTLINE =
  "M 56.2,3.8 L 69.1,13.2 L 79.6,18.7 L 85.5,16.2 L 89.8,15.9 L 87.3,10.0 L " +
  "87.3,7.5 L 88.5,6.2 L 90.0,6.7 L 95.0,13.7 L 100.5,18.2 L 106.2,20.9 L " +
  "106.7,29.9 L 107.7,31.9 L 115.4,38.6 L 120.4,41.1 L 136.3,45.5 L 137.8,47.5 " +
  "L 140.3,46.5 L 148.7,48.0 L 187.5,47.5 L 190.0,50.0 L 192.5,47.5 L " +
  "202.4,47.5 L 235.8,52.5 L 256.2,52.5 L 257.7,54.0 L 260.1,52.5 L 268.6,52.5 " +
  "L 278.6,56.0 L 283.0,56.0 L 298.4,54.0 L 336.3,54.5 L 351.2,51.0 L " +
  "355.2,52.5 L 356.7,50.0 L 368.6,48.0 L 386.0,42.6 L 411.4,42.6 L 428.8,44.5 " +
  "L 441.7,51.0 L 449.4,59.2 L 451.9,64.2 L 453.9,72.1 L 453.9,83.6 L " +
  "450.4,105.0 L 449.9,135.3 L 452.4,177.1 L 456.4,198.5 L 455.9,205.5 L " +
  "451.9,218.9 L 449.9,240.3 L 448.4,271.6 L 450.9,278.1 L 448.7,279.3 L " +
  "446.2,276.4 L 443.5,277.1 L 442.5,279.1 L 442.5,285.1 L 444.0,289.0 L " +
  "442.5,293.0 L 439.2,295.8 L 434.3,296.2 L 420.3,296.2 L 417.6,295.0 L " +
  "417.6,293.5 L 423.6,286.5 L 427.0,278.6 L 429.0,268.6 L 432.0,236.3 L " +
  "432.8,235.6 L 434.7,237.1 L 436.5,235.3 L 434.7,233.6 L 432.8,235.1 L " +
  "431.5,233.8 L 430.5,226.9 L 426.0,212.9 L 422.8,208.2 L 419.6,211.4 L " +
  "415.1,221.4 L 406.6,248.2 L 398.2,266.2 L 398.2,273.1 L 395.5,275.4 L " +
  "392.5,274.4 L 391.2,275.1 L 390.7,282.1 L 384.0,288.3 L 372.6,289.3 L " +
  "361.1,287.3 L 359.9,286.1 L 362.1,282.8 L 368.3,279.1 L 370.3,274.6 L " +
  "378.3,266.7 L 380.8,262.2 L 391.2,237.3 L 391.7,214.9 L 390.5,210.2 L " +
  "388.2,212.4 L 389.7,213.9 L 389.0,216.2 L 386.5,215.2 L 384.0,215.7 L " +
  "382.8,214.4 L 382.3,206.5 L 380.5,201.2 L 376.3,205.5 L 375.8,209.9 L " +
  "373.6,212.2 L 370.6,211.2 L 368.1,211.7 L 366.8,210.4 L 367.8,202.0 L " +
  "365.4,196.5 L 348.7,183.3 L 339.7,186.8 L 330.8,188.3 L 322.3,191.8 L " +
  "311.4,193.8 L 301.4,193.3 L 288.5,190.8 L 239.8,186.8 L 220.4,187.3 L " +
  "217.9,185.8 L 217.1,186.6 L 218.1,189.0 L 217.6,204.5 L 220.6,223.9 L " +
  "220.1,227.9 L 217.1,231.3 L 218.6,232.8 L 218.1,241.3 L 220.6,261.7 L " +
  "224.1,271.6 L 224.1,275.6 L 222.8,276.8 L 220.1,276.1 L 220.6,288.0 L " +
  "216.4,292.8 L 212.9,293.8 L 199.5,294.8 L 190.3,293.0 L 191.3,287.5 L " +
  "197.7,281.1 L 203.2,272.1 L 203.7,264.7 L 203.2,242.3 L 199.7,237.3 L " +
  "197.7,231.8 L 200.7,229.8 L 200.7,228.3 L 196.7,227.4 L 192.0,210.7 L " +
  "190.8,212.9 L 189.8,221.9 L 187.3,228.3 L 184.8,243.3 L 184.3,276.1 L " +
  "182.5,277.3 L 180.1,277.3 L 178.1,275.4 L 177.3,282.6 L 172.1,286.8 L " +
  "157.7,287.3 L 152.2,286.3 L 151.5,283.6 L 152.4,282.1 L 165.9,266.7 L " +
  "170.9,244.8 L 170.9,236.8 L 167.9,230.8 L 167.9,226.9 L 166.9,225.9 L " +
  "166.9,205.0 L 164.9,203.0 L 165.4,201.5 L 161.2,199.7 L 157.7,201.2 L " +
  "151.2,198.7 L 142.5,191.5 L 139.5,187.6 L 137.0,181.1 L 134.3,181.8 L " +
  "133.0,180.6 L 133.0,172.1 L 132.1,169.2 L 123.6,153.7 L 119.1,138.3 L " +
  "112.7,129.9 L 114.6,126.9 L 113.9,126.1 L 111.9,126.1 L 110.9,127.6 L " +
  "110.2,126.9 L 99.2,112.9 L 99.7,110.5 L 98.5,109.2 L 95.0,109.2 L 93.0,110.7 " +
  "L 87.0,111.7 L 81.1,111.2 L 71.1,107.2 L 61.2,107.7 L 52.2,104.7 L " +
  "48.2,107.7 L 41.3,108.7 L 34.3,105.2 L 29.3,104.2 L 26.6,102.0 L 24.1,97.5 L " +
  "23.6,89.1 L 25.1,85.6 L 28.3,82.3 L 34.3,80.9 L 44.0,69.7 L 54.5,57.2 L " +
  "55.4,55.2 L 55.0,49.3 L 56.4,45.8 L 71.4,31.4 L 71.4,21.9 L 59.9,13.5 L " +
  "55.9,7.5 L 56.2,3.8 Z";

const DANA_LABELS = [
  { t: "1", x: 86.3, y: 63.2, s: 35.9 },
  { t: "2", x: 161.7, y: 93.4, s: 36.6 },
  { t: "3", x: 149.6, y: 157.4, s: 36.6 },
  { t: "4", x: 194.1, y: 160.1, s: 36.6 },
  { t: "5", x: 235.4, y: 93.8, s: 36.6 },
  { t: "6", x: 267.0, y: 161.6, s: 38.0 },
  { t: "7", x: 288.0, y: 94.3, s: 35.9 },
  { t: "8", x: 335.0, y: 100.4, s: 37.3 },
  { t: "9", x: 343.5, y: 155.9, s: 37.3 },
  { t: "10", x: 404.0, y: 106.7, s: 37.3 },
  { t: "11", x: 431.4, y: 190.6, s: 29.0 },
  { t: "12", x: 327.1, y: 62.4, s: 13.8 },
  { t: "13", x: 201.8, y: 200.3, s: 16.6 },
];

const DEVE_REGION_GEOMETRY = {
  bas: "M 0,0 L 90,0 L 90,285 L 0,285 Z",
  boyun: "M 90,0 L 125,0 L 125,285 L 90,285 Z",
  kurek: "M 125,0 L 155,0 L 155,285 L 125,285 Z",
  dos: "M 125,0 L 155,0 L 155,285 L 125,285 Z",
  on_incik: "M 155,0 L 210,0 L 210,285 L 155,285 Z",
  horguc: "M 210,0 L 240,0 L 240,285 L 210,285 Z",
  qaburga: "M 240,0 L 260,0 L 260,285 L 240,285 Z",
  bel: "M 260,0 L 280,0 L 280,285 L 260,285 Z",
  boyur: "M 260,0 L 280,0 L 280,285 L 260,285 Z",
  arxa_incik: "M 280,0 L 330,0 L 330,285 L 280,285 Z",
  but: "M 330,0 L 360,0 L 360,285 L 330,285 Z",
  quyruq: "M 360,0 L 380,0 L 380,285 L 360,285 Z",
};

const QUAD_REGION_GEOMETRY = {
  bas: "M 0,0 L 85,0 L 85,285 L 0,285 Z",
  boyun: "M 85,0 L 115,0 L 115,285 L 85,285 Z",
  kurek: "M 115,0 L 160,0 L 160,285 L 115,285 Z",
  dos: "M 115,0 L 160,0 L 160,285 L 115,285 Z",
  qaburga: "M 160,0 L 205,0 L 205,285 L 160,285 Z",
  bel: "M 205,0 L 250,0 L 250,285 L 205,285 Z",
  boyur: "M 205,0 L 250,0 L 250,285 L 205,285 Z",
  but: "M 250,0 L 295,0 L 295,285 L 250,285 Z",
  incik: "M 250,0 L 295,0 L 295,285 L 250,285 Z",
  quyruq: "M 295,0 L 380,0 L 380,285 L 295,285 Z",
};

export const ANIMAL_COLOR = "#550C22";
export const ACCENT = "#4B0F0F";
export const SELECTED_FILL = "#B01818";
export const FOOD_EXCLUDED_FILL = "#8b6b6c";
export const FOOD_EXCLUDED_STROKE = "#6b5253";
const GRAY = "#a8a29e";
const GRAY_STROKE = "#78716c";

export const REGION_LABELS = {
  qoyun: SHEEP_LABELS,
  qoc: SHEEP_LABELS,
  dana: DANA_LABELS,
};

export const PART_DISPLAY = {
  qoyun: {
    order: [
      "boyun",
      "kurek",
      "incik",
      "qaburga",
      "bel",
      "dos",
      "boyur",
      "but",
      "quyruq",
    ],
    hidden: ["bas"],
    badges: {
      boyun: "1",
      kurek: "2",
      incik: "3",
      qaburga: "4",
      bel: "5",
      dos: "6",
      boyur: "7",
      but: "8",
      quyruq: "9",
    },
  },
  qoc: {
    order: [
      "boyun",
      "kurek",
      "incik",
      "qaburga",
      "bel",
      "dos",
      "boyur",
      "but",
      "quyruq",
    ],
    hidden: ["bas"],
    badges: {
      boyun: "1",
      kurek: "2",
      incik: "3",
      qaburga: "4",
      bel: "5",
      dos: "6",
      boyur: "7",
      but: "8",
      quyruq: "9",
    },
  },
  dana: {
    order: [
      "bas",
      "boyun",
      "dos",
      "kurek",
      "qarin_alti",
      "qaburga",
      "bel",
      "sagri",
      "boyur",
      "but",
      "arxa_incik",
      "quyruq",
      "on_incik",
    ],
    badges: {
      bas: "1",
      boyun: "2",
      dos: "3",
      kurek: "4",
      qarin_alti: "5",
      qaburga: "6",
      bel: "7",
      sagri: "8",
      boyur: "9",
      but: "10",
      arxa_incik: "11",
      quyruq: "12",
      on_incik: "13",
    },
    names: {
      bas: "Baş",
      boyun: "Boyun",
      dos: "Döş",
      kurek: "Qol",
      qarin_alti: "Qol altı",
      qaburga: "Döş",
      bel: "Antrikot",
      sagri: "Bel",
      boyur: "Qarın",
      but: "Bud",
      arxa_incik: "Maça",
      quyruq: "Can əti",
      on_incik: "Maça",
    },
  },
};

export function getDisplayParts(animalKey, parts) {
  const config = PART_DISPLAY[animalKey];
  if (!config) {
    return (parts || []).map((part, index) => ({
      ...part,
      displayBadge: String(index + 1),
      displayName: part.nameAz,
    }));
  }
  const rank = new Map(config.order.map((key, index) => [key, index]));
  const hidden = new Set(config.hidden || []);
  return [...(parts || [])]
    .filter((part) => !hidden.has(part.key))
    .sort((l, r) => (rank.get(l.key) ?? 999) - (rank.get(r.key) ?? 999))
    .map((part, index) => ({
      ...part,
      displayBadge: config.badges[part.key] ?? String(index + 1),
      displayName: config.names?.[part.key] ?? part.nameAz,
    }));
}

export function getFirstDisplayPartKey(animalKey, parts) {
  return getDisplayParts(animalKey, parts || [])[0]?.key || null;
}

export function getRegionGeometry(animalKey) {
  if (animalKey === "qoyun" || animalKey === "qoc")
    return SHEEP_REGION_GEOMETRY;
  if (animalKey === "dana") return DANA_REGION_GEOMETRY;
  if (animalKey === "deve") return DEVE_REGION_GEOMETRY;
  return QUAD_REGION_GEOMETRY;
}

// Bölgə seçimi üçün əl ilə (JS-də) "toxunma nöqtəsi hansı bölgənin
// içindədir" testi — react-native-svg-nin hər <Path> üzərində ayrıca
// onPress/onPressIn-i ScrollView-un öz sürüşmə jestini tanıma prosesi ilə
// "yarışırdı" və bu, seçimi gecikdirib "sürüşmə" hissi yaradırdı. Bunun
// əvəzinə toxunmanı bir dəfə, diaqramı əhatə edən View-un özündə
// (ScrollView-dan ƏVVƏL, "responder"-i dərhal ələ keçirərək) tuturuq və
// hansı bölgəyə düşdüyünü öz hesabladığımız çoxbucaqlılarla tapırıq —
// bütün region path-ları yalnız "M x,y L x,y ... Z" (düz xətt) istifadə
// etdiyi üçün bu tam dəqiqdir.
function parsePolygon(d) {
  const nums = d.match(/-?\d+(?:\.\d+)?/g);
  if (!nums) return [];
  const pts = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    pts.push({ x: parseFloat(nums[i]), y: parseFloat(nums[i + 1]) });
  }
  return pts;
}

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;
    const intersects =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

const cutInStock = (c) => c.soldByWeight === false || (c.stockKg ?? 0) > 0;
export function partHasAnyStock(part) {
  return (part?.cuts || []).some(cutInStock);
}
function cutMatchesFoodFilter(cut, foodFilterIds) {
  if (!foodFilterIds || foodFilterIds.length === 0) return true;
  return (cut.suitableFoods || []).some((id) =>
    foodFilterIds.includes(String(id?._id || id)),
  );
}
export function partMatchesFoodFilter(part, foodFilterIds) {
  if (!foodFilterIds || foodFilterIds.length === 0) return true;
  return (part?.cuts || []).some(
    (c) => cutInStock(c) && cutMatchesFoodFilter(c, foodFilterIds),
  );
}

export function BodyShape({ animalKey, color }) {
  if (animalKey === "qoyun")
    return <SheepShape color={color} withHorn={false} />;
  if (animalKey === "qoc") return <SheepShape color={color} withHorn />;
  if (animalKey === "dana") return <Path d={DANA_OUTLINE} fill={color} />;
  if (animalKey === "keci") {
    return (
      <G fill={color}>
        <Rect x={290} y={85} width={14} height={171} rx={6} />
        <Rect x={188} y={85} width={14} height={171} rx={6} />
        <Rect x={260} y={85} width={14} height={173} rx={6} />
        <Rect x={158} y={85} width={14} height={173} rx={6} />
        <Path d="M 46,138 C 40,126 42,112 52,104 C 58,92 70,82 84,80 C 92,74 102,76 106,84 C 108,92 104,100 96,102 C 116,92 140,88 164,92 C 190,86 220,86 246,92 C 266,88 288,96 296,114 C 302,124 300,136 292,144 C 296,154 292,166 280,170 C 270,178 254,180 240,176 L 152,176 C 136,180 118,176 108,164 C 96,170 84,164 78,152 C 66,158 52,152 46,138 Z" />
        <Path d="M 68,86 Q 84,80 90,94 Q 92,104 80,106 Q 72,96 68,86 Z" />
        <Path d="M 78,158 Q 72,176 84,190 Q 94,176 90,158 Z" />
      </G>
    );
  }
  // deve
  return (
    <G fill={color}>
      <Rect x={318} y={120} width={17} height={172} rx={8} />
      <Rect x={210} y={120} width={17} height={172} rx={8} />
      <Rect x={286} y={123} width={17} height={172} rx={8} />
      <Rect x={178} y={123} width={17} height={172} rx={8} />
      <Path d="M 92,96 C 84,92 80,84 84,76 C 88,68 98,66 104,72 C 116,82 126,96 132,114 C 140,90 162,68 192,58 C 214,50 240,48 262,54 C 288,60 306,76 313,98 C 330,102 344,114 348,130 C 362,138 368,154 360,168 C 366,178 362,192 348,196 C 320,204 220,204 194,196 C 182,192 176,180 178,168 C 160,178 146,172 140,158 C 132,166 120,166 112,158 C 100,150 92,136 90,120 C 82,112 78,102 82,94 Z" />
      <Ellipse cx={80} cy={84} rx={7} ry={9} transform="rotate(25 80 84)" />
    </G>
  );
}

export default function AnimalBodyMap({
  animalKey,
  parts,
  selectedPartKey,
  onSelectPart,
  foodFilterIds,
}) {
  const geometry = getRegionGeometry(animalKey);
  const displayParts = getDisplayParts(animalKey, parts);
  const labelLayout = REGION_LABELS[animalKey];
  const dotsD = REGION_DOTS[animalKey];
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const polygons = useMemo(() => {
    const map = {};
    displayParts.forEach((part) => {
      const d = geometry[part.key];
      if (d) map[part.key] = parsePolygon(d);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalKey, geometry]);

  const handleTouch = (evt) => {
    const { locationX, locationY } = evt.nativeEvent;
    const { width, height } = containerSize;
    if (!width || !height) return;
    const scale = Math.min(width / 480, height / 300);
    const offsetX = (width - 480 * scale) / 2;
    const offsetY = (height - 300 * scale) / 2;
    const vx = (locationX - offsetX) / scale;
    const vy = (locationY - offsetY) / scale;
    for (const part of displayParts) {
      const poly = polygons[part.key];
      if (!poly || !partHasAnyStock(part)) continue;
      if (pointInPolygon(vx, vy, poly)) {
        onSelectPart(part.key);
        return;
      }
    }
  };

  return (
    <View
      style={{ flex: 1 }}
      // Android hər state dəyişikliyində bu View-u "flatten" edib normal
      // vəziyyətə qaytara bilir — bu, SVG rəqəmlərinin hər toxunuşda cüzi
      // "sürüşməsi/titrəməsi" kimi görünürdü. collapsable={false} bunu ləğv edir.
      collapsable={false}
      onLayout={(e) =>
        setContainerSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={handleTouch}
    >
      <Svg
        viewBox={VIEWBOX}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
      >
        <BodyShape animalKey={animalKey} color={ANIMAL_COLOR} />

        {displayParts.map((part) => {
          const d = geometry[part.key];
          if (!d) return null;
          const hasStock = partHasAnyStock(part);
          const matchesFood = partMatchesFoodFilter(part, foodFilterIds);
          const isSel = selectedPartKey === part.key;

          let fill;
          let fillOpacity;
          let stroke;
          let strokeWidth;
          if (!hasStock) {
            fill = GRAY;
            fillOpacity = 0.7;
            stroke = isSel ? ACCENT : GRAY_STROKE;
            strokeWidth = isSel ? 3 : 1.5;
          } else if (!matchesFood) {
            fill = FOOD_EXCLUDED_FILL;
            fillOpacity = 0.7;
            stroke = isSel ? ACCENT : FOOD_EXCLUDED_STROKE;
            strokeWidth = isSel ? 3 : 1.5;
          } else if (isSel) {
            fill = SELECTED_FILL;
            fillOpacity = 1;
            // Seçilmiş hissə daha təmiz görünmək üçün əlavə sərhəd olmadan
            // yalnız dolğun rənglə göstərilir.
            stroke = "none";
            strokeWidth = 0;
          } else {
            fill = ACCENT;
            fillOpacity = 0.14;
            // Qoyun/qoç/dana üçün bölgə sərhədləri yalnız ağ nöqtəli xəttlə
            // (aşağıdakı dotsD Path-i) göstərilir — burada əlavə tam xətt
            // çəkilmir, əks halda iki xətt bir-birinin üstünə düşüb qarışıq
            // görünürdü. Nöqtəli məlumat olmayan heyvanlarda (keçi/dəvə)
            // adi tam xətt qalır.
            stroke = dotsD ? "none" : "#FBF7EE";
            strokeWidth = 3;
          }

          return (
            <Path
              key={part.key}
              d={d}
              fill={fill}
              fillOpacity={fillOpacity}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          );
        })}

        {dotsD && (
          <Path
            d={dotsD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={REGION_DOT_W[animalKey]}
            strokeLinecap="round"
          />
        )}

        {labelLayout &&
          labelLayout.map((L, i) => (
            <SvgText
              key={`lbl-${i}`}
              x={L.x}
              y={L.y + LABEL_VERTICAL_OFFSET}
              textAnchor="middle"
              // Web-də "dominantBaseline=middle" var idi, mən onu portlayanda
              // buraxmışdım — onsuz SVG y-nı mətnin ORTASI yox, ALT XƏTTİ
              // (baseline) kimi oxuyur, ona görə bütün rəqəmlər real
              // mərkəzindən yuxarıda görünürdü.
              dominantBaseline="middle"
              fontSize={L.s}
              fontWeight="800"
              fill="#FFFFFF"
            >
              {L.t}
            </SvgText>
          ))}
      </Svg>
    </View>
  );
}
