import { useState, memo } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Activity, Mail, MousePointer, CheckCircle2, XCircle, Clock, TrendingUp, RefreshCw, CreditCard, Ban, Zap, ExternalLink } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface DeclinedOrder {
  declineId: string;
  timestamp: string;
  paymentIntentId?: string;
  orderId?: string;
  subscriptionId?: string;
  stripeInvoiceId?: string;
  status: string;
  declineReason: string;
  declineCode: string;
  amount: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
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
  affiliateId?: string | null;
  subIds?: Record<string, string> | null;
  affiliateRef?: string | null;
  affiliateCampaign?: string | null;
  
  // Auto-retry tracking
  retryAttempts?: number;
  firstFailureDate?: string;
  lastFailureDate?: string;
  nextRetryDate?: string;
  emailsSent?: Array<{
    timestamp: string;
    attemptNumber: number;
    type: string;
  }>;
  retryHistory?: Array<{
    timestamp: string;
    event: string;
    details: string;
  }>;
  resolvedDate?: string;
  
  // Email sequence tracking
  emailSequence?: {
    emailsSent: number;
    lastEmailSent: string | null;
    emailDates: string[];
  };
  
  // Activity log
  activityLog?: Array<{
    timestamp: string;
    type: 'email_sent' | 'email_opened' | 'email_clicked' | 'converted' | 'unsubscribed';
    details?: string;
    emailNumber?: number;
  }>;
  
  // Status flags
  unsubscribed?: boolean;
  unsubscribedAt?: string | null;
  converted?: boolean;
  convertedAt?: string | null;
  convertedOrderId?: string | null;
}

interface DeclinedOrdersPanelProps {
  declinedOrders: DeclinedOrder[];
  onRefresh: () => void;
}

