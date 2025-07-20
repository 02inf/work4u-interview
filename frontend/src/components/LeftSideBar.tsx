import React, { useEffect, useState } from 'react';

interface IConversation {
  id: string;
  title: string;
}

const LeftSideBar: React.FC = () => {
  const [conversations, setConversations] = useState<IConversation[]>([]);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch('http://localhost:3000/conversation/list');
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        } else {
          console.error('Failed to fetch conversations');
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    }

    fetchConversations();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800 w-72 border-r border-gray-200">
      <div className="p-4">
        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300">
          + New Conversation
        </button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Recent</h2>
        <ul className="space-y-2">
          {conversations.map((convo) => (
            <li key={convo.id}>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-white rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200">
                {convo.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LeftSideBar;
