import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Footer } from "./Footer";

interface TermsAndConditionsProps {
  onBack: () => void;
}

export function TermsAndConditions({ onBack }: TermsAndConditionsProps) {
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
          <h1 className="text-3xl text-center" style={{ fontFamily: 'Pacifico, cursive' }}>Terms & Conditions</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Last Updated:</strong> October 16, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing and using Santa's Certified Letter website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>2. Services Offered</h2>
            <p className="text-gray-700 mb-4">
              Santa's Certified Letter provides personalized letter services including:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Customized letters from Santa for children</li>
              <li>Various package tiers (Silver, Gold, and Platinum Editions)</li>
              <li>Optional monthly subscription service for continued letters</li>
              <li>Additional upsell products and services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>3. Pricing and Payment</h2>
            <p className="text-gray-700 mb-4">
              All prices are displayed in U.S. dollars. We accept major credit cards and other payment methods as indicated at checkout. By providing payment information, you:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Authorize us to charge the total amount for your order</li>
              <li>Confirm that you are authorized to use the payment method</li>
              <li>Agree to pay all applicable taxes and fees</li>
              <li>Understand that prices may change without notice</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>4. Monthly Subscription Service</h2>
            <p className="text-gray-700 mb-4">
              If you opt for our monthly subscription service:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Your subscription begins in January 2025</li>
              <li>You will be charged $12.00 per month automatically</li>
              <li>Billing occurs on the same day each month</li>
              <li>You can cancel at any time with no penalties</li>
              <li>Cancellations take effect at the end of the current billing period</li>
              <li>No refunds for partial months</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>5. Shipping and Delivery</h2>
            <p className="text-gray-700 mb-4">
              We offer free shipping on all orders within the United States. Delivery times vary based on:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Your selected shipping date (November 15th, December 1st, December 10th, or December 15th)</li>
              <li>USPS delivery times in your area</li>
              <li>Weather conditions and other external factors</li>
            </ul>
            <p className="text-gray-700 mt-4">
              While we make every effort to meet delivery dates, we cannot guarantee exact delivery dates and are not responsible for delays caused by shipping carriers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>6. Personalization and Content</h2>
            <p className="text-gray-700 mb-4">
              You are responsible for providing accurate information for personalization, including:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Child's first and last name</li>
              <li>Friend's name</li>
              <li>Shipping address</li>
            </ul>
            <p className="text-gray-700 mt-4">
              We reserve the right to refuse orders containing inappropriate, offensive, or copyrighted content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>7. 100% Money-Back Guarantee</h2>
            <p className="text-gray-700 mb-4">
              We stand behind our products with a 100% money-back guarantee:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>If your child doesn't absolutely love their letter, we'll issue a full refund</li>
              <li>Refund requests must be made within 30 days of delivery</li>
              <li>Contact us via email or phone to initiate a refund</li>
              <li>No questions asked, no hassle, no waiting</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>8. Cancellations and Changes</h2>
            <p className="text-gray-700">
              You may modify or cancel your order before it ships by contacting customer support. Once an order has shipped, it cannot be canceled, but our money-back guarantee still applies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>9. Intellectual Property</h2>
            <p className="text-gray-700">
              All content on our website, including text, graphics, logos, images, and designs, is the property of Santa's Certified Letter and is protected by copyright and trademark laws. You may not use, reproduce, or distribute our content without permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>10. Limitation of Liability</h2>
            <p className="text-gray-700">
              To the maximum extent permitted by law, Santa's Certified Letter shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services or products.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>11. Dispute Resolution</h2>
            <p className="text-gray-700">
              Any disputes arising from these Terms and Conditions shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You agree to waive your right to participate in a class action lawsuit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>12. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms and Conditions at any time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of our services after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>13. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions about these Terms and Conditions, please contact us:
            </p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2">
                <strong>Email:</strong> <a href="mailto:hello@santascertifiedletter.com" className="text-blue-600 hover:underline">hello@santascertifiedletter.com</a>
              </p>
              <p className="text-gray-700">
                <strong>Phone:</strong> <a href="tel:+18005407716" className="text-blue-600 hover:underline">(800) 540-7716</a>
              </p>
              <p className="text-gray-700 mt-2 text-sm">
                Customer Support Available 7 Days A Week: 9am to 7pm EST
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <Footer showAdminLinks={false} />
    </div>
  );
}
