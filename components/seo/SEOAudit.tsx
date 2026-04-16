import React, { useState, useEffect } from 'react';
import { SEOEnhancements } from '@/utils/seoEnhancements';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface SEOAuditProps {
  showAudit?: boolean;
  onClose?: () => void;
}

const SEOAudit: React.FC<SEOAuditProps> = ({ showAudit = false, onClose }) => {
  const [auditResults, setAuditResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runAudit = () => {
    setIsLoading(true);
    const results = SEOEnhancements.auditSEO();
    setAuditResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    if (showAudit) {
      runAudit();
    }
  }, [showAudit]);

  const getScore = () => {
    if (!auditResults) return 0;
    const totalChecks = Object.keys(auditResults).length;
    const passedChecks = Object.values(auditResults).filter(Boolean).length;
    return Math.round((passedChecks / totalChecks) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  if (!showAudit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">SEO Audit Report</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Close SEO audit"
              aria-label="Close SEO audit"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Running SEO audit...</p>
            </div>
          ) : auditResults ? (
            <>
              {/* SEO Score */}
              <div className="mb-6">
                <div className={`${getScoreBg(getScore())} rounded-lg p-4 text-center`}>
                  <div className={`text-4xl font-bold ${getScoreColor(getScore())}`}>
                    {getScore()}
                  </div>
                  <div className="text-lg text-gray-700 mt-2">SEO Score</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {getScore() >= 80 ? 'Excellent!' : 
                     getScore() >= 60 ? 'Good, but can be improved' : 
                     'Needs significant improvement'}
                  </div>
                </div>
              </div>

              {/* Audit Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Audit Results</h3>
                
                {Object.entries(auditResults).map(([check, passed]) => (
                  <div key={check} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getIcon(passed as boolean)}
                      <span className="text-gray-700 capitalize">
                        {check.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </div>
                    <div className={`text-sm font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                      {passed ? 'Pass' : 'Fail'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {!auditResults.title && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Add a descriptive title tag (30-60 characters)</span>
                    </div>
                  )}
                  {!auditResults.description && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Add a meta description (120-160 characters)</span>
                    </div>
                  )}
                  {!auditResults.headings && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Ensure you have exactly one H1 tag per page</span>
                    </div>
                  )}
                  {!auditResults.images && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Add alt text to all images</span>
                    </div>
                  )}
                  {!auditResults.structuredData && (
                    <div className="flex items-start space-x-2 text-sm text-gray-600">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Add structured data (JSON-LD) for better search visibility</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={runAudit}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Run Audit Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SEOAudit;
