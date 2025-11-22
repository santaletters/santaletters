import { useState, useEffect, useRef } from "react";
import { loadStripe, type StripePaymentRequest } from '@stripe/stripe-js';
import { Elements, useStripe, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EmbeddedPaymentForm } from "./EmbeddedPaymentForm";
import { Footer } from "./Footer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { CheckCircle2, Shield, CreditCard, Edit, ArrowRight, Trash2, User } from "lucide-react";
import type { LetterPackage } from "./LetterForm";
import { getAffiliateAttribution } from "../utils/affiliateTracking";
import { projectId, publicAnonKey } from "../utils/supabase/info";

// Unsplash Images
const santaGiftsImage = "https://images.unsplash.com/photo-1703753936800-593a07d2285b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW50YSUyMGNsYXVzJTIwZ2lmdHMlMjBwcmVzZW50c3xlbnwxfHx8fDE3NjM3NjIzNzV8MA&ixlib=rb-4.1.0&q=80&w=1080";
const snowmanFooter = "https://images.unsplash.com/photo-1704394603705-0c30d98e67bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHJpc3RtYXMlMjBzbm93bWFuJTIwZGVjb3JhdGlvbnxlbnwxfHx8fDE3NjM3NjIzNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const santaLogo = "https://images.unsplash.com/photo-1762417582191-e69cd1cb0609?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW50YSUyMGNsYXVzJTIwbG9nb3xlbnwxfHx8fDE3NjM3NjIzNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const redRibbonBanner = "https://images.unsplash.com/photo-1544724586-e364c71e2b55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjByaWJib24lMjBiYW5uZXJ8ZW58MXx8fHwxNzYzNzYyMzc2fDA&ixlib=rb-4.1.0&q=80&w=1080";
const santaWithGifts = "https://images.unsplash.com/photo-1703753936800-593a07d2285b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW50YSUyMGNsYXVzJTIwZ2lmdHMlMjBwcmVzZW50c3xlbnwxfHx8fDE3NjM3NjIzNzV8MA&ixlib=rb-4.1.0&q=80&w=1080";
const moneyBackBadge = "https://images.unsplash.com/photo-1728057213505-775a6ebebf29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25leSUyMGJhY2slMjBndWFyYW50ZWUlMjBiYWRnZXxlbnwxfHx8fDE3NjM3NjIzNzd8MA&ixlib=rb-4.1.0&q=80&w=1080";
const safeCheckoutBanner = "https://images.unsplash.com/photo-1580062329539-c76d0cce5c4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cmUlMjBwYXltZW50JTIwYmFkZ2VzfGVufDF8fHx8MTc2Mzc2MjM3N3ww&ixlib=rb-4.1.0&q=80&w=1080";
const trustBadges = "https://images.unsplash.com/photo-1580062329539-c76d0cce5c4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWN1cmUlMjBwYXltZW50JTIwYmFkZ2VzfGVufDF8fHx8MTc2Mzc2MjM3N3ww&ixlib=rb-4.1.0&q=80&w=1080";
const cardLogos = "https://images.unsplash.com/photo-1658842244540-883aff68fb78?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVkaXQlMjBjYXJkJTIwbG9nb3N8ZW58MXx8fHwxNzYzNzYyMzc4fDA&ixlib=rb-4.1.0&q=80&w=1080";

// Stripe Publishable Key (safe to expose in frontend)
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SIHQT2NsH2CKfRANHrn5PsrTTnvRY0t5QStLGW8W3ihy4dhFVhDX4ZIP3lrOYhA1HPtnflUgDAhDxEZ0TgNB1V000lsmZhQBB';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Trackdesk Conversion Tracking - Fire immediately after successful payment
function fireTrackdeskConversion(
  orderId: string, 
  customerEmail: string, 
  totalRevenue: number, 
  numberOfPackages: number,
  hasSubscription: boolean
) {
  console.log('📊 Firing Trackdesk conversion via advertiser postback...');
  
  // Check if conversion already fired for this order (prevent duplicates)
  const conversionKey = `trackdesk_conversion_${orderId}`;
  if (sessionStorage.getItem(conversionKey)) {
    console.log('✅ Trackdesk conversion already fired for this order');
    return;
  }

  // Get the Trackdesk CID from sessionStorage
  const cid = sessionStorage.getItem('trackdesk_cid');
  
  if (!cid) {
    console.warn('⚠️ No Trackdesk CID found - skipping conversion tracking');
    return;
  }

  try {
    // Fire the conversion postback to our backend (which forwards to Trackdesk)
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/trackdesk/conversion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({
        cid: cid,
        amount: totalRevenue,
        externalId: orderId,
        customerId: customerEmail,
        advS1: `packages_${numberOfPackages}`,
        advS2: hasSubscription ? 'with_subscription' : 'one_time',
        advS3: `revenue_${totalRevenue.toFixed(2)}`,
        status: 'CONVERSION_STATUS_APPROVED'
      }),
    })
      .then(response => response.json())
      .then(data => {
        console.log('✅ Trackdesk conversion postback fired successfully:', data);
        // Mark as fired
        sessionStorage.setItem(conversionKey, 'true');
      })
      .catch(error => {
        console.error('❌ Error firing Trackdesk conversion:', error);
      });
  } catch (error) {
    console.error('❌ Error preparing Trackdesk conversion:', error);
  }
}

