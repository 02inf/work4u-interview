import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface DigestHistory {
  id: number;
  public_id: string;
  summary_overview: string;
  created_at: string;
  transcript_preview: string;
}

const HistoryPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [digests, setDigests] = useState<DigestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDigests();
      setDigests(data);
    } catch (err) {
      setError(t.errors.loadFailed);
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (digest: DigestHistory) => {
    if (!window.confirm(t.digest.deleteConfirm)) {
      return;
    }

    try {
      setDeletingId(digest.id);
      await apiService.deleteDigest(digest.id);
      
      // 从列表中移除已删除的项目
      setDigests(prevDigests => prevDigests.filter(d => d.id !== digest.id));
      
      // 可以添加成功提示
      console.log('摘要删除成功');
    } catch (err) {
      setError(t.errors.deleteFailed);
      console.error('Error deleting digest:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'zh' ? 'zh-CN' : 'en-US';
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          {t.history.title}
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
          {t.history.title}
        </h2>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button 
            onClick={loadHistory}
            style={{ marginTop: '1rem' }}
            className="btn btn-primary"
          >
            {language === 'zh' ? '重试' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (digests.length === 0) {
    return (
      <div className="card">
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
          {t.history.title}
        </h2>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            {t.history.noData}
          </h3>
          <p style={{ color: '#6b7280' }}>
            {language === 'zh' ? '您还没有创建过会议摘要' : 'You haven\'t created any meeting digests yet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        历史记录
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {digests.map((digest) => (
          <div key={digest.id} className="card" style={{ border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                {language === 'zh' ? `会议摘要 #${digest.id}` : `Meeting Digest #${digest.id}`}
              </h3>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {formatDate(digest.created_at)}
              </span>
            </div>
            
            <p style={{ 
              color: '#374151', 
              marginBottom: '0.75rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {digest.summary_overview}
            </p>
            
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280', 
              marginBottom: '1rem',
              fontStyle: 'italic'
            }}>
              {language === 'zh' ? '转录预览' : 'Transcript Preview'}: {digest.transcript_preview.length > 100 
                ? digest.transcript_preview.substring(0, 100) + '...'
                : digest.transcript_preview
              }
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link 
                to={`/digest/${digest.public_id}`}
                className="btn btn-primary"
                style={{ fontSize: '0.875rem' }}
              >
                {t.digest.viewDetails}
              </Link>
              <Link 
                to={`/shared/${digest.public_id}`}
                className="btn btn-secondary"
                style={{ fontSize: '0.875rem' }}
              >
                {t.digest.shareButton}
              </Link>
              <button
                onClick={() => handleDelete(digest)}
                disabled={deletingId === digest.id}
                className="btn btn-danger"
                style={{ fontSize: '0.875rem' }}
              >
                {deletingId === digest.id ? (
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
                    {language === 'zh' ? '删除中...' : 'Deleting...'}
                  </span>
                ) : (
                  t.digest.delete
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;