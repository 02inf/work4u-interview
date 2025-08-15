import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TranscriptInput from './components/TranscriptInput';
import SummaryDisplay from './components/SummaryDisplay';
import DigestList from './components/DigestList';
import SharedDigest from './pages/SharedDigest';
import { getAllDigests } from './utils/apiService';

function App() {
  const [currentDigest, setCurrentDigest] = useState(null);
  const [digests, setDigests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDigests();
  }, []);

  const loadDigests = async () => {
    try {
      const fetchedDigests = await getAllDigests();
      setDigests(fetchedDigests);
    } catch (error) {
      console.error('Failed to load digests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDigestCreated = (newDigest) => {
    setCurrentDigest(newDigest);
    setDigests(prev => [newDigest, ...prev]);
  };

  const handleDigestSelected = (digest) => {
    setCurrentDigest(digest);
  };

  const handleNewDigest = () => {
    setCurrentDigest(null);
  };

  // Handle back to list navigation
  const handleBackToList = () => {
    setCurrentDigest(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Routes>
          <Route 
            path="/shared/:publicId" 
            element={<SharedDigest />} 
          />
          <Route 
            path="/" 
            element={
              <MainLayout
                currentDigest={currentDigest}
                digests={digests}
                loading={loading}
                onDigestCreated={handleDigestCreated}
                onDigestSelected={handleDigestSelected}
                onNewDigest={handleNewDigest}
                onBackToList={handleBackToList}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

function MainLayout({ 
  currentDigest, 
  digests, 
  loading, 
  onDigestCreated, 
  onDigestSelected, 
  onNewDigest,
  onBackToList
}) {
  return (
    <div className="min-h-screen">
      {/* Beautiful top navigation */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Beautiful Logo */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Meeting Digest
                </h1>
                <p className="text-xs text-gray-500 -mt-0.5">
                  work4u Meeting Summaries
                </p>
              </div>
            </div>
            
            {currentDigest && (
              <button
                onClick={onNewDigest}
                className="group px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Digest</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {!currentDigest ? (
          // Input mode - beautiful design
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-6">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                Meeting Digest Smart Transcribe
              </div>
              
              <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Transform meetings into
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  actionable insights
                </span>
              </h2>
              
              <p className="text-xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto">
                Paste your meeting transcript and watch as AI extracts key decisions, 
                action items, and next steps in seconds.
              </p>
            </div>
            
            <TranscriptInput onDigestCreated={onDigestCreated} />
            
            {/* History records - beautiful display */}
            {digests.length > 0 && (
              <div className="mt-20">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Recent Digests
                    </h3>
                    <p className="text-gray-600">
                      Your AI-generated meeting summaries
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{digests.length} digests created</span>
                  </div>
                </div>
                
                <DigestList 
                  digests={digests} 
                  onDigestSelected={onDigestSelected}
                  loading={loading}
                />
              </div>
            )}
          </div>
        ) : (
          // Display mode - beautiful two-column layout
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left sidebar - beautiful design */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        All Digests
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs font-medium rounded-full">
                        {digests.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <DigestList 
                      digests={digests} 
                      onDigestSelected={onDigestSelected}
                      loading={loading}
                      compact={true}
                      selectedDigest={currentDigest}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main content area - beautiful card */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <SummaryDisplay 
                  digest={currentDigest} 
                  onBack={onBackToList}
                />
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Beautiful footer */}
      <footer className="mt-20 border-t border-gray-100 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">Powered by Gemini AI</span>
            </div>
            <div className="text-xs text-gray-400">
              © 2025 work4u-interview. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;