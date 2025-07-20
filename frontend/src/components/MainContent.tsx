import React from 'react';

const MainContent: React.FC = () => {
  return (
    <div className="flex flex-col flex-grow h-screen">
      <div className="flex-grow p-4 bg-white">
        {/* Messages will go here */}
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Type your message..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
