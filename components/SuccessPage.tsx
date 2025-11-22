import { useState, useEffect, useCallback, useRef } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Edit, Save, X, Package, CheckCircle2, Truck, Plus, CreditCard } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

// Unsplash Images
const santaGiftsImage = "https://images.unsplash.com/photo-1703753936800-593a07d2285b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW50YSUyMGNsYXVzJTIwZ2lmdHMlMjBwcmVzZW50c3xlbnwxfHx8fDE3NjM3NjIzNzV8MA&ixlib=rb-4.1.0&q=80&w=1080";
const northPoleSnowImage = "https://images.unsplash.com/photo-1673298062288-2df0ce037a1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3J0aCUyMHBvbGUlMjBzbm93JTIwd2ludGVyfGVufDF8fHx8MTc2Mzc2MjM3Nnww&ixlib=rb-4.1.0&q=80&w=1080";
const santaMagicalJourneyProduct = "https://images.unsplash.com/photo-1699369398947-f3779c75bbf2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYW50YSUyMG1hZ2ljYWwlMjBqb3VybmV5JTIwYm9va3xlbnwxfHx8fDE3NjM3NjIzODB8MA&ixlib=rb-4.1.0&q=80&w=1080";
import { UpsellOffer } from "./UpsellOffer";
import { AddAnotherChild } from "./AddAnotherChild";
import { Card } from "./ui/card";
import { CUSTOM_DOMAIN } from "../utils/domainHelper";
import { EmbeddedPaymentForm } from "./EmbeddedPaymentForm";

// Stripe Publishable Key (safe to expose in frontend)
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SIHQT2NsH2CKfRANHrn5PsrTTnvRY0t5QStLGW8W3ihy4dhFVhDX4ZIP3lrOYhA1HPtnflUgDAhDxEZ0TgNB1V000lsmZhQBB';
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface SuccessPageProps {
  onReturnHome: () => void;
}

