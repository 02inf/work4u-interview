import React from 'react';

const LeftSideBar: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800 w-64 border-r border-gray-200">
      <div className="p-4">
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          New Conversation
        </button>
      </div>
      <div className="flex-grow p-4">
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        {/* Conversation list will go here */}
      </div>
    </div>
  );
};

export default LeftSideBar;
