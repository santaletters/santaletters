import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Copy, DollarSign, TrendingUp, Users, CheckCircle2, Calendar, BarChart3, Plus, Trash2, Power, PowerOff } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { EventReporting } from "./EventReporting";
import { AffiliatePayments } from "./AffiliatePayments";
import { AdminAffiliateReporting } from "./AdminAffiliateReporting";

interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  commission: number;
}

interface AffiliateData {
  affiliateId: string;
  affiliateName: string;
  email: string;
  trackingUrl: string;
  postbackUrl: string;
  pixelCode: string;
  commissionRate: number;
  status: "active" | "pending" | "suspended";
  createdAt: string;
}

interface SubIDReport {
  subId: string;
  subValue: string;
  clicks: number;
  conversions: number;
  commission: number;
}

interface EventStats {
  eventType: string;
  count: number;
}

interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  totalCommission: number;
  amountPaid: number;
  amountOwed: number;
  status: "paid" | "pending" | "partial";
  paidDate?: string;
  dueDate: string;
}

interface DailyReport {
  date: string;
  clicks: number;
  conversions: number;
  commission: number;
}

interface HourlyReport {
  hour: string;
  clicks: number;
  conversions: number;
  commission: number;
}

interface AffiliateDashboardProps {
  affiliateId: string;
  affiliateName: string;
  onBackToSales: () => void;
  onLogout: () => void;
}

