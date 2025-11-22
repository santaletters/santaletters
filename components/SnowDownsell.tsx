import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle, Loader2, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const northPoleSnowImage = "https://images.unsplash.com/photo-1673298062288-2df0ce037a1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3J0aCUyMHBvbGUlMjBzbm93JTIwd2ludGVyfGVufDF8fHx8MTc2Mzc2MjM3Nnww&ixlib=rb-4.1.0&q=80&w=1080";

interface SnowDownsellProps {
  orderToken: string;
  numberOfLetters: number;
  onAccept: () => void;
  onDecline: () => void;
  onTimeout: () => void;
}

export function SnowDownsell({ orderToken, numberOfLetters, onAccept, onDecline, onTimeout }: SnowDownsellProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(numberOfLetters);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes
  const timedOutRef = useRef(false);
  
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

  // Auto-timeout when countdown hits 0
  useEffect(() => {
    if (timeRemaining === 0 && !timedOutRef.current) {
      console.log("⏰ Snow downsell timer expired - moving to next step");
      timedOutRef.current = true;
      onTimeout();
    }
  }, [timeRemaining, onTimeout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    if (processing || timedOutRef.current) return;
    
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/upsell/accept-snow-downsell`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            orderToken,
            quantity,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add snow to order');
      }

      const data = await response.json();
      console.log("✅ Snow downsell accepted:", data);
      onAccept();
    } catch (err: any) {
      console.error("❌ Error accepting snow downsell:", err);
      setError(err.message || 'Failed to add snow to order');
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = () => {
    if (processing || timedOutRef.current) return;
    console.log("❌ Snow downsell declined - moving to next upsell");
    onDecline();
  };

  const totalPrice = (7.99 * quantity).toFixed(2);
  const regularPrice = (9.99 * quantity).toFixed(2);
  const savings = (2.00 * quantity).toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-800 via-red-700 to-orange-600 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-yellow-400">
        {/* Timer Banner - More Urgent */}
        <div className="bg-red-700 text-white py-4 px-6 flex items-center justify-center gap-2 animate-pulse">
          <Clock className="w-5 h-5" />
          <span className="text-lg font-bold">HURRY! Offer expires in {formatTime(timeRemaining)}</span>
        </div>

        {/* Alert Banner */}
        <div className="bg-yellow-50 border-b-4 border-yellow-400 p-4">
          <div className="flex items-center justify-center gap-3 max-w-2xl mx-auto">
            <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
            <div className="text-center">
              <h3 className="font-bold text-yellow-900 text-xl">WAIT! Special Discount Just For You!</h3>
              <p className="text-yellow-800 font-semibold">Save ${savings} - This session only!</p>
            </div>
            <Sparkles className="w-8 h-8 text-yellow-600 flex-shrink-0" />
          </div>
        </div>

        {/* Main Content - Desktop: 2 columns, Mobile: stacked */}
        <div className="grid lg:grid-cols-2 gap-8 p-6 lg:p-8">
          {/* Left Column - Product Image */}
          <div className="flex flex-col items-center justify-start bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 lg:p-8 pt-4">
            <div className="relative">
              <img 
                src={northPoleSnowImage} 
                alt="Certified North Pole Snow"
                className="w-full max-w-sm h-auto object-contain drop-shadow-2xl"
              />
              {/* Discount Badge */}
              <div className="absolute -top-4 -right-4 bg-red-600 text-white rounded-full w-24 h-24 flex items-center justify-center transform rotate-12 shadow-xl border-4 border-white">
                <div className="text-center">
                  <div className="text-2xl font-bold">$2</div>
                  <div className="text-xs">OFF!</div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-blue-900 mb-2">🎄 Authentic North Pole Snow</h3>
              <p className="text-gray-600">Certified & Collectible</p>
            </div>
            
            {/* Features List - moved here */}
            <ul className="space-y-2 mt-4 w-full max-w-md">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Authentic certified snow from the North Pole</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Beautiful collectible jar with certificate</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Perfect keepsake to treasure forever</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Ships FREE - no extra shipping charge!</span>
              </li>
            </ul>
          </div>

          {/* Right Column - Offer Details */}
          <div className="flex flex-col justify-start">
            <div className="mb-4">
              <h1 className="text-3xl lg:text-4xl font-bold text-red-700 mb-3">
                ⚡ LAST CHANCE! Get $2 OFF Now! ⚡
              </h1>
              <p className="text-gray-700 text-lg leading-relaxed">
                Don't miss out on this magical North Pole snow! We're giving you an exclusive 
                <strong className="text-red-600"> ${savings} discount</strong> right now - but only for the next few minutes!
              </p>
            </div>

            {/* Price Comparison */}
            <div className="bg-green-50 border-2 border-green-600 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 mb-1">
                <div>
                  <div className="text-sm text-gray-600 line-through">Regular: ${regularPrice}</div>
                  <div className="text-sm text-red-600 font-bold">You Save: ${savings}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Special Price</div>
                  <div className="text-3xl font-bold text-green-700">$7.99</div>
                  <div className="text-xs text-gray-600">per jar</div>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-3 text-center">
                Select Quantity:
              </label>
              
              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setQuantity(num)}
                    disabled={processing}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      quantity === num
                        ? 'bg-red-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Plus/Minus Controls */}
              <div className="flex items-center gap-4 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={processing || quantity <= 1}
                  className="px-8 text-xl font-bold"
                >
                  −
                </Button>
                <div className="flex-1 text-center max-w-[100px]">
                  <div className="text-3xl font-bold text-gray-900">{quantity}</div>
                  <div className="text-sm text-gray-600">jar{quantity !== 1 ? 's' : ''}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={processing}
                  className="px-8 text-xl font-bold"
                >
                  +
                </Button>
              </div>

              {/* Total Price with Savings */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="text-center py-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600 block">Regular</span>
                  <span className="text-lg font-bold text-gray-400 line-through">${regularPrice}</span>
                </div>
                <div className="text-center py-3 bg-green-50 rounded-lg border-2 border-green-600">
                  <span className="text-sm text-gray-600 block">Your Price</span>
                  <span className="text-2xl font-bold text-green-700">${totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                disabled={processing}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-xl font-bold shadow-lg animate-pulse"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Adding to Order...
                  </>
                ) : (
                  <>
                    ✓ YES! Give Me ${savings} OFF - Add {quantity} {quantity === 1 ? 'Jar' : 'Jars'} for ${totalPrice}
                  </>
                )}
              </Button>

              <Button
                onClick={handleDecline}
                disabled={processing}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800 py-3 text-sm"
              >
                No thanks, I'll pass on this discount
              </Button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-3">
              🔒 Secure checkout • 💳 Same payment method • ⚡ Expires in {formatTime(timeRemaining)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
