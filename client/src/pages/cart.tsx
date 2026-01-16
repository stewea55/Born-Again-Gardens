import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AuthPromptModal } from "@/components/auth-prompt-modal";
import { ShoppingBasket, Heart, Leaf, Plus, Minus, Trash2, ArrowRight, Info } from "lucide-react";

interface CartItem {
  id: number;
  plant: {
    id: number;
    name: string;
    suggestedDonation: string;
    unit: string;
    category: string;
  };
  quantity: number;
}

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  
  // In a real app, this would come from a cart context/store
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleUpdateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter((item) => item.id !== itemId));
    } else {
      setCartItems(
        cartItems.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      );
    }
  };

  const handleRemoveItem = (itemId: number) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  };

  const totalSuggested = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.plant.suggestedDonation || "0");
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="bg-muted/30 py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center gap-3">
            <ShoppingBasket className="h-8 w-8" />
            Your Harvest Basket
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-serif">
            Review your estimated harvest and suggested donation amount. 
            Remember: take what you need, pay what you can.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        {cartItems.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Leaf className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Your basket is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto font-serif">
                Browse our plants to add items to your harvest basket. 
                This helps you estimate a suggested donation amount.
              </p>
              <Link href="/plants">
                <Button size="lg" data-testid="button-browse-empty">
                  <Leaf className="h-5 w-5 mr-2" />
                  Browse Plants
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Items in Basket</CardTitle>
                  <CardDescription>
                    {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your harvest basket
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                      data-testid={`cart-page-item-${item.id}`}
                    >
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Leaf className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{item.plant.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{item.plant.category}</p>
                        <p className="text-sm text-primary font-medium">
                          ~${item.plant.suggestedDonation}/{item.plant.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 0.5)}
                          data-testid={`button-cart-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, parseFloat(e.target.value) || 0)}
                          className="w-16 h-8 text-center"
                          step="0.5"
                          min="0"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 0.5)}
                          data-testid={`button-cart-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                          data-testid={`button-cart-remove-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Donation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Suggested Amount</span>
                    <span className="text-2xl font-bold">${totalSuggested.toFixed(2)}</span>
                  </div>

                  <div className="bg-accent/50 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Info className="h-4 w-4 mt-0.5 text-accent-foreground" />
                      <span className="font-medium text-sm text-accent-foreground">Honor System</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-serif">
                      The suggested amount helps cover our costs, but we welcome everyone regardless 
                      of ability to pay. Take what you need, pay what you can.
                    </p>
                  </div>

                  <Separator />

                  <Button className="w-full" size="lg" onClick={handleCheckout} data-testid="button-cart-checkout">
                    <Heart className="h-5 w-5 mr-2" />
                    Continue to Donate
                  </Button>

                  <Link href="/plants" className="block">
                    <Button variant="outline" className="w-full" data-testid="button-continue-shopping">
                      Continue Browsing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <AuthPromptModal
        open={authPromptOpen}
        onOpenChange={setAuthPromptOpen}
        onContinueAsGuest={() => {
          setAuthPromptOpen(false);
          // Navigate to donate page
        }}
      />
    </div>
  );
}
