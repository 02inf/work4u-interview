import React from 'react';

const DigestList = ({ 
  digests, 
  onDigestSelected, 
  loading, 
  compact = false, 
  selectedDigest = null 
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (digests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No digests yet</h3>
        <p className="text-gray-500 text-sm">Create your first meeting summary to get started</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getSummaryStats = (summary) => {
    if (typeof summary === 'string') {
      const decisions = (summary.match(/•.*Decision:/g) || []).length;
      const actions = (summary.match(/•.*Action:/g) || []).length;
      const steps = (summary.match(/\*.*[^*]/g) || []).length;
      return { decisions, actions, steps };
    }
    return {
      decisions: summary?.decisions?.length || summary?.keyDecisions?.length || 0,
      actions: summary?.actionItems?.length || 0,
      steps: summary?.nextSteps?.length || 0
    };
  };

  if (compact) {
    // Sidebar beautiful version
    return (
      <div className="space-y-2">
        {digests.map((digest) => {
          const isSelected = selectedDigest && selectedDigest.id === digest.id;
          const stats = getSummaryStats(digest.summary);
          
          return (
            <button
              key={digest.id}
              onClick={() => onDigestSelected(digest)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isSelected 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg transform scale-105' 
                  : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200 hover:shadow-md'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-500"></div>
              )}
              
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold truncate ${
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {digest.summary?.title || 'Meeting Summary'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(digest.created_at)}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0 animate-pulse"></div>
                )}
              </div>
              
              {/* Statistics indicators */}
              <div className="flex items-center space-x-3 text-xs">
                {stats.decisions > 0 && (
                  <span className="flex items-center space-x-1 text-purple-600">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>{stats.decisions}</span>
                  </span>
                )}
                {stats.actions > 0 && (
                  <span className="flex items-center space-x-1 text-green-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>{stats.actions}</span>
                  </span>
                )}
                {stats.steps > 0 && (
                  <span className="flex items-center space-x-1 text-orange-600">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span>{stats.steps}</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Main list beautiful version
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {digests.map((digest) => {
        const stats = getSummaryStats(digest.summary);
        const hasOverview = digest.summary?.overview || (typeof digest.summary === 'string' && digest.summary.length > 100);
        
        return (
          <button
            key={digest.id}
            onClick={() => onDigestSelected(digest)}
            className="text-left bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 group overflow-hidden transform hover:-translate-y-1"
          >
            {/* Card header */}
            <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-600">AI Generated</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {formatDate(digest.created_at)}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 leading-tight">
                {digest.summary?.title || 'Meeting Summary'}
              </h3>
            </div>

            {/* Card content */}
            <div className="p-6">
              {hasOverview && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                  {truncateText(
                    digest.summary?.overview || 
                    (typeof digest.summary === 'string' ? digest.summary.split('\n')[0] : ''), 
                    120
                  )}
                </p>
              )}
              
              {/* Statistics card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {stats.decisions > 0 && (
                    <div className="flex items-center space-x-1.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{stats.decisions}</div>
                        <div className="text-xs text-gray-500">Decisions</div>
                      </div>
                    </div>
                  )}
                  
                  {stats.actions > 0 && (
                    <div className="flex items-center space-x-1.5">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{stats.actions}</div>
                        <div className="text-xs text-gray-500">Actions</div>
                      </div>
                    </div>
                  )}
                  
                  {stats.steps > 0 && (
                    <div className="flex items-center space-x-1.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{stats.steps}</div>
                        <div className="text-xs text-gray-500">Steps</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-blue-500 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default DigestList;