interface CheckoutProps {
  letterPackages: LetterPackage[];
  onBack: () => void;
  onAddAnotherLetter: () => void;
  onEditPackage: (packageIndex: number) => void;
  onDeletePackage: (packageIndex: number) => void;
  onOrderComplete: (orderToken: string, subscriptionAccepted: boolean) => void;
  onGoToPrivacy?: () => void;
  onGoToTerms?: () => void;
  onGoToContact?: () => void;
}

const BILLING_STORAGE_KEY = "santaBillingData";

// Express Checkout Button Component (must be separate to use useStripe hook)
interface ExpressCheckoutButtonProps {
  letterPackages: LetterPackage[];
  grandTotal: number;
  monthlySubscription: boolean;
  billingData: any;
  affiliateId: string | null;
  subIds: Record<string, string>;
  onOrderComplete: (orderToken: string, subscriptionAccepted: boolean) => void;
}

function ExpressCheckoutButton({ 
  letterPackages, 
  grandTotal, 
  monthlySubscription, 
  billingData, 
  affiliateId, 
  subIds, 
  onOrderComplete 
}: ExpressCheckoutButtonProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<StripePaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (!stripe || !STRIPE_PUBLISHABLE_KEY || STRIPE_PUBLISHABLE_KEY === 'YOUR_STRIPE_PUBLISHABLE_KEY_HERE') {
      return;
    }

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: `Santa Letters (${letterPackages.length} ${letterPackages.length === 1 ? 'letter' : 'letters'})`,
        amount: Math.round(grandTotal * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    // Check if express checkout is available
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    pr.on('paymentmethod', async (e) => {
      try {
        // Step 1: Create payment intent
        const createResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            amount: Math.round(grandTotal * 100),
            billingData: {
              firstName: e.payerName?.split(' ')[0] || '',
              lastName: e.payerName?.split(' ').slice(1).join(' ') || '',
              email: e.payerEmail || '',
              phone: e.payerPhone || '',
              address: '',
              city: '',
              state: '',
              zip: '',
              shippingDate: billingData.shippingDate || 'dec15'
            },
            monthlySubscription,
          }),
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create payment');
        }

        const { clientSecret, paymentIntentId } = await createResponse.json();

        // Step 2: Confirm payment with the payment method from Apple/Google Pay
        const confirmResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: e.paymentMethod.id,
        });

        if (confirmResult.error) {
          e.complete('fail');
          alert(confirmResult.error.message || 'Payment failed. Please try again.');
          return;
        }

        // Step 3: Save order
        const saveResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/confirm-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            paymentIntentId,
            letterPackages,
            billingData: {
              firstName: e.payerName?.split(' ')[0] || '',
              lastName: e.payerName?.split(' ').slice(1).join(' ') || '',
              email: e.payerEmail || '',
              phone: e.payerPhone || '',
              address: '',
              city: '',
              state: '',
              zip: '',
              shippingDate: billingData.shippingDate || 'dec15'
            },
            monthlySubscription,
            total: grandTotal,
            affiliateId,
            subIds,
          }),
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save order');
        }

        const { success, error, accessToken, orderId } = await saveResponse.json();

        if (success) {
          // 🎯 FIRE TRACKDESK CONVERSION IMMEDIATELY AFTER PAYMENT SUCCESS (Express Checkout)
          fireTrackdeskConversion(
            orderId || 'express-checkout',
            e.payerEmail || '',
            grandTotal,
            letterPackages.length,
            monthlySubscription
          );
          
          // Save access token and update URL to trigger upsells
          localStorage.setItem('orderAccessToken', accessToken);
          window.history.replaceState({}, '', `/?token=${accessToken}&fromCheckout=true`);
          
          e.complete('success');
          onOrderComplete(accessToken, monthlySubscription);
        } else {
          e.complete('fail');
          alert(error || 'Payment failed. Please try again.');
        }
      } catch (error) {
        console.error('Express checkout error:', error);
        e.complete('fail');
        alert('Payment failed. Please try again.');
      }
    });

    // Cleanup function
    return () => {
      setPaymentRequest(null);
      setCanMakePayment(false);
    };
  }, [stripe]); // Only depend on stripe, not grandTotal or letterPackages

  // Update the payment request when total changes
  useEffect(() => {
    if (paymentRequest && canMakePayment) {
      paymentRequest.update({
        total: {
          label: `Santa Letters (${letterPackages.length} ${letterPackages.length === 1 ? 'letter' : 'letters'})`,
          amount: Math.round(grandTotal * 100),
        },
      });
    }
  }, [paymentRequest, grandTotal, letterPackages.length, canMakePayment]);

  if (!paymentRequest || !canMakePayment) {
    return null;
  }

  return (
    <div className="my-6">
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">Express Checkout</span>
        </div>
      </div>
      <PaymentRequestButtonElement 
        options={{ paymentRequest }}
        className="express-checkout-button"
      />
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">Or pay with card</span>
        </div>
      </div>
    </div>
  );
}

