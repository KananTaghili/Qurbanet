"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Beef } from "lucide-react";
import api from "../../lib/api";
import { useMeatCart } from "../../context/MeatCartContext";
import { useDeliveryLocation } from "../../context/DeliveryLocationContext";
import AnimalSwitcher from "../../components/meat/AnimalSwitcher";
import AnimalBodyMap from "../../components/meat/AnimalBodyMap";
import CutsList from "../../components/meat/CutsList";
import MeatCartPanel from "../../components/meat/MeatCartPanel";
import DeliveryLocationModal from "../../components/meat/DeliveryLocationModal";

const DEFAULT_ANIMAL_KEY = "dana";

export default function MeatHomePage() {
  const router = useRouter();
  const { items } = useMeatCart();
  const { location, setLocation, isLoaded: locationLoaded } = useDeliveryLocation();

  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimalKey, setSelectedAnimalKey] = useState(DEFAULT_ANIMAL_KEY);
  const [selectedPartKey, setSelectedPartKey] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [autoModalChecked, setAutoModalChecked] = useState(false);

  useEffect(() => {
    api
      .get("/meat/animals")
      .then((res) => {
        const list = res.data?.data?.animals || [];
        setAnimals(list);
        const hasDefault = list.some((a) => a.key === DEFAULT_ANIMAL_KEY);
        const initialAnimal = hasDefault ? DEFAULT_ANIMAL_KEY : list[0]?.key;
        setSelectedAnimalKey(initialAnimal);
        const firstAnimal = list.find((a) => a.key === initialAnimal);
        setSelectedPartKey(firstAnimal?.bodyParts?.[0]?.key || null);
      })
      .finally(() => setLoading(false));
  }, []);

  // İlk dəfə "Ət Satışı"na daxil olanda çatdırılma yeri seçilməyibsə modalı aç
  useEffect(() => {
    if (!locationLoaded || autoModalChecked) return;
    setAutoModalChecked(true);
    if (!location) setShowDeliveryModal(true);
  }, [locationLoaded, autoModalChecked, location]);

  const selectedAnimal = animals.find((a) => a.key === selectedAnimalKey);
  const selectedPart = selectedAnimal?.bodyParts?.find((p) => p.key === selectedPartKey);

  const handleSelectAnimal = (key) => {
    setSelectedAnimalKey(key);
    const animal = animals.find((a) => a.key === key);
    setSelectedPartKey(animal?.bodyParts?.[0]?.key || null);
  };

  const handleCheckout = () => {
    if (items.length === 0 || !location) return;
    router.push("/meat/checkout/summary");
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-[70vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#f97316] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (animals.length === 0) {
    return (
      <div className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-[#ffedd5]">
          <Beef className="h-8 w-8 text-[#f97316]" />
        </div>
        <h1 className="text-lg font-bold text-foreground">Ət Satışı tezliklə burada olacaq</h1>
        <p className="max-w-sm text-sm text-text-secondary">Hazırda heç bir heyvan aktiv deyil.</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-4 h-full">
      {showDeliveryModal && (
        <DeliveryLocationModal
          initialLocation={location}
          onClose={() => setShowDeliveryModal(false)}
          onConfirm={(loc) => {
            setLocation(loc);
            setShowDeliveryModal(false);
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-stretch">
        {/* Sol/Əsas: heyvan seçici + bədən xəritəsi + kəsimlər */}
        <div className="space-y-3 min-w-0">
          <div className="rounded-2xl border border-[#f0ede8] bg-white overflow-hidden">
            <div className="p-2">
              <AnimalSwitcher animals={animals} selectedKey={selectedAnimalKey} onSelect={handleSelectAnimal} />
            </div>
            <div className="p-3 pt-0">
              <AnimalBodyMap
                animalKey={selectedAnimalKey}
                parts={selectedAnimal?.bodyParts || []}
                selectedPartKey={selectedPartKey}
                onSelectPart={setSelectedPartKey}
              />
            </div>
          </div>

          <CutsList animal={selectedAnimal} part={selectedPart} />
        </div>

        {/* Sağ: səbət (masaüstü) — sabit (sticky), ölçüsü sabitdir, məhsul siyahısı öz daxilində scroll edir */}
        <div className="hidden lg:block self-stretch sticky top-4 max-h-[calc(100vh-32px)]">
          <MeatCartPanel onOpenDeliveryModal={() => setShowDeliveryModal(true)} onCheckout={handleCheckout} fillHeight={true} />
        </div>

        {/* Mobil: aşağıda kiçildilmiş cəmi zolağı */}
        {items.length > 0 && (
          <div className="lg:hidden fixed bottom-[64px] left-0 right-0 z-30 px-3">
            <button
              onClick={() => router.push("/meat/cart")}
              className="w-full flex items-center justify-between rounded-2xl bg-[#f97316] text-white px-4 py-3 shadow-lg active:scale-[.98] transition-all"
            >
              <span className="text-[12px] font-bold">{items.length} məhsul səbətdə</span>
              <span className="text-[13px] font-extrabold">Səbətə keç →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
