import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './components/HomePage';
import HistoryPage from './components/HistoryPage';
import DigestDetailPage from './components/DigestDetailPage';
import SharedDigestPage from './components/SharedDigestPage';
import Navigation from './components/Navigation';
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <div>
          <Navigation />
          <main className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/digest/:id" element={<DigestDetailPage />} />
              <Route path="/shared/:publicId" element={<SharedDigestPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
