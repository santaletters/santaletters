import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Download, RefreshCw, Package, Calendar, DollarSign, Mail, Phone, MapPin, Plus, ExternalLink, Upload, Truck, Edit, Copy, Link2, AlertCircle, Bell, ChevronLeft, ChevronRight, CheckSquare, Square, Trash2, Archive, XCircle } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { DeclinedOrdersPanel } from "./DeclinedOrdersPanel";
import { AdminAlerts } from "./AdminAlerts";
import { getOrderLink } from "../utils/domainHelper";
import { SubscriptionLetterManager } from "./SubscriptionLetterManager";
import { AdminAffiliateManagement } from "./AdminAffiliateManagementEnhanced";
import { NetworkAffiliateReporting } from "./NetworkAffiliateReporting";

interface ActivityLogEntry {
  timestamp: string;
  action: string;
  details: string;
  user?: string;
  stripeUrl?: string;
  emailType?: string; // Type of email sent (e.g., 'order_confirmation', 'tracking_notification')
  emailRecipient?: string; // Email address
  emailId?: string; // Resend email ID for tracking
}

interface Order {
  orderId: string;
  stripePaymentId: string;
  stripeCheckoutUrl: string;
  orderDate: string;
  status: string;
  total: number;
  trackingNumber?: string;
  customerInfo: {
    email: string;
    name: string;
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
  subscriptionId: string | null;
  subscriptionMonthsActive?: number;
  subscriptionStartDate?: string;
  subscriptionNextBillingDate?: string;
  billingIntervalDays?: number;
  affiliateId?: string;
  affiliateName?: string;
  affiliateCommission?: number;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  ipAddress?: string;
  lastFourCard?: string;
  activityLog?: ActivityLogEntry[];
  trafficSource?: string;
}

interface AffiliateReport {
  affiliateId: string;
  affiliateName: string;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
}

interface DeclinedOrder {
  declineId: string;
  timestamp: string;
  paymentIntentId: string;
  status: string;
  declineReason: string;
  declineCode: string;
  amount: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
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
}

interface AdminDashboardProps {
  onBackToSales: () => void;
  onGoToAffiliateManage?: () => void;
  onGoToUpsellManage?: () => void;
  onLogout?: () => void;
}

export function AdminDashboard({ onBackToSales, onGoToAffiliateManage, onGoToUpsellManage, onLogout }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    fulfilled: 0,
    revenue: 0,
  });
  const [activeTab, setActiveTab] = useState<"alerts" | "orders" | "subscriptions" | "affiliates" | "declined" | "settings">("alerts");
  const [affiliateReports, setAffiliateReports] = useState<AffiliateReport[]>([]);
  const [declinedOrders, setDeclinedOrders] = useState<DeclinedOrder[]>([]);
  const [bulkTrackingData, setBulkTrackingData] = useState("");
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [singleTrackingNumber, setSingleTrackingNumber] = useState("");
  const [carrierName, setCarrierName] = useState("USPS");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editedPackages, setEditedPackages] = useState<Order["letterPackages"]>([]);
  const [isProcessingRetries, setIsProcessingRetries] = useState(false);
  const [sortByShippingDate, setSortByShippingDate] = useState(false);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<Order | null>(null);
  const [editingCustomerInfo, setEditingCustomerInfo] = useState<Order | null>(null);
  const [editedCustomerInfo, setEditedCustomerInfo] = useState<Order["customerInfo"] | null>(null);
  const [cancelSubscriptionOrder, setCancelSubscriptionOrder] = useState<Order | null>(null);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [manualBillingOrder, setManualBillingOrder] = useState<Order | null>(null);
  const [customBillingDate, setCustomBillingDate] = useState("");
  const [isBillingInProgress, setIsBillingInProgress] = useState(false);
  const [editBillingDateOrder, setEditBillingDateOrder] = useState<Order | null>(null);
  const [newBillingDate, setNewBillingDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [editSubscriptionDetailsOrder, setEditSubscriptionDetailsOrder] = useState<Order | null>(null);
  const [subscriptionProductName, setSubscriptionProductName] = useState("");
  const [subscriptionPrice, setSubscriptionPrice] = useState("");
  const [billingInterval, setBillingInterval] = useState("");
  const [archiveConfirmOrder, setArchiveConfirmOrder] = useState<Order | null>(null);
  const [editBillingIntervalOrder, setEditBillingIntervalOrder] = useState<Order | null>(null);
  const [newBillingInterval, setNewBillingInterval] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [dateStats, setDateStats] = useState({ count: 0, revenue: 0 });
  const [selectedOrderForActivity, setSelectedOrderForActivity] = useState<Order | null>(null);
  const [trafficSourceFilter, setTrafficSourceFilter] = useState<string>("all");
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  
  // Settings state
  const [defaultLetterPrice, setDefaultLetterPrice] = useState<number>(17.95);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Pagination state
  const [regularOrdersPage, setRegularOrdersPage] = useState(1);
  const [subscriptionOrdersPage, setSubscriptionOrdersPage] = useState(1);
  const ORDERS_PER_PAGE = 25;

  // Bulk selection state
  const [selectedRegularOrders, setSelectedRegularOrders] = useState<Set<string>>(new Set());
  const [selectedSubscriptionOrders, setSelectedSubscriptionOrders] = useState<Set<string>>(new Set());
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);

  const API_URL = "https://" + projectId + ".supabase.co/functions/v1/make-server-cf244566";

  // Fetch global settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(API_URL + "/settings", {
          headers: {
            Authorization: "Bearer " + publicAnonKey,
          },
        });
        if (response.ok) {
          const settings = await response.json();
          setDefaultLetterPrice(settings.defaultLetterPrice || 17.95);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Fetch orders from server
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL + "/orders", {
        headers: {
          Authorization: "Bearer " + publicAnonKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders);
      setFilteredOrders(data.orders);

      const total = data.orders.length;
      const pending = data.orders.filter((o: Order) => o.status === "pending").length;
      const fulfilled = data.orders.filter((o: Order) => o.status === "fulfilled").length;
      const revenue = data.orders.reduce((sum: number, o: Order) => sum + o.total, 0);

      setStats({ total, pending, fulfilled, revenue });
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Silently handle fetch errors - they may occur during navigation transitions
      setOrders([]);
      setFilteredOrders([]);
      setStats({ total: 0, pending: 0, fulfilled: 0, revenue: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Process declined charge retries
  const handleProcessRetries = async () => {
    setIsProcessingRetries(true);
    
    try {
      const response = await fetch(API_URL + "/admin/process-retries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to process retries");
      }

      const result = await response.json();
      
      // Refresh orders to show updated retry status
      await fetchOrders();
      
      alert(
        `✅ Retry Processing Complete!\\n\\n` +
        `Retries Attempted: ${result.retriesAttempted}\\n` +
        `Succeeded: ${result.retriesSucceeded}\\n` +
        `Failed: ${result.retriesFailed}\\n` +
        `Downsell Offers Sent: ${result.downsellOffersSent}\\n\\n` +
        `Customers have been notified via email.`
      );
    } catch (error) {
      console.error("Error processing retries:", error);
      alert("❌ Error processing retries. Check console for details.");
    } finally {
      setIsProcessingRetries(false);
    }
  };

  // Fetch affiliate reports
  const fetchAffiliateReports = async () => {
    try {
      const response = await fetch(API_URL + "/admin/affiliate-reports?dateRange=30days", {
        headers: {
          Authorization: "Bearer " + publicAnonKey,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch affiliate reports");

      const data = await response.json();
      setAffiliateReports(data.reports || []);
    } catch (error) {
      console.error("Error fetching affiliate reports:", error);
    }
  };

  // Fetch declined orders
  const fetchDeclinedOrders = async () => {
    try {
      const response = await fetch(API_URL + "/admin/declined-orders", {
        headers: {
          Authorization: "Bearer " + publicAnonKey,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch declined orders");

      const data = await response.json();
      setDeclinedOrders(data.declinedOrders || []);
    } catch (error) {
      console.error("Error fetching declined orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAffiliateReports();
    fetchDeclinedOrders();
  }, []);

  // Search/filter orders
  useEffect(() => {
    let filtered = orders;

    // Filter by archived status
    filtered = filtered.filter(order => showArchived ? order.archived === true : !order.archived);

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "unfulfilled") {
        // Unfulfilled = pending orders without tracking
        filtered = filtered.filter(order => order.status === "pending" && !order.trackingNumber);
      } else if (statusFilter === "pending") {
        // Pending = all pending orders (with or without tracking)
        filtered = filtered.filter(order => order.status === "pending");
      } else {
        // Standard status filter
        filtered = filtered.filter(order => order.status === statusFilter);
      }
    }

    // Filter by date range
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        
        switch (dateFilter) {
          case "today":
            return orderDate >= today;
          case "yesterday":
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return orderDate >= yesterday && orderDate < today;
          case "thisWeek":
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            return orderDate >= weekStart;
          case "lastWeek":
            const lastWeekStart = new Date(today);
            lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekEnd.getDate() + 7);
            return orderDate >= lastWeekStart && orderDate < lastWeekEnd;
          case "thisMonth":
            return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
          case "lastMonth":
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            return orderDate >= lastMonth && orderDate <= lastMonthEnd;
          default:
            return true;
        }
      });
    }

    // Filter by traffic source
    if (trafficSourceFilter !== "all") {
      if (trafficSourceFilter === "affiliate") {
        filtered = filtered.filter(order => order.affiliateId);
      } else if (trafficSourceFilter === "direct") {
        filtered = filtered.filter(order => !order.affiliateId && !order.trafficSource);
      } else if (trafficSourceFilter === "organic") {
        filtered = filtered.filter(order => order.trafficSource === "organic");
      } else if (trafficSourceFilter === "paid") {
        filtered = filtered.filter(order => order.trafficSource === "paid");
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderId.toLowerCase().includes(term) ||
          order.customerInfo.email.toLowerCase().includes(term) ||
          order.customerInfo.name.toLowerCase().includes(term) ||
          (order.trackingNumber && order.trackingNumber.toLowerCase().includes(term))
      );
    }

    // Calculate date-based stats
    const count = filtered.length;
    const revenue = filtered.reduce((sum, order) => sum + order.total, 0);
    setDateStats({ count, revenue });

    setFilteredOrders(filtered);
  }, [searchTerm, orders, statusFilter, showArchived, dateFilter, trafficSourceFilter]);

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "fulfilled":
        return "bg-green-600";
      case "canceled-refunded":
        return "bg-red-600";
      default:
        return "bg-gray-500";
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(API_URL + "/orders/" + orderId + "/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      await fetchOrders();
      alert("Status updated successfully!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status. Check console for details.");
    }
  };

  // Export orders to CSV
  const exportOrders = () => {
    const headers = ["Order ID", "Date", "Customer Name", "Email", "Phone", "Status", "Total", "Packages", "Tracking"];
    const csvData = filteredOrders.map((order) => [
      order.orderId || "N/A",
      formatDate(order.orderDate || order.createdAt),
      order.customerInfo?.name || "N/A",
      order.customerInfo?.email || "N/A",
      order.customerInfo?.phone || "N/A",
      order.status || "N/A",
      "$" + (order.total?.toFixed(2) || "0.00"),
      order.numberOfPackages || 0,
      order.trackingNumber || "N/A",
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders-" + new Date().toISOString().split("T")[0] + ".csv";
    a.click();
  };

  // Issue refund
  const processRefund = async () => {
    if (!refundOrder) return;

    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) {
      alert("Please enter a valid refund amount");
      return;
    }

    if (amount > refundOrder.total) {
      alert("Refund amount cannot exceed order total of $" + refundOrder.total.toFixed(2));
      return;
    }

    try {
      const response = await fetch(API_URL + "/orders/" + refundOrder.orderId + "/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        if (error.alreadyRefunded) {
          alert("⚠️ Already Refunded\\n\\nThis order has already been refunded for $" + error.refundAmount.toFixed(2) + ".\\n\\nNo action needed.");
          await fetchOrders();
          setRefundOrder(null);
          setRefundAmount("");
          return;
        }
        
        throw new Error(error.error || "Failed to process refund");
      }

      await fetchOrders();
      setRefundOrder(null);
      setRefundAmount("");
      alert("✅ Refund Successful!\\n\\nRefund of $" + amount.toFixed(2) + " processed successfully!\\n\\nStripe refund has been issued and customer has been notified via email and SMS.");
    } catch (error: any) {
      console.error("Error processing refund:", error);
      alert("❌ Refund Failed\\n\\n" + (error.message || "Failed to process refund"));
    }
  };

  // Edit next billing date
  const handleEditBillingDate = async () => {
    if (!editBillingDateOrder || !newBillingDate) {
      alert("⚠️ Please select a billing date");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/set-next-billing-date", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: editBillingDateOrder.orderId,
          nextBillingDate: newBillingDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update billing date");
      }

      const result = await response.json();
      await fetchOrders();
      setEditBillingDateOrder(null);
      setNewBillingDate("");
      alert(`✅ Next Billing Date Updated!\\n\\nNew billing date: ${new Date(newBillingDate).toLocaleDateString()}\\n\\nThe subscription will now charge on this date.`);
    } catch (error: any) {
      console.error("Error updating billing date:", error);
      alert("❌ Update Failed\\n\\n" + (error.message || "Failed to update billing date"));
    }
  };

  // Update next billing date only (without charging)
  const handleUpdateBillingDate = async () => {
    if (!editBillingDateOrder || !newBillingDate) {
      alert("⚠️ Please select a billing date");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/set-next-billing-date", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: editBillingDateOrder.orderId,
          nextBillingDate: newBillingDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update billing date");
      }

      const result = await response.json();
      await fetchOrders();
      setEditBillingDateOrder(null);
      setNewBillingDate("");
      alert(`✅ Next Billing Date Updated!\n\nNew billing date: ${new Date(newBillingDate).toLocaleDateString()}\n\nThe subscription will now charge on this date.`);
    } catch (error: any) {
      console.error("Error updating billing date:", error);
      alert("❌ Update Failed\n\n" + (error.message || "Failed to update billing date"));
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async () => {
    if (!cancelSubscriptionOrder || !cancelSubscriptionOrder.subscriptionId) return;

    try {
      const response = await fetch(API_URL + "/subscriptions/" + cancelSubscriptionOrder.subscriptionId + "/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: cancelSubscriptionOrder.orderId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel subscription");
      }

      await fetchOrders();
      setCancelSubscriptionOrder(null);
      alert("✅ Subscription Canceled Successfully!\\n\\nThe subscription has been canceled in Stripe and the customer has been notified via email.");
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      alert("❌ Cancellation Failed\\n\\n" + (error.message || "Failed to cancel subscription"));
    }
  };

  // Update billing interval
  const handleUpdateBillingInterval = async () => {
    if (!editBillingIntervalOrder) {
      alert("⚠️ No order selected");
      return;
    }

    const intervalDays = parseInt(newBillingInterval);
    if (!intervalDays || intervalDays < 1 || intervalDays > 365) {
      alert("⚠️ Please enter a valid billing interval (1-365 days)");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/update-billing-interval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: editBillingIntervalOrder.orderId,
          billingIntervalDays: intervalDays,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update billing interval");
      }

      await fetchOrders();
      setEditBillingIntervalOrder(null);
      setNewBillingInterval("");
      alert(`✅ Billing Interval Updated!\\n\\nNew interval: Every ${intervalDays} days\\n\\nFuture charges will occur every ${intervalDays} days after the last charge.`);
    } catch (error: any) {
      console.error("Error updating billing interval:", error);
      alert("❌ Update Failed\\n\\n" + (error.message || "Failed to update billing interval"));
    }
  };

  // Manual subscription billing
  const handleManualBilling = async () => {
    if (!manualBillingOrder || !manualBillingOrder.subscriptionId) return;

    setIsBillingInProgress(true);

    try {
      const response = await fetch(API_URL + "/admin/charge-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: manualBillingOrder.orderId,
          customBillingDate: customBillingDate || null,
          skipRecentChargeCheck: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Charge subscription failed:", error);
        console.error("📋 Error details:", JSON.stringify(error, null, 2));
        
        // Handle recent charge warning
        if (error.recentCharge) {
          setIsBillingInProgress(false);
          const confirmed = window.confirm(
            `⚠️ Recent Charge Detected\\n\\n` +
            `This subscription was charged ${error.daysSinceCharge} days ago.\\n` +
            `Last charge: ${new Date(error.lastChargeDate).toLocaleDateString()}\\n\\n` +
            `Are you sure you want to charge again?`
          );
          
          if (confirmed) {
            // Retry with skipRecentChargeCheck = true
            setIsBillingInProgress(true);
            const retryResponse = await fetch(API_URL + "/admin/charge-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + publicAnonKey,
              },
              body: JSON.stringify({
                orderId: manualBillingOrder.orderId,
                customBillingDate: customBillingDate || null,
                skipRecentChargeCheck: true,
              }),
            });

            if (!retryResponse.ok) {
              const retryError = await retryResponse.json();
              throw new Error(retryError.error || "Failed to charge subscription");
            }

            const retryResult = await retryResponse.json();
            await fetchOrders();
            setManualBillingOrder(null);
            setCustomBillingDate("");
            alert(`✅ Manual Billing Successful!\\n\\nAmount charged: $${(retryResult.amountCharged / 100).toFixed(2)}\\n\\nThe customer has been charged and will receive a receipt via email.`);
            setIsBillingInProgress(false);
            return;
          } else {
            // User canceled
            setManualBillingOrder(null);
            setCustomBillingDate("");
            return;
          }
        }
        
        throw new Error(error.error || "Failed to charge subscription");
      }

      const result = await response.json();
      await fetchOrders();
      setManualBillingOrder(null);
      setCustomBillingDate("");
      alert(`✅ Manual Billing Successful!\\n\\nAmount charged: $${(result.amountCharged / 100).toFixed(2)}\\n\\nThe customer has been charged and will receive a receipt via email.`);
    } catch (error: any) {
      console.error("Error charging subscription:", error);
      alert("❌ Billing Failed\\n\\n" + (error.message || "Failed to charge subscription"));
    } finally {
      setIsBillingInProgress(false);
    }
  };

  // Update subscription product name
  const handleUpdateSubscriptionProduct = async () => {
    if (!editSubscriptionDetailsOrder || !subscriptionProductName.trim()) {
      alert("⚠️ Please enter a product name");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/update-subscription-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: editSubscriptionDetailsOrder.orderId,
          subscriptionProductName: subscriptionProductName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product name");
      }

      await fetchOrders();
      alert(`✅ Product Name Updated!\\n\\nNew product: ${subscriptionProductName}`);
      setEditSubscriptionDetailsOrder(null);
      setSubscriptionProductName("");
    } catch (error: any) {
      console.error("Error updating subscription product:", error);
      alert("❌ Update Failed\\n\\n" + (error.message || "Failed to update product name"));
    }
  };

  // Update subscription price
  const handleUpdateSubscriptionPrice = async () => {
    if (!editSubscriptionDetailsOrder) {
      alert("⚠️ No order selected");
      return;
    }

    const price = parseFloat(subscriptionPrice);
    if (!price || price < 0.50 || price > 999.99) {
      alert("⚠️ Please enter a valid price ($0.50 - $999.99)");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/update-subscription-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: editSubscriptionDetailsOrder.orderId,
          subscriptionPrice: price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update price");
      }

      await fetchOrders();
      alert(`✅ Subscription Price Updated!\\n\\nNew price: $${price.toFixed(2)}/month`);
      setEditSubscriptionDetailsOrder(null);
      setSubscriptionPrice("");
    } catch (error: any) {
      console.error("Error updating subscription price:", error);
      alert("❌ Update Failed\\n\\n" + (error.message || "Failed to update price"));
    }
  };

  // Copy order link with fallback - uses custom domain
  const copyOrderLink = (order: Order) => {
    const token = (order as any).accessToken;
    
    // Use custom domain helper to generate the correct URL
    const orderUrl = token 
      ? getOrderLink(token)
      : getOrderLink(order.orderId); // Fallback to orderId for legacy orders
    
    navigator.clipboard.writeText(orderUrl);
    alert("✅ Order Link Copied!\\n\\nCustomers can view their order at:\\n" + orderUrl);
  };

  // Archive Order
  // [DELETED CORRUPTED DUPLICATE handleUpdateBillingInterval]
  /*const handleUpdateBillingInterval = async () => {
    if (!editBillingIntervalOrder) {
      alert("⚠️ No order selected");
      return;
    }

    const intervalDays = parseInt(newBillingInterval);
    if (!intervalDays || intervalDays < 1 || intervalDays > 365) {
      alert("��️ Please enter a valid billing interval (1-365 days)");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/update-billing-interval", {\n\nOrder: ${editBillingDateOrder.orderId}\nNew Next Billing: ${new Date(newBillingDate).toLocaleDateString()}\n\nIn live mode, this will update the subscription in Stripe and your database.`);
      setEditBillingDateOrder(null);
      setNewBillingDate("");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/set-next-billing-date", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: editBillingDateOrder.orderId,
          nextBillingDate: newBillingDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update billing date");
      }

      const result = await response.json();
      await fetchOrders();
      setEditBillingDateOrder(null);
      setNewBillingDate("");
      alert(`✅ Next Billing Date Updated!\n\nNew billing date: ${new Date(newBillingDate).toLocaleDateString()}\n\nThe subscription will now charge on this date.`);
    } catch (error: any) {
      console.error("Error updating billing date:", error);
      alert("❌ Update Failed\n\n" + (error.message || "Failed to update billing date"));
    }
  };

  // Update billing interval
  const handleUpdateBillingInterval = async () => {
    if (!editBillingIntervalOrder) {
      alert("⚠️ No order selected");
      return;
    }

    const intervalDays = parseInt(newBillingInterval);
    if (!intervalDays || intervalDays < 1 || intervalDays > 365) {
      alert("⚠️ Please enter a valid billing interval (1-365 days)");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/set-billing-interval", {\\n\\nOrder: ${editBillingIntervalOrder.orderId}\\nNew Interval: Every ${intervalDays} days\\n\\nIn live mode, this will update the subscription billing cycle.`);
      setEditBillingIntervalOrder(null);
      setNewBillingInterval("");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/update-billing-interval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: editBillingIntervalOrder.orderId,
          billingIntervalDays: intervalDays,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update billing interval");
      }

      await fetchOrders();
      setEditBillingIntervalOrder(null);
      setNewBillingInterval("");
      alert(`✅ Billing Interval Updated!\\n\\nNew interval: Every ${intervalDays} days\\n\\nFuture charges will occur every ${intervalDays} days after the last charge.`);
    } catch (error: any) {
      console.error("Error updating billing interval:", error);
      alert("❌ Update Failed\\n\\n" + (error.message || "Failed to update billing interval"));
    }
  };

  // Manual subscription billing
  const handleManualBilling = async () => {
    if (!manualBillingOrder || !manualBillingOrder.subscriptionId) return;

    try {
      const response = await fetch(API_URL + "/admin/manual-billing", {\n\nSubscription: " + manualBillingOrder.subscriptionId + "\nAmount: $12.00";
      const dateMsg = customBillingDate ? "\nNext Billing: " + new Date(customBillingDate).toLocaleDateString() : "";
      alert(billingMsg + dateMsg + "\n\nIn live mode, this will charge the customer's card on file immediately.");
      setManualBillingOrder(null);
      setCustomBillingDate("");
      return;
    }

    setIsBillingInProgress(true);

    try {
      const response = await fetch(API_URL + "/admin/charge-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: manualBillingOrder.orderId,
          customBillingDate: customBillingDate || null,
          skipRecentChargeCheck: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Charge subscription failed:", error);
        console.error("📋 Error details:", JSON.stringify(error, null, 2));
        
        // Handle recent charge warning
        if (error.recentCharge) {
          setIsBillingInProgress(false);
          const confirmed = window.confirm(
            `⚠️ Recent Charge Detected\\n\\n` +
            `This subscription was charged ${error.daysSinceCharge} days ago.\\n` +
            `Last charge: ${new Date(error.lastChargeDate).toLocaleDateString()}\\n\\n` +
            `Are you sure you want to charge again?`
          );
          
          if (confirmed) {
            // Retry with skipRecentChargeCheck = true
            setIsBillingInProgress(true);
            const retryResponse = await fetch(API_URL + "/admin/charge-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + publicAnonKey,
              },
              body: JSON.stringify({
                orderId: manualBillingOrder.orderId,
                customBillingDate: customBillingDate || null,
                skipRecentChargeCheck: true,
              }),
            });
            
            if (!retryResponse.ok) {
              const retryError = await retryResponse.json();
              throw new Error(retryError.error || "Failed to charge subscription");
            }
            
            const result = await retryResponse.json();
            await fetchOrders();
            setManualBillingOrder(null);
            setCustomBillingDate("");
            
            const successMsg = "✅ Subscription Charged Successfully!\\n\\nInvoice: " + result.invoiceId + "\\nAmount Charged: $" + result.amountCharged;
            const nextBillingMsg = result.nextBillingDate ? "\\nNext Billing: " + new Date(result.nextBillingDate).toLocaleDateString() : "";
            alert(successMsg + nextBillingMsg + "\\n\\nCustomer has been notified via email.");
            return;
          } else {
            setManualBillingOrder(null);
            setCustomBillingDate("");
            return;
          }
        }
        
        throw new Error(error.error || "Failed to charge subscription");
      }

      const result = await response.json();
      await fetchOrders();
      setManualBillingOrder(null);
      setCustomBillingDate("");
      
      const successMsg = "✅ Subscription Charged Successfully!\n\nInvoice: " + result.invoiceId + "\nAmount Charged: $" + result.amountCharged;
      const nextBillingMsg = result.nextBillingDate ? "\nNext Billing: " + new Date(result.nextBillingDate).toLocaleDateString() : "";
      alert(successMsg + nextBillingMsg + "\n\nCustomer has been notified via email.");
    } catch (error: any) {
      console.error("❌ Error charging subscription:", error);
      console.error("📋 Full error details:", JSON.stringify(error, null, 2));
      alert("❌ Billing Failed\n\n" + (error.message || "Failed to charge subscription"));
    } finally {
      setIsBillingInProgress(false);
    }
  };*/

  // Archive Order
  const archiveOrder = async (orderId: string) => {
    try {
      const response = await fetch(API_URL + "/orders/" + orderId + "/archive", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + publicAnonKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to archive order");
      }

      await fetchOrders();
      setArchiveConfirmOrder(null);
      alert("✅ Order archived successfully! View in 'Archived Orders' tab.");
    } catch (error) {
      console.error("Error archiving order:", error);
      alert("Error archiving order. Check console for details.");
    }
  };

  // Unarchive Order
  const unarchiveOrder = async (orderId: string) => {
    try {
      const response = await fetch(API_URL + "/orders/" + orderId + "/unarchive", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + publicAnonKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to unarchive order");
      }

      await fetchOrders();
      alert("✅ Order restored successfully!");
    } catch (error) {
      console.error("Error unarchiving order:", error);
      alert("Error unarchiving order. Check console for details.");
    }
  };

  // Delete Order Permanently
  const deleteOrderPermanently = async (orderId: string) => {
    try {
      const response = await fetch(API_URL + "/orders/" + orderId + "/delete", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + publicAnonKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      await fetchOrders();
      setDeleteConfirmOrder(null);
      alert("✅ Order deleted permanently from database!");
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Error deleting order. Check console for details.");
    }
  };

  /*// [DELETED SECOND CORRUPTED BLOCK - duplicates of copyOrderLink, processAffiliateBatchRetry, handleUpdateSubscriptionPrice]
  // Copy order link with fallback - uses custom domain
  const copyOrderLink = (order: Order) => {
    const token = (order as any).accessToken;
    
    // Use custom domain helper to generate the correct URL
    const orderUrl = token 
      ? getOrderLink(token)
      : getOrderLink(order.orderId); // Fallback to orderId for legacy orders
    
    navigator.clipboard.writeText(orderUrl);
    alert("✅ Order Link Copied!\\n\\nCustomers can view their order at:\\n" + orderUrl);
  };

  // Process affiliate batch retry
  const processAffiliateBatchRetry = async () => {
    if (!affiliateRetryConfirmation) {
      alert("⚠️ Please enter a product name");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/update-subscription-product", {\\n\\nOrder: ${editSubscriptionDetailsOrder.orderId}\\nNew Product: ${subscriptionProductName}\\n\\nIn live mode, this will update the subscription product name.`);
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/update-subscription-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: editSubscriptionDetailsOrder.orderId,
          subscriptionProductName: subscriptionProductName.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product name");
      }

      await fetchOrders();
      alert(`✅ Product Name Updated!\\n\\nNew product: ${subscriptionProductName}`);
    } catch (error: any) {
      console.error("Error updating product name:", error);
      alert("❌ Update Failed\\n\\n" + (error.message || "Failed to update product name"));
    }
  };

  // Update subscription price
  const handleUpdateSubscriptionPrice = async () => {
    if (!editSubscriptionDetailsOrder) {
      alert("⚠️ No order selected");
      return;
    }

    const price = parseFloat(subscriptionPrice);
    if (!price || price < 0.50 || price > 999.99) {
      alert("⚠️ Please enter a valid price ($0.50 - $999.99)");
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/update-subscription-price", {\\n\\nOrder: ${editSubscriptionDetailsOrder.orderId}\\nNew Price: ${price.toFixed(2)}\\n\\nIn live mode, this will update the monthly subscription price.`);
      return;
    }

    try {
      const response = await fetch(API_URL + "/admin/update-subscription-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({
          orderId: editSubscriptionDetailsOrder.orderId,
          subscriptionPrice: price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update price");
      }

      await fetchOrders();
      alert(`✅ Subscription Price Updated!\\n\\nNew monthly price: ${price.toFixed(2)}`);
    } catch (error: any) {
      console.error("Error updating price:", error);
      alert("❌ Update Failed\\n\\n" + (error.message || "Failed to update price"));
    }
  };

  // Copy order link with fallback - uses custom domain
  const copyOrderLink = (order: Order) => {
    const token = (order as any).accessToken;
    
    // Use custom domain helper to generate the correct URL
    const orderUrl = token 
      ? getOrderLink(token)
      : getOrderLink(order.orderId); // Fallback to orderId for legacy orders
    
    const textArea = document.createElement("textarea");
    textArea.value = orderUrl;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert("✅ Order link copied!\n\n" + orderUrl + "\n\nShare this link with the customer to let them view/edit their order.");
    } catch (err) {
      document.body.removeChild(textArea);
      console.error('Failed to copy:', err);
      alert("Order Link:\n\n" + orderUrl + "\n\nCopy this link and share it with the customer.");
    }
  };*/

  // Add tracking number
  const addTrackingNumber = async () => {
    if (!selectedOrder || !singleTrackingNumber.trim()) {
      alert("Please enter a tracking number");
      return;
    }

    try {
      const response = await fetch(API_URL + "/orders/" + selectedOrder.orderId + "/tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({ 
          trackingNumber: singleTrackingNumber,
          carrier: carrierName
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add tracking number");
      }

      await fetchOrders();
      setSingleTrackingNumber("");
      setCarrierName("USPS");
      setSelectedOrder(null);
      alert("✅ Tracking Added!\n\nOrder marked as fulfilled and customer has been notified via email and SMS.");
    } catch (error) {
      console.error("Error adding tracking:", error);
      alert("Error adding tracking number. Check console for details.");
    }
  };

  // Bulk import tracking
  const bulkImportTracking = async () => {
    const lines = bulkTrackingData.split("\n").filter((line) => line.trim());
    
    if (lines.length === 0) {
      alert("Please enter tracking data");
      return;
    }

    try {
      const trackingData = lines.map((line) => {
        const [orderId, trackingNumber] = line.split(",").map((s) => s.trim());
        return { orderId, trackingNumber };
      });

      const response = await fetch(API_URL + "/orders/bulk-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({ trackingData }),
      });

      if (!response.ok) {
        throw new Error("Failed to bulk import");
      }

      await fetchOrders();
      setBulkTrackingData("");
      setTrackingDialogOpen(false);
      alert("✅ Bulk Import Complete!\n\n" + lines.length + " tracking numbers imported successfully!");
    } catch (error) {
      console.error("Error bulk importing:", error);
      alert("Error bulk importing tracking numbers. Check console for details.");
    }
  };

  // Cancel subscription
  const confirmCancelSubscription = async () => {
    if (!cancelSubscriptionOrder || !cancelSubscriptionOrder.subscriptionId) return;

    try {
      const response = await fetch(API_URL + "/subscriptions/" + cancelSubscriptionOrder.subscriptionId + "/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({ orderId: cancelSubscriptionOrder.orderId }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      await fetchOrders();
      setCancelSubscriptionOrder(null);
      alert("✅ Subscription Canceled!\n\nSubscription has been canceled in Stripe and customer has been notified.");
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert("Error canceling subscription. Check console for details.");
    }
  };

  // Resend email notification
  const handleResendEmail = async (orderId: string, emailType: string) => {
    try {
      const response = await fetch(API_URL + "/order/" + orderId + "/resend-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({ emailType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to resend email");
      }

      const result = await response.json();
      alert(`✅ Email Resent Successfully!\n\nType: ${emailType}\nRecipient: ${result.recipient}\nEmail ID: ${result.emailId}`);
      
      // Refresh orders to show updated activity log
      await fetchOrders();
    } catch (error: any) {
      console.error("Error resending email:", error);
      alert(`Error resending email: ${error.message}`);
    }
  };

  // Edit order letter packages
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditedPackages(JSON.parse(JSON.stringify(order.letterPackages)));
  };

  const saveOrderEdit = async () => {
    if (!editingOrder) return;

    try {
      const identifier = (editingOrder as any).accessToken || editingOrder.orderId;
      const response = await fetch(API_URL + "/orders/" + identifier + "/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({ letterPackages: editedPackages }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      await fetchOrders();
      setEditingOrder(null);
      alert("✅ Order Updated!\n\nChanges saved and customer has been notified via email.");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order. Check console for details.");
    }
  };

  // Edit customer info
  const handleEditCustomerInfo = (order: Order) => {
    setEditingCustomerInfo(order);
    const customerInfo = order.customerInfo || { 
      name: '', 
      email: '', 
      phone: '', 
      address: { line1: '', line2: '', city: '', state: '', postal_code: '', country: 'US' } 
    };
    setEditedCustomerInfo(JSON.parse(JSON.stringify(customerInfo)));
  };

  const saveCustomerInfoEdit = async () => {
    if (!editingCustomerInfo || !editedCustomerInfo) return;

    try {
      const response = await fetch(API_URL + "/orders/" + editingCustomerInfo.orderId + "/customer-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + publicAnonKey,
        },
        body: JSON.stringify({ customerInfo: editedCustomerInfo }),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer info");
      }

      await fetchOrders();
      setEditingCustomerInfo(null);
      setEditedCustomerInfo(null);
      alert("✅ Customer Info Updated!\n\nChanges have been saved.");
    } catch (error) {
      console.error("Error updating customer info:", error);
      alert("Error updating customer info. Check console for details.");
    }
  };

  // Create monthly subscription order
  const createMonthlyOrder = async (subscriptionId: string) => {
    try {
      const response = await fetch(API_URL + "/subscriptions/" + subscriptionId + "/create-order", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + publicAnonKey,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create monthly order");
      }

      await fetchOrders();
      alert("✅ Monthly Order Created!\n\nA new order has been created for this subscription.");
    } catch (error) {
      console.error("Error creating monthly order:", error);
      alert("Error creating monthly order. Check console for details.");
    }
  };

  // Bulk selection handlers
  const handleSelectRegularOrder = (orderId: string) => {
    setSelectedRegularOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectSubscriptionOrder = (orderId: string) => {
    setSelectedSubscriptionOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSelectAllRegular = (ordersList: Order[]) => {
    if (selectedRegularOrders.size === ordersList.length) {
      setSelectedRegularOrders(new Set());
    } else {
      setSelectedRegularOrders(new Set(ordersList.map(o => o.orderId)));
    }
  };

  const handleSelectAllSubscription = (ordersList: Order[]) => {
    if (selectedSubscriptionOrders.size === ordersList.length) {
      setSelectedSubscriptionOrders(new Set());
    } else {
      setSelectedSubscriptionOrders(new Set(ordersList.map(o => o.orderId)));
    }
  };

  // Bulk actions for regular orders
  const handleBulkRegularAction = async (action: string) => {
    if (selectedRegularOrders.size === 0) {
      alert("No orders selected");
      return;
    }

    const selectedIds = Array.from(selectedRegularOrders);
    const confirmed = confirm(`Are you sure you want to ${action} ${selectedIds.length} order(s)?`);
    if (!confirmed) return;

    setBulkActionInProgress(true);
    try {
      switch (action) {
        case "archive":
          // Bulk archive without individual alerts
          for (const orderId of selectedIds) {
            const response = await fetch(API_URL + "/orders/" + orderId + "/archive", {
              method: "POST",
              headers: {
                Authorization: "Bearer " + publicAnonKey,
              },
            });
            if (!response.ok) {
              throw new Error(`Failed to archive order ${orderId}`);
            }
          }
          await fetchOrders();
          alert(`✅ Archived ${selectedIds.length} order(s) successfully!`);
          break;
        
        case "fulfill":
          for (const orderId of selectedIds) {
            await updateOrderStatus(orderId, "fulfilled");
          }
          alert(`✅ Marked ${selectedIds.length} order(s) as fulfilled!`);
          break;

        case "pending":
          for (const orderId of selectedIds) {
            await updateOrderStatus(orderId, "pending");
          }
          alert(`✅ Updated ${selectedIds.length} order(s) to pending!`);
          break;

        case "export":
          const ordersToExport = orders.filter(o => selectedIds.includes(o.orderId));
          const headers = ["Order ID", "Date", "Customer Name", "Email", "Phone", "Status", "Total", "Packages", "Tracking"];
          const csvData = ordersToExport.map((order) => [
            order.orderId || "N/A",
            formatDate(order.orderDate || order.createdAt),
            order.customerInfo?.name || "N/A",
            order.customerInfo?.email || "N/A",
            order.customerInfo?.phone || "N/A",
            order.status || "N/A",
            "$" + (order.total?.toFixed(2) || "0.00"),
            order.numberOfPackages || 0,
            order.trackingNumber || "N/A",
          ]);
          const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `selected-orders-${new Date().toISOString().split("T")[0]}.csv`;
          a.click();
          alert(`✅ Exported ${selectedIds.length} order(s) to CSV!`);
          break;
      }
      setSelectedRegularOrders(new Set());
      await fetchOrders();
    } catch (error) {
      console.error("Bulk action error:", error);
      alert("Error performing bulk action. Check console for details.");
    } finally {
      setBulkActionInProgress(false);
    }
  };

  // Bulk actions for subscription orders
  const handleBulkSubscriptionAction = async (action: string) => {
    if (selectedSubscriptionOrders.size === 0) {
      alert("No subscriptions selected");
      return;
    }

    const selectedIds = Array.from(selectedSubscriptionOrders);
    const confirmed = confirm(`Are you sure you want to ${action} ${selectedIds.length} subscription(s)?`);
    if (!confirmed) return;

    setBulkActionInProgress(true);
    try {
      switch (action) {
        case "cancel":
          let successCount = 0;
          for (const orderId of selectedIds) {
            const order = orders.find(o => o.orderId === orderId);
            if (order?.subscriptionId) {
              try {
                const response = await fetch(API_URL + "/subscriptions/" + order.subscriptionId + "/cancel", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + publicAnonKey,
                  },
                  body: JSON.stringify({ orderId: order.orderId }),
                });
                if (response.ok) successCount++;
              } catch (err) {
                console.error(`Failed to cancel ${orderId}:`, err);
              }
            }
          }
          alert(`✅ Canceled ${successCount} subscription(s) successfully!`);
          break;

        case "archive":
          // Bulk archive without individual alerts
          for (const orderId of selectedIds) {
            const response = await fetch(API_URL + "/orders/" + orderId + "/archive", {
              method: "POST",
              headers: {
                Authorization: "Bearer " + publicAnonKey,
              },
            });
            if (!response.ok) {
              throw new Error(`Failed to archive subscription ${orderId}`);
            }
          }
          await fetchOrders();
          alert(`✅ Archived ${selectedIds.length} subscription(s) successfully!`);
          break;

        case "export":
          const subsToExport = orders.filter(o => selectedIds.includes(o.orderId));
          const headers = ["Order ID", "Date", "Customer Name", "Email", "Subscription ID", "Status", "Monthly Price", "Next Billing"];
          const csvData = subsToExport.map((order) => [
            order.orderId || "N/A",
            formatDate(order.orderDate || order.createdAt),
            order.customerInfo?.name || "N/A",
            order.customerInfo?.email || "N/A",
            order.subscriptionId || "N/A",
            order.status || "N/A",
            "$" + ((order as any).subscriptionPrice || 12).toFixed(2),
            order.subscriptionNextBillingDate ? new Date(order.subscriptionNextBillingDate).toLocaleDateString() : "N/A",
          ]);
          const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `selected-subscriptions-${new Date().toISOString().split("T")[0]}.csv`;
          a.click();
          alert(`✅ Exported ${selectedIds.length} subscription(s) to CSV!`);
          break;
      }
      setSelectedSubscriptionOrders(new Set());
      await fetchOrders();
    } catch (error) {
      console.error("Bulk subscription action error:", error);
      alert("Error performing bulk action. Check console for details.");
    } finally {
      setBulkActionInProgress(false);
    }
  };

  // Filter regular vs subscription orders
  const regularOrders = filteredOrders.filter((order) => !order.monthlySubscription);
  const subscriptionOrders = filteredOrders.filter((order) => order.monthlySubscription);

  // Sort orders
  const sortOrders = (ordersList: Order[]) => {
    if (!sortByShippingDate) return ordersList;
    
    const shippingDateOrder = [
      "December 1st", "December 2nd", "December 3rd", "December 4th", "December 5th",
      "December 6th", "December 7th", "December 8th", "December 9th", "December 10th",
      "December 11th", "December 12th", "December 13th", "December 14th", "December 15th",
      "December 16th", "December 17th", "December 18th", "December 19th", "December 20th",
    ];

    return [...ordersList].sort((a, b) => {
      const indexA = shippingDateOrder.indexOf(a.shippingDate);
      const indexB = shippingDateOrder.indexOf(b.shippingDate);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  };

  const sortedRegularOrders = sortOrders(regularOrders);
  const sortedSubscriptionOrders = sortOrders(subscriptionOrders);

  // Pagination calculations
  const totalRegularPages = Math.ceil(sortedRegularOrders.length / ORDERS_PER_PAGE);
  const totalSubscriptionPages = Math.ceil(sortedSubscriptionOrders.length / ORDERS_PER_PAGE);

  // Get paginated orders
  const paginatedRegularOrders = sortedRegularOrders.slice(
    (regularOrdersPage - 1) * ORDERS_PER_PAGE,
    regularOrdersPage * ORDERS_PER_PAGE
  );
  const paginatedSubscriptionOrders = sortedSubscriptionOrders.slice(
    (subscriptionOrdersPage - 1) * ORDERS_PER_PAGE,
    subscriptionOrdersPage * ORDERS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setRegularOrdersPage(1);
  }, [searchTerm, statusFilter, showArchived, dateFilter, trafficSourceFilter, sortByShippingDate]);

  useEffect(() => {
    setSubscriptionOrdersPage(1);
  }, [searchTerm, statusFilter, showArchived, dateFilter, trafficSourceFilter, sortByShippingDate]);

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6 mb-4">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {startPage > 1 && (
          <>
            <Button
              onClick={() => onPageChange(1)}
              variant="outline"
              size="sm"
            >
              1
            </Button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pageNumbers.map((page) => (
          <Button
            key={page}
            onClick={() => onPageChange(page)}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            className={currentPage === page ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <Button
              onClick={() => onPageChange(totalPages)}
              variant="outline"
              size="sm"
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        
        <span className="text-sm text-gray-600 ml-4">
          Page {currentPage} of {totalPages} ({sortedRegularOrders.length + sortedSubscriptionOrders.length} total orders)
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Bulk Action Loading Overlay */}
      {bulkActionInProgress && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl mb-2">Processing Bulk Action...</h3>
              <p className="text-gray-600">Please wait while we process your request.</p>
              <p className="text-sm text-gray-500 mt-2">Do not close or refresh this page.</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl">🎅 Admin Dashboard</h1>
          <div className="flex gap-3">
            <Button
                onClick={async () => {
                  const password = prompt("Enter admin password to run migration:");
                  if (!password) return;
                  
                  if (!confirm("This will update all orders with missing Stripe customer IDs.\n\nThis is safe to run and will fix upsell functionality for older orders.\n\nContinue?")) return;
                  
                  setIsMigrating(true);
                  setMigrationResult(null);
                  try {
                    const response = await fetch(
                      `${API_URL}/admin/migrate-customer-ids`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${publicAnonKey}`,
                        },
                        body: JSON.stringify({ adminPassword: password }),
                      }
                    );
                    const result = await response.json();
                    setMigrationResult(result);
                    if (result.success) {
                      alert(`✅ Migration Complete!\n\n📊 Results:\n• Updated: ${result.updated} orders\n• Already OK: ${result.skipped} orders\n• Errors: ${result.errors}\n\nAll orders should now support upsells!`);
                      fetchOrders();
                    } else {
                      alert(`❌ Migration failed: ${result.error}`);
                    }
                  } catch (error: any) {
                    alert(`❌ Error: ${error.message}`);
                  } finally {
                    setIsMigrating(false);
                  }
                }}
                disabled={isMigrating}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Fix Customer IDs
                  </>
                )}
              </Button>
            {onGoToAffiliateManage && (
              <Button onClick={onGoToAffiliateManage} variant="outline">
                Manage Affiliates
              </Button>
            )}
            {onGoToUpsellManage && (
              <Button onClick={onGoToUpsellManage} variant="outline" className="bg-green-50 hover:bg-green-100">
                🎁 Manage Upsells
              </Button>
            )}
            <Button onClick={onBackToSales} variant="outline">
              ← Back to Sales
            </Button>
            {onLogout && (
              <Button onClick={onLogout} variant="outline">
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Date Filter */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="lastWeek">Last Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
          {dateFilter !== "all" && (
            <div className="text-sm text-gray-600">
              Showing {dateStats.count} orders · ${dateStats.revenue.toFixed(2)} revenue
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl">{dateFilter === "all" ? stats.total : dateStats.count}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl">{dateFilter === "all" ? stats.pending : filteredOrders.filter(o => o.status === "pending").length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Fulfilled</p>
                <p className="text-2xl">{dateFilter === "all" ? stats.fulfilled : filteredOrders.filter(o => o.status === "fulfilled").length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl">${(dateFilter === "all" ? stats.revenue : dateStats.revenue).toFixed(2)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col gap-4">
            {/* Retry Processing Button */}
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <Button
                onClick={handleProcessRetries}
                disabled={isProcessingRetries}
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isProcessingRetries ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    🔄 Process Declined Charge Retries
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-600">
                Manually trigger retry system for failed subscription payments
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Search by order ID, email, name, or tracking number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending (All)</SelectItem>
                  <SelectItem value="unfulfilled">Unfulfilled (No Tracking)</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled (Shipped)</SelectItem>
                  <SelectItem value="canceled-refunded">Canceled/Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="lastWeek">Last Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={trafficSourceFilter} onValueChange={setTrafficSourceFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Traffic source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="affiliate">Affiliate</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="organic">Organic</SelectItem>
                  <SelectItem value="paid">Paid Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateFilter !== "all" && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-blue-800">Orders: </span>
                    <span className="font-semibold text-blue-900">{dateStats.count}</span>
                  </div>
                  <div>
                    <span className="text-sm text-blue-800">Revenue: </span>
                    <span className="font-semibold text-blue-900">${dateStats.revenue.toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => setDateFilter("all")} 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-700"
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="flex gap-3 flex-wrap">
              <Button onClick={fetchOrders} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportOrders} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Bulk Import Tracking Numbers</DialogTitle>
                    <DialogDescription>
                      Upload multiple tracking numbers at once using CSV format. Orders will be automatically marked as fulfilled.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Paste Order ID and Tracking Numbers</Label>
                      <p className="text-sm text-gray-600 mb-2">
                        Format: One per line, comma-separated: OrderID,TrackingNumber
                      </p>
                      <Textarea
                        placeholder={"cs_test_001,1Z999AA10123456784\ncs_test_002,1Z999AA10123456785"}
                        rows={10}
                        value={bulkTrackingData}
                        onChange={(e) => setBulkTrackingData(e.target.value)}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                      <p className="text-blue-800">
                        Orders will be automatically marked as "fulfilled" when tracking numbers are added.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={bulkImportTracking} className="flex-1">
                        Import & Mark as Fulfilled
                      </Button>
                      <Button
                        onClick={() => setTrackingDialogOpen(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="alerts">
              <Bell className="w-4 h-4 mr-2" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="orders">Regular Orders ({regularOrders.length})</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscription Orders ({subscriptionOrders.length})</TabsTrigger>
            <TabsTrigger value="affiliates">Affiliate Management</TabsTrigger>
            <TabsTrigger value="affiliate-reports">Affiliate Reports</TabsTrigger>
            <TabsTrigger value="declined">Declined ({declinedOrders.length})</TabsTrigger>
          </TabsList>

          {/* Admin Alerts Tab */}
          <TabsContent value="alerts">
            <AdminAlerts 
              onViewOrder={(orderId) => {
                // Find and show order details
                const order = orders.find(o => o.orderId === orderId);
                if (order) {
                  setSelectedOrderForActivity(order);
                  // Switch to appropriate tab
                  if (order.monthlySubscription && order.subscriptionId) {
                    setActiveTab('subscriptions');
                  } else {
                    setActiveTab('orders');
                  }
                }
              }}
            />
          </TabsContent>

          {/* Regular Orders Tab */}
          <TabsContent value="orders">
            <div className="mb-4 flex gap-3">
              <Button 
                onClick={() => setSortByShippingDate(!sortByShippingDate)}
                variant={sortByShippingDate ? "default" : "outline"}
                size="sm"
              >
                {sortByShippingDate ? "✓ Sorted by Shipping Date" : "Sort by Shipping Date"}
              </Button>
              <Button 
                onClick={() => setShowArchived(!showArchived)}
                variant={showArchived ? "default" : "outline"}
                size="sm"
                className={showArchived ? "bg-gray-600" : ""}
              >
                {showArchived ? "📦 Viewing Archived" : "🗄️ View Archived"}
              </Button>
            </div>

            {/* Bulk Selection Toolbar for Regular Orders */}
            {sortedRegularOrders.length > 0 && (
              <div className="mb-4 bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedRegularOrders.size === paginatedRegularOrders.length && paginatedRegularOrders.length > 0}
                      onCheckedChange={() => handleSelectAllRegular(paginatedRegularOrders)}
                      id="select-all-regular"
                    />
                    <label htmlFor="select-all-regular" className="text-sm cursor-pointer">
                      Select All ({selectedRegularOrders.size} selected)
                    </label>
                  </div>
                  
                  {selectedRegularOrders.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 mr-2">Bulk Actions:</span>
                      <Button
                        onClick={() => handleBulkRegularAction("fulfill")}
                        disabled={bulkActionInProgress}
                        size="sm"
                        variant="outline"
                        className="bg-green-50 hover:bg-green-100"
                      >
                        <CheckSquare className="w-4 h-4 mr-1" />
                        Mark Fulfilled
                      </Button>
                      <Button
                        onClick={() => handleBulkRegularAction("pending")}
                        disabled={bulkActionInProgress}
                        size="sm"
                        variant="outline"
                        className="bg-yellow-50 hover:bg-yellow-100"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Mark Pending
                      </Button>
                      <Button
                        onClick={() => handleBulkRegularAction("archive")}
                        disabled={bulkActionInProgress}
                        size="sm"
                        variant="outline"
                        className="bg-gray-50 hover:bg-gray-100"
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Archive
                      </Button>
                      <Button
                        onClick={() => handleBulkRegularAction("export")}
                        disabled={bulkActionInProgress}
                        size="sm"
                        variant="outline"
                        className="bg-blue-50 hover:bg-blue-100"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export CSV
                      </Button>
                      <Button
                        onClick={() => setSelectedRegularOrders(new Set())}
                        disabled={bulkActionInProgress}
                        size="sm"
                        variant="ghost"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading orders...</p>
              </div>
            ) : sortedRegularOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No regular orders found</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {((regularOrdersPage - 1) * ORDERS_PER_PAGE) + 1} - {Math.min(regularOrdersPage * ORDERS_PER_PAGE, sortedRegularOrders.length)} of {sortedRegularOrders.length} orders
                </div>
                <PaginationControls 
                  currentPage={regularOrdersPage}
                  totalPages={totalRegularPages}
                  onPageChange={setRegularOrdersPage}
                />
                <div className="space-y-4">
                  {paginatedRegularOrders.map((order) => (
                  <Card key={order.orderId} className="p-6 relative">
                    {/* Bulk Selection Checkbox */}
                    <div className="absolute top-6 left-6">
                      <Checkbox
                        checked={selectedRegularOrders.has(order.orderId)}
                        onCheckedChange={() => handleSelectRegularOrder(order.orderId)}
                        id={`select-${order.orderId}`}
                      />
                    </div>
                    
                    <div className="pl-8">
                    {/* Data Inspector - Debug Tool */}
                    {(order.monthlySubscription || order.subscriptionId) && (
                      <details className="mb-4 bg-yellow-50 border border-yellow-300 rounded p-3">
                        <summary className="cursor-pointer text-sm font-semibold text-yellow-900">
                          ⚠️ Subscription Data Found - Click to inspect
                        </summary>
                        <div className="mt-2 text-xs space-y-1 font-mono bg-white p-3 rounded border">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <strong>monthlySubscription:</strong>
                              <code className={order.monthlySubscription ? "text-green-600" : "text-red-600"}>
                                {String(order.monthlySubscription ?? "undefined")}
                              </code>
                            </div>
                            <div>
                              <strong>subscriptionId:</strong>
                              <code className={order.subscriptionId ? "text-green-600" : "text-red-600"}>
                                {order.subscriptionId || "null/undefined"}
                              </code>
                            </div>
                          </div>
                          <div className="border-t pt-2 mt-2 bg-blue-50 p-2 rounded">
                            <strong className="text-blue-900">💡 Why is this in "Regular Orders"?</strong>
                            <p className="text-blue-800 mt-1">
                              This order has monthlySubscription={String(order.monthlySubscription)} 
                              {!order.subscriptionId && " but NO subscriptionId"}
                              {order.subscriptionId && ` and subscriptionId="${order.subscriptionId}"`}.
                              {order.subscriptionId ? " It should appear in Subscriptions tab!" : " Without a subscriptionId, buttons won't show."}
                            </p>
                          </div>
                        </div>
                      </details>
                    )}
                    
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg mb-1">Order #{order.orderId.slice(-8)}</h3>
                            <p className="text-sm text-gray-500">{formatDate(order.orderDate)}</p>
                            {order.trackingNumber && (
                              <div className="flex items-center gap-2 mt-2">
                                <Truck className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-mono text-green-700">
                                  {order.trackingNumber}
                                </span>
                              </div>
                            )}
                            {order.affiliateId && (
                              <div className="mt-1">
                                <p className="text-sm text-purple-600">
                                  Affiliate: {order.affiliateName} (${order.affiliateCommission?.toFixed(2) || '0.00'} commission)
                                </p>
                                {order.subIds && Object.keys(order.subIds).length > 0 && (
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {order.subIds.affS1 && `affS1: ${order.subIds.affS1}`}
                                    {order.subIds.affS2 && ` | affS2: ${order.subIds.affS2}`}
                                    {order.subIds.affS3 && ` | affS3: ${order.subIds.affS3}`}
                                  </p>
                                )}
                              </div>
                            )}
                            {order.monthlySubscription && order.subscriptionId && (
                              <div className="mt-2 inline-flex items-center gap-2 bg-blue-100 border-2 border-blue-400 rounded-lg px-3 py-1.5">
                                <Calendar className="w-4 h-4 text-blue-700" />
                                <span className="text-sm text-blue-900">
                                  <strong>Active Subscription:</strong> {(order as any).subscriptionQuantity || order.numberOfPackages} × $12 = ${((order as any).subscriptionPrice || (order.numberOfPackages * 12)).toFixed(2)}/month
                                </span>
                              </div>
                            )}
                          </div>
                          <Badge className={getStatusColor(order.status) + " text-white"}>
                            {order.status}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 text-sm mb-1">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{order.customerInfo?.name || 'N/A'}</span>
                            </div>
                            <div className="text-sm text-gray-500 ml-6">{order.customerInfo?.email || 'N/A'}</div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-sm mb-1">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{order.customerInfo?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-gray-500">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span>
                                {order.customerInfo?.address?.line1 || 'N/A'}
                                {order.customerInfo?.address?.line2 && ", " + order.customerInfo.address.line2}
                                <br />
                                {order.customerInfo?.address?.city || 'N/A'}, {order.customerInfo?.address?.state || 'N/A'}{" "}
                                {order.customerInfo?.address?.postal_code || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <p className="text-sm mb-3">
                            <strong>Letters ({order.numberOfPackages}):</strong>
                          </p>
                          <div className="space-y-3">
                            {(Array.isArray(order.letterPackages) ? order.letterPackages : []).map((pkg, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                                <p className="mb-1">
                                  <strong>
                                    {pkg.childFirstName} {pkg.childLastName}
                                  </strong>{" "}
                                  (Friend: {pkg.friendName || 'N/A'})
                                </p>
                                <div className="flex items-start gap-2 text-gray-600">
                                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <span>
                                    {pkg.streetAddress}
                                    {pkg.unitApt && ", " + pkg.unitApt}
                                    <br />
                                    {pkg.city}, {pkg.state} {pkg.zipCode}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-3">
                            Shipping Date: <strong>{order.shippingDate}</strong>
                          </p>
                        </div>

                        {/* Upsells/Add-ons Section */}
                        {(order as any).upsellsAccepted && (order as any).upsellsAccepted.length > 0 && (
                          <div className="border-t pt-4 mt-4">
                            <p className="text-sm mb-3">
                              <strong>🎁 Upsells/Add-ons:</strong>
                            </p>
                            <div className="space-y-2">
                              {(order as any).upsellsAccepted.map((upsell: any, idx: number) => (
                                <div key={idx} className="bg-blue-50 p-3 rounded-lg text-sm border-l-4 border-blue-500">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-semibold text-gray-900">
                                      {upsell.quantity}x {upsell.name}
                                    </p>
                                    <span className="text-green-700 font-bold">
                                      ${upsell.total.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-gray-600">
                                    <span>${upsell.price.toFixed(2)} each</span>
                                    {upsell.isSubscription && (
                                      <Badge variant="secondary" className="text-xs">
                                        🔄 Subscription
                                      </Badge>
                                    )}
                                    {!upsell.isSubscription && (
                                      <Badge variant="outline" className="text-xs bg-white">
                                        📦 Ships with order
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between mt-2">
                                    {upsell.chargedAt && (
                                      <p className="text-xs text-gray-500">
                                        Added: {formatDate(upsell.chargedAt)}
                                      </p>
                                    )}
                                    {upsell.source && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          upsell.source === 'checkout' ? 'bg-green-50 text-green-700 border-green-300' :
                                          upsell.source === 'upsell_funnel' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                                          upsell.source === 'success_page' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                                          'bg-gray-50 text-gray-700 border-gray-300'
                                        }`}
                                      >
                                        {upsell.source === 'checkout' && '💳 Checkout'}
                                        {upsell.source === 'upsell_funnel' && '🎁 Upsell Funnel'}
                                        {upsell.source === 'success_page' && '✨ Success Page'}
                                        {!['checkout', 'upsell_funnel', 'success_page'].includes(upsell.source) && upsell.source}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Customer Profile & Payment Info */}
                        {(order.ipAddress || order.lastFourCard || order.trafficSource) && (
                          <div className="border-t pt-4 mt-4">
                            <p className="text-sm mb-3"><strong>Customer Profile:</strong></p>
                            <div className="bg-blue-50 p-3 rounded-lg space-y-2 text-sm">
                              {order.ipAddress && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">IP Address:</span>
                                  <span className="font-mono text-gray-900">{order.ipAddress}</span>
                                </div>
                              )}
                              {order.lastFourCard && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Card Used:</span>
                                  <span className="font-mono text-gray-900">•••• {order.lastFourCard}</span>
                                </div>
                              )}
                              {order.trafficSource && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Traffic Source:</span>
                                  <Badge variant="outline" className="text-xs">
                                    {order.trafficSource}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Activity Log */}
                        {order.activityLog && order.activityLog.length > 0 && (
                          <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm"><strong>Activity Log:</strong></p>
                              <Badge variant="secondary" className="text-xs">
                                {order.activityLog.length} events
                              </Badge>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                              {order.activityLog.map((log, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg text-xs border-l-4 border-blue-500">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-semibold text-gray-900">{log.action}</span>
                                    <span className="text-gray-500">{formatDate(log.timestamp)}</span>
                                  </div>
                                  <p className="text-gray-700">{log.details}</p>
                                  {log.stripeUrl && (
                                    <button
                                      onClick={() => {
                                        // Fix broken URL format from old activity logs: remove /live/ path
                                        const fixedUrl = log.stripeUrl.replace('/live/payments/', '/payments/');
                                        window.open(fixedUrl, '_blank');
                                      }}
                                      className="text-blue-600 hover:text-blue-800 underline mt-1 flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View in Stripe
                                    </button>
                                  )}
                                  {log.emailType && (
                                    <p className="text-gray-500 mt-1 flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      Email: {log.emailType} → {log.emailRecipient}
                                    </p>
                                  )}
                                  {log.user && (
                                    <p className="text-gray-500 mt-1">By: {log.user}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Subscription Letter Management */}
                        {order.orderId?.startsWith('SUB-') && (
                          <div className="border-t pt-4 mt-4">
                            <SubscriptionLetterManager
                              orderId={order.orderId}
                              subscriptionLetters={(order as any).subscriptionLetters || []}
                              subscriptionQuantity={(order as any).subscriptionQuantity || 0}
                              subscriptionPrice={(order as any).subscriptionPrice || 12}
                              stripeCustomerId={(order as any).stripeCustomerId}
                              stripePaymentMethodId={(order as any).stripePaymentMethodId}
                              subscriptionId={order.subscriptionId || undefined}
                              shippingDate={order.shippingDate}
                              onUpdate={loadOrders}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 lg:w-48">
                        <div className="text-2xl text-center p-3 bg-green-100 rounded-lg">
                          ${order.total?.toFixed(2) || '0.00'}
                        </div>

                        <Button
                          onClick={() => {
                            // Fix broken URL format from old orders: remove /live/ path
                            const fixedUrl = order.stripeCheckoutUrl?.replace('/live/payments/', '/payments/');
                            window.open(fixedUrl, "_blank");
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View in Stripe
                        </Button>

                        <Button
                          onClick={() => copyOrderLink(order)}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 hover:bg-blue-50"
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          Copy Order Link
                        </Button>

                        {order.status !== "fulfilled" && order.status !== "canceled-refunded" && (
                          <Button
                            onClick={() => handleEditOrder(order)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Letter Data
                          </Button>
                        )}

                        <Button
                          onClick={() => handleEditCustomerInfo(order)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Customer Info
                        </Button>

                        {order.status !== "canceled-refunded" && order.total > 0 && (
                          <Button
                            onClick={() => {
                              setRefundOrder(order);
                              setRefundAmount(order.total.toFixed(2));
                            }}
                            variant="outline"
                            size="sm"
                            className="border-red-300 hover:bg-red-50"
                          >
                            💵 Issue Refund
                          </Button>
                        )}

                        {showArchived ? (
                          <>
                            <Button
                              onClick={() => unarchiveOrder(order.orderId)}
                              variant="outline"
                              size="sm"
                              className="border-green-400 hover:bg-green-50 text-green-700"
                            >
                              ↩️ Restore Order
                            </Button>
                            <Button
                              onClick={() => setDeleteConfirmOrder(order)}
                              variant="outline"
                              size="sm"
                              className="border-red-600 hover:bg-red-50 text-red-700"
                            >
                              🗑️ Delete Forever
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => setArchiveConfirmOrder(order)}
                            variant="outline"
                            size="sm"
                            className="border-gray-400 hover:bg-gray-50 text-gray-700"
                          >
                            🗄️ Archive Order
                          </Button>
                        )}

                        <Button
                          onClick={() => setSelectedOrderForActivity(order)}
                          variant="outline"
                          size="sm"
                          className="border-blue-400 hover:bg-blue-50 text-blue-700"
                        >
                          📋 Activity Log
                        </Button>

                        {!order.trackingNumber && order.status !== "canceled-refunded" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setSingleTrackingNumber("");
                                  setCarrierName("USPS");
                                }}
                                variant="outline"
                                size="sm"
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                Add Tracking
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Tracking Number</DialogTitle>
                                <DialogDescription>
                                  Add tracking information and automatically mark this order as fulfilled. The customer will be notified via email and SMS.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Carrier</Label>
                                  <Select value={carrierName} onValueChange={setCarrierName}>
                                    <SelectTrigger className="mt-2">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="USPS">USPS</SelectItem>
                                      <SelectItem value="FedEx">FedEx</SelectItem>
                                      <SelectItem value="UPS">UPS</SelectItem>
                                      <SelectItem value="DHL">DHL</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Tracking Number</Label>
                                  <Input
                                    placeholder="1Z999AA10123456784"
                                    value={singleTrackingNumber}
                                    onChange={(e) => setSingleTrackingNumber(e.target.value)}
                                    className="mt-2"
                                  />
                                </div>
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                                  <p className="text-blue-800">
                                    ✅ Order will be marked as "fulfilled"<br/>
                                    📧 Customer will receive email notification<br/>
                                    📱 Customer will receive SMS with tracking
                                  </p>
                                </div>
                                <Button onClick={addTrackingNumber} className="w-full">
                                  Add & Mark as Fulfilled
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.orderId, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="fulfilled">Fulfilled</SelectItem>
                            <SelectItem value="canceled-refunded">Canceled/Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    </div>
                  </Card>
                ))}
              </div>
              <PaginationControls 
                currentPage={regularOrdersPage}
                totalPages={totalRegularPages}
                onPageChange={setRegularOrdersPage}
              />
            </>)}
          </TabsContent>

          {/* Subscription Orders Tab */}
          <TabsContent value="subscriptions">
            <div className="mb-4 space-y-3">
              <Button 
                onClick={() => setSortByShippingDate(!sortByShippingDate)}
                variant={sortByShippingDate ? "default" : "outline"}
                size="sm"
              >
                {sortByShippingDate ? "✓ Sorted by Shipping Date" : "Sort by Shipping Date"}
              </Button>

              {/* Debug Info */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
                <p className="font-bold text-blue-900 mb-2">📊 Subscription Debug Info:</p>
                <div className="grid grid-cols-3 gap-4 text-blue-800">
                  <div>
                    <strong>Total Orders:</strong> {filteredOrders.length}
                  </div>
                  <div>
                    <strong>Has monthlySubscription:</strong> {filteredOrders.filter(o => o.monthlySubscription).length}
                  </div>
                  <div>
                    <strong>Has subscriptionId:</strong> {filteredOrders.filter(o => o.subscriptionId).length}
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  💡 For buttons to show: Order must have <code>monthlySubscription: true</code> AND <code>subscriptionId: "sub_xxx"</code>
                </p>
              </div>
            </div>

            {/* Bulk Selection Toolbar for Subscription Orders */}
            {sortedSubscriptionOrders.length > 0 && (
              <div className="mb-4 bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedSubscriptionOrders.size === paginatedSubscriptionOrders.length && paginatedSubscriptionOrders.length > 0}
                      onCheckedChange={() => handleSelectAllSubscription(paginatedSubscriptionOrders)}
                      id="select-all-subscription"
                    />
                    <label htmlFor="select-all-subscription" className="text-sm cursor-pointer">
                      Select All ({selectedSubscriptionOrders.size} selected)
                    </label>
                  </div>
                  
                  {selectedSubscriptionOrders.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 mr-2">Bulk Actions:</span>
                      <Button
                        onClick={() => handleBulkSubscriptionAction("cancel")}
                        disabled={bulkActionInProgress}
                        size="sm"
                        variant="outline"
                        className="bg-red-50 hover:bg-red-100"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel Subscriptions
                      </Button>
                      <Button
                        onClick={() => handleBulkSubscriptionAction("archive")}
                        disabled={bulkActionInProgress}
                        size="sm"
                        variant="outline"
                        className="bg-gray-50 hover:bg-gray-100"
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Archive
                      </Button>
                      <Button
                        onClick={() => handleBulkSubscriptionAction("export")}
                        disabled={bulkActionInProgress}
                        size="sm"
                        variant="outline"
                        className="bg-blue-50 hover:bg-blue-100"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export CSV
                      </Button>
                      <Button
                        onClick={() => setSelectedSubscriptionOrders(new Set())}
                        disabled={bulkActionInProgress}
                        size="sm"
                        variant="ghost"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading subscriptions...</p>
              </div>
            ) : sortedSubscriptionOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No subscription orders found</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {((subscriptionOrdersPage - 1) * ORDERS_PER_PAGE) + 1} - {Math.min(subscriptionOrdersPage * ORDERS_PER_PAGE, sortedSubscriptionOrders.length)} of {sortedSubscriptionOrders.length} subscriptions
                </div>
                <PaginationControls 
                  currentPage={subscriptionOrdersPage}
                  totalPages={totalSubscriptionPages}
                  onPageChange={setSubscriptionOrdersPage}
                />
                <div className="space-y-4">
                  {paginatedSubscriptionOrders.map((order) => (
                    <Card key={order.orderId} className="p-6 border-2 border-purple-200 relative">
                      {/* Bulk Selection Checkbox */}
                      <div className="absolute top-6 left-6">
                        <Checkbox
                          checked={selectedSubscriptionOrders.has(order.orderId)}
                          onCheckedChange={() => handleSelectSubscriptionOrder(order.orderId)}
                        />
                      </div>
                      
                      <div className="pl-8">
                      {/* Data Inspector - Debug Tool */}
                      <details className="mb-4 bg-yellow-50 border border-yellow-300 rounded p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-yellow-900">
                        🔍 Data Inspector (Click to expand)
                      </summary>
                      <div className="mt-2 text-xs space-y-1 font-mono bg-white p-3 rounded border">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <strong>monthlySubscription:</strong>
                            <code className={order.monthlySubscription ? "text-green-600" : "text-red-600"}>
                              {String(order.monthlySubscription ?? "undefined")}
                            </code>
                          </div>
                          <div>
                            <strong>subscriptionId:</strong>
                            <code className={order.subscriptionId ? "text-green-600" : "text-red-600"}>
                              {order.subscriptionId || "null/undefined"}
                            </code>
                          </div>
                          <div>
                            <strong>subscriptionNextBillingDate:</strong>
                            <code className={order.subscriptionNextBillingDate ? "text-green-600" : "text-red-600"}>
                              {order.subscriptionNextBillingDate || "null/undefined"}
                            </code>
                          </div>
                          <div>
                            <strong>subscriptionMonthsActive:</strong>
                            <code className="text-blue-600">
                              {String(order.subscriptionMonthsActive ?? "undefined")}
                            </code>
                          </div>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <strong className="text-yellow-900">✅ Buttons require BOTH:</strong>
                          <ul className="list-disc list-inside text-yellow-800 mt-1">
                            <li>monthlySubscription = true</li>
                            <li>subscriptionId = "sub_xxxx"</li>
                          </ul>
                        </div>
                      </div>
                    </details>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg">Order #{order.orderId.slice(-8)}</h3>
                              <Badge className="bg-purple-600 text-white">SUBSCRIPTION</Badge>
                            </div>
                            <p className="text-sm text-gray-500">{formatDate(order.orderDate)}</p>
                            <p className="text-sm text-purple-600 mt-1">
                              Subscription ID: {order.subscriptionId}
                            </p>
                            <div className="mt-2 inline-flex items-center gap-2 bg-purple-100 border-2 border-purple-400 rounded-lg px-3 py-1.5">
                              <DollarSign className="w-4 h-4 text-purple-700" />
                              <span className="text-sm text-purple-900">
                                <strong>Monthly:</strong> {(order as any).subscriptionQuantity || order.numberOfPackages} × $12 = ${((order as any).subscriptionPrice || (order.numberOfPackages * 12)).toFixed(2)}
                              </span>
                            </div>
                            {order.subscriptionNextBillingDate ? (
                              <p className="text-sm text-green-700 mt-1 font-semibold">
                                📅 Next Billing: {new Date(order.subscriptionNextBillingDate).toLocaleDateString()}
                              </p>
                            ) : (
                              <p className="text-sm text-red-600 mt-1 font-semibold bg-red-50 border border-red-300 rounded px-2 py-1 inline-block">
                                ⚠️ Next Billing: Not set
                              </p>
                            )}
                            {order.trackingNumber && (
                              <div className="flex items-center gap-2 mt-2">
                                <Truck className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-mono text-green-700">
                                  {order.trackingNumber}
                                </span>
                              </div>
                            )}
                            {order.affiliateId && (
                              <div className="mt-1">
                                <p className="text-sm text-purple-600">
                                  Affiliate: {order.affiliateName} (${order.affiliateCommission?.toFixed(2) || '0.00'} commission)
                                </p>
                                {order.subIds && Object.keys(order.subIds).length > 0 && (
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {order.subIds.affS1 && `affS1: ${order.subIds.affS1}`}
                                    {order.subIds.affS2 && ` | affS2: ${order.subIds.affS2}`}
                                    {order.subIds.affS3 && ` | affS3: ${order.subIds.affS3}`}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <Badge className={getStatusColor(order.status) + " text-white"}>
                            {order.status}
                          </Badge>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg mb-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-purple-900">Subscription Details</h4>
                            <button
                              onClick={() => {
                                setEditSubscriptionDetailsOrder(order);
                                setSubscriptionProductName(order.subscriptionProductName || "Santa's Magical Journey");
                                setSubscriptionPrice((order.subscriptionPrice || 12.00).toFixed(2));
                                setBillingInterval((order.billingIntervalDays || 30).toString());
                              }}
                              className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                            >
                              Edit Details
                            </button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <p className="text-gray-600">Product</p>
                              <p className="text-lg font-semibold text-purple-900">
                                {order.subscriptionProductName || "Santa's Magical Journey"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Monthly Price</p>
                              <p className="text-lg font-semibold text-green-700">
                                ${(order.subscriptionPrice || 12.00).toFixed(2)}
                                {order.subscriptionLetters && order.subscriptionLetters.length > 0 && (
                                  <span className="text-sm text-gray-600 ml-2">
                                    ({order.subscriptionLetters.length} {order.subscriptionLetters.length === 1 ? 'letter' : 'letters'})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600">Successful Charges</p>
                              <button
                                onClick={() => setSelectedOrderForActivity(order)}
                                className="text-lg font-semibold text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                                title="View charge history in Stripe"
                              >
                                {order.successfulCharges || 0}
                              </button>
                            </div>
                            <div>
                              <p className="text-gray-600">Declined Charges</p>
                              <button
                                onClick={() => setSelectedOrderForActivity(order)}
                                className="text-lg font-semibold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                                title="View declined charges in Stripe"
                              >
                                {order.declinedCharges || 0}
                              </button>
                            </div>
                            <div>
                              <p className="text-gray-600">Billing Cycle</p>
                              <p className="text-lg text-indigo-700 font-semibold">
                                Every {order.billingIntervalDays || 30} days
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Next Billing</p>
                              {order.subscriptionNextBillingDate ? (
                                <p className="text-lg text-green-700 font-semibold">
                                  {new Date(order.subscriptionNextBillingDate).toLocaleDateString()}
                                </p>
                              ) : (
                                <p className="text-lg text-red-600 font-semibold">
                                  ⚠️ Not set
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-purple-700 mt-3">
                            💡 Initial subscription is $0. Customer will be charged ${(order.subscriptionPrice || 12.00).toFixed(2)} every {order.billingIntervalDays || 30} days for continued letters.
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-2 text-sm mb-1">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{order.customerInfo?.name || 'N/A'}</span>
                            </div>
                            <div className="text-sm text-gray-500 ml-6">{order.customerInfo?.email || 'N/A'}</div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 text-sm mb-1">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{order.customerInfo?.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-gray-500">
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span>
                                {order.customerInfo?.address?.line1 || 'N/A'}
                                {order.customerInfo?.address?.line2 && ", " + order.customerInfo.address.line2}
                                <br />
                                {order.customerInfo?.address?.city || 'N/A'}, {order.customerInfo?.address?.state || 'N/A'}{" "}
                                {order.customerInfo?.address?.postal_code || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          {/* Show Subscription Letter Manager for subscriptions with letter data */}
                          {order.subscriptionLetters && order.subscriptionLetters.length > 0 ? (
                            <SubscriptionLetterManager
                              orderId={order.orderId}
                              subscriptionLetters={order.subscriptionLetters}
                              subscriptionQuantity={order.subscriptionQuantity || order.subscriptionLetters.length}
                              subscriptionPrice={order.subscriptionPrice || 12.00}
                              stripeCustomerId={order.stripeCustomerId}
                              stripePaymentMethodId={order.stripePaymentMethodId}
                              subscriptionId={order.subscriptionId}
                              shippingDate={order.shippingDate}
                              onUpdate={fetchOrders}
                            />
                          ) : (
                            <>
                              <p className="text-sm mb-3">
                                <strong>Letters ({order.numberOfPackages}):</strong>
                              </p>
                              <div className="space-y-3">
                                {(Array.isArray(order.letterPackages) ? order.letterPackages : []).map((pkg, idx) => (
                                  <div key={idx} className="bg-purple-50 p-3 rounded-lg text-sm">
                                    <p className="mb-1">
                                      <strong>
                                        {pkg.childFirstName} {pkg.childLastName}
                                      </strong>{" "}
                                      (Friend: {pkg.friendName || 'N/A'})
                                    </p>
                                    <div className="flex items-start gap-2 text-gray-600">
                                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                      <span>
                                        {pkg.streetAddress}
                                        {pkg.unitApt && ", " + pkg.unitApt}
                                        <br />
                                        {pkg.city}, {pkg.state} {pkg.zipCode}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-sm text-gray-600 mt-3">
                                Shipping Date: <strong>{order.shippingDate}</strong>
                              </p>
                            </>
                          )}
                        </div>
                        
                        {/* Activity Log for Subscription Orders */}
                        {order.activityLog && order.activityLog.length > 0 && (
                          <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm"><strong>Activity Log:</strong></p>
                              <Badge variant="secondary" className="text-xs">
                                {order.activityLog.length} events
                              </Badge>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                              {order.activityLog.map((log, idx) => (
                                <div key={idx} className="bg-purple-50 p-3 rounded-lg text-xs border-l-4 border-purple-500">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-semibold text-gray-900">{log.action}</span>
                                    <span className="text-gray-500">{formatDate(log.timestamp)}</span>
                                  </div>
                                  <p className="text-gray-700">{log.details}</p>
                                  {log.stripeUrl && (
                                    <button
                                      onClick={() => {
                                        // Fix broken URL format from old activity logs: remove /live/ path
                                        const fixedUrl = log.stripeUrl.replace('/live/payments/', '/payments/');
                                        window.open(fixedUrl, '_blank');
                                      }}
                                      className="text-purple-600 hover:text-purple-800 underline mt-1 flex items-center gap-1"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View in Stripe
                                    </button>
                                  )}
                                  {log.emailType && (
                                    <p className="text-gray-500 mt-1 flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      Email: {log.emailType} → {log.emailRecipient}
                                    </p>
                                  )}
                                  {log.user && (
                                    <p className="text-gray-500 mt-1">By: {log.user}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 lg:w-48">
                        <div className="text-2xl text-center p-3 bg-purple-100 rounded-lg">
                          ${order.total?.toFixed(2) || '0.00'}
                          {(order.total || 0) === 0 && <p className="text-xs text-purple-600 mt-1">Initial Sub</p>}
                        </div>

                        <Button
                          onClick={() => {
                            // Fix broken URL format from old orders: remove /live/ path
                            const fixedUrl = order.stripeCheckoutUrl?.replace('/live/payments/', '/payments/');
                            window.open(fixedUrl, "_blank");
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View in Stripe
                        </Button>

                        <Button
                          onClick={() => copyOrderLink(order)}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 hover:bg-blue-50"
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          Copy Order Link
                        </Button>

                        {/* Set/Edit Next Billing Date Button */}
                        {order.monthlySubscription && order.subscriptionId && order.status !== "canceled-refunded" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setEditBillingDateOrder(order);
                                  setNewBillingDate(order.subscriptionNextBillingDate || "");
                                }}
                                variant="outline"
                                size="sm"
                                className="border-blue-300 hover:bg-blue-50"
                              >
                                📅 Set Next Billing
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Set Next Billing Date</DialogTitle>
                                <DialogDescription>
                                  Update when this subscription will be charged next. This does NOT charge the customer now.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                                  <p className="text-sm">
                                    <strong>Subscription:</strong> {order.subscriptionId}<br/>
                                    <strong>Current Next Billing:</strong>{" "}
                                    <span className={!order.subscriptionNextBillingDate ? "text-red-600 font-semibold" : ""}>
                                      {order.subscriptionNextBillingDate 
                                        ? new Date(order.subscriptionNextBillingDate).toLocaleDateString()
                                        : "⚠️ Not set"}
                                    </span>
                                  </p>
                                </div>
                                <div>
                                  <Label>New Next Billing Date *</Label>
                                  <Input
                                    type="date"
                                    value={newBillingDate}
                                    onChange={(e) => setNewBillingDate(e.target.value)}
                                    className="mt-2"
                                    min={new Date().toISOString().split('T')[0]}
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    The subscription will automatically charge on this date.
                                  </p>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-sm">
                                  <p className="text-purple-800">
                                    💡 This only updates the next billing date. Use "Charge Now" if you want to charge immediately.
                                  </p>
                                </div>
                                <div className="flex gap-3">
                                  <Button 
                                    onClick={handleUpdateBillingDate} 
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    disabled={!newBillingDate}
                                  >
                                    Update Billing Date
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setEditBillingDateOrder(null);
                                      setNewBillingDate("");
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

                        {order.monthlySubscription && order.subscriptionId && order.status !== "canceled-refunded" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setManualBillingOrder(order);
                                  setCustomBillingDate("");
                                }}
                                variant="outline"
                                size="sm"
                                className="border-green-300 hover:bg-green-50"
                              >
                                💳 Charge Now (${(order.subscriptionPrice || 12.00).toFixed(2)})
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Manual Subscription Billing</DialogTitle>
                                <DialogDescription>
                                  Charge this subscriber immediately for their monthly letter{order.subscriptionLetters && order.subscriptionLetters.length > 1 ? 's' : ''}. You can also set a custom next billing date.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                                  <p className="text-sm">
                                    <strong>Subscription:</strong> {order.subscriptionId}<br/>
                                    <strong>Letters:</strong> {order.subscriptionLetters?.length || 1}<br/>
                                    <strong>Amount:</strong> ${(order.subscriptionPrice || 12.00).toFixed(2)}<br/>
                                    <strong>Current Next Billing:</strong> {order.subscriptionNextBillingDate 
                                      ? new Date(order.subscriptionNextBillingDate).toLocaleDateString()
                                      : "Not set"}
                                  </p>
                                </div>
                                <div>
                                  <Label>Custom Next Billing Date (Optional)</Label>
                                  <Input
                                    type="date"
                                    value={customBillingDate}
                                    onChange={(e) => setCustomBillingDate(e.target.value)}
                                    className="mt-2"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Leave empty to keep current schedule. Otherwise, set when the next monthly charge should occur.
                                  </p>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                                  <p className="text-yellow-800">
                                    ⚠️ This will immediately charge the customer's card on file ${(order.subscriptionPrice || 12.00).toFixed(2)} and send them an email notification.
                                  </p>
                                </div>
                                <div className="flex gap-3">
                                  <Button 
                                    onClick={handleManualBilling} 
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    disabled={isBillingInProgress}
                                  >
                                    {isBillingInProgress ? "Processing..." : `Charge ${(order.subscriptionPrice || 12.00).toFixed(2)} Now`}
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setManualBillingOrder(null);
                                      setCustomBillingDate("");
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

                        {order.monthlySubscription && order.subscriptionId && order.status !== "canceled-refunded" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setEditBillingIntervalOrder(order);
                                  setNewBillingInterval(String(order.billingIntervalDays || 30));
                                }}
                                variant="outline"
                                size="sm"
                                className="border-indigo-300 hover:bg-indigo-50"
                              >
                                ⏱️ Set Billing Cycle
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Set Billing Cycle Interval</DialogTitle>
                                <DialogDescription>
                                  Control how often this subscription is charged (in days). This determines the interval between automatic charges.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg">
                                  <p className="text-sm">
                                    <strong>Subscription:</strong> {order.subscriptionId}<br/>
                                    <strong>Current Interval:</strong> Every {order.billingIntervalDays || 30} days
                                  </p>
                                </div>
                                <div>
                                  <Label>Billing Interval (Days) *</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={newBillingInterval}
                                    onChange={(e) => setNewBillingInterval(e.target.value)}
                                    className="mt-2"
                                    placeholder="30"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Enter the number of days between each charge (1-365 days). Default is 30 days.
                                  </p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                                  <p className="text-blue-800">
                                    💡 This only affects future charges. The next billing date won't change.
                                  </p>
                                </div>
                                <div className="flex gap-3">
                                  <Button 
                                    onClick={handleUpdateBillingInterval} 
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                    disabled={!newBillingInterval}
                                  >
                                    Update Interval
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setEditBillingIntervalOrder(null);
                                      setNewBillingInterval("");
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

                        {order.monthlySubscription && order.subscriptionId && (
                          <Button
                            onClick={() => createMonthlyOrder(order.subscriptionId!)}
                            variant="outline"
                            size="sm"
                            className="border-purple-300 hover:bg-purple-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Monthly Order
                          </Button>
                        )}

                        {order.status !== "fulfilled" && order.status !== "canceled-refunded" && (
                          <Button
                            onClick={() => handleEditOrder(order)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Letter Data
                          </Button>
                        )}

                        <Button
                          onClick={() => handleEditCustomerInfo(order)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Customer Info
                        </Button>

                        {order.monthlySubscription && order.subscriptionId && order.status !== "canceled-refunded" && (
                          <Button
                            onClick={() => setCancelSubscriptionOrder(order)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 hover:bg-red-50"
                          >
                            🚫 Cancel Subscription
                          </Button>
                        )}

                        {order.status !== "canceled-refunded" && order.total > 0 && (
                          <Button
                            onClick={() => {
                              setRefundOrder(order);
                              setRefundAmount(order.total.toFixed(2));
                            }}
                            variant="outline"
                            size="sm"
                            className="border-red-300 hover:bg-red-50"
                          >
                            💵 Issue Refund
                          </Button>
                        )}

                        {!order.trackingNumber && order.status !== "canceled-refunded" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setSingleTrackingNumber("");
                                  setCarrierName("USPS");
                                }}
                                variant="outline"
                                size="sm"
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                Add Tracking
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Tracking Number</DialogTitle>
                                <DialogDescription>
                                  Add tracking information for this subscription order. The customer will be notified via email and SMS.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Carrier</Label>
                                  <Select value={carrierName} onValueChange={setCarrierName}>
                                    <SelectTrigger className="mt-2">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="USPS">USPS</SelectItem>
                                      <SelectItem value="FedEx">FedEx</SelectItem>
                                      <SelectItem value="UPS">UPS</SelectItem>
                                      <SelectItem value="DHL">DHL</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Tracking Number</Label>
                                  <Input
                                    placeholder="1Z999AA10123456784"
                                    value={singleTrackingNumber}
                                    onChange={(e) => setSingleTrackingNumber(e.target.value)}
                                    className="mt-2"
                                  />
                                </div>
                                <Button onClick={addTrackingNumber} className="w-full">
                                  Add & Notify Customer
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.orderId, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="fulfilled">Fulfilled</SelectItem>
                            <SelectItem value="canceled-refunded">Canceled/Refunded</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    </div>
                  </Card>
                ))}
              </div>
              <PaginationControls 
                currentPage={subscriptionOrdersPage}
                totalPages={totalSubscriptionPages}
                onPageChange={setSubscriptionOrdersPage}
              />
            </>)}
          </TabsContent>

          {/* Affiliate Management Tab */}
          <TabsContent value="affiliates">
            <AdminAffiliateManagement 
              onBack={() => setActiveTab('orders')}
              onLogout={onLogout}
            />
          </TabsContent>

          {/* Affiliate Reports Tab */}
          <TabsContent value="affiliate-reports">
            <NetworkAffiliateReporting />
          </TabsContent>

          {/* Declined Orders Tab */}
          <TabsContent value="declined">
            <DeclinedOrdersPanel 
              declinedOrders={declinedOrders} 
              onRefresh={fetchDeclinedOrders}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="p-6 max-w-2xl">
              <h2 className="text-2xl mb-6">⚙️ Global Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-lg mb-2 block">Default Letter Price (Per Letter)</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    This is the price used for "Add Another Letter Package" upsells on the success page. 
                    It does NOT affect the main funnel prices or homepage package prices.
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={defaultLetterPrice}
                      onChange={(e) => setDefaultLetterPrice(parseFloat(e.target.value) || 0)}
                      className="w-32 text-lg"
                    />
                  </div>
                </div>

                <Button 
                  onClick={async () => {
                    setSavingSettings(true);
                    setSettingsSaved(false);
                    try {
                      const response = await fetch(
                        API_URL + "/admin/update-settings",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + publicAnonKey,
                          },
                          body: JSON.stringify({ defaultLetterPrice }),
                        }
                      );
                      
                      if (!response.ok) throw new Error("Failed to save settings");
                      
                      setSettingsSaved(true);
                      setTimeout(() => setSettingsSaved(false), 3000);
                      alert("✅ Settings saved! Default letter price is now $" + defaultLetterPrice.toFixed(2));
                    } catch (error) {
                      console.error("Error saving settings:", error);
                      alert("❌ Failed to save settings. Check console for details.");
                    } finally {
                      setSavingSettings(false);
                    }
                  }}
                  disabled={savingSettings}
                  className="w-full"
                >
                  {savingSettings ? "Saving..." : settingsSaved ? "✅ Saved!" : "Save Settings"}
                </Button>

                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Current Settings</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm"><strong>Default Letter Price:</strong> ${defaultLetterPrice.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">This price is used when customers add more letter packages on the success page</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Order Dialog */}
        {editingOrder && (
          <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Letter Packages - Order #{editingOrder.orderId.slice(-8)}</DialogTitle>
                <DialogDescription>
                  Update letter information for this order. Customer will be notified of changes via email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {editedPackages.map((pkg, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">Letter {index + 1}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Child First Name</Label>
                        <Input
                          value={pkg.childFirstName}
                          onChange={(e) => {
                            const updated = [...editedPackages];
                            updated[index].childFirstName = e.target.value;
                            setEditedPackages(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Child Last Name</Label>
                        <Input
                          value={pkg.childLastName}
                          onChange={(e) => {
                            const updated = [...editedPackages];
                            updated[index].childLastName = e.target.value;
                            setEditedPackages(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Friend Name</Label>
                        <Input
                          value={pkg.friendName}
                          onChange={(e) => {
                            const updated = [...editedPackages];
                            updated[index].friendName = e.target.value;
                            setEditedPackages(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Street Address</Label>
                        <Input
                          value={pkg.streetAddress}
                          onChange={(e) => {
                            const updated = [...editedPackages];
                            updated[index].streetAddress = e.target.value;
                            setEditedPackages(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit/Apt</Label>
                        <Input
                          value={pkg.unitApt}
                          onChange={(e) => {
                            const updated = [...editedPackages];
                            updated[index].unitApt = e.target.value;
                            setEditedPackages(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">City</Label>
                        <Input
                          value={pkg.city}
                          onChange={(e) => {
                            const updated = [...editedPackages];
                            updated[index].city = e.target.value;
                            setEditedPackages(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">State</Label>
                        <Input
                          value={pkg.state}
                          onChange={(e) => {
                            const updated = [...editedPackages];
                            updated[index].state = e.target.value;
                            setEditedPackages(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Zip Code</Label>
                        <Input
                          value={pkg.zipCode}
                          onChange={(e) => {
                            const updated = [...editedPackages];
                            updated[index].zipCode = e.target.value;
                            setEditedPackages(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-4">
                  <Button onClick={saveOrderEdit} className="flex-1">
                    Save Changes
                  </Button>
                  <Button onClick={() => setEditingOrder(null)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Customer Info Dialog */}
        {editingCustomerInfo && editedCustomerInfo && (
          <Dialog open={!!editingCustomerInfo} onOpenChange={(open) => !open && setEditingCustomerInfo(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Customer Information</DialogTitle>
                <DialogDescription>
                  Update customer contact and address information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editedCustomerInfo.name}
                    onChange={(e) => setEditedCustomerInfo({ ...editedCustomerInfo, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editedCustomerInfo.email}
                    onChange={(e) => setEditedCustomerInfo({ ...editedCustomerInfo, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editedCustomerInfo.phone}
                    onChange={(e) => setEditedCustomerInfo({ ...editedCustomerInfo, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Address Line 1</Label>
                  <Input
                    value={editedCustomerInfo.address?.line1 || ''}
                    onChange={(e) => setEditedCustomerInfo({
                      ...editedCustomerInfo,
                      address: { ...(editedCustomerInfo.address || {}), line1: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Address Line 2</Label>
                  <Input
                    value={editedCustomerInfo.address?.line2 || ''}
                    onChange={(e) => setEditedCustomerInfo({
                      ...editedCustomerInfo,
                      address: { ...(editedCustomerInfo.address || {}), line2: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input
                      value={editedCustomerInfo.address?.city || ''}
                      onChange={(e) => setEditedCustomerInfo({
                        ...editedCustomerInfo,
                        address: { ...(editedCustomerInfo.address || {}), city: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input
                      value={editedCustomerInfo.address?.state || ''}
                      onChange={(e) => setEditedCustomerInfo({
                        ...editedCustomerInfo,
                        address: { ...(editedCustomerInfo.address || {}), state: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Zip Code</Label>
                    <Input
                      value={editedCustomerInfo.address?.postal_code || ''}
                      onChange={(e) => setEditedCustomerInfo({
                        ...editedCustomerInfo,
                        address: { ...(editedCustomerInfo.address || {}), postal_code: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={saveCustomerInfoEdit} className="flex-1">
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditingCustomerInfo(null);
                      setEditedCustomerInfo(null);
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

        {/* Cancel Subscription Confirmation Dialog */}
        {cancelSubscriptionOrder && (
          <Dialog open={!!cancelSubscriptionOrder} onOpenChange={(open) => !open && setCancelSubscriptionOrder(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Subscription?</DialogTitle>
                <DialogDescription>
                  This will cancel the subscription in Stripe and notify the customer via email and SMS.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Subscription ID:</strong> {cancelSubscriptionOrder.subscriptionId}<br/>
                    <strong>Customer:</strong> {cancelSubscriptionOrder.customerInfo?.name || 'N/A'}<br/>
                    <strong>Email:</strong> {cancelSubscriptionOrder.customerInfo?.email || 'N/A'}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Are you sure you want to cancel this subscription? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={confirmCancelSubscription} 
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Yes, Cancel Subscription
                  </Button>
                  <Button
                    onClick={() => setCancelSubscriptionOrder(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    No, Keep Active
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Refund Dialog */}
        {refundOrder && (
          <Dialog open={!!refundOrder} onOpenChange={(open) => !open && setRefundOrder(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue Refund</DialogTitle>
                <DialogDescription>
                  Process a refund for this order. Customer will be notified via email and SMS.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="bg-gray-50 border p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Order:</strong> #{refundOrder.orderId.slice(-8)}<br/>
                    <strong>Customer:</strong> {refundOrder.customerInfo?.name || 'N/A'}<br/>
                    <strong>Original Amount:</strong> ${refundOrder.total?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <Label>Refund Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={refundOrder.total}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum refund: ${refundOrder.total?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                  <p className="text-yellow-800">
                    ⚠️ This will process a refund in Stripe and mark the order as canceled/refunded.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={processRefund} 
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Issue Refund
                  </Button>
                  <Button
                    onClick={() => {
                      setRefundOrder(null);
                      setRefundAmount("");
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

        {/* Cancel Subscription Dialog */}
        {cancelSubscriptionOrder && (
          <Dialog open={!!cancelSubscriptionOrder} onOpenChange={(open) => !open && setCancelSubscriptionOrder(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Subscription</DialogTitle>
                <DialogDescription>
                  Cancel this monthly subscription. This will stop all future charges and notify the customer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="bg-gray-50 border p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Order:</strong> #{cancelSubscriptionOrder.orderId.slice(-8)}<br/>
                    <strong>Subscription ID:</strong> {cancelSubscriptionOrder.subscriptionId}<br/>
                    <strong>Customer:</strong> {cancelSubscriptionOrder.customerInfo?.name || 'N/A'}<br/>
                    <strong>Monthly Amount:</strong> $12.00<br/>
                    <strong>Next Billing:</strong> {cancelSubscriptionOrder.subscriptionNextBillingDate 
                      ? new Date(cancelSubscriptionOrder.subscriptionNextBillingDate).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm">
                  <p className="text-yellow-800">
                    ⚠️ This will immediately cancel the subscription in Stripe. The customer will not be charged again and will receive an email notification.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleCancelSubscription} 
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Yes, Cancel Subscription
                  </Button>
                  <Button
                    onClick={() => setCancelSubscriptionOrder(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Keep Subscription Active
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Archive Order Confirmation Dialog */}
        {archiveConfirmOrder && (
          <Dialog open={!!archiveConfirmOrder} onOpenChange={(open) => !open && setArchiveConfirmOrder(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Archive Order?</DialogTitle>
                <DialogDescription>
                  Archive this order to remove it from the main view. You can restore it anytime from the archived orders section.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Order:</strong> #{archiveConfirmOrder.orderId.slice(-8)}<br/>
                    <strong>Customer:</strong> {archiveConfirmOrder.customerInfo?.name}<br/>
                    <strong>Amount:</strong> ${archiveConfirmOrder.total?.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                  <p className="text-blue-800">
                    📦 This order will be moved to archived orders. You can restore it anytime.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => archiveOrder(archiveConfirmOrder.orderId)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700"
                  >
                    Yes, Archive Order
                  </Button>
                  <Button
                    onClick={() => setArchiveConfirmOrder(null)}
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

        {/* Delete Order Permanently Confirmation Dialog */}
        {deleteConfirmOrder && (
          <Dialog open={!!deleteConfirmOrder} onOpenChange={(open) => !open && setDeleteConfirmOrder(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>⚠️ Delete Order Permanently?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. The order will be permanently removed from the database.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Order:</strong> #{deleteConfirmOrder.orderId.slice(-8)}<br/>
                    <strong>Customer:</strong> {deleteConfirmOrder.customerInfo?.name}<br/>
                    <strong>Amount:</strong> ${deleteConfirmOrder.total?.toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-50 border border-red-300 p-4 rounded-lg">
                  <p className="text-red-800">
                    <strong>🚨 WARNING:</strong> This will permanently delete this order from the database. This action cannot be reversed!
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => deleteOrderPermanently(deleteConfirmOrder.orderId)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Yes, Delete Forever
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirmOrder(null)}
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

        {/* Activity Log Dialog */}
        {selectedOrderForActivity && (
          <Dialog open={!!selectedOrderForActivity} onOpenChange={(open) => !open && setSelectedOrderForActivity(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Order Activity Log</DialogTitle>
                <DialogDescription>
                  Complete timeline and details for Order #{selectedOrderForActivity.orderId.slice(-8)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Customer & Order Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Customer Details</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Name:</strong> {selectedOrderForActivity.customerInfo?.name}</p>
                      <p><strong>Email:</strong> {selectedOrderForActivity.customerInfo?.email}</p>
                      <p><strong>Phone:</strong> {selectedOrderForActivity.customerInfo?.phone}</p>
                      {selectedOrderForActivity.ipAddress && (
                        <p><strong>IP Address:</strong> {selectedOrderForActivity.ipAddress}</p>
                      )}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Payment Details</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Total:</strong> ${selectedOrderForActivity.total?.toFixed(2)}</p>
                      <p><strong>Stripe ID:</strong> {selectedOrderForActivity.stripePaymentId}</p>
                      {selectedOrderForActivity.lastFourCard && (
                        <p><strong>Card:</strong> •••• {selectedOrderForActivity.lastFourCard}</p>
                      )}
                      <p><strong>Status:</strong> <Badge className={getStatusColor(selectedOrderForActivity.status) + " text-white"}>{selectedOrderForActivity.status}</Badge></p>
                    </div>
                  </Card>
                </div>

                {/* Traffic Source */}
                {(selectedOrderForActivity.affiliateId || selectedOrderForActivity.trafficSource) && (
                  <Card className="p-4 bg-purple-50">
                    <h4 className="font-semibold mb-2">Traffic Source</h4>
                    <div className="text-sm space-y-1">
                      {selectedOrderForActivity.affiliateId && (
                        <>
                          <p><strong>Affiliate:</strong> {selectedOrderForActivity.affiliateName}</p>
                          <p><strong>Affiliate ID:</strong> {selectedOrderForActivity.affiliateId}</p>
                          <p><strong>Commission:</strong> ${selectedOrderForActivity.affiliateCommission?.toFixed(2) || "0.00"}</p>
                        </>
                      )}
                      {selectedOrderForActivity.trafficSource && (
                        <p><strong>Source Type:</strong> {selectedOrderForActivity.trafficSource}</p>
                      )}
                    </div>
                  </Card>
                )}

                {/* Activity Timeline */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-3">Activity Timeline</h4>
                  <div className="space-y-3">
                    {selectedOrderForActivity.activityLog && selectedOrderForActivity.activityLog.length > 0 ? (
                      selectedOrderForActivity.activityLog.map((log, idx) => (
                        <div key={idx} className={`flex gap-3 border-l-2 ${log.emailType ? 'border-purple-500' : 'border-blue-500'} pl-4 py-2`}>
                          <div className="flex-1">
                            <p className="text-sm font-semibold">
                              {log.emailType && '📧 '}{log.action}
                            </p>
                            <p className="text-sm text-gray-600">{log.details}</p>
                            {log.emailRecipient && (
                              <p className="text-xs text-purple-600 mt-1">
                                Sent to: {log.emailRecipient}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                            {log.emailId && (
                              <p className="text-xs text-gray-400">Email ID: {log.emailId}</p>
                            )}
                          </div>
                          {log.emailType && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendEmail(selectedOrderForActivity.orderId, log.emailType!)}
                              className="h-8 text-xs"
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              Resend
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div>
                        {/* Default activity log based on order data */}
                        <div className="flex gap-3 border-l-2 border-green-500 pl-4 py-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold">Order Created</p>
                            <p className="text-sm text-gray-600">Order placed and payment processed</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(selectedOrderForActivity.orderDate).toLocaleString()}</p>
                          </div>
                        </div>
                        {selectedOrderForActivity.trackingNumber && (
                          <div className="flex gap-3 border-l-2 border-blue-500 pl-4 py-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold">Tracking Added</p>
                              <p className="text-sm text-gray-600">Tracking: {selectedOrderForActivity.trackingNumber}</p>
                              <p className="text-xs text-gray-400 mt-1">Email and SMS sent to customer</p>
                            </div>
                          </div>
                        )}
                        {selectedOrderForActivity.status === "fulfilled" && (
                          <div className="flex gap-3 border-l-2 border-green-500 pl-4 py-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold">Order Fulfilled</p>
                              <p className="text-sm text-gray-600">Order marked as fulfilled</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(selectedOrderForActivity.updatedAt).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                        {selectedOrderForActivity.status === "canceled-refunded" && (
                          <div className="flex gap-3 border-l-2 border-red-500 pl-4 py-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold">Order Refunded</p>
                              <p className="text-sm text-gray-600">Refund processed in Stripe</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(selectedOrderForActivity.updatedAt).toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>

                <Button onClick={() => setSelectedOrderForActivity(null)} className="w-full">
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Subscription Details Dialog */}
        {editSubscriptionDetailsOrder && (
          <Dialog open={!!editSubscriptionDetailsOrder} onOpenChange={() => setEditSubscriptionDetailsOrder(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Subscription Details</DialogTitle>
                <DialogDescription>
                  Update the product name, pricing, and billing cycle for this subscription.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Product Name</label>
                  <input
                    type="text"
                    value={subscriptionProductName}
                    onChange={(e) => setSubscriptionProductName(e.target.value)}
                    placeholder="Santa's Magical Journey"
                    className="w-full p-2 border rounded"
                  />
                  <button
                    onClick={handleUpdateSubscriptionProduct}
                    className="mt-2 w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Update Product Name
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Monthly Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    max="999.99"
                    value={subscriptionPrice}
                    onChange={(e) => setSubscriptionPrice(e.target.value)}
                    placeholder="12.00"
                    className="w-full p-2 border rounded"
                  />
                  <button
                    onClick={handleUpdateSubscriptionPrice}
                    className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Update Price
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Billing Interval (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={billingInterval}
                    onChange={(e) => setBillingInterval(e.target.value)}
                    placeholder="30"
                    className="w-full p-2 border rounded"
                  />
                  <button
                    onClick={() => {
                      const intervalDays = parseInt(billingInterval);
                      if (!intervalDays || intervalDays < 1 || intervalDays > 365) {
                        alert("⚠️ Please enter a valid billing interval (1-365 days)");
                        return;
                      }
                      setEditBillingIntervalOrder(editSubscriptionDetailsOrder);
                      setNewBillingInterval(billingInterval);
                      setEditSubscriptionDetailsOrder(null);
                      handleUpdateBillingInterval();
                    }}
                    className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Update Billing Interval
                  </button>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-2">Current Stats</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Successful Charges</p>
                      <p className="font-semibold text-green-600">{editSubscriptionDetailsOrder.successfulCharges || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Declined Charges</p>
                      <p className="font-semibold text-red-600">{editSubscriptionDetailsOrder.declinedCharges || 0}</p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" onClick={() => setEditSubscriptionDetailsOrder(null)} className="w-full">
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Activity Log Dialog - View Charge History with Stripe Links */}
        {selectedOrderForActivity && (
          <Dialog open={true} onOpenChange={() => setSelectedOrderForActivity(null)}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Charge History & Activity Log</DialogTitle>
                <DialogDescription>
                  Order: {selectedOrderForActivity.orderId} | {selectedOrderForActivity.customerInfo?.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Successful Charges</p>
                    <p className="text-2xl font-semibold text-green-600">{selectedOrderForActivity.successfulCharges || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Declined Charges</p>
                    <p className="text-2xl font-semibold text-red-600">{selectedOrderForActivity.declinedCharges || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Activity</p>
                    <p className="text-2xl font-semibold text-blue-600">{selectedOrderForActivity.activityLog?.length || 0}</p>
                  </div>
                </div>

                {/* Activity Log */}
                <div>
                  <h3 className="font-semibold mb-3">Activity Timeline</h3>
                  {selectedOrderForActivity.activityLog && selectedOrderForActivity.activityLog.length > 0 ? (
                    <div className="space-y-3">
                      {[...selectedOrderForActivity.activityLog].reverse().map((log, idx) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">
                                {log.action}
                                {log.action.includes('Charged') && !log.action.includes('Declined') && (
                                  <Badge className="ml-2 bg-green-600">Success</Badge>
                                )}
                                {log.action.includes('Declined') && (
                                  <Badge className="ml-2 bg-red-600">Declined</Badge>
                                )}
                              </p>
                              <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <p className="text-xs text-gray-500">
                                  {new Date(log.timestamp).toLocaleString()} • {log.user || 'System'}
                                </p>
                                {(log as any).stripeUrl && (
                                  <a
                                    href={(log as any).stripeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    View in Stripe
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No activity recorded yet.</p>
                  )}
                </div>

                {/* Quick Links */}
                {selectedOrderForActivity.subscriptionId && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2 text-sm">Quick Links</h3>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${selectedOrderForActivity.subscriptionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Subscription
                      </a>
                      {selectedOrderForActivity.stripeCustomerId && (
                        <a
                          href={`https://dashboard.stripe.com/customers/${selectedOrderForActivity.stripeCustomerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Customer
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <Button variant="outline" onClick={() => setSelectedOrderForActivity(null)} className="w-full">
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