interface OrderData {
  orderId: string;
  orderDate: string;
  status: string;
  total: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  letterPackages: Array<{
    childFirstName: string;
    childLastName: string;
    friendName: string;
    streetAddress: string;
    unitApt: string;
    city: string;
    state: string;
    zipCode: string;
  }>;
  numberOfPackages: number;
  shippingDate: string;
  monthlySubscription: boolean;
  trackingNumber?: string;
  trackingUrl?: string;
  subscriptionId?: string;
  subscriptionQuantity?: number;
  acceptedUpsells?: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export function SuccessPage({ onReturnHome }: SuccessPageProps) {
  console.log("🔴🔴🔴 SuccessPage COMPONENT RENDERING 🔴🔴🔴");
  console.log("🔴 Render timestamp:", new Date().toISOString());
  console.log("🔴 Component mounted:", true);
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPackages, setEditedPackages] = useState<OrderData['letterPackages']>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showUpsells, setShowUpsells] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [addingUpsell, setAddingUpsell] = useState<string | null>(null);
  const [snowQuantity, setSnowQuantity] = useState(1);
  const [subscriptionQuantity, setSubscriptionQuantity] = useState(1);
  const [defaultLetterPrice, setDefaultLetterPrice] = useState(17.95);
  
  console.log("📊 CURRENT STATE:", {
    hasOrderData: !!orderData,
    orderDataNotNull: orderData !== null,
    isLoading,
    showUpsells,
    showAddChild,
    timestamp: new Date().toISOString()
  });
  
  // Add global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("🚨🚨🚨 GLOBAL ERROR in SuccessPage:", event.error);
      console.error("Error message:", event.message);
      console.error("Error stack:", event.error?.stack);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  //Track component mount/unmount
  useEffect(() => {
    console.log("✅ SuccessPage MOUNTED");
    return () => {
      console.log("❌ SuccessPage UNMOUNTING!");
    };
  }, []);
  const [customQuantity, setCustomQuantity] = useState<string>("");
  const [showCustomQuantity, setShowCustomQuantity] = useState(false);
  const [upsellClientSecret, setUpsellClientSecret] = useState<string | null>(null);
  const [isProcessingUpsell, setIsProcessingUpsell] = useState(false);

  // Get access token from URL or localStorage
  const getAccessToken = () => {
    // First check URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      localStorage.setItem('orderAccessToken', urlToken);
      return urlToken;
    }
    
    // Legacy support: check for old orderId parameter
    const urlOrderId = params.get('orderId');
    if (urlOrderId) {
      return urlOrderId; // Will be handled by server as legacy
    }
    
    // Then check localStorage
    return localStorage.getItem('orderAccessToken');
  };
  
  // Fetch global settings (default prices)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/settings`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        if (response.ok) {
          const settings = await response.json();
          setDefaultLetterPrice(settings.defaultLetterPrice || 17.95);
          console.log("✅ Fetched default letter price:", settings.defaultLetterPrice);
        }
      } catch (error) {
        console.error("❌ Error fetching settings:", error);
        // Keep default value of 17.95
      }
    };
    fetchSettings();
  }, []);

  // Update browser URL to show custom domain (cosmetic only, doesn't navigate)
  useEffect(() => {
    const currentUrl = window.location.href;
    if (currentUrl.includes('figma')) {
      // Show user they're on custom domain (display only)
      console.log(`📍 Viewing on Figma preview. Your actual domain: ${CUSTOM_DOMAIN}`);
    }
  }, []);

  // Check if we should show upsells
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromCheckout = params.get('fromCheckout');
    const skipUpsells = params.get('skipUpsells');
    const completed = params.get('completed');
    
    console.log("🎁 Checking if upsells should show:");
    console.log("  - fromCheckout param:", fromCheckout);
    console.log("  - skipUpsells param:", skipUpsells);
    console.log("  - completed param:", completed);
    
    // ONLY show upsells if coming directly from checkout
    if (fromCheckout === 'true' && !skipUpsells && !completed) {
      const accessToken = getAccessToken();
      console.log("  - accessToken:", accessToken ? "Found" : "Not found");
      
      if (accessToken) {
        // Check if upsells were already shown
        const shownKey = `upsells_shown_${accessToken}`;
        const alreadyShown = sessionStorage.getItem(shownKey);
        console.log("  - alreadyShown:", alreadyShown ? "Yes" : "No");
        
        if (!alreadyShown) {
          console.log("✅ SHOWING UPSELLS - Fresh from checkout!");
          sessionStorage.setItem(shownKey, 'true');
          setShowUpsells(true);
        } else {
          console.log("⏭️ Skipping upsells - already shown this session");
        }
      } else {
        console.log("❌ No access token - cannot show upsells");
      }
    } else {
      console.log("⏭️ Skipping upsells - not from checkout or already completed");
    }
  }, []);

  // Fetch order data - memoized to prevent re-renders
  const fetchOrderData = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log("No access token found - skipping order fetch");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/order/${accessToken}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Validate that we have essential customer data
        console.log("📦 Order loaded:", {
          orderId: data.order.orderId,
          hasCustomerId: !!data.order.stripeCustomerId,
          hasCustomerInfo: !!data.order.customerInfo,
          customerEmail: data.order.customerInfo?.email,
          needsMigration: !data.order.stripeCustomerId
        });
        
        // CRITICAL: Validate we have actual order data before setting state
        if (data.order && data.order.orderId) {
          setOrderData(data.order);
          setEditedPackages(data.order.letterPackages || []);
          console.log("✅ Order data set successfully");
        } else {
          console.error("❌ Invalid order data received:", data);
          // Keep orderData as null so the \"Order Not Found\" screen shows
        }
      } else {
        console.error("Error fetching order: Response not OK", response.status);
      }
    } catch (error) {
      // Only log error if we actually tried to fetch
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log("Network error fetching order - this is normal if not on success page");
      } else {
        console.error("Error fetching order:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle upsell completion - memoized to prevent re-renders
  const handleUpsellComplete = useCallback(async () => {
    console.log("🎉🎉🎉 handleUpsellComplete CALLED!");
    console.log("📍 Current state before completion:", { isLoading, showUpsells, hasOrderData: !!orderData });
    
    // CRITICAL FIX: Set loading state FIRST before hiding upsells
    setIsLoading(true);
    console.log("✅ Set isLoading = true");
    
    // Safety timeout - if we're still loading after 10 seconds, force show the page
    const safetyTimeout = setTimeout(() => {
      console.warn("⚠️ SAFETY TIMEOUT: Still loading after 10s, forcing page to show");
      setIsLoading(false);
      setShowUpsells(false);
    }, 10000);
    
    try {
      // Tiny delay to ensure loading spinner renders before hiding upsells
      await new Promise(resolve => setTimeout(resolve, 50));
      
      setShowUpsells(false);
      console.log("✅ Set showUpsells = false");
      
      const accessToken = getAccessToken();
      console.log("🔑 Access token:", accessToken ? "Found" : "NOT FOUND");
      
      if (accessToken) {
        // Mark upsell flow as complete
        try {
          console.log("📡 Marking upsell flow as complete in backend...");
          await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/upsell/complete`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({ orderToken: accessToken }),
            }
          );
          console.log("✅ Upsell flow marked as complete");
        } catch (error) {
          console.error("❌ Error completing upsell flow:", error);
        }
        
        // Refresh order data to show upsells
        console.log("🔄 Refreshing order data...");
        try {
          await fetchOrderData();
          console.log("✅ Order data refreshed, showing success page");
        } catch (error) {
          console.error("❌ Error fetching order data:", error);
          // Show page anyway
          setIsLoading(false);
        }
      } else {
        console.warn("⚠️ No access token - setting isLoading to false");
        setIsLoading(false); // Reset if no token
      }
      
      // Clear the safety timeout since we completed successfully
      clearTimeout(safetyTimeout);
      console.log("🏁 handleUpsellComplete: Completed successfully");
    } catch (error) {
      console.error("❌ Error in handleUpsellComplete:", error);
      clearTimeout(safetyTimeout);
      setIsLoading(false);
      setShowUpsells(false);
    }
  }, [fetchOrderData, isLoading, showUpsells, orderData]);

  // Call /upsell/complete when arriving from funnel to send final confirmation email
  useEffect(() => {
    const accessToken = getAccessToken();
    const params = new URLSearchParams(window.location.search);
    const fromFunnel = !params.get('fromCheckout'); // If NOT from checkout, assume from funnel
    
    if (accessToken && fromFunnel && !showUpsells) {
      const completeKey = `upsell_complete_sent_${accessToken}`;
      const alreadySent = sessionStorage.getItem(completeKey);
      
      if (!alreadySent) {
        console.log("📧 Marking upsell flow complete and sending confirmation email...");
        sessionStorage.setItem(completeKey, 'true');
        
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/upsell/complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ orderToken: accessToken }),
          }
        ).then(response => {
          if (response.ok) {
            console.log("✅ Confirmation email sent successfully");
          } else {
            console.error("❌ Failed to send confirmation email");
          }
        }).catch(error => {
          console.error("❌ Error sending confirmation email:", error);
        });
      }
    }
  }, [showUpsells]);

  useEffect(() => {
    // Only fetch if we have an access token
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.log("⚠️ SuccessPage loaded without access token - skipping fetch");
      setIsLoading(false);
      return;
    }

    // If showing upsells, don't fetch order data yet
    if (showUpsells) {
      console.log("⏭️ Skipping order fetch - showing upsells first");
      setIsLoading(false);
      return;
    }

    console.log("🔄 Fetching order data (no polling to prevent crashes)...");
    fetchOrderData();
    
    // DISABLED: Polling was causing React crashes during upsell flow
    // The 30-second interval would trigger state updates while showing upsells,
    // causing the component to crash and show a white page
    // 
    // If polling is needed in the future, it must:
    // 1. Check if upsells are active before running
    // 2. Use a ref for the interval to avoid dependency loops
    // 3. Only run when explicitly on the success page (not transitioning)
    // NOTE: fetchOrderData is NOT in dependencies to prevent infinite loops
    // This effect only runs when showUpsells changes
  }, [showUpsells]);

  // Save order ID when payment succeeds
  useEffect(() => {
    const handleOrderComplete = () => {
      // This will be called after successful payment
      fetchOrderData();
    };
    
    window.addEventListener('orderComplete', handleOrderComplete);
    return () => window.removeEventListener('orderComplete', handleOrderComplete);
  }, []);

  // NOTE: Trackdesk conversion tracking is now fired at checkout page immediately after payment
  // No need to fire it again on success page

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original data
      setEditedPackages(orderData?.letterPackages || []);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!orderData) return;
    
    const accessToken = getAccessToken();
    if (!accessToken) {
      setSaveMessage("❌ Access token not found. Please use the link from your email.");
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/order/${accessToken}/update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            letterPackages: editedPackages,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrderData(data.order);
        setIsEditing(false);
        setSaveMessage("✅ Your order has been updated successfully!");
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        const error = await response.json();
        setSaveMessage(`❌ Error: ${error.error || 'Failed to update order'}`);
      }
    } catch (error) {
      console.error("Error updating order:", error);
      setSaveMessage("❌ Failed to update order. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updatePackageField = (index: number, field: string, value: string) => {
    setEditedPackages(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Initiate upsell payment - create payment intent
  const handleInitiateUpsellPayment = async (upsellId: string, upsellName: string, price: number, quantity: number) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      alert("❌ Access token not found.");
      return;
    }
    
    // Check if we have necessary customer data - if missing, silently handle it
    if (!orderData?.stripeCustomerId) {
      console.warn("⚠️ Customer ID missing for order, attempting to continue anyway:", orderData?.orderId);
      // System will attempt to fix this in the backend automatically
    }

    setAddingUpsell(upsellId);

    try {
      // Create payment intent for the upsell
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/order/${accessToken}/create-upsell-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            upsellId,
            upsellName,
            price,
            quantity,
          }),
        }
      );

      if (response.ok) {
        const { clientSecret } = await response.json();
        setUpsellClientSecret(clientSecret);
      } else {
        const error = await response.json();
        alert(`❌ Failed to initialize payment: ${error.error || 'Unknown error'}`);
        setAddingUpsell(null);
      }
    } catch (error: any) {
      console.error('Error initializing upsell payment:', error);
      alert(`❌ ${error.message || 'Failed to initialize payment. Please try again.'}`);
      setAddingUpsell(null);
    }
  };

  // Handle successful upsell payment
  const handleUpsellPaymentSuccess = async (paymentIntentId: string) => {
    console.log('🎉 Payment succeeded! Confirming with backend:', paymentIntentId);
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error('❌ No access token for upsell confirmation');
      alert('❌ Session expired. Please refresh the page.');
      setIsProcessingUpsell(false);
      return;
    }

    try {
      // Confirm the upsell was added
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/order/${accessToken}/confirm-upsell`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            paymentIntentId,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.isSubscription) {
          alert(`✅ Santa's Magical Journey Activated!

🎅 Subscription Details:
• ${data.quantity} ${data.quantity === 1 ? 'child' : 'children'} enrolled
• ${data.monthlyPrice.toFixed(2)}/month

💰 Billing:
• $0.00 charged today
• First billing: January 1st

🎁 2 FREE Bonus Gifts Included:
• Nice List Certificate
• Personalized Autographed Photo of Santa

A separate subscription order has been created. You can view it in your email confirmation!`);
        } else {
          const { upsellName, quantity, total } = data;
          alert(`✅ ${upsellName} added to your order!\n\nQuantity: ${quantity}\nTotal: ${total.toFixed(2)}\n\nYou'll receive a confirmation email shortly.`);
        }
        
        // Reset state
        setUpsellClientSecret(null);
        setAddingUpsell(null);
        setIsProcessingUpsell(false);
        
        // Refresh order data
        await fetchOrderData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Backend error confirming upsell:', errorData);
        alert(`❌ Failed to confirm payment: ${errorData.error || 'Please contact support.'}`);
        setIsProcessingUpsell(false);
        setUpsellClientSecret(null);
        setAddingUpsell(null);
      }
    } catch (error: any) {
      console.error('❌ Network error confirming upsell:', error);
      alert(`❌ Network error: ${error.message || 'Please check your connection and try again.'}`);
      setIsProcessingUpsell(false);
      setUpsellClientSecret(null);
      setAddingUpsell(null);
    }
  };

  // Handle upsell payment error
  const handleUpsellPaymentError = (error: string) => {
    alert(`❌ Payment failed: ${error}`);
    setUpsellClientSecret(null);
    setAddingUpsell(null);
    setIsProcessingUpsell(false);
  };

  // Handle affiliate link click
  const onAffiliateClick = () => {
    console.log('Affiliate link clicked');
    window.location.href = '/?page=affiliate';
  };

  const getShippingDateText = (date: string) => {
    switch (date) {
      case 'nov15': return 'November 15th';
      case 'dec1': return 'December 1st';
      case 'dec10': return 'December 10th';
      case 'dec15': return 'December 15th';
      default: return date;
    }
  };

  // Show upsell flow if needed - CHECK THIS BEFORE isLoading!
  if (showUpsells) {
    console.log("🎁🎁🎁 RENDER PATH: Showing UpsellOffer component");
    const accessToken = getAccessToken();
    if (accessToken) {
      console.log("✅ Access token found, rendering UpsellOffer");
      return <UpsellOffer orderToken={accessToken} onComplete={handleUpsellComplete} />;
    } else {
      console.error("❌ No access token found for upsells!");
      // If no token, show loading while we fix state
      return (
        <div className="min-h-screen bg-gradient-to-b from-green-100 to-red-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      );
    }
  }

  if (isLoading) {
    console.log("⏳⏳⏳ RENDER PATH: Showing loading spinner");
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-100 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }
  
  // CRITICAL: Prevent rendering without order data
  if (!orderData) {
    console.log("⚠️⚠️⚠️ RENDER PATH: No order data, showing helpful message");
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-100 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="mb-6">
            <h2 className="text-2xl mb-2" style={{ fontFamily: "Pacifico, cursive", color: "#dc2626" }}>
              Order Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              We couldn't locate your order. This might be because:
            </p>
            <ul className="text-left text-gray-600 mb-6 max-w-md mx-auto space-y-2">
              <li>• The order link has expired</li>
              <li>• You haven't completed checkout yet</li>
              <li>• There was a temporary connection issue</li>
            </ul>
          </div>
          <Button
            onClick={onReturnHome}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          >
            🎅 Return to Homepage
          </Button>
        </div>
      </div>
    );
  }
  
  console.log("✅✅✅ RENDER PATH: Showing main success page with order data");
  
  // ADMIN DEBUG: Show test upsell button for admins
  const showDebugButton = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'true';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-red-100 p-4 py-8">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-auto">
        {/* Debug Button - Only shows when ?debug=true in URL */}
        {showDebugButton() && (
          <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
            <p className="text-sm text-yellow-800 mb-2">🔧 DEBUG MODE</p>
            <Button
              onClick={() => {
                const accessToken = getAccessToken();
                if (accessToken) {
                  // Clear sessionStorage to allow upsells to show again
                  sessionStorage.removeItem(`upsells_shown_${accessToken}`);
                  setShowUpsells(true);
                } else {
                  alert('No access token found. Cannot test upsells.');
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              🎁 Test Upsell Funnel
            </Button>
          </div>
        )}

        {/* Success Icon */}
        <div className="mb-6 text-center">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 
            className="text-4xl mb-2"
            style={{
              fontFamily: '"Pacifico", cursive',
              color: '#15803d'
            }}
          >
            Order Confirmed! 🎅
          </h1>
          <p className="text-2xl text-gray-700">
            Santa Has Received Your Order!
          </p>
          
          {orderData && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Order #{orderData.orderId.slice(-8)}</p>
              <p>{new Date(orderData.orderDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>



        {/* Order Status */}
        {orderData && (
          <div className="mb-6">
            <div className={`p-4 rounded-lg border-2 ${
              orderData.status === 'fulfilled' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-center gap-3">
                {orderData.status === 'fulfilled' ? (
                  <>
                    <Truck className="w-6 h-6 text-blue-600" />
                    <span className="text-blue-900" style={{ fontWeight: '700' }}>
                      Order Fulfilled - Package Shipped!
                    </span>
                  </>
                ) : (
                  <>
                    <Package className="w-6 h-6 text-yellow-600" />
                    <span className="text-yellow-900" style={{ fontWeight: '700' }}>
                      Order Processing - Elves are preparing your package!
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tracking Information */}
        {orderData?.trackingNumber && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Truck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg mb-2 text-blue-900" style={{ fontWeight: '700' }}>
                  Tracking Information
                </h3>
                <p className="text-gray-700 mb-2">
                  <span style={{ fontWeight: '700' }}>Tracking Number:</span> {orderData.trackingNumber}
                </p>
                {orderData.trackingUrl && (
                  <a 
                    href={orderData.trackingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Track Your Package →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Letter Packages - Editable if not fulfilled */}
        {orderData && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-green-900" style={{ fontWeight: '700' }}>
                Your Letter Packages ({orderData.numberOfPackages})
              </h3>
              {orderData.status !== 'fulfilled' && !orderData.trackingNumber && (
                <Button
                  onClick={handleEditToggle}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4" /> Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" /> Edit Order
                    </>
                  )}
                </Button>
              )}
            </div>

            {saveMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                saveMessage.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {saveMessage}
              </div>
            )}

            <div className="space-y-4">
              {(isEditing ? editedPackages : orderData.letterPackages).map((pkg, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="mb-3" style={{ fontWeight: '700' }}>📦 Package {idx + 1}</p>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Child's First Name</Label>
                          <Input
                            value={pkg.childFirstName}
                            onChange={(e) => updatePackageField(idx, 'childFirstName', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Child's Last Name</Label>
                          <Input
                            value={pkg.childLastName}
                            onChange={(e) => updatePackageField(idx, 'childLastName', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Best Friend's Name</Label>
                        <Input
                          value={pkg.friendName}
                          onChange={(e) => updatePackageField(idx, 'friendName', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Street Address</Label>
                        <Input
                          value={pkg.streetAddress}
                          onChange={(e) => updatePackageField(idx, 'streetAddress', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-sm">City</Label>
                          <Input
                            value={pkg.city}
                            onChange={(e) => updatePackageField(idx, 'city', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">State</Label>
                          <Input
                            value={pkg.state}
                            onChange={(e) => updatePackageField(idx, 'state', e.target.value)}
                            className="mt-1"
                            maxLength={2}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Zip Code</Label>
                          <Input
                            value={pkg.zipCode}
                            onChange={(e) => updatePackageField(idx, 'zipCode', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><span style={{ fontWeight: '700' }}>Child:</span> {pkg.childFirstName} {pkg.childLastName}</p>
                      <p><span style={{ fontWeight: '700' }}>Friend:</span> {pkg.friendName}</p>
                      <p><span style={{ fontWeight: '700' }}>Shipping to:</span> {pkg.streetAddress}{pkg.unitApt ? `, ${pkg.unitApt}` : ''}, {pkg.city}, {pkg.state} {pkg.zipCode}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {isEditing && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-sm text-gray-600">
                <span style={{ fontWeight: '700' }}>Shipping Date:</span> {getShippingDateText(orderData.shippingDate)}
              </p>
              {orderData.monthlySubscription && (
                <p className="text-sm text-gray-600 mt-1">
                  <span style={{ fontWeight: '700' }}>Subscription:</span> Santa's Magical Adventures (Monthly)
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Add Another Child Section - Compact version right below letter packages */}
        {orderData && !showAddChild && (
          <Card className="mb-6 p-4 bg-gradient-to-r from-green-50 to-red-50 border-2 border-green-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg" style={{ fontFamily: "Pacifico, cursive", color: "#15803d" }}>
                    Need Another Letter Package? 🎁
                  </h3>
                  <p className="text-sm text-gray-600">
                    Add more children to your order!
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowAddChild(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full"
                style={{ fontWeight: "700" }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Package
              </Button>
            </div>
          </Card>
        )}

        {/* Add Another Child Form */}
        {showAddChild && orderData && (
          <Card className="mb-6 p-6">
            <AddAnotherChild
              orderToken={getAccessToken() || ""}
              isFulfilled={orderData.status === "fulfilled"}
              packagePrice={defaultLetterPrice}
              onSuccess={() => {
                setShowAddChild(false);
                fetchOrderData(); // Refresh order data
              }}
              onCancel={() => setShowAddChild(false)}
            />
          </Card>
        )}
        
        {/* Santa Image */}
        <div className="mb-6 text-center">
          <img 
            src={santaGiftsImage}
            alt="Santa with gifts"
            className="w-64 h-auto mx-auto"
          />
        </div>
        
        {/* Subscription Info - If Active */}
        {orderData?.monthlySubscription && orderData.subscriptionId && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl flex-shrink-0">🎅</div>
              <div>
                <h3 className="text-xl text-purple-900 mb-2" style={{ fontWeight: '700' }}>
                  Santa's Magical Journey - Active! ✨
                </h3>
                <p className="text-purple-800 mb-2">
                  You've joined Santa's monthly adventure! Your child will receive personalized letters from Santa every month.
                </p>
                <div className="bg-white rounded-lg p-3 mt-3">
                  <p className="text-sm text-gray-700">
                    <strong>Children Enrolled:</strong> {orderData.subscriptionQuantity || 1}
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    <strong>🎁 2 FREE Bonus Gifts Included:</strong>
                  </p>
                  <ul className="text-sm text-purple-700 ml-4 mt-1">
                    <li>• Nice List Certificate</li>
                    <li>• Personalized Autographed Photo of Santa</li>
                  </ul>
                  <p className="text-sm text-green-700 mt-2">
                    <strong>💰 First billing: January 1st</strong> (${(12 * (orderData.subscriptionQuantity || 1)).toFixed(2)}/month)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Upsells Purchased */}
        {orderData?.acceptedUpsells && orderData.acceptedUpsells.length > 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg text-blue-900 mb-3" style={{ fontWeight: '700' }}>
              ✨ Additional Items in Your Order
            </h3>
            <div className="space-y-2">
              {orderData.acceptedUpsells.map((upsell, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-900" style={{ fontWeight: '600' }}>
                      {upsell.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantity: {upsell.quantity} × ${upsell.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-green-700" style={{ fontWeight: '700' }}>
                    ${upsell.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Upsells Section - Show if user didn't accept during upsell funnel */}
        {orderData && (!orderData.acceptedUpsells || !orderData.acceptedUpsells.some(u => u.name === "Certified North Pole Snow")) && (
          <Card className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300">
            <div className="text-center mb-4">
              <h3 className="text-2xl mb-2" style={{ fontFamily: "Pacifico, cursive", color: "#2563eb" }}>
                ❄️ Add Certified North Pole Snow! ❄️
              </h3>
              <p className="text-gray-700">
                Authentic snow from Santa's workshop - expands 100x with water!
              </p>
            </div>

            {/* Product Image */}
            <div className="flex justify-center mb-4">
              <img 
                src={northPoleSnowImage} 
                alt="Certified North Pole Snow" 
                className="w-64 h-64 object-contain rounded-lg"
              />
            </div>

            <div className="bg-white rounded-lg p-6 mb-4">
              <div className="text-center mb-4">
                <div className="text-5xl text-orange-600 mb-2" style={{ fontFamily: "Pacifico, cursive" }}>
                  $7.99
                </div>
                <p className="text-sm text-gray-600">each</p>
                <div className="mt-3 bg-green-50 border-2 border-green-400 rounded-lg p-3">
                  <p className="text-green-800 font-bold">
                    💰 You Save $2.00!
                  </p>
                  <p className="text-green-700 text-sm">
                    That's 20% OFF!
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-center mb-3 font-semibold">
                  Quantity:
                </label>
                {!showCustomQuantity ? (
                  <>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <Button
                          key={num}
                          type="button"
                          variant={snowQuantity === num ? "default" : "outline"}
                          className={snowQuantity === num ? "bg-blue-600 hover:bg-blue-700" : ""}
                          onClick={() => {
                            setSnowQuantity(num);
                            setCustomQuantity("");
                          }}
                          disabled={addingUpsell === "upsell_north_pole_snow"}
                        >
                          {num}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-green-50 border-green-500 text-green-700 hover:bg-green-100"
                        onClick={() => setShowCustomQuantity(true)}
                        disabled={addingUpsell === "upsell_north_pole_snow"}
                      >
                        +
                      </Button>
                    </div>
                    <p className="text-center text-sm text-blue-600 mt-2">
                      ✓ One per letter package • Click + for more
                    </p>
                  </>
                ) : (
                  <div className="max-w-xs mx-auto">
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        min="6"
                        max="100"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.value)}
                        placeholder="Enter quantity (6+)"
                        className="text-center"
                        disabled={addingUpsell === "upsell_north_pole_snow"}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCustomQuantity(false);
                          setCustomQuantity("");
                          setSnowQuantity(1);
                        }}
                        disabled={addingUpsell === "upsell_north_pole_snow"}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-2">
                      Enter quantity 6 or more
                    </p>
                  </div>
                )}
              </div>

              {/* Stripe Payment Form */}
              {!upsellClientSecret ? (
                <Button
                  onClick={() => {
                    const qty = showCustomQuantity && customQuantity ? parseInt(customQuantity) : snowQuantity;
                    if (showCustomQuantity && (!customQuantity || qty < 6)) {
                      alert("Please enter a quantity of 6 or more");
                      return;
                    }
                    handleInitiateUpsellPayment("upsell_north_pole_snow", "Certified North Pole Snow", 7.99, qty);
                  }}
                  disabled={addingUpsell === "upsell_north_pole_snow"}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                >
                  {addingUpsell === "upsell_north_pole_snow" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading Payment Form...
                    </>
                  ) : (
                    <>
                      ✅ YES! Add {showCustomQuantity && customQuantity ? customQuantity : snowQuantity}x to My Order (${(7.99 * (showCustomQuantity && customQuantity ? parseInt(customQuantity) : snowQuantity)).toFixed(2)})
                    </>
                  )}
                </Button>
              ) : (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-5 h-5 text-yellow-700" />
                    <h4 className="font-semibold text-yellow-900">Secure Payment Required</h4>
                  </div>
                  <p className="text-sm text-yellow-800 mb-4">
                    For your security, please enter your card information to complete this purchase
                  </p>
                  
                  <Elements stripe={stripePromise}>
                    <EmbeddedPaymentForm
                      clientSecret={upsellClientSecret}
                      onSuccess={handleUpsellPaymentSuccess}
                      onError={handleUpsellPaymentError}
                      isProcessing={isProcessingUpsell}
                      setIsProcessing={setIsProcessingUpsell}
                      buttonText={`Add ${showCustomQuantity && customQuantity ? customQuantity : snowQuantity}x to Order (${(7.99 * (showCustomQuantity && customQuantity ? parseInt(customQuantity) : snowQuantity)).toFixed(2)})`}
                      buttonEmoji="✅"
                    />
                  </Elements>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUpsellClientSecret(null);
                      setAddingUpsell(null);
                    }}
                    className="w-full mt-3"
                    disabled={isProcessingUpsell}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">Features:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Certified authentic from the North Pole</li>
                <li>✓ Expands up to 100x its original size</li>
                <li>✓ Looks and feels like real snow</li>
                <li>✓ Safe, non-toxic, and reusable</li>
                <li>✓ Perfect for Christmas decorations and photos</li>
                <li>✓ Makes approximately 2 gallons of snow</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Add Subscription Upsell - Show if user didn't subscribe during funnel */}
        {orderData && !orderData.monthlySubscription && !orderData.subscriptionId && !((orderData as any).upsellsAccepted?.some((u: any) => u.isSubscription)) && (
          <Card className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
            <div className="text-center mb-4">
              <h3 className="text-2xl mb-2" style={{ fontFamily: "Pacifico", color: "#9333ea" }}>
                🎅 Get 2 Free Extra Gifts - Join Santa's Magical Journey! 🎄
              </h3>
              <p className="text-gray-700">
                Monthly personalized letters from Santa all year long!
              </p>
            </div>

            {/* Product Image */}
            <div className="flex justify-center mb-4">
              <img 
                src={santaMagicalJourneyProduct} 
                alt="Santa's Magical Journey - Monthly Letters" 
                className="w-full max-w-md h-auto object-contain rounded-lg"
              />
            </div>

            <div className="bg-white rounded-lg p-6 mb-4">
              <div className="text-center mb-4">
                <div className="text-5xl text-purple-600 mb-2" style={{ fontFamily: "Pacifico, cursive" }}>
                  $12/month
                </div>
                <p className="text-sm text-gray-600">per child • cancel anytime</p>
                <div className="mt-3 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3">
                  <p className="text-yellow-900" style={{ fontWeight: '700' }}>
                    🎁 Get 2 FREE Bonus Gifts:
                  </p>
                  <ul className="text-yellow-800 text-sm mt-2 space-y-1">
                    <li>• Nice List Certificate</li>
                    <li>• Personalized Autographed Photo of Santa</li>
                  </ul>
                  <p className="text-purple-700 text-sm mt-2" style={{ fontWeight: '600' }}>
                    💰 $0 Today - Billing Starts January 1st
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-center mb-3" style={{ fontWeight: '600' }}>
                  How many children?
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={subscriptionQuantity === num ? "default" : "outline"}
                      className={subscriptionQuantity === num ? "bg-purple-600 hover:bg-purple-700" : ""}
                      onClick={() => setSubscriptionQuantity(num)}
                      disabled={addingUpsell === "upsell_subscription"}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <p className="text-center text-sm text-purple-600 mt-2">
                  ${(12 * subscriptionQuantity).toFixed(2)}/month for {subscriptionQuantity} {subscriptionQuantity === 1 ? 'child' : 'children'}
                </p>
              </div>

              {/* Stripe Payment Form */}
              {!upsellClientSecret || addingUpsell !== "upsell_subscription" ? (
                <Button
                  onClick={() => handleInitiateUpsellPayment("upsell_subscription", "Santa's Magical Journey", 12.00, subscriptionQuantity)}
                  disabled={addingUpsell === "upsell_subscription"}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
                >
                  {addingUpsell === "upsell_subscription" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Loading Payment Form...
                    </>
                  ) : (
                    <>
                      🎅 YES! Start Monthly Letters ($0 Today - Billing Starts Jan 1st)
                    </>
                  )}
                </Button>
              ) : (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-5 h-5 text-yellow-700" />
                    <h4 className="font-semibold text-yellow-900">Secure Payment Required</h4>
                  </div>
                  <p className="text-sm text-yellow-800 mb-4">
                    Enter your card information to secure your subscription. <strong>$0 charged today</strong> - billing begins January 1st.
                  </p>
                  
                  <Elements stripe={stripePromise}>
                    <EmbeddedPaymentForm
                      clientSecret={upsellClientSecret}
                      onSuccess={handleUpsellPaymentSuccess}
                      onError={handleUpsellPaymentError}
                      isProcessing={isProcessingUpsell}
                      setIsProcessing={setIsProcessingUpsell}
                      buttonText={`Start Subscription - $0 Today`}
                      buttonEmoji="🎅"
                    />
                  </Elements>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUpsellClientSecret(null);
                      setAddingUpsell(null);
                    }}
                    className="w-full mt-3"
                    disabled={isProcessingUpsell}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-800 mb-2">What You'll Get Each Month:</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Personalized letter from Santa with child's name</li>
                <li>✓ Updates about Santa's workshop and the North Pole</li>
                <li>✓ Encouragement for good behavior and achievements</li>
                <li>✓ Seasonal activities and fun facts</li>
                <li>✓ Magical keepsakes your child will treasure</li>
                <li>✓ Cancel anytime - no long-term commitment</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Confirmation Details */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6 text-left">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">🎄</div>
              <p className="text-gray-700">
                Your personalized letter(s) from Santa will be mailed on your selected date!
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">📧</div>
              <p className="text-gray-700">
                A confirmation email has been sent with your order details. Save this link to check your order status anytime!
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">🎁</div>
              <p className="text-gray-700">
                Your order includes TWO FREE GIFTS: Santa Stop Here door hanger and Magical Stickers!
              </p>
            </div>
          </div>
        </div>
        
        {/* What Happens Next */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6 text-left">
          <h3 className="text-xl mb-3 text-blue-900" style={{ fontWeight: '700' }}>
            What Happens Next?
          </h3>
          <ol className="space-y-2 text-gray-700">
            <li className="flex gap-2">
              <span className="flex-shrink-0">1️⃣</span>
              <span>Santa's elves will carefully prepare your personalized package</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">2️⃣</span>
              <span>Your package will be mailed on the date you selected</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">3️⃣</span>
              <span>You'll receive tracking information via email once it ships</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0">4️⃣</span>
              <span>Watch the magic happen when your child receives their letter!</span>
            </li>
          </ol>
        </div>
        
        {/* Customer Support */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Questions? Our customer support team is here to help!
          </p>
          <p className="text-sm text-gray-600">
            📞 Available 7 Days a Week: 9am to 7pm EST
          </p>
        </div>
        
        {/* Return Home Button */}
        <div className="text-center">
          <Button 
            onClick={onReturnHome}
            className="bg-green-500 hover:bg-green-600 text-white px-12 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all text-lg"
            style={{ fontWeight: '700' }}
          >
            Return to Home
          </Button>
        </div>
        
        <p className="mt-6 text-xs text-gray-500 text-center">
          Bookmark this page to check your order status and tracking information
        </p>
        
        <div className="mt-4 flex items-center justify-center">
          <button 
            onClick={onAffiliateClick}
            className="text-gray-400 hover:text-gray-600 text-xs underline"
          >
            🎁 Affiliate Partners
          </button>
        </div>
      </div>
    </div>
  );
}
