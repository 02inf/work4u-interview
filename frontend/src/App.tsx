import React from 'react';
import LeftSideBar from './components/LeftSideBar';
import MainContent from './components/MainContent';
import RightSideBar from './components/RightSideBar';

const App: React.FC = () => {
  return (
    <div className="flex h-screen bg-white">
      <LeftSideBar />
      <MainContent />
      <RightSideBar />
    </div>
  );
};

export default App;