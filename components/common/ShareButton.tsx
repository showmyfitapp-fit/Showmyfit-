import React, { useState } from 'react';
import { Share2, Copy, Check, Facebook, Twitter, MessageCircle, Link2, X } from 'lucide-react';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
  variant?: 'icon' | 'button' | 'compact';
  onShare?: () => void;
  productId?: string; // Add productId for better matching
}

const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  description = '',
  image = '',
  className = '',
  variant = 'icon',
  onShare,
  productId
}) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Format URL as showmyfit.com/productname
  const formatShareUrl = (url: string, productTitle: string): string => {
    // Convert product title to URL-friendly format
    const productName = productTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
    
    // Extract product ID from URL if available
    let extractedProductId = productId || '';
    if (!extractedProductId && url.includes('/product/')) {
      extractedProductId = url.split('/product/')[1]?.split('?')[0] || '';
    } else if (!extractedProductId && url.startsWith('/product/')) {
      extractedProductId = url.replace('/product/', '').split('?')[0];
    }
    
    // Use product name if available, otherwise use ID
    const slug = productName || extractedProductId || 'product';
    
    // Include product ID as query parameter for reliable matching
    if (extractedProductId) {
      return `https://showmyfit.com/${slug}?id=${extractedProductId}`;
    }
    
    return `https://showmyfit.com/${slug}`;
  };

  const fullUrl = formatShareUrl(url, title);
  const shareText = `${title}${description ? ` - ${description}` : ''}`;

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (onShare) onShare();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Native Web Share API (mobile)
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: fullUrl,
        });
        if (onShare) onShare();
        setShowModal(false);
      } catch (err) {
        // User cancelled or error
        console.error('Share failed:', err);
      }
    } else {
      // Fallback to modal
      setShowModal(true);
    }
  };

  // Share to Facebook
  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    if (onShare) onShare();
    setShowModal(false);
  };

  // Share to Twitter
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    if (onShare) onShare();
    setShowModal(false);
  };

  // Share to WhatsApp
  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    if (onShare) onShare();
    setShowModal(false);
  };

  // Handle click based on variant
  const handleClick = () => {
    // On mobile, try native share first
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      shareNative();
    } else {
      setShowModal(true);
    }
  };

  // Icon variant
  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
          aria-label="Share product"
          title="Share"
        >
          <Share2 className="w-5 h-5 text-gray-600" />
        </button>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Share Product</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close share modal"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Copy Link */}
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
                >
                  {copied ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-medium text-green-600">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Copy className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-900">Copy Link</span>
                    </>
                  )}
                </button>

                {/* Social Media Options */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={shareToFacebook}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Facebook className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Facebook</span>
                  </button>

                  <button
                    onClick={shareToTwitter}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-sky-500 hover:bg-sky-50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                      <Twitter className="w-6 h-6 text-sky-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Twitter</span>
                  </button>

                  <button
                    onClick={shareToWhatsApp}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                  </button>
                </div>

                {/* Native Share (if available) */}
                {navigator.share && (
                  <button
                    onClick={shareNative}
                    className="w-full flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
                  >
                    <Share2 className="w-5 h-5" />
                    Share via...
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Button variant
  if (variant === 'button') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors ${className}`}
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Share Product</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close share modal"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={copyToClipboard}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-600">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Copy Link</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={shareToFacebook}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Facebook className="w-6 h-6 text-blue-600" />
                    <span className="text-sm font-medium">Facebook</span>
                  </button>

                  <button
                    onClick={shareToTwitter}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-sky-500 hover:bg-sky-50 transition-all"
                  >
                    <Twitter className="w-6 h-6 text-sky-600" />
                    <span className="text-sm font-medium">Twitter</span>
                  </button>

                  <button
                    onClick={shareToWhatsApp}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <MessageCircle className="w-6 h-6 text-green-600" />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Compact variant
  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors ${className}`}
      >
        <Share2 className="w-4 h-4" />
        <span>Share</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Share Product</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close share modal"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-600">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Copy Link</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={shareToFacebook}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Facebook className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium">Facebook</span>
                </button>

                <button
                  onClick={shareToTwitter}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-sky-500 hover:bg-sky-50 transition-all"
                >
                  <Twitter className="w-6 h-6 text-sky-600" />
                  <span className="text-sm font-medium">Twitter</span>
                </button>

                <button
                  onClick={shareToWhatsApp}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all"
                >
                  <MessageCircle className="w-6 h-6 text-green-600" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ShareButton;
