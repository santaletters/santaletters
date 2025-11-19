import { memo } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Eye, FileText, ShoppingCart, Package, CreditCard, DollarSign } from "lucide-react";

interface EventStats {
  eventType: string;
  count: number;
  conversionRate?: number;
}

interface EventReportingProps {
  eventStats: EventStats[];
  totalClicks: number;
}

const EVENT_ICONS: Record<string, any> = {
  page_view: Eye,
  form_fill: FileText,
  checkout_view: ShoppingCart,
  added_multiple_packages: Package,
  payment_submit: CreditCard,
  sale: DollarSign,
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "Page Views",
  form_fill: "Form Fills",
  checkout_view: "Checkout Views",
  added_multiple_packages: "Added Multiple Packages",
  payment_submit: "Payment Submits",
  sale: "Sales (Conversions)",
};

const EVENT_DESCRIPTIONS: Record<string, string> = {
  page_view: "Landing page visited",
  form_fill: "Letter information entered",
  checkout_view: "Reached checkout page",
  added_multiple_packages: "Added 2+ letter packages",
  payment_submit: "Started payment process",
  sale: "Completed purchase",
};

export const EventReporting = memo(function EventReporting({ eventStats, totalClicks }: EventReportingProps) {
  const getEventIcon = (eventType: string) => {
    const Icon = EVENT_ICONS[eventType];
    return Icon ? <Icon className="w-5 h-5" /> : null;
  };

  const getConversionRate = (count: number) => {
    if (totalClicks === 0) return "0.00";
    return ((count / totalClicks) * 100).toFixed(2);
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl mb-4">Event Funnel Breakdown</h3>
      <p className="text-gray-600 mb-4 text-sm">
        Track user progression through the conversion funnel. Each event represents a step toward a sale.
      </p>

      {/* Event Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {eventStats.map((stat) => (
          <Card key={stat.eventType} className="p-4 bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                {getEventIcon(stat.eventType)}
              </div>
              <Badge variant="outline" className="text-xs">
                {getConversionRate(stat.count)}% of clicks
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">{EVENT_LABELS[stat.eventType]}</p>
            <p className="text-3xl mb-1">{stat.count.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{EVENT_DESCRIPTIONS[stat.eventType]}</p>
          </Card>
        ))}
      </div>

      {/* Detailed Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Event</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">% of Clicks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventStats.map((stat) => (
              <TableRow key={stat.eventType}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="text-gray-600">{getEventIcon(stat.eventType)}</div>
                    <span>{EVENT_LABELS[stat.eventType]}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {EVENT_DESCRIPTIONS[stat.eventType]}
                </TableCell>
                <TableCell className="text-right">{stat.count.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="outline">{getConversionRate(stat.count)}%</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Funnel Visualization */}
      <div className="mt-6">
        <h4 className="text-sm mb-3">Conversion Funnel</h4>
        <div className="space-y-2">
          {eventStats
            .sort((a, b) => {
              const order = ["page_view", "form_fill", "checkout_view", "added_multiple_packages", "payment_submit", "sale"];
              return order.indexOf(a.eventType) - order.indexOf(b.eventType);
            })
            .map((stat, index) => {
              const percentage = parseFloat(getConversionRate(stat.count));
              return (
                <div key={stat.eventType} className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-gray-400">{index + 1}.</span>
                      {EVENT_LABELS[stat.eventType]}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end px-3 text-white text-sm transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      >
                        {stat.count > 0 && <span>{stat.count}</span>}
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm">{percentage}%</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </Card>
  );
});
