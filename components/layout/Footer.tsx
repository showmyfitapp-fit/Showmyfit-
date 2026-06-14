import React from 'react';
import Link from 'next/link';
import { Instagram, Youtube, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text mb-6 block">
              Showmyfit
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Discover the best local fashion, electronics, and more. Shop near you, today.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/showmyfit" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.facebook.com/showmyfitofficial" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@showmyfit" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-6">Shop</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="/browse?category=electronics" className="hover:text-purple-600 transition-colors">Electronics</Link></li>
              <li><Link href="/browse?category=fashion" className="hover:text-purple-600 transition-colors">Fashion</Link></li>
              <li><Link href="/browse?category=home" className="hover:text-purple-600 transition-colors">Home & Living</Link></li>
              <li><Link href="/browse?category=beauty" className="hover:text-purple-600 transition-colors">Beauty</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="/about" className="hover:text-purple-600 transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="hover:text-purple-600 transition-colors">Careers</Link></li>
              <li><Link href="/press" className="hover:text-purple-600 transition-colors">Press</Link></li>
              <li><Link href="/become-seller" className="hover:text-purple-600 transition-colors">Become a Seller</Link></li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="/terms" className="hover:text-purple-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-purple-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-purple-600 transition-colors">Cookie Policy</Link></li>
              <li><Link href="/contact" className="hover:text-purple-600 transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} Showmyfit. All rights reserved.
          </p>
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <span>Made with</span>
            <span className="text-red-500">♥</span>
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;