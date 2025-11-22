import { useState, useEffect, lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { CustomHead } from "./components/CustomHead";
import { HomePage } from "./components/HomePage";
import { SalesPage } from "./components/SalesPage";
import { LetterForm, type LetterPackage } from "./components/LetterForm";
import { Checkout } from "./components/Checkout";
import { UpdatePaymentMethod } from "./components/UpdatePaymentMethod";
import { SnowUpsell } from "./components/SnowUpsell";
import { SnowDownsell } from "./components/SnowDownsell";
import { TrackdeskPixel } from "./components/TrackdeskPixel";
import { TrackdeskDebug } from "./components/TrackdeskDebug";
import { projectId, publicAnonKey } from "./utils/supabase/info";
import type { CartItem } from "./components/CartDrawer";

// Lazy load less frequently used components for better performance
const SuccessPage = lazy(() => import("./components/SuccessPage").then(m => ({ default: m.SuccessPage })));
const AdminDashboard = lazy(() => import("./components/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AffiliateDashboard = lazy(() => import("./components/AffiliateDashboard").then(m => ({ default: m.AffiliateDashboard })));
const AdminAffiliateManagement = lazy(() => import("./components/AdminAffiliateManagementEnhanced").then(m => ({ default: m.AdminAffiliateManagement })));
const AffiliateAuth = lazy(() => import("./components/AffiliateAuth").then(m => ({ default: m.AffiliateAuth })));
const AdminLogin = lazy(() => import("./components/AdminLogin").then(m => ({ default: m.AdminLogin })));
const AcceptDownsell = lazy(() => import("./components/AcceptDownsell").then(m => ({ default: m.AcceptDownsell })));
const UpsellManagement = lazy(() => import("./components/UpsellManagement").then(m => ({ default: m.UpsellManagement })));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const TermsAndConditions = lazy(() => import("./components/TermsAndConditions").then(m => ({ default: m.TermsAndConditions })));
const ContactUs = lazy(() => import("./components/ContactUs").then(m => ({ default: m.ContactUs })));
const UpsellOffer = lazy(() => import("./components/UpsellOffer").then(m => ({ default: m.UpsellOffer })));

console.log("🎅 App.tsx loaded successfully - VERSION 3.0");
console.log("🌐 Current URL:", window.location.href);
console.log("📍 Current path:", window.location.pathname);

type Step = "home" | "sales" | "form" | "checkout" | "success" | "admin" | "adminlogin" | "affiliate" | "affiliatemanage" | "affiliateauth" | "downsell" | "updatepayment" | "upsellmanage" | "privacy" | "terms" | "contact" | "snowupsell" | "snowdownsell" | "subscriptionupsell";

const STORAGE_KEY = "santaLetterData";

export default function App() {
  const [currentStep, setCurrentStep] = useState<Step>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    
    console.log("🔍 Checking initial route...");
    console.log("  - Path:", path);
    console.log("  - Search params:", urlParams.toString());
    
    // Admin routes
    if (path === '/admin' || urlParams.get('page') === 'admin') {
      console.log("  → Routing to admin dashboard");
      return 'admin';
    }
    if (path === '/admin/login' || urlParams.get('page') === 'adminlogin') {
      console.log("  → Routing to admin login");
      return 'adminlogin';
    }
    if (path === '/admin/affiliates' || urlParams.get('page') === 'affiliatemanage') {
      console.log("  → Routing to affiliate management");
      return 'affiliatemanage';
    }
    if (path === '/admin/upsells' || urlParams.get('page') === 'upsellmanage') {
      console.log("  → Routing to upsell management");
      return 'upsellmanage';
    }
    
    // Affiliate routes
    if (path === '/affiliate' || urlParams.get('page') === 'affiliate') {
      console.log("  → Routing to affiliate dashboard");
      return 'affiliate';
    }
    if (path === '/affiliate/login' || urlParams.get('page') === 'affiliateauth') {
      console.log("  → Routing to affiliate auth");
      return 'affiliateauth';
    }
    
    // Payment update route
    if (path === '/update-payment' || urlParams.get('update') === 'payment') {
      console.log("  → Routing to payment update");
      return 'updatepayment';
    }
    
    // Legal routes
    if (path === '/privacy' || urlParams.get('page') === 'privacy') {
      console.log("  → Routing to privacy policy");
      return 'privacy';
    }
    if (path === '/terms' || urlParams.get('page') === 'terms') {
      console.log("  → Routing to terms and conditions");
      return 'terms';
    }
    if (path === '/contact' || urlParams.get('page') === 'contact') {
      console.log("  → Routing to contact us");
      return 'contact';
    }
    
    // Downsell route
    if (path === '/downsell' || urlParams.get('downsell')) {
      console.log("  → Routing to downsell page");
      return 'downsell';
    }
    
    // Success page route (check for order token)
    if (urlParams.get('token')) {
      console.log("  → Routing to success page (found order token)");
      return 'success';
    }
    
    // Funnel route - /offer goes to single-page funnel
    if (path === '/offer' || urlParams.get('funnel') === 'true') {
      console.log("  → Routing to sales funnel");
      return 'sales';
    }
    
    // Default to home page
    console.log("  → Routing to home page (default)");
    return 'home';
  });

  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'deluxe' | 'premium' | 'funnel' | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.selectedPackage || null;
      } catch (e) {
        console.error("Error parsing saved data:", e);
        return null;
      }
    }
    return null;
  });

  const [formData, setFormData] = useState<any>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        return data.formData || {};
      } catch (e) {
        console.error("Error parsing saved data:", e);
        return {};
      }
    }
    return {};
  });

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentOrderToken, setCurrentOrderToken] = useState<string | null>(null);
  const [subscriptionAcceptedDuringCheckout, setSubscriptionAcceptedDuringCheckout] = useState(false);
  const [numberOfLetters, setNumberOfLetters] = useState(1);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (selectedPackage || Object.keys(formData).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedPackage,
        formData
      }));
    }
  }, [selectedPackage, formData]);

  // Update URL when step changes (for better UX and bookmarking)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Preserve important params
    const token = urlParams.get('token');
    const affiliateId = urlParams.get('aid');
    const downsellToken = urlParams.get('downsell');
    const updatePayment = urlParams.get('update');
    const ref = urlParams.get('ref'); // Affiliate tracking
    const campaign = urlParams.get('campaign'); // Affiliate campaign
    const affS1 = urlParams.get('affS1'); // SubID 1
    const affS2 = urlParams.get('affS2'); // SubID 2
    const affS3 = urlParams.get('affS3'); // SubID 3
    
    let newUrl = window.location.pathname;
    const params = new URLSearchParams();
    
    // Preserve affiliate ID across navigation
    if (affiliateId) {
      params.set('aid', affiliateId);
    }
    
    // Preserve affiliate tracking params (ref and campaign)
    if (ref) {
      params.set('ref', ref);
    }
    if (campaign) {
      params.set('campaign', campaign);
    }
    
    // Preserve subids across navigation
    if (affS1) {
      params.set('affS1', affS1);
    }
    if (affS2) {
      params.set('affS2', affS2);
    }
    if (affS3) {
      params.set('affS3', affS3);
    }
    
    // Special handling for routes
    if (currentStep === 'admin') {
      newUrl = '/admin';
    } else if (currentStep === 'adminlogin') {
      newUrl = '/admin/login';
    } else if (currentStep === 'affiliatemanage') {
      newUrl = '/admin/affiliates';
    } else if (currentStep === 'upsellmanage') {
      newUrl = '/admin/upsells';
    } else if (currentStep === 'affiliate') {
      newUrl = '/affiliate';
    } else if (currentStep === 'affiliateauth') {
      newUrl = '/affiliate/login';
    } else if (currentStep === 'updatepayment' && updatePayment) {
      newUrl = '/update-payment';
      params.set('update', updatePayment);
    } else if (currentStep === 'privacy') {
      newUrl = '/privacy';
    } else if (currentStep === 'terms') {
      newUrl = '/terms';
    } else if (currentStep === 'contact') {
      newUrl = '/contact';
    } else if (currentStep === 'downsell' && downsellToken) {
      newUrl = '/downsell';
      params.set('downsell', downsellToken);
    } else if (currentStep === 'success' && token) {
      newUrl = '/';
      params.set('token', token);
    } else if (currentStep === 'sales') {
      newUrl = '/offer';
    } else if (currentStep === 'home') {
      newUrl = '/';
    }
    
    const queryString = params.toString();
    const fullUrl = queryString ? `${newUrl}?${queryString}` : newUrl;
    
    if (window.location.pathname + window.location.search !== fullUrl) {
      window.history.pushState({}, '', fullUrl);
      console.log("📍 URL updated to:", fullUrl);
    }
  }, [currentStep]);

  const handleSelectPackage = (packageType?: 'basic' | 'deluxe' | 'premium') => {
    console.log("📦 Package selected:", packageType || 'funnel (no type)');
    setSelectedPackage(packageType || 'funnel');
    setCurrentStep("form");
  };

  const handleFormComplete = (data: any) => {
    console.log("✍️ Form completed:", data);
    // Clear scrollToPackage flag when moving to checkout
    const cleanedData = { ...data };
    delete cleanedData.scrollToPackage;
    setFormData(cleanedData);
    setCurrentStep("checkout");
  };

  const handleCheckoutSuccess = (orderToken: string, subscriptionAccepted: boolean) => {
    console.log("💳 Checkout successful! Order token:", orderToken, "Subscription accepted:", subscriptionAccepted);
    setCurrentOrderToken(orderToken);
    setSubscriptionAcceptedDuringCheckout(subscriptionAccepted);
    
    // Store number of letters for quantity default
    const letterCount = formData?.packages?.length || 1;
    setNumberOfLetters(letterCount);
    
    // Route to first upsell: Certified North Pole Snow
    setCurrentStep("snowupsell");
    
    // Clear saved form data (but keep order token for upsells)
    localStorage.removeItem(STORAGE_KEY);
    setSelectedPackage(null);
    setFormData({});
  };

  const handleReturnHome = () => {
    console.log("🏠 Returning to home page");
    setCurrentStep("home");
    setSelectedPackage(null);
    setFormData({});
    setCartItems([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleBackFromForm = () => {
    console.log("⬅️ Going back from form");
    // Check if we came from the funnel or homepage
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('funnel') === 'true' || window.location.pathname === '/offer') {
      setCurrentStep("sales");
    } else {
      setCurrentStep("home");
    }
  };

  const handleBackFromCheckout = () => {
    console.log("⬅️ Going back from checkout");
    // Clear scrollToPackage flag when going back
    if (formData?.scrollToPackage !== undefined) {
      const cleanedData = { ...formData };
      delete cleanedData.scrollToPackage;
      setFormData(cleanedData);
    }
    setCurrentStep("form");
  };

  const handleAddAnotherLetter = () => {
    console.log("➕ Adding another letter");
    
    // Add a new empty package to formData
    if (formData?.packages) {
      const newPackage = {
        childFirstName: "",
        childLastName: "",
        friendName: "",
        streetAddress: "",
        unitApt: "",
        city: "",
        state: "",
        zipCode: "",
        packageType: selectedPackage === 'funnel' ? undefined : selectedPackage,
        packageName: selectedPackage === 'funnel' ? undefined : (selectedPackage === 'basic' ? 'Silver Edition' : selectedPackage === 'deluxe' ? 'Gold Edition' : 'Platinum Edition')
      };
      
      setFormData({
        ...formData,
        packages: [...formData.packages, newPackage],
        scrollToPackage: formData.packages.length // Index of the new package
      });
    }
    
    setCurrentStep("form");
  };

  const handleEditPackage = (packageIndex: number) => {
    console.log("✏️ Editing package:", packageIndex);
    setCurrentStep("form");
    // Could pass scrollToPackage here if needed
  };

  const handleDeletePackage = (packageIndex: number) => {
    console.log("🗑️ Deleting package:", packageIndex);
    if (formData?.packages) {
      const updatedPackages = formData.packages.filter((_: any, idx: number) => idx !== packageIndex);
      setFormData({ packages: updatedPackages });
    }
  };

  const handleBackFromAdminDashboard = () => {
    console.log("⬅️ Logging out of admin");
    setCurrentStep("adminlogin");
  };

  const handleBackFromAffiliateDashboard = () => {
    console.log("⬅️ Logging out of affiliate");
    setCurrentStep("affiliateauth");
  };

  const handleBackFromSupportPages = () => {
    console.log("⬅️ Going back from support page");
    setCurrentStep("home");
  };

  // Upsell funnel handlers
  const handleSnowUpsellAccept = () => {
    console.log("✅ Snow upsell accepted - moving to next upsell");
    console.log("🔍 subscriptionAcceptedDuringCheckout:", subscriptionAcceptedDuringCheckout);
    // If subscription was already accepted during checkout, skip to success
    if (subscriptionAcceptedDuringCheckout) {
      console.log("⏭️ Subscription was accepted during checkout - skipping to success");
      setCurrentStep("success");
    } else {
      console.log("📋 No subscription accepted yet - showing subscription upsell");
      setCurrentStep("subscriptionupsell");
    }
  };

  const handleSnowUpsellDecline = () => {
    console.log("❌ Snow upsell declined - showing downsell");
    setCurrentStep("snowdownsell");
  };

  const handleSnowUpsellTimeout = () => {
    console.log("⏰ Snow upsell timed out - completing funnel");
    // When timer expires, complete the entire funnel (user had their chance)
    setCurrentStep("success");
  };

  const handleSnowDownsellAccept = () => {
    console.log("✅ Snow downsell accepted - moving to next upsell");
    console.log("🔍 subscriptionAcceptedDuringCheckout:", subscriptionAcceptedDuringCheckout);
    // If subscription was already accepted during checkout, skip to success
    if (subscriptionAcceptedDuringCheckout) {
      console.log("⏭️ Subscription was accepted during checkout - skipping to success");
      setCurrentStep("success");
    } else {
      console.log("📋 No subscription accepted yet - showing subscription upsell");
      setCurrentStep("subscriptionupsell");
    }
  };

  const handleSnowDownsellDecline = () => {
    console.log("❌ Snow downsell declined - moving to next upsell");
    console.log("🔍 subscriptionAcceptedDuringCheckout:", subscriptionAcceptedDuringCheckout);
    // If subscription was already accepted during checkout, skip to success
    if (subscriptionAcceptedDuringCheckout) {
      console.log("⏭️ Subscription was accepted during checkout - skipping to success");
      setCurrentStep("success");
    } else {
      console.log("📋 No subscription accepted yet - showing subscription upsell");
      setCurrentStep("subscriptionupsell");
    }
  };

  const handleSnowDownsellTimeout = () => {
    console.log("⏰ Snow downsell timed out - completing funnel");
    // When timer expires, complete the entire funnel (user had their chance)
    setCurrentStep("success");
  };

  const handleSubscriptionUpsellComplete = () => {
    console.log("✅ Subscription upsell complete - going to success");
    setCurrentStep("success");
  };

  // Cart management
  const handleAddToCart = (item: CartItem) => {
    console.log("🛒 Adding to cart:", item);
    setCartItems(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        const newItems = [...prev];
        newItems[existingIndex].quantity += item.quantity;
        return newItems;
      }
      return [...prev, item];
    });
  };

  const handleUpdateCartQuantity = (id: string, quantity: number) => {
    console.log("🔢 Updating cart quantity:", id, quantity);
    setCartItems(prev => 
      prev.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  const handleRemoveFromCart = (id: string) => {
    console.log("❌ Removing from cart:", id);
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    console.log("🛒 Proceeding to checkout with cart:", cartItems);
    
    // Convert cart items to legacy format for checkout
    if (cartItems.length > 0) {
      // Use the first item's package type
      const firstItem = cartItems[0];
      setSelectedPackage(firstItem.packageType);
      
      // Store cart in form data
      setFormData({ cartItems });
      
      setCurrentStep("form");
    }
  };

  // Loading screen component for lazy-loaded routes
  const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-green-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );

  return (
    <HelmetProvider>
      <CustomHead />
      <div className="min-h-screen">
        {/* Trackdesk Click Tracking - Loads on every page */}
        <TrackdeskPixel />
        <TrackdeskDebug />
        
        {currentStep === "home" && (
          <HomePage
            onSelectPackage={handleSelectPackage}
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onCheckout={handleCheckout}
          />
        )}
        
        {currentStep === "sales" && (
          <SalesPage
            onOrderNow={() => handleSelectPackage()} 
          />
        )}

        {currentStep === "form" && selectedPackage && (
          <LetterForm
            initialPackages={formData?.packages || [{
              childFirstName: "",
              childLastName: "",
              friendName: "",
              streetAddress: "",
              unitApt: "",
              city: "",
              state: "",
              zipCode: "",
              packageType: selectedPackage === 'funnel' ? undefined : selectedPackage,
              packageName: selectedPackage === 'funnel' ? undefined : (selectedPackage === 'basic' ? 'Silver Edition' : selectedPackage === 'deluxe' ? 'Gold Edition' : 'Platinum Edition')
            }]}
            scrollToPackage={formData?.scrollToPackage}
            onContinue={(packages) => handleFormComplete({ packages })}
            onBack={handleBackFromForm}
          />
        )}

        {currentStep === "checkout" && formData?.packages && (
          <Checkout
            letterPackages={formData.packages}
            onBack={handleBackFromCheckout}
            onAddAnotherLetter={handleAddAnotherLetter}
            onEditPackage={handleEditPackage}
            onDeletePackage={handleDeletePackage}
            onOrderComplete={handleCheckoutSuccess}
          />
        )}

        {currentStep === "snowupsell" && currentOrderToken && (
          <SnowUpsell
            orderToken={currentOrderToken}
            numberOfLetters={numberOfLetters}
            onAccept={handleSnowUpsellAccept}
            onDecline={handleSnowUpsellDecline}
            onTimeout={handleSnowUpsellTimeout}
          />
        )}

        {currentStep === "snowdownsell" && currentOrderToken && (
          <SnowDownsell
            orderToken={currentOrderToken}
            numberOfLetters={numberOfLetters}
            onAccept={handleSnowDownsellAccept}
            onDecline={handleSnowDownsellDecline}
            onTimeout={handleSnowDownsellTimeout}
          />
        )}

        {currentStep === "subscriptionupsell" && currentOrderToken && (
          <Suspense fallback={<LoadingScreen />}>
            <UpsellOffer
              orderToken={currentOrderToken}
              onComplete={handleSubscriptionUpsellComplete}
            />
          </Suspense>
        )}

        {currentStep === "success" && (
          <Suspense fallback={<LoadingScreen />}>
            <SuccessPage onReturnHome={handleReturnHome} />
          </Suspense>
        )}

        {currentStep === "admin" && (
          <Suspense fallback={<LoadingScreen />}>
            <AdminDashboard onLogout={handleBackFromAdminDashboard} />
          </Suspense>
        )}

        {currentStep === "adminlogin" && (
          <Suspense fallback={<LoadingScreen />}>
            <AdminLogin
              onLoginSuccess={() => setCurrentStep("admin")}
              onBack={handleReturnHome}
            />
          </Suspense>
        )}

        {currentStep === "affiliate" && (
          <Suspense fallback={<LoadingScreen />}>
            <AffiliateDashboard onLogout={handleBackFromAffiliateDashboard} />
          </Suspense>
        )}

        {currentStep === "affiliatemanage" && (
          <Suspense fallback={<LoadingScreen />}>
            <AdminAffiliateManagement onBack={handleBackFromAdminDashboard} />
          </Suspense>
        )}

        {currentStep === "affiliateauth" && (
          <Suspense fallback={<LoadingScreen />}>
            <AffiliateAuth
              onLoginSuccess={() => setCurrentStep("affiliate")}
              onBack={handleReturnHome}
            />
          </Suspense>
        )}

        {currentStep === "downsell" && (
          <Suspense fallback={<LoadingScreen />}>
            <AcceptDownsell />
          </Suspense>
        )}

        {currentStep === "updatepayment" && (
          <UpdatePaymentMethod onBack={handleReturnHome} />
        )}

        {currentStep === "upsellmanage" && (
          <Suspense fallback={<LoadingScreen />}>
            <UpsellManagement onBack={handleBackFromAdminDashboard} />
          </Suspense>
        )}

        {currentStep === "privacy" && (
          <Suspense fallback={<LoadingScreen />}>
            <PrivacyPolicy onBack={handleBackFromSupportPages} />
          </Suspense>
        )}

        {currentStep === "terms" && (
          <Suspense fallback={<LoadingScreen />}>
            <TermsAndConditions onBack={handleBackFromSupportPages} />
          </Suspense>
        )}

        {currentStep === "contact" && (
          <Suspense fallback={<LoadingScreen />}>
            <ContactUs onBack={handleBackFromSupportPages} />
          </Suspense>
        )}
      </div>
    </HelmetProvider>
  );
}
