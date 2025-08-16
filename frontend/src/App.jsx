import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import SummaryPage from './pages/SummaryPage.jsx';

export default function App() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Simple navigation links */}
      <nav className="mb-4 flex space-x-4 text-blue-600">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/history" className="hover:underline">History</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/digest/:publicId" element={<SummaryPage />} />
      </Routes>
    </div>
  );
}
