import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { storefrontApiRequest, STOREFRONT_PRODUCT_BY_HANDLE_QUERY } from "@/lib/shopify";
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

  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);

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

  // ✅ FIXED FUNCTION
  const handleAddToCart = async () => {
    if (!product) return;

    const variant = product.variants.edges[0]?.node;

    if (!variant) {
      console.error("❌ No variant found");
      return;
    }

    // 🔥 IMPORTANT DEBUG
    console.log("🧪 Variant ID:", variant.id);

    await addItem({
      product: {
        node: product, // ✅ matches CartDrawer expectation
      },
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });

    toast.success("Added to cart!", {
      description: product.title,
    });
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
          <div className="text-center">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              Product not found
            </h2>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to store
              </Link>
            </Button>
          </div>
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
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to store
            </Link>
          </Button>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Images */}
            <div className="animate-fade-in">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                {images[selectedImage]?.node ? (
                  <img
                    src={images[selectedImage].node.url}
                    alt={
                      images[selectedImage].node.altText || product.title
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                        i === selectedImage
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={img.node.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="animate-fade-in-up">
              <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                {product.title}
              </h1>

              <p className="text-3xl font-bold text-primary mb-6">
                {price.currencyCode}{" "}
                {parseFloat(price.amount).toFixed(2)}
              </p>

              <p className="text-muted-foreground mb-8">
                {product.description}
              </p>

              <Button
                size="lg"
                className="w-full mt-4"
                onClick={handleAddToCart}
                disabled={isLoading || !variant?.availableForSale}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
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
