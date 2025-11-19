import { useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Footer } from "./Footer";
import { Button } from "./ui/button";
import { Star, Shield, Truck, Gift, CheckCircle2, Sparkles } from "lucide-react";
import Slider from "react-slick";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { setAffiliateAttribution } from "../utils/affiliateTracking";
import santaGiftsImage from "figma:asset/15f4b3cb26c39fe064d874b5ddeae3c4249b7de1.png";
import christmasTreeBg from "figma:asset/22f01ed5a54fa120bfa25466c69ee82ce71b629d.png";
import santaLetterImage from "figma:asset/725e6b4fef19b4141bd5ecabf7b8102295d2c305.png";
import letterIcon from "figma:asset/895057e0c7b59ea06755bc52fc66dcbf69aa3026.png";
import certificateIcon from "figma:asset/12386d26dbcfc7512cfcf9e075522aeca5a1e7c0.png";
import niceListIcon from "figma:asset/5f10839082560bfd9d362897e742915b45589285.png";
import envelopeIcon from "figma:asset/2b44e2aaafb56e83f78bdf91d205eebd7f2d6e35.png";
import legoSantaImage from "figma:asset/c44efe97ee63f0165a591a89114f0cc2a46973e8.png";
import freeGiftsBadge from "figma:asset/746bfae136755b73d513ce560b3953332a23d797.png";
import starsImage from "figma:asset/4391467a6a8721daf254fcd983c2d316154a73dc.png";
import freeGiftsImage from "figma:asset/74f0addd0ea0b5525297b06c248df384ddc75c91.png";
import testimonialsImage from "figma:asset/044d30a4ae2b339204d48cc3353cc50a7b863298.png";
import snowmanFooter from "figma:asset/3f314541bc06ba18331e0a00b99a2b0b8a312a1b.png";
import boyWithSantaLetter from "figma:asset/bb7721f0837c33589c57c226d4ecd0316cd5d19a.png";
import childrenWithSantaLetters from "figma:asset/08b1fe987506a79b3d29a7c6b7b75baf187696dc.png";
import childWithNiceListCertificate from "figma:asset/01b938c2a364e43f9faff2232495b67bcb15c8ad.png";

interface SalesPageProps {
  onOrderNow: () => void;
}

