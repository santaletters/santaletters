import React from 'react';

export function Footer() {
  const handleTestUpsellClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Prompt for order token
    const token = prompt('Enter order token (from the success page URL):');
    if (!token) return;
    
    // Clear any existing upsell session data
    sessionStorage.removeItem(`upsells_shown_${token}`);
    
    // Navigate to success page with upsell parameters
    window.location.href = `/success?token=${token}&fromCheckout=true`;
  };

  return (
    <div className="bg-gray-100 py-16 text-center text-sm text-gray-600">
      <p className="mb-2">Customer Support 7 Days A Week: 9am to 7pm EST</p>
      <p className="mb-2">
        <a href="mailto:hello@santascertifiedletter.com" className="text-blue-600 hover:underline">
          hello@santascertifiedletter.com
        </a>
        {" | "}
        <a href="tel:+18005407716" className="text-blue-600 hover:underline">
          (800) 540-7716
        </a>
      </p>
      <p className="mb-2">
        <a href="/contact" className="text-blue-600 hover:underline">
          Contact Us
        </a>
        {" | "}
        <a href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
        {" | "}
        <a href="/terms" className="text-blue-600 hover:underline">
          Terms & Conditions
        </a>
      </p>
      <p className="mb-4">Santa's Certified Letter © 2025</p>
      
      {/* Debug & Admin Links */}
      <div className="mt-4 space-x-3">
        <a 
          href="/affiliates"
          className="text-gray-400 hover:text-gray-600 text-xs underline"
        >
          Affiliate Partners
        </a>
        <span className="text-gray-300">|</span>
        <a 
          href="#"
          onClick={handleTestUpsellClick}
          className="text-gray-400 hover:text-gray-600 text-xs underline"
          title="Test upsell flow with an existing order"
        >
          🔧 Test Upsells
        </a>
      </div>
    </div>
  );
}
