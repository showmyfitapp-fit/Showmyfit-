import React from 'react';
import Navbar from '../components/layout/Navbar';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-primary-50">
      <Navbar userRole="user" />
      <div className="main-content px-4 py-6 pt-28">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif font-bold text-warm-900 mb-4">Privacy Policy</h1>
            <p className="text-warm-600 text-lg">ShowMyFit</p>
            <p className="text-warm-500 text-sm mt-2">Effective Date: December 2024</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-warm-700 mb-8 leading-relaxed">
                ShowMyFit ("Company," "we," "our," or "us") respects your privacy and is committed to protecting it. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
                our website, mobile app, and related services (collectively, the "Services").
              </p>

              <div className="space-y-8">
                {/* Section 1 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">1</span>
                    Information We Collect
                  </h2>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span><strong>Personal Information</strong>: Name, email address, phone number, shipping address, billing details.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span><strong>Account Information</strong>: Login credentials, preferences, and purchase history.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span><strong>Usage Data</strong>: IP address, browser type, device details, and how you interact with the Services.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span><strong>Cookies & Tracking</strong>: To improve user experience and personalize content.</span>
                    </div>
                  </div>
                </section>

                {/* Section 2 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">2</span>
                    How We Use Your Information
                  </h2>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>To process orders and payments.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>To deliver products and provide customer support.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>To personalize shopping experiences and recommend products.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>To send updates, offers, and important notices.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>To improve website performance and security.</span>
                    </div>
                  </div>
                </section>

                {/* Section 3 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">3</span>
                    Sharing of Information
                  </h2>
                  <div className="ml-11 space-y-3">
                    <p className="text-warm-700">
                      We do <strong>not sell your personal information</strong>. We may share data only with:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="font-semibold text-warm-800 mr-2">•</span>
                        <span><strong>Service Providers</strong> (payment gateways, delivery partners).</span>
                      </div>
                      <div className="flex items-start">
                        <span className="font-semibold text-warm-800 mr-2">•</span>
                        <span><strong>Legal Authorities</strong> if required by law.</span>
                      </div>
                      <div className="flex items-start">
                        <span className="font-semibold text-warm-800 mr-2">•</span>
                        <span><strong>Business Transfers</strong> if our company merges, is acquired, or sells assets.</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 4 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">4</span>
                    Data Security
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700">
                      We use encryption, secure servers, and access controls to protect your data. 
                      However, no online transmission is 100% secure.
                    </p>
                  </div>
                </section>

                {/* Section 5 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">5</span>
                    Your Rights
                  </h2>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>Access, correct, or delete your personal information.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>Opt-out of marketing emails at any time.</span>
                    </div>
                  </div>
                </section>

                {/* Section 6 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">6</span>
                    Children's Privacy
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700">
                      Our services are not directed at children under 13.
                    </p>
                  </div>
                </section>

                {/* Section 7 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">7</span>
                    Changes to This Policy
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700">
                      We may update this Privacy Policy. Updates will be posted on this page with a revised "Effective Date."
                    </p>
                  </div>
                </section>

                {/* Section 8 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">8</span>
                    Contact Us
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700 mb-3">
                      For questions about this Privacy Policy, contact us at:
                    </p>
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">📧</span>
                      <a 
                        href="mailto:support@showmyfit.com" 
                        className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        support@showmyfit.com
                      </a>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer note */}
              <div className="mt-12 pt-8 border-t border-warm-200">
                <p className="text-sm text-warm-500 text-center">
                  Last updated: December 2024
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
