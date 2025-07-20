import React, { useState } from 'react';

const MainContent: React.FC = () => {
  const [message, setMessage] = useState('')
  const [input, setInput] = useState('')
  async function handleSubmit() {
    const response = await fetch('http://localhost:3000/ai/generation', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input
      })
    })
    if (response.ok) {
      setMessage(await response.text())
    }
  }

  return (
    <div className="flex flex-col flex-grow h-screen">
      <div className="flex-grow p-4 bg-white">
        {/* Messages will go here */}
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center">
          <textarea
            rows={10}
            placeholder="Type your message..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainContent;
