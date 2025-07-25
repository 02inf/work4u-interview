import React from 'react';

const RightSideBar: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800 w-64 border-l border-gray-200">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        {/* Settings will go here */}
      </div>
    </div>
  );
};

export default RightSideBar;
