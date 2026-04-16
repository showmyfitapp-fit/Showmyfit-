import React from 'react';
import Navbar from '../components/layout/Navbar';
import { Users, ShoppingBag, TrendingUp, Heart, Sparkles, Target, Zap, Shield } from 'lucide-react';

const AboutUsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar userRole="user" />
      <div className="main-content px-4 py-6 pt-28">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-serif font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                About ShowMyFit
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Revolutionizing online fashion shopping with smart technology and seamless experiences
              </p>
              <div className="flex justify-center mt-8">
                <div className="w-32 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-16">
            {/* Introduction */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-white/20">
                <div className="flex items-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-serif font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Welcome to ShowMyFit
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      At ShowMyFit, we believe shopping for clothes online should be <span className="font-semibold text-blue-600">easy, fun, and accurate</span>.
                    </p>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      No more confusion about sizes or endless returns—our platform helps customers find products that truly fit their <span className="font-semibold text-purple-600">style and body</span>.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      We started with a simple vision: make online fashion shopping smarter by bridging the gap between customers and shop owners.
                    </p>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
                      <p className="text-lg font-semibold text-gray-800">
                        With ShowMyFit, everyone wins—customers get the right fit, and shop owners manage inventory more easily.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works - Customers */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-3xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-white/20">
                <div className="flex items-center mb-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-serif font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    How It Works (For Customers)
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-gradient-to-r from-green-50 to-blue-50 hover:shadow-lg transition-all duration-300 border border-green-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                        1
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                          <ShoppingBag className="w-5 h-5 mr-2 text-green-600" />
                          Browse Products
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Explore curated clothing options with clear size availability and real-time stock updates.
                        </p>
                      </div>
                    </div>
                    
                    <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-lg transition-all duration-300 border border-blue-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                        2
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                          <Zap className="w-5 h-5 mr-2 text-blue-600" />
                          Reserve
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Select your style and size in one click with our intuitive shopping experience.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 hover:shadow-lg transition-all duration-300 border border-purple-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                        3
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                          <Shield className="w-5 h-5 mr-2 text-purple-600" />
                          Shop Confidently
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Our system ensures you see real-time stock updates so you only order what's truly available.
                        </p>
                      </div>
                    </div>
                    
                    <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-gradient-to-r from-pink-50 to-red-50 hover:shadow-lg transition-all duration-300 border border-pink-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                        4
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                          <Target className="w-5 h-5 mr-2 text-pink-600" />
                          Get the Right Fit
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Say goodbye to the guesswork and enjoy smooth shopping with perfect fit guarantee.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works - Shop Owners */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-3xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-white/20">
                <div className="flex items-center mb-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-4xl font-serif font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    How It Works (For Shop Owners)
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-gradient-to-r from-orange-50 to-yellow-50 hover:shadow-lg transition-all duration-300 border border-orange-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                        1
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                          <ShoppingBag className="w-5 h-5 mr-2 text-orange-600" />
                          Upload Inventory
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Add your products with sizes and stock levels using our intuitive dashboard.
                        </p>
                      </div>
                    </div>
                    
                    <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 hover:shadow-lg transition-all duration-300 border border-yellow-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                        2
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                          <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                          Track in Real-Time
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Manage sizes and update availability instantly with our smart inventory system.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 hover:shadow-lg transition-all duration-300 border border-red-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                        3
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                          <Shield className="w-5 h-5 mr-2 text-red-600" />
                          Reduce Returns
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Customers see accurate stock and fit details before buying, reducing returns significantly.
                        </p>
                      </div>
                    </div>
                    
                    <div className="group flex items-start space-x-6 p-6 rounded-2xl bg-gradient-to-r from-pink-50 to-rose-50 hover:shadow-lg transition-all duration-300 border border-pink-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-transform">
                        4
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                          <Target className="w-5 h-5 mr-2 text-pink-600" />
                          Grow Smarter
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          Save time, build trust, and boost sales with our comprehensive analytics and tools.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Mission Statement */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-3xl p-12 text-white shadow-2xl">
                <div className="text-center">
                  <div className="flex justify-center mb-8">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">Our Mission</h2>
                  <p className="text-xl leading-relaxed max-w-4xl mx-auto text-white/90">
                    To revolutionize online fashion shopping by creating a platform where customers find their perfect fit 
                    and shop owners can showcase their products effectively, building a community that celebrates style and confidence.
                  </p>
                  <div className="mt-8 flex justify-center">
                    <div className="flex space-x-4">
                      <div className="w-3 h-3 bg-white/60 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/40 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/60 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Section */}
            <section className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-xl border border-white/20">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-serif font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    Why Choose ShowMyFit?
                  </h2>
                  <p className="text-gray-600 text-lg">Join thousands of satisfied customers and shop owners</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Happy Customers</h3>
                    <p className="text-gray-600">Join our community</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Partner Stores</h3>
                    <p className="text-gray-600">Join our network</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">95%</h3>
                    <p className="text-gray-600">Perfect Fit Rate</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
