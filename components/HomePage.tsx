import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CheckCircle2, Star, Gift, Shield, Truck, ShoppingCart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { CartDrawer, type CartItem } from "./CartDrawer";
import { Footer } from "./Footer";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { setAffiliateAttribution } from "../utils/affiliateTracking";
import santaCertifiedImage from "figma:asset/4d484cc2510b3a1036e91ef46df30ebe51686c70.png";

interface HomePageProps {
  onSelectPackage: (packageType: 'basic' | 'deluxe' | 'premium') => void;
  cartItems: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onUpdateCartQuantity: (id: string, quantity: number) => void;
  onRemoveFromCart: (id: string) => void;
  onCheckout: () => void;
}

export function HomePage({ 
  onSelectPackage, 
  cartItems,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onCheckout
}: HomePageProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Track affiliate clicks on homepage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const affiliateId = params.get('ref');
    
    if (affiliateId) {
      // Collect sub IDs
      const subIds: Record<string, string> = {};
      ['sub', 'sub2', 'sub3', 'sub4', 'sub5'].forEach(subKey => {
        const value = params.get(subKey);
        if (value) {
          subIds[subKey] = value;
        }
      });

      const campaign = params.get('campaign');

      // 🍪 STORE AFFILIATE ATTRIBUTION (LAST-CLICK, 30-DAY COOKIE)
      setAffiliateAttribution(affiliateId, subIds, campaign || undefined);

      // 🎯 TRACK CLICK - Record in click tracking system
      const trackClickUrl = new URL(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/track-click/${affiliateId}`);
      if (subIds.sub) trackClickUrl.searchParams.set('subid', subIds.sub);
      if (subIds.sub2) trackClickUrl.searchParams.set('subid2', subIds.sub2);
      if (subIds.sub3) trackClickUrl.searchParams.set('subid3', subIds.sub3);
      if (subIds.sub4) trackClickUrl.searchParams.set('subid4', subIds.sub4);
      if (subIds.sub5) trackClickUrl.searchParams.set('subid5', subIds.sub5);
      
      fetch(trackClickUrl.toString(), {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          console.log('✅ Click tracked:', data);
          // Store session ID for conversion tracking
          if (data.sessionId) {
            sessionStorage.setItem('affiliate_session', data.sessionId);
          }
        })
        .catch(err => console.error('❌ Failed to track click:', err));

      // Fire page_view event
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/affiliate/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          affiliateId,
          eventType: 'page_view',
          subIds,
        }),
      }).catch(err => console.error('Failed to track page view:', err));
    }
  }, []);

  const packages = [
    {
      id: 'basic' as const,
      name: 'Santa\'s Special Delivery Kit',
      edition: 'Silver Edition',
      price: 19.99,
      originalPrice: 29.99,
      description: 'The perfect starter package',
      tagline: 'Make your child\'s Christmas truly magical with a personalized surprise from the North Pole.',
      features: [
        'Personalized North Pole Envelope',
        'Personalized Letter from Santa',
        'Personalized "Nice List" Certificate',
        'Official Nice List featuring your child\'s name',
        'Santa\'s Magical Delivery Map'
      ],
      popular: false,
      badge: null
    },
    {
      id: 'deluxe' as const,
      name: 'Santa\'s Deluxe Gift Bundle',
      edition: 'Gold Edition',
      price: 29.99,
      originalPrice: 44.99,
      description: 'A heartwarming keepsake',
      tagline: 'Bring even more holiday wonder with extra touches that make Christmas morning unforgettable.',
      features: [
        'Personalized North Pole Envelope',
        'Custom Letter from Santa featuring your child\'s name',
        'Personalized "Nice List" Certificate',
        'Official Nice List featuring your child\'s name',
        'Santa\'s Magical Delivery Map',
        'Personalized Christmas Eve Dream Pass',
        'Personalized Autographed Photo of Santa'
      ],
      popular: true,
      badge: 'MOST POPULAR'
    },
    {
      id: 'premium' as const,
      name: 'Santa\'s Ultimate Christmas Experience',
      edition: 'Platinum Edition',
      price: 59.99,
      originalPrice: 89.99,
      description: 'The ultimate North Pole experience',
      tagline: 'Give your child the full North Pole experience with Santa\'s most magical collection ever.',
      features: [
        'Personalized North Pole Envelope',
        'Custom Letter from Santa with your child\'s name',
        'Personalized "Nice List" Certificate',
        'Official Nice List featuring your child\'s name',
        'Santa\'s Magical Delivery Map',
        'Personalized Christmas Eve Dream Pass',
        'Personalized Autographed Picture of Santa',
        '"Santa Stop Here!" Door Hanger',
        'Official North Pole Stickers',
        'Santa\'s Magic Red Suit Collector\'s Piece',
        '"Santa Stop Here" Window Sticker',
        '"Official Nice List" Fridge Magnet',
        'Official North Pole Snow'
      ],
      popular: false,
      badge: 'BEST VALUE'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-red-600 text-white py-4 shadow-lg sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl" style={{ fontFamily: '"Pacifico", cursive' }}>
              🎅 Santa's Certified Letter
            </h1>
            <div className="flex gap-4 items-center">
              <a 
                href="/"
                className="text-white hover:text-red-100 text-sm transition-colors hidden md:block"
              >
                Home
              </a>
              <a 
                href="/contact"
                className="text-white hover:text-red-100 text-sm transition-colors hidden md:block"
              >
                Contact Us
              </a>
              
              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 hover:bg-red-700 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={onUpdateCartQuantity}
        onRemoveItem={onRemoveFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          onCheckout();
        }}
        onContinueShopping={() => setIsCartOpen(false)}
      />

      {/* Promo Banner */}
      <div className="bg-green-600 text-white text-center py-3">
        <p className="text-sm md:text-base">
          🎄 LIMITED TIME: 30% OFF All Packages + FREE Shipping! 🎄
        </p>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl mb-6"
            style={{ 
              fontFamily: 'Impact, "Arial Black", sans-serif',
              color: '#1e3a8a',
              letterSpacing: '0.02em'
            }}
          >
            Bring The Magic of Christmas To Life!
          </h2>
          <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
            Create unforgettable memories with personalized letters and gifts from Santa Claus. 
            Over 250,000 families have made Christmas magical with our authentic packages.
          </p>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm">100% Money Back</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span className="text-sm">Free Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-red-600" />
              <span className="text-sm">250,000+ Delivered</span>
            </div>
          </div>
        </div>
      </section>

      {/* Package Selection */}
      <section className="container mx-auto px-4 pt-0 pb-12 md:pb-16">
        <div className="text-center mb-12">
          <h3 
            className="text-3xl md:text-4xl mb-4"
            style={{ 
              fontFamily: 'Impact, "Arial Black", sans-serif',
              color: '#dc2626'
            }}
          >
            Choose Your Perfect Package
          </h3>
          <p className="text-gray-600 text-lg">
            Select the package that's right for your family
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                pkg.popular ? 'border-4 border-green-500 shadow-xl scale-105' : 'border-2 border-gray-200'
              }`}
            >
              {/* Badge */}
              {pkg.badge && (
                <div className={`absolute top-0 right-0 ${
                  pkg.popular ? 'bg-green-500' : 'bg-blue-600'
                } text-white px-4 py-1 text-xs uppercase tracking-wider`}>
                  {pkg.badge}
                </div>
              )}

              <div className="p-6 md:p-8">
                {/* Package Name */}
                <h4 
                  className="text-2xl md:text-2xl mb-1"
                  style={{ 
                    fontFamily: 'Impact, "Arial Black", sans-serif',
                    color: '#1e3a8a'
                  }}
                >
                  {pkg.name}
                </h4>
                
                <p 
                  className="text-lg mb-3"
                  style={{ 
                    fontFamily: '"Pacifico", cursive',
                    color: pkg.popular ? '#16a34a' : '#dc2626'
                  }}
                >
                  {pkg.edition}
                </p>
                
                <p className="text-sm text-gray-600 mb-4 italic">{pkg.tagline}</p>

                {/* Pricing */}
                <div className="mb-6">
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-gray-400 line-through text-lg">
                      ${pkg.originalPrice.toFixed(2)}
                    </span>
                    <span 
                      className="text-4xl md:text-5xl text-red-600"
                      style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
                    >
                      ${pkg.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-green-600">
                    Save ${(pkg.originalPrice - pkg.price).toFixed(2)} ({Math.round((pkg.originalPrice - pkg.price) / pkg.originalPrice * 100)}% OFF)
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      const newItem: CartItem = {
                        id: `${pkg.id}-${Date.now()}`,
                        packageType: pkg.id,
                        packageName: `${pkg.name} (${pkg.edition})`,
                        price: pkg.price,
                        quantity: 1
                      };
                      onAddToCart(newItem);
                      setIsCartOpen(true);
                    }}
                    className={`w-full py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all ${
                      pkg.popular 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                    style={{ fontWeight: '700' }}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                  
                  <Button
                    onClick={() => {
                      const newItem: CartItem = {
                        id: `${pkg.id}-${Date.now()}`,
                        packageType: pkg.id,
                        packageName: `${pkg.name} (${pkg.edition})`,
                        price: pkg.price,
                        quantity: 1
                      };
                      onAddToCart(newItem);
                      onCheckout();
                    }}
                    variant="outline"
                    className="w-full py-4 text-base"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Santa's Certified Letter Image */}
        <div className="flex justify-center mt-12">
          <img 
            src={santaCertifiedImage} 
            alt="Santa's Certified Letter" 
            className="max-w-full h-auto w-full max-w-md rounded-lg"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-blue-900 text-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h3 
              className="text-3xl md:text-4xl text-center mb-12"
              style={{ fontFamily: '"Pacifico", cursive' }}
            >
              Why Families Love Our Letters
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-xl mb-3">Fully Personalized</h4>
                <p className="text-blue-100">
                  Each letter includes your child's name, friend's name, and hometown for an authentic experience.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </div>
                <h4 className="text-xl mb-3">Premium Quality</h4>
                <p className="text-blue-100">
                  High-quality printing on premium paper with official North Pole postmark.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl mb-3">Fast & Free Shipping</h4>
                <p className="text-blue-100">
                  Free shipping on all orders. Choose your delivery date to arrive at the perfect time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <h3 
            className="text-3xl md:text-4xl text-center mb-12"
            style={{ 
              fontFamily: 'Impact, "Arial Black", sans-serif',
              color: '#1e3a8a'
            }}
          >
            What Parents Are Saying
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 shadow-lg">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-4">
                "You guys are amazing! My 8-year-old daughter and my 4-year-old son look forward to their letters every year. Thank you for bringing so much joy and excitement to their faces!"
              </p>
              <p className="text-sm">- Emily Patterson</p>
            </Card>
            
            <Card className="p-6 shadow-lg">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-4">
                "My grandkids light up with joy every time they get their letters from Santa. The look on their faces is absolutely priceless, such a wonderful tradition and memory we're creating for them each year!"
              </p>
              <p className="text-sm">– Linda Matthews</p>
            </Card>
            
            <Card className="p-6 shadow-lg">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-4">
                "This is my fourth year ordering, and my boys still get just as excited as the very first time! They absolutely love it.. thank you so much for keeping the magic alive!"
              </p>
              <p className="text-sm">– Karen Phillips</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-red-600 to-green-600 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 
            className="text-3xl md:text-4xl lg:text-5xl mb-6"
            style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}
          >
            Make This Christmas Unforgettable!
          </h3>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join over 250,000 families who have created magical Christmas memories
          </p>
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-red-600 hover:bg-gray-100 px-12 py-6 text-xl rounded-full shadow-2xl"
            style={{ fontWeight: '700' }}
          >
            Choose Your Package Now →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}