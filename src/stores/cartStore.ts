import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ShopifyProduct,
  storefrontApiRequest,
  CART_QUERY,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from '@/lib/shopify';

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
  addItem: (item: Omit<CartItem, 'lineId'>) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

function formatCheckoutUrl(checkoutUrl: string): string {
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set('channel', 'online_store');
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

function isCartNotFoundError(userErrors: Array<{ field: string[] | null; message: string }>): boolean {
  return userErrors.some(
    e =>
      e.message.toLowerCase().includes('cart not found') ||
      e.message.toLowerCase().includes('does not exist')
  );
}

// ---------------- Shopify Helpers ----------------

async function createShopifyCart(item: CartItem) {
  if (!item.variantId?.startsWith('gid://shopify/ProductVariant/')) {
    console.error('❌ Invalid variantId:', item.variantId);
    return null;
  }

  const data = await storefrontApiRequest(CART_CREATE_MUTATION, {
    input: {
      lines: [{ quantity: item.quantity, merchandiseId: item.variantId }],
    },
  });

  const userErrors = data?.data?.cartCreate?.userErrors || [];

  if (userErrors.length > 0) {
    console.error('❌ cartCreate error:', userErrors);
    return null;
  }

  const cart = data?.data?.cartCreate?.cart;

  if (!cart?.checkoutUrl) {
    console.error('❌ No checkoutUrl returned');
    return null;
  }

  const lineId = cart.lines.edges[0]?.node?.id;

  if (!lineId) {
    console.error('❌ No lineId returned');
    return null;
  }

  return {
    cartId: cart.id,
    checkoutUrl: formatCheckoutUrl(cart.checkoutUrl),
    lineId,
  };
}

async function addLineToShopifyCart(cartId: string, item: CartItem) {
  if (!item.variantId?.startsWith('gid://shopify/ProductVariant/')) {
    console.error('❌ Invalid variantId:', item.variantId);
    return { success: false };
  }

  const data = await storefrontApiRequest(CART_LINES_ADD_MUTATION, {
    cartId,
    lines: [{ quantity: item.quantity, merchandiseId: item.variantId }],
  });

  const userErrors = data?.data?.cartLinesAdd?.userErrors || [];

  if (isCartNotFoundError(userErrors)) {
    return { success: false, cartNotFound: true };
  }

  if (userErrors.length > 0) {
    console.error('❌ cartLinesAdd error:', userErrors);
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

async function updateShopifyCartLine(cartId: string, lineId: string, quantity: number) {
  const data = await storefrontApiRequest(CART_LINES_UPDATE_MUTATION, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });

  const userErrors = data?.data?.cartLinesUpdate?.userErrors || [];

  if (isCartNotFoundError(userErrors)) {
    return { success: false, cartNotFound: true };
  }

  if (userErrors.length > 0) {
    console.error('❌ cartLinesUpdate error:', userErrors);
    return { success: false };
  }

  return { success: true };
}

async function removeLineFromShopifyCart(cartId: string, lineId: string) {
  const data = await storefrontApiRequest(CART_LINES_REMOVE_MUTATION, {
    cartId,
    lineIds: [lineId],
  });

  const userErrors = data?.data?.cartLinesRemove?.userErrors || [];

  if (isCartNotFoundError(userErrors)) {
    return { success: false, cartNotFound: true };
  }

  if (userErrors.length > 0) {
    console.error('❌ cartLinesRemove error:', userErrors);
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

      addItem: async (item) => {
        console.log('🛒 Adding item:', item);

        const { items, cartId, clearCart } = get();
        const existingItem = items.find(i => i.variantId === item.variantId);

        set({ isLoading: true });

        try {
          if (!cartId) {
            console.log('🆕 Creating cart');

            const result = await createShopifyCart({ ...item, lineId: null });

            if (result) {
              set({
                cartId: result.cartId,
                checkoutUrl: result.checkoutUrl,
                items: [{ ...item, lineId: result.lineId }],
              });
            } else {
              console.error('❌ Cart creation failed');
            }
          } else if (existingItem) {
            console.log('🔁 Updating quantity');

            const newQuantity = existingItem.quantity + item.quantity;

            if (!existingItem.lineId) return;

            const result = await updateShopifyCartLine(
              cartId,
              existingItem.lineId,
              newQuantity
            );

            if (result.success) {
              set({
                items: get().items.map(i =>
                  i.variantId === item.variantId
                    ? { ...i, quantity: newQuantity }
                    : i
                ),
              });
            } else if (result.cartNotFound) {
              clearCart();
            }
          } else {
            console.log('➕ Adding new item');

            const result = await addLineToShopifyCart(cartId, {
              ...item,
              lineId: null,
            });

            if (result.success) {
              set({
                items: [
                  ...get().items,
                  { ...item, lineId: result.lineId ?? null },
                ],
              });
            } else if (result.cartNotFound) {
              clearCart();
            }
          }
        } catch (error) {
          console.error('❌ Failed to add item:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(variantId);
          return;
        }

        const { items, cartId, clearCart } = get();
        const item = items.find(i => i.variantId === variantId);

        if (!item?.lineId || !cartId) return;

        set({ isLoading: true });

        try {
          const result = await updateShopifyCartLine(
            cartId,
            item.lineId,
            quantity
          );

          if (result.success) {
            set({
              items: get().items.map(i =>
                i.variantId === variantId ? { ...i, quantity } : i
              ),
            });
          } else if (result.cartNotFound) {
            clearCart();
          }
        } catch (error) {
          console.error('❌ Failed to update quantity:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId) => {
        const { items, cartId, clearCart } = get();
        const item = items.find(i => i.variantId === variantId);

        if (!item?.lineId || !cartId) return;

        set({ isLoading: true });

        try {
          const result = await removeLineFromShopifyCart(
            cartId,
            item.lineId
          );

          if (result.success) {
            const newItems = get().items.filter(
              i => i.variantId !== variantId
            );

            newItems.length === 0
              ? clearCart()
              : set({ items: newItems });
          } else if (result.cartNotFound) {
            clearCart();
          }
        } catch (error) {
          console.error('❌ Failed to remove item:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () =>
        set({ items: [], cartId: null, checkoutUrl: null }),

      getCheckoutUrl: () => get().checkoutUrl,

      syncCart: async () => {
        const { cartId, isSyncing, clearCart } = get();

        if (!cartId || isSyncing) return;

        set({ isSyncing: true });

        try {
          const data = await storefrontApiRequest(CART_QUERY, {
            id: cartId,
          });

          const cart = data?.data?.cart;

          if (!cart || cart.totalQuantity === 0) {
            clearCart();
          }
        } catch (error) {
          console.error('❌ Failed to sync cart:', error);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'shopify-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        items: state.items,
        cartId: state.cartId,
        checkoutUrl: state.checkoutUrl,
      }),
    }
  )
);
