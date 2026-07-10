"use client";
import { useId, useState } from "react";
import { VIEWBOX, getRegionGeometry, ANIMAL_COLOR, ACCENT } from "./animalRegions";

// Hər heyvan üçün klip formaları (bölgə örtüyünü heyvanın öz konturuna
// "kəsmək" üçün) və görünən (tək rəngli) silueti eyni koordinatlardan qurulur.
const SHAPES = {
  qoyun: {
    clip: (
      <>
        <rect x="296" y="95" width="16" height="161" rx="7" /><rect x="184" y="95" width="16" height="161" rx="7" />
        <rect x="266" y="95" width="16" height="163" rx="7" /><rect x="154" y="95" width="16" height="163" rx="7" />
        <ellipse cx="338" cy="172" rx="15" ry="21" />
        <path d="M 40,150 C 34,138 36,124 48,116 C 56,100 72,88 92,86 C 100,80 112,80 118,88
                 C 122,96 118,104 110,108 C 128,100 150,94 172,98 C 188,84 208,80 226,86
                 C 246,76 268,76 284,88 C 302,82 320,88 330,102 C 344,110 350,126 344,140
                 C 352,150 350,164 338,172 C 330,184 314,190 296,188 L 160,188
                 C 142,190 122,186 112,174 C 100,178 88,172 82,160 C 70,166 56,162 48,150 Z" />
        <path d="M 82,100 Q 100,96 106,112 Q 108,126 94,128 Q 86,116 82,100 Z" />
      </>
    ),
    body: (color) => (
      <>
        <g fill={color}>
          <rect x="296" y="95" width="16" height="161" rx="7" /><rect x="184" y="95" width="16" height="161" rx="7" />
          <rect x="266" y="95" width="16" height="163" rx="7" /><rect x="154" y="95" width="16" height="163" rx="7" />
          <ellipse cx="338" cy="172" rx="15" ry="21" />
          <path d="M 40,150 C 34,138 36,124 48,116 C 56,100 72,88 92,86 C 100,80 112,80 118,88
                   C 122,96 118,104 110,108 C 128,100 150,94 172,98 C 188,84 208,80 226,86
                   C 246,76 268,76 284,88 C 302,82 320,88 330,102 C 344,110 350,126 344,140
                   C 352,150 350,164 338,172 C 330,184 314,190 296,188 L 160,188
                   C 142,190 122,186 112,174 C 100,178 88,172 82,160 C 70,166 56,162 48,150 Z" />
        </g>
        <path d="M 82,100 Q 100,96 106,112 Q 108,126 94,128 Q 86,116 82,100 Z" fill={color} />
      </>
    ),
  },
  qoc: {
    clip: (
      <>
        <rect x="296" y="95" width="16" height="161" rx="7" /><rect x="184" y="95" width="16" height="161" rx="7" />
        <rect x="266" y="95" width="16" height="163" rx="7" /><rect x="154" y="95" width="16" height="163" rx="7" />
        <ellipse cx="338" cy="172" rx="15" ry="21" />
        <path d="M 40,150 C 34,138 36,124 48,116 C 56,100 72,88 92,86 C 100,80 112,80 118,88
                 C 122,96 118,104 110,108 C 128,100 150,94 172,98 C 188,84 208,80 226,86
                 C 246,76 268,76 284,88 C 302,82 320,88 330,102 C 344,110 350,126 344,140
                 C 352,150 350,164 338,172 C 330,184 314,190 296,188 L 160,188
                 C 142,190 122,186 112,174 C 100,178 88,172 82,160 C 70,166 56,162 48,150 Z" />
        <path d="M 100,96 C 84,98 72,86 74,70 C 76,54 92,44 108,46 C 122,48 130,60 128,74
                 C 126,84 118,90 110,88 C 118,78 116,66 104,62 C 94,60 86,68 88,78 C 90,86 96,90 102,88 Z" />
        <path d="M 78,92 Q 96,88 102,104 Q 104,118 90,120 Q 82,108 78,92 Z" />
      </>
    ),
    body: (color) => (
      <>
        <g fill={color}>
          <rect x="296" y="95" width="16" height="161" rx="7" /><rect x="184" y="95" width="16" height="161" rx="7" />
          <rect x="266" y="95" width="16" height="163" rx="7" /><rect x="154" y="95" width="16" height="163" rx="7" />
          <ellipse cx="338" cy="172" rx="15" ry="21" />
          <path d="M 40,150 C 34,138 36,124 48,116 C 56,100 72,88 92,86 C 100,80 112,80 118,88
                   C 122,96 118,104 110,108 C 128,100 150,94 172,98 C 188,84 208,80 226,86
                   C 246,76 268,76 284,88 C 302,82 320,88 330,102 C 344,110 350,126 344,140
                   C 352,150 350,164 338,172 C 330,184 314,190 296,188 L 160,188
                   C 142,190 122,186 112,174 C 100,178 88,172 82,160 C 70,166 56,162 48,150 Z" />
          <path d="M 100,96 C 84,98 72,86 74,70 C 76,54 92,44 108,46 C 122,48 130,60 128,74
                   C 126,84 118,90 110,88 C 118,78 116,66 104,62 C 94,60 86,68 88,78 C 90,86 96,90 102,88 Z" />
        </g>
        <path d="M 78,92 Q 96,88 102,104 Q 104,118 90,120 Q 82,108 78,92 Z" fill={color} />
      </>
    ),
  },
  keci: {
    clip: (
      <>
        <rect x="290" y="85" width="14" height="171" rx="6" /><rect x="188" y="85" width="14" height="171" rx="6" />
        <rect x="260" y="85" width="14" height="173" rx="6" /><rect x="158" y="85" width="14" height="173" rx="6" />
        <path d="M 46,138 C 40,126 42,112 52,104 C 58,92 70,82 84,80 C 92,74 102,76 106,84
                 C 108,92 104,100 96,102 C 116,92 140,88 164,92 C 190,86 220,86 246,92
                 C 266,88 288,96 296,114 C 302,124 300,136 292,144 C 296,154 292,166 280,170
                 C 270,178 254,180 240,176 L 152,176 C 136,180 118,176 108,164
                 C 96,170 84,164 78,152 C 66,158 52,152 46,138 Z" />
        <path d="M 68,86 Q 84,80 90,94 Q 92,104 80,106 Q 72,96 68,86 Z" />
        <path d="M 78,158 Q 72,176 84,190 Q 94,176 90,158 Z" />
      </>
    ),
    body: (color) => (
      <>
        <g fill={color}>
          <rect x="290" y="85" width="14" height="171" rx="6" /><rect x="188" y="85" width="14" height="171" rx="6" />
          <rect x="260" y="85" width="14" height="173" rx="6" /><rect x="158" y="85" width="14" height="173" rx="6" />
          <path d="M 292,120 Q 310,108 306,90 Q 303,80 294,86" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
          <path d="M 46,138 C 40,126 42,112 52,104 C 58,92 70,82 84,80 C 92,74 102,76 106,84
                   C 108,92 104,100 96,102 C 116,92 140,88 164,92 C 190,86 220,86 246,92
                   C 266,88 288,96 296,114 C 302,124 300,136 292,144 C 296,154 292,166 280,170
                   C 270,178 254,180 240,176 L 152,176 C 136,180 118,176 108,164
                   C 96,170 84,164 78,152 C 66,158 52,152 46,138 Z" />
        </g>
        <path d="M 68,86 Q 84,80 90,94 Q 92,104 80,106 Q 72,96 68,86 Z" fill={color} />
        <path d="M 78,158 Q 72,176 84,190 Q 94,176 90,158 Z" fill={color} />
        <path d="M 94,84 C 90,66 100,46 126,32" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
        <path d="M 82,88 C 80,72 88,54 108,40" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      </>
    ),
  },
  dana: {
    clip: (
      <>
        <rect x="304" y="128" width="20" height="154" rx="9" /><rect x="188" y="98" width="20" height="186" rx="9" />
        <rect x="272" y="128" width="20" height="154" rx="9" /><rect x="156" y="98" width="20" height="186" rx="9" />
        <ellipse cx="333" cy="212" rx="7.5" ry="10" />
        <path d="M 46,168 C 40,156 42,142 54,134 C 58,120 70,108 86,104 C 90,96 100,92 108,96
                 C 116,100 118,110 112,118 C 108,124 100,126 94,124 C 112,112 136,106 160,108
                 C 190,100 230,100 262,108 C 288,106 314,116 326,138 C 338,150 340,168 332,182
                 C 336,192 330,204 316,208 C 300,214 280,212 268,202 L 156,202
                 C 138,208 116,204 104,190 C 90,196 74,188 68,174 C 56,180 42,174 40,158 Z" />
        <ellipse cx="112" cy="100" rx="14" ry="9" transform="rotate(-30 112 100)" />
        <ellipse cx="60" cy="152" rx="18" ry="14" />
      </>
    ),
    body: (color) => (
      <>
        <g fill={color}>
          <rect x="304" y="128" width="20" height="154" rx="9" /><rect x="188" y="98" width="20" height="186" rx="9" />
          <rect x="272" y="128" width="20" height="154" rx="9" /><rect x="156" y="98" width="20" height="186" rx="9" />
          <path d="M 295,120 C 328,113 358,126 360,156 C 361,177 350,197 335,207" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="333" cy="212" rx="7.5" ry="10" />
          <path d="M 46,168 C 40,156 42,142 54,134 C 58,120 70,108 86,104 C 90,96 100,92 108,96
                   C 116,100 118,110 112,118 C 108,124 100,126 94,124 C 112,112 136,106 160,108
                   C 190,100 230,100 262,108 C 288,106 314,116 326,138 C 338,150 340,168 332,182
                   C 336,192 330,204 316,208 C 300,214 280,212 268,202 L 156,202
                   C 138,208 116,204 104,190 C 90,196 74,188 68,174 C 56,180 42,174 40,158 Z" />
        </g>
        <ellipse cx="112" cy="100" rx="14" ry="9" fill={color} transform="rotate(-30 112 100)" />
        <path d="M 84,96 C 78,86 78,74 86,66" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
        <path d="M 112,92 C 118,82 118,70 111,62" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
        <ellipse cx="60" cy="152" rx="18" ry="14" fill={color} />
      </>
    ),
  },
  deve: {
    clip: (
      <>
        <rect x="318" y="120" width="17" height="172" rx="8" /><rect x="210" y="120" width="17" height="172" rx="8" />
        <rect x="286" y="123" width="17" height="172" rx="8" /><rect x="178" y="123" width="17" height="172" rx="8" />
        <path d="M 92,96 C 84,92 80,84 84,76 C 88,68 98,66 104,72 C 116,82 126,96 132,114
                 C 140,90 162,68 192,58 C 214,50 240,48 262,54 C 288,60 306,76 313,98
                 C 330,102 344,114 348,130 C 362,138 368,154 360,168 C 366,178 362,192 348,196
                 C 320,204 220,204 194,196 C 182,192 176,180 178,168 C 160,178 146,172 140,158
                 C 132,166 120,166 112,158 C 100,150 92,136 90,120 C 82,112 78,102 82,94 Z" />
        <ellipse cx="80" cy="84" rx="7" ry="9" transform="rotate(25 80 84)" />
      </>
    ),
    body: (color) => (
      <>
        <g fill={color}>
          <rect x="318" y="120" width="17" height="172" rx="8" /><rect x="210" y="120" width="17" height="172" rx="8" />
          <rect x="286" y="123" width="17" height="172" rx="8" /><rect x="178" y="123" width="17" height="172" rx="8" />
          <path d="M 356,172 Q 366,192 356,212" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
          <path d="M 92,96 C 84,92 80,84 84,76 C 88,68 98,66 104,72 C 116,82 126,96 132,114
                   C 140,90 162,68 192,58 C 214,50 240,48 262,54 C 288,60 306,76 313,98
                   C 330,102 344,114 348,130 C 362,138 368,154 360,168 C 366,178 362,192 348,196
                   C 320,204 220,204 194,196 C 182,192 176,180 178,168 C 160,178 146,172 140,158
                   C 132,166 120,166 112,158 C 100,150 92,136 90,120 C 82,112 78,102 82,94 Z" />
        </g>
        <ellipse cx="80" cy="84" rx="7" ry="9" fill={color} transform="rotate(25 80 84)" />
      </>
    ),
  },
};

