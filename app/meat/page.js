"use client";
import { Beef } from "lucide-react";

export default function MeatHomePage() {
  return (
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fbede2]">
        <Beef className="h-8 w-8 text-[#c85a13]" />
      </div>
      <h1 className="text-lg font-bold text-foreground">Ət Satışı tezliklə burada olacaq</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Təzə və keyfiyyətli ət məhsullarını onlayn sifariş etmə imkanı üzərində işləyirik. Çox tezliklə hazır olacaq.
      </p>
    </div>
  );
}
