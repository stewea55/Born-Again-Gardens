import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingBasket, Minus, Plus, Trash2, Heart, Leaf } from "lucide-react";
import { Link } from "wouter";

interface CartItem {
  id: number;
  plant: {
    id: number;
    name: string;
    suggestedDonation: string | null;
    unit: string | null;
  };
  quantity: number;
}

interface CartSidebarProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
}

export function CartSidebar({ items, onUpdateQuantity, onRemoveItem }: CartSidebarProps) {
  const totalSuggested = items.reduce((sum, item) => {
    const price = parseFloat(item.plant.suggestedDonation || "0");
    return sum + price * item.quantity;
  }, 0);

  return (
    <Card className="sticky top-20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingBasket className="h-5 w-5" />
          Estimate Your Harvest
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Your harvest basket is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Browse plants to add items</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3" data-testid={`cart-item-${item.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.plant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ~${item.plant.suggestedDonation || "0"}/{item.plant.unit || "lb"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 0.5))}
                      data-testid={`button-decrease-${item.id}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseFloat(e.target.value) || 0)}
                      className="w-14 h-7 text-center text-sm"
                      step="0.5"
                      min="0"
                      data-testid={`input-quantity-${item.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 0.5)}
                      data-testid={`button-increase-${item.id}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-medium">Suggested Donation</span>
              <Badge variant="secondary" className="text-base px-3 py-1">
                ~${totalSuggested.toFixed(2)}
              </Badge>
            </div>
          </>
        )}

        <div className="bg-accent/50 rounded-lg p-4 text-center">
          <p className="text-sm font-medium text-accent-foreground mb-1">
            Honor System
          </p>
          <p className="text-xs text-muted-foreground font-serif">
            Take what you need, pay what you can. The suggested amounts help cover our costs, 
            but we welcome all to enjoy fresh produce regardless of ability to pay.
          </p>
        </div>
      </CardContent>

      {items.length > 0 && (
        <CardFooter className="flex-col gap-2 pt-0">
          <Link href="/basket" className="w-full">
            <Button className="w-full" data-testid="button-checkout">
              <ShoppingBasket className="h-4 w-4 mr-2" />
              View your Basket
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
