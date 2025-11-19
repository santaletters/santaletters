import { useState } from 'react';
import { Route, Switch } from 'wouter';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Toaster } from './components/ui/sonner';
import { HelmetProvider } from 'react-helmet-async';
import { HomePage } from './components/HomePage';
import { SalesPage } from './components/SalesPage';
import { LetterForm } from './components/LetterForm';
import { Checkout } from './components/Checkout';
import { SuccessPage } from './components/SuccessPage';
import { UpsellOffer } from './components/UpsellOffer';
import { SnowUpsell } from './components/SnowUpsell';
import { SnowDownsell } from './components/SnowDownsell';
import { AcceptDownsell } from './components/AcceptDownsell';
import { AddAnotherChild } from './components/AddAnotherChild';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { AffiliateAuth } from './components/AffiliateAuth';
import { AffiliateDashboard } from './components/AffiliateDashboard';
import { UpdatePaymentMethod } from './components/UpdatePaymentMethod';
import { SubscriptionLetterManager } from './components/SubscriptionLetterManager';
import { ContactUs } from './components/ContactUs';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsAndConditions } from './components/TermsAndConditions';
import { TrackdeskPixel } from './components/TrackdeskPixel';
import { CustomHead } from './components/CustomHead';
import type { CartItem } from './components/CartDrawer';

// Initialize Stripe - Using the live publishable key
const stripePromise = loadStripe('pk_live_51QNq5EBo0vvJFmHAqMRR7L9RjBdCJUwmWDy24ZLKlrYWzLDtKFRWKFGrO29qJKUAewzAwZbF6kj1hRdsgmGnBbXB00JqQEBU97');

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'deluxe' | 'premium' | null>(null);

  const handleSelectPackage = (packageType: 'basic' | 'deluxe' | 'premium') => {
    setSelectedPackage(packageType);
    window.location.href = '/letter-form';
  };

  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => [...prev, item]);
  };

  const handleUpdateCartQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
    } else {
      setCartItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    window.location.href = '/checkout';
  };

  const handleOrderNow = () => {
    window.location.href = '/letter-form';
  };

  return (
    <HelmetProvider>
      <Elements stripe={stripePromise}>
        <div className="min-h-screen">
          <CustomHead />
          <TrackdeskPixel />
          <Toaster position="top-center" />
          
          <Switch>
            {/* Homepage - Ecommerce with 3 package tiers */}
            <Route path="/">
              <HomePage
                onSelectPackage={handleSelectPackage}
                cartItems={cartItems}
                onAddToCart={handleAddToCart}
                onUpdateCartQuantity={handleUpdateCartQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                onCheckout={handleCheckout}
              />
            </Route>

            {/* Sales Funnel - Original high-converting funnel at /offer */}
            <Route path="/offer">
              <SalesPage onOrderNow={handleOrderNow} />
            </Route>

            {/* Letter Form */}
            <Route path="/letter-form">
              <LetterForm />
            </Route>

            {/* Checkout */}
            <Route path="/checkout">
              <Checkout cartItems={cartItems} />
            </Route>

            {/* Success Page */}
            <Route path="/success">
              <SuccessPage />
            </Route>

            {/* Upsell Flow */}
            <Route path="/upsell">
              <UpsellOffer />
            </Route>

            <Route path="/snow-upsell">
              <SnowUpsell />
            </Route>

            <Route path="/snow-downsell">
              <SnowDownsell />
            </Route>

            <Route path="/accept-downsell">
              <AcceptDownsell />
            </Route>

            <Route path="/add-another-child">
              <AddAnotherChild />
            </Route>

            {/* Admin */}
            <Route path="/admin/login">
              <AdminLogin />
            </Route>

            <Route path="/admin">
              <AdminDashboard />
            </Route>

            {/* Affiliate */}
            <Route path="/affiliate/login">
              <AffiliateAuth />
            </Route>

            <Route path="/affiliate">
              <AffiliateDashboard />
            </Route>

            {/* Subscription Management */}
            <Route path="/update-payment">
              <UpdatePaymentMethod />
            </Route>

            <Route path="/manage-subscription">
              <SubscriptionLetterManager />
            </Route>

            {/* Legal Pages */}
            <Route path="/contact">
              <ContactUs />
            </Route>

            <Route path="/privacy">
              <PrivacyPolicy />
            </Route>

            <Route path="/terms">
              <TermsAndConditions />
            </Route>

            {/* 404 Fallback */}
            <Route>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl mb-4">404 - Page Not Found</h1>
                  <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                  <a href="/" className="text-red-600 hover:text-red-700 underline">Go back home</a>
                </div>
              </div>
            </Route>
          </Switch>
        </div>
      </Elements>
    </HelmetProvider>
  );
}
