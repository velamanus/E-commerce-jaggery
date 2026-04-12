import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2 } from "lucide-react";
import { ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: ShopifyProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);
  const { node } = product;
  const image = node.images.edges[0]?.node;
  const price = node.priceRange.minVariantPrice;
  const selectedVariant = node.variants.edges[0]?.node;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedVariant) return;
    await addItem({
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    toast.success("Added to cart!", { description: node.title });
  };

  return (
    <Link to={`/product/${node.handle}`} className="group block">
      <div className="bg-card rounded-lg overflow-hidden border border-border hover-lift" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="aspect-square overflow-hidden bg-muted">
          {image ? (
            <img
              src={image.url}
              alt={image.altText || node.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-heading font-semibold text-foreground text-lg mb-1 truncate group-hover:text-primary transition-colors">
            {node.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{node.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
            </span>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isLoading || !selectedVariant?.availableForSale}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShoppingCart className="h-4 w-4 mr-1" /> Add</>}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
