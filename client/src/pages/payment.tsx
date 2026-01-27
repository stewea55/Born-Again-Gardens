import { useState, useEffect } from "react";
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
import { ShoppingBasket, CreditCard, Info, ArrowLeft, Heart, Building2 } from "lucide-react";
import { StripePaymentForm } from "@/components/stripe-payment-form";

type PaymentType = "basket" | "donate" | "sponsor";

export default function Payment() {
  const { isAuthenticated, user } = useAuth();
  const { items, totalSuggested, clearCart } = useCart();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse URL params to determine payment type and data
  const urlParams = new URLSearchParams(window.location.search);
  const paymentType = (urlParams.get("type") || "basket") as PaymentType;
  const urlAmount = urlParams.get("amount");
  const sponsorCompanyName = urlParams.get("companyName");
  const sponsorEmail = urlParams.get("email");
  const sponsorFirstName = urlParams.get("firstName");
  const sponsorLastName = urlParams.get("lastName");
  const sponsorFrequency = urlParams.get("frequency") || "one-time";
  const sponsorEmailOptIn = urlParams.get("emailOptIn") === "true";
  const guestUserId = urlParams.get("userId"); // For donate flow guest users
  const donateFirstName = urlParams.get("firstName"); // For donate flow
  const donateLastName = urlParams.get("lastName"); // For donate flow
  const donateEmail = urlParams.get("email"); // For donate flow

  // Set initial payment amount based on payment type
  useEffect(() => {
    if (paymentType === "basket" && totalSuggested > 0) {
      setPaymentAmount(totalSuggested.toFixed(2));
    } else if (paymentType === "donate" && urlAmount) {
      setPaymentAmount(urlAmount);
    } else if (paymentType === "sponsor" && urlAmount) {
      setPaymentAmount(urlAmount);
    }
  }, [paymentType, urlAmount, totalSuggested]);

  // Calculate donation amount (only for basket flow)
  const calculateDonation = (amount: number): number => {
    if (paymentType !== "basket" || amount < totalSuggested) {
      return 0;
    }
    return amount - totalSuggested;
  };

  const donationAmount = paymentAmount ? calculateDonation(parseFloat(paymentAmount) || 0) : 0;
  const totalAmount = paymentAmount ? parseFloat(paymentAmount) : 0;

  const processPaymentMutation = useMutation({
    mutationFn: async ({ amount, paymentIntentId }: { amount: number; paymentIntentId: string }) => {
      const body: any = {
        amount: amount.toString(),
        paymentType,
        paymentIntentId,
      };

      // Add data specific to each payment type
      if (paymentType === "basket") {
        body.cartItems = items.map((item) => ({
          plantId: item.plantId,
          quantity: item.quantity,
          plant: item.plant,
        }));
      } else if (paymentType === "donate") {
        body.donationType = "donate";
        // Add guest user ID if available (for unauthenticated users)
        if (guestUserId) {
          body.userId = guestUserId;
        }
        if (donateFirstName) body.firstName = donateFirstName;
        if (donateLastName) body.lastName = donateLastName;
        if (donateEmail) body.email = donateEmail;
      } else if (paymentType === "sponsor") {
        body.donationType = "sponsor";
        body.companyName = sponsorCompanyName;
        body.companyEmail = sponsorEmail;
        body.contactName = sponsorFirstName && sponsorLastName ? `${sponsorFirstName} ${sponsorLastName}` : null;
        body.frequency = sponsorFrequency;
        body.emailOptIn = sponsorEmailOptIn;
        if (sponsorFirstName) body.firstName = sponsorFirstName;
        if (sponsorLastName) body.lastName = sponsorLastName;
      }

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to process payment" }));
        throw new Error(error.error || "Failed to process payment");
      }
      return response.json();
    },
    onSuccess: () => {
      if (paymentType === "basket") {
        clearCart();
      }
      toast({
        title: "Payment successful",
        description: "Your payment has been recorded. Thank you!",
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

  // Handle Stripe payment success
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // For basket flow, require authentication
    if (paymentType === "basket" && !isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to complete your payment",
        variant: "destructive",
      });
      return;
    }

    // For sponsor/donate flows, guest info should be provided if not authenticated
    if (!isAuthenticated && !hasGuestInfo) {
      toast({
        title: "Information required",
        description: "Please provide your information to continue",
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
      await processPaymentMutation.mutateAsync({ amount, paymentIntentId });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Stripe payment error
  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment error",
      description: error,
      variant: "destructive",
    });
  };

  // Get page title and description based on payment type
  const getPageInfo = () => {
    switch (paymentType) {
      case "basket":
        return {
          title: "Complete Your Harvest Payment",
          description: "Review your cart and confirm your payment amount",
          icon: ShoppingBasket,
          backLink: "/basket",
          backText: "Back to Basket",
        };
      case "donate":
        return {
          title: "Complete Your Donation",
          description: "Review your donation amount and proceed to payment",
          icon: Heart,
          backLink: "/donate",
          backText: "Back to Donate",
        };
      case "sponsor":
        return {
          title: "Complete Your Sponsorship",
          description: "Review your sponsorship details and proceed to payment",
          icon: Building2,
          backLink: "/sponsor",
          backText: "Back to Sponsor",
        };
    }
  };

  const pageInfo = getPageInfo();
  const PageIcon = pageInfo.icon;

  // Check if guest info is provided (for sponsor or donate flows)
  const hasGuestInfo = 
    (paymentType === "sponsor" && sponsorCompanyName) ||
    (paymentType === "donate" && (donateFirstName || guestUserId));

  // Only require authentication for basket flow, or if no guest info provided
  if (!isAuthenticated && !hasGuestInfo && paymentType === "basket") {
    return (
      <div className="min-h-screen">
        <section className="bg-muted/30 py-12 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Payment</h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-serif">
              Please sign in to complete your payment
            </p>
          </div>
        </section>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You must be signed in to make a payment</p>
                <Link href="/api/login">
                  <Button>Sign In</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // For basket flow, check if cart is empty
  if (paymentType === "basket" && items.length === 0) {
    return (
      <div className="min-h-screen">
        <section className="bg-muted/30 py-12 border-b">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Payment</h1>
            <p className="text-lg text-muted-foreground max-w-2xl font-serif">
              Your cart is empty
            </p>
          </div>
        </section>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Add items to your cart before checkout</p>
                <Link href="/plants">
                  <Button>Browse Plants</Button>
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
            <PageIcon className="h-8 w-8" />
            {pageInfo.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-serif">
            {pageInfo.description}
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Basket Flow: Show cart items */}
            {paymentType === "basket" && (
              <Card>
                <CardHeader>
                  <CardTitle>Cart Summary</CardTitle>
                  <CardDescription>{items.length} item{items.length !== 1 ? "s" : ""} in your cart</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.plant?.name || "Unknown Plant"}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} {item.plant?.unit || "lb"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${item.plant?.suggestedDonation ? (parseFloat(item.plant.suggestedDonation) * parseFloat(item.quantity.toString())).toFixed(2) : "0.00"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ${item.plant?.suggestedDonation || "0"}/{item.plant?.unit || "lb"}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Sponsor Flow: Show company info */}
            {paymentType === "sponsor" && (
              <Card>
                <CardHeader>
                  <CardTitle>Sponsorship Details</CardTitle>
                  <CardDescription>Review your sponsorship information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sponsorFirstName && sponsorLastName && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Contact Name</p>
                      <p className="font-medium">{sponsorFirstName} {sponsorLastName}</p>
                    </div>
                  )}
                  {sponsorCompanyName && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Company Name</p>
                      <p className="font-medium">{sponsorCompanyName}</p>
                    </div>
                  )}
                  {sponsorEmail && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{sponsorEmail}</p>
                    </div>
                  )}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Frequency</p>
                    <p className="font-medium capitalize">{sponsorFrequency}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>
                  {paymentType === "basket" 
                    ? "Confirm your payment amount (you can adjust if needed)"
                    : "Complete your payment using Stripe"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-accent/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-accent-foreground" />
                    <div className="text-sm text-accent-foreground">
                      <p className="font-medium mb-1">Secure Payment Processing</p>
                      <p className="text-xs text-muted-foreground">
                        Your payment is processed securely through Stripe. All transactions are encrypted and secure.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Amount input (for non-basket flows or to adjust basket amount) */}
                {paymentType !== "basket" && (
                  <div className="mb-4">
                    <Label htmlFor="amount">Payment Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0.00"
                      required
                      className="mt-2"
                    />
                  </div>
                )}

                {/* Stripe Payment Form */}
                {totalAmount > 0 && (
                  <StripePaymentForm
                    amount={totalAmount}
                    paymentType={paymentType}
                    metadata={{
                      userId: user?.id || guestUserId || "",
                      paymentType,
                    }}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    disabled={isProcessing}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {paymentType === "basket" && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Suggested Amount</span>
                        <span className="font-medium">${totalSuggested.toFixed(2)}</span>
                      </div>
                      {paymentAmount && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Payment Amount</span>
                            <span className="font-medium">${parseFloat(paymentAmount).toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Tax-Deductible Donation</span>
                            <span className="text-lg font-bold text-primary">
                              ${donationAmount.toFixed(2)}
                            </span>
                          </div>
                          {donationAmount === 0 && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mt-2">
                              <p className="text-xs text-amber-800 dark:text-amber-200">
                                Your payment covers the suggested amount. No additional tax-deductible donation is recorded.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                  {(paymentType === "donate" || paymentType === "sponsor") && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</span>
                      </div>
                      {paymentType === "sponsor" && sponsorFrequency === "monthly" && (
                        <p className="text-xs text-muted-foreground">
                          Recurring monthly payment
                        </p>
                      )}
                    </>
                  )}
                </div>

                <Separator />

                <div className="bg-accent/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground font-serif">
                    As a registered 501(c)(3) nonprofit, donations may be tax-deductible 
                    to the extent allowed by law.
                  </p>
                </div>

                <Link href={pageInfo.backLink}>
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {pageInfo.backText}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
