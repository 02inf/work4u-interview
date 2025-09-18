import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { DigestDetail } from '../types';
import apiService from '../services/api';
import DigestDisplay from './DigestDisplay';

const DigestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [digest, setDigest] = useState<DigestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDigest = async () => {
      if (!id) {
        setError('Invalid digest ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 使用公共ID获取摘要详情
        const data = await apiService.getSharedDigest(id);
        setDigest(data);
      } catch (err) {
        setError(t.errors.loadFailed);
        console.error('Error loading digest:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDigest();
  }, [id, t.errors.loadFailed]);

  const handleBackToHistory = () => {
    navigate('/history');
  };

  if (loading) {
    return (
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          {t.detail.title}
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
          {t.detail.title}
        </h2>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={handleBackToHistory}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            {t.detail.backToHistory}
          </button>
        </div>
      </div>
    );
  }

  if (!digest) {
    return (
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          {t.detail.title}
        </h2>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❓</div>
          <p>Digest not found</p>
          <button 
            onClick={handleBackToHistory}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            {t.detail.backToHistory}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* 导航栏 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={handleBackToHistory}
          className="btn btn-secondary"
          style={{ fontSize: '0.875rem' }}
        >
          ← {t.detail.backToHistory}
        </button>
      </div>

      {/* 摘要内容 */}
      <DigestDisplay digest={digest} showActions={true} />
    </div>
  );
};

export default DigestDetailPage;