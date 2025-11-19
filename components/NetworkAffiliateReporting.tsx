import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { 
  DollarSign, TrendingUp, Users, MousePointerClick, Eye, Calendar, 
  BarChart3, RefreshCw, ArrowUpRight, XCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface ClickLog {
  clickId: string;
  affiliateId: string;
  subid: string;
  subid2: string;
  subid3: string;
  subid4: string;
  subid5: string;
  ip: string;
  userAgent: string;
  referrer: string;
  timestamp: string;
  converted: boolean;
}

interface SubidBreakdown {
  subid: string;
  rawClicks: number;
  uniqueClicks: number;
  conversions: number;
  revenue: number;
  commission: number;
}

interface AffiliateStats {
  affiliateId: string;
  affiliateName: string;
  rawClicks: number;
  uniqueClicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  subidBreakdown: SubidBreakdown[];
}

interface NetworkStats {
  totalRawClicks: number;
  totalUniqueClicks: number;
  totalRevenue: number;
  totalCommission: number;
  totalConversions: number;
  affiliateBreakdown: AffiliateStats[];
}

export function NetworkAffiliateReporting() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>("all");
  
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalRawClicks: 0,
    totalUniqueClicks: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalConversions: 0,
    affiliateBreakdown: [],
  });
  
  const [clickLogs, setClickLogs] = useState<ClickLog[]>([]);
  const [expandedAffiliates, setExpandedAffiliates] = useState<Set<string>>(new Set());
  const [clickLogsDialogOpen, setClickLogsDialogOpen] = useState(false);
  const [selectedSubid, setSelectedSubid] = useState("");
  
  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566`;

  useEffect(() => {
    loadNetworkStats();
  }, [dateRange]);

  const loadNetworkStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/network-click-stats?dateRange=${dateRange}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNetworkStats(data);
      }
    } catch (error) {
      console.error("Error loading network stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadClickLogs = async (affiliateId: string, subid: string = "") => {
    try {
      const params = new URLSearchParams({
        limit: "100",
        ...(subid && { subid }),
      });
      
      const response = await fetch(`${API_URL}/affiliate-click-logs/${affiliateId}?${params}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (response.ok) {
        const data = await response.json();
        setClickLogs(data.clicks || []);
        setSelectedAffiliate(affiliateId);
        setSelectedSubid(subid);
        setClickLogsDialogOpen(true);
      }
    } catch (error) {
      console.error("Error loading click logs:", error);
    }
  };

  const loadAffiliateSubidBreakdown = async (affiliateId: string) => {
    try {
      const response = await fetch(`${API_URL}/affiliate-click-stats/${affiliateId}?dateRange=${dateRange}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Update the affiliate in networkStats with subid breakdown
        setNetworkStats(prev => ({
          ...prev,
          affiliateBreakdown: prev.affiliateBreakdown.map(aff =>
            aff.affiliateId === affiliateId
              ? { ...aff, subidBreakdown: data.subidBreakdown || [] }
              : aff
          ),
        }));
      }
    } catch (error) {
      console.error("Error loading subid breakdown:", error);
    }
  };

  const toggleAffiliateExpansion = async (affiliateId: string) => {
    const newExpanded = new Set(expandedAffiliates);
    if (newExpanded.has(affiliateId)) {
      newExpanded.delete(affiliateId);
    } else {
      newExpanded.add(affiliateId);
      // Load subid breakdown if not already loaded
      await loadAffiliateSubidBreakdown(affiliateId);
    }
    setExpandedAffiliates(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const calculateConversionRate = (conversions: number, clicks: number) => {
    if (clicks === 0) return "0%";
    return ((conversions / clicks) * 100).toFixed(2) + "%";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Network Performance Reports</h2>
          <p className="text-sm text-gray-600">
            Comprehensive reports across all affiliates with revenue tracking, orders, clicks & conversions
          </p>
        </div>
        <Button onClick={loadNetworkStats} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl">{formatCurrency(networkStats.totalRevenue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Commission</p>
              <p className="text-2xl">{formatCurrency(networkStats.totalCommission)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <MousePointerClick className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Clicks (Unique)</p>
              <p className="text-2xl">
                {networkStats.totalRawClicks.toLocaleString()} ({networkStats.totalUniqueClicks.toLocaleString()})
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversions</p>
              <p className="text-2xl">{networkStats.totalConversions}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily">Daily Reports</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliate Breakdown</TabsTrigger>
          <TabsTrigger value="subids">SubID Breakdown</TabsTrigger>
          <TabsTrigger value="clicks">Click Logs</TabsTrigger>
        </TabsList>

        {/* Daily Reports Tab */}
        <TabsContent value="daily" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">Daily Performance</h3>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Raw Clicks</TableHead>
                    <TableHead>Unique Clicks</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Conv. Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{new Date().toLocaleDateString()}</TableCell>
                    <TableCell>{networkStats.totalRawClicks}</TableCell>
                    <TableCell>{networkStats.totalUniqueClicks}</TableCell>
                    <TableCell>{networkStats.totalConversions}</TableCell>
                    <TableCell>{formatCurrency(networkStats.totalRevenue)}</TableCell>
                    <TableCell>{formatCurrency(networkStats.totalCommission)}</TableCell>
                    <TableCell>
                      {calculateConversionRate(networkStats.totalConversions, networkStats.totalUniqueClicks)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Affiliate Breakdown Tab */}
        <TabsContent value="affiliates" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">Affiliate Breakdown</h3>
            <div className="space-y-2">
              {networkStats.affiliateBreakdown.map((affiliate) => (
                <div key={affiliate.affiliateId} className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleAffiliateExpansion(affiliate.affiliateId)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        {expandedAffiliates.has(affiliate.affiliateId) ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{affiliate.affiliateName}</p>
                        <p className="text-sm text-gray-500">ID: {affiliate.affiliateId}</p>
                      </div>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <p className="text-gray-500">Clicks</p>
                        <p className="font-medium">{affiliate.rawClicks} ({affiliate.uniqueClicks} unique)</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Conv. Rate</p>
                        <p className="font-medium">
                          {calculateConversionRate(affiliate.conversions, affiliate.uniqueClicks)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Revenue</p>
                        <p className="font-medium">{formatCurrency(affiliate.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Commission</p>
                        <p className="font-medium">{formatCurrency(affiliate.commission)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Subid breakdown for this affiliate */}
                  {expandedAffiliates.has(affiliate.affiliateId) && (
                    <div className="border-t bg-gray-50 p-4">
                      <h4 className="text-sm font-medium mb-3">SubID Breakdown</h4>
                      {affiliate.subidBreakdown && affiliate.subidBreakdown.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SubID</TableHead>
                              <TableHead>Raw Clicks</TableHead>
                              <TableHead>Unique Clicks</TableHead>
                              <TableHead>Conversions</TableHead>
                              <TableHead>Revenue</TableHead>
                              <TableHead>Commission</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {affiliate.subidBreakdown.map((subid) => (
                              <TableRow key={subid.subid}>
                                <TableCell>
                                  <Badge variant="outline">{subid.subid || "(no subid)"}</Badge>
                                </TableCell>
                                <TableCell>{subid.rawClicks}</TableCell>
                                <TableCell>{subid.uniqueClicks}</TableCell>
                                <TableCell>{subid.conversions}</TableCell>
                                <TableCell>{formatCurrency(subid.revenue)}</TableCell>
                                <TableCell>{formatCurrency(subid.commission)}</TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => loadClickLogs(affiliate.affiliateId, subid.subid)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Clicks
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-gray-500">No subid data available</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* SubID Breakdown Tab */}
        <TabsContent value="subids" className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4">All SubIDs Across Network</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>SubID</TableHead>
                  <TableHead>Raw Clicks</TableHead>
                  <TableHead>Unique Clicks</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Conv. Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {networkStats.affiliateBreakdown.flatMap((affiliate) =>
                  (affiliate.subidBreakdown || []).map((subid) => (
                    <TableRow key={`${affiliate.affiliateId}-${subid.subid}`}>
                      <TableCell>{affiliate.affiliateName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{subid.subid || "(no subid)"}</Badge>
                      </TableCell>
                      <TableCell>{subid.rawClicks}</TableCell>
                      <TableCell>{subid.uniqueClicks}</TableCell>
                      <TableCell>{subid.conversions}</TableCell>
                      <TableCell>{formatCurrency(subid.revenue)}</TableCell>
                      <TableCell>{formatCurrency(subid.commission)}</TableCell>
                      <TableCell>{calculateConversionRate(subid.conversions, subid.uniqueClicks)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Click Logs Tab */}
        <TabsContent value="clicks" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3>Recent Click Logs</h3>
              <div className="flex gap-2">
                <Select
                  value={selectedAffiliate}
                  onValueChange={(val) => {
                    setSelectedAffiliate(val);
                    if (val !== "all") {
                      loadClickLogs(val);
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select affiliate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Affiliates</SelectItem>
                    {networkStats.affiliateBreakdown.map((aff) => (
                      <SelectItem key={aff.affiliateId} value={aff.affiliateId}>
                        {aff.affiliateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Select an affiliate above to view detailed click logs
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Click Logs Dialog */}
      <Dialog open={clickLogsDialogOpen} onOpenChange={setClickLogsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Click Logs{selectedSubid && ` - SubID: ${selectedSubid}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>SubID</TableHead>
                  <TableHead>SubID 2-5</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Converted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clickLogs.map((click) => (
                  <TableRow key={click.clickId}>
                    <TableCell className="text-sm">{formatDateTime(click.timestamp)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{click.subid || "-"}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {[click.subid2, click.subid3, click.subid4, click.subid5]
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </TableCell>
                    <TableCell className="text-sm font-mono">{click.ip}</TableCell>
                    <TableCell className="text-sm truncate max-w-xs">{click.referrer}</TableCell>
                    <TableCell>
                      {click.converted ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {clickLogs.length === 0 && (
              <p className="text-center text-gray-500 py-8">No clicks found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
