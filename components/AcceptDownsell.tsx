import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566`;

export function AcceptDownsell() {
  const [location, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  
  // Extract orderId and price from URL
  // URL format: /accept-downsell/ord_123?price=10
  const pathParts = location.split("/");
  const orderId = pathParts[pathParts.length - 1]?.split("?")[0];
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const price = urlParams.get("price");

  useEffect(() => {
    if (!orderId || !price) {
      setStatus("error");
      setMessage("Invalid downsell link. Please contact support.");
      return;
    }

    // Auto-accept the downsell
    acceptDownsell();
  }, [orderId, price]);

  const acceptDownsell = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch(`${API_URL}/accept-downsell/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          newPrice: parseFloat(price!),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to process your request. Please try again or contact support.");
        return;
      }

      setStatus("success");
      setMessage(data.message || `Your subscription has been updated to $${price}/month!`);
    } catch (error: any) {
      console.error("Error accepting downsell:", error);
      setStatus("error");
      setMessage("An error occurred. Please contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-green-600 text-white p-8 text-center">
          <h1 className="text-3xl mb-2">🎅 Letters From Santa</h1>
          <p className="text-xl">Special Offer Confirmation</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {status === "loading" && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mb-4"></div>
              <p className="text-xl text-gray-700">Processing your special offer...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl text-green-600 mb-4">Success!</h2>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                <p className="text-xl text-gray-800 mb-2">{message}</p>
                <p className="text-2xl text-green-700 mt-4">
                  <strong>New Price: ${price}/month</strong>
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                Your first letter at the new price will be shipped soon! 🎄
              </p>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-left">
                  <p className="text-blue-800">
                    <strong>📧 Check Your Email</strong>
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    You'll receive a confirmation email shortly with all the details.
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="w-full bg-green-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-green-700 transition-colors"
                >
                  🏠 Return to Home
                </button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-3xl text-red-600 mb-4">Oops!</h2>
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                <p className="text-lg text-gray-800">{message}</p>
              </div>
              <div className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left">
                  <p className="text-yellow-800">
                    <strong>💡 Need Help?</strong>
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Please contact our support team at <a href="mailto:hello@santascertifiedletter.com" className="underline">hello@santascertifiedletter.com</a> or call <a href="tel:+18005407716" className="underline">(800) 540-7716</a>
                  </p>
                </div>
                <button
                  onClick={() => acceptDownsell()}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "🔄 Try Again"}
                </button>
                <button
                  onClick={() => (window.location.href = "/")}
                  className="w-full bg-gray-200 text-gray-800 px-8 py-4 rounded-lg text-lg hover:bg-gray-300 transition-colors"
                >
                  🏠 Return to Home
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 text-center text-sm text-gray-600">
          <p>🎄 Thank you for keeping the Christmas magic alive! 🎅</p>
          <p className="mt-2">© 2025 Letters From Santa. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
