import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { 
  Plus, Edit, Link as LinkIcon, Copy, CheckCircle2, Trash2, DollarSign,
  TrendingUp, Users, XCircle, BarChart3, Calendar, Eye, RefreshCw, Power, PowerOff, Wallet, FileText
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { EventReporting } from "./EventReporting";
import { AffiliatePayments } from "./AffiliatePayments";
import { AdminAffiliateReporting } from "./AdminAffiliateReporting";

interface AffiliateAccount {
  affiliateId: string;
  affiliateName: string;
  email: string;
  status: "active" | "pending" | "suspended";
  defaultPayoutType: "cpa" | "percentage";
  defaultPayoutAmount: number;
  password: string;
  createdAt: string;
}

interface AffiliateLink {
  linkId: string;
  affiliateId: string;
  linkName: string;
  payoutType: "cpa" | "percentage";
  payoutAmount: number;
  customPrice?: number;
  isDefault: boolean;
  trackingUrl: string;
  createdAt: string;
}

interface PostbackSettings {
  postbackUrl: string;
  pixelCode: string;
  enabledEvents: string[];
}

interface PostbackLog {
  postbackId: string;
  affiliateId: string;
  eventId: string;
  eventType: string;
  orderId?: string;
  url: string;
  status: "success" | "failed";
  statusCode?: number;
  error?: string;
  timestamp: string;
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

interface EventStats {
  eventType: string;
  count: number;
}

interface AdminAffiliateManagementProps {
  onBack: () => void;
  onLogout?: () => void;
}

export function AdminAffiliateManagement({ onBack, onLogout }: AdminAffiliateManagementProps) {
  const [affiliates, setAffiliates] = useState<AffiliateAccount[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editLinkDialogOpen, setEditLinkDialogOpen] = useState(false);
  const [postbackDialogOpen, setPostbackDialogOpen] = useState(false);
  const [postbackLogsDialogOpen, setPostbackLogsDialogOpen] = useState(false);
  const [reportingDialogOpen, setReportingDialogOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [postbackSettings, setPostbackSettings] = useState<PostbackSettings>({
    postbackUrl: "",
    pixelCode: "",
    enabledEvents: [],
  });
  const [postbackLogs, setPostbackLogs] = useState<PostbackLog[]>([]);
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null);
  
  // Multi-event postback configs
  const [postbackConfigs, setPostbackConfigs] = useState<Array<{
    id: string;
    eventType: string;
    url: string;
    enabled: boolean;
  }>>([]);
  const [showAddPostback, setShowAddPostback] = useState(false);
  const [newPostback, setNewPostback] = useState({ eventType: "sale", url: "" });
  
  // Payments & Invoices
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [openBalance, setOpenBalance] = useState(0);
  const [prepaidCredit, setPrepaidCredit] = useState(0);
  const [generateInvoiceDialogOpen, setGenerateInvoiceDialogOpen] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    periodStart: "",
    periodEnd: "",
    amount: "",
  });
  
  // Event Stats
  const [eventStatsDialogOpen, setEventStatsDialogOpen] = useState(false);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);

  // New affiliate form
  const [newAffiliate, setNewAffiliate] = useState({
    name: "",
    email: "",
    payoutType: "percentage" as "cpa" | "percentage",
    payoutAmount: 20,
  });

  // New link form
  const [newLink, setNewLink] = useState({
    linkName: "",
    payoutType: "percentage" as "cpa" | "percentage",
    payoutAmount: 20,
    customPrice: "",
  });

  // Edit link form
  const [editLink, setEditLink] = useState({
    payoutType: "percentage" as "cpa" | "percentage",
    payoutAmount: 20,
    customPrice: "",
  });

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566`;

  // Demo data
  const DEMO_AFFILIATES: AffiliateAccount[] = [
    {
      affiliateId: "9004",
      affiliateName: "Demo Partner",
      email: "partner@example.com",
      status: "active",
      defaultPayoutType: "percentage",
      defaultPayoutAmount: 20,
      password: "demo123",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      affiliateId: "9005",
      affiliateName: "Social Media Pro",
      email: "socialmedia@example.com",
      status: "active",
      defaultPayoutType: "cpa",
      defaultPayoutAmount: 5.00,
      password: "demo456",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const DEMO_LINKS: AffiliateLink[] = [
    {
      linkId: "link_9004_default",
      affiliateId: "9004",
      linkName: "Default Link",
      payoutType: "percentage",
      payoutAmount: 20,
      isDefault: true,
      trackingUrl: `https://santascertifiedletter.com/?ref=9004`,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      linkId: "link_9004_premium",
      affiliateId: "9004",
      linkName: "Premium Campaign",
      payoutType: "percentage",
      payoutAmount: 25,
      customPrice: 22.95,
      isDefault: false,
      trackingUrl: `https://santascertifiedletter.com/?ref=9004&campaign=premium`,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      linkId: "link_9005_default",
      affiliateId: "9005",
      linkName: "Default Link",
      payoutType: "cpa",
      payoutAmount: 5.00,
      isDefault: true,
      trackingUrl: `https://santascertifiedletter.com/?ref=9005`,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const DEMO_POSTBACK_LOGS: PostbackLog[] = [
    {
      postbackId: "pb_1",
      affiliateId: "9004",
      eventId: "event_123",
      eventType: "sale",
      orderId: "cs_test_001",
      url: "https://tracker.com/postback?aff=9004&amount=17.95&orderid=cs_test_001",
      status: "success",
      statusCode: 200,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      postbackId: "pb_2",
      affiliateId: "9004",
      eventId: "event_124",
      eventType: "form_fill",
      url: "https://tracker.com/postback?aff=9004&event=form_fill",
      status: "success",
      statusCode: 200,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      postbackId: "pb_3",
      affiliateId: "9004",
      eventId: "event_125",
      eventType: "sale",
      orderId: "cs_test_002",
      url: "https://tracker.com/postback?aff=9004&amount=35.90&orderid=cs_test_002",
      status: "failed",
      statusCode: 404,
      error: "Not Found",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const DEMO_EVENT_STATS: EventStats[] = [
    { eventType: "page_view", count: 342 },
    { eventType: "form_fill", count: 156 },
    { eventType: "checkout_view", count: 98 },
    { eventType: "added_multiple_packages", count: 43 },
    { eventType: "payment_submit", count: 67 },
    { eventType: "sale", count: 28 },
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

  useEffect(() => {
    fetchData();
  }, [demoMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (demoMode) {
        setAffiliates(DEMO_AFFILIATES);
        setAffiliateLinks(DEMO_LINKS);
      } else {
        const response = await fetch(`${API_URL}/admin/affiliates`, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAffiliates(data.affiliates || []);
          setAffiliateLinks(data.links || []);
        }
      }
    } catch (error) {
      console.error("Error fetching affiliates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPostbackSettings = async (affiliate: AffiliateAccount) => {
    if (demoMode) {
      setPostbackSettings({
        postbackUrl: `https://tracker.com/postback?aff={affiliate_id}&amount={amount}&orderid={orderid}&event={event_type}`,
        pixelCode: `<img src="https://tracker.com/pixel?id=${affiliate.affiliateId}&event={event_type}" />`,
        enabledEvents: ["sale", "form_fill", "page_view"],
      });
    } else {
      try {
        const response = await fetch(`${API_URL}/admin/affiliates/${affiliate.affiliateId}/postbacks`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPostbackSettings(data.postbacks || { postbackUrl: "", pixelCode: "", enabledEvents: [] });
        }
      } catch (error) {
        console.error("Error loading postback settings:", error);
      }
    }
  };

  const loadPostbackLogs = async (affiliate: AffiliateAccount) => {
    if (demoMode) {
      setPostbackLogs(DEMO_POSTBACK_LOGS.filter(log => log.affiliateId === affiliate.affiliateId));
    } else {
      try {
        const response = await fetch(`${API_URL}/affiliate/${affiliate.affiliateId}/postback-logs`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPostbackLogs(data.logs || []);
        }
      } catch (error) {
        console.error("Error loading postback logs:", error);
      }
    }
  };

  const createAffiliate = async () => {
    if (!newAffiliate.name || !newAffiliate.email) {
      alert("Please fill in all required fields");
      return;
    }

    if (demoMode) {
      const affiliateId = `900${affiliates.length + 4}`;
      const newAff: AffiliateAccount = {
        affiliateId,
        affiliateName: newAffiliate.name,
        email: newAffiliate.email,
        status: "active",
        defaultPayoutType: newAffiliate.payoutType,
        defaultPayoutAmount: newAffiliate.payoutAmount,
        password: Math.random().toString(36).substring(2, 10),
        createdAt: new Date().toISOString(),
      };

      const defaultLink: AffiliateLink = {
        linkId: `link_${affiliateId}_default`,
        affiliateId,
        linkName: "Default Link",
        payoutType: newAffiliate.payoutType,
        payoutAmount: newAffiliate.payoutAmount,
        isDefault: true,
        trackingUrl: `https://santascertifiedletter.com/offer?ref=${affiliateId}`,
        createdAt: new Date().toISOString(),
      };

      setAffiliates((prev) => [...prev, newAff]);
      setAffiliateLinks((prev) => [...prev, defaultLink]);
      setCreateDialogOpen(false);
      setNewAffiliate({ name: "", email: "", payoutType: "percentage", payoutAmount: 20 });
      alert(`Affiliate created successfully!\n\nAffiliate ID: ${affiliateId}\nPassword: ${newAff.password}\n\nPlease save this password - it won't be shown again.`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/affiliates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(newAffiliate),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchData();
        setCreateDialogOpen(false);
        setNewAffiliate({ name: "", email: "", payoutType: "percentage", payoutAmount: 20 });
        alert(`Affiliate created successfully!\n\nAffiliate ID: ${data.affiliate.affiliateId}\nPassword: ${data.affiliate.password}\n\nPlease save this password - it won't be shown again.`);
      } else {
        alert("Failed to create affiliate");
      }
    } catch (error) {
      console.error("Error creating affiliate:", error);
      alert("Failed to create affiliate");
    }
  };

  const createLink = async () => {
    if (!selectedAffiliate || !newLink.linkName) {
      alert("Please fill in all required fields");
      return;
    }

    if (demoMode) {
      const linkId = `link_${selectedAffiliate.affiliateId}_${Date.now()}`;
      const campaignParam = newLink.linkName.toLowerCase().replace(/\s+/g, "-");
      
      let trackingUrl = `https://santascertifiedletter.com/offer?ref=${selectedAffiliate.affiliateId}`;
      if (!newLink.linkName.toLowerCase().includes("default")) {
        trackingUrl += `&campaign=${campaignParam}`;
      }
      // Note: Custom price is stored in the link settings, not in the URL

      const link: AffiliateLink = {
        linkId,
        affiliateId: selectedAffiliate.affiliateId,
        linkName: newLink.linkName,
        payoutType: newLink.payoutType,
        payoutAmount: newLink.payoutAmount,
        customPrice: newLink.customPrice ? parseFloat(newLink.customPrice) : undefined,
        isDefault: false,
        trackingUrl,
        createdAt: new Date().toISOString(),
      };

      setAffiliateLinks((prev) => [...prev, link]);
      setLinkDialogOpen(false);
      setNewLink({ linkName: "", payoutType: "percentage", payoutAmount: 20, customPrice: "" });
      alert("Affiliate link created successfully!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/affiliates/${selectedAffiliate.affiliateId}/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          ...newLink,
          customPrice: newLink.customPrice ? parseFloat(newLink.customPrice) : undefined,
        }),
      });

      if (response.ok) {
        await fetchData();
        setLinkDialogOpen(false);
        setNewLink({ linkName: "", payoutType: "percentage", payoutAmount: 20, customPrice: "" });
        alert("Affiliate link created successfully!");
      } else {
        alert("Failed to create link");
      }
    } catch (error) {
      console.error("Error creating link:", error);
      alert("Failed to create link");
    }
  };

  const updateLink = async () => {
    if (!selectedLink) return;

    if (demoMode) {
      setAffiliateLinks((prev) =>
        prev.map((link) =>
          link.linkId === selectedLink.linkId
            ? {
                ...link,
                payoutType: editLink.payoutType,
                payoutAmount: editLink.payoutAmount,
                customPrice: editLink.customPrice ? parseFloat(editLink.customPrice) : undefined,
              }
            : link
        )
      );
      setEditLinkDialogOpen(false);
      setSelectedLink(null);
      alert("Link updated successfully!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/affiliates/links/${selectedLink.linkId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          payoutType: editLink.payoutType,
          payoutAmount: editLink.payoutAmount,
          customPrice: editLink.customPrice ? parseFloat(editLink.customPrice) : undefined,
        }),
      });

      if (response.ok) {
        await fetchData();
        setEditLinkDialogOpen(false);
        setSelectedLink(null);
        alert("Link updated successfully!");
      } else {
        alert("Failed to update link");
      }
    } catch (error) {
      console.error("Error updating link:", error);
      alert("Failed to update link");
    }
  };

  const savePostbackSettings = async () => {
    if (!selectedAffiliate) return;

    if (demoMode) {
      alert("Postback settings saved successfully!");
      setPostbackDialogOpen(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/affiliates/${selectedAffiliate.affiliateId}/postbacks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(postbackSettings),
      });

      if (response.ok) {
        alert("Postback settings saved successfully!");
        setPostbackDialogOpen(false);
      } else {
        alert("Failed to save postback settings");
      }
    } catch (error) {
      console.error("Error saving postback settings:", error);
      alert("Failed to save postback settings");
    }
  };

  const deleteLink = async (linkId: string) => {
    const link = affiliateLinks.find((l) => l.linkId === linkId);
    if (link?.isDefault) {
      alert("Cannot delete the default link");
      return;
    }

    if (!confirm("Are you sure you want to delete this link?")) {
      return;
    }

    if (demoMode) {
      setAffiliateLinks((prev) => prev.filter((l) => l.linkId !== linkId));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/affiliates/links/${linkId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (response.ok) {
        await fetchData();
      } else {
        alert("Failed to delete link");
      }
    } catch (error) {
      console.error("Error deleting link:", error);
      alert("Failed to delete link");
    }
  };

  const updateAffiliateStatus = async (affiliateId: string, status: string) => {
    if (demoMode) {
      setAffiliates((prev) =>
        prev.map((aff) =>
          aff.affiliateId === affiliateId ? { ...aff, status: status as any } : aff
        )
      );
      return;
    }

    try {
      await fetch(`${API_URL}/admin/affiliates/${affiliateId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ status }),
      });

      await fetchData();
    } catch (error) {
      console.error("Error updating affiliate:", error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopied(id);
          setTimeout(() => setCopied(null), 2000);
        })
        .catch(() => {
          // Fallback to execCommand if Clipboard API fails
          fallbackCopyToClipboard(text, id);
        });
    } else {
      // Use fallback for browsers that don't support Clipboard API
      fallbackCopyToClipboard(text, id);
    }
  };

  const fallbackCopyToClipboard = (text: string, id: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err);
    }
    document.body.removeChild(textArea);
  };

  const getLinksForAffiliate = (affiliateId: string) => {
    return affiliateLinks.filter((link) => link.affiliateId === affiliateId);
  };

  const toggleEvent = (event: string) => {
    setPostbackSettings(prev => ({
      ...prev,
      enabledEvents: prev.enabledEvents.includes(event)
        ? prev.enabledEvents.filter(e => e !== event)
        : [...prev.enabledEvents, event]
    }));
  };

  const loadPostbackConfigs = async (affiliate: AffiliateAccount) => {
    if (demoMode) {
      const demoConfigs = [
        { id: "pb_1", eventType: "sale", url: "https://tracker.com/postback?event=sale&clickid={sub}&amount={amount}", enabled: true },
        { id: "pb_2", eventType: "page_view", url: "https://analytics.com/track?event=view&ref={sub}", enabled: true },
        { id: "pb_3", eventType: "checkout_view", url: "https://tracker.com/event?type=checkout&id={sub}", enabled: true },
      ];
      setPostbackConfigs(demoConfigs);
    } else {
      try {
        const response = await fetch(`${API_URL}/affiliate/postback-configs/${affiliate.affiliateId}`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPostbackConfigs(data.configs || []);
        }
      } catch (error) {
        console.error("Error loading postback configs:", error);
      }
    }
  };

  const addPostbackConfig = async () => {
    if (!selectedAffiliate || !newPostback.url.trim()) {
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
          affiliateId: selectedAffiliate.affiliateId,
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

  const generateInvoice = async () => {
    if (!selectedAffiliate || !newInvoiceData.periodStart || !newInvoiceData.periodEnd || !newInvoiceData.amount) {
      alert("Please fill in all fields");
      return;
    }

    const amount = parseFloat(newInvoiceData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (demoMode) {
      const newInvoice: Invoice = {
        invoiceId: `inv_${Date.now()}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        periodStart: newInvoiceData.periodStart,
        periodEnd: newInvoiceData.periodEnd,
        totalCommission: amount,
        amountPaid: 0,
        amountOwed: amount,
        status: "pending",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      setInvoices([...invoices, newInvoice]);
      setOpenBalance(openBalance + amount);
      setGenerateInvoiceDialogOpen(false);
      setNewInvoiceData({ periodStart: "", periodEnd: "", amount: "" });
      alert("Demo Mode: Invoice generated successfully!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/affiliate/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          affiliateId: selectedAffiliate.affiliateId,
          periodStart: newInvoiceData.periodStart,
          periodEnd: newInvoiceData.periodEnd,
          totalCommission: amount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices([...invoices, data.invoice]);
        setOpenBalance(openBalance + amount);
        setGenerateInvoiceDialogOpen(false);
        setNewInvoiceData({ periodStart: "", periodEnd: "", amount: "" });
        alert("Invoice generated successfully!");
      }
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice");
    }
  };

  const recordPayment = async (invoiceId: string, paymentAmount: number) => {
    const invoice = invoices.find(inv => inv.invoiceId === invoiceId);
    if (!invoice) return;

    if (demoMode) {
      const overpayment = Math.max(0, paymentAmount - invoice.amountOwed);
      const actualPayment = Math.min(paymentAmount, invoice.amountOwed);

      const updatedInvoice = {
        ...invoice,
        amountPaid: invoice.amountPaid + actualPayment,
        amountOwed: invoice.amountOwed - actualPayment,
        status: (invoice.amountOwed - actualPayment === 0) ? "paid" as const : "partial" as const,
        paidDate: (invoice.amountOwed - actualPayment === 0) ? new Date().toISOString() : invoice.paidDate,
      };

      setInvoices(invoices.map(inv => inv.invoiceId === invoiceId ? updatedInvoice : inv));
      setOpenBalance(openBalance - actualPayment);
      
      if (overpayment > 0) {
        setPrepaidCredit(prepaidCredit + overpayment);
      }

      alert(`Demo Mode: Payment recorded! ${overpayment > 0 ? `${overpayment.toFixed(2)} added as prepaid credit.` : ''}`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/affiliate/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          amountPaid: invoice.amountPaid + paymentAmount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(invoices.map(inv => inv.invoiceId === invoiceId ? data.invoice : inv));
        
        // Update balance
        const overpayment = Math.max(0, paymentAmount - invoice.amountOwed);
        const actualPayment = Math.min(paymentAmount, invoice.amountOwed);
        setOpenBalance(openBalance - actualPayment);
        
        if (overpayment > 0) {
          setPrepaidCredit(prepaidCredit + overpayment);
        }
        
        alert(`Payment recorded successfully! ${overpayment > 0 ? `${overpayment.toFixed(2)} added as prepaid credit.` : ''}`);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Failed to record payment");
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.invoiceId === invoiceId);
    if (!invoice) return;

    if (demoMode) {
      setInvoices(invoices.filter(inv => inv.invoiceId !== invoiceId));
      setOpenBalance(openBalance - invoice.amountOwed);
      alert("Demo Mode: Invoice deleted successfully!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/affiliate/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        setInvoices(invoices.filter(inv => inv.invoiceId !== invoiceId));
        setOpenBalance(openBalance - invoice.amountOwed);
        alert("Invoice deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="mb-4 flex items-center justify-between">
          <Button onClick={onBack} variant="outline" className="text-sm">
            ← Back to Admin
          </Button>
          {onLogout && (
            <Button onClick={onLogout} variant="outline" className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50">
              🔒 Logout
            </Button>
          )}
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1
              className="text-4xl md:text-5xl text-center"
              style={{ fontFamily: '"Pacifico", cursive', color: "#dc2626" }}
            >
              🎁 Affiliate Management
            </h1>
          </div>
          <p className="text-center text-gray-600 mb-4">
            Create and manage affiliate accounts, track performance, and manage payments
          </p>

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

        {/* Global Reporting Section */}
        <Card className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl mb-1">📊 Network Performance Reports</h3>
              <p className="text-sm text-gray-600">
                View comprehensive reports across all affiliates including revenue, orders, chargebacks, and declines
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  View All Reports
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Network Performance Reports</DialogTitle>
                  <DialogDescription>
                    Comprehensive reports across all affiliates with revenue tracking, orders, chargebacks, and declines
                  </DialogDescription>
                </DialogHeader>
                <AdminAffiliateReporting showAllAffiliates={true} />
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        {/* Create Affiliate Button */}
        <div className="mb-6 flex justify-between items-center">
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Affiliate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Affiliate Account</DialogTitle>
                <DialogDescription>
                  Create a new affiliate partner account with custom commission settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Affiliate Name *</Label>
                  <Input
                    placeholder="John's Marketing Agency"
                    value={newAffiliate.name}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="john@agency.com"
                    value={newAffiliate.email}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, email: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Commission Payout Type</Label>
                  <Select
                    value={newAffiliate.payoutType}
                    onValueChange={(value: "cpa" | "percentage") =>
                      setNewAffiliate({ ...newAffiliate, payoutType: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">% Commission per Sale</SelectItem>
                      <SelectItem value="cpa">Fixed $ per Conversion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    {newAffiliate.payoutType === "percentage" ? "Commission Percentage (%)" : "Commission per Conversion ($)"}
                  </Label>
                  <Input
                    type="number"
                    step={newAffiliate.payoutType === "percentage" ? "1" : "0.01"}
                    placeholder={newAffiliate.payoutType === "percentage" ? "20" : "5.00"}
                    value={newAffiliate.payoutAmount}
                    onChange={(e) =>
                      setNewAffiliate({ ...newAffiliate, payoutAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newAffiliate.payoutType === "percentage" 
                      ? "Affiliate earns this % of order value per conversion" 
                      : "Affiliate earns this fixed amount per conversion"}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-800">
                  A default tracking link will be automatically created. Affiliate ID will start with 9004.
                </div>
                <Button onClick={createAffiliate} className="w-full">
                  Create Affiliate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Affiliates List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading affiliates...</p>
          </div>
        ) : affiliates.length === 0 ? (
          <Card className="p-12 text-center">
            <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No affiliates yet</p>
            <Button onClick={() => setCreateDialogOpen(true)} variant="outline">
              Create Your First Affiliate
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {affiliates.map((affiliate) => {
              const links = getLinksForAffiliate(affiliate.affiliateId);

              return (
                <Card key={affiliate.affiliateId} className="p-6">
                  {/* Affiliate Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl mb-1">{affiliate.affiliateName}</h3>
                      <p className="text-gray-600">{affiliate.email}</p>
                      <p className="text-sm text-gray-500 font-mono mt-1">
                        ID: {affiliate.affiliateId} | Password: {affiliate.password}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={affiliate.status}
                        onValueChange={(value) => updateAffiliateStatus(affiliate.affiliateId, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge
                        className={
                          affiliate.status === "active"
                            ? "bg-green-500 text-white"
                            : affiliate.status === "pending"
                            ? "bg-yellow-500 text-white"
                            : "bg-red-500 text-white"
                        }
                      >
                        {affiliate.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Default Payout Settings */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600 mb-2">Default Payout Settings</p>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        {affiliate.defaultPayoutType === "percentage"
                          ? `${affiliate.defaultPayoutAmount}% Revenue Share`
                          : `$${affiliate.defaultPayoutAmount.toFixed(2)} CPA`}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        ⚠️ Only paid on first sale from new customers (no repeat orders or subscriptions)
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Postback Settings */}
                    <Dialog
                      open={postbackDialogOpen && selectedAffiliate?.affiliateId === affiliate.affiliateId}
                      onOpenChange={(open) => {
                        setPostbackDialogOpen(open);
                        if (open) {
                          setSelectedAffiliate(affiliate);
                          loadPostbackConfigs(affiliate);
                          setShowAddPostback(false);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Postback URLs / Pixels
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Event-Based Postback URLs & Pixels - {affiliate.affiliateName}</DialogTitle>
                          <DialogDescription>
                            Configure multiple postback URLs or tracking pixels for different events
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Add Postback Button */}
                          {!showAddPostback && (
                            <Button onClick={() => setShowAddPostback(true)} className="w-full bg-green-600 hover:bg-green-700">
                              <Plus className="w-4 h-4 mr-2" />
                              Add New Postback / Pixel
                            </Button>
                          )}

                          {/* Add Postback Form */}
                          {showAddPostback && (
                            <Card className="p-4 bg-blue-50 border-2 border-blue-200">
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
                          <div className="space-y-3">
                            <h4 className="text-sm">Configured Postbacks:</h4>
                            {postbackConfigs.length === 0 ? (
                              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                No postback configurations yet. Click "Add New Postback / Pixel" to create one.
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
                          <div className="border-t pt-4 space-y-3">
                            <h4 className="text-sm">Available Parameters:</h4>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-xs">
                              <div>
                                <p className="mb-1"><strong>Basic Parameters (all events):</strong></p>
                                <div className="font-mono space-y-1 text-blue-600">
                                  <p>&#123;affiliate_id&#125; &#123;sub&#125; &#123;sub2&#125; &#123;sub3&#125; &#123;sub4&#125; &#123;sub5&#125;</p>
                                </div>
                              </div>
                              <div>
                                <p className="mb-1"><strong>Sale Event Parameters:</strong></p>
                                <div className="font-mono space-y-1 text-blue-600">
                                  <p>&#123;order_id&#125; &#123;amount&#125; &#123;commission&#125; &#123;transaction_id&#125;</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Event Stats */}
                    <Dialog
                      open={eventStatsDialogOpen && selectedAffiliate?.affiliateId === affiliate.affiliateId}
                      onOpenChange={(open) => {
                        setEventStatsDialogOpen(open);
                        if (open) {
                          setSelectedAffiliate(affiliate);
                          if (demoMode) {
                            setEventStats(DEMO_EVENT_STATS);
                          }
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Event Stats
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Event Breakdown - {affiliate.affiliateName}</DialogTitle>
                          <DialogDescription>
                            Track user progression through the conversion funnel
                          </DialogDescription>
                        </DialogHeader>
                        <EventReporting eventStats={eventStats} totalClicks={342} />
                      </DialogContent>
                    </Dialog>

                    {/* Payments & Invoices */}
                    <Dialog
                      open={paymentsDialogOpen && selectedAffiliate?.affiliateId === affiliate.affiliateId}
                      onOpenChange={(open) => {
                        setPaymentsDialogOpen(open);
                        if (open) {
                          setSelectedAffiliate(affiliate);
                          if (demoMode) {
                            setInvoices(DEMO_INVOICES);
                            setOpenBalance(156.50);
                            setPrepaidCredit(0);
                          }
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Wallet className="w-4 h-4 mr-2" />
                          Payments & Invoices
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Payments & Invoices - {affiliate.affiliateName}</DialogTitle>
                          <DialogDescription>
                            Manage affiliate payments, invoices, and balance tracking
                          </DialogDescription>
                        </DialogHeader>
                        <AffiliatePayments 
                          invoices={invoices} 
                          openBalance={openBalance} 
                          prepaidCredit={prepaidCredit}
                          isAdmin={true}
                          affiliateId={affiliate.affiliateId}
                          onGenerateInvoice={() => setGenerateInvoiceDialogOpen(true)}
                          onRecordPayment={recordPayment}
                          onDeleteInvoice={deleteInvoice}
                        />
                      </DialogContent>
                    </Dialog>

                    {/* Detailed Reports */}
                    <Dialog
                      open={reportingDialogOpen && selectedAffiliate?.affiliateId === affiliate.affiliateId}
                      onOpenChange={(open) => {
                        setReportingDialogOpen(open);
                        if (open) {
                          setSelectedAffiliate(affiliate);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
                          <FileText className="w-4 h-4 mr-2" />
                          Detailed Reports
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Detailed Performance Reports - {affiliate.affiliateName}</DialogTitle>
                          <DialogDescription>
                            View daily/hourly reports, revenue tracking, orders, chargebacks, and declines
                          </DialogDescription>
                        </DialogHeader>
                        <AdminAffiliateReporting 
                          affiliateId={affiliate.affiliateId}
                          showAllAffiliates={false}
                        />
                      </DialogContent>
                    </Dialog>

                    {/* Generate Invoice Dialog */}
                    <Dialog open={generateInvoiceDialogOpen} onOpenChange={setGenerateInvoiceDialogOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Generate New Invoice</DialogTitle>
                          <DialogDescription>
                            Create a new invoice for {selectedAffiliate?.affiliateName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Period Start Date</Label>
                            <Input
                              type="date"
                              value={newInvoiceData.periodStart}
                              onChange={(e) => setNewInvoiceData({ ...newInvoiceData, periodStart: e.target.value })}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Period End Date</Label>
                            <Input
                              type="date"
                              value={newInvoiceData.periodEnd}
                              onChange={(e) => setNewInvoiceData({ ...newInvoiceData, periodEnd: e.target.value })}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Commission Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={newInvoiceData.amount}
                              onChange={(e) => setNewInvoiceData({ ...newInvoiceData, amount: e.target.value })}
                              className="mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Enter the total commission amount for this period
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={generateInvoice} className="flex-1 bg-green-600 hover:bg-green-700">
                              Generate Invoice
                            </Button>
                            <Button 
                              onClick={() => {
                                setGenerateInvoiceDialogOpen(false);
                                setNewInvoiceData({ periodStart: "", periodEnd: "", amount: "" });
                              }} 
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Postback Logs */}
                    <Dialog
                      open={postbackLogsDialogOpen && selectedAffiliate?.affiliateId === affiliate.affiliateId}
                      onOpenChange={(open) => {
                        setPostbackLogsDialogOpen(open);
                        if (open) {
                          setSelectedAffiliate(affiliate);
                          loadPostbackLogs(affiliate);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Postback Logs
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[600px] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Postback Conversion Report - {affiliate.affiliateName}</DialogTitle>
                          <DialogDescription>
                            View all postback attempts and their success/failure status
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {postbackLogs.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No postback logs found</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Timestamp</TableHead>
                                  <TableHead>Event Type</TableHead>
                                  <TableHead>Order ID</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>URL</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {postbackLogs.map((log) => (
                                  <TableRow key={log.postbackId}>
                                    <TableCell className="text-sm">
                                      {new Date(log.timestamp).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{log.eventType}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-mono">
                                      {log.orderId || "-"}
                                    </TableCell>
                                    <TableCell>
                                      {log.status === "success" ? (
                                        <Badge className="bg-green-500 text-white">
                                          <CheckCircle2 className="w-3 h-3 mr-1" />
                                          Success
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-red-500 text-white">
                                          <XCircle className="w-3 h-3 mr-1" />
                                          Failed
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono max-w-xs truncate">
                                      {log.url}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Create Link */}
                    <Dialog
                      open={linkDialogOpen && selectedAffiliate?.affiliateId === affiliate.affiliateId}
                      onOpenChange={(open) => {
                        setLinkDialogOpen(open);
                        if (open) {
                          setSelectedAffiliate(affiliate);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Link
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create Affiliate Link</DialogTitle>
                          <DialogDescription>
                            Create a custom tracking link with unique payout settings
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Link Name *</Label>
                            <Input
                              placeholder="Black Friday Campaign"
                              value={newLink.linkName}
                              onChange={(e) => setNewLink({ ...newLink, linkName: e.target.value })}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Commission Payout Type</Label>
                            <Select
                              value={newLink.payoutType}
                              onValueChange={(value: "cpa" | "percentage") =>
                                setNewLink({ ...newLink, payoutType: value })
                              }
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">% Commission per Sale</SelectItem>
                                <SelectItem value="cpa">Fixed $ per Conversion</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>
                              {newLink.payoutType === "percentage" ? "Commission Percentage (%)" : "Commission per Conversion ($)"}
                            </Label>
                            <Input
                              type="number"
                              step={newLink.payoutType === "percentage" ? "1" : "0.01"}
                              value={newLink.payoutAmount}
                              onChange={(e) =>
                                setNewLink({ ...newLink, payoutAmount: parseFloat(e.target.value) || 0 })
                              }
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Custom Price (Optional)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="22.95"
                              value={newLink.customPrice}
                              onChange={(e) => setNewLink({ ...newLink, customPrice: e.target.value })}
                              className="mt-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Set a custom price that will override the default pricing on checkout
                            </p>
                          </div>
                          <Button onClick={createLink} className="w-full">
                            Create Link
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Tracking Links */}
                  <div className="space-y-3">
                    <h4 className="text-sm">Tracking Links:</h4>
                    {links.map((link) => (
                      <div key={link.linkId} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p>{link.linkName}</p>
                              {link.isDefault && <Badge variant="outline">Default</Badge>}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">
                                {link.payoutType === "percentage"
                                  ? `${link.payoutAmount}% Commission`
                                  : `$${link.payoutAmount.toFixed(2)} CPA`}
                              </Badge>
                              {link.customPrice && (
                                <Badge className="bg-blue-500 text-white">
                                  Price: ${link.customPrice.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 break-all">
                                {link.trackingUrl}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(link.trackingUrl, link.linkId)}
                              >
                                {copied === link.linkId ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Dialog
                              open={editLinkDialogOpen && selectedLink?.linkId === link.linkId}
                              onOpenChange={(open) => {
                                setEditLinkDialogOpen(open);
                                if (open) {
                                  setSelectedLink(link);
                                  setEditLink({
                                    payoutType: link.payoutType,
                                    payoutAmount: link.payoutAmount,
                                    customPrice: link.customPrice ? link.customPrice.toString() : "",
                                  });
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Edit Link - {link.linkName}</DialogTitle>
                                  <DialogDescription>
                                    Update payout settings and custom pricing for this link
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Payout Type</Label>
                                    <Select
                                      value={editLink.payoutType}
                                      onValueChange={(value: "cpa" | "percentage") =>
                                        setEditLink({ ...editLink, payoutType: value })
                                      }
                                    >
                                      <SelectTrigger className="mt-2">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="percentage">% of Revenue</SelectItem>
                                        <SelectItem value="cpa">Fixed CPA</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>
                                      {editLink.payoutType === "percentage" ? "Percentage (%)" : "CPA Amount ($)"}
                                    </Label>
                                    <Input
                                      type="number"
                                      step={editLink.payoutType === "percentage" ? "1" : "0.01"}
                                      value={editLink.payoutAmount}
                                      onChange={(e) =>
                                        setEditLink({ ...editLink, payoutAmount: parseFloat(e.target.value) || 0 })
                                      }
                                      className="mt-2"
                                    />
                                  </div>
                                  <div>
                                    <Label>Custom Price (Optional)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="22.95"
                                      value={editLink.customPrice}
                                      onChange={(e) => setEditLink({ ...editLink, customPrice: e.target.value })}
                                      className="mt-2"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    ℹ️ Changes take effect immediately for new orders
                                  </p>
                                  <Button onClick={updateLink} className="w-full">
                                    Update Link
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {!link.isDefault && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteLink(link.linkId)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
