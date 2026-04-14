import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  storefrontApiRequest,
  STOREFRONT_PRODUCT_BY_HANDLE_QUERY,
} from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  const addItem = useCartStore((state) => state.addItem);
  const isLoading = useCartStore((state) => state.isLoading);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await storefrontApiRequest(
          STOREFRONT_PRODUCT_BY_HANDLE_QUERY,
          { handle }
        );

        if (data?.data?.productByHandle) {
          setProduct(data.data.productByHandle);
        }
      } catch (error) {
        console.error("❌ Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [handle]);

  const handleAddToCart = async () => {
    if (!product) return;

    const variant = product.variants.edges[0]?.node;

    if (!variant) {
      toast.error("No variant found");
      return;
    }

    console.log("🧪 Variant:", variant);

    try {
      await addItem({
        product: { node: product },
        variantId: variant.id,
        variantTitle: variant.title,
        price: variant.price,
        quantity: 1,
        selectedOptions: variant.selectedOptions || [],
      });

      toast.success("Added to cart!", {
        description: product.title,
      });
    } catch (err) {
      console.error("❌ Add to cart failed:", err);

      toast.error("Failed to add to cart", {
        description: "Check console",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <h2>Product not found</h2>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images.edges;
  const price = product.priceRange.minVariantPrice;
  const variant = product.variants.edges[0]?.node;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Images */}
            <div>
              <img
                src={images[selectedImage]?.node?.url}
                className="w-full rounded-lg"
              />
            </div>

            {/* Details */}
            <div>
              <h1 className="text-3xl font-bold">{product.title}</h1>

              <p className="text-2xl mt-4">
                {price.currencyCode} {price.amount}
              </p>

              <p className="mt-4">{product.description}</p>

              <Button
                className="mt-6 w-full"
                onClick={handleAddToCart}
                disabled={isLoading || !variant?.availableForSale}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
