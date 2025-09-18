import React, { useState } from 'react';
import { DigestResponse, DigestDetail } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface DigestDisplayProps {
  digest: DigestResponse | DigestDetail;
  showActions?: boolean;
}

const DigestDisplay: React.FC<DigestDisplayProps> = ({ digest, showActions = false }) => {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/shared/${digest.public_id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 备用方案：创建临时输入框
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return new Date(dateString).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card fade-in">
      {/* 头部信息 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
            {t.appTitle}
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {t.history.createdAt}: {formatDate(digest.created_at)}
          </p>
        </div>
        
        {showActions && (
          <div>
            <button
              onClick={handleShare}
              className={`btn ${copied ? 'btn-secondary' : 'btn-primary'}`}
              style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
            >
              {copied ? t.digest.shareSuccess : t.digest.shareButton}
            </button>
          </div>
        )}
      </div>

      {/* 概述部分 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '0.5rem' }}>📋</span>
          {t.digest.overview}
        </h4>
        <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.375rem' }}>
          <p style={{ color: '#374151', lineHeight: '1.6' }}>
            {digest.summary_overview || (language === 'zh' ? '暂无概述内容' : 'No overview content')}
          </p>
        </div>
      </div>

      {/* 关键决策 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '0.5rem' }}>⚡</span>
          {t.digest.keyDecisions}
        </h4>
        {digest.key_decisions && digest.key_decisions.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {digest.key_decisions.map((decision, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '1.5rem', 
                  height: '1.5rem', 
                  backgroundColor: '#dbeafe', 
                  color: '#1e40af', 
                  fontSize: '0.75rem', 
                  fontWeight: '500',
                  borderRadius: '50%', 
                  marginRight: '0.75rem',
                  marginTop: '0.125rem',
                  flexShrink: 0
                }}>
                  {index + 1}
                </span>
                <span style={{ color: '#374151' }}>{decision}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>{language === 'zh' ? '未识别到明确的决策内容' : 'No clear decisions identified'}</p>
        )}
      </div>

      {/* 行动项目 */}
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '0.5rem' }}>✅</span>
          {t.digest.actionItems}
        </h4>
        {digest.action_items && digest.action_items.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {digest.action_items.map((item, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: '1.5rem', 
                  height: '1.5rem', 
                  backgroundColor: '#dcfce7', 
                  color: '#166534', 
                  fontSize: '0.75rem', 
                  fontWeight: '500',
                  borderRadius: '50%', 
                  marginRight: '0.75rem',
                  marginTop: '0.125rem',
                  flexShrink: 0
                }}>
                  {index + 1}
                </span>
                <span style={{ color: '#374151' }}>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#6b7280', fontStyle: 'italic' }}>{language === 'zh' ? '未识别到明确的行动项目' : 'No clear action items identified'}</p>
        )}
      </div>

      {/* 原始转录（如果有的话） */}
      {'original_transcript' in digest && (digest as any).original_transcript && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <details>
            <summary style={{ cursor: 'pointer', fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '0.5rem' }}>📝</span>
              {t.detail.originalTranscript}
              <svg style={{ marginLeft: '0.5rem', width: '1rem', height: '1rem', transform: 'rotate(0deg)', transition: 'transform 0.2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </summary>
            <div style={{ marginTop: '0.75rem', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.375rem' }}>
              <pre style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
                {(digest as any).original_transcript}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default DigestDisplay;