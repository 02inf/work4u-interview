import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getDigestByPublicId } from '../utils/apiService';

const SharedDigest = () => {
  const { publicId } = useParams();
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchDigest = async () => {
      try {
        const fetchedDigest = await getDigestByPublicId(publicId);
        setDigest(fetchedDigest);
      } catch (err) {
        setError('Digest not found or unable to load');
        console.error('Error fetching shared digest:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicId) {
      fetchDigest();
    }
  }, [publicId]);

  // Smart back functionality
  const handleBack = () => {
    if (location.key !== 'default') {
      // If there's history, go back to previous page
      navigate(-1);
    } else {
      // Otherwise jump to home page
      navigate('/', { replace: true });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading digest...</p>
        </div>
      </div>
    );
  }

  if (error || !digest) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-light text-gray-900 mb-2">
            Digest Not Found
          </h1>
          <p className="text-gray-500 mb-6">
            {error || 'This digest may have been removed or the link is invalid.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Go Back</span>
            </button>
            <Link
              to="/"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create New Digest</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Beautiful top navigation */}
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/" 
                className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-semibold">Meeting Digest</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                Shared
              </span>
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Header information */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            AI Generated Summary
          </div>
          
          <h1 className="text-4xl font-light text-gray-900 mb-4">
            {digest.summary?.title || 'Meeting Summary'}
          </h1>
          <p className="text-gray-500">
            {formatDate(digest.created_at)}
          </p>
        </div>

        {/* Overview */}
        {digest.summary?.overview && (
          <div className="mb-12">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center border border-blue-100">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Overview</h2>
              <p className="text-lg text-blue-800 font-light leading-relaxed">
                {digest.summary.overview}
              </p>
            </div>
          </div>
        )}

        {/* Content section */}
        <div className="space-y-12">
          {/* Key points */}
          {digest.summary?.keyPoints && digest.summary.keyPoints.length > 0 && (
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-6 pb-2 border-b border-gray-100">
                Key Points
              </h2>
              <div className="space-y-4">
                {digest.summary.keyPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">{point}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Action items */}
          {digest.summary?.actionItems && digest.summary.actionItems.length > 0 && (
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-6 pb-2 border-b border-gray-100">
                Action Items
              </h2>
              <div className="space-y-4">
                {digest.summary.actionItems.map((item, index) => (
                  <div key={index} className="bg-green-50 rounded-2xl p-6 border border-green-100">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium mb-3 text-lg">{item.task}</p>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {item.assignee && (
                            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              {item.assignee}
                            </span>
                          )}
                          {item.deadline && (
                            <span className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              {item.deadline}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Decisions made */}
          {digest.summary?.decisions && digest.summary.decisions.length > 0 && (
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-6 pb-2 border-b border-gray-100">
                Decisions Made
              </h2>
              <div className="space-y-4">
                {digest.summary.decisions.map((decision, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">{decision}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Next steps */}
          {digest.summary?.nextSteps && digest.summary.nextSteps.length > 0 && (
            <section>
              <h2 className="text-2xl font-light text-gray-900 mb-6 pb-2 border-b border-gray-100">
                Next Steps
              </h2>
              <div className="space-y-4">
                {digest.summary.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 text-sm font-bold">{index + 1}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">{step}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Bottom actions */}
        <div className="mt-16 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleBack}
              className="px-6 py-3 text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Go Back</span>
            </button>
            <Link
              to="/"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Your Own Digest</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SharedDigest;