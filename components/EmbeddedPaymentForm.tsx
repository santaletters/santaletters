import { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface EmbeddedPaymentFormProps {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string, paymentIntentId?: string, declineCode?: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  buttonText?: string;
  buttonEmoji?: string;
}

export function EmbeddedPaymentForm({
  clientSecret,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
  buttonText = "Complete Order",
  buttonEmoji = "🎅"
}: EmbeddedPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Form submitted! Client secret:', clientSecret?.substring(0, 20) + '...');

    if (!stripe || !elements) {
      console.error('❌ Stripe or Elements not loaded');
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      console.error('❌ Card element not found');
      return;
    }

    console.log('✅ Starting payment processing...');
    setIsProcessing(true);
    setCardError(null);

    try {
      // Detect if this is a SetupIntent (subscription) or PaymentIntent (regular payment)
      const isSetupIntent = clientSecret.startsWith('seti_');
      console.log('🔍 Payment type:', isSetupIntent ? 'SetupIntent (subscription)' : 'PaymentIntent (regular)');
      
      if (isSetupIntent) {
        console.log("🔄 Confirming setup (subscription)...");

        const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (error) {
          console.error("❌ Setup failed:", error);
          const declineMessage = error.message || "Setup failed";
          const declineCode = error.code || "unknown";
          const setupIntentId = setupIntent?.id;
          
          setCardError(declineMessage);
          onError(declineMessage, setupIntentId, declineCode);
          setIsProcessing(false);
        } else if (setupIntent && setupIntent.status === 'succeeded') {
          console.log("✅ Setup succeeded!", setupIntent.id);
          onSuccess(setupIntent.id);
        } else if (setupIntent) {
          console.error("❌ Setup not succeeded. Status:", setupIntent.status);
          const declineMessage = `Setup ${setupIntent.status}`;
          onError(declineMessage, setupIntent.id, setupIntent.status);
          setIsProcessing(false);
        }
      } else {
        console.log("🔄 Confirming payment...");

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (error) {
          console.error("❌ Payment failed:", error);
          console.error("❌ Payment Intent:", paymentIntent);
          
          // Get decline information
          const declineMessage = error.message || "Payment failed";
          const declineCode = error.decline_code || error.code || "unknown";
          const paymentIntentId = paymentIntent?.id || error.payment_intent?.id;
          
          setCardError(declineMessage);
          onError(declineMessage, paymentIntentId, declineCode);
          setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          console.log("✅ Payment succeeded!", paymentIntent.id);
          onSuccess(paymentIntent.id);
        } else if (paymentIntent) {
          // Payment intent exists but not succeeded - this is also a decline
          console.error("❌ Payment not succeeded. Status:", paymentIntent.status);
          const declineMessage = `Payment ${paymentIntent.status}`;
          onError(declineMessage, paymentIntent.id, paymentIntent.status);
          setIsProcessing(false);
        }
      }
    } catch (err: any) {
      console.error("❌ Payment error:", err);
      setCardError(err.message || "An unexpected error occurred");
      onError(err.message || "An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#1f2937',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#9ca3af',
        },
        iconColor: '#dc2626',
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Input */}
      <div>
        <label className="block mb-2 text-gray-700">
          Card Information
        </label>
        <div className="p-4 border-2 border-gray-200 rounded-lg bg-white transition-all hover:border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200">
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>
        {cardError && (
          <p className="text-red-600 text-sm mt-2">⚠️ {cardError}</p>
        )}
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600 py-2">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Secured by Stripe - Your payment info is safe</span>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing || !cardComplete}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-6 text-lg rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        style={{ fontFamily: 'Pacifico, cursive' }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            {buttonEmoji} {buttonText}
          </>
        )}
      </Button>
      
      {!cardComplete && !isProcessing && (
        <p className="text-sm text-gray-500 text-center mt-2">
          Please complete your card information above
        </p>
      )}

      {/* Payment Methods */}
      <div className="text-center text-xs text-gray-500 pt-2">
        We accept Visa, Mastercard, American Express, and Discover
      </div>
    </form>
  );
}
