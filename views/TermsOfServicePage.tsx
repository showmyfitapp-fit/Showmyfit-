import React from 'react';
import Navbar from '../components/layout/Navbar';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-primary-50">
      <Navbar userRole="user" />
      <div className="main-content px-4 py-6 pt-28">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif font-bold text-warm-900 mb-4">Terms of Service</h1>
            <p className="text-warm-600 text-lg">ShowMyFit</p>
            <p className="text-warm-500 text-sm mt-2">Effective Date: December 2024</p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <p className="text-warm-700 mb-8 leading-relaxed">
                Welcome to ShowMyFit! By accessing or using our website, mobile app, and related services ("Services"), 
                you agree to these Terms of Service. Please read carefully.
              </p>

              <div className="space-y-8">
                {/* Section 1 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">1</span>
                    Eligibility
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700">
                      You must be at least 18 years old to use our Services. By using them, you confirm you meet this requirement.
                    </p>
                  </div>
                </section>

                {/* Section 2 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">2</span>
                    Accounts
                  </h2>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>You must provide accurate information when creating an account.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>You are responsible for maintaining the confidentiality of your login credentials.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>Notify us immediately if you suspect unauthorized use of your account.</span>
                    </div>
                  </div>
                </section>

                {/* Section 3 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">3</span>
                    Orders & Payments
                  </h2>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>Prices are displayed in Indian Rupees (₹) unless stated otherwise.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>Payments must be completed before order processing.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>We reserve the right to cancel any order due to stock errors, fraudulent activity, or technical issues.</span>
                    </div>
                  </div>
                </section>

                {/* Section 4 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">4</span>
                    Shipping & Returns
                  </h2>
                  <div className="ml-11 space-y-3">
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>Delivery timelines are estimates and may vary.</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-warm-800 mr-2">•</span>
                      <span>Returns and exchanges must follow our Return Policy [link to be added].</span>
                    </div>
                  </div>
                </section>

                {/* Section 5 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">5</span>
                    Use of Services
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700 mb-3">You agree not to:</p>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <span className="font-semibold text-warm-800 mr-2">•</span>
                        <span>Misuse the Services or engage in illegal activity.</span>
                      </div>
                      <div className="flex items-start">
                        <span className="font-semibold text-warm-800 mr-2">•</span>
                        <span>Copy, modify, or distribute any content without permission.</span>
                      </div>
                      <div className="flex items-start">
                        <span className="font-semibold text-warm-800 mr-2">•</span>
                        <span>Interfere with website/app functionality.</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 6 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">6</span>
                    Intellectual Property
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700">
                      All logos, brand names, and content on ShowMyFit are the property of the Company and protected by copyright and trademark laws.
                    </p>
                  </div>
                </section>

                {/* Section 7 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">7</span>
                    Limitation of Liability
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700">
                      We are not liable for indirect, incidental, or consequential damages arising from use of our Services.
                    </p>
                  </div>
                </section>

                {/* Section 8 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">8</span>
                    Termination
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700">
                      We may suspend or terminate your account if you violate these Terms.
                    </p>
                  </div>
                </section>

                {/* Section 9 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">9</span>
                    Governing Law
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700">
                      These Terms are governed by the laws of India.
                    </p>
                  </div>
                </section>

                {/* Section 10 */}
                <section>
                  <h2 className="text-2xl font-serif font-bold text-warm-900 mb-4 flex items-center">
                    <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-3">10</span>
                    Contact Us
                  </h2>
                  <div className="ml-11">
                    <p className="text-warm-700 mb-3">
                      For questions about these Terms, contact us at:
                    </p>
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">📧</span>
                      <a 
                        href="mailto:legal@showmyfit.com" 
                        className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        legal@showmyfit.com
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

export default TermsOfServicePage;
