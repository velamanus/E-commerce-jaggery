import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";

export function useCartSync() {
  const fetchCart = useCartStore((state) => state.fetchCart);
  const cartId = useCartStore((state) => state.cartId);

  useEffect(() => {
    if (!cartId) return;

    // Initial fetch
    fetchCart();

    // Refresh when user comes back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
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
