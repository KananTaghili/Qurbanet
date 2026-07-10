"use client";

export default function AnimalSwitcher({ animals, selectedKey, onSelect }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-[#f5f5f4] p-0.5 overflow-x-auto">
      {animals.map((a) => {
        const isSel = a.key === selectedKey;
        return (
          <button
            key={a.key}
            onClick={() => onSelect(a.key)}
            className={`shrink-0 flex-1 rounded-md px-3 py-1 text-[12px] font-bold transition-all whitespace-nowrap ${
              isSel
                ? "bg-[#f97316] text-white shadow-sm"
                : "text-[#78716c] hover:text-[#292524]"
            }`}
          >
            {a.nameAz}
          </button>
        );
      })}
    </div>
  );
}
