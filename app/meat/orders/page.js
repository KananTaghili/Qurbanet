"use client";
import { ClipboardList } from "lucide-react";

export default function MeatOrdersPage() {
  return (
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#fbede2]">
        <ClipboardList className="h-8 w-8 text-[#c85a13]" />
      </div>
      <h1 className="text-lg font-bold text-foreground">Sifarişləriniz hələ hazır deyil</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Ət məhsulları sifarişləri tezliklə burada görünəcək.
      </p>
    </div>
  );
}