export function SalesPage({ onOrderNow }: SalesPageProps) {
  // Track page view for affiliate and store attribution cookie
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
      // This ensures the affiliate gets credit even if the user comes back later
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

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Promo Banner */}
      <div className="bg-red-600 text-white text-center py-2 md:py-2">
        <p className="text-sm md:text-base mb-0.5">🎄 Get 30% OFF + FREE Shipping + 2 Bonus Gifts! 🎄</p>
        <p className="text-xs md:text-sm">Family Owned and Operated. All orders shipped from the USA!</p>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-blue-900 to-blue-800 text-white overflow-hidden">
        {/* Stars decoration */}
        <div className="absolute top-0 left-0 right-0 h-64 opacity-60 pointer-events-none">
          <img 
            src={starsImage}
            alt=""
            className="w-full h-full object-contain object-top"
          />
        </div>
        
        {/* Snow overlay effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 md:py-16 relative">
          <div className="grid md:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            <div className="text-center order-2 md:order-1">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4 md:mb-6">
                <span className="text-xs md:text-sm">🎅 Santa's Certified Letter</span>
              </div>
              
              <div className="mb-4">
                <h1 
                  style={{ 
                    fontFamily: 'Impact, "Arial Black", sans-serif',
                    letterSpacing: '0.02em',
                    lineHeight: '1.2'
                  }}
                >
                  <div className="text-3xl md:text-4xl lg:text-5xl">Personalized Letters</div>
                  <div className="text-4xl md:text-5xl lg:text-6xl">From <span className="text-red-500">Santa</span></div>
                </h1>
              </div>
              
              <p className="text-lg md:text-2xl mb-6 md:mb-8 text-blue-100">
                Over 250,000 Packages Delivered
              </p>
              
              <Button 
                onClick={onOrderNow}
                className="hidden md:inline-flex bg-green-500 hover:bg-green-600 text-white px-8 md:px-16 py-6 md:py-8 rounded-full shadow-xl hover:shadow-2xl transition-all mb-3 text-base md:text-xl lg:text-2xl"
                style={{ fontWeight: '700' }}
              >
                ORDER A PACKAGE NOW! →
              </Button>
              
              <p className="text-white text-base md:text-lg mb-6">
                100% Money Back Guarantee
              </p>
              
              <div className="flex items-center gap-3 mt-6 md:mt-8 justify-center">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1669787210319-f0b42a410b4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGNoaWxkJTIwY2hyaXN0bWFzfGVufDF8fHx8MTc2MDQ2OTI1M3ww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Happy customer"
                  className="w-12 h-12 rounded-full object-cover border-2 border-white flex-shrink-0"
                />
                <div className="text-left">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xs md:text-sm text-blue-100">
                    10,000+ happy families in 2024<br />
                    See what makes our letters so special!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative order-1 md:order-2 max-w-md mx-auto w-full">
              <img 
                src={santaGiftsImage}
                alt="Santa with gifts and letters"
                className="w-full h-auto max-w-full"
              />
              <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6">
                <img 
                  src={freeGiftsBadge}
                  alt="2 Free Gifts"
                  className="w-16 h-16 md:w-24 md:h-24 max-w-full"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0 -mb-1">
          <svg viewBox="0 0 1200 120" className="w-full h-16 md:h-12 fill-white" preserveAspectRatio="none">
            <path d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </div>

      {/* Testimonials Slider */}
      <div className="container mx-auto px-4 py-8 md:py-16 bg-white relative">
        <div className="max-w-5xl mx-auto mb-8 md:mb-12">
          <Slider
            dots={true}
            infinite={true}
            speed={500}
            slidesToShow={3}
            slidesToScroll={1}
            autoplay={true}
            autoplaySpeed={3000}
            arrows={false}
            pauseOnHover={true}
            responsive={[
              {
                breakpoint: 1024,
                settings: {
                  slidesToShow: 2,
                  slidesToScroll: 1,
                  autoplay: true,
                  autoplaySpeed: 3000
                }
              },
              {
                breakpoint: 640,
                settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1,
                  autoplay: true,
                  autoplaySpeed: 3000,
                  centerMode: false
                }
              }
            ]}
          >
            {[
              {
                name: "Sarah Jenkins",
                text: "My daughter's face lit up when she got her personalized letter! The attention to detail was amazing.",
                rating: 5,
                image: childWithNiceListCertificate
              },
              {
                name: "Rachel Bennett",
                text: "Amazing quality and fast shipping. Will order again next year for sure!",
                rating: 5,
                image: boyWithSantaLetter
              },
              {
                name: "Michael Brown",
                text: "Best Christmas gift ever! The letter was so authentic and my son believes in Santa even more now.",
                rating: 5,
                image: childrenWithSantaLetters
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="px-2 md:px-3">
                <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm mx-auto">
                  {/* Testimonial Image */}
                  <div className="mb-3 md:mb-4 bg-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
                    {testimonial.image ? (
                      <img 
                        src={testimonial.image} 
                        alt={`${testimonial.name}'s testimonial`}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: 'center 30%' }}
                      />
                    ) : (
                      <div className="text-gray-400 text-center p-4">
                        <Gift className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-xs md:text-sm">Photo of child with letter</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-1 mb-2 md:mb-3">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-3 h-3 md:w-4 md:h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4">{testimonial.text}</p>
                  <p className="text-xs md:text-sm text-gray-500">{testimonial.name}</p>
                </div>
              </div>
            ))}
          </Slider>
        </div>

        {/* Trust Badges */}
        <div className="max-w-5xl mx-auto">
          <div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 p-6 md:p-8 bg-white rounded-xl"
            style={{
              border: '2px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            {[
              { icon: Shield, text: "Money Back Guarantee" },
              { icon: Truck, text: "Lowest Price Promise" },
              { icon: Gift, text: "Fast & Free Shipping" },
              { icon: CheckCircle2, text: "Safe & Secure Checkout" }
            ].map((badge, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 flex items-center justify-center">
                  <badge.icon className="w-10 h-10 md:w-12 md:h-12 text-red-600" strokeWidth={1.5} />
                </div>
                <p className="text-xs md:text-sm text-gray-800">{badge.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Keep The Magic Alive */}
      <div className="bg-gradient-to-b from-white to-pink-50 py-8 md:py-16 relative overflow-hidden">
        {/* Decorative sparkles */}
        <div className="absolute top-10 right-20 text-pink-300 opacity-40 hidden md:block">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="absolute bottom-20 left-10 text-pink-300 opacity-40 hidden md:block">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="absolute top-32 right-40 text-red-300 opacity-40 hidden md:block">
          <Sparkles className="w-5 h-5" />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Image */}
              <div className="flex justify-center">
                <img 
                  src={santaGiftsImage}
                  alt="Santa with gifts and letters"
                  className="w-full h-auto max-w-sm md:max-w-md shadow-2xl rounded-lg"
                />
              </div>
              
              {/* Content */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-pink-500" />
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl mb-4 md:mb-6" style={{ 
                  color: '#1e3a8a',
                  fontFamily: 'Impact, "Arial Black", sans-serif',
                  letterSpacing: '0.02em'
                }}>
                  Keep the Magic Alive!
                </h2>
                <p className="text-gray-700 mb-6 md:mb-8 text-base md:text-lg leading-relaxed">
                  Make your child's Christmas unforgettable with a fully personalized package straight from the North Pole! Imagine their excitement when they open a special delivery from Santa made just for them.
                </p>
                
                <ul className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                  {[
                    "Every item is custom-made with your child's information.",
                    "Choose the exact date Santa sends their magical package.",
                    "Each Santa letter features a brand-new message for 2025.",
                    "Includes 5 personalized items, plus 2 FREE bonus gifts!"
                  ].map((item, idx) => (
                    <li key={idx} className="flex gap-3 md:gap-4 items-start">
                      <div className="w-6 h-6 md:w-7 md:h-7 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm md:text-base text-gray-800">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="text-center">
                  <Button 
                    onClick={onOrderNow}
                    className="hidden md:inline-flex bg-green-500 hover:bg-green-600 text-white px-8 md:px-14 py-6 md:py-8 rounded-full shadow-xl hover:shadow-2xl transition-all text-base md:text-lg lg:text-xl"
                  >
                    Order A Package Now 👉
                  </Button>
                  <p className="mt-4 text-sm md:text-base text-gray-700 hidden md:block">100% Money Back Guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div 
        className="py-8 md:py-16 relative"
        style={{
          backgroundImage: `url(${christmasTreeBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Light overlay to ensure text readability */}
        <div className="absolute inset-0 bg-white/40"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-8 md:mb-12 max-w-3xl mx-auto text-center px-4">
            <h2 
              className="text-2xl md:text-4xl lg:text-5xl mb-2"
              style={{
                fontFamily: '"Pacifico", cursive',
                color: '#b91c1c',
                textShadow: '3px 3px 6px rgba(0, 0, 0, 0.2)',
                lineHeight: '1.4'
              }}
            >
              What do you get with a
            </h2>
            <h2 
              className="text-2xl md:text-4xl lg:text-5xl"
              style={{
                fontFamily: '"Pacifico", cursive',
                color: '#15803d',
                textShadow: '3px 3px 6px rgba(0, 0, 0, 0.2)',
                lineHeight: '1.4'
              }}
            >
              Letter From Santa?
            </h2>
          </div>
          
          {/* Package Layout */}
          <div className="max-w-6xl mx-auto mb-8 md:mb-12">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left - Santa Letter Image */}
              <div className="flex justify-center">
                <img 
                  src={santaLetterImage}
                  alt="Personalized letter from Santa"
                  className="w-full h-auto max-w-sm md:max-w-lg"
                />
              </div>
              
              {/* Right - Package Items */}
              <div className="space-y-6 md:space-y-8">
                {/* Letter */}
                <div className="flex gap-3 md:gap-4 items-start md:ml-12">
                  <div className="flex-shrink-0">
                    <img 
                      src={letterIcon}
                      alt="Letter"
                      className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain"
                    />
                  </div>
                  <div>
                    <h3 
                      className="text-lg md:text-xl lg:text-2xl mb-1 md:mb-2 text-red-600"
                      style={{
                        fontFamily: 'Impact, "Arial Black", sans-serif',
                        letterSpacing: '0.02em'
                      }}
                    >
                      LETTER
                    </h3>
                    <p className="text-sm md:text-base text-gray-700">
                      A personalized letter from Santa Claus thanking them for being so good this year! Santa will mention your child, their friend's name, and the name of their town so your little one knows that Santa is really thinking of them.
                    </p>
                  </div>
                </div>

                {/* Good Behavior Certificate */}
                <div className="flex gap-3 md:gap-4 items-start">
                  <div className="flex-shrink-0">
                    <img 
                      src={certificateIcon}
                      alt="Good Behavior Certificate"
                      className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain"
                    />
                  </div>
                  <div>
                    <h3 
                      className="text-lg md:text-xl lg:text-2xl mb-1 md:mb-2 text-red-600"
                      style={{
                        fontFamily: 'Impact, "Arial Black", sans-serif',
                        letterSpacing: '0.02em'
                      }}
                    >
                      GOOD BEHAVIOR CERTIFICATE
                    </h3>
                    <p className="text-sm md:text-base text-gray-700">
                      An official certificate for Good Behavior! This certificate is signed by Santa and features a beautiful gold seal. Perfect for placing on the mantel among your holiday cards and festive decor.
                    </p>
                  </div>
                </div>

                {/* Nice List */}
                <div className="flex gap-3 md:gap-4 items-start md:ml-12">
                  <div className="flex-shrink-0">
                    <img 
                      src={niceListIcon}
                      alt="Nice List"
                      className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain"
                    />
                  </div>
                  <div>
                    <h3 
                      className="text-lg md:text-xl lg:text-2xl mb-1 md:mb-2 text-red-600"
                      style={{
                        fontFamily: 'Impact, "Arial Black", sans-serif',
                        letterSpacing: '0.02em'
                      }}
                    >
                      NICE LIST
                    </h3>
                    <p className="text-sm md:text-base text-gray-700">
                      A real nice list with your child's name! Your child will delight in seeing their name in writing and make them feel proud of being good this year.
                    </p>
                  </div>
                </div>

                {/* Envelope */}
                <div className="flex gap-3 md:gap-4 items-start">
                  <div className="flex-shrink-0">
                    <img 
                      src={envelopeIcon}
                      alt="Envelope"
                      className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain"
                    />
                  </div>
                  <div>
                    <h3 
                      className="text-lg md:text-xl lg:text-2xl mb-1 md:mb-2 text-red-600"
                      style={{
                        fontFamily: 'Impact, "Arial Black", sans-serif',
                        letterSpacing: '0.02em'
                      }}
                    >
                      ENVELOPE
                    </h3>
                    <p className="text-sm md:text-base text-gray-700">
                      A specially designed holiday envelope holds everything together. There will be no doubt that this letter came directly from the North Pole!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Free Gifts Section */}
          <div className="max-w-6xl mx-auto mt-8 md:mt-12">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
              {/* Left - Heading and Text Content */}
              <div className="text-center md:text-left">
                <h3 
                  className="text-xl md:text-2xl lg:text-3xl mb-3 md:mb-4"
                  style={{
                    fontFamily: 'Impact, "Arial Black", sans-serif',
                    letterSpacing: '0.02em',
                    color: '#1e3a8a'
                  }}
                >
                  Two Free Bonus Gifts!<br />
                  (While Supplies Last)
                </h3>
                <p className="text-gray-700 text-sm md:text-base lg:text-lg">
                  Order today and receive a "Santa's Door Tag" and a sheet of "North Pole Stickers" included in every personalized package!
                </p>
              </div>
              
              {/* Right - Product Image */}
              <div className="flex justify-center">
                <img 
                  src={freeGiftsImage}
                  alt="Free gifts - Santa's Door Tag and North Pole Stickers"
                  className="w-full h-auto max-w-xs md:max-w-md"
                />
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8 md:mt-12">
            <Button 
              onClick={onOrderNow}
              className="hidden md:inline-flex bg-green-500 hover:bg-green-600 text-white px-8 md:px-14 py-6 md:py-8 rounded-full shadow-xl hover:shadow-2xl transition-all text-base md:text-lg lg:text-xl"
            >
              Order A Package Now 👉
            </Button>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 
              className="text-2xl md:text-4xl text-center mb-12"
              style={{
                fontFamily: 'Impact, "Arial Black", sans-serif',
                letterSpacing: '0.02em',
                color: '#1e3a8a'
              }}
            >
              What Our Customers Are Saying
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <h4 className="mb-3">You guys are amazing!</h4>
                <p className="text-gray-700 italic mb-4">
                  My 8-year-old daughter and my 4-year-old son look forward to their letters every year. Thank you for bringing so much joy and excitement to their faces!
                </p>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-900">Emily Patterson</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <h4 className="mb-3">Love these memories!</h4>
                <p className="text-gray-700 italic mb-4">
                  My grandkids light up with joy every time they get their letters from Santa. The look on their faces is absolutely priceless, such a wonderful tradition and memory we're creating for them each year!
                </p>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-900">– Linda Matthews</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
                <h4 className="mb-3">Thank you so much!</h4>
                <p className="text-gray-700 italic mb-4">
                  This is my fourth year ordering, and my boys still get just as excited as the very first time! They absolutely love it.. thank you so much for keeping the magic alive!
                </p>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-900">– Karen Phillips</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-white pt-8 pb-12 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 
              className="text-lg md:text-3xl lg:text-4xl mb-2"
              style={{
                fontFamily: 'Impact, "Arial Black", sans-serif',
                letterSpacing: '0.02em',
                color: '#1e3a8a'
              }}
            >
              Reserve A Santa Package For Your Child Today!
            </h2>
            <h3 
              className="text-2xl md:text-3xl lg:text-4xl mb-6 md:mb-8"
              style={{
                fontFamily: 'Impact, "Arial Black", sans-serif',
                letterSpacing: '0.02em',
                color: '#dc2626'
              }}
            >
              Limited Free Bonus Gifts Available
            </h3>
            
            <Button 
              onClick={onOrderNow}
              className="hidden md:inline-flex bg-green-500 hover:bg-green-600 text-white px-8 md:px-16 py-6 md:py-8 rounded-full shadow-xl hover:shadow-2xl transition-all mb-4 text-base md:text-xl lg:text-2xl"
              style={{ fontWeight: '700' }}
            >
              Order A Package Now 👉
            </Button>
            
            <p className="text-gray-700 text-base md:text-lg hidden md:block">100% Money Back Guarantee</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mb-20 md:mb-0">
        <Footer />
      </div>

      {/* Sticky Mobile CTA Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-b from-blue-900 to-blue-950 shadow-2xl p-5 safe-area-inset-bottom">
        <Button 
          onClick={onOrderNow}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-7 rounded-full shadow-xl text-lg group flex items-center justify-center gap-2"
          style={{ fontWeight: '700' }}
        >
          <span>ORDER A PACKAGE NOW!</span>
          <span className="text-2xl animate-bounce-horizontal group-hover:animate-none inline-block">
            👉
          </span>
        </Button>
      </div>
      
      <style>{`
        @keyframes bounce-horizontal {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-8px);
          }
        }
        
        .animate-bounce-horizontal {
          animation: bounce-horizontal 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}