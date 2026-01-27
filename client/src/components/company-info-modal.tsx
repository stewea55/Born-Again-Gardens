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
import { Building2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CompanyInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: { firstName: string; lastName: string; companyName: string; email: string }) => void;
  onCancel?: () => void;
}

export function CompanyInfoModal({ open, onOpenChange, onSuccess, onCancel }: CompanyInfoModalProps) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const createCompanyUserMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; companyName: string; email: string }) => {
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
    onSuccess: (data, variables) => {
      toast({
        title: "Company account created",
        description: `Donating as ${variables.companyName}`,
      });
      setIsCreatingCompany(false);
      onSuccess(variables);
      handleClose();
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
    setFirstName("");
    setLastName("");
    setCompanyName("");
    setEmail("");
    setIsCreatingCompany(false);
    const wasCompleted = hasCompleted;
    setHasCompleted(false);
    onOpenChange(false);
    // If modal was closed without completing the form, call onCancel
    if (!wasCompleted && onCancel) {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-4 md:p-6">
        <DialogHeader className="text-left px-0">
          <DialogTitle className="flex items-center gap-2 flex-wrap break-words">
            <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="break-words whitespace-normal">Company Information</span>
          </DialogTitle>
          <DialogDescription className="break-words whitespace-normal">
            Please provide your company information to continue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="modal-first-name" className="break-words">First Name *</Label>
              <Input
                id="modal-first-name"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2"
                disabled={isCreatingCompany}
                required
              />
            </div>
            <div>
              <Label htmlFor="modal-last-name" className="break-words">Last Name *</Label>
              <Input
                id="modal-last-name"
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
            <Label htmlFor="modal-company-name" className="break-words">Company Name *</Label>
            <Input
              id="modal-company-name"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-2"
              disabled={isCreatingCompany}
              required
            />
          </div>
          <div>
            <Label htmlFor="modal-email" className="break-words">Email Address *</Label>
            <Input
              id="modal-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              disabled={isCreatingCompany}
              required
            />
          </div>
          <div className="flex gap-2 justify-end flex-wrap pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isCreatingCompany}
              className="break-words"
            >
              Cancel
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
      </DialogContent>
    </Dialog>
  );
}
