import { useEffect, useState } from "react";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = fetch("/api/payments/config")
      .then((res) => res.json())
      .then((data) => {
        if (!data.publishableKey) {
          throw new Error("Stripe publishable key not found");
        }
        return loadStripe(data.publishableKey);
      })
      .catch((error) => {
        console.error("Error loading Stripe:", error);
        return null;
      });
  }
  return stripePromise;
};

interface StripePaymentFormProps {
  amount: number;
  paymentType: string;
  metadata?: Record<string, string>;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

function PaymentForm({
  amount,
  paymentType,
  metadata = {},
  onSuccess,
  onError,
  disabled = false,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create payment intent when component mounts or amount changes
  useEffect(() => {
    if (!amount || amount <= 0) return;

    const createIntent = async () => {
      try {
        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            amount,
            paymentType,
            metadata,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Failed to create payment intent" }));
          throw new Error(error.error || "Failed to create payment intent");
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        setErrorMessage(error.message || "Failed to initialize payment");
        onError(error.message || "Failed to initialize payment");
      }
    };

    createIntent();
  }, [amount, paymentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      onError("Stripe is not loaded. Please refresh the page.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setIsProcessing(false);
      onError("Card element not found");
      return;
    }

    try {
      // Confirm the payment with the card element
      const { error: submitError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (submitError) {
        setErrorMessage(submitError.message || "Payment failed");
        onError(submitError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      } else {
        setErrorMessage("Payment was not completed");
        onError("Payment was not completed");
        setIsProcessing(false);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setErrorMessage(error.message || "An error occurred during payment");
      onError(error.message || "An error occurred during payment");
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "hsl(var(--foreground))",
        "::placeholder": {
          color: "hsl(var(--muted-foreground))",
        },
      },
      invalid: {
        color: "hsl(var(--destructive))",
      },
    },
    hidePostalCode: true,
  };

  if (!clientSecret) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Initializing payment...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-lg p-4 bg-background">
        <CardElement options={cardElementOptions} />
      </div>
      {errorMessage && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {errorMessage}
        </div>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={isProcessing || disabled || !stripe}>
        {isProcessing ? (
          "Processing Payment..."
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Complete Payment
          </>
        )}
      </Button>
    </form>
  );
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    getStripe().then(setStripe);
  }, []);

  if (!stripe) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Loading payment form...</p>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    mode: "payment",
    amount: Math.round(props.amount * 100), // Convert to cents
    currency: "usd",
  };

  return (
    <Elements stripe={stripe} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}
