import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LeftSideBar from './components/LeftSideBar';
import MainContent from './components/MainContent';
import RightSideBar from './components/RightSideBar';
import DigestPage from './components/DigestPage';

const MainLayout: React.FC = () => (
  <div className="flex h-screen bg-white">
    <LeftSideBar />
    <MainContent />
    <RightSideBar />
  </div>
);

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />} />
      <Route path="/digest/:uuid" element={<DigestPage />} />
    </Routes>
  );
};

export default App;