export default function AnimalBodyMap({ animalKey, parts, selectedPartKey, onSelectPart }) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const uid = useId();
  const clipId = `bodyClip-${animalKey}-${uid}`;
  const filterId = `handDrawn-${uid}`;
  const color = ANIMAL_COLOR[animalKey] || ANIMAL_COLOR.qoyun;
  const geometry = getRegionGeometry(animalKey);
  const shape = SHAPES[animalKey] || SHAPES.qoyun;

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-4">
      <svg viewBox={VIEWBOX} className="w-full sm:flex-1 sm:min-w-0 h-[188px] sm:h-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${animalKey} bədən xəritəsi`}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <clipPath id={clipId}>{shape.clip}</clipPath>
        </defs>

        {shape.body(color)}

        {/* Bölgə örtüyü: heyvanın öz konturuna klip olunub, sərhədlər əl ilə çəkilmiş kimi */}
        <g clipPath={`url(#${clipId})`}>
          <g filter={`url(#${filterId})`}>
            {parts.map((part) => {
              const d = geometry[part.key];
              if (!d) return null;
              const isSel = selectedPartKey === part.key;
              const isHover = hoveredKey === part.key;
              return (
                <path
                  key={part.key}
                  d={d}
                  fill={ACCENT}
                  fillOpacity={isSel ? 0.65 : isHover ? 0.28 : 0.14}
                  stroke={isSel ? ACCENT : "#FBF7EE"}
                  strokeWidth={isSel ? 3.5 : 3}
                  strokeLinejoin="round"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelectPart(part.key)}
                  onMouseEnter={() => setHoveredKey(part.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                />
              );
            })}
          </g>
        </g>
      </svg>

      {/* Bölgə siyahısı (nömrələnmiş) — sağda, 2 sütun */}
      <div
        className="grid grid-cols-2 gap-1.5 content-start w-full sm:w-[310px] shrink-0 h-[188px] sm:h-[218px] overflow-y-auto pr-1 mt-0 sm:mt-[11px]"
        style={{ scrollbarGutter: "stable" }}
      >
        {parts.map((part, i) => {
          const isSel = selectedPartKey === part.key;
          return (
            <button
              key={part.key}
              onClick={() => onSelectPart(part.key)}
              className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-left transition-all border ${
                isSel
                  ? "bg-[#f97316] text-white border-[#f97316]"
                  : "bg-white text-[#57534e] border-[#eee] hover:border-[#f97316]/50"
              }`}
            >
              <span
                className={`grid place-items-center h-4 w-4 rounded-full shrink-0 text-[9px] font-extrabold ${
                  isSel ? "bg-white text-[#f97316]" : "bg-[#ffedd5] text-[#f97316]"
                }`}
              >
                {i + 1}
              </span>
              <span className="truncate">{part.nameAz}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
