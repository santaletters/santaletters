// Temporary file with corrected functions

// Fixed bulkImportTracking function
export const bulkImportTracking_FIXED = `
  // Bulk import tracking
  const bulkImportTracking = async () => {
    const lines = bulkTrackingData.split("\\n").filter((line) => line.trim());
    
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
      alert("✅ Bulk Import Complete!\\n\\n" + lines.length + " tracking numbers imported successfully!");
    } catch (error) {
      console.error("Error bulk importing:", error);
      alert("Error bulk importing tracking numbers. Check console for details.");
    }
  };
`;

// The confirmCancelSubscription function (lines 1324-1359) should be DELETED entirely
// as it's a duplicate of handleCancelSubscription which already exists at line 607

// Fixed handleResendEmail function
export const handleResendEmail_FIXED = `
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
      alert(\`✅ Email Resent Successfully!\\n\\nType: \${emailType}\\nRecipient: \${result.recipient}\\nEmail ID: \${result.emailId}\`);
      
      // Refresh orders to show updated activity log
      await fetchOrders();
    } catch (error: any) {
      console.error("Error resending email:", error);
      alert(\`Error resending email: \${error.message}\`);
    }
  };
`;

// Fixed saveOrderEdit function (lines 1400-1436)
export const saveOrderEdit_FIXED = `
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
      alert("✅ Order Updated!\\n\\nChanges saved and customer has been notified via email.");
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order. Check console for details.");
    }
  };
`;

// Fixed saveCustomerInfoEdit function (lines 1450-1487)
export const saveCustomerInfoEdit_FIXED = `
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
      alert("✅ Customer Info Updated!\\n\\nChanges have been saved.");
    } catch (error) {
      console.error("Error updating customer info:", error);
      alert("Error updating customer info. Check console for details.");
    }
  };
`;
