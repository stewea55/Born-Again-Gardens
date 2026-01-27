import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, User, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { AuthPromptModal } from "@/components/auth-prompt-modal";

interface DonationTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsorPageContext?: boolean;
}

export function DonationTypeModal({ open, onOpenChange, sponsorPageContext = false }: DonationTypeModalProps) {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [donationType, setDonationType] = useState<"self" | "company" | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [hasShownAuthModal, setHasShownAuthModal] = useState(false);
  const [hasCompletedManualEntry, setHasCompletedManualEntry] = useState(false);

  const createGuestUserMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; email: string }) => {
      return apiRequest("POST", "/api/users/create-guest", data);
    },
    onSuccess: (user, variables) => {
      const guestData = {
        ...variables,
        userId: user.id,
      };
      // Store in sessionStorage for payment page
      sessionStorage.setItem("donateGuestInfo", JSON.stringify(guestData));
      // Navigate to donate page with guest info in URL params
      const params = new URLSearchParams({
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        email: guestData.email,
        userId: guestData.userId,
      });
      setLocation(`/donate?${params.toString()}`);
      // Close modals
      setAuthModalOpen(false);
      setHasShownAuthModal(false);
      onOpenChange(false);
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

  const createCompanyUserMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; companyName: string; email: string }) => {
      // Create company user with contact info
      const companyUser = await apiRequest("POST", "/api/donations/create-company-user", {
        companyName: data.companyName,
        companyEmail: data.email,
      });
      
      // Store contact info in sessionStorage for payment page
      sessionStorage.setItem("sponsorInfo", JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        email: data.email,
      }));
      
      return companyUser;
    },
    onSuccess: (data) => {
      toast({
        title: "Company account created",
        description: `Donating as ${companyName}`,
      });
      setIsCreatingCompany(false);
      setFirstName("");
      setLastName("");
      setCompanyName("");
      setEmail("");
      setLocation("/sponsor?fromModal=true");
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create company account",
        variant: "destructive",
      });
      setIsCreatingCompany(false);
    },
  });

  const handleSelfClick = () => {
    // If this is from sponsor page, go directly to /donate without auth prompt
    if (sponsorPageContext) {
      setLocation("/donate");
      onOpenChange(false);
      return;
    }

    // Original behavior for home page
    if (!isAuthenticated) {
      // Show AuthPromptModal (same as Founders Club)
      setHasShownAuthModal(true);
      setAuthModalOpen(true);
      // Keep DonationTypeModal open but show AuthPromptModal on top
    } else {
      // Already signed in, go to donate page (Founders Club)
      setLocation("/donate");
      onOpenChange(false);
    }
  };

  const handleCompanyClick = () => {
    setDonationType("company");
  };

  const handleCreateCompany = () => {
    if (!firstName.trim() || !lastName.trim() || !companyName.trim() || !email.trim()) {
      toast({
        title: "All fields required",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCompany(true);
    createCompanyUserMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      companyName: companyName.trim(),
      email: email.trim(),
    });
  };

  const handleClose = () => {
    // Don't redirect to home if manual entry was completed (user is navigating to donate page)
    const shouldRedirectToHome = hasShownAuthModal && !isAuthenticated && !hasCompletedManualEntry;
    
    setDonationType(null);
    setFirstName("");
    setLastName("");
    setCompanyName("");
    setEmail("");
    setIsCreatingCompany(false);
    setAuthModalOpen(false);
    setHasShownAuthModal(false);
    setHasCompletedManualEntry(false);
    
    // If closing while showing auth modal flow and not authenticated, redirect to home
    if (shouldRedirectToHome) {
      setLocation("/");
    }
    onOpenChange(false);
  };

  const handleAuthModalClose = (open: boolean) => {
    setAuthModalOpen(open);
    if (!open && !isAuthenticated && !hasCompletedManualEntry) {
      // User closed auth modal without signing in or selecting "not now"
      // Close donation modal and redirect to home
      handleClose();
    }
  };

  const handleManualEntry = (data: { firstName: string; lastName: string; email: string }) => {
    // User selected "not now" and entered manual info
    // Mark manual entry as completed before creating user
    setHasCompletedManualEntry(true);
    // Create guest user via API - this will handle navigation and closing modals
    createGuestUserMutation.mutate(data);
  };

  // Check if user authenticated after auth modal closes
  useEffect(() => {
    if (hasShownAuthModal && isAuthenticated && authModalOpen) {
      // User signed in, close modals and navigate to donate page (Founders Club)
      setAuthModalOpen(false);
      setHasShownAuthModal(false);
      onOpenChange(false);
      setLocation("/donate");
    }
  }, [isAuthenticated, hasShownAuthModal, authModalOpen, onOpenChange, setLocation]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-4 md:p-6" hideClose>
        <DialogHeader className="text-left px-0">
          <DialogTitle className="flex items-center gap-2 flex-wrap break-words">
            <Heart className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="break-words whitespace-normal">Support Our Mission</span>
          </DialogTitle>
          <DialogDescription className="break-words whitespace-normal">
            Are you donating on behalf of a company or yourself?
          </DialogDescription>
        </DialogHeader>

        {donationType === null ? (
          <div className="space-y-3 py-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4 whitespace-normal"
              onClick={handleSelfClick}
            >
              <User className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="text-left min-w-0 flex-1 overflow-wrap-anywhere">
                <div className="font-semibold break-words">Myself</div>
                <div className="text-sm text-muted-foreground font-normal break-words whitespace-normal">
                  {isAuthenticated
                    ? `Donating as ${user?.firstName || user?.email || "you"}`
                    : "Sign in to track your donations"}
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4 whitespace-normal"
              onClick={handleCompanyClick}
            >
              <Building2 className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="text-left min-w-0 flex-1 overflow-wrap-anywhere">
                <div className="font-semibold break-words">On behalf of a company</div>
                <div className="text-sm text-muted-foreground font-normal break-words whitespace-normal">
                  Create a company account for donation tracking
                </div>
              </div>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first-name" className="break-words">First Name *</Label>
                <Input
                  id="first-name"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-2"
                  disabled={isCreatingCompany}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last-name" className="break-words">Last Name *</Label>
                <Input
                  id="last-name"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-2"
                  disabled={isCreatingCompany}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="company-name" className="break-words">Company Name *</Label>
              <Input
                id="company-name"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-2"
                disabled={isCreatingCompany}
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="break-words">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
                disabled={isCreatingCompany}
                required
              />
            </div>
            <div className="flex gap-2 justify-end flex-wrap">
              <Button
                variant="outline"
                onClick={() => {
                  setDonationType(null);
                  setFirstName("");
                  setLastName("");
                  setCompanyName("");
                  setEmail("");
                }}
                disabled={isCreatingCompany}
                className="break-words"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateCompany}
                disabled={!firstName.trim() || !lastName.trim() || !companyName.trim() || !email.trim() || isCreatingCompany}
                className="break-words"
              >
                {isCreatingCompany ? "Creating..." : "Continue"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
      
      <AuthPromptModal
        open={authModalOpen}
        onOpenChange={handleAuthModalClose}
        onManualEntry={handleManualEntry}
      />
    </Dialog>
  );
}
