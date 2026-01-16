import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Heart, Leaf, Check, Info } from "lucide-react";
import { AuthPromptModal } from "@/components/auth-prompt-modal";

const suggestedAmounts = [10, 25, 50, 100, 250];

export default function Donate() {
  const { isAuthenticated, user } = useAuth();
  const [amount, setAmount] = useState<number | "">("");
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("one-time");
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

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

  const handleDonate = () => {
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return;
    }
    // This will be connected to Stripe in the backend integration phase
    console.log("Processing donation:", { amount, frequency, emailOptIn });
  };

  return (
    <div className="min-h-screen">
      <section className="bg-muted/30 py-12 border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Support Our Mission</h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-serif">
            Your donation helps us grow fresh produce for our community. 
            Every dollar goes directly toward seeds, supplies, and garden maintenance.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Make a Donation
                </CardTitle>
                <CardDescription>
                  Choose an amount and frequency for your donation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Donation Frequency</Label>
                  <RadioGroup
                    value={frequency}
                    onValueChange={(v) => setFrequency(v as "one-time" | "monthly")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one-time" id="one-time" data-testid="radio-one-time" />
                      <Label htmlFor="one-time" className="font-normal cursor-pointer">One-time</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="monthly" data-testid="radio-monthly" />
                      <Label htmlFor="monthly" className="font-normal cursor-pointer">Monthly</Label>
                    </div>
                  </RadioGroup>
                </div>

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
                        data-testid={`button-amount-${suggestedAmount}`}
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
                      data-testid="input-custom-amount"
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="email-optin"
                    checked={emailOptIn}
                    onCheckedChange={(checked) => setEmailOptIn(checked as boolean)}
                    data-testid="checkbox-email-optin"
                  />
                  <div>
                    <Label htmlFor="email-optin" className="cursor-pointer">
                      Keep me updated
                    </Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Receive occasional emails about harvest updates, events, and garden news
                    </p>
                  </div>
                </div>

                {isAuthenticated && user && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">
                      <span className="font-medium">Donating as:</span>{" "}
                      {user.firstName} {user.lastName} ({user.email})
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your donation will be tracked in your dashboard for tax purposes
                    </p>
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleDonate}
                  disabled={!amount || amount <= 0}
                  data-testid="button-donate-submit"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  {amount ? `Donate $${amount}${frequency === "monthly" ? "/month" : ""}` : "Select an amount"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Born Again Gardens is a 501(c)(3) nonprofit organization. 
                  Your donation may be tax-deductible to the extent allowed by law.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Your Impact</h3>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>$10</strong> provides seeds for a new plant variety</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>$25</strong> helps maintain garden beds for a week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>$50</strong> covers irrigation supplies for a month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>$100</strong> plants a new fruit tree</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>$250</strong> builds a new raised garden bed</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Tax Benefits</h3>
                </div>
                <p className="text-sm text-muted-foreground font-serif">
                  As a registered 501(c)(3) nonprofit, your donations to Born Again Gardens 
                  may be tax-deductible. Signed-in users can access their donation history 
                  and download tax forms from their dashboard.
                </p>
                {!isAuthenticated && (
                  <a href="/api/login">
                    <Button variant="link" className="px-0 mt-2" data-testid="button-signin-tax">
                      Sign in for donation tracking
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthPromptModal
        open={authPromptOpen}
        onOpenChange={setAuthPromptOpen}
        onContinueAsGuest={() => {
          setAuthPromptOpen(false);
          // Process donation as guest
        }}
      />
    </div>
  );
}
