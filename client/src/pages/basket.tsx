import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/contexts/cart-context";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBasket, CreditCard, Info, ArrowLeft, Check, Plus, Minus, Trash2, Leaf } from "lucide-react";
import { AuthPromptModal } from "@/components/auth-prompt-modal";
import { apiRequest } from "@/lib/queryClient";

export default function Basket() {
  const { isAuthenticated, user } = useAuth();
  const { items, totalSuggested, clearCart, updateQuantity, removeItem } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [guestInfo, setGuestInfo] = useState<{ firstName: string; lastName: string; email: string; userId?: string } | null>(null);

  const createGuestUserMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string }) => {
      return apiRequest("POST", "/api/users/create-guest", data);
    },
    onSuccess: (user, variables) => {
      const guestData = {
        ...variables,
        userId: user.id,
      };
      setGuestInfo(guestData);
      sessionStorage.setItem("basketGuestInfo", JSON.stringify(guestData));
      // Navigate to payment after user creation
      setLocation("/payment?type=basket");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleManualEntry = (data: { firstName: string; lastName: string; email: string }) => {
    setGuestInfo(data);
    sessionStorage.setItem("basketGuestInfo", JSON.stringify(data));
    // After manual entry, navigate to payment
    setLocation("/payment?type=basket");
  };

  const handleConfirm = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Show auth modal
      setAuthModalOpen(true);
      return;
    }
    // If authenticated, go directly to payment
    setLocation("/payment?type=basket");
  };

  // Calculate donation amount
  const calculateDonation = (amount: number): number => {
    if (amount < totalSuggested) {
      return 0;
    }
    return amount - totalSuggested;
  };

  const donationAmount = paymentAmount ? calculateDonation(parseFloat(paymentAmount) || 0) : 0;

  const processPaymentMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: amount.toString(),
          cartItems: items.map((item) => ({
            plantId: item.plantId,
            quantity: item.quantity,
            plant: item.plant,
          })),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to process payment");
      }
      return response.json();
    },
    onSuccess: () => {
      clearCart();
      toast({
        title: "Payment successful",
        description: "Your donation has been recorded. Thank you!",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Payment failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to complete your payment",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await processPaymentMutation.mutateAsync(amount);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      await updateQuantity(itemId, quantity);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await removeItem(itemId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <section className="bg-muted/30 py-12 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center gap-3">
              <ShoppingBasket className="h-8 w-8" />
              Your Harvest Basket
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-serif">
              Your basket is empty
            </p>
          </div>
        </section>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
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
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Items in Basket</CardTitle>
                <CardDescription>
                  {items.length} item{items.length !== 1 ? "s" : ""} in your harvest basket
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                    data-testid={`basket-item-${item.id}`}
                  >
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      {item.plant?.imageUrl ? (
                        <img src={item.plant.imageUrl} alt={item.plant.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Leaf className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{item.plant?.name || "Unknown Plant"}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{item.plant?.category || ""}</p>
                      <p className="text-sm text-primary font-medium">
                        ~${item.plant?.suggestedDonation || "0"}/{item.plant?.unit || "lb"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(item.id, Math.max(0, parseFloat(item.quantity.toString()) - 0.5))}
                        data-testid={`button-basket-decrease-${item.id}`}
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
                        onClick={() => handleUpdateQuantity(item.id, parseFloat(item.quantity.toString()) + 0.5)}
                        data-testid={`button-basket-increase-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemoveItem(item.id)}
                        data-testid={`button-basket-remove-${item.id}`}
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

                <div className="flex flex-col gap-2">
                  <Link href="/plants" className="w-full">
                    <Button variant="outline" className="w-full" data-testid="button-back-to-harvest">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Harvest
                    </Button>
                  </Link>
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleConfirm}
                    data-testid="button-checkout"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Confirm
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthPromptModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onManualEntry={handleManualEntry}
      />
    </div>
  );
}
