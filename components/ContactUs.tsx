import { ArrowLeft, Mail, Phone, Clock, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Footer } from "./Footer";

interface ContactUsProps {
  onBack: () => void;
}

export function ContactUs({ onBack }: ContactUsProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 text-white py-6">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white hover:text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl text-center" style={{ fontFamily: 'Pacifico, cursive' }}>Contact Us</h1>
          <p className="text-center text-blue-100 mt-2">We're here to help make your holiday magical!</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Email Contact */}
          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl mb-2" style={{ fontWeight: '700' }}>Email Us</h3>
            <p className="text-gray-600 mb-4">Send us a message anytime</p>
            <a 
              href="mailto:hello@santascertifiedletter.com"
              className="text-blue-600 hover:underline text-lg"
            >
              hello@santascertifiedletter.com
            </a>
            <p className="text-sm text-gray-500 mt-4">
              We typically respond within 24 hours
            </p>
          </Card>

          {/* Phone Contact */}
          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl mb-2" style={{ fontWeight: '700' }}>Call Us</h3>
            <p className="text-gray-600 mb-4">Speak with our friendly team</p>
            <a 
              href="tel:+18005407716"
              className="text-green-600 hover:underline text-lg"
            >
              (800) 540-7716
            </a>
            <p className="text-sm text-gray-500 mt-4">
              Toll-free across the USA
            </p>
          </Card>
        </div>

        {/* Business Hours */}
        <Card className="p-8 mb-12 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl text-center mb-4" style={{ fontWeight: '700' }}>Customer Support Hours</h3>
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-2">7 Days A Week</p>
            <p className="text-2xl text-purple-600" style={{ fontWeight: '700' }}>9:00 AM - 7:00 PM EST</p>
            <p className="text-sm text-gray-600 mt-4">
              We're here to answer all your questions about orders, shipping, customization, and more!
            </p>
          </div>
        </Card>

        {/* FAQs Section */}
        <div className="mb-12">
          <h2 className="text-2xl text-center mb-8" style={{ fontWeight: '700' }}>Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h4 className="text-lg mb-2" style={{ fontWeight: '700' }}>📦 When will my order ship?</h4>
              <p className="text-gray-700">
                Your order will ship on the date you selected at checkout (November 15th, December 1st, December 10th, or December 15th). You'll receive a tracking number via email when your order ships.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg mb-2" style={{ fontWeight: '700' }}>✏️ Can I change my order after placing it?</h4>
              <p className="text-gray-700">
                Yes! You can edit your letter details, add more letters, or update your information before your selected shipping date. Contact us and we'll help you make changes.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg mb-2" style={{ fontWeight: '700' }}>💰 What's your refund policy?</h4>
              <p className="text-gray-700">
                We offer a 100% money-back guarantee! If your child doesn't absolutely love their letter, we'll issue a full refund. No questions asked, no hassle, no waiting.
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg mb-2" style={{ fontWeight: '700' }}>📅 How does the monthly subscription work?</h4>
              <p className="text-gray-700">
                Our monthly subscription starts in January 2025 and costs $12/month. You'll receive a new personalized letter from Santa each month. You can cancel anytime with no penalties!
              </p>
            </Card>

            <Card className="p-6">
              <h4 className="text-lg mb-2" style={{ fontWeight: '700' }}>🎁 What's included in each package?</h4>
              <p className="text-gray-700">
                Silver Edition ($19.99) includes a personalized letter. Gold Edition ($29.99) adds a Nice List Certificate and North Pole postmark. Platinum Edition ($59.99) includes everything plus Santa's Special Gift and premium packaging!
              </p>
            </Card>
          </div>
        </div>

        {/* Additional Help */}
        <Card className="p-8 bg-blue-50 border-blue-200 text-center">
          <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl mb-2" style={{ fontWeight: '700' }}>Still Have Questions?</h3>
          <p className="text-gray-700 mb-6">
            Our friendly customer support team is ready to help! Whether you need assistance with your order, have questions about our products, or just want to chat about making Christmas magical, we're here for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="mailto:hello@santascertifiedletter.com">
                <Mail className="w-4 h-4 mr-2" />
                Email Us
              </a>
            </Button>
            <Button asChild variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <a href="tel:+18005407716">
                <Phone className="w-4 h-4 mr-2" />
                Call Us
              </a>
            </Button>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <Footer showAdminLinks={false} />
    </div>
  );
}
