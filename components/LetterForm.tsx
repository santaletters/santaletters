import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Footer } from "./Footer";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CheckCircle2, X } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { getAffiliateAttribution } from "../utils/affiliateTracking";
import santaWithGifts from "figma:asset/60b2ae5dc77e0e237abbc5859153be375fa7f0b1.png";
import santaLogo from "figma:asset/b444d373622fedd368dc701ca8031ce3422ae4be.png";
import redRibbonBanner from "figma:asset/471ddb56d9e5034f7977013e6d0669b15d2fa215.png";

interface LetterFormProps {
  initialPackages?: LetterPackage[];
  scrollToPackage?: number;
  onContinue: (data: LetterPackage[]) => void;
  onBack: () => void;
}

export interface LetterPackage {
  childFirstName: string;
  childLastName: string;
  friendName: string;
  streetAddress: string;
  unitApt: string;
  city: string;
  state: string;
  zipCode: string;
  packageType?: 'basic' | 'deluxe' | 'premium';
  packageName?: string;
}

export function LetterForm({ initialPackages, scrollToPackage, onContinue, onBack }: LetterFormProps) {
  const [packages, setPackages] = useState<LetterPackage[]>(
    initialPackages && initialPackages.length > 0 
      ? initialPackages 
      : [
          {
            childFirstName: "",
            childLastName: "",
            friendName: "",
            streetAddress: "",
            unitApt: "",
            city: "",
            state: "",
            zipCode: "",
            packageType: undefined,
            packageName: undefined
          }
        ]
  );

  useEffect(() => {
    if (scrollToPackage !== undefined && scrollToPackage >= 0) {
      setTimeout(() => {
        const packageElement = document.getElementById(`package-${scrollToPackage}`);
        if (packageElement) {
          packageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add a temporary highlight effect
          packageElement.style.outline = '4px solid #3b82f6';
          packageElement.style.outlineOffset = '4px';
          
          setTimeout(() => {
            packageElement.style.outline = '';
            packageElement.style.outlineOffset = '';
          }, 2000);
        }
      }, 100);
    }
  }, [scrollToPackage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track form_fill event for affiliate (use stored attribution)
    const attribution = getAffiliateAttribution();
    
    if (attribution) {
      // Fire form_fill event
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/affiliate/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          affiliateId: attribution.affiliateId,
          eventType: 'form_fill',
          subIds: attribution.subIds,
        }),
      }).catch(err => console.error('Failed to track form fill:', err));
    }
    
    onContinue(packages);
  };

  const updateField = (packageIndex: number, field: keyof LetterPackage, value: string) => {
    setPackages(prev => {
      const updated = [...prev];
      updated[packageIndex] = { ...updated[packageIndex], [field]: value };
      return updated;
    });
  };

  const addPackage = () => {
    // Track add_package event for affiliate (use stored attribution)
    const attribution = getAffiliateAttribution();
    
    if (attribution) {
      // Fire add_package event
      fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cf244566/affiliate/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          affiliateId: attribution.affiliateId,
          eventType: 'add_package',
          subIds: attribution.subIds,
        }),
      }).catch(err => console.error('Failed to track add package:', err));
    }
    
    setPackages(prev => [
      ...prev,
      {
        childFirstName: "",
        childLastName: "",
        friendName: "",
        streetAddress: "",
        unitApt: "",
        city: "",
        state: "",
        zipCode: "",
        packageType: undefined,
        packageName: undefined
      }
    ]);
  };

  const removePackage = (packageIndex: number) => {
    if (packages.length > 1) {
      setPackages(prev => prev.filter((_, idx) => idx !== packageIndex));
    }
  };

  const copyAddressFromFirst = (packageIndex: number) => {
    if (packageIndex > 0 && packages[0]) {
      setPackages(prev => {
        const updated = [...prev];
        updated[packageIndex] = {
          ...updated[packageIndex],
          streetAddress: packages[0].streetAddress,
          unitApt: packages[0].unitApt,
          city: packages[0].city,
          state: packages[0].state,
          zipCode: packages[0].zipCode,
          // Preserve packageType and packageName
          packageType: updated[packageIndex].packageType,
          packageName: updated[packageIndex].packageName
        };
        return updated;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-700">
      {/* Promo Banner */}
      <div className="bg-red-600 text-white text-center pt-3 pb-2 md:pt-2 md:pb-2">
        <p>🎄 Get 30% OFF + FREE Shipping + 2 Bonus Gifts! 🎄</p>
        <p className="text-sm">Family Owned and Operated. All orders shipped from the USA!</p>
      </div>

      {/* Header with Santa */}
      <div className="relative bg-gradient-to-b from-blue-900 to-blue-800 text-white overflow-hidden pt-4 pb-10">
        {/* Snowflakes decoration */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 text-white text-2xl">❄</div>
          <div className="absolute top-20 right-20 text-white text-xl">❄</div>
          <div className="absolute top-32 left-1/4 text-white text-lg">❄</div>
          <div className="absolute top-16 right-1/3 text-white text-2xl">★</div>
          <div className="absolute top-24 left-1/3 text-white text-xl">★</div>
          <div className="absolute top-40 right-1/4 text-white text-lg">★</div>
        </div>
        
        <div className="container mx-auto px-4 py-6 relative h-32">
          <div className="flex items-start justify-between">
            {/* Back Button and Logo - Desktop Only */}
            <div className="hidden md:flex items-center gap-4">
              <button
                type="button"
                onClick={onBack}
                className="text-white hover:text-red-100 transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg"
              >
                ← Back to Shop
              </button>
              <img 
                src={santaLogo}
                alt="Santa's Official Letter"
                className="h-16 w-auto"
              />
            </div>
            
            {/* Mobile Back Button */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={onBack}
                className="text-white hover:text-red-100 transition-colors bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm"
              >
                ← Back
              </button>
            </div>
            
            {/* Centered Red Ribbon Banner */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4">
              <img 
                src={redRibbonBanner}
                alt="Send your child a special Letter From Santa"
                className="w-full h-auto"
              />
            </div>
            
            {/* Santa Image - Top Right - Desktop Only */}
            <div className="hidden md:block absolute top-0 right-0 w-72 h-auto pointer-events-none">
              <img 
                src={santaWithGifts}
                alt="Santa with gifts"
                className="w-full h-auto"
                style={{ 
                  filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - White Section */}
      <div className="relative">
        {/* White curve */}
        <div className="absolute top-0 left-0 right-0 -translate-y-6">
          <svg viewBox="0 0 1200 60" className="w-full h-16 fill-white">
            <path d="M0,60 C300,0 900,0 1200,60 L1200,60 L0,60 Z"></path>
          </svg>
        </div>

        <div className="bg-white pb-12 pt-12">
          <div className="container mx-auto px-4">
            {/* Progress Steps - Compact */}
            <div className="w-full mx-auto mb-8 px-2">
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg px-2 sm:px-3 py-2 shadow-sm border-2 border-green-500 flex-shrink min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                    1
                  </div>
                  <span className="text-xs hidden sm:inline whitespace-nowrap">Customize Letters</span>
                </div>
                <div className="h-px w-2 sm:w-4 bg-gray-300 flex-shrink-0"></div>
                <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg px-2 sm:px-3 py-2 shadow-sm border flex-shrink min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                    2
                  </div>
                  <span className="text-xs text-gray-400 hidden sm:inline whitespace-nowrap">Complete Order</span>
                </div>
                <div className="h-px w-2 sm:w-4 bg-gray-300 flex-shrink-0"></div>
                <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg px-2 sm:px-3 py-2 shadow-sm border flex-shrink min-w-0">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                    3
                  </div>
                  <span className="text-xs text-gray-400 hidden sm:inline whitespace-nowrap">Letter Sent</span>
                </div>
              </div>
            </div>

            {/* Form - Compact Envelope Style */}
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {packages.map((pkg, packageIndex) => (
                    <div 
                      key={packageIndex}
                      id={`package-${packageIndex}`}
                      className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-lg p-6 shadow-xl relative overflow-hidden"
                      style={{
                        border: '8px solid',
                        borderImage: 'repeating-linear-gradient(45deg, #dc2626 0px, #dc2626 15px, white 15px, white 30px) 1',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(255, 255, 255, 0.5)'
                      }}
                    >
                      {packages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePackage(packageIndex)}
                          className="absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
                          aria-label="Remove package"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                      
                      <h2 
                        className="text-xl md:text-2xl text-center mb-4"
                        style={{
                          fontFamily: 'Impact, "Arial Black", sans-serif',
                          letterSpacing: '0.05em',
                          color: '#1e3a8a'
                        }}
                      >
                        {pkg.packageName || `Santa Package #${packageIndex + 1}`}
                      </h2>
                      
                      {packageIndex > 0 && (
                        <div className="mb-4 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => copyAddressFromFirst(packageIndex)}
                            className="text-sm text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            📋 Copy Address from Package #1
                          </Button>
                        </div>
                      )}
                      
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label htmlFor={`childFirstName-${packageIndex}`} className="text-sm">Child's First Name:</Label>
                          <Input
                            id={`childFirstName-${packageIndex}`}
                            value={pkg.childFirstName}
                            onChange={(e) => updateField(packageIndex, "childFirstName", e.target.value)}
                            required
                            className="bg-white border-gray-300 h-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`childLastName-${packageIndex}`} className="text-sm">Child's Last Name:</Label>
                          <Input
                            id={`childLastName-${packageIndex}`}
                            value={pkg.childLastName}
                            onChange={(e) => updateField(packageIndex, "childLastName", e.target.value)}
                            required
                            className="bg-white border-gray-300 h-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`friendName-${packageIndex}`} className="text-sm">Friends Name (Optional):</Label>
                          <Input
                            id={`friendName-${packageIndex}`}
                            value={pkg.friendName}
                            onChange={(e) => updateField(packageIndex, "friendName", e.target.value)}
                            className="bg-white border-gray-300 h-9"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label htmlFor={`streetAddress-${packageIndex}`} className="text-sm">Street Address:</Label>
                          <p className="text-xs text-gray-600 mb-1">Where The Letter Should Be Delivered:</p>
                          <Input
                            id={`streetAddress-${packageIndex}`}
                            value={pkg.streetAddress}
                            onChange={(e) => updateField(packageIndex, "streetAddress", e.target.value)}
                            required
                            className="bg-white border-gray-300 h-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`unitApt-${packageIndex}`} className="text-sm">Unit/APT#:</Label>
                          <Input
                            id={`unitApt-${packageIndex}`}
                            value={pkg.unitApt}
                            onChange={(e) => updateField(packageIndex, "unitApt", e.target.value)}
                            className="bg-white border-gray-300 h-9 mt-6"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`city-${packageIndex}`} className="text-sm">City:</Label>
                          <Input
                            id={`city-${packageIndex}`}
                            value={pkg.city}
                            onChange={(e) => updateField(packageIndex, "city", e.target.value)}
                            required
                            className="bg-white border-gray-300 h-9"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`state-${packageIndex}`} className="text-sm">State:</Label>
                          <Select value={pkg.state} onValueChange={(value) => updateField(packageIndex, "state", value)}>
                            <SelectTrigger className="bg-white border-gray-300 h-9">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AL">Alabama</SelectItem>
                              <SelectItem value="AK">Alaska</SelectItem>
                              <SelectItem value="AZ">Arizona</SelectItem>
                              <SelectItem value="AR">Arkansas</SelectItem>
                              <SelectItem value="CA">California</SelectItem>
                              <SelectItem value="CO">Colorado</SelectItem>
                              <SelectItem value="CT">Connecticut</SelectItem>
                              <SelectItem value="DE">Delaware</SelectItem>
                              <SelectItem value="FL">Florida</SelectItem>
                              <SelectItem value="GA">Georgia</SelectItem>
                              <SelectItem value="HI">Hawaii</SelectItem>
                              <SelectItem value="ID">Idaho</SelectItem>
                              <SelectItem value="IL">Illinois</SelectItem>
                              <SelectItem value="IN">Indiana</SelectItem>
                              <SelectItem value="IA">Iowa</SelectItem>
                              <SelectItem value="KS">Kansas</SelectItem>
                              <SelectItem value="KY">Kentucky</SelectItem>
                              <SelectItem value="LA">Louisiana</SelectItem>
                              <SelectItem value="ME">Maine</SelectItem>
                              <SelectItem value="MD">Maryland</SelectItem>
                              <SelectItem value="MA">Massachusetts</SelectItem>
                              <SelectItem value="MI">Michigan</SelectItem>
                              <SelectItem value="MN">Minnesota</SelectItem>
                              <SelectItem value="MS">Mississippi</SelectItem>
                              <SelectItem value="MO">Missouri</SelectItem>
                              <SelectItem value="MT">Montana</SelectItem>
                              <SelectItem value="NE">Nebraska</SelectItem>
                              <SelectItem value="NV">Nevada</SelectItem>
                              <SelectItem value="NH">New Hampshire</SelectItem>
                              <SelectItem value="NJ">New Jersey</SelectItem>
                              <SelectItem value="NM">New Mexico</SelectItem>
                              <SelectItem value="NY">New York</SelectItem>
                              <SelectItem value="NC">North Carolina</SelectItem>
                              <SelectItem value="ND">North Dakota</SelectItem>
                              <SelectItem value="OH">Ohio</SelectItem>
                              <SelectItem value="OK">Oklahoma</SelectItem>
                              <SelectItem value="OR">Oregon</SelectItem>
                              <SelectItem value="PA">Pennsylvania</SelectItem>
                              <SelectItem value="RI">Rhode Island</SelectItem>
                              <SelectItem value="SC">South Carolina</SelectItem>
                              <SelectItem value="SD">South Dakota</SelectItem>
                              <SelectItem value="TN">Tennessee</SelectItem>
                              <SelectItem value="TX">Texas</SelectItem>
                              <SelectItem value="UT">Utah</SelectItem>
                              <SelectItem value="VT">Vermont</SelectItem>
                              <SelectItem value="VA">Virginia</SelectItem>
                              <SelectItem value="WA">Washington</SelectItem>
                              <SelectItem value="WV">West Virginia</SelectItem>
                              <SelectItem value="WI">Wisconsin</SelectItem>
                              <SelectItem value="WY">Wyoming</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`zipCode-${packageIndex}`} className="text-sm">Zip Code:</Label>
                          <Input
                            id={`zipCode-${packageIndex}`}
                            value={pkg.zipCode}
                            onChange={(e) => updateField(packageIndex, "zipCode", e.target.value)}
                            required
                            className="bg-white border-gray-300 h-9"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col-reverse md:flex-row gap-3 justify-center mt-6">
                  <Button
                    type="button"
                    onClick={addPackage}
                    variant="outline"
                    className="px-6 py-5 rounded-full border-2 border-green-500 text-green-600 hover:bg-green-50 w-full md:w-auto"
                  >
                    + Add Another Letter
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-5 rounded-full shadow-lg w-full md:w-auto"
                  >
                    Verify & Complete My Order →
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl text-center mb-8">What Our Customers Are Saying</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "You guys are amazing!",
                  text: "My 8-year-old daughter and my 4-year-old son look forward to their letters every year. Thank you for bringing so much joy and excitement to their faces!",
                  author: "Emily Patterson"
                },
                {
                  title: "Love these memories!",
                  text: "My grandkids light up with joy every time they get their letters from Santa. The look on their faces is absolutely priceless, such a wonderful tradition and memory we're creating for them each year!",
                  author: "Linda Matthews"
                },
                {
                  title: "Thank you so much!",
                  text: "This is my fourth year ordering, and my boys still get just as excited as the very first time! They absolutely love it.. thank you so much for keeping the magic alive!",
                  author: "Karen Phillips"
                }
              ].map((testimonial, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="mb-2">{testimonial.title}</h4>
                  <p className="text-gray-700 text-sm mb-4">{testimonial.text}</p>
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{testimonial.author}</p>
                </div>
              ))}
            </div>
            <p className="text-center mt-8 text-gray-600">100% Money Back Guarantee</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
