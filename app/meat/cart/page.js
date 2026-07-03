"use client";
import { ShoppingCart } from "lucide-react";

export default function MeatCartPage() {
  return (
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fbede2]">
        <ShoppingCart className="h-8 w-8 text-[#c85a13]" />
      </div>
      <h1 className="text-lg font-bold text-foreground">Səbətiniz hələ hazır deyil</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Səbət funksionallığı tezliklə əlavə olunacaq.
      </p>
    </div>
  );
}