export function AffiliateDashboard({ affiliateId, affiliateName, onBackToSales, onLogout }: AffiliateDashboardProps) {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [stats, setStats] = useState<AffiliateStats>({
    totalClicks: 0,
    totalConversions: 0,
    conversionRate: 0,
    commission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [postbackUrl, setPostbackUrl] = useState("");
  const [pixelCode, setPixelCode] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Multi-event postback state
  const [postbackConfigs, setPostbackConfigs] = useState<Array<{
    id: string;
    eventType: string;
    url: string;
    enabled: boolean;
  }>>([]);
  const [showAddPostback, setShowAddPostback] = useState(false);
  const [newPostback, setNewPostback] = useState({ eventType: "sale", url: "" });
  const [editingPostbackId, setEditingPostbackId] = useState<string | null>(null);
  
  // Reporting state
  const [dateRange, setDateRange] = useState("7days");
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [hourlyReports, setHourlyReports] = useState<HourlyReport[]>([]);
  const [subIDReports, setSubIDReports] = useState<SubIDReport[]>([]);
  const [selectedSubID, setSelectedSubID] = useState<"sub" | "sub2" | "sub3" | "sub4" | "sub5">("sub");
  
  // Sub-ID tracking link builder
  const [subIDs, setSubIDs] = useState({
    sub: "",
    sub2: "",
    sub3: "",
    sub4: "",
    sub5: "",
  });
  
  // Event stats and payments state
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [openBalance, setOpenBalance] = useState(0);
  const [prepaidCredit, setPrepaidCredit] = useState(0);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566`;

  // Demo affiliate data
  const DEMO_AFFILIATE: AffiliateData = {
    affiliateId: "aff_demo_12345",
    affiliateName: "Demo Partner",
    email: "partner@example.com",
    trackingUrl: `https://santascertifiedletter.com/offer?ref=aff_demo_12345`,
    postbackUrl: "https://yourtracker.com/postback?clickid={sub}",
    pixelCode: '<img src="https://tracker.com/pixel?id=123&clickid={sub}" />',
    commissionRate: 20,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  const DEMO_STATS: AffiliateStats = {
    totalClicks: 1247,
    totalConversions: 87,
    conversionRate: 6.97,
    commission: 313.05,
  };

  const DEMO_DAILY_REPORTS: DailyReport[] = [
    { date: "2025-10-15", clicks: 45, conversions: 3, commission: 10.77 },
    { date: "2025-10-14", clicks: 62, conversions: 5, commission: 17.95 },
    { date: "2025-10-13", clicks: 38, conversions: 2, commission: 7.18 },
    { date: "2025-10-12", clicks: 71, conversions: 6, commission: 21.54 },
    { date: "2025-10-11", clicks: 54, conversions: 4, commission: 14.36 },
    { date: "2025-10-10", clicks: 48, conversions: 3, commission: 10.77 },
    { date: "2025-10-09", clicks: 67, conversions: 5, commission: 17.95 },
  ];

  const DEMO_HOURLY_REPORTS: HourlyReport[] = [
    { hour: "00:00", clicks: 12, conversions: 1, commission: 3.59 },
    { hour: "01:00", clicks: 8, conversions: 0, commission: 0 },
    { hour: "02:00", clicks: 5, conversions: 0, commission: 0 },
    { hour: "03:00", clicks: 3, conversions: 0, commission: 0 },
    { hour: "04:00", clicks: 4, conversions: 0, commission: 0 },
    { hour: "05:00", clicks: 7, conversions: 1, commission: 3.59 },
    { hour: "06:00", clicks: 15, conversions: 1, commission: 3.59 },
    { hour: "07:00", clicks: 22, conversions: 2, commission: 7.18 },
    { hour: "08:00", clicks: 31, conversions: 3, commission: 10.77 },
    { hour: "09:00", clicks: 45, conversions: 4, commission: 14.36 },
    { hour: "10:00", clicks: 52, conversions: 5, commission: 17.95 },
    { hour: "11:00", clicks: 48, conversions: 4, commission: 14.36 },
    { hour: "12:00", clicks: 41, conversions: 3, commission: 10.77 },
    { hour: "13:00", clicks: 38, conversions: 3, commission: 10.77 },
    { hour: "14:00", clicks: 43, conversions: 4, commission: 14.36 },
    { hour: "15:00", clicks: 50, conversions: 5, commission: 17.95 },
    { hour: "16:00", clicks: 47, conversions: 4, commission: 14.36 },
    { hour: "17:00", clicks: 44, conversions: 3, commission: 10.77 },
    { hour: "18:00", clicks: 39, conversions: 3, commission: 10.77 },
    { hour: "19:00", clicks: 35, conversions: 2, commission: 7.18 },
    { hour: "20:00", clicks: 29, conversions: 2, commission: 7.18 },
    { hour: "21:00", clicks: 24, conversions: 1, commission: 3.59 },
    { hour: "22:00", clicks: 18, conversions: 1, commission: 3.59 },
    { hour: "23:00", clicks: 14, conversions: 1, commission: 3.59 },
  ];

  const DEMO_SUBID_REPORTS: SubIDReport[] = [
    { subId: "sub", subValue: "facebook_campaign_001", clicks: 342, conversions: 28, commission: 100.52 },
    { subId: "sub", subValue: "instagram_story_boost", clicks: 287, conversions: 21, commission: 75.39 },
    { subId: "sub", subValue: "google_ads_xmas", clicks: 198, conversions: 15, commission: 53.85 },
    { subId: "sub", subValue: "email_newsletter_12", clicks: 156, conversions: 11, commission: 39.49 },
    { subId: "sub", subValue: "tiktok_video_promo", clicks: 264, conversions: 12, commission: 43.08 },
  ];

  const DEMO_EVENT_STATS: EventStats[] = [
    { eventType: "page_view", count: 1247 },
    { eventType: "form_fill", count: 423 },
    { eventType: "checkout_view", count: 287 },
    { eventType: "added_multiple_packages", count: 145 },
    { eventType: "payment_submit", count: 156 },
    { eventType: "sale", count: 87 },
  ];

  const DEMO_INVOICES: Invoice[] = [
    {
      invoiceId: "inv_001",
      invoiceNumber: "INV-2025-001",
      periodStart: "2025-09-01",
      periodEnd: "2025-09-30",
      totalCommission: 313.05,
      amountPaid: 313.05,
      amountOwed: 0,
      status: "paid",
      paidDate: "2025-10-01",
      dueDate: "2025-10-01",
    },
    {
      invoiceId: "inv_002",
      invoiceNumber: "INV-2025-002",
      periodStart: "2025-10-01",
      periodEnd: "2025-10-15",
      totalCommission: 156.50,
      amountPaid: 0,
      amountOwed: 156.50,
      status: "pending",
      dueDate: "2025-11-15",
    },
  ];

  const DEMO_POSTBACK_CONFIGS = [
    { id: "pb_1", eventType: "sale", url: "https://yourtracker.com/postback?event=sale&clickid={sub}&commission={commission}", enabled: true },
    { id: "pb_2", eventType: "page_view", url: "https://analytics.com/track?event=view&ref={sub}", enabled: true },
    { id: "pb_3", eventType: "checkout_view", url: "https://tracker.com/event?type=checkout&id={sub}", enabled: false },
  ];

  useEffect(() => {
    fetchAffiliateData();
  }, [demoMode, dateRange]);

  const fetchAffiliateData = async () => {
    setLoading(true);
    try {
      if (demoMode) {
        setAffiliateData(DEMO_AFFILIATE);
        setStats(DEMO_STATS);
        setPostbackUrl(DEMO_AFFILIATE.postbackUrl);
        setPixelCode(DEMO_AFFILIATE.pixelCode);
        setDailyReports(DEMO_DAILY_REPORTS);
        setHourlyReports(DEMO_HOURLY_REPORTS);
        setSubIDReports(DEMO_SUBID_REPORTS);
        setEventStats(DEMO_EVENT_STATS);
        setInvoices(DEMO_INVOICES);
        setOpenBalance(156.50);
        setPrepaidCredit(0);
        setPostbackConfigs(DEMO_POSTBACK_CONFIGS);
      } else {
        const response = await fetch(`${API_URL}/affiliate/dashboard?range=${dateRange}`, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAffiliateData(data.affiliate);
          setStats(data.stats);
          setPostbackUrl(data.affiliate.postbackUrl || "");
          setPixelCode(data.affiliate.pixelCode || "");
          setDailyReports(data.dailyReports || []);
          setHourlyReports(data.hourlyReports || []);
          setSubIDReports(data.subIDReports || []);
          setEventStats(data.eventStats || []);
          setInvoices(data.invoices || []);
          setOpenBalance(data.openBalance || 0);
          setPrepaidCredit(data.prepaidCredit || 0);
          setPostbackConfigs(data.postbackConfigs || []);
        }
      }
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTrackingSettings = async () => {
    if (demoMode) {
      alert("Demo Mode: Tracking settings saved! In production, these would be stored in the database.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/affiliate/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          postbackUrl,
          pixelCode,
        }),
      });

      if (response.ok) {
        alert("Tracking settings saved successfully!");
      }
    } catch (error) {
      console.error("Error saving tracking settings:", error);
      alert("Failed to save tracking settings");
    }
  };

  const addPostbackConfig = async () => {
    if (!newPostback.url.trim()) {
      alert("Please enter a URL");
      return;
    }

    if (demoMode) {
      const newConfig = {
        id: `pb_${Date.now()}`,
        eventType: newPostback.eventType,
        url: newPostback.url,
        enabled: true,
      };
      setPostbackConfigs([...postbackConfigs, newConfig]);
      setNewPostback({ eventType: "sale", url: "" });
      setShowAddPostback(false);
      alert("Demo Mode: Postback config added!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/affiliate/postback-configs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          affiliateId,
          eventType: newPostback.eventType,
          url: newPostback.url,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPostbackConfigs([...postbackConfigs, data.config]);
        setNewPostback({ eventType: "sale", url: "" });
        setShowAddPostback(false);
        alert("Postback configuration added successfully!");
      }
    } catch (error) {
      console.error("Error adding postback config:", error);
      alert("Failed to add postback configuration");
    }
  };

  const togglePostbackConfig = async (id: string) => {
    const config = postbackConfigs.find((c) => c.id === id);
    if (!config) return;

    if (demoMode) {
      setPostbackConfigs(
        postbackConfigs.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/affiliate/postback-configs/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          enabled: !config.enabled,
        }),
      });

      if (response.ok) {
        setPostbackConfigs(
          postbackConfigs.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
        );
      }
    } catch (error) {
      console.error("Error toggling postback config:", error);
    }
  };

  const deletePostbackConfig = async (id: string) => {
    if (!confirm("Are you sure you want to delete this postback configuration?")) {
      return;
    }

    if (demoMode) {
      setPostbackConfigs(postbackConfigs.filter((c) => c.id !== id));
      alert("Demo Mode: Postback config deleted!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/affiliate/postback-configs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        setPostbackConfigs(postbackConfigs.filter((c) => c.id !== id));
        alert("Postback configuration deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting postback config:", error);
      alert("Failed to delete postback configuration");
    }
  };

  const copyToClipboard = (text: string) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          // Fallback to execCommand if Clipboard API fails
          fallbackCopyToClipboard(text);
        });
    } else {
      // Use fallback for browsers that don't support Clipboard API
      fallbackCopyToClipboard(text);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Fallback: Could not copy text', err);
      alert('Failed to copy. Please copy manually: ' + text);
    }
    
    document.body.removeChild(textArea);
  };

  const buildTrackingLink = () => {
    if (!affiliateData) return "";
    
    let url = affiliateData.trackingUrl;
    const params = new URLSearchParams();
    
    if (subIDs.sub) params.append("sub", subIDs.sub);
    if (subIDs.sub2) params.append("sub2", subIDs.sub2);
    if (subIDs.sub3) params.append("sub3", subIDs.sub3);
    if (subIDs.sub4) params.append("sub4", subIDs.sub4);
    if (subIDs.sub5) params.append("sub5", subIDs.sub5);
    
    const paramString = params.toString();
    if (paramString) {
      url += (url.includes("?") ? "&" : "?") + paramString;
    }
    
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading affiliate dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button and Logout */}
        <div className="mb-4 flex items-center justify-between">
          <Button onClick={onBackToSales} variant="outline" className="text-sm">
            ← Back to Sales Page
          </Button>
          <Button onClick={onLogout} variant="outline" className="text-sm text-red-600 border-red-600 hover:bg-red-50">
            Logout
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1
              className="text-4xl md:text-5xl text-center"
              style={{ fontFamily: '"Pacifico", cursive', color: "#dc2626" }}
            >
              🎁 Affiliate Partner Dashboard
            </h1>
          </div>
          <p className="text-center text-gray-600 mb-4">Track your performance and manage your affiliate links</p>

          {/* Demo Mode Toggle */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => setDemoMode(!demoMode)}
              variant={demoMode ? "default" : "outline"}
              className={demoMode ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              {demoMode ? "🎭 Demo Mode Active" : "🎭 Try Demo Mode"}
            </Button>
            {demoMode && (
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                Viewing Sample Data
              </Badge>
            )}
          </div>
        </div>

        {/* Affiliate Status */}
        {affiliateData && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl mb-1">{affiliateData.affiliateName}</h2>
                <p className="text-gray-600">{affiliateData.email}</p>
              </div>
              <Badge
                className={
                  affiliateData.status === "active"
                    ? "bg-green-500 text-white"
                    : affiliateData.status === "pending"
                    ? "bg-yellow-500 text-white"
                    : "bg-red-500 text-white"
                }
              >
                {affiliateData.status.toUpperCase()}
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Affiliate ID</p>
                <p className="font-mono">{affiliateData.affiliateId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Commission Rate</p>
                <p className="text-2xl text-green-600">{affiliateData.commissionRate}%</p>
              </div>
            </div>
          </Card>
        )}

        {/* Date Range Selector */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <Label>Date Range:</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="thismonth">This Month</SelectItem>
                <SelectItem value="lastmonth">Last Month</SelectItem>
                <SelectItem value="alltime">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-3xl mt-2">{stats.totalClicks.toLocaleString()}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-3xl mt-2">{stats.totalConversions}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-3xl mt-2">{stats.conversionRate.toFixed(2)}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Commission</p>
                <p className="text-3xl mt-2 text-green-600">${stats.commission.toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="links" className="space-y-6">
          <TabsList>
            <TabsTrigger value="links">Tracking Links</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="events">Event Breakdown</TabsTrigger>
            <TabsTrigger value="payments">Payments & Invoices</TabsTrigger>
            <TabsTrigger value="postback">Postback URLs / Pixels</TabsTrigger>
          </TabsList>

          {/* Tracking Links Tab */}
          <TabsContent value="links">
            <div className="space-y-6">
              {/* Base Tracking Link */}
              <Card className="p-6">
                <h3 className="text-xl mb-4">Your Base Affiliate Tracking Link</h3>
                <p className="text-gray-600 mb-4">
                  Share this link to track clicks and conversions. You'll earn a commission for each successful sale.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center gap-3">
                    <Input
                      value={affiliateData?.trackingUrl || ""}
                      readOnly
                      className="flex-1 font-mono text-sm bg-white"
                    />
                    <Button
                      onClick={() => copyToClipboard(affiliateData?.trackingUrl || "")}
                      variant="outline"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Sub-ID Link Builder */}
              <Card className="p-6">
                <h3 className="text-xl mb-4">Sub-ID Tracking Link Builder</h3>
                <p className="text-gray-600 mb-4">
                  Add up to 5 sub-IDs to track different campaigns, traffic sources, or any custom data. These
                  will be included in your postback.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="sub">Sub ID (Click ID / Campaign)</Label>
                    <Input
                      id="sub"
                      placeholder="e.g., facebook_campaign_001"
                      value={subIDs.sub}
                      onChange={(e) => setSubIDs({ ...subIDs, sub: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sub2">Sub ID 2 (Optional)</Label>
                    <Input
                      id="sub2"
                      placeholder="e.g., ad_group_123"
                      value={subIDs.sub2}
                      onChange={(e) => setSubIDs({ ...subIDs, sub2: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sub3">Sub ID 3 (Optional)</Label>
                    <Input
                      id="sub3"
                      placeholder="e.g., creative_variant_A"
                      value={subIDs.sub3}
                      onChange={(e) => setSubIDs({ ...subIDs, sub3: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sub4">Sub ID 4 (Optional)</Label>
                    <Input
                      id="sub4"
                      placeholder="e.g., landing_page_v2"
                      value={subIDs.sub4}
                      onChange={(e) => setSubIDs({ ...subIDs, sub4: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sub5">Sub ID 5 (Optional)</Label>
                    <Input
                      id="sub5"
                      placeholder="e.g., target_audience_moms"
                      value={subIDs.sub5}
                      onChange={(e) => setSubIDs({ ...subIDs, sub5: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Your Generated Link:</strong>
                  </p>
                  <code className="text-sm bg-white p-2 rounded block break-all">
                    {buildTrackingLink()}
                  </code>
                </div>

                <Button
                  onClick={() => copyToClipboard(buildTrackingLink())}
                  className="w-full md:w-auto"
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link with Sub-IDs
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-xl mb-2">📊 Detailed Performance Reports</h3>
                <p className="text-gray-600">
                  Comprehensive reports including daily/hourly breakdowns, revenue tracking, order details, refunds, and chargebacks
                </p>
              </div>
              <AdminAffiliateReporting 
                affiliateId={affiliateId}
                showAllAffiliates={false}
              />
            </Card>
          </TabsContent>

          {/* Event Breakdown Tab */}
          <TabsContent value="events">
            <EventReporting eventStats={eventStats} totalClicks={stats.totalClicks} />
          </TabsContent>

          {/* Payments & Invoices Tab */}
          <TabsContent value="payments">
            <AffiliatePayments 
              invoices={invoices} 
              openBalance={openBalance} 
              prepaidCredit={prepaidCredit}
              isAdmin={false}
            />
          </TabsContent>

          {/* Postback URLs / Pixels Tab */}
          <TabsContent value="postback">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl">Event-Based Postback URLs & Pixels</h3>
                  <p className="text-gray-600 mt-2">
                    Configure multiple postback URLs or tracking pixels for different events. Each can fire on specific events like page views, form fills, or sales.
                  </p>
                </div>
                <Button onClick={() => setShowAddPostback(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Postback
                </Button>
              </div>

              {/* Add Postback Form */}
              {showAddPostback && (
                <Card className="p-4 mb-4 bg-blue-50 border-2 border-blue-200">
                  <h4 className="mb-3">Add New Postback / Pixel</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Event Type</Label>
                      <Select
                        value={newPostback.eventType}
                        onValueChange={(value) => setNewPostback({ ...newPostback, eventType: value })}
                      >
                        <SelectTrigger className="mt-2 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="page_view">Page View</SelectItem>
                          <SelectItem value="form_fill">Form Fill</SelectItem>
                          <SelectItem value="checkout_view">Checkout View</SelectItem>
                          <SelectItem value="added_multiple_packages">Added Multiple Packages</SelectItem>
                          <SelectItem value="payment_submit">Payment Submit</SelectItem>
                          <SelectItem value="sale">Sale (Conversion)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Postback URL or Pixel Code</Label>
                      <Textarea
                        placeholder='https://tracker.com/postback?event=sale&clickid={sub}&amount={amount} OR <img src="https://pixel.com/track?id={sub}" />'
                        value={newPostback.url}
                        onChange={(e) => setNewPostback({ ...newPostback, url: e.target.value })}
                        className="mt-2 font-mono text-sm bg-white"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addPostbackConfig} className="flex-1">
                        Add Configuration
                      </Button>
                      <Button onClick={() => {
                        setShowAddPostback(false);
                        setNewPostback({ eventType: "sale", url: "" });
                      }} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Postback Configs List */}
              <div className="space-y-3 mb-6">
                {postbackConfigs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No postback configurations yet. Click "Add Postback" to create one.
                  </div>
                ) : (
                  postbackConfigs.map((config) => (
                    <Card key={config.id} className={`p-4 ${config.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={config.enabled ? "default" : "secondary"}>
                              {config.eventType.replace(/_/g, " ").toUpperCase()}
                            </Badge>
                            {config.enabled ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <Power className="w-3 h-3 mr-1" />
                                Enabled
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                <PowerOff className="w-3 h-3 mr-1" />
                                Disabled
                              </Badge>
                            )}
                          </div>
                          <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                            {config.url}
                          </code>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePostbackConfig(config.id)}
                          >
                            {config.enabled ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => deletePostbackConfig(config.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Available Parameters Documentation */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="text-lg">Available Parameters</h4>
                <p className="text-sm text-gray-600">
                  Use these placeholders in your postback URLs or pixel codes. They will be automatically replaced with actual values:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm mb-2"><strong>Basic Parameters (all events):</strong></p>
                    <div className="font-mono text-xs space-y-1">
                      <p><span className="text-blue-600">&#123;affiliate_id&#125;</span> - Your affiliate ID</p>
                      <p><span className="text-blue-600">&#123;sub&#125;</span> - Sub ID / Click ID</p>
                      <p><span className="text-blue-600">&#123;sub2&#125;</span> - Sub ID 2 (if provided)</p>
                      <p><span className="text-blue-600">&#123;sub3&#125;</span> - Sub ID 3 (if provided)</p>
                      <p><span className="text-blue-600">&#123;sub4&#125;</span> - Sub ID 4 (if provided)</p>
                      <p><span className="text-blue-600">&#123;sub5&#125;</span> - Sub ID 5 (if provided)</p>
                      <p><span className="text-blue-600">&#123;package_count&#125;</span> - Number of packages (for added_multiple_packages event)</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm mb-2"><strong>Sale Event Parameters (only for "Sale" events):</strong></p>
                    <div className="font-mono text-xs space-y-1">
                      <p><span className="text-blue-600">&#123;order_id&#125;</span> - Order/Session ID</p>
                      <p><span className="text-blue-600">&#123;commission&#125;</span> - Your commission amount (you earn per conversion)</p>
                      <p><span className="text-blue-600">&#123;transaction_id&#125;</span> - Payment transaction ID</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Example Postback URLs:</strong>
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-yellow-700 mb-1">Page View Event:</p>
                      <code className="bg-white px-2 py-1 rounded block break-all">
                        https://tracker.com/event?type=view&clickid=&#123;sub&#125;&aff=&#123;affiliate_id&#125;
                      </code>
                    </div>
                    <div>
                      <p className="text-yellow-700 mb-1">Sale Event:</p>
                      <code className="bg-white px-2 py-1 rounded block break-all">
                        https://tracker.com/postback?event=sale&clickid=&#123;sub&#125;&commission=&#123;commission&#125;&order=&#123;order_id&#125;
                      </code>
                    </div>
                    <div>
                      <p className="text-yellow-700 mb-1">Tracking Pixel (Image):</p>
                      <code className="bg-white px-2 py-1 rounded block break-all">
                        &lt;img src="https://pixel.com/track?id=&#123;sub&#125;&event=sale" /&gt;
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Commission Breakdown */}
        <Card className="p-6 mt-6">
          <h3 className="text-xl mb-4">Commission Summary</h3>
          <p className="text-gray-600 mb-4">You earn a fixed commission per conversion (sale). Revenue and order values are not shared.</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Total Conversions</span>
              <span className="text-xl">{stats.totalConversions}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Commission Per Conversion</span>
              <span className="text-xl text-blue-600">${affiliateData ? (stats.commission / Math.max(stats.totalConversions, 1)).toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-100 border border-green-300 rounded-lg">
              <span className="text-green-800">Your Total Commission Earned</span>
              <span className="text-2xl text-green-600">${stats.commission.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
