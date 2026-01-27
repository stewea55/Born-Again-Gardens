import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CreditCard } from "lucide-react";
import { DonationTypeModal } from "@/components/donation-type-modal";
import sponsorshipTiersImage from "@assets/Sponsorship Founder Tiers.png";

export default function Sponsor() {
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState<number | "">("");
  const [customAmount, setCustomAmount] = useState("");
  const [donationModalOpen, setDonationModalOpen] = useState(false);

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    } else if (value === "") {
      setAmount("");
    }
    setCustomAmount(value);
  };

  const handleConfirm = () => {
    if (!amount || amount <= 0) {
      return;
    }

    // Check if sponsorInfo exists in sessionStorage
    const sponsorInfoStr = sessionStorage.getItem("sponsorInfo");
    
    if (sponsorInfoStr) {
      // Sponsor info exists, use it automatically
      const sponsorInfo = JSON.parse(sponsorInfoStr);
      const params = new URLSearchParams({
        type: "sponsor",
        amount: amount.toString(),
        companyName: sponsorInfo.companyName,
        email: sponsorInfo.email,
        firstName: sponsorInfo.firstName,
        lastName: sponsorInfo.lastName,
      });
      setLocation(`/payment?${params.toString()}`);
    } else {
      // No sponsor info, store amount and show DonationTypeModal
      sessionStorage.setItem("pendingSponsorAmount", amount.toString());
      setDonationModalOpen(true);
    }
  };

  // Restore amount from sessionStorage if returning from company creation
  useEffect(() => {
    const pendingAmount = sessionStorage.getItem("pendingSponsorAmount");
    if (pendingAmount) {
      const numAmount = parseFloat(pendingAmount);
      if (!isNaN(numAmount) && numAmount > 0) {
        setAmount(numAmount);
        setCustomAmount(numAmount.toString());
        sessionStorage.removeItem("pendingSponsorAmount");
      }
    }
  }, []);

  return (
    <div className="min-h-screen">
      <section className="relative h-[600px] md:h-[700px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1515150144380-bca9f1650ed9?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGdhcmRlbnxlbnwwfHwwfHx8Mg%3D%3D"
            alt="Garden sponsorship"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">Become a Sponsor</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl font-serif mb-4">
            By becoming a garden sponsor, you help make fresh produce, hands-on education, and welcoming green space possible for everyone.
          </p>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl font-serif">
            Recognition and involvement opportunities increase with each level of partnership.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="prose prose-lg max-w-none">
              <h1 className="text-2xl md:text-3xl font-bold mb-4">Limited Time – Become a <strong>Founder</strong></h1>
              <h3 className="text-xl md:text-2xl font-semibold mb-4 normal-case">Organizations who commit to a sponsorship before May 1st will be recognized as Founders and invited into the From the Ground Up Founders Club.</h3>
            </div>
          </CardContent>
        </Card>

        {/* Sponsorship Tiers Image */}
        <div className="mb-8">
          <img 
            src={sponsorshipTiersImage} 
            alt="Sponsorship Tiers: Cultivating Partner, Planting Partner, Tending Partner, Sustaining Partner" 
            className="w-full h-auto rounded-lg"
          />
        </div>

        {/* 501(c)(3) Notice */}
        <div className="mb-8">
          <div className="prose prose-sm max-w-none text-center">
            <h3 className="text-base font-bold mb-2">Important Note</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Born Again Gardens is in the process of receiving 501(c)(3) approval. While this process can take several months, donations made before approval <strong>will be</strong> tax-deductible once our status is confirmed. Thank you for standing with us at the very beginning—your early support helps make this work possible, and that's what makes you a Founder.
            </p>
          </div>
        </div>

        {/* Donation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Make a Sponsorship Donation</CardTitle>
            <CardDescription>
              Enter your sponsorship amount
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="sponsor-amount" className="mb-3 block">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="sponsor-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-7"
                  min="1"
                  step="0.01"
                />
              </div>
            </div>

            {amount && (
              <div className="bg-primary/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Sponsorship</span>
                  <span className="text-2xl font-bold text-primary">${amount}</span>
                </div>
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
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Email info@bornagaingardens.org for more information.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DonationTypeModal 
        open={donationModalOpen} 
        onOpenChange={setDonationModalOpen}
        sponsorPageContext={true}
      />
    </div>
  );
}
