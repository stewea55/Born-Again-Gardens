import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AuthPromptModal } from "@/components/auth-prompt-modal";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import foundersHeaderImage from "@assets/realistic-hands-in-soil.png";

const suggestedAmounts = [25, 50, 100, 250, 500];

export default function Donate() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number | "">("");
  const [customAmount, setCustomAmount] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [guestInfo, setGuestInfo] = useState<{ firstName: string; lastName: string; email: string; userId?: string } | null>(null);
  const [hasCompletedAuth, setHasCompletedAuth] = useState(false);

  // Read guest info from URL params or sessionStorage on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlFirstName = urlParams.get("firstName");
    const urlLastName = urlParams.get("lastName");
    const urlEmail = urlParams.get("email");
    const urlUserId = urlParams.get("userId");

    if (urlFirstName && urlLastName && urlEmail) {
      // Guest info passed via URL params (from donation-type-modal)
      const guestData = {
        firstName: urlFirstName,
        lastName: urlLastName,
        email: urlEmail,
        userId: urlUserId || undefined,
      };
      setGuestInfo(guestData);
      sessionStorage.setItem("donateGuestInfo", JSON.stringify(guestData));
      setHasCompletedAuth(true);
    } else {
      // Check sessionStorage for existing guest info
      const stored = sessionStorage.getItem("donateGuestInfo");
      if (stored) {
        try {
          const guestData = JSON.parse(stored);
          setGuestInfo(guestData);
          setHasCompletedAuth(true);
        } catch (e) {
          // Invalid stored data, ignore
        }
      }
    }

    // If user is authenticated, mark as completed
    if (isAuthenticated) {
      setHasCompletedAuth(true);
    }
  }, [isAuthenticated]);

  // Track if user authenticated after modal was shown
  useEffect(() => {
    if (authModalOpen && isAuthenticated) {
      // User signed in via Google
      setHasCompletedAuth(true);
      setAuthModalOpen(false);
    }
  }, [authModalOpen, isAuthenticated]);

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    } else if (value === "") {
      setAmount("");
    }
    setCustomAmount(value);
  };

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
      setHasCompletedAuth(true);
      // Store in sessionStorage for payment page
      sessionStorage.setItem("donateGuestInfo", JSON.stringify(guestData));
      // Close auth modal since we now have guest info
      setAuthModalOpen(false);
      toast({
        title: "Account created",
        description: "Your information has been saved",
      });
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
    // Create user in backend
    createGuestUserMutation.mutate(data);
    // Note: The mutation will set guestInfo and close the modal on success
  };

  const handleAuthModalClose = (open: boolean) => {
    setAuthModalOpen(open);
    if (!open && !isAuthenticated && !guestInfo) {
      // User closed modal without authenticating or entering info
      // Modal will stay closed
    }
  };

  const handleConfirm = () => {
    if (!amount || amount <= 0) {
      return;
    }

    // Check if user needs to authenticate before proceeding
    if (!isAuthenticated && !guestInfo) {
      setAuthModalOpen(true);
      return; // Don't proceed to payment
    }

    // Build payment URL params
    const params = new URLSearchParams({
      type: "donate",
      amount: amount.toString(),
    });

    // Add guest info if available
    if (guestInfo) {
      params.set("firstName", guestInfo.firstName);
      params.set("lastName", guestInfo.lastName);
      params.set("email", guestInfo.email);
      if (guestInfo.userId) {
        params.set("userId", guestInfo.userId);
      }
    }

    setLocation(`/payment?${params.toString()}`);
  };

  const scrollToDonateForm = () => {
    const donateForm = document.getElementById("donate-form");
    if (donateForm) {
      donateForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen">
      <section className="relative h-[500px] md:h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={foundersHeaderImage}
            alt="Hands holding rich soil"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
            From the Ground Up
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white" style={{ fontFamily: "'Libre Baskerville', serif" }}>
            Founders Club
          </h2>
          <div className="mb-6">
            <Button 
              size="lg" 
              onClick={scrollToDonateForm}
              className="mb-8 backdrop-blur-sm bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              Donate Now to Join
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="prose prose-lg max-w-none mb-12" style={{ fontFamily: "'Poppins', sans-serif" }}>
          <p className="text-lg leading-relaxed mb-6">
            The nourishment of a fresh harvest. The healing power of nature. The connection of a shared gathering place. …the beauty of a garden.
          </p>
          
          <p className="text-lg leading-relaxed mb-6">
            Do you share this vision?
          </p>
          
          <p className="text-lg leading-relaxed mb-6">
            You're invited to become one of the <strong>first stewards</strong> of it—stepping out in faith with us and helping this dream take root <strong>from the ground up.</strong>
          </p>
          
          <p className="text-lg leading-relaxed mb-6">
            The growing season officially begins when the last frost passes. <em>(In Indiana, our average last frost date is May 1.)</em> Until then, any donation made to Born Again Gardens secures you a <strong>lifelong place</strong> in our <strong>From the Ground Up Founders Club.</strong>
          </p>
          
          <h3 className="text-2xl font-bold mt-8 mb-4">What does that mean?</h3>
          
          <ul className="list-disc list-inside space-y-2 mb-6 text-lg">
            <li>Early, behind-the-scenes updates as the garden takes shape</li>
            <li>The opportunity to help name each of the first 18 orchard trees, contributing a dedication or meaning that becomes part of the garden's story.</li>
            <li>An invitation to <strong>break bread together in the garden</strong>—sharing the harvest of seeds you helped sow</li>
            <li><strong>As a thank-you:</strong> donors through April 1 will be entered to win one of two $50 Lululemon gift cards (chosen with sustainability in mind)</li>
            <li>Additional Founders-only invitations and moments as the garden grows</li>
          </ul>
          
          <h3 className="text-2xl font-bold mt-8 mb-4">How to join</h3>
          
          <p className="text-lg leading-relaxed mb-6">
            Simply contribute a <strong>personally meaningful gift,</strong> and you're in.
          </p>
          
          <p className="text-lg leading-relaxed mb-6">
            Together, we'll plant something meant to last.
          </p>
          
          <h4 className="text-xl font-bold mt-8 mb-4">Important Note</h4>
          
          <p className="text-lg leading-relaxed mb-6">
            Born Again Gardens is in the process of receiving 501(c)(3) approval. While this process can take several months, donations made before approval will be tax-deductible once our status is confirmed.
          </p>
          
          <p className="text-lg leading-relaxed mb-12">
            Thank you for standing with us at the very beginning—your early support helps make this work possible.
          </p>
        </div>

        <Card id="donate-form">
          <CardHeader>
            <CardTitle>Make a Donation</CardTitle>
            <CardDescription>
              Select or enter your donation amount
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-3 block">Select Amount</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                {suggestedAmounts.map((suggestedAmount) => (
                  <Button
                    key={suggestedAmount}
                    type="button"
                    variant={amount === suggestedAmount ? "default" : "outline"}
                    className="text-lg"
                    onClick={() => handleAmountSelect(suggestedAmount)}
                  >
                    ${suggestedAmount}
                  </Button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="Other amount"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="pl-7"
                  min="1"
                  step="0.01"
                />
              </div>
            </div>

            {amount && (
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Donation</span>
                  <span className="text-2xl font-bold text-primary">${amount}</span>
                </div>
              </div>
            )}

            {guestInfo && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-medium">Donating as:</span> {guestInfo.firstName} {guestInfo.lastName} ({guestInfo.email})
                </p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              onClick={handleConfirm}
              disabled={!amount || amount <= 0}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Confirm
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Born Again Gardens is a 501(c)(3) nonprofit organization. 
              Your donation may be tax-deductible to the extent allowed by law.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Only show modal if user is NOT authenticated */}
      {!isAuthenticated && (
        <AuthPromptModal
          open={authModalOpen}
          onOpenChange={handleAuthModalClose}
          onManualEntry={handleManualEntry}
        />
      )}
    </div>
  );
}