// Main Checkout Component
function CheckoutInner({ letterPackages, onBack, onAddAnotherLetter, onEditPackage, onDeletePackage, onOrderComplete, onGoToPrivacy, onGoToTerms, onGoToContact }: CheckoutProps) {
  // Load saved billing data from localStorage
  const [billingData, setBillingData] = useState(() => {
    try {
      const saved = localStorage.getItem(BILLING_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
    }
    return {
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      email: "",
      cardNumber: "",
      expMonth: "",
      expYear: "",
      cvv: "",
      shippingDate: "dec15"
    };
  });

  const [monthlySubscription, setMonthlySubscription] = useState(false);
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // Package pricing based on type
  const getPackagePrice = (pkg: LetterPackage): number => {
    // Check if package has a type (from homepage cart)
    if (pkg.packageType) {
      switch (pkg.packageType) {
        case 'basic':
          return 19.99;
        case 'deluxe':
          return 29.99;
        case 'premium':
          return 59.99;
        default:
          return 17.95; // Fallback for funnel
      }
    }
    // Fallback to default price for /offer funnel orders
    return 17.95;
  };
  
  // Check if we have custom pricing from affiliate link (for /offer funnel only)
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [loadingCustomPrice, setLoadingCustomPrice] = useState(true); // Start as true to prevent price flash
  
  useEffect(() => {
    const fetchCustomPrice = async () => {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      const campaign = params.get('campaign');
      
      // Only fetch custom price if we're in the funnel (packages without type)
      const isFunnelOrder = letterPackages.some(pkg => !pkg.packageType);
      
      if (ref && isFunnelOrder) {
        try {
          const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566`;
          const response = await fetch(`${API_URL}/affiliate/link-price?ref=${ref}${campaign ? `&campaign=${campaign}` : ''}`, {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.customPrice && data.customPrice > 0) {
              console.log('✅ Custom affiliate price loaded:', data.customPrice);
              setCustomPrice(data.customPrice);
            } else {
              console.log('ℹ️ No custom price found for this affiliate link');
            }
          } else {
            console.warn('⚠️ Failed to fetch custom price:', response.status);
          }
        } catch (error) {
          console.error("❌ Error fetching custom price:", error);
          // Don't crash - just use default pricing
        } finally {
          setLoadingCustomPrice(false);
        }
      } else {
        // Not a funnel order or no ref, don't wait for price
        setLoadingCustomPrice(false);
      }
    };
    
    fetchCustomPrice();
  }, [letterPackages]);

  // Calculate totals
  const packageTotal = letterPackages.reduce((sum, pkg) => {
    const price = customPrice !== null && !pkg.packageType ? customPrice : getPackagePrice(pkg);
    console.log(`💰 Package price calculation:`, { packageType: pkg.packageType, customPrice, finalPrice: price });
    return sum + price;
  }, 0);
  const subscriptionTotal = 0; // Subscription is FREE - no upfront charge
  const grandTotal = packageTotal + subscriptionTotal;
  
  console.log(`💰 Checkout totals:`, { packageTotal, subscriptionTotal, grandTotal, customPrice, loadingCustomPrice });

  // Save billing data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(billingData));
    } catch (error) {
      console.error("Error saving billing data:", error);
    }
  }, [billingData]);

  const updateField = (field: string, value: string) => {
    // Validate ZIP code format
    if (field === 'zip') {
      // Only allow digits and dash
      const cleanValue = value.replace(/[^\d-]/g, '');
      // Limit to 5 or 10 characters (for 12345 or 12345-6789 format)
      const limitedValue = cleanValue.slice(0, 10);
      setBillingData(prev => ({ ...prev, [field]: limitedValue }));
    } else {
      setBillingData(prev => ({ ...prev, [field]: value }));
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentIntentError, setPaymentIntentError] = useState<string | null>(null);

  // Get affiliate tracking data from stored attribution (30-day cookie)
  // This supports LAST-CLICK attribution - if user clicked multiple affiliate links,
  // the most recent one gets credit
  const getAffiliateData = () => {
    // First, check URL parameters (in case user just clicked)
    const params = new URLSearchParams(window.location.search);
    const urlAffiliateId = params.get('ref');
    
    // If URL has ref parameter, use that (it's already stored by SalesPage)
    if (urlAffiliateId) {
      const subIds: Record<string, string> = {};
      ['affS1', 'affS2', 'affS3'].forEach(subKey => {
        const value = params.get(subKey);
        if (value) {
          subIds[subKey] = value;
        }
      });
      return { affiliateId: urlAffiliateId, subIds };
    }
    
    // Otherwise, check stored attribution (for returning visitors)
    const attribution = getAffiliateAttribution();
    if (attribution) {
      console.log('💰 Using stored affiliate attribution:', attribution.affiliateId);
      return { 
        affiliateId: attribution.affiliateId, 
        subIds: attribution.subIds 
      };
    }
    
    // No affiliate attribution found
    return { affiliateId: null, subIds: {} };
  };

  const { affiliateId, subIds } = getAffiliateData();

  // Create Payment Intent when essential billing data is complete
  const createPaymentIntent = async () => {
    if (letterPackages.length === 0) {
      console.log("❌ No letter packages");
      return;
    }
    if (clientSecret) {
      console.log("✅ Client secret already exists");
      return; // Already created
    }

    setPaymentIntentError(null); // Clear any previous errors

    try {
      console.log("🔄 Creating payment intent...");
      console.log("📦 Packages:", letterPackages.length);
      console.log("💰 Total:", grandTotal);
      console.log("🔄 Subscription:", monthlySubscription);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          letterPackages,
          billingData,
          monthlySubscription,
          total: grandTotal,
        }),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Server error:", errorData);
        const errorMessage = errorData.error || 'Failed to create payment intent';
        setPaymentIntentError(errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Payment intent created:", data.clientSecret?.substring(0, 20) + '...');
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error("❌ Error creating payment intent:", error);
      setPaymentIntentError(error.message || 'Failed to load payment form. Please refresh and try again.');
    }
  };

  // Check if contact information is valid (email or phone)
  const hasValidContactInfo = () => {
    const hasEmail = billingData.email && billingData.email.includes('@');
    const hasPhone = billingData.phone && billingData.phone.replace(/\D/g, '').length >= 10;
    return hasEmail || hasPhone;
  };

  // Automatically create payment intent when contact info is filled
  useEffect(() => {
    if (!clientSecret && letterPackages.length > 0 && hasValidContactInfo()) {
      console.log("🚀 Auto-creating payment intent - valid contact info detected");
      createPaymentIntent();
    }
  }, [letterPackages.length, clientSecret, billingData.email, billingData.phone])

  // Track payment submit event when component loads
  useEffect(() => {
    if (affiliateId) {
      // Fire payment_submit event
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/affiliate/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          affiliateId,
          eventType: 'payment_submit',
          subIds,
        }),
      }).catch(err => console.error('Failed to track payment submit:', err));
    }
  }, []);

  // Scroll to top when checkout page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 🎯 TRACKDESK LEAD CONVERSION - Fire when checkout page loads (customer reached checkout)
  useEffect(() => {
    console.log('📊 Firing Trackdesk LEAD conversion - customer reached checkout...');
    
    // Check if we already fired the lead conversion for this session
    const leadKey = `trackdesk_lead_fired`;
    if (sessionStorage.getItem(leadKey)) {
      console.log('✅ Trackdesk lead conversion already fired for this session');
      return;
    }

    // Get the Trackdesk CID from sessionStorage
    const cid = sessionStorage.getItem('trackdesk_cid');
    
    if (!cid) {
      console.warn('⚠️ No Trackdesk CID found - skipping lead tracking');
      return;
    }

    try {
      console.log('📊 Firing Trackdesk LEAD conversion via advertiser postback...');

      // Fire the lead postback to our backend (which forwards to Trackdesk)
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/trackdesk/lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          cid: cid,
          advS1: `cart_value_${grandTotal.toFixed(2)}`,
          advS2: `packages_${letterPackages.length}`,
          advS3: monthlySubscription ? 'with_subscription' : 'one_time',
        }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('✅ Trackdesk LEAD postback fired successfully:', data);
          // Mark as fired
          sessionStorage.setItem(leadKey, 'true');
        })
        .catch(error => {
          console.error('❌ Error firing Trackdesk lead:', error);
        });
    } catch (error) {
      console.error('❌ Error preparing Trackdesk lead:', error);
    }
  }, []); // Fire once on mount

  // Handle payment success
  const handlePaymentSuccess = async (intentId: string) => {
    console.log("✅ Payment succeeded, saving order...");
    setPaymentIntentId(intentId);
    
    try {
      // Get affiliate link parameters for order metadata
      const params = new URLSearchParams(window.location.search);
      const affiliateRef = params.get('ref');
      const affiliateCampaign = params.get('campaign');
      
      // Confirm payment and save order
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          paymentIntentId: intentId,
          letterPackages,
          billingData,
          monthlySubscription,
          total: grandTotal,
          affiliateId,
          subIds,
          affiliateRef,
          affiliateCampaign,
          customPrice: customPrice, // Send custom price if it exists
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      const data = await response.json();
      console.log("✅ Order saved:", data.orderId);
      console.log("🔐 Access token generated");
      
      // 🎯 FIRE TRACKDESK CONVERSION IMMEDIATELY AFTER PAYMENT SUCCESS
      fireTrackdeskConversion(
        data.orderId,
        billingData.email,
        grandTotal,
        letterPackages.length,
        monthlySubscription
      );
      
      // Save access token to localStorage for success page access
      localStorage.setItem('orderAccessToken', data.accessToken);
      
      // Also update URL to use token AND mark as fromCheckout to trigger upsells
      window.history.replaceState({}, '', `/?token=${data.accessToken}&fromCheckout=true`);
      
      // Dispatch custom event for success page
      window.dispatchEvent(new CustomEvent('orderComplete'));
      
      // Go to upsell funnel
      onOrderComplete(data.accessToken, monthlySubscription);
    } catch (error) {
      console.error("❌ Error saving order:", error);
      alert("Payment succeeded but there was an error saving your order. Please contact support.");
    }
  };

  // Handle payment error
  const handlePaymentError = async (error: string, paymentIntentId?: string, declineCode?: string) => {
    console.error("❌ Payment error:", error);
    console.error("❌ Payment Intent ID:", paymentIntentId);
    console.error("❌ Decline Code:", declineCode);
    
    // Log the decline to the database
    try {
      const declineData = {
        timestamp: new Date().toISOString(),
        paymentIntentId: paymentIntentId || 'unknown',
        status: 'declined',
        declineReason: error,
        declineCode: declineCode || 'unknown',
        amount: grandTotal,
        customerInfo: {
          name: `${billingData.firstName} ${billingData.lastName}`,
          email: billingData.email,
          phone: billingData.phone || '',
          address: billingData.address,
          city: billingData.city,
          state: billingData.state,
          zip: billingData.zip
        },
        letterPackages: letterPackages,
        numberOfPackages: letterPackages.length,
        affiliateId: affiliateId || null,
        subIds: subIds
      };
      
      console.log("📝 Logging decline to database:", declineData);
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/log-decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(declineData),
      });
      
      if (response.ok) {
        console.log("✅ Decline logged successfully");
      } else {
        console.error("❌ Failed to log decline:", await response.text());
      }
    } catch (err) {
      console.error("❌ Error logging decline:", err);
    }
    
    alert(`Payment failed: ${error}\n\nPlease check your payment information and try again.`);
  };

  const path = window.location.pathname;
  const isMainSite = path !== '/offer' && !path.startsWith('/offer/');

  return (
    <div className="min-h-screen bg-white">
      {/* Promo Banner */}
      <div className="bg-red-600 text-white text-center pt-3 pb-2 md:pt-2 md:pb-2">
        <p>🎄 Get 30% OFF + FREE Shipping + 2 Bonus Gifts! 🎄</p>
        <p className="text-sm">Family Owned and Operated. All orders shipped from the USA!</p>
      </div>

      {/* Header with Santa */}
      <div className="relative bg-gradient-to-b from-blue-900 to-blue-800 text-white overflow-hidden pt-4 pb-10">
        {/* Snowflakes decoration */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 text-white text-2xl">❄</div>
          <div className="absolute top-20 right-20 text-white text-xl">❄</div>
          <div className="absolute top-32 left-1/4 text-white text-lg">❄</div>
          <div className="absolute top-16 right-1/3 text-white text-2xl">★</div>
          <div className="absolute top-24 left-1/3 text-white text-xl">★</div>
          <div className="absolute top-40 right-1/4 text-white text-lg">★</div>
        </div>
        
        <div className="container mx-auto px-4 py-6 relative h-32">
          {isMainSite && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-white hover:text-white hover:bg-white/10 mb-4"
            >
              <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
              Back
            </Button>
          )}
          <div className="flex items-start justify-between">
            {/* Logo - Desktop Only */}
            <div className="hidden md:flex items-center gap-2">
              <img 
                src={santaLogo}
                alt="Santa's Official Letter"
                className="h-16 w-auto"
              />
            </div>
            
            {/* Centered Red Ribbon Banner */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4">
              <img 
                src={redRibbonBanner}
                alt="Send your child a special Letter From Santa"
                className="w-full h-auto"
              />
            </div>
            
            {/* Santa Image - Top Right - Desktop Only */}
            <div className="hidden md:block absolute top-0 right-0 w-72 h-auto pointer-events-none">
              <img 
                src={santaWithGifts}
                alt="Santa with gifts"
                className="w-full h-auto"
                style={{ 
                  filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600">Customize Your Letters</span>
            </div>
            <div className="h-px w-12 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-sm text-gray-600">Complete Order</span>
            </div>
            <div className="h-px w-12 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center">
                3
              </div>
              <span className="text-sm text-gray-400">Letter Sent to Your House</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Order Summary + Money Back Guarantee - Mobile: First, Desktop: Right */}
          <div className="lg:col-span-1 lg:order-2 order-1">
            <div className="lg:sticky lg:top-4">
              {/* Order Summary */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-xl mb-6 text-center border-b pb-4" style={{ fontWeight: '700' }}>Order Summary</h3>
                
                <div className="mb-6 space-y-4">
                  {letterPackages.map((pkg, idx) => {
                    const price = customPrice !== null && !pkg.packageType ? customPrice : getPackagePrice(pkg);
                    return (
                      <div key={idx} className="pb-4 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm" style={{ fontWeight: '600' }}>
                              {pkg.packageName || `Santa Package #${idx + 1}`}
                            </p>
                            {loadingCustomPrice && !pkg.packageType ? (
                              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                            ) : (
                              <p className="text-sm text-gray-600">
                                ${price.toFixed(2)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditPackage(idx)}
                            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-auto py-1 px-2 -mt-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete Santa Package #${idx + 1}?`)) {
                                onDeletePackage(idx);
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-auto py-1 px-2"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Child's Name: {pkg.childFirstName || "Not provided"} {pkg.childLastName || ""}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Ship To: {pkg.city || "Not provided"}, {pkg.state || "XX"}
                      </p>
                      {pkg.streetAddress && (
                        <p className="text-sm text-gray-600 mb-1">
                          {pkg.streetAddress} {pkg.unitApt}
                        </p>
                      )}
                    </div>
                    );
                  })}
                  <Button 
                    variant="link" 
                    className="text-blue-600 p-0 h-auto"
                    onClick={onAddAnotherLetter}
                  >
                    + Add Another Letter
                  </Button>
                </div>

                <div className="border-t pt-4 mb-6">
                  {loadingCustomPrice ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="flex justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="flex justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <div className="h-5 bg-gray-300 rounded w-28"></div>
                        <div className="h-5 bg-gray-300 rounded w-20"></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between mb-2">
                        <span>Sub Total ({letterPackages.length} {letterPackages.length === 1 ? 'package' : 'packages'})</span>
                        <span>${packageTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Shipping</span>
                        <span className="text-green-600">Free</span>
                      </div>
                      {monthlySubscription && (
                        <div className="flex justify-between mb-2 text-green-600">
                          <div>
                            <div>Monthly Letters + 2 FREE Gifts</div>
                            <div className="text-xs text-gray-600">Starts January 2025 - $12/month</div>
                          </div>
                          <span>$0.00</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span style={{ fontWeight: '700' }}>Total Today</span>
                        <span style={{ fontWeight: '700' }}>${grandTotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Money Back Guarantee - Desktop only (below order summary) */}
              <div className="hidden lg:block bg-white rounded-lg p-6 text-center shadow-sm mt-6 border border-gray-200">
                <img 
                  src={moneyBackBadge}
                  alt="100% Money Back Guaranteed"
                  className="w-32 h-32 mx-auto mb-4"
                />
                <h4 className="mb-3" style={{ fontWeight: '700' }}>100% Money Back Guarantee</h4>
                <p className="text-sm text-gray-600 mb-4">
                  If your child doesn't absolutely love their letter, we'll issue you a full 100% refund
                </p>
                <p className="text-sm text-gray-700">
                  No Questions - No Hassle - No Waiting
                </p>
              </div>
            </div>
          </div>

          {/* Form - Mobile: Second, Desktop: Left */}
          <div className="lg:col-span-2 lg:order-1 order-2">
            <div>
              {/* Security Badges */}
              <div className="bg-blue-900 text-white rounded-lg p-6 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8" />
                  <div>
                    <p className="text-sm" style={{ fontWeight: '700' }}>Safe & Secure</p>
                    <p className="text-xs text-blue-200">Order Form</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8" />
                  <div className="text-right">
                    <p className="text-sm" style={{ fontWeight: '700' }}>256-Bit Secure</p>
                    <p className="text-xs text-blue-200">Encryption</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-6">
                <img 
                  src={safeCheckoutBanner}
                  alt="Guaranteed Safe Checkout - Visa, Mastercard, American Express, Discover, 2CO, AES-256bit, PayPal"
                  className="h-16 w-auto max-w-full"
                />
              </div>

              {/* Contact Information - NEW SEPARATE SECTION */}
              <div data-section="contact" className="bg-blue-900 text-white px-6 py-3 rounded-t-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                <h3 style={{ fontWeight: '700' }}>Contact Information</h3>
              </div>
              <div className="border border-blue-900 rounded-b-lg p-6 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    <span style={{ fontWeight: '700' }}>Contact Information:</span> Provide email and/or phone (you can provide both!)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email" className="text-gray-700 mb-2 block" style={{ fontWeight: '700' }}>Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={billingData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={`border-2 h-12 px-4 rounded ${
                        billingData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingData.email.trim())
                          ? 'border-red-500'
                          : billingData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingData.email.trim())
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="your@email.com"
                    />
                    {billingData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingData.email.trim()) && (
                      <p className="text-red-600 text-sm mt-1">Please enter a valid email address</p>
                    )}
                    {billingData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingData.email.trim()) && (
                      <p className="text-green-600 text-sm mt-1">✓ Valid email</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-700 mb-2 block" style={{ fontWeight: '700' }}>Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={billingData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className={`border-2 h-12 px-4 rounded ${
                        billingData.phone && billingData.phone.trim().length < 10
                          ? 'border-red-500'
                          : billingData.phone && billingData.phone.trim().length >= 10
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="(555) 123-4567"
                    />
                    {billingData.phone && billingData.phone.trim().length < 10 && (
                      <p className="text-red-600 text-sm mt-1">Please enter at least 10 digits</p>
                    )}
                    {billingData.phone && billingData.phone.trim().length >= 10 && (
                      <p className="text-green-600 text-sm mt-1">✓ Valid phone number</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div id="billingInfoSection" className="bg-blue-900 text-white px-6 py-3 rounded-t-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <h3 style={{ fontWeight: '700' }}>Billing Information</h3>
              </div>
              <div className="border border-blue-900 rounded-b-lg p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-700 mb-2 block">First Name</Label>
                    <Input
                      id="firstName"
                      value={billingData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      className="border-2 border-gray-300 h-12 px-4 rounded"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-700 mb-2 block">Last Name</Label>
                    <Input
                      id="lastName"
                      value={billingData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      className="border-2 border-gray-300 h-12 px-4 rounded"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <Label htmlFor="address" className="text-gray-700 mb-2 block">Address</Label>
                  <Input
                    id="address"
                    value={billingData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    className="border-2 border-gray-300 h-12 px-4 rounded"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="checkoutCity" className="text-gray-700 mb-2 block">City</Label>
                    <Input
                      id="checkoutCity"
                      value={billingData.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className="border-2 border-gray-300 h-12 px-4 rounded"
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkoutState" className="text-gray-700 mb-2 block">State</Label>
                    <Select value={billingData.state} onValueChange={(value) => updateField("state", value)}>
                      <SelectTrigger className="border-2 border-gray-300 h-12 rounded bg-white">
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="checkoutZip" className="text-gray-700 mb-2 block" style={{ fontWeight: '700' }}>
                      ZIP Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="checkoutZip"
                      value={billingData.zip}
                      onChange={(e) => updateField("zip", e.target.value)}
                      required
                      className={`border-2 h-12 px-4 rounded ${
                        billingData.zip && !/^\d{5}(-\d{4})?$/.test(billingData.zip.trim())
                          ? 'border-red-500'
                          : billingData.zip && /^\d{5}(-\d{4})?$/.test(billingData.zip.trim())
                          ? 'border-green-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="12345"
                    />
                    {billingData.zip && !/^\d{5}(-\d{4})?$/.test(billingData.zip.trim()) && (
                      <p className="text-red-600 text-sm mt-1">Please enter a valid 5-digit US ZIP code</p>
                    )}
                    {billingData.zip && /^\d{5}(-\d{4})?$/.test(billingData.zip.trim()) && (
                      <p className="text-green-600 text-sm mt-1">✓ Valid ZIP code</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Date - REQUIRED */}
              <div className="bg-red-600 text-white px-6 py-3 rounded-t-lg">
                <h3>📅 Choose Your Shipping Date <span className="text-sm">(Required)</span></h3>
              </div>
              <div className="border border-red-600 rounded-b-lg p-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="nov15"
                      checked={billingData.shippingDate === "nov15"}
                      onCheckedChange={() => updateField("shippingDate", "nov15")}
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <Label htmlFor="nov15" className="text-gray-700 cursor-pointer flex items-center gap-2">
                      <span>📆</span> November 15th
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="dec1"
                      checked={billingData.shippingDate === "dec1"}
                      onCheckedChange={() => updateField("shippingDate", "dec1")}
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <Label htmlFor="dec1" className="text-gray-700 cursor-pointer flex items-center gap-2">
                      <span>📆</span> December 1st
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="dec10"
                      checked={billingData.shippingDate === "dec10"}
                      onCheckedChange={() => updateField("shippingDate", "dec10")}
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <Label htmlFor="dec10" className="text-gray-700 cursor-pointer flex items-center gap-2">
                      <span>📆</span> December 10th
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="dec15"
                      checked={billingData.shippingDate === "dec15"}
                      onCheckedChange={() => updateField("shippingDate", "dec15")}
                      className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                    />
                    <Label htmlFor="dec15" className="text-gray-700 cursor-pointer flex items-center gap-2">
                      <span>📆</span> December 15th (Recommended)
                    </Label>
                  </div>
                </div>
                {!billingData.shippingDate && (
                  <p className="text-red-600 text-sm mt-3">⚠️ Please select a shipping date to continue</p>
                )}
              </div>

              {/* Monthly Subscription Upsell - Desktop Version */}
              <div className="hidden lg:block bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg p-6 mb-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Checkbox 
                      id="monthlySubscription"
                      checked={monthlySubscription}
                      onCheckedChange={(checked) => setMonthlySubscription(checked as boolean)}
                      className="mt-1 h-6 w-6 border-2 border-white data-[state=checked]:bg-white data-[state=checked]:text-green-600"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="monthlySubscription" className="cursor-pointer block">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🎁</span>
                        <h4 className="text-lg" style={{ fontWeight: '700' }}>YES! Add Santa's Magical Journey + Get 2 FREE GIFTS!</h4>
                      </div>
                      <p className="text-sm text-white/90 mb-2">
                        Keep the magic alive all year! Get a personalized letter from Santa every month.
                      </p>
                      <div className="bg-white/20 rounded-lg p-3 mb-2">
                        <p className="text-sm mb-1" style={{ fontWeight: '600' }}>✨ Your 2 FREE Bonus Gifts:</p>
                        <ul className="text-sm space-y-1 ml-4">
                          <li>🎄 Santa's Workshop VIP Badge</li>
                          <li>🎅 Nice List Gold Pass</li>
                        </ul>
                        <p className="text-xs text-white/90 mt-2">
                          Both authorized with a personalized Autographed Photo of Santa!
                        </p>
                      </div>
                      <p className="text-xs text-white/80">
                        Only ${12 * letterPackages.length}/month ({letterPackages.length} {letterPackages.length === 1 ? 'child' : 'children'} × $12) starting in January. Cancel anytime with no hassle!
                      </p>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Monthly Subscription Upsell - Mobile Version (Compact) */}
              <div className="lg:hidden bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg p-4 mb-6 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Checkbox 
                      id="monthlySubscriptionMobile"
                      checked={monthlySubscription}
                      onCheckedChange={(checked) => setMonthlySubscription(checked as boolean)}
                      className="mt-0.5 h-5 w-5 border-2 border-white data-[state=checked]:bg-white data-[state=checked]:text-green-600"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="monthlySubscriptionMobile" className="cursor-pointer block">
                      <h4 className="text-sm mb-2" style={{ fontWeight: '700' }}>🎁 YES! Add Santa's Magical Journey + Get 2 FREE GIFTS!</h4>
                      <p className="text-xs text-white/90 mb-2">
                        Keep the magic alive all year! Get a personalized letter from Santa every month. <span style={{ fontWeight: '600' }}>Includes 2 FREE bonus gifts:</span> Santa's Workshop VIP Badge & Nice List Gold Pass (both with personalized autographed photo of Santa!).
                      </p>
                      <p className="text-xs text-white/90" style={{ fontWeight: '600' }}>
                        Only ${12 * letterPackages.length}/month ({letterPackages.length} {letterPackages.length === 1 ? 'child' : 'children'} × $12) starting in January. Cancel anytime!
                      </p>
                    </Label>
                  </div>
                </div>
              </div>

              {/* Payment Information - Embedded Stripe Form */}
              <div ref={paymentSectionRef} className="bg-blue-900 text-white px-6 py-3 rounded-t-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <h3 style={{ fontWeight: '700' }}>Payment Information</h3>
              </div>
              <div className="border border-blue-900 rounded-b-lg p-6 mb-6">
                <div className="mb-6 flex items-center gap-3">
                  <p className="text-sm text-gray-600" style={{ fontWeight: '700' }}>We Accept:</p>
                  <img 
                    src={cardLogos}
                    alt="Visa, Mastercard, American Express, Discover"
                    className="h-5 w-auto"
                  />
                </div>
                
                {/* Embedded Stripe Payment Form */}
                {!hasValidContactInfo() ? (
                  <div className="text-center py-8">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
                      <p className="text-blue-800 mb-3" style={{ fontWeight: '700' }}>
                        📋 Contact Information Required
                      </p>
                      <p className="text-sm text-blue-700 mb-4">
                        Please complete your contact information above to load the payment form.
                      </p>
                      <Button
                        onClick={() => {
                          // Scroll to contact information section
                          const contactSection = document.querySelector('[data-section="contact"]');
                          if (contactSection) {
                            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Go to Contact Information
                      </Button>
                    </div>
                  </div>
                ) : paymentIntentError ? (
                  <div className="text-center py-8">
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-4">
                      <p className="text-red-800 mb-3" style={{ fontWeight: '700' }}>
                        ⚠️ Payment Form Error
                      </p>
                      <p className="text-sm text-red-700 mb-4">
                        {paymentIntentError}
                      </p>
                      <Button
                        onClick={() => {
                          setPaymentIntentError(null);
                          setClientSecret(null);
                          createPaymentIntent();
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : clientSecret ? (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <EmbeddedPaymentForm
                      clientSecret={clientSecret}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  </Elements>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading secure payment form...</p>
                    <p className="text-xs text-gray-500 mt-2">Please check your browser console if this takes too long</p>
                  </div>
                )}


              </div>

              {/* Trust Badges */}
              <div className="flex justify-center mt-6">
                <img 
                  src={trustBadges}
                  alt="TrustLock SSL Secure, Verified Business, Verified Privacy"
                  className="h-12 w-auto"
                />
              </div>
            </div>
          </div>

          {/* Money Back Guarantee - Mobile: Last */}
          <div className="lg:hidden order-3">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
              <img 
                src={moneyBackBadge}
                alt="100% Money Back Guaranteed"
                className="w-32 h-32 mx-auto mb-4"
              />
              <h4 className="mb-3" style={{ fontWeight: '700' }}>100% Money Back Guarantee</h4>
              <p className="text-sm text-gray-600 mb-4">
                If your child doesn't absolutely love their letter, we'll issue you a full 100% refund
              </p>
              <p className="text-sm text-gray-700">
                No Questions - No Hassle - No Waiting
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Wrapper component with Elements provider
export function Checkout(props: CheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutInner {...props} />
    </Elements>
  );
}
