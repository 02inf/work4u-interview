import React, { useState } from 'react';

interface IMessage {
  type: 'user' | 'ai';
  text: string;
}

const MainContent: React.FC = () => {
  const [conversation, setConversation] = useState<IMessage[]>([]);
  const [input, setInput] = useState('');

  async function handleSubmit() {
    if (!input.trim()) return;

    const userMessage: IMessage = { type: 'user', text: input };
    setConversation(prev => [...prev, userMessage]);

    const response = await fetch('http://localhost:3000/ai/generation', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input
      })
    });

    if (response.ok) {
      const json = await response.json();
      const aiMessage: IMessage = { type: 'ai', text: json.text };
      setConversation(prev => [...prev, aiMessage]);
    }
    setInput('');
  }

  return (
    <div className="flex flex-col flex-grow h-screen bg-gray-50">
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="space-y-6">
          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg px-4 py-3 rounded-2xl shadow ${
                  msg.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-start">
          <textarea
            rows={4}
            placeholder="Enter your meeting transcript here..."
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button 
            className="ml-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
