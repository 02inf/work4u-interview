import React, { useState } from 'react';
import { createDigest, createDigestWithStreaming } from '../utils/apiService';

const TranscriptInput = ({ onDigestCreated }) => {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [progress, setProgress] = useState({ message: '', progress: 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!transcript.trim()) {
      setError('Please enter a meeting transcript');
      return;
    }

    setIsLoading(true);
    setError('');
    setProgress({ message: 'Preparing...', progress: 0 });

    try {
      console.log('Submitting transcript:', transcript.substring(0, 100) + '...');
      
      if (streamingEnabled) {
        // Use streaming API
        const digest = await createDigestWithStreaming(
          transcript,
          // onProgress
          (progressData) => {
            setProgress({
              message: progressData.message || 'Processing...',
              progress: progressData.progress || 0
            });
          },
          // onComplete
          (digest) => {
            console.log('Received digest via streaming:', digest);
            setTranscript('');
            setProgress({ message: 'Complete!', progress: 100 });
            onDigestCreated(digest);
          },
          // onError
          (error) => {
            console.error('Streaming error:', error);
            setError(error.message || 'Failed to create digest. Please try again.');
          }
        );
      } else {
        // Use regular API
        const digest = await createDigest(transcript);
        console.log('Received digest:', digest);
        
        if (digest && digest.id) {
          setTranscript('');
          onDigestCreated(digest);
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (err) {
      console.error('Error creating digest:', err);
      setError(err.message || 'Failed to create digest. Please try again.');
      setProgress({ message: '', progress: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setTranscript('');
    setError('');
  };

  const exampleText = `John: Good morning everyone, let's start our weekly standup.
Sarah: I've completed the social media strategy and we're seeing a 25% increase in engagement. However, we need to discuss the budget for next quarter.
Mike: Great progress! I've finished the mobile app wireframes. We should schedule a design review meeting for next week.
John: Perfect. Let's also discuss the Q4 roadmap. Sarah, can you prepare a budget proposal by Friday?
Sarah: Will do, I'll have the proposal ready by Thursday.
Mike: I'll coordinate with the design team for the review meeting.`;

  const handleUseExample = () => {
    setTranscript(exampleText);
    setError('');
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input area title */}
        <div className="flex items-center justify-between">
          <label htmlFor="transcript" className="text-sm font-medium text-gray-700">
            Meeting Transcript
          </label>
          <div className="flex items-center space-x-3">
            {/* Streaming toggle switch */}
            <div className="flex items-center space-x-2">
              <label className="text-xs text-gray-500">Real-time</label>
              <button
                type="button"
                onClick={() => setStreamingEnabled(!streamingEnabled)}
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                  streamingEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    streamingEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            {transcript && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleUseExample}
              className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              Use Example
            </button>
          </div>
        </div>

        {/* Main input area */}
        <div className="relative">
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your meeting transcript here...

Format example:
Speaker: Their message content
Another Speaker: Their response..."
            className="w-full h-80 p-6 text-gray-700 placeholder-gray-400 bg-white border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-base leading-relaxed"
            disabled={isLoading}
          />
          
          {/* Character count and status */}
          <div className="absolute bottom-4 right-6 flex items-center space-x-3">
            {transcript && !isLoading && (
              <span className="text-xs text-gray-400 font-mono">
                {transcript.length.toLocaleString()} chars
              </span>
            )}
            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>{streamingEnabled ? progress.message || 'Processing...' : 'Processing...'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Streaming progress bar */}
        {isLoading && streamingEnabled && progress.progress > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{progress.message}</span>
              <span className="text-blue-600 font-medium">{progress.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isLoading || !transcript.trim()}
            className="group px-8 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-3 min-w-[180px] justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate Summary</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Feature description - minimal version */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 mb-6">
          AI will analyze your transcript and extract:
        </p>
        <div className="inline-flex flex-wrap justify-center gap-6 text-xs text-gray-400">
          <span className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <span>Key Points</span>
          </span>
          <span className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Action Items</span>
          </span>
          <span className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            <span>Decisions</span>
          </span>
          <span className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
            <span>Next Steps</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TranscriptInput;