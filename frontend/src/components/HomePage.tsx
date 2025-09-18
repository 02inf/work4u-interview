import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { DigestResponse, StreamStatus } from '../types';
import DigestDisplay from './DigestDisplay';
import { useLanguage } from '../contexts/LanguageContext';

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [useStreaming, setUseStreaming] = useState(false);
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 流式响应状态
  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);
  const [streamContent, setStreamContent] = useState('');

  // 从localStorage恢复表单状态
  useEffect(() => {
    const savedTranscript = localStorage.getItem('meetingTranscript');
    if (savedTranscript) {
      setTranscript(savedTranscript);
    }
  }, []);

  // 保存transcript到localStorage
  useEffect(() => {
    if (transcript) {
      localStorage.setItem('meetingTranscript', transcript);
    }
  }, [transcript]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transcript.trim()) {
      setError(t.errors.transcriptRequired);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (useStreaming) {
        await handleStreamingGeneration();
      } else {
        await handleNormalGeneration();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.generateFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleNormalGeneration = async () => {
    const result = await ApiService.createDigest({ transcript });
    setDigest(result);
  };

  const handleStreamingGeneration = async () => {
    console.log('🚀 Starting streaming generation...');
    setError(null);
    setDigest(null);
    setStreamStatus({ status: 'started' });
    setStreamContent('');
    
    try {
      const stream = await ApiService.createDigestStream({ transcript });
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Stream reading completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('🔍 Received chunk:', chunk);
        buffer += chunk;
        
        // 处理完整的SSE事件 (以\n\n分隔)
        const events = buffer.split('\n\n');
        buffer = events.pop() || ''; // 保留不完整的事件
        
        for (const event of events) {
          if (event.trim()) {
            const lines = event.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.substring(6).trim(); // 移除 'data: ' 前缀
                  console.log('🎯 Processing JSON:', jsonStr);
                  if (jsonStr) {
                    const data = JSON.parse(jsonStr);
                    console.log('✅ Parsed data:', data);
                    
                    // 更新状态
                    setStreamStatus(data);
                    
                    if (data.chunk) {
                      console.log('📝 Adding chunk:', data.chunk);
                      setStreamContent(prev => prev + data.chunk);
                    }
                    
                    if (data.status === 'completed' && data.result) {
                      console.log('🎉 Generation completed');
                      setDigest(data.result);
                    }
                    
                    if (data.status === 'error') {
                      setError(data.message || '流式生成失败');
                      break;
                    }
                  }
                } catch (parseError) {
                  console.warn('❌ Parse error:', parseError, 'Raw line:', line);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Stream error:', err);
      setError(err instanceof Error ? err.message : '流式生成失败');
    }
  };

  const handleReset = () => {
    setTranscript('');
    setDigest(null);
    setError(null);
    setStreamStatus(null);
    setStreamContent('');
    localStorage.removeItem('meetingTranscript');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          {t.createDigest}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="transcript" className="form-label">
              {t.transcriptLabel}
            </label>
            <textarea
              id="transcript"
              className="form-input"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={t.transcriptPlaceholder}
              required
              minLength={10}
              rows={8}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              id="streaming"
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
            />
            <label htmlFor="streaming">
              {t.streamingOption}
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              disabled={loading || !transcript.trim()}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
                  {useStreaming ? t.realTimeGenerating : t.generating}...
                </span>
              ) : (
                t.generateButton
              )}
            </button>
            
            {(digest || streamContent) && (
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
              >
                {t.reset}
              </button>
            )}
          </div>
        </form>

        {/* 错误显示 */}
        {error && (
          <div className="alert alert-error" style={{ marginTop: '1.5rem' }}>
            ❌ {error}
          </div>
        )}

        {/* 调试信息 */}
        {useStreaming && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#f3f4f6', fontSize: '0.75rem' }}>
            <strong>调试信息:</strong><br/>
            useStreaming: {String(useStreaming)}<br/>
            streamStatus: {streamStatus ? JSON.stringify(streamStatus) : 'null'}<br/>
            streamContent length: {streamContent.length}<br/>
            loading: {String(loading)}
          </div>
        )}

        {/* 流式生成状态显示 */}
        {useStreaming && streamStatus && (
          <div className="alert alert-info" style={{ marginTop: '1.5rem' }}>
            {streamStatus.status === 'started' && t.status.started}
            {streamStatus.status === 'generating' && (
              <div>
                <div>{t.status.generating}</div>
                {streamContent && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}>
                    <strong>实时内容:</strong>
                    <div style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>{streamContent}</div>
                  </div>
                )}
              </div>
            )}
            {streamStatus.status === 'completed' && t.status.completed}
            {streamStatus.status === 'error' && `${t.status.error}: ${streamStatus.message}`}
          </div>
        )}

        {/* 强制显示流式内容（用于调试） */}
        {useStreaming && streamContent && (
          <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
            <strong>原始流式内容:</strong>
            <div style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {streamContent}
            </div>
          </div>
        )}

        {/* 结果显示 */}
        {digest && (
          <div style={{ marginTop: '2rem' }}>
            <DigestDisplay digest={digest} showActions={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;