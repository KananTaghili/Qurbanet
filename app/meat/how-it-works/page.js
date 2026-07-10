"use client";
import { HelpCircle } from "lucide-react";

export default function MeatHowItWorksPage() {
  return (
    <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-[#ffedd5]">
        <HelpCircle className="h-8 w-8 text-[#f97316]" />
      </div>
      <h1 className="text-lg font-bold text-foreground">Necə işləyir</h1>
      <p className="max-w-sm text-sm text-text-secondary">
        Bu bölmə tezliklə hazır olacaq.
      </p>
    </div>
  );
}
