import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";

export function useCartSync() {
  const fetchCart = useCartStore((state) => state.fetchCart);
  const cartId = useCartStore((state) => state.cartId);

  useEffect(() => {
    if (!fetchCart) return; // ✅ prevent crash

    if (cartId) {
      fetchCart();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && cartId) {
        fetchCart();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () =>
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
  }, [cartId, fetchCart]);
}
