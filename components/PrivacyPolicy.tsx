import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Footer } from "./Footer";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
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
          <h1 className="text-3xl text-center" style={{ fontFamily: 'Pacifico, cursive' }}>Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-8">
            <strong>Last Updated:</strong> October 16, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect information that you provide directly to us when you:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Place an order for personalized Santa letters</li>
              <li>Create an account or subscribe to our services</li>
              <li>Contact our customer support team</li>
              <li>Sign up for promotional emails or newsletters</li>
            </ul>
            <p className="text-gray-700 mt-4">
              This information may include: name, email address, mailing address, phone number, payment information, and details about your children (first name, last name, friend's name, etc.).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Create personalized Santa letters for your children</li>
              <li>Send order confirmations and shipping notifications</li>
              <li>Process payments and prevent fraudulent transactions</li>
              <li>Respond to your questions and provide customer support</li>
              <li>Send promotional communications (if you've opted in)</li>
              <li>Improve our products and services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>3. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information with:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li><strong>Service Providers:</strong> Third-party companies that help us process payments (Stripe), send emails (Resend), and ship orders (USPS/shipping carriers)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>4. Data Security</h2>
            <p className="text-gray-700">
              We implement industry-standard security measures to protect your personal information, including SSL encryption for data transmission and secure payment processing through Stripe. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>5. Your Rights</h2>
            <p className="text-gray-700 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>6. Cookies and Tracking</h2>
            <p className="text-gray-700">
              We use cookies and similar tracking technologies to improve your experience on our website, analyze site traffic, and understand where our visitors are coming from. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>7. Children's Privacy</h2>
            <p className="text-gray-700">
              While our service creates personalized letters for children, our website and services are directed to adults. We do not knowingly collect personal information directly from children under 13. Parents and guardians provide children's information on their behalf.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>8. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl mb-4" style={{ fontWeight: '700' }}>9. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
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
