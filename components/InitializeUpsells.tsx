import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

export function InitializeUpsells() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const initializeProducts = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Product 1: Certified North Pole Snow (one-time purchase)
      const snowProduct = {
        id: "upsell_north_pole_snow",
        name: "Certified North Pole Snow",
        description: "Authentic snow from the North Pole! Our premium certified snow powder expands up to 100x its size when water is added. Direct from Santa's workshop - perfect for Christmas decorations, crafts, and creating memorable Santa experiences!",
        price: 9.99,
        imageUrl: "figma:asset/17a13766bc697fc8dd73632f6223611df59e7213.png",
        active: true,
        isSubscription: false,
        promoText: "🎄 SPECIAL OFFER: Add authentic North Pole snow to your Santa experience!",
        features: [
          "Certified authentic from the North Pole",
          "Expands up to 100x its original size",
          "Looks and feels like real snow",
          "Safe, non-toxic, and reusable",
          "Perfect for Christmas decorations and photos",
          "Makes approximately 2 gallons of snow"
        ]
      };

      // Product 2: Santa's Magical Journey (subscription)
      const subscriptionProduct = {
        id: "upsell_magical_journey",
        name: "Santa's Magical Journey",
        description: "Make the magic of Christmas last all year with Santa's Monthly Journey Letter — a delightful subscription where Santa personally writes to your child every month!",
        price: 12.00,
        imageUrl: "",
        active: true,
        isSubscription: true,
        promoText: "🎅 CONTINUE THE MAGIC ALL YEAR LONG!",
        features: [
          "A personalized letter from Santa",
          "A personalized postcard from his latest destination",
          "Enchanting stories, cultural insights, and fascinating facts",
          "Fun activities and illustrations that bring each country to life"
        ]
      };

      // Save both products
      const response1 = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/admin/upsell/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(snowProduct),
        }
      );

      const response2 = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/admin/upsell/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(subscriptionProduct),
        }
      );

      if (response1.ok && response2.ok) {
        const data1 = await response1.json();
        const data2 = await response2.json();
        
        console.log("✅ Snow product saved:", data1.upsell);
        console.log("✅ Subscription product saved:", data2.upsell);
        
        setResult({
          success: true,
          message: "✅ Successfully created/updated both upsell products! Click 'Close & Refresh' to see the changes.",
        });
      } else {
        const error1 = response1.ok ? null : await response1.text();
        const error2 = response2.ok ? null : await response2.text();
        throw new Error(`Failed to save products: ${error1 || ''} ${error2 || ''}`);
      }
    } catch (error: any) {
      console.error("Error initializing products:", error);
      setResult({
        success: false,
        message: `❌ Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Initialize Upsell Products</h2>
      <p className="text-gray-600 mb-2">
        Click the button below to create or update the two upsell products with the correct settings:
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-6 text-sm text-blue-800">
        <strong>Note:</strong> After clicking "Initialize/Update Products", make sure to click "Close & Refresh" to see the updated products in the list below.
      </div>
      
      <div className="space-y-4 mb-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="font-semibold">1. Certified North Pole Snow</h3>
          <p className="text-sm text-gray-600">One-time purchase at $9.99 (downsell to $7.99)</p>
          <p className="text-sm text-gray-600">isSubscription: false</p>
        </div>
        
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="font-semibold">2. Santa's Magical Journey</h3>
          <p className="text-sm text-gray-600">Monthly subscription at $12/month per child</p>
          <p className="text-sm text-gray-600">isSubscription: true</p>
        </div>
      </div>

      <Button
        onClick={initializeProducts}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Initializing Products...
          </>
        ) : (
          "Initialize/Update Products"
        )}
      </Button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
            result.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`${
              result.success ? "text-green-800" : "text-red-800"
            }`}
          >
            {result.message}
          </p>
        </div>
      )}
    </Card>
  );
}
