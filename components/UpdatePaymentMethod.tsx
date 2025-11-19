import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { CreditCard, CheckCircle, AlertCircle, Lock, Loader2, ChevronDown, ChevronUp, Edit, Plus, Trash2, Save } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface LetterPackage {
  childFirstName: string;
  childLastName: string;
  friendName: string;
  streetAddress: string;
  unitApt: string;
  city: string;
  state: string;
  zipCode: string;
}

interface OrderDetails {
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  letterPackages: LetterPackage[];
  total: number;
  packagePrice?: number;
  monthlySubscription: boolean;
  subscriptionId: string | null;
  stripeCustomerId: string | null;
  lastFourCard?: string;
  nextBillingDate?: string;
  declineReason?: string;
}

const stripePromise = loadStripe(
  "pk_live_51SIHQT2NsH2CKfRANHrn5PsrTTnvRY0t5QStLGW8W3ihy4dhFVhDX4ZIP3lrOYhA1HPtnflUgDAhDxEZ0TgNB1V000lsmZhQBB"
);

function PaymentForm({ 
  orderDetails, 
  token, 
  updatedLetterPackages,
  updatedBillingInfo,
  newTotal
}: { 
  orderDetails: OrderDetails; 
  token: string;
  updatedLetterPackages: LetterPackage[];
  updatedBillingInfo: OrderDetails['customerInfo'];
  newTotal: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: updatedBillingInfo.name,
          email: updatedBillingInfo.email,
          phone: updatedBillingInfo.phone,
          address: {
            line1: updatedBillingInfo.address,
            city: updatedBillingInfo.city,
            state: updatedBillingInfo.state,
            postal_code: updatedBillingInfo.zip,
          },
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      // Send payment method AND updated order data to backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/update-payment-method`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            token,
            paymentMethodId: paymentMethod.id,
            updatedOrderData: {
              letterPackages: updatedLetterPackages,
              customerInfo: updatedBillingInfo,
              total: newTotal,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle payment declines with user-friendly messages
        if (response.status === 402) {
          let userMessage = data.error || "Your card was declined.";
          
          // Provide helpful guidance based on decline code
          if (data.declineCode) {
            switch (data.declineCode) {
              case "insufficient_funds":
                userMessage = "Your card has insufficient funds. Please try a different card.";
                break;
              case "card_declined":
              case "generic_decline":
                userMessage = "Your card was declined. Please contact your bank or try a different card.";
                break;
              case "expired_card":
                userMessage = "Your card has expired. Please use a different card.";
                break;
              case "incorrect_cvc":
                userMessage = "The security code (CVC) is incorrect. Please try again.";
                break;
              case "processing_error":
                userMessage = "There was a processing error. Please try again in a moment.";
                break;
              case "lost_card":
              case "stolen_card":
                userMessage = "This card has been reported as lost or stolen. Please use a different card.";
                break;
              default:
                userMessage = data.error || "Your payment was declined. Please try a different card.";
            }
          }
          
          throw new Error(userMessage);
        }
        
        throw new Error(data.error || "Failed to update payment method");
      }

      // If requires additional authentication
      if (data.requiresAction && data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret);

        if (confirmError) {
          throw new Error(confirmError.message);
        }

        // Confirm with backend that payment succeeded
        const confirmResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/confirm-payment-update`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              token,
              paymentIntentId: data.paymentIntentId,
            }),
          }
        );

        const confirmData = await confirmResponse.json();

        if (!confirmResponse.ok) {
          throw new Error(confirmData.error || "Failed to confirm payment");
        }

        setNewOrderId(confirmData.orderId);
        setSuccess(true);
      } else if (data.success) {
        setNewOrderId(data.orderId);
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("❌ Payment update error:", err);
      setError(err.message || "Failed to update payment method");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-green-600 mx-auto" />
        </div>
        <h2 className="text-3xl mb-4" style={{ fontFamily: "Pacifico, cursive" }}>
          🎉 Payment Updated Successfully!
        </h2>
        <p className="text-lg text-gray-700 mb-2">
          Your payment method has been updated and your order has been processed.
        </p>
        {newOrderId && (
          <p className="text-sm text-gray-600 mb-6">Order ID: {newOrderId}</p>
        )}
        <Alert className="bg-green-50 border-green-200 mb-6">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {orderDetails.monthlySubscription ? (
              <>
                ✅ Your subscription is now active and your letters are being prepared!
                <br />
                Check your email for confirmation and tracking details.
              </>
            ) : (
              <>
                ✅ Your payment has been processed and your letters are being prepared!
                <br />
                Check your email for confirmation and tracking details.
              </>
            )}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => (window.location.href = "/")}
          className="bg-red-600 hover:bg-red-700 text-white"
          size="lg"
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="card" className="text-lg mb-2 block">
          New Payment Method
        </Label>
        <div className="p-4 border-2 border-gray-300 rounded-lg bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#374151",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
                invalid: {
                  color: "#dc2626",
                },
              },
            }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2 flex items-center">
          <Lock className="w-4 h-4 mr-1" />
          Secure payment processing by Stripe
        </p>
      </div>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <p className="font-semibold mb-2">{error}</p>
            <p className="text-sm mt-2">
              💡 <strong>What to try:</strong>
            </p>
            <ul className="text-sm mt-1 ml-4 list-disc space-y-1">
              <li>Double-check your card number, expiration date, and security code</li>
              <li>Try a different payment card</li>
              <li>Contact your bank if the issue persists</li>
              <li>
                For testing: Use card <code className="bg-red-100 px-1 rounded">4242 4242 4242 4242</code> with any future expiration and any CVC
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <p className="text-sm text-yellow-800">
          <strong>💡 Note:</strong> After updating your payment method, {orderDetails.monthlySubscription ? 'your subscription' : 'your order'} will be
          automatically charged ${newTotal.toFixed(2)} and your order will be processed
          immediately.
        </p>
      </div>

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Update Payment & Process Order
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        By submitting this form, you authorize us to charge your new payment method for this order
        {orderDetails.monthlySubscription && ' and future monthly subscription payments'}.
      </p>
    </form>
  );
}

export function UpdatePaymentMethod() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [token, setToken] = useState<string>("");
  
  // Editable states
  const [letterPackages, setLetterPackages] = useState<LetterPackage[]>([]);
  const [billingInfo, setBillingInfo] = useState<OrderDetails['customerInfo']>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });
  
  const [editingLetterIndex, setEditingLetterIndex] = useState<number | null>(null);
  const [editingBilling, setEditingBilling] = useState(false);
  const [lettersExpanded, setLettersExpanded] = useState(true);
  const [billingExpanded, setBillingExpanded] = useState(false);

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        // Get token from URL (either path or query parameter)
        const params = new URLSearchParams(window.location.search);
        let extractedToken = params.get('token');
        
        // Fallback to path-based token
        if (!extractedToken) {
          const pathParts = window.location.pathname.split("/");
          extractedToken = pathParts[pathParts.length - 1];
        }
        
        console.log("📋 Update Payment - URL:", window.location.href);
        console.log("📋 Update Payment - Token extracted:", extractedToken);
        
        if (!extractedToken || extractedToken === "update-payment") {
          throw new Error("Invalid update link - no token found");
        }

        setToken(extractedToken);

        // Fetch order details
        const fetchUrl = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/get-order-for-update/${extractedToken}`;
        console.log("📋 Fetching from:", fetchUrl);
        
        const response = await fetch(fetchUrl, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        console.log("📋 Response status:", response.status);
        const data = await response.json();
        console.log("📋 Response data:", data);

        if (!response.ok) {
          throw new Error(data.error || "Failed to load order details");
        }

        if (!data.order) {
          throw new Error("Order data not found in response");
        }

        console.log("✅ Order details loaded successfully");
        setOrderDetails(data.order);
        setLetterPackages(data.order.letterPackages);
        setBillingInfo(data.order.customerInfo);
      } catch (err: any) {
        console.error("❌ Error loading order:", err);
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, []);

  const addNewLetter = () => {
    const newLetter: LetterPackage = {
      childFirstName: "",
      childLastName: "",
      friendName: "",
      streetAddress: "",
      unitApt: "",
      city: "",
      state: "",
      zipCode: "",
    };
    setLetterPackages([...letterPackages, newLetter]);
    setEditingLetterIndex(letterPackages.length);
    setLettersExpanded(true);
  };

  const removeLetter = (index: number) => {
    if (letterPackages.length === 1) {
      alert("You must have at least one letter package.");
      return;
    }
    setLetterPackages(letterPackages.filter((_, i) => i !== index));
  };

  const updateLetter = (index: number, field: keyof LetterPackage, value: string) => {
    const updated = [...letterPackages];
    updated[index] = { ...updated[index], [field]: value };
    setLetterPackages(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-red-600 mx-auto mb-4 animate-spin" />
          <p className="text-lg text-gray-700">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl mb-4" style={{ fontFamily: "Pacifico, cursive" }}>
              Unable to Load Order
            </h2>
            <p className="text-gray-700 mb-6">{error || "Order not found"}</p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate new total based on letter count and original price per package
  const pricePerPackage = orderDetails.packagePrice || (orderDetails.total / orderDetails.letterPackages.length) || 17.95;
  const newTotal = letterPackages.length * pricePerPackage;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl mb-2" style={{ fontFamily: "Pacifico, cursive", color: "#dc2626" }}>
            🎅 Update Payment Method
          </h1>
          <p className="text-lg text-gray-700">
            {orderDetails.monthlySubscription 
              ? 'Update your payment method to continue your monthly subscription'
              : 'Update your payment method to receive your Santa Letters'}
          </p>
        </div>

        {/* Decline Alert */}
        {orderDetails.declineReason && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Previous Payment Issue:</strong> {orderDetails.declineReason}
            </AlertDescription>
          </Alert>
        )}

        {/* Order Summary */}
        <Card className="p-6 mb-6 bg-white shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl" style={{ fontFamily: "Pacifico, cursive" }}>
              Order Summary
            </h2>
            <Badge variant="outline" className="text-sm">
              Order #{orderDetails.orderId.slice(0, 8)}
            </Badge>
          </div>

          {orderDetails.monthlySubscription && (
            <Alert className="bg-blue-50 border-blue-200 mb-4">
              <AlertDescription className="text-blue-800">
                <strong>📅 Monthly Subscription Active</strong>
                <br />
                You'll receive letters monthly for ${pricePerPackage.toFixed(2)}.
                {orderDetails.nextBillingDate && (
                  <span> Next billing: {new Date(orderDetails.nextBillingDate).toLocaleDateString()}</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {orderDetails.lastFourCard && (
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-gray-600">Current Payment Method</p>
              <p className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                •••• •••• •••• {orderDetails.lastFourCard}
              </p>
            </div>
          )}

          <div className="space-y-2 pb-4 border-b">
            <div className="flex justify-between">
              <span>{letterPackages.length} Letter Package{letterPackages.length > 1 ? 's' : ''}</span>
              <span>${pricePerPackage.toFixed(2)} each</span>
            </div>
            {letterPackages.length !== orderDetails.letterPackages.length && (
              <p className="text-sm text-orange-600">
                ⚠️ You've changed the number of packages (was {orderDetails.letterPackages.length})
              </p>
            )}
          </div>

          <div className="flex justify-between items-center text-xl pt-4">
            <span className="font-semibold">Total Due:</span>
            <span className="text-red-600 font-bold">${newTotal.toFixed(2)}</span>
          </div>
        </Card>

        {/* Letter Packages - Editable */}
        <Card className="p-6 mb-6 bg-white shadow-lg">
          <Collapsible open={lettersExpanded} onOpenChange={setLettersExpanded}>
            <CollapsibleTrigger className="w-full">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl" style={{ fontFamily: "Pacifico, cursive" }}>
                  📝 Letter Packages ({letterPackages.length})
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addNewLetter();
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Letter
                  </Button>
                  {lettersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-6 space-y-4">
                {letterPackages.map((pkg, index) => (
                  <Card key={index} className="p-4 border-2">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600">Package {index + 1}</Badge>
                        <span className="font-semibold">
                          {pkg.childFirstName || '(Not Set)'} {pkg.childLastName}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingLetterIndex(editingLetterIndex === index ? null : index)}
                        >
                          {editingLetterIndex === index ? (
                            <>
                              <Save className="w-4 h-4 mr-1" />
                              Done
                            </>
                          ) : (
                            <>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </>
                          )}
                        </Button>
                        {letterPackages.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeLetter(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingLetterIndex === index ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Child's First Name *</Label>
                          <Input
                            value={pkg.childFirstName}
                            onChange={(e) => updateLetter(index, 'childFirstName', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Child's Last Name *</Label>
                          <Input
                            value={pkg.childLastName}
                            onChange={(e) => updateLetter(index, 'childLastName', e.target.value)}
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Friend's Name (Optional)</Label>
                          <Input
                            value={pkg.friendName}
                            onChange={(e) => updateLetter(index, 'friendName', e.target.value)}
                            placeholder="Leave blank if not needed"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Street Address *</Label>
                          <Input
                            value={pkg.streetAddress}
                            onChange={(e) => updateLetter(index, 'streetAddress', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>Unit/Apt (Optional)</Label>
                          <Input
                            value={pkg.unitApt}
                            onChange={(e) => updateLetter(index, 'unitApt', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>City *</Label>
                          <Input
                            value={pkg.city}
                            onChange={(e) => updateLetter(index, 'city', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>State *</Label>
                          <Input
                            value={pkg.state}
                            onChange={(e) => updateLetter(index, 'state', e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <Label>ZIP Code *</Label>
                          <Input
                            value={pkg.zipCode}
                            onChange={(e) => updateLetter(index, 'zipCode', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        {pkg.friendName && <div><strong>Friend:</strong> {pkg.friendName}</div>}
                        <div><strong>Address:</strong> {pkg.streetAddress}{pkg.unitApt ? `, ${pkg.unitApt}` : ''}</div>
                        <div>{pkg.city}, {pkg.state} {pkg.zipCode}</div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Billing Information - Editable */}
        <Card className="p-6 mb-6 bg-white shadow-lg">
          <Collapsible open={billingExpanded} onOpenChange={setBillingExpanded}>
            <CollapsibleTrigger className="w-full">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl" style={{ fontFamily: "Pacifico, cursive" }}>
                  💳 Billing Information
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingBilling(!editingBilling);
                      if (!editingBilling) setBillingExpanded(true);
                    }}
                  >
                    {editingBilling ? (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        Done
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </>
                    )}
                  </Button>
                  {billingExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Alert className="mt-4 mb-4 bg-yellow-50 border-yellow-200">
                <AlertDescription className="text-yellow-800">
                  ⚠️ <strong>Important:</strong> Your billing information must match your new credit card details.
                </AlertDescription>
              </Alert>

              {editingBilling ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="md:col-span-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={billingInfo.name}
                      onChange={(e) => setBillingInfo({ ...billingInfo, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={billingInfo.email}
                      onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      type="tel"
                      value={billingInfo.phone || ''}
                      onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Street Address *</Label>
                    <Input
                      value={billingInfo.address}
                      onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={billingInfo.city}
                      onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Input
                      value={billingInfo.state}
                      onChange={(e) => setBillingInfo({ ...billingInfo, state: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>ZIP Code *</Label>
                    <Input
                      value={billingInfo.zip}
                      onChange={(e) => setBillingInfo({ ...billingInfo, zip: e.target.value })}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  <p><strong>Name:</strong> {billingInfo.name}</p>
                  <p><strong>Email:</strong> {billingInfo.email}</p>
                  {billingInfo.phone && <p><strong>Phone:</strong> {billingInfo.phone}</p>}
                  <p><strong>Address:</strong> {billingInfo.address}</p>
                  <p><strong>City:</strong> {billingInfo.city}, {billingInfo.state} {billingInfo.zip}</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Payment Form Card */}
        <Card className="p-6 bg-white shadow-lg">
          <Elements stripe={stripePromise}>
            <PaymentForm 
              orderDetails={orderDetails} 
              token={token} 
              updatedLetterPackages={letterPackages}
              updatedBillingInfo={billingInfo}
              newTotal={newTotal}
            />
          </Elements>
        </Card>

        {/* Security Badge */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <Lock className="w-4 h-4 inline mr-1" />
          Your payment information is secure and encrypted
        </div>
      </div>
    </div>
  );
}
