import React, { useState } from 'react';
import { Download, Share2, Copy, Check, QrCode } from 'lucide-react';

// Ensure React is available globally before importing qrcode.react
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

// Import qrcode.react after ensuring React is available
import { QRCodeSVG } from 'qrcode.react';

interface SellerQRCodeProps {
  sellerId: string;
  sellerName?: string;
  businessName?: string;
  className?: string;
}

const SellerQRCode: React.FC<SellerQRCodeProps> = ({
  sellerId,
  sellerName,
  businessName,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Validate sellerId - ensure it's a valid string
  if (!sellerId || typeof sellerId !== 'string' || sellerId.trim() === '') {
    return null;
  }

  // Ensure sellerId is safe for URL
  const safeSellerId = String(sellerId).trim();
  if (!safeSellerId) {
    return null;
  }

  // Generate the seller store URL - ensure it's always a valid string
  const sellerUrl = safeSellerId ? `https://showmyfit.com/seller/${safeSellerId}` : '';
  
  // Final validation - don't render if URL is invalid
  if (!sellerUrl || sellerUrl.trim() === '' || !safeSellerId) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sellerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById(`qr-code-${safeSellerId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `showmyfit-seller-${safeSellerId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${businessName || sellerName || 'My Store'} - ShowMyFit`,
          text: `Check out my store on ShowMyFit!`,
          url: sellerUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <>
      {/* QR Code Button */}
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl ${className}`}
        title="View QR Code"
      >
        <QrCode className="w-5 h-5 mr-2" />
        My QR Code
      </button>

      {/* QR Code Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close QR code modal"
              title="Close"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Store QR Code</h2>
              <p className="text-gray-600 text-sm">
                Scan to visit {businessName || sellerName || 'my store'}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6 p-4 bg-white rounded-xl border-2 border-gray-200">
              <div className="bg-white p-4 rounded-lg">
                {safeSellerId && sellerUrl ? (
                  <QRCodeSVG
                    id={`qr-code-${safeSellerId}`}
                    value={sellerUrl}
                    size={256}
                    level="H"
                    includeMargin={true}
                    fgColor="#1f2937"
                    bgColor="#ffffff"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                    Invalid seller ID
                  </div>
                )}
              </div>
            </div>

            {/* Store URL */}
            <div className="mb-6">
              <label htmlFor={`seller-url-${safeSellerId}`} className="block text-sm font-medium text-gray-700 mb-2">Store URL</label>
              <div className="flex items-center space-x-2">
                <input
                  id={`seller-url-${safeSellerId}`}
                  type="text"
                  value={sellerUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono text-gray-700"
                  aria-label="Seller store URL"
                  title={sellerUrl}
                  placeholder={sellerUrl}
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center"
                  title="Copy URL"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-600" />
                      <span className="text-sm text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Download
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 Share this QR code on social media, business cards, or print it for your store!
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SellerQRCode;

