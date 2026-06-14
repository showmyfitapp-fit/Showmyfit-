import React from 'react';
import Link from 'next/link';
import { Instagram, Youtube, Facebook } from 'lucide-react';

const PremiumFooter: React.FC = () => {
    return (
        <footer className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-20 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="inline-block">
                            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 mb-2">
                                Showmyfit
                            </h2>
                            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                        </div>
                        <p className="text-gray-300 text-lg leading-relaxed max-w-sm">
                            Experience the future of local shopping. Discover, reserve, and collect from premium stores near you.
                            Elevate your style with Showmyfit.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 transition-all duration-300 group">
                                <Instagram className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="#" className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all duration-300 group">
                                <Facebook className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="#" className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center hover:bg-gradient-to-r hover:from-red-600 hover:to-orange-600 transition-all duration-300 group">
                                <Youtube className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-xl font-bold text-white mb-6">Discover</h3>
                        <ul className="space-y-4">
                            <li><Link href="/browse" className="text-gray-400 hover:text-purple-300 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>New Arrivals</Link></li>
                            <li><Link href="/browse?category=men" className="text-gray-400 hover:text-purple-300 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>Men's Collection</Link></li>
                            <li><Link href="/browse?category=women" className="text-gray-400 hover:text-purple-300 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>Women's Fashion</Link></li>
                            <li><Link href="/browse?category=accessories" className="text-gray-400 hover:text-purple-300 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>Accessories</Link></li>
                            <li><Link href="/stores" className="text-gray-400 hover:text-purple-300 transition-colors flex items-center"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>Nearby Stores</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-xl font-bold text-white mb-6">Support</h3>
                        <ul className="space-y-4">
                            <li><Link href="/help" className="text-gray-400 hover:text-purple-300 transition-colors">Help Center</Link></li>
                            <li><Link href="/orders" className="text-gray-400 hover:text-purple-300 transition-colors">Track Order</Link></li>
                            <li><Link href="/returns" className="text-gray-400 hover:text-purple-300 transition-colors">Returns & Exchanges</Link></li>
                            <li><Link href="/shipping" className="text-gray-400 hover:text-purple-300 transition-colors">Shipping Info</Link></li>
                            <li><Link href="/contact" className="text-gray-400 hover:text-purple-300 transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="lg:col-span-4">
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10">
                            <h3 className="text-3xl font-bold text-white mb-4">Stay in the Loop</h3>
                            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                                Get exclusive access to new stores, special deals, and community updates.
                                Be the first to know about exciting local discoveries!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                />
                                <button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                                    Subscribe
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm mt-4">
                                Unsubscribe anytime.
                            </p>
                        </div>
                    </div>

                    {/* Become a Seller Section */}
                    <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm rounded-3xl p-8 mb-12 border border-white/10 lg:col-span-12">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-purple-600 rounded-2xl mb-6">
                                <span className="text-white text-2xl">🏪</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">Ready to Start Selling?</h3>
                            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                                Join thousands of successful sellers on Showmyfit. Start your online store today
                                and reach customers in your local community and beyond!
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                                    <div className="text-3xl mb-3">🚀</div>
                                    <h4 className="text-xl font-bold text-white mb-2">Quick Setup</h4>
                                    <p className="text-gray-300 text-sm">Get started in minutes with our easy onboarding process</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                                    <div className="text-3xl mb-3">💰</div>
                                    <h4 className="text-xl font-bold text-white mb-2">Low Fees</h4>
                                    <p className="text-gray-300 text-sm">Competitive commission rates to maximize your profits</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                                    <div className="text-3xl mb-3">🎯</div>
                                    <h4 className="text-xl font-bold text-white mb-2">Local Focus</h4>
                                    <p className="text-gray-300 text-sm">Connect with customers in your neighborhood</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/become-seller"
                                    className="bg-gradient-to-r from-green-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-green-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    Become a Seller Now
                                </Link>
                                <a
                                    href="#"
                                    className="border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300"
                                >
                                    Learn More
                                </a>
                            </div>

                        </div>
                    </div>

                    {/* Enhanced Bottom Bar */}
                    <div className="border-t border-white/10 pt-8 lg:col-span-12">
                        <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0">
                            <div className="text-center lg:text-left">
                                <div className="text-gray-300 text-lg mb-2">
                                    © 2024 Showmyfit. All rights reserved.
                                </div>
                                <div className="text-gray-400 text-sm mb-2">
                                    Crafted with ❤️ for local communities worldwide
                                </div>
                                <div className="text-gray-300 text-sm">
                                    Contact us: showmyfitapp@gmail.com
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-center gap-8">
                                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Privacy Policy</Link>
                                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Terms of Service</Link>
                                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Cookie Policy</a>
                                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Accessibility</a>
                            </div>

                            <div className="flex items-center space-x-2">
                                <span className="text-gray-400 text-sm">Made with</span>
                                <div className="w-4 h-4 text-red-500 animate-pulse">❤️</div>
                                <span className="text-gray-400 text-sm">in India</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PremiumFooter;
