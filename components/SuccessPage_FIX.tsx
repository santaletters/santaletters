// REPLACEMENT for handleUpsellPaymentSuccess function
// Lines 507-542 in SuccessPage.tsx

  // Handle successful upsell payment
  const handleUpsellPaymentSuccess = async (paymentIntentId: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;

    try {
      // Confirm the upsell was added
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-cf244566/order/${accessToken}/confirm-upsell`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            paymentIntentId,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.isSubscription) {
          // Subscription-specific success message
          alert(`✅ Santa's Magical Journey Activated!

🎅 Subscription Details:
• ${data.quantity} ${data.quantity === 1 ? 'child' : 'children'} enrolled
• $${data.monthlyPrice.toFixed(2)}/month

💰 Billing:
• $0.00 charged today
• First billing: January 1st

🎁 2 FREE Bonus Gifts Included:
• Nice List Certificate
• Personalized Autographed Photo of Santa

A separate subscription order has been created. You can view it in your email confirmation!`);
        } else {
          // Regular upsell success message
          alert(`✅ ${data.upsellName} added to your order!\n\nQuantity: ${data.quantity}\nTotal: $${data.total.toFixed(2)}\n\nYou'll receive a confirmation email shortly.`);
        }
        
        // Reset state
        setUpsellClientSecret(null);
        setAddingUpsell(null);
        setIsProcessingUpsell(false);
        
        // Refresh order data
        await fetchOrderData();
      }
    } catch (error) {
      console.error('Error confirming upsell:', error);
    }
  };
