import React, { useState } from 'react';

interface AiResponse {
  summary: string;
  decisions: string[];
  actions: {
    thing: string;
    assignee: string;
  }[];
}

interface IMessage {
  type: 'user' | 'ai';
  text: string | AiResponse;
}

const AiMessageContent: React.FC<{ content: AiResponse }> = ({ content }) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-semibold text-lg mb-2">Summary</h3>
      <p className="text-sm">{content.summary}</p>
    </div>
    <div>
      <h3 className="font-semibold text-lg mb-2">Decisions</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {content.decisions.map((decision, i) => (
          <li key={i}>{decision}</li>
        ))}
      </ul>
    </div>
    <div>
      <h3 className="font-semibold text-lg mb-2">Action Items</h3>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {content.actions.map((action, i) => (
          <li key={i}>
            <strong>{action.assignee}:</strong> {action.thing}
          </li>
        ))}
      </ul>
    </div>
  </div>
);


const MainContent: React.FC = () => {
  const [conversation, setConversation] = useState<IMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: IMessage = { type: 'user', text: input };
    setConversation(prev => [...prev, userMessage]);
    setInput('');

    try {
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
        const json: AiResponse = await response.json();
        const aiMessage: IMessage = { type: 'ai', text: json };
        setConversation(prev => [...prev, aiMessage]);
      } else {
        // Handle error response from server
        const errorResponse: IMessage = { type: 'ai', text: { summary: 'Sorry, something went wrong.', decisions: [], actions: []}};
        setConversation(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
      const errorResponse: IMessage = { type: 'ai', text: { summary: 'Failed to connect to the server.', decisions: [], actions: []}};
      setConversation(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
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
                className={`max-w-2xl w-full px-5 py-4 rounded-2xl shadow ${
                  msg.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                {typeof msg.text === 'string' ? <p className="text-sm">{msg.text}</p> : <AiMessageContent content={msg.text} />}
              </div>
            </div>
          ))}
           {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-2xl w-full px-5 py-4 rounded-2xl shadow bg-white text-gray-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                  <p className="text-sm">Generating...</p>
                </div>
              </div>
            </div>
          )}
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
            disabled={isLoading}
          />
          <button 
            className="ml-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? 'Sending...' : 'Generate Digest'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainContent;

