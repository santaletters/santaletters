import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle, Loader2, Gift, Sparkles } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface UpsellProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  promoText?: string;
  features?: string[];
  isSubscription?: boolean;
}

interface UpsellOfferProps {
  orderToken: string;
  onComplete: () => void;
}

export function UpsellOffer({ orderToken, onComplete }: UpsellOfferProps) {
  console.log("🚀 UpsellOffer component rendering with orderToken:", orderToken);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upsell, setUpsell] = useState<UpsellProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [shouldComplete, setShouldComplete] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [isDownsell, setIsDownsell] = useState(false);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes = 120 seconds
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const hasRedirectedRef = useRef(false);
  const autoDeclinedRef = useRef(false);
  
  // Keep the onComplete ref up to date
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  
  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("🚨 CRITICAL ERROR in UpsellOffer:", event.error);
      setCriticalError(event.error?.message || "An unexpected error occurred");
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Countdown timer
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdownInterval);
  }, []);

  // Auto-decline when countdown hits 0
  useEffect(() => {
    if (timeRemaining === 0 && !autoDeclinedRef.current && !completedRef.current && upsell) {
      console.log("⏰ COUNTDOWN EXPIRED at 0:00 - Auto-declining offer");
      autoDeclinedRef.current = true;
      handleDecline();
    }
  }, [timeRemaining, upsell]);

  useEffect(() => {
    console.log("🎬 UpsellOffer component mounted with token:", orderToken);
    loadUpsellOffer();
    
    const safetyTimeout = setTimeout(() => {
      console.warn("⏰ TIMEOUT (180s) - Forcing redirect");
      
      if (hasRedirectedRef.current || completedRef.current) {
        console.log("Already completed/redirected, skipping");
        return;
      }
      
      hasRedirectedRef.current = true;
      completedRef.current = true;
      
      console.log("⏰ TIMEOUT: Calling onComplete callback...");
      try {
        onCompleteRef.current();
        console.log("✅ TIMEOUT: onComplete called");
        
        setTimeout(() => {
          if (document.body.innerHTML.includes("Special Offer") || 
              document.body.innerHTML.includes("Wait! Special Offer")) {
            console.error("🚨 Still on upsell page, forcing redirect!");
            window.location.href = '/success?token=' + orderToken;
          }
        }, 10000);
        
      } catch (err) {
        console.error("❌ TIMEOUT: onComplete failed:", err);
        window.location.href = '/success?token=' + orderToken;
      }
    }, 180000);
    
    return () => clearTimeout(safetyTimeout);
  }, [orderToken]);

  useEffect(() => {
    if (shouldComplete && !completedRef.current) {
      console.log("🎯 Triggering onComplete callback...");
      completedRef.current = true;
      setTimeout(() => {
        console.log("⏰ Calling onComplete() now");
        onCompleteRef.current();
      }, 1500);
    }
  }, [shouldComplete]);

  const loadUpsellOffer = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔄 loadUpsellOffer: Starting for token:", orderToken);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/upsell/get-offer/${orderToken}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log("📡 loadUpsellOffer: Response status:", response.status);
      
      const data = await response.json();
      console.log("📦 loadUpsellOffer: Response data:", data);
      console.log("📦 loadUpsellOffer: noMoreUpsells:", data.noMoreUpsells);
      console.log("📦 loadUpsellOffer: hasUpsell:", !!data.upsell);

      if (!response.ok) {
        console.log("⚠️ loadUpsellOffer: Response not OK, checking noMoreUpsells");
        if (data.noMoreUpsells) {
          console.log("✅ loadUpsellOffer: No more upsells, completing flow");
          setShouldComplete(true);
          return;
        }
        console.error("❌ loadUpsellOffer: Error from API:", data.error);
        throw new Error(data.error || "Failed to load upsell offer");
      }

      if (data.noMoreUpsells) {
        console.log("✅ loadUpsellOffer: No more upsells (success response), completing flow");
        setShouldComplete(true);
        return;
      }

      if (!data.upsell) {
        console.log("⚠️ loadUpsellOffer: No upsell in response, completing flow");
        setShouldComplete(true);
        return;
      }

      // IMPORTANT: Skip North Pole Snow - it's handled by dedicated SnowUpsell/SnowDownsell components
      if (data.upsell.id === "upsell_north_pole_snow" || !data.upsell.isSubscription) {
        console.log("⏭️ Skipping North Pole Snow (already handled by dedicated components), completing flow...");
        setShouldComplete(true);
        return;
      }

      console.log("✅ loadUpsellOffer: Got valid upsell:", data.upsell.name);
      setAccepted(false);
      setProcessing(false);
      setUpsell(data.upsell);
      const suggestedQty = data.suggestedQuantity || 1;
      setQuantity(suggestedQty);
      setAttemptNumber(data.attemptNumber || 1);
      setIsDownsell(data.isDownsell || false);
      
      if (data.attemptNumber === 1 && !originalPrice) {
        setOriginalPrice(data.upsell.price);
      } else if (data.attemptNumber > 1) {
        if (data.upsell.isSubscription) {
          setOriginalPrice(12.00);
        } else {
          setOriginalPrice(9.99);
        }
      }
      console.log("✅ loadUpsellOffer: State updated successfully");
    } catch (err: any) {
      console.error("❌ loadUpsellOffer: Error:", err);
      console.error("❌ loadUpsellOffer: Error stack:", err.stack);
      setError(err.message);
      console.log("📞 loadUpsellOffer: Completing flow due to error");
      setShouldComplete(true);
    } finally {
      setLoading(false);
      console.log("🏁 loadUpsellOffer: Finally block - loading set to false");
    }
  };

  const handleAccept = async () => {
    if (!upsell) return;

    console.log("💳 Accepting upsell:", upsell.name, "Quantity:", quantity);
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/upsell/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            orderToken,
            upsellId: upsell.id,
            quantity,
            source: "upsell_funnel",
          }),
        }
      );

      const data = await response.json();
      console.log("📦 Accept response:", data);

      if (!response.ok) {
        if (response.status === 402) {
          throw new Error(data.error || "Payment was declined. Please check your card.");
        }
        throw new Error(data.error || "Failed to process upsell");
      }

      console.log("✅ Upsell accepted successfully");
      setAccepted(true);
      setProcessing(false);

      setTimeout(() => {
        console.log("⏭️ Loading next upsell offer...");
        setAccepted(false);
        loadUpsellOffer();
      }, 1500);
    } catch (err: any) {
      console.error("❌ Error accepting upsell:", err);
      setError(err.message);
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!upsell) {
      console.log("⚠️ DECLINE called but no upsell, completing flow");
      console.log("📞 Calling onCompleteRef.current() to return to success page");
      if (!completedRef.current) {
        completedRef.current = true;
        try {
          onCompleteRef.current();
          console.log("✅ onCompleteRef.current() called successfully");
        } catch (err) {
          console.error("❌ Error calling onCompleteRef:", err);
          // Force redirect as last resort
          window.location.href = '/success?token=' + orderToken + '&completed=true';
        }
      }
      return;
    }

    console.log("🚫 DECLINE: Starting decline process for upsell:", upsell.id);
    console.log("🚫 DECLINE: orderToken:", orderToken);
    setProcessing(true);

    try {
      console.log("📤 DECLINE: Sending decline request to API...");
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/upsell/decline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            orderToken,
            upsellId: upsell.id,
          }),
        }
      );

      const data = await response.json();
      console.log("📥 DECLINE: Response from API:", data);
      console.log("📥 DECLINE: Response status:", response.status);
      console.log("📥 DECLINE: shouldRetry:", data.shouldRetry);
      console.log("📥 DECLINE: noMoreUpsells:", data.noMoreUpsells);

      if (!response.ok) {
        console.error("❌ DECLINE: API error:", data.error);
        console.log("📞 API error - calling onCompleteRef to return to success page");
        // Even on error, continue to next step
        setProcessing(false);
        if (!completedRef.current) {
          completedRef.current = true;
          try {
            onCompleteRef.current();
            console.log("✅ onCompleteRef.current() called successfully after API error");
          } catch (err) {
            console.error("❌ Error calling onCompleteRef:", err);
            // Force redirect as last resort
            window.location.href = '/success?token=' + orderToken + '&completed=true';
          }
        }
        return;
      }

      if (data.shouldRetry) {
        console.log("📉 DECLINE: Showing downsell offer...");
        setProcessing(false);
        await loadUpsellOffer();
        console.log("✅ DECLINE: loadUpsellOffer completed for downsell");
      } else {
        console.log("✅ DECLINE: All attempts exhausted, moving to next upsell");
        setProcessing(false);
        await loadUpsellOffer();
        console.log("✅ DECLINE: loadUpsellOffer completed for next upsell");
      }
    } catch (err: any) {
      console.error("❌ DECLINE: Error declining upsell:", err);
      console.error("❌ DECLINE: Error stack:", err.stack);
      console.log("📞 Catch error - calling onCompleteRef to return to success page");
      setProcessing(false);
      // Continue anyway
      if (!completedRef.current) {
        completedRef.current = true;
        try {
          onCompleteRef.current();
          console.log("✅ onCompleteRef.current() called successfully after catch");
        } catch (callbackErr) {
          console.error("❌ Error calling onCompleteRef:", callbackErr);
          // Force redirect as last resort
          window.location.href = '/success?token=' + orderToken + '&completed=true';
        }
      }
    }
  };

  // Debug logging
  console.log("🔍 UpsellOffer render state:", {
    shouldComplete,
    loading,
    error,
    criticalError,
    hasUpsell: !!upsell,
    accepted,
    processing,
    completedRef: completedRef.current
  });
  
  try {
    if (completedRef.current) {
      console.log("⚠️ completedRef is true - showing redirect screen");
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-lg text-gray-700 mb-4">Redirecting...</p>
          </Card>
        </div>
      );
    }

    if (criticalError) {
      console.log("🚨 Rendering critical error screen");
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl mb-2" style={{ fontFamily: "Pacifico, cursive" }}>
              Something Went Wrong
            </h2>
            <p className="text-gray-700 mb-4">{criticalError}</p>
            <Button 
              onClick={() => {
                if (!completedRef.current) {
                  completedRef.current = true;
                  onComplete();
                }
              }}
              className="w-full"
            >
              Continue to Order Summary →
            </Button>
          </Card>
        </div>
      );
    }

    if (shouldComplete || completedRef.current) {
      console.log("🎯 Rendering completion screen...");
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl mb-2" style={{ fontFamily: "Pacifico, cursive", color: "#16a34a" }}>
              All Done! 🎉
            </h2>
            <p className="text-lg text-gray-700 mb-4">Taking you to your order summary...</p>
            <div className="mt-4">
              <Loader2 className="w-8 h-8 text-green-600 mx-auto mb-3 animate-spin" />
            </div>
            <Button 
              onClick={() => {
                if (!completedRef.current) {
                  completedRef.current = true;
                }
                onComplete();
              }} 
              variant="outline"
              className="mt-4"
            >
              Continue Now →
            </Button>
          </Card>
        </div>
      );
    }

    if (loading) {
      console.log("⏳ Rendering loading state...");
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-red-600 mx-auto mb-4 animate-spin" />
            <p className="text-lg text-gray-700">Loading special offer...</p>
          </div>
        </div>
      );
    }

    if (error || !upsell) {
      console.log("❌ Error or no upsell:", { error, hasUpsell: !!upsell });
      
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <Loader2 className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-spin" />
            <p className="text-lg text-gray-700 mb-4">Finishing up...</p>
            <p className="text-sm text-gray-500 mb-4">
              {error ? `Error: ${error}` : 'No upsells available'}
            </p>
            <Button 
              onClick={() => {
                if (!completedRef.current) {
                  completedRef.current = true;
                  onComplete();
                }
              }} 
              className="mt-4"
            >
              Continue to Order Summary →
            </Button>
          </Card>
        </div>
      );
    }

    if (accepted && upsell) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
            <h2 className="text-3xl mb-2" style={{ fontFamily: "Pacifico, cursive" }}>
              {upsell.isSubscription ? 'Subscription Started! 🎅' : 'Added to Order! 🎉'}
            </h2>
            <p className="text-gray-700">
              {upsell.isSubscription 
                ? `You're now subscribed to ${upsell.name} for ${quantity} ${quantity === 1 ? 'child' : 'children'}!`
                : `${quantity}x ${upsell.name} has been added to your order.`
              }
            </p>
            <div className="mt-4">
              <Loader2 className="w-6 h-6 text-gray-400 mx-auto animate-spin" />
              <p className="text-sm text-gray-500 mt-2">Loading next offer...</p>
            </div>
          </Card>
        </div>
      );
    }

    if (!upsell) {
      console.error("⚠️ Rendering without valid upsell!");
      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <Loader2 className="w-16 h-16 text-orange-600 mx-auto mb-4 animate-spin" />
            <p className="text-lg text-gray-700 mb-4">Completing order...</p>
            <Button 
              onClick={() => {
                if (!completedRef.current) {
                  completedRef.current = true;
                  onComplete();
                }
              }}
            >
              Continue →
            </Button>
          </Card>
        </div>
      );
    }

  } catch (renderError: any) {
    console.error("🚨 RENDER ERROR:", renderError);
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: "Pacifico, cursive" }}>
            Oops! Something went wrong
          </h2>
          <p className="text-gray-700 mb-4">
            {renderError.message || "An unexpected error occurred"}
          </p>
          <Button 
            onClick={() => {
              if (!completedRef.current) {
                completedRef.current = true;
                onComplete();
              }
            }}
            className="w-full"
          >
            Continue to Order Summary →
          </Button>
        </Card>
      </div>
    );
  }

  // Get messaging based on attempt
  const getHeaderMessage = () => {
    const priceText = upsell.isSubscription ? `${upsell.price.toFixed(2)}/month` : `${upsell.price.toFixed(2)} each`;
    
    if (attemptNumber === 2) {
      return {
        badge: "🎁 FINAL OFFER - LOWEST PRICE!",
        title: "Last Chance! Final Offer! 🔥",
        subtitle: `Rock-bottom price: Only ${priceText} - Our absolute lowest!`
      };
    }
    
    if (upsell.isSubscription) {
      return {
        badge: "🎅 CONTINUE THE MAGIC ALL YEAR!",
        title: "Keep the Christmas Spirit Alive! ✨",
        subtitle: "Starting January 2026 - GET 2 FREE Gifts Today! No charge now!"
      };
    }
    
    return {
      badge: "🎁 EXCLUSIVE ONE-TIME OFFER",
      title: "Wait! Special Offer! ⏰",
      subtitle: "Add this to your order right now!"
    };
  };

  const headerMsg = getHeaderMessage();
  const totalPrice = upsell.price * quantity;

  // COMPACT LAYOUT - Everything above the fold
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 py-3 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Compact Header - Above the fold */}
        <div className="text-center mb-3">
          <Badge className={`${attemptNumber > 1 ? 'bg-orange-600' : 'bg-red-600'} text-white mb-2 px-3 py-1`}>
            {headerMsg.badge}
          </Badge>
          <h1 className="text-4xl md:text-5xl mb-1" style={{ fontFamily: "Pacifico, cursive", color: attemptNumber > 1 ? "#ea580c" : "#dc2626" }}>
            {headerMsg.title}
          </h1>
          <p className="text-base md:text-lg text-gray-700 font-semibold">
            {headerMsg.subtitle}
          </p>
          {/* Countdown Timer */}
          {timeRemaining > 0 && (
            <div className="mt-2">
              <Badge variant="outline" className="text-base px-3 py-1 border-2 border-red-500">
                ⏰ Offer expires in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </Badge>
            </div>
          )}
        </div>

        {/* Main Content - 2 Column Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Left Column - Product Image & Description */}
          <Card className="p-4 bg-white shadow-lg">
            {/* Product Image - Smaller */}
            {upsell.isSubscription ? (
              <div className="w-full mb-3">
                <img
                  src={santaMagicalJourneyProduct}
                  alt="Santa's Magical Journey"
                  className="w-full h-auto object-contain rounded-lg max-h-64"
                />
              </div>
            ) : (
              <div className="w-full h-52 bg-gradient-to-br from-blue-50 to-white rounded-lg mb-3 flex items-center justify-center p-3">
                <img
                  src={northPoleSnowImage}
                  alt={upsell.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            
            {upsell.promoText && (
              <Alert className="bg-yellow-50 border-yellow-300 mb-3 py-2">
                <Sparkles className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 font-semibold text-sm">
                  {upsell.promoText}
                </AlertDescription>
              </Alert>
            )}

            <h2 className="text-2xl mb-2" style={{ fontFamily: "Pacifico, cursive" }}>
              {upsell.name}
            </h2>
            
            {/* Compact description */}
            {upsell.isSubscription ? (
              <div className="text-gray-700 text-sm space-y-2">
                <div className="bg-gradient-to-r from-red-50 to-green-50 border-2 border-red-300 rounded-lg p-3 mb-2">
                  <p className="font-bold text-base text-red-700 mb-1 text-center">
                    🎁 GET 2 FREE Gifts! 🎁
                  </p>
                  <p className="text-center text-sm font-semibold text-green-800">
                    Free Santa's Workshop VIP Badge and Nice List Gold Pass with personalized Autographed Photo of Santa!
                  </p>
                </div>
                <p className="font-semibold">
                  Bring Santa's Adventures to Your Child's Mailbox Every Month!
                </p>
              </div>
            ) : (
              <p className="text-gray-700 text-sm mb-3">{upsell.description}</p>
            )}

            {/* Compact features */}
            {upsell.isSubscription ? (
              <div className="space-y-1 mt-3">
                <p className="font-semibold text-gray-800 text-sm mb-1">Each Monthly Package Includes:</p>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">Personalized letter from Santa</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">Postcard from his latest destination</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">Enchanting stories & cultural insights</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">Fun activities & illustrations</span>
                </div>
              </div>
            ) : upsell.features && upsell.features.length > 0 && (
              <div className="space-y-1 mt-3">
                {upsell.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Right Column - Order Form - COMPACT */}
          <div className="space-y-3">
            {/* Price Card - Compact */}
            <Card className="p-4 bg-white shadow-lg">
              {isDownsell && originalPrice && (
                <div className="mb-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-400 rounded-lg">
                  <p className="text-center font-bold text-orange-700 text-lg mb-0.5">
                    💥 SPECIAL DISCOUNT! 💥
                  </p>
                  <p className="text-center text-gray-700 text-sm">
                    Was: <span className="line-through">${originalPrice.toFixed(2)}</span>
                  </p>
                  <p className="text-center font-bold text-green-700 text-xl">
                    Now: ${upsell.price.toFixed(2)}{upsell.isSubscription ? ' - Starting January' : ''}
                  </p>
                  <p className="text-center text-xs text-gray-600">
                    Save ${(originalPrice - upsell.price).toFixed(2)}{upsell.isSubscription ? '/month' : ''}!
                  </p>
                </div>
              )}

              <div className="flex items-baseline justify-center mb-3">
                <span className="text-4xl font-bold text-green-600">
                  ${upsell.price.toFixed(2)}
                </span>
                {!upsell.isSubscription && quantity > 1 && (
                  <span className="text-xl text-gray-600 ml-2"> each</span>
                )}
              </div>
              
              {upsell.isSubscription && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-green-400 rounded-lg p-4 mb-3">
                  <p className="text-center text-2xl font-bold text-green-700 mb-2">
                    🎁 NO CHARGE TODAY! 🎁
                  </p>
                  <p className="text-sm text-gray-800 font-semibold mb-2">
                    📅 Starting January 2026:
                  </p>
                  <p className="text-sm text-gray-800 mb-2">
                    • Monthly letters begin at ${upsell.price.toFixed(2)}/month per child<br/>
                    • Get 2 FREE Bonus Gifts when you join today!<br/>
                    • Cancel anytime before your next billing date
                  </p>
                  <div className="bg-white/80 rounded p-2 mt-2">
                    <p className="text-xs text-center text-gray-700 font-semibold">
                      ✅ Your 2 FREE gifts ship with your Christmas order!
                    </p>
                  </div>
                </div>
              )}

              {/* NUMBER SELECTOR - 1, 2, 3, 4, 5 buttons */}
              {!upsell.isSubscription && (
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                    Quantity:
                  </label>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant={quantity === num ? "default" : "outline"}
                        size="lg"
                        onClick={() => setQuantity(num)}
                        disabled={processing}
                        className={`w-12 h-12 text-lg font-bold ${
                          quantity === num 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-white hover:bg-gray-100 border-2 border-gray-300'
                        }`}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {!upsell.isSubscription && quantity > 1 && (
                <div className="text-center mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-gray-600">Total:</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalPrice.toFixed(2)}
                  </p>
                </div>
              )}

              {error && (
                <Alert className="mb-3 bg-red-50 border-red-300 py-2">
                  <AlertDescription className="text-red-800 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* CTA Button - Large and prominent */}
              <Button
                onClick={handleAccept}
                disabled={processing}
                className="w-full text-lg py-6 bg-green-600 hover:bg-green-700 mb-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {upsell.isSubscription ? '🎅 Start My Subscription!' : '✅ Yes! Add To My Order'}
                  </>
                )}
              </Button>

              <Button
                onClick={handleDecline}
                disabled={processing}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800"
              >
                {processing ? 'Processing...' : 'No Thanks'}
              </Button>

              {upsell.isSubscription && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  By subscribing, you agree to automatic monthly billing. Cancel anytime.
                </p>
              )}
            </Card>

            {/* Additional CTA Card - More urgency */}
            <Card className="p-3 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 shadow-lg">
              <div className="text-center">
                <p className="font-bold text-red-700 mb-1">
                  🔥 This offer won't last long!
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  {upsell.isSubscription 
                    ? "Join thousands of families keeping the Christmas magic alive all year!"
                    : "Limited quantity available - add to your order now!"
                  }
                </p>
                <Button
                  onClick={handleAccept}
                  disabled={processing}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      🎁 Add To Order Now!
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Third CTA Card - Social Proof */}
            {upsell.isSubscription && (
              <Card className="p-3 bg-blue-50 border-2 border-blue-300 shadow-lg">
                <div className="text-center">
                  <p className="font-bold text-blue-700 mb-1">
                    ⭐⭐⭐⭐⭐ Parents Love It!
                  </p>
                  <p className="text-xs text-gray-700 italic mb-2">
                    "My kids run to the mailbox every month! Worth every penny!"
                  </p>
                  <Button
                    onClick={handleAccept}
                    disabled={processing}
                    variant="outline"
                    className="w-full border-2 border-blue-600 text-blue-700 hover:bg-blue-100"
                  >
                    {processing ? 'Processing...' : '🎅 Yes! I Want This!'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
