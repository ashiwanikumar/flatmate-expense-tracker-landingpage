import Link from 'next/link';
import Footer from '@/components/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <img src="/img/logo/netraga_logo.png" alt="Netraga Logo" className="h-12 w-12" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Flatmate Expense Tracker
            </h1>
          </Link>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Flatmate Expense Tracker, you accept and agree to be bound by the terms and provision of this
              agreement. If you do not agree to these Terms of Service, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              Flatmate Expense Tracker is a shared expense management platform that allows flatmates to track expenses,
              split bills, manage payments, and view balances. We provide tools for automating expense calculations,
              managing availability, and tracking staff salaries for shared living spaces.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use our service, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Create an account with accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Be responsible for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Be at least 18 years old or have parental consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree NOT to use the service to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Submit fraudulent or misleading expense information</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malicious code or viruses</li>
              <li>Harass, abuse, or harm other flatmates</li>
              <li>Impersonate any person or entity</li>
              <li>Access other users' data without permission</li>
              <li>Interfere with the service's operation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Accuracy and Responsibility</h2>
            <p className="text-gray-700 leading-relaxed">
              You must ensure that all expense information you submit is accurate and truthful. You are solely responsible
              for the accuracy of expense records, receipts, and payment information you provide. Misrepresentation of
              expenses or financial data may result in account termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The service and its original content, features, and functionality are owned by Netraga and are protected by
              international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. User Content</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain all rights to your content (expense records, receipts, payment data, etc.). By using our service, you grant us a
              limited license to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Store and process your data to provide the service</li>
              <li>Use aggregated, anonymized data for analytics and improvement</li>
              <li>Display your content within the service interface</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive to provide reliable service but do not guarantee uninterrupted access. We reserve the right to modify,
              suspend, or discontinue any part of the service at any time with or without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              To the maximum extent permitted by law, Flatmate Expense Tracker and Netraga shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible
              losses resulting from your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless Flatmate Expense Tracker and Netraga from any claims, damages, losses,
              liabilities, and expenses arising from your use of the service or violation of these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account and access to the service immediately, without prior notice, for any
              breach of these Terms. Upon termination, your right to use the service will cease immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Data Backup and Loss</h2>
            <p className="text-gray-700 leading-relaxed">
              While we implement backup procedures, you are responsible for maintaining your own backups of your data. We are
              not responsible for any data loss.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Modifications to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any material changes. Your
              continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of
              law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-700">
                <strong>Netraga</strong>
                <br />
                Website:{' '}
                <a
                  href="https://www.netraga.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700"
                >
                  www.netraga.com
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
