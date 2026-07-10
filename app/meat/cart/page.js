"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMeatCart } from "../../../context/MeatCartContext";
import { useDeliveryLocation } from "../../../context/DeliveryLocationContext";
import MeatCartPanel from "../../../components/meat/MeatCartPanel";
import DeliveryLocationModal from "../../../components/meat/DeliveryLocationModal";

export default function MeatCartPage() {
  const router = useRouter();
  const { items } = useMeatCart();
  const { location, setLocation } = useDeliveryLocation();
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  const handleCheckout = () => {
    if (items.length === 0 || !location) return;
    router.push("/meat/checkout/summary");
  };

  return (
    <div className="p-1.5 md:p-2 pb-6 h-full flex flex-col">
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
      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        <MeatCartPanel onOpenDeliveryModal={() => setShowDeliveryModal(true)} onCheckout={handleCheckout} fillHeight={false} />
      </div>
    </div>
  );
}
