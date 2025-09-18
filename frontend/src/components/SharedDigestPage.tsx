import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { DigestDetail } from '../types';
import apiService from '../services/api';
import DigestDisplay from './DigestDisplay';

const SharedDigestPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const [digest, setDigest] = useState<DigestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedDigest = async () => {
      if (!publicId) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await apiService.getSharedDigest(publicId);
        setDigest(data);
      } catch (err) {
        setError(t.errors.loadFailed);
        console.error('Error loading shared digest:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSharedDigest();
  }, [publicId, t.errors.loadFailed]);

  const handleGoBack = () => {
    // 智能返回：如果有历史记录则返回上一页，否则跳转到首页
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          {language === 'zh' ? '分享的会议摘要' : 'Shared Meeting Digest'}
        </h2>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>{t.history.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          {language === 'zh' ? '分享的会议摘要' : 'Shared Meeting Digest'}
        </h2>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            {language === 'zh' ? '分享链接可能已失效或不存在' : 'Share link may be invalid or expired'}
          </p>
          <button 
            onClick={handleGoBack}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            {language === 'zh' ? '返回' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  if (!digest) {
    return (
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          {language === 'zh' ? '分享的会议摘要' : 'Shared Meeting Digest'}
        </h2>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❓</div>
          <p>{language === 'zh' ? '摘要不存在' : 'Digest not found'}</p>
          <button 
            onClick={handleGoBack}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            {language === 'zh' ? '返回' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* 分享标识 */}
      <div style={{ 
        backgroundColor: '#dbeafe', 
        border: '1px solid #3b82f6', 
        borderRadius: '0.375rem', 
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={{ fontSize: '1.125rem' }}>🔗</span>
        <span style={{ color: '#1e40af', fontWeight: '500' }}>
          {language === 'zh' ? '这是一个分享的会议摘要' : 'This is a shared meeting digest'}
        </span>
      </div>

      {/* 导航栏 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={handleGoBack}
          className="btn btn-secondary"
          style={{ fontSize: '0.875rem' }}
        >
          ← {language === 'zh' ? '返回' : 'Go Back'}
        </button>
      </div>

      {/* 摘要内容 - 不显示删除等管理操作 */}
      <DigestDisplay digest={digest} showActions={false} />
      
      {/* 底部信息 */}
      <div style={{ 
        marginTop: '2rem', 
        textAlign: 'center', 
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.375rem',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        {language === 'zh' ? 
          '想要创建您自己的会议摘要吗？' : 
          'Want to create your own meeting digest?'
        }
        <button 
          onClick={handleGoHome}
          className="btn btn-primary"
          style={{ fontSize: '0.875rem', marginLeft: '0.75rem' }}
        >
          {language === 'zh' ? '开始使用' : 'Get Started'}
        </button>
      </div>
    </div>
  );
};

export default SharedDigestPage;