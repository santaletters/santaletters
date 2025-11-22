import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Loader2, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { projectId, publicAnonKey } from "../utils/supabase/info";

const northPoleSnowImage = "https://images.unsplash.com/photo-1673298062288-2df0ce037a1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxub3J0aCUyMHBvbGUlMjBzbm93JTIwd2ludGVyfGVufDF8fHx8MTc2Mzc2MjM3Nnww&ixlib=rb-4.1.0&q=80&w=1080";

const stripePromise = loadStripe(
  "pk_live_51QRlGLRxn6b9A6BHfQ25aZPtEFNkxlRDQqDdXCpz3nzK5A7B7NfN5wjRSRY8IvyX0PfWkIjfQCT8E7bqm2zAGH7j00T3xFsApz"
);

interface ChildFormData {
  childFirstName: string;
  childLastName: string;
  friendName: string;
  streetAddress: string;
  unitApt: string;
  city: string;
  state: string;
  zipCode: string;
}

interface AddAnotherChildProps {
  orderToken: string;
  isFulfilled: boolean;
  packagePrice: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddAnotherChildForm({ orderToken, isFulfilled, packagePrice, onSuccess, onCancel }: AddAnotherChildProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [numberOfPackages, setNumberOfPackages] = useState(1);
  const [childrenData, setChildrenData] = useState<ChildFormData[]>([{
    childFirstName: "",
    childLastName: "",
    friendName: "",
    streetAddress: "",
    unitApt: "",
    city: "",
    state: "",
    zipCode: "",
  }]);
  
  const [addNorthPoleSnow, setAddNorthPoleSnow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const northPoleSnowPrice = 9.99;
  const packageTotal = packagePrice * numberOfPackages;
  const snowTotal = addNorthPoleSnow ? northPoleSnowPrice : 0;
  const totalPrice = packageTotal + snowTotal;

  // Update number of children forms when package count changes
  const handlePackageCountChange = (count: number) => {
    setNumberOfPackages(count);
    const currentCount = childrenData.length;
    
    if (count > currentCount) {
      // Add more child forms
      const newChildren = [...childrenData];
      for (let i = currentCount; i < count; i++) {
        newChildren.push({
          childFirstName: "",
          childLastName: "",
          friendName: "",
          streetAddress: "",
          unitApt: "",
          city: "",
          state: "",
          zipCode: "",
        });
      }
      setChildrenData(newChildren);
    } else if (count < currentCount) {
      // Remove extra child forms
      setChildrenData(childrenData.slice(0, count));
    }
  };

  const updateChildField = (index: number, field: keyof ChildFormData, value: string) => {
    setChildrenData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError("Stripe has not loaded yet. Please try again.");
      return;
    }

    // Validate all children have required fields
    for (let i = 0; i < childrenData.length; i++) {
      const child = childrenData[i];
      if (!child.childFirstName || !child.childLastName || !child.streetAddress || !child.city || !child.state || !child.zipCode) {
        setError(`Please fill in all required fields for Package ${i + 1}`);
        return;
      }
    }

    // Show confirmation before processing
    setShowConfirmation(true);
  };

  const handleConfirmPurchase = async () => {
    setShowConfirmation(false);
    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements!.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe!.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Send to server
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/order/add-child`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            orderToken,
            childrenData,
            numberOfPackages,
            addNorthPoleSnow,
            packagePrice,
            paymentMethodId: paymentMethod.id,
            isFulfilled,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add packages");
      }

      // Success!
      onSuccess();
    } catch (err: any) {
      console.error("Error adding packages:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl mb-2" style={{ fontFamily: "Pacifico, cursive", color: "#15803d" }}>
          Add Another Letter Package 🎅
        </h2>
        <p className="text-gray-600">
          {isFulfilled 
            ? "Your original order has been shipped. We'll create a new order for this child."
            : "We'll add this to your current order before it ships!"}
        </p>
      </div>

      {/* Important Notice */}
      <Alert className={isFulfilled ? "bg-blue-50 border-blue-300" : "bg-yellow-50 border-yellow-300"}>
        <AlertCircle className={`h-4 w-4 ${isFulfilled ? "text-blue-600" : "text-yellow-600"}`} />
        <AlertDescription className={isFulfilled ? "text-blue-800" : "text-yellow-800"}>
          {isFulfilled 
            ? "📦 A new order will be created and our admin team will be notified to process it."
            : "⚠️ Your original order will be updated. Our admin team will confirm these changes before shipping."}
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quantity Selection */}
        <Card className="p-4 bg-green-50 border-green-200">
          <Label className="text-lg mb-2 block">How many letter packages?</Label>
          <Select
            value={numberOfPackages.toString()}
            onValueChange={(val) => handlePackageCountChange(parseInt(val))}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "Package" : "Packages"} - ${(packagePrice * num).toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* Child Information Forms - One per package */}
        {childrenData.map((child, index) => (
          <Card key={index} className="p-4 border-2 border-green-200">
            <h3 className="text-lg mb-3" style={{ fontWeight: "700" }}>
              Package {index + 1} - Child Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`childFirstName-${index}`}>Child's First Name *</Label>
                  <Input
                    id={`childFirstName-${index}`}
                    value={child.childFirstName}
                    onChange={(e) => updateChildField(index, "childFirstName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`childLastName-${index}`}>Child's Last Name *</Label>
                  <Input
                    id={`childLastName-${index}`}
                    value={child.childLastName}
                    onChange={(e) => updateChildField(index, "childLastName", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`friendName-${index}`}>Friend Name (Optional)</Label>
                <Input
                  id={`friendName-${index}`}
                  value={child.friendName}
                  onChange={(e) => updateChildField(index, "friendName", e.target.value)}
                />
              </div>

              {/* Address */}
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-sm" style={{ fontWeight: "700" }}>Delivery Address</h4>
                <div>
                  <Label htmlFor={`streetAddress-${index}`}>Street Address *</Label>
                  <Input
                    id={`streetAddress-${index}`}
                    value={child.streetAddress}
                    onChange={(e) => updateChildField(index, "streetAddress", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`unitApt-${index}`}>Unit/Apt (Optional)</Label>
                  <Input
                    id={`unitApt-${index}`}
                    value={child.unitApt}
                    onChange={(e) => updateChildField(index, "unitApt", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`city-${index}`}>City *</Label>
                    <Input
                      id={`city-${index}`}
                      value={child.city}
                      onChange={(e) => updateChildField(index, "city", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`state-${index}`}>State *</Label>
                    <Input
                      id={`state-${index}`}
                      value={child.state}
                      onChange={(e) => updateChildField(index, "state", e.target.value.toUpperCase())}
                      maxLength={2}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`zipCode-${index}`}>ZIP Code *</Label>
                  <Input
                    id={`zipCode-${index}`}
                    value={child.zipCode}
                    onChange={(e) => updateChildField(index, "zipCode", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* North Pole Snow Add-on */}
        <Card className="p-4 border-2 border-blue-200 bg-blue-50">
          <div className="flex items-start gap-4">
            <img 
              src={northPoleSnowImage} 
              alt="North Pole Snow" 
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Checkbox
                  id="northPoleSnow"
                  checked={addNorthPoleSnow}
                  onCheckedChange={(checked) => setAddNorthPoleSnow(checked as boolean)}
                />
                <Label htmlFor="northPoleSnow" className="text-lg cursor-pointer" style={{ fontWeight: "700" }}>
                  Add Certified North Pole Snow - $9.99
                </Label>
              </div>
              <p className="text-sm text-gray-700 ml-7">
                ❄️ Real snow from the North Pole! Certified authentic and magically preserved. The perfect addition to make your child's Christmas even more special!
              </p>
            </div>
          </div>
        </Card>

        {/* Payment */}
        <Card className="p-4">
          <h3 className="text-lg mb-3" style={{ fontWeight: "700" }}>Payment Information</h3>
          <div className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>
        </Card>

        {/* Total */}
        <Card className="p-4 bg-green-50 border-green-300">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>{numberOfPackages} Letter {numberOfPackages > 1 ? "Packages" : "Package"} × ${packagePrice.toFixed(2)}</span>
              <span>${packageTotal.toFixed(2)}</span>
            </div>
            {addNorthPoleSnow && (
              <div className="flex justify-between items-center text-sm">
                <span>Certified North Pole Snow</span>
                <span>${northPoleSnowPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-xl" style={{ fontWeight: "700" }}>Total:</span>
              <span className="text-3xl text-green-700" style={{ fontFamily: "Pacifico, cursive" }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="bg-red-50 border-red-300">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={isProcessing || !stripe}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Add ${numberOfPackages} Package${numberOfPackages > 1 ? 's' : ''}${addNorthPoleSnow ? ' + Snow' : ''} - $${totalPrice.toFixed(2)}`
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl mb-4" style={{ fontFamily: "Pacifico, cursive", color: "#15803d" }}>
              Confirm Your Purchase
            </h3>
            <div className="space-y-3 mb-6">
              <p className="text-gray-700">
                <strong>Packages:</strong> {numberOfPackages}
              </p>
              <div className="space-y-2">
                {childrenData.map((child, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded">
                    <p className="text-sm">
                      <strong>Package {idx + 1}:</strong> {child.childFirstName} {child.childLastName}
                    </p>
                  </div>
                ))}
              </div>
              {addNorthPoleSnow && (
                <p className="text-gray-700">
                  <strong>North Pole Snow:</strong> Yes (+$9.99)
                </p>
              )}
              <div className="pt-3 border-t">
                <p className="text-xl">
                  <strong>Total:</strong> ${totalPrice.toFixed(2)}
                </p>
              </div>
              {isFulfilled ? (
                <Alert className="bg-blue-50 border-blue-300">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    A new order will be created and processed separately.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-yellow-50 border-yellow-300">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Your existing order will be updated. Admin will confirm changes.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowConfirmation(false)}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={handleConfirmPurchase}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Confirm & Pay
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export function AddAnotherChild(props: AddAnotherChildProps) {
  return (
    <Elements stripe={stripePromise}>
      <AddAnotherChildForm {...props} />
    </Elements>
  );
}
