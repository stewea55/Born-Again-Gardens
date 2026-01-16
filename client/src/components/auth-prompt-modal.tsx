import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Heart, Calendar, FileText, Leaf } from "lucide-react";

interface AuthPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinueAsGuest?: () => void;
}

const benefits = [
  { icon: Heart, text: "Track your donations and contribution history" },
  { icon: Calendar, text: "Get personalized harvest alerts" },
  { icon: FileText, text: "Access downloadable tax forms" },
  { icon: Check, text: "Save your cart across devices" },
];

export function AuthPromptModal({ open, onOpenChange, onContinueAsGuest }: AuthPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
          <a href="/api/login" className="block">
            <Button className="w-full" size="lg" data-testid="button-modal-sign-in">
              Sign In with Google
            </Button>
          </a>
          
          {onContinueAsGuest && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                onContinueAsGuest();
                onOpenChange(false);
              }}
              data-testid="button-continue-guest"
            >
              Continue as Guest
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </DialogContent>
    </Dialog>
  );
}
