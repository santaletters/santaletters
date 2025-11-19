import { useState, memo } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DollarSign, FileText, CheckCircle, Clock, Download, Plus, CreditCard, Trash2 } from "lucide-react";

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

interface AffiliatePaymentsProps {
  invoices: Invoice[];
  openBalance: number;
  prepaidCredit?: number;
  isAdmin?: boolean;
  affiliateId?: string;
  onGenerateInvoice?: () => void;
  onRecordPayment?: (invoiceId: string, amount: number) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

export const AffiliatePayments = memo(function AffiliatePayments({ 
  invoices, 
  openBalance, 
  prepaidCredit = 0, 
  isAdmin = false, 
  affiliateId,
  onGenerateInvoice,
  onRecordPayment,
  onDeleteInvoice
}: AffiliatePaymentsProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalOwed = invoices.reduce((sum, inv) => sum + inv.amountOwed, 0);
  const lifetimeEarnings = totalPaid + totalOwed;

  const handleRecordPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    onRecordPayment?.(selectedInvoice.invoiceId, amount);
    setPaymentDialogOpen(false);
    setPaymentAmount("");
    setSelectedInvoice(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-600 text-white"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "partial":
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700">Total Paid</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl text-green-900">${totalPaid.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1">Successfully paid out</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-yellow-700">Open Balance</p>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl text-yellow-900">${openBalance.toFixed(2)}</p>
          <p className="text-xs text-yellow-600 mt-1">Pending payment</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-blue-700">Lifetime Earnings</p>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl text-blue-900">${lifetimeEarnings.toFixed(2)}</p>
          <p className="text-xs text-blue-600 mt-1">Total commission earned</p>
        </Card>

        {prepaidCredit > 0 && (
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-purple-700">Prepaid Credit</p>
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl text-purple-900">${prepaidCredit.toFixed(2)}</p>
            <p className="text-xs text-purple-600 mt-1">Available credit balance</p>
          </Card>
        )}
      </div>

      {/* Invoices Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl">Payment Invoices</h3>
          <div className="flex gap-2">
            {isAdmin && onGenerateInvoice && (
              <Button onClick={onGenerateInvoice} size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No invoices yet</p>
            <p className="text-sm">Invoices will appear here once you generate commissions</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Total Commission</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Amount Owed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.invoiceId}>
                    <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </TableCell>
                    <TableCell>${invoice.totalCommission.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">
                      ${invoice.amountPaid.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-yellow-600">
                      ${invoice.amountOwed.toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-sm">{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isAdmin && invoice.status !== "paid" && onRecordPayment && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setPaymentAmount(invoice.amountOwed.toString());
                              setPaymentDialogOpen(true);
                            }}
                          >
                            Record Payment
                          </Button>
                        )}
                        {isAdmin && onDeleteInvoice && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
                                onDeleteInvoice(invoice.invoiceId);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Record Payment Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Record a payment for invoice {selectedInvoice?.invoiceNumber}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Invoice Amount Owed</Label>
                    <p className="text-2xl mt-2">${selectedInvoice?.amountOwed.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Payment Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 You can pay more than the owed amount. Any overpayment will be tracked as prepaid credit.
                    </p>
                  </div>
                  {parseFloat(paymentAmount) > (selectedInvoice?.amountOwed || 0) && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-sm text-purple-700">
                        <strong>Overpayment:</strong> ${(parseFloat(paymentAmount) - (selectedInvoice?.amountOwed || 0)).toFixed(2)} will be added as prepaid credit
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={handleRecordPayment} className="flex-1">
                      Record Payment
                    </Button>
                    <Button onClick={() => {
                      setPaymentDialogOpen(false);
                      setPaymentAmount("");
                      setSelectedInvoice(null);
                    }} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </Card>

      {/* Payment Terms */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="text-sm mb-2">Payment Terms</h4>
        <div className="space-y-1 text-sm text-gray-700">
          <p>• Payments are processed on the 1st and 15th of each month</p>
          <p>• Minimum payout threshold: $50.00</p>
          <p>• Commissions are paid 30 days after the sale date</p>
          <p>• All payments are made via bank transfer or PayPal</p>
        </div>
      </Card>
    </div>
  );
});
