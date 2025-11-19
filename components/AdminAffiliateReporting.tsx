import { useState, useEffect, memo } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { 
  DollarSign, TrendingUp, Users, AlertTriangle, Eye, Calendar, 
  BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight, XCircle 
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface DailyReport {
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  refunds: number;
  chargebacks: number;
  declines: number;
}

interface HourlyReport {
  hour: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
}

interface OrderDetail {
  orderId: string;
  sessionId: string;
  affiliateId: string;
  affiliateName: string;
  customerEmail: string;
  packageCount: number;
  total: number;
  commission: number;
  status: "completed" | "refunded" | "chargeback" | "declined";
  orderDate: string;
  subIds: Record<string, string>;
}

interface ChargebackAlert {
  chargebackId: string;
  orderId: string;
  sessionId: string;
  affiliateId: string;
  affiliateName: string;
  amount: number;
  commission: number;
  reason: string;
  stripeChargeId: string;
  chargebackDate: string;
  orderDate: string;
  status: "pending" | "won" | "lost";
}

interface AffiliateReportingProps {
  affiliateId?: string; // If provided, show data for specific affiliate
  showAllAffiliates?: boolean;
}

export const AdminAffiliateReporting = memo(function AdminAffiliateReporting({ affiliateId, showAllAffiliates = false }: AffiliateReportingProps) {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days");
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>(affiliateId || "all");
  
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [hourlyReports, setHourlyReports] = useState<HourlyReport[]>([]);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [chargebacks, setChargebacks] = useState<ChargebackAlert[]>([]);
  
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  
  const [affiliates, setAffiliates] = useState<Array<{ id: string; name: string }>>([]);
  
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalRefunds: 0,
    totalChargebacks: 0,
    totalDeclines: 0,
    netRevenue: 0,
  });

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566`;

  useEffect(() => {
    loadData();
  }, [dateRange, selectedAffiliate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load affiliates list if showing all
      if (showAllAffiliates) {
        const affiliatesResponse = await fetch(`${API_URL}/affiliates`, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        
        if (affiliatesResponse.ok) {
          const data = await affiliatesResponse.json();
          setAffiliates(data.affiliates.map((a: any) => ({
            id: a.affiliateId,
            name: a.affiliateName
          })));
        }
      }

      // Load reporting data
      const params = new URLSearchParams({
        dateRange,
        ...(selectedAffiliate !== "all" && { affiliateId: selectedAffiliate }),
      });

      const reportResponse = await fetch(`${API_URL}/admin/affiliate-reports?${params}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });

      if (reportResponse.ok) {
        const data = await reportResponse.json();
        setDailyReports(data.dailyReports || []);
        setHourlyReports(data.hourlyReports || []);
        setOrders(data.orders || []);
        setChargebacks(data.chargebacks || []);
        setTotalStats(data.totalStats || {
          totalRevenue: 0,
          totalCommission: 0,
          totalRefunds: 0,
          totalChargebacks: 0,
          totalDeclines: 0,
          netRevenue: 0,
        });
      }
    } catch (error) {
      console.error("Error loading affiliate reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = (order: OrderDetail) => {
    setSelectedOrder(order);
    setOrderDetailOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      completed: { label: "Completed", className: "bg-green-100 text-green-800" },
      refunded: { label: "Refunded", className: "bg-yellow-100 text-yellow-800" },
      chargeback: { label: "Chargeback", className: "bg-red-100 text-red-800" },
      declined: { label: "Declined", className: "bg-gray-100 text-gray-800" },
    };
    
    const variant = variants[status] || variants.completed;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getChargebackStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
      won: { label: "Won", className: "bg-green-100 text-green-800" },
      lost: { label: "Lost", className: "bg-red-100 text-red-800" },
    };
    
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="thismonth">This Month</SelectItem>
              <SelectItem value="lastmonth">Last Month</SelectItem>
            </SelectContent>
          </Select>

          {showAllAffiliates && (
            <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Affiliates</SelectItem>
                {affiliates.map((aff) => (
                  <SelectItem key={aff.id} value={aff.id}>
                    {aff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button onClick={loadData} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalStats.totalRevenue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commission</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalStats.totalCommission)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Refunds</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(totalStats.totalRefunds)}
              </p>
            </div>
            <ArrowDownRight className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Chargebacks</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalStats.totalChargebacks)}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Declines</p>
              <p className="text-2xl font-bold text-gray-600">
                {formatCurrency(totalStats.totalDeclines)}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-gray-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Revenue</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalStats.netRevenue)}
              </p>
            </div>
            <ArrowUpRight className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Tabs for different report views */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily Reports</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Reports</TabsTrigger>
          <TabsTrigger value="orders">Order Details</TabsTrigger>
          <TabsTrigger value="chargebacks">
            Chargebacks
            {chargebacks.length > 0 && (
              <Badge className="ml-2 bg-red-600">{chargebacks.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Daily Reports */}
        <TabsContent value="daily">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Performance</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Refunds</TableHead>
                    <TableHead className="text-right">Chargebacks</TableHead>
                    <TableHead className="text-right">Declines</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No data available for selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    dailyReports.map((report) => (
                      <TableRow key={report.date}>
                        <TableCell>{formatDate(report.date)}</TableCell>
                        <TableCell className="text-right">{report.clicks}</TableCell>
                        <TableCell className="text-right">{report.conversions}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.commission)}</TableCell>
                        <TableCell className="text-right">{report.refunds}</TableCell>
                        <TableCell className="text-right">{report.chargebacks}</TableCell>
                        <TableCell className="text-right">{report.declines}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Hourly Reports */}
        <TabsContent value="hourly">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Hourly Performance (Last 24 Hours)</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hour</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hourlyReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No hourly data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    hourlyReports.map((report) => (
                      <TableRow key={report.hour}>
                        <TableCell>{report.hour}</TableCell>
                        <TableCell className="text-right">{report.clicks}</TableCell>
                        <TableCell className="text-right">{report.conversions}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.commission)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Order Details */}
        <TabsContent value="orders">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Order Details</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Packages</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-mono text-sm">
                          {order.sessionId.slice(-8)}
                        </TableCell>
                        <TableCell>{order.affiliateName}</TableCell>
                        <TableCell>{order.customerEmail}</TableCell>
                        <TableCell className="text-right">{order.packageCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(order.commission)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{formatDate(order.orderDate)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewOrderDetails(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Chargebacks */}
        <TabsContent value="chargebacks">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Chargeback Alerts
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chargeback ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Commission Lost</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chargebacks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No chargebacks
                      </TableCell>
                    </TableRow>
                  ) : (
                    chargebacks.map((chargeback) => (
                      <TableRow key={chargeback.chargebackId} className="bg-red-50">
                        <TableCell className="font-mono text-sm">
                          {chargeback.chargebackId.slice(-8)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {chargeback.sessionId.slice(-8)}
                        </TableCell>
                        <TableCell>{chargeback.affiliateName}</TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(chargeback.amount)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          -{formatCurrency(chargeback.commission)}
                        </TableCell>
                        <TableCell>{chargeback.reason}</TableCell>
                        <TableCell>{getChargebackStatusBadge(chargeback.status)}</TableCell>
                        <TableCell>{formatDate(chargeback.chargebackDate)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Detail Modal */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-mono">{selectedOrder.sessionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Affiliate</p>
                  <p className="font-semibold">{selectedOrder.affiliateName}</p>
                  <p className="text-sm text-gray-500 font-mono">{selectedOrder.affiliateId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p>{formatDateTime(selectedOrder.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer Email</p>
                  <p>{selectedOrder.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Packages</p>
                  <p>{selectedOrder.packageCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-lg font-semibold">{formatCurrency(selectedOrder.total)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Commission</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {formatCurrency(selectedOrder.commission)}
                  </p>
                </div>
              </div>

              {Object.keys(selectedOrder.subIds).length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tracking Sub IDs</p>
                  <div className="bg-gray-50 p-3 rounded-md space-y-1">
                    {Object.entries(selectedOrder.subIds).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Badge variant="outline">{key}</Badge>
                        <span className="text-sm font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});
