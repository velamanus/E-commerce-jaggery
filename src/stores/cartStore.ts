import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  ShopifyProduct,
  storefrontApiRequest,
  CART_QUERY,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from "@/lib/shopify";

export interface CartItem {
  lineId: string | null;
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: { amount: string; currencyCode: string };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;

  addItem: (item: Omit<CartItem, "lineId">) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

// ---------------- Helpers ----------------

function formatCheckoutUrl(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("channel", "online_store");
    return u.toString();
  } catch {
    return url;
  }
}

function isCartNotFoundError(errors: any[]) {
  return errors.some((e) =>
    e.message.toLowerCase().includes("cart not found")
  );
}

// ---------------- Shopify API ----------------

async function createShopifyCart(item: CartItem) {
  console.log("🆕 Creating Shopify cart...");

  const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
    input: {
      lines: [
        {
          quantity: item.quantity,
          merchandiseId: item.variantId,
        },
      ],
    },
  });

  const errors = data?.data?.cartCreate?.userErrors || [];

  if (errors.length) {
    console.error("❌ cartCreate error:", errors);
    return null;
  }

  const cart = data?.data?.cartCreate?.cart;

  if (!cart) return null;

  return {
    cartId: cart.id,
    checkoutUrl: formatCheckoutUrl(cart.checkoutUrl),
    lineId: cart.lines.edges[0]?.node?.id,
  };
}

async function addLineToCart(cartId: string, item: CartItem) {
  console.log("➕ Adding line to cart...");

  const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, {
    cartId,
    lines: [
      {
        quantity: item.quantity,
        merchandiseId: item.variantId,
      },
    ],
  });

  const errors = data?.data?.cartLinesAdd?.userErrors || [];

  if (errors.length) {
    console.error("❌ cartLinesAdd error:", errors);
    return { success: false };
  }

  const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];

  const newLine = lines.find(
    (l: any) => l.node.merchandise.id === item.variantId
  );

  return {
    success: true,
    lineId: newLine?.node?.id,
  };
}

async function updateLine(cartId: string, lineId: string, quantity: number) {
  const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });

  const errors = data?.data?.cartLinesUpdate?.userErrors || [];

  if (errors.length) {
    console.error("❌ update error:", errors);
    return { success: false };
  }

  return { success: true };
}

async function removeLine(cartId: string, lineId: string) {
  const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds: [lineId],
  });

  const errors = data?.data?.cartLinesRemove?.userErrors || [];

  if (errors.length) {
    console.error("❌ remove error:", errors);
    return { success: false };
  }

  return { success: true };
}

// ---------------- Store ----------------

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,
      isSyncing: false,

      // 🔥 ADD ITEM (FIXED)
      addItem: async (item) => {
        console.log("🛒 Add to cart clicked:", item);

        const { items, cartId, clearCart } = get();
        const existing = items.find(
          (i) => i.variantId === item.variantId
        );

        set({ isLoading: true });

        try {
          // ✅ instant UI update
          if (!existing) {
            set({
              items: [...items, { ...item, lineId: null }],
            });
          }

          if (!cartId) {
            const result = await createShopifyCart({
              ...item,
              lineId: null,
            });

            if (!result) throw new Error("Cart creation failed");

            set({
              cartId: result.cartId,
              checkoutUrl: result.checkoutUrl,
              items: [{ ...item, lineId: result.lineId }],
            });

          } else if (existing) {
            const newQty = existing.quantity + item.quantity;

            if (!existing.lineId) return;

            const res = await updateLine(
              cartId,
              existing.lineId,
              newQty
            );

            if (!res.success) throw new Error("Update failed");

            set({
              items: get().items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: newQty }
                  : i
              ),
            });

          } else {
            const res = await addLineToCart(cartId, {
              ...item,
              lineId: null,
            });

            if (!res.success) throw new Error("Add failed");

            set({
              items: [
                ...get().items,
                { ...item, lineId: res.lineId ?? null },
              ],
            });
          }
        } catch (err) {
          console.error("❌ Cart error:", err);
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        const { items, cartId } = get();
        const item = items.find((i) => i.variantId === variantId);

        if (!item || !cartId || !item.lineId) return;

        set({ isLoading: true });

        try {
          const res = await updateLine(
            cartId,
            item.lineId,
            quantity
          );

          if (!res.success) throw new Error("Update failed");

          set({
            items: items.map((i) =>
              i.variantId === variantId
                ? { ...i, quantity }
                : i
            ),
          });
        } catch (err) {
          console.error(err);
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId) => {
        const { items, cartId, clearCart } = get();
        const item = items.find((i) => i.variantId === variantId);

        if (!item || !cartId || !item.lineId) return;

        set({ isLoading: true });

        try {
          const res = await removeLine(cartId, item.lineId);

          if (!res.success) throw new Error("Remove failed");

          const newItems = items.filter(
            (i) => i.variantId !== variantId
          );

          newItems.length === 0
            ? clearCart()
            : set({ items: newItems });
        } catch (err) {
          console.error(err);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () =>
        set({ items: [], cartId: null, checkoutUrl: null }),

      getCheckoutUrl: () => get().checkoutUrl,

      syncCart: async () => {
        const { cartId } = get();

        if (!cartId) return;

        try {
          const data = await storefrontApiRequest(CART_QUERY, {
            id: cartId,
          });

          if (!data?.data?.cart) {
            get().clearCart();
          }
        } catch (err) {
          console.error(err);
        }
      },
    }),
    {
      name: "shopify-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
        checkoutUrl: state.checkoutUrl,
      }),
    }
  )
);
