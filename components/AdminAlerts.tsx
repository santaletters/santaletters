import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Bell, AlertCircle, CheckCircle, Trash2, Eye, ExternalLink } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface AdminAlert {
  id: string;
  type: string;
  orderId: string;
  relatedOrderId?: string;
  message: string;
  details: any;
  status: "unread" | "read";
  priority?: "low" | "medium" | "high";
  createdAt: string;
  readAt?: string;
}

interface AdminAlertsProps {
  onViewOrder?: (orderId: string) => void;
}

export function AdminAlerts({ onViewOrder }: AdminAlertsProps) {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("unread");

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-cf244566`;

  useEffect(() => {
    fetchAlerts();
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/alerts`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/alerts/${alertId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/alerts/read-all`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/alerts/${alertId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error("Error deleting alert:", error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "new_order_from_existing":
        return "🆕";
      case "order_updated":
        return "✏️";
      case "order_edited":
        return "📝";
      default:
        return "📢";
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 border-red-300 text-red-800";
      case "medium":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      default:
        return "bg-blue-100 border-blue-300 text-blue-800";
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "unread") return alert.status === "unread";
    return true;
  });

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-gray-600">Loading alerts...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl" style={{ fontWeight: "700" }}>Admin Alerts</h2>
            {unreadCount > 0 && (
              <Badge className="bg-red-600 text-white">
                {unreadCount} New
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter(filter === "all" ? "unread" : "all")}
            >
              {filter === "all" ? "Show Unread Only" : "Show All"}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAlerts}
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600">
            {filter === "unread" ? "No unread alerts! 🎉" : "No alerts yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-4 ${
                alert.status === "unread"
                  ? "border-2 border-green-500 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-3xl flex-shrink-0">
                  {getAlertIcon(alert.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg" style={{ fontWeight: "700" }}>
                          {alert.message}
                        </h3>
                        {alert.priority && (
                          <Badge className={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Order: #{alert.orderId.slice(-8)}
                        {alert.relatedOrderId && (
                          <> (Related: #{alert.relatedOrderId.slice(-8)})</>
                        )}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Details */}
                  {alert.details && (
                    <Alert className="mb-3 bg-white border-gray-200">
                      <AlertDescription>
                        <div className="space-y-1 text-sm">
                          {alert.details.childName && (
                            <p><strong>Child:</strong> {alert.details.childName}</p>
                          )}
                          {alert.details.packages && (
                            <p><strong>Packages:</strong> {alert.details.packages}</p>
                          )}
                          {alert.details.packagesAdded && (
                            <p><strong>Packages Added:</strong> {alert.details.packagesAdded}</p>
                          )}
                          {alert.details.amount !== undefined && (
                            <p><strong>Amount:</strong> ${alert.details.amount.toFixed(2)}</p>
                          )}
                          {alert.details.additionalAmount !== undefined && (
                            <p><strong>Additional Amount:</strong> ${alert.details.additionalAmount.toFixed(2)}</p>
                          )}
                          {alert.details.newTotal !== undefined && (
                            <p><strong>New Total:</strong> ${alert.details.newTotal.toFixed(2)}</p>
                          )}
                          {alert.details.totalPackages && (
                            <p><strong>Total Packages:</strong> {alert.details.totalPackages}</p>
                          )}
                          {alert.details.changes && Array.isArray(alert.details.changes) && (
                            <div>
                              <strong>Changes:</strong>
                              <ul className="ml-4 mt-1">
                                {alert.details.changes.map((change: string, idx: number) => (
                                  <li key={idx}>• {change}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {onViewOrder && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewOrder(alert.orderId)}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Order
                      </Button>
                    )}
                    {alert.status === "unread" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(alert.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Mark Read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteAlert(alert.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
