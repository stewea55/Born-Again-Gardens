import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Heart, Calendar, FileText, Leaf } from "lucide-react";
import { useState } from "react";

interface AuthPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueAsGuest?: () => void;
  onManualEntry?: (data: { firstName: string; lastName: string; email: string }) => void;
}

const benefits = [
  { icon: Heart, text: "Track your donations and contribution history" },
  { icon: Calendar, text: "Get personalized harvest alerts" },
  { icon: FileText, text: "Access downloadable tax forms" },
  { icon: Check, text: "Save your cart across devices" },
];

export function AuthPromptModal({ open, onOpenChange, onContinueAsGuest, onManualEntry }: AuthPromptModalProps) {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const handleNotNow = () => {
    if (onManualEntry) {
      setShowManualEntry(true);
    } else if (onContinueAsGuest) {
      onContinueAsGuest();
      onOpenChange(false);
    }
  };

  const handleManualSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return;
    }

    if (onManualEntry) {
      onManualEntry({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      setFirstName("");
      setLastName("");
      setEmail("");
      setShowManualEntry(false);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setShowManualEntry(false);
    setFirstName("");
    setLastName("");
    setEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!showManualEntry ? (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Leaf className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl">Join Our Community</DialogTitle>
              <DialogDescription className="text-base">
                Sign in to unlock the full Born Again Gardens experience
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button 
                className="w-full" 
                size="lg" 
                data-testid="button-modal-sign-in"
                onClick={() => {
                  window.location.href = "/api/login";
                }}
              >
                Sign In with Google
              </Button>
              
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleNotNow}
                data-testid="button-not-now"
              >
                Not now
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </>
        ) : (
          <>
            <DialogHeader className="text-left">
              <DialogTitle>Enter Your Information</DialogTitle>
              <DialogDescription>
                Please provide your information to continue
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="manual-first-name">First Name *</Label>
                  <Input
                    id="manual-first-name"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="manual-last-name">Last Name *</Label>
                  <Input
                    id="manual-last-name"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-2"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="manual-email">Email Address *</Label>
                <Input
                  id="manual-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowManualEntry(false)}
                >
                  Back
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