export const DeclinedOrdersPanel = memo(function DeclinedOrdersPanel({ declinedOrders, onRefresh }: DeclinedOrdersPanelProps) {
  const [selectedDecline, setSelectedDecline] = useState<DeclinedOrder | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [processingRetries, setProcessingRetries] = useState(false);
  
  // New state for manual actions
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);
  const [showUpdateCardDialog, setShowUpdateCardDialog] = useState(false);
  const [updatingCard, setUpdatingCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [stoppingRecovery, setStoppingRecovery] = useState<string | null>(null);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566`;

  // Process auto-retries manually
  const processRetries = async () => {
    if (!confirm("Process all pending retry attempts now?\n\nThis will:\n- Attempt to charge failed subscriptions\n- Send recovery emails where needed\n- Update retry status\n\nContinue?")) {
      return;
    }

    setProcessingRetries(true);
    try {
      const response = await fetch(`${API_URL}/admin/process-retries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Retry Processing Complete!\n\nAttempted: ${result.retriesAttempted}\nSucceeded: ${result.retriesSucceeded}\nFailed: ${result.retriesFailed}\nEmails Sent: ${result.emailsSent}`);
        onRefresh();
      } else {
        const data = await response.json();
        alert(`❌ Failed to process retries: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error processing retries:", error);
      alert("❌ Error processing retries");
    } finally {
      setProcessingRetries(false);
    }
  };

  // Send recovery email manually
  const sendRecoveryEmail = async (decline: DeclinedOrder) => {
    setSendingEmail(decline.declineId);
    try {
      const response = await fetch(`${API_URL}/decline/send-recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ declineId: decline.declineId }),
      });

      if (response.ok) {
        alert("✅ Recovery email sent successfully!");
        onRefresh();
      } else {
        const data = await response.json();
        alert(`❌ Failed to send email: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error sending recovery email:", error);
      alert("❌ Error sending recovery email");
    } finally {
      setSendingEmail(null);
    }
  };

  // Mark as converted
  const markAsConverted = async (decline: DeclinedOrder, orderId: string) => {
    try {
      const response = await fetch(`${API_URL}/decline/mark-converted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ 
          declineId: decline.declineId,
          orderId: orderId 
        }),
      });

      if (response.ok) {
        alert("✅ Marked as converted!");
        onRefresh();
      } else {
        alert("❌ Failed to mark as converted");
      }
    } catch (error) {
      console.error("Error marking as converted:", error);
      alert("❌ Error marking as converted");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_sent':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'email_opened':
        return <MousePointer className="w-4 h-4 text-green-500" />;
      case 'email_clicked':
        return <MousePointer className="w-4 h-4 text-purple-500" />;
      case 'converted':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'unsubscribed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get activity label
  const getActivityLabel = (type: string, details?: string, emailNumber?: number) => {
    switch (type) {
      case 'email_sent':
        return `Recovery Email ${emailNumber || ''}  sent`;
      case 'email_opened':
        return `Email ${emailNumber || ''} opened`;
      case 'email_clicked':
        return `Email ${emailNumber || ''} clicked - ${details || 'Link clicked'}`;
      case 'converted':
        return `✅ Converted! Order: ${details || 'N/A'}`;
      case 'unsubscribed':
        return '❌ Unsubscribed from emails';
      default:
        return type;
    }
  };

  // Manual retry payment
  const retryPayment = async (decline: DeclinedOrder) => {
    if (!confirm(`Force a manual payment retry for ${decline.customerInfo.name}?\n\nThis will attempt to charge their existing card for ${decline.amount.toFixed(2)}.`)) {
      return;
    }

    setRetryingPayment(decline.declineId);
    try {
      const response = await fetch(`${API_URL}/decline/retry-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ 
          declineId: decline.declineId,
          paymentIntentId: decline.paymentIntentId 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Payment retry successful!\n\nCharged: ${decline.amount.toFixed(2)}\nTransaction ID: ${result.paymentIntentId}`);
        onRefresh();
      } else {
        const data = await response.json();
        alert(`❌ Payment retry failed: ${data.error || 'Unknown error'}\n\n${data.details || ''}`);
      }
    } catch (error) {
      console.error("Error retrying payment:", error);
      alert("❌ Error retrying payment");
    } finally {
      setRetryingPayment(null);
    }
  };

  // Update payment method
  const updatePaymentMethod = async (decline: DeclinedOrder) => {
    if (!cardNumber || !expMonth || !expYear || !cvc) {
      alert("Please fill in all card details");
      return;
    }

    setUpdatingCard(true);
    try {
      const response = await fetch(`${API_URL}/decline/update-payment-method`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ 
          declineId: decline.declineId,
          paymentIntentId: decline.paymentIntentId,
          cardNumber: cardNumber.replace(/\s/g, ''),
          expMonth,
          expYear,
          cvc
        }),
      });

      if (response.ok) {
        alert("✅ Payment method updated successfully!\n\nYou can now retry the payment.");
        setShowUpdateCardDialog(false);
        setCardNumber('');
        setExpMonth('');
        setExpYear('');
        setCvc('');
        onRefresh();
      } else {
        const data = await response.json();
        alert(`❌ Failed to update payment method: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating payment method:", error);
      alert("❌ Error updating payment method");
    } finally {
      setUpdatingCard(false);
    }
  };

  // Stop recovery attempts
  const stopRecovery = async (decline: DeclinedOrder) => {
    if (!confirm(`Stop all recovery attempts for ${decline.customerInfo.name}?\n\nThis will:\n• Stop sending recovery emails\n• Remove from auto-retry queue\n• Mark as permanently failed\n\nContinue?`)) {
      return;
    }

    setStoppingRecovery(decline.declineId);
    try {
      const response = await fetch(`${API_URL}/decline/stop-recovery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ declineId: decline.declineId }),
      });

      if (response.ok) {
        alert("✅ Recovery stopped. This decline will no longer be retried or emailed.");
        onRefresh();
      } else {
        const data = await response.json();
        alert(`❌ Failed to stop recovery: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error stopping recovery:", error);
      alert("❌ Error stopping recovery");
    } finally {
      setStoppingRecovery(null);
    }
  };

  // Calculate conversion stats
  const conversionStats = {
    total: declinedOrders.length,
    converted: declinedOrders.filter(d => d.converted).length,
    unsubscribed: declinedOrders.filter(d => d.unsubscribed).length,
    active: declinedOrders.filter(d => !d.converted && !d.unsubscribed).length,
    conversionRate: declinedOrders.length > 0 
      ? ((declinedOrders.filter(d => d.converted).length / declinedOrders.length) * 100).toFixed(1)
      : '0.0',
    totalRevenue: declinedOrders
      .filter(d => d.converted)
      .reduce((sum, d) => sum + d.amount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Process Retries Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Declined Orders</h2>
          <p className="text-sm text-gray-600 mt-1">Auto-retry system processes declined charges every few hours</p>
        </div>
        <Button
          onClick={processRetries}
          disabled={processingRetries}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${processingRetries ? 'animate-spin' : ''}`} />
          {processingRetries ? 'Processing...' : 'Process Retries Now'}
        </Button>
      </div>

      {/* Conversion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-white">
          <div className="text-2xl font-bold text-gray-900">{conversionStats.total}</div>
          <div className="text-sm text-gray-600">Total Declines</div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="text-2xl font-bold text-green-700">{conversionStats.converted}</div>
          <div className="text-sm text-green-600">Converted</div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{conversionStats.active}</div>
          <div className="text-sm text-blue-600">Active Recovery</div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-purple-700">{conversionStats.conversionRate}%</div>
              <div className="text-sm text-purple-600">Conversion Rate</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="text-2xl font-bold text-emerald-700">${conversionStats.totalRevenue.toFixed(2)}</div>
          <div className="text-sm text-emerald-600">Recovered Revenue</div>
        </Card>
      </div>

      {/* Declined Orders List */}
      <div className="space-y-4">
        {declinedOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-400 text-lg mb-2">No declined orders yet</div>
            <div className="text-gray-500 text-sm">
              Declined payment attempts will appear here
            </div>
          </Card>
        ) : (
          declinedOrders.map((decline) => (
            <Card key={decline.declineId} className={`p-4 ${
              decline.converted ? 'bg-green-50 border-green-300' : 
              decline.unsubscribed ? 'bg-gray-50 border-gray-300' : 
              'bg-red-50 border-red-300'
            }`}>
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {decline.converted ? '✅' : decline.unsubscribed ? '🚫' : '🚨'} Payment Declined
                      </h3>
                      {decline.converted && (
                        <Badge className="bg-green-600">Converted!</Badge>
                      )}
                      {decline.unsubscribed && (
                        <Badge className="bg-gray-600">Unsubscribed</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getTimeAgo(decline.timestamp)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-700">
                      ${decline.amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Decline Reason */}
                <div className="bg-white p-3 rounded-lg border border-red-200">
                  <div className="text-sm font-medium text-gray-700 mb-1">Decline Reason:</div>
                  <div className="text-sm text-red-600">{decline.declineReason}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Code: {decline.declineCode} | PI: {decline.paymentIntentId.substring(0, 20)}...
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Customer</div>
                    <div className="text-sm">{decline.customerInfo.name}</div>
                    <div className="text-sm text-gray-600">{decline.customerInfo.email}</div>
                    {decline.customerInfo.phone && (
                      <div className="text-sm text-gray-600">{decline.customerInfo.phone}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Order Details</div>
                    <div className="text-sm">
                      {decline.numberOfPackages} Letter Package{decline.numberOfPackages > 1 ? 's' : ''}
                    </div>
                    {decline.letterPackages.length > 0 && (
                      <div className="text-sm text-gray-600">
                        For: {decline.letterPackages.map(pkg => pkg.childFirstName).join(', ')}
                      </div>
                    )}
                    {decline.affiliateId && (
                      <div className="mt-2">
                        <div className="text-sm text-purple-600">
                          Affiliate: {decline.affiliateId}
                        </div>
                        {decline.subIds && Object.keys(decline.subIds).length > 0 && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            {decline.subIds.sub && `SubID1: ${decline.subIds.sub}`}
                            {decline.subIds.sub2 && ` | SubID2: ${decline.subIds.sub2}`}
                            {decline.subIds.sub3 && ` | SubID3: ${decline.subIds.sub3}`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-Retry Status */}
                {decline.retryAttempts !== undefined && (
                  <div className={`bg-white p-3 rounded-lg border ${
                    decline.status === 'resolved' ? 'border-green-300' : 
                    (decline.retryAttempts || 0) >= 3 ? 'border-red-300' : 'border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700">
                        🔄 Auto-Retry Status
                      </div>
                      <Badge variant="outline" className={`text-xs ${
                        decline.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        (decline.retryAttempts || 0) >= 3 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {decline.status === 'resolved' ? 'Resolved ✓' : `Attempt ${decline.retryAttempts || 0}/3`}
                      </Badge>
                    </div>
                    
                    {/* Retry Timeline */}
                    {decline.emailsSent && decline.emailsSent.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <div className="text-xs font-medium text-gray-600 mb-2">Recovery Emails Sent:</div>
                        {decline.emailsSent.map((email, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded">
                            <Mail className="w-3 h-3 text-blue-600" />
                            <span className="text-gray-700">Email #{email.attemptNumber}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">{formatDate(email.timestamp)}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600">{getTimeAgo(email.timestamp)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Next Retry */}
                    {decline.nextRetryDate && decline.status !== 'resolved' && (decline.retryAttempts || 0) < 3 && (
                      <div className="mt-2 text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                        <strong className="text-yellow-800">Next retry:</strong>{' '}
                        <span className="text-yellow-700">
                          {formatDate(decline.nextRetryDate)} ({getTimeAgo(decline.nextRetryDate)})
                        </span>
                      </div>
                    )}
                    
                    {/* Exhausted */}
                    {(decline.retryAttempts || 0) >= 3 && decline.status !== 'resolved' && (
                      <div className="mt-2 text-xs bg-red-50 border border-red-200 rounded p-2 text-red-700">
                        ⚠️ All retry attempts exhausted. Manual intervention required.
                      </div>
                    )}
                    
                    {/* Resolved */}
                    {decline.status === 'resolved' && decline.resolvedDate && (
                      <div className="mt-2 text-xs bg-green-50 border border-green-200 rounded p-2 text-green-700">
                        ✅ Payment successful on {formatDate(decline.resolvedDate)}
                      </div>
                    )}
                  </div>
                )}

                {/* Email Recovery Status (legacy) */}
                {!decline.retryAttempts && decline.emailSequence && (
                  <div className="bg-white p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700">
                        📧 Email Recovery Status
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {decline.emailSequence?.emailsSent || 0} emails sent
                      </Badge>
                    </div>
                    {decline.emailSequence && decline.emailSequence.lastEmailSent && (
                      <div className="text-xs text-gray-600">
                        Last sent: {formatDate(decline.emailSequence.lastEmailSent)}
                      </div>
                    )}
                    {(!decline.emailSequence || decline.emailSequence.emailsSent === 0) && (
                      <div className="text-xs text-gray-500">No emails sent yet</div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {/* Activity Log Button */}
                  <Dialog open={showActivityLog && selectedDecline?.declineId === decline.declineId} onOpenChange={(open) => {
                    setShowActivityLog(open);
                    if (!open) setSelectedDecline(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => setSelectedDecline(decline)}
                        variant="outline"
                        size="sm"
                        className="bg-white"
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Activity Log
                        {decline.activityLog && decline.activityLog.length > 0 && (
                          <Badge className="ml-2 bg-blue-600">{decline.activityLog.length}</Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Activity Log - {decline.customerInfo.name}</DialogTitle>
                        <DialogDescription>
                          View all email activity and customer interactions for this declined order
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-3">
                          {/* Retry History (if available) */}
                          {decline.retryHistory && decline.retryHistory.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Auto-Retry History</h4>
                              {decline.retryHistory.map((retry, idx) => (
                                <div key={`retry-${idx}`} className="flex gap-3 pb-3 mb-3 border-b">
                                  <div className="mt-1">
                                    <Activity className="w-4 h-4 text-orange-500" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{retry.event}</div>
                                    <div className="text-xs text-gray-600 mt-1">{retry.details}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {formatDate(retry.timestamp)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Activity Timeline */}
                          {decline.activityLog && decline.activityLog.length > 0 ? (
                            <>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Customer Activity</h4>
                              {decline.activityLog.map((activity, idx) => (
                                <div key={idx} className="flex gap-3 pb-3 border-b last:border-0">
                                  <div className="mt-1">{getActivityIcon(activity.type)}</div>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">
                                      {getActivityLabel(activity.type, activity.details, activity.emailNumber)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {formatDate(activity.timestamp)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : !decline.retryHistory || decline.retryHistory.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <div>No activity yet</div>
                              <div className="text-sm mt-1">
                                Activity will appear here as the system processes retries
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>

                  {/* Retry Payment Button - NEW */}
                  {!decline.converted && !decline.unsubscribed && (
                    <Button
                      onClick={() => retryPayment(decline)}
                      disabled={retryingPayment === decline.declineId}
                      variant="outline"
                      size="sm"
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      {retryingPayment === decline.declineId ? 'Processing...' : 'Retry Payment Now'}
                    </Button>
                  )}

                  {/* Update Card Button - NEW */}
                  {!decline.converted && !decline.unsubscribed && (
                    <Dialog open={showUpdateCardDialog && selectedDecline?.declineId === decline.declineId} onOpenChange={(open) => {
                      setShowUpdateCardDialog(open);
                      if (!open) {
                        setSelectedDecline(null);
                        setCardNumber('');
                        setExpMonth('');
                        setExpYear('');
                        setCvc('');
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedDecline(decline)}
                          variant="outline"
                          size="sm"
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Update Card
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Payment Method</DialogTitle>
                          <DialogDescription>
                            Enter new card details from phone conversation with customer
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>⚠️ Security Notice:</strong> Only enter card details directly provided by the customer over a verified phone call.
                            </p>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Customer:</strong> {decline.customerInfo.name}<br/>
                              <strong>Email:</strong> {decline.customerInfo.email}<br/>
                              <strong>Amount:</strong> ${decline.amount.toFixed(2)}
                            </p>
                          </div>

                          <div>
                            <Label>Card Number</Label>
                            <Input
                              type="text"
                              placeholder="4242 4242 4242 4242"
                              value={cardNumber}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '');
                                if (/^\d*$/.test(value) && value.length <= 16) {
                                  setCardNumber(value.replace(/(\d{4})/g, '$1 ').trim());
                                }
                              }}
                              maxLength={19}
                              className="mt-2"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Exp Month</Label>
                              <Input
                                type="text"
                                placeholder="MM"
                                value={expMonth}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value) && value.length <= 2) {
                                    setExpMonth(value);
                                  }
                                }}
                                maxLength={2}
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label>Exp Year</Label>
                              <Input
                                type="text"
                                placeholder="YYYY"
                                value={expYear}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value) && value.length <= 4) {
                                    setExpYear(value);
                                  }
                                }}
                                maxLength={4}
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label>CVC</Label>
                              <Input
                                type="text"
                                placeholder="123"
                                value={cvc}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value) && value.length <= 4) {
                                    setCvc(value);
                                  }
                                }}
                                maxLength={4}
                                className="mt-2"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => updatePaymentMethod(decline)}
                              disabled={updatingCard || !cardNumber || !expMonth || !expYear || !cvc}
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                            >
                              {updatingCard ? 'Updating...' : 'Update Card & Save'}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowUpdateCardDialog(false);
                                setCardNumber('');
                                setExpMonth('');
                                setExpYear('');
                                setCvc('');
                              }}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Send Email Button */}
                  {!decline.converted && !decline.unsubscribed && (
                    <Button
                      onClick={() => sendRecoveryEmail(decline)}
                      disabled={sendingEmail === decline.declineId}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {sendingEmail === decline.declineId ? 'Sending...' : 'Send Recovery Email'}
                    </Button>
                  )}

                  {/* Stop Recovery Button - NEW */}
                  {!decline.converted && !decline.unsubscribed && (
                    <Button
                      onClick={() => stopRecovery(decline)}
                      disabled={stoppingRecovery === decline.declineId}
                      variant="outline"
                      size="sm"
                      className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {stoppingRecovery === decline.declineId ? 'Stopping...' : 'Stop Recovery'}
                    </Button>
                  )}

                  {/* Mark as Converted (manual) */}
                  {!decline.converted && !decline.unsubscribed && (
                    <Button
                      onClick={() => {
                        const orderId = prompt("Enter the order ID that this decline converted to:");
                        if (orderId) {
                          markAsConverted(decline, orderId);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Converted
                    </Button>
                  )}

                  {/* View in Stripe */}
                  <Button
                    onClick={() => {
                      const fixedUrl = `https://dashboard.stripe.com/test/payments/${decline.paymentIntentId}`.replace('/live/payments/', '/payments/');
                      window.open(fixedUrl, '_blank');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in Stripe
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
});