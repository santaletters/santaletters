import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Card } from "./ui/card";
import { Edit, Plus, Trash2, DollarSign, AlertCircle } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface SubscriptionLetter {
  childFirstName: string;
  childLastName: string;
  friendName: string;
  streetAddress: string;
  unitApt: string;
  city: string;
  state: string;
  zipCode: string;
  letterIndex: number;
}

interface SubscriptionLetterManagerProps {
  orderId: string;
  subscriptionLetters: SubscriptionLetter[];
  subscriptionQuantity: number;
  subscriptionPrice: number;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  subscriptionId?: string;
  shippingDate?: string;
  onUpdate: () => void;
}

export function SubscriptionLetterManager({
  orderId,
  subscriptionLetters: initialLetters,
  subscriptionQuantity: initialQuantity,
  subscriptionPrice,
  stripeCustomerId,
  stripePaymentMethodId,
  subscriptionId,
  shippingDate,
  onUpdate,
}: SubscriptionLetterManagerProps) {
  const [letters, setLetters] = useState<SubscriptionLetter[]>(initialLetters || []);
  const [editingLetter, setEditingLetter] = useState<SubscriptionLetter | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [saving, setSaving] = useState(false);
  const [charging, setCharging] = useState(false);
  const [showChargeDialog, setShowChargeDialog] = useState(false);

  // Custom charge form state
  const [chargeQuantity, setChargeQuantity] = useState(letters.length.toString());
  const [chargePrice, setChargePrice] = useState((subscriptionPrice / (letters.length || 1)).toFixed(2));

  // Edit letter form state
  const [childFirstName, setChildFirstName] = useState("");
  const [childLastName, setChildLastName] = useState("");
  const [friendName, setFriendName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [unitApt, setUnitApt] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  const handleEditLetter = (letter: SubscriptionLetter, index: number) => {
    setEditingLetter(letter);
    setEditingIndex(index);
    setChildFirstName(letter.childFirstName);
    setChildLastName(letter.childLastName);
    setFriendName(letter.friendName);
    setStreetAddress(letter.streetAddress);
    setUnitApt(letter.unitApt);
    setCity(letter.city);
    setState(letter.state);
    setZipCode(letter.zipCode);
  };

  const handleSaveLetter = async () => {
    if (editingIndex === -1) return;

    setSaving(true);
    try {
      const updatedLetters = [...letters];
      updatedLetters[editingIndex] = {
        childFirstName,
        childLastName,
        friendName,
        streetAddress,
        unitApt,
        city,
        state,
        zipCode,
        letterIndex: editingIndex + 1,
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/admin/update-subscription-letters`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            orderId,
            subscriptionLetters: updatedLetters,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update letter");

      setLetters(updatedLetters);
      setEditingLetter(null);
      setEditingIndex(-1);
      onUpdate();
      alert("Letter data saved successfully!");
    } catch (error) {
      console.error("Error saving letter:", error);
      alert("Failed to save letter data");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLetter = async () => {
    setSaving(true);
    try {
      const newLetter: SubscriptionLetter = {
        childFirstName: "",
        childLastName: "",
        friendName: "",
        streetAddress: "",
        unitApt: "",
        city: "",
        state: "",
        zipCode: "",
        letterIndex: letters.length + 1,
      };

      const updatedLetters = [...letters, newLetter];

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/admin/update-subscription-quantity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            orderId,
            newQuantity: updatedLetters.length,
            subscriptionLetters: updatedLetters,
            subscriptionId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to add letter");

      setLetters(updatedLetters);
      onUpdate();
      alert("Letter added successfully! Subscription quantity updated in Stripe.");
    } catch (error) {
      console.error("Error adding letter:", error);
      alert("Failed to add letter");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLetter = async (index: number) => {
    if (letters.length <= 1) {
      alert("Cannot remove the last letter. Subscriptions must have at least one letter.");
      return;
    }

    if (!confirm("Are you sure you want to remove this letter? This will update the subscription quantity in Stripe.")) {
      return;
    }

    setSaving(true);
    try {
      const updatedLetters = letters.filter((_, i) => i !== index);
      // Reindex letters
      updatedLetters.forEach((letter, i) => {
        letter.letterIndex = i + 1;
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/admin/update-subscription-quantity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            orderId,
            newQuantity: updatedLetters.length,
            subscriptionLetters: updatedLetters,
            subscriptionId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to remove letter");

      setLetters(updatedLetters);
      onUpdate();
      alert("Letter removed successfully! Subscription quantity updated in Stripe.");
    } catch (error) {
      console.error("Error removing letter:", error);
      alert("Failed to remove letter");
    } finally {
      setSaving(false);
    }
  };

  const handleCustomCharge = async () => {
    if (!stripeCustomerId || !stripePaymentMethodId) {
      alert("Cannot charge: Missing payment method information");
      return;
    }

    const qty = parseInt(chargeQuantity);
    const price = parseFloat(chargePrice);

    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price");
      return;
    }

    const totalAmount = qty * price;

    setCharging(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/admin/charge-subscription-now`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            orderId,
            amount: totalAmount,
            quantity: qty,
            customerId: stripeCustomerId,
            paymentMethodId: stripePaymentMethodId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to charge subscription");
      }

      setShowChargeDialog(false);
      onUpdate();
      alert(`Successfully charged $${totalAmount.toFixed(2)}! Payment ID: ${data.paymentIntentId}`);
    } catch (error) {
      console.error("Error charging subscription:", error);
      alert(`Failed to charge subscription: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setCharging(false);
    }
  };

  const calculatedTotal = (parseFloat(chargePrice) || 0) * (parseInt(chargeQuantity) || 0);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base text-blue-900 mb-1">
              💰 Monthly Subscription
            </h3>
            <p className="text-sm text-blue-800">
              <strong>{letters.length} {letters.length === 1 ? 'letter' : 'letters'} × $12.00 = ${subscriptionPrice.toFixed(2)}/month</strong>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-700">Next billing: Jan 5, 2026</p>
            {subscriptionId && (
              <p className="text-xs text-blue-600 font-mono mt-1">ID: {subscriptionId.substring(0, 20)}...</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg">
            Letters ({letters.length}):
          </h3>
          {shippingDate && (
            <p className="text-sm text-gray-600 mt-1">
              Shipping Date: <strong>{shippingDate}</strong>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAddLetter}
            disabled={saving}
            variant="outline"
            size="sm"
            className="border-green-400 hover:bg-green-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Letter
          </Button>
          <Button
            onClick={() => {
              setChargeQuantity(letters.length.toString());
              setChargePrice((subscriptionPrice / (letters.length || 1)).toFixed(2));
              setShowChargeDialog(true);
            }}
            disabled={charging || !stripeCustomerId}
            variant="outline"
            size="sm"
            className="border-purple-400 hover:bg-purple-50"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Charge Now ({letters.length} × $12 = ${subscriptionPrice.toFixed(2)})
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {letters.length === 0 ? (
          <p className="text-sm text-gray-500">No letters yet</p>
        ) : (
          letters.map((letter, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold">
                    Letter #{index + 1}: {letter.childFirstName || "(No name)"} {letter.childLastName}
                  </p>
                  {letter.childFirstName && (
                    <p className="text-sm text-gray-600 mt-1">
                      Friend: {letter.friendName || "N/A"} | {letter.city}, {letter.state} {letter.zipCode}
                    </p>
                  )}
                  {!letter.childFirstName && (
                    <p className="text-sm text-yellow-600 mt-1">⚠️ No data entered yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditLetter(letter, index)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {letters.length > 1 && (
                    <Button
                      onClick={() => handleRemoveLetter(index)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Letter Dialog */}
      <Dialog open={editingLetter !== null} onOpenChange={() => setEditingLetter(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Letter #{editingIndex + 1}</DialogTitle>
            <DialogDescription>
              Update the personalized information for this subscription letter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Child's First Name</Label>
                <Input
                  value={childFirstName}
                  onChange={(e) => setChildFirstName(e.target.value)}
                  placeholder="Emma"
                />
              </div>
              <div>
                <Label>Child's Last Name</Label>
                <Input
                  value={childLastName}
                  onChange={(e) => setChildLastName(e.target.value)}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div>
              <Label>Friend's Name</Label>
              <Input
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                placeholder="Best friend's name"
              />
            </div>

            <div>
              <Label>Street Address</Label>
              <Input
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="123 Main St"
              />
            </div>

            <div>
              <Label>Unit/Apt</Label>
              <Input
                value={unitApt}
                onChange={(e) => setUnitApt(e.target.value)}
                placeholder="Apt 4B (optional)"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Springfield"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="IL"
                />
              </div>
              <div>
                <Label>Zip Code</Label>
                <Input
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="62701"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingLetter(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLetter} disabled={saving}>
                {saving ? "Saving..." : "Save Letter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Charge Dialog */}
      <Dialog open={showChargeDialog} onOpenChange={setShowChargeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Charge Subscription Now</DialogTitle>
            <DialogDescription>
              Customize the charge amount and quantity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label># of Letters</Label>
                <Input
                  type="number"
                  min="1"
                  value={chargeQuantity}
                  onChange={(e) => setChargeQuantity(e.target.value)}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>Cost per Letter ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={chargePrice}
                  onChange={(e) => setChargePrice(e.target.value)}
                  placeholder="12.00"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm">
                    <strong>Total to charge:</strong> ${calculatedTotal.toFixed(2)}
                  </p>
                  <p className="text-sm mt-1 text-gray-600">
                    {chargeQuantity} letter{parseInt(chargeQuantity) !== 1 ? 's' : ''} × ${parseFloat(chargePrice).toFixed(2)} per letter
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    An email receipt will be sent to the customer and this charge will be logged in the activity log.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowChargeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCustomCharge} disabled={charging} className="bg-purple-600 hover:bg-purple-700">
                {charging ? "Processing..." : `Charge $${calculatedTotal.toFixed(2)}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}