<template>
  <div class="digest-list">
    <div class="header">
      <h2>所有摘要</h2>
      <router-link to="/" class="new-digest-btn">
        <span>+</span> 新建摘要
      </router-link>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="retry" class="retry-btn">重试</button>
    </div>

    <div v-else-if="digestStore.sortedDigests.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>还没有摘要</h3>
      <p>创建您的第一个AI会议摘要</p>
      <router-link to="/" class="create-first-btn">
        开始创建
      </router-link>
    </div>

    <div v-else class="digest-grid">
      <div
        v-for="digest in digestStore.sortedDigests"
        :key="digest.id"
        class="digest-card"
        @click="viewDigest(digest.id)"
      >
        <div class="card-header">
          <div class="timestamp">
            {{ formatDate(digest.createdAt) }}
          </div>
          <div class="actions">
            <button
              @click.stop="shareDigest(digest.id)"
              class="share-btn"
              title="分享链接"
            >
              📤
            </button>
          </div>
        </div>

        <div class="card-content">
          <div class="overview">
            <h4>会议概述</h4>
            <p>{{ truncateText(digest.summary.overview, 120) }}</p>
          </div>

          <div class="stats">
            <div class="stat">
              <span class="stat-label">决策</span>
              <span class="stat-value">{{ digest.summary.decisions.length }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">行动项目</span>
              <span class="stat-value">{{ digest.summary.actionItems.length }}</span>
            </div>
          </div>

          <div class="preview">
            <div v-if="digest.summary.decisions.length > 0" class="preview-section">
              <strong>关键决策:</strong>
              <ul>
                <li v-for="decision in digest.summary.decisions.slice(0, 2)" :key="decision">
                  {{ truncateText(decision, 60) }}
                </li>
                <li v-if="digest.summary.decisions.length > 2" class="more-items">
                  +{{ digest.summary.decisions.length - 2 }} 更多
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="card-footer">
          <span class="view-details">点击查看详情 →</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDigestStore } from '../stores/digest'

const router = useRouter()
const digestStore = useDigestStore()

const loading = computed(() => digestStore.loading)
const error = computed(() => digestStore.error)

onMounted(() => {
  digestStore.fetchDigests()
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '今天'
  } else if (diffDays === 2) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays - 1}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
}

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const viewDigest = (id) => {
  router.push(`/digest/${id}`)
}

const shareDigest = async (id) => {
  const shareUrl = `${window.location.origin}/digest/${id}`
  try {
    await navigator.clipboard.writeText(shareUrl)
    alert('链接已复制到剪贴板！')
  } catch (err) {
    console.error('复制失败:', err)
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = shareUrl
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert('链接已复制到剪贴板！')
  }
}

const retry = () => {
  digestStore.fetchDigests()
}
</script>

<style scoped>
.digest-list {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 2rem;
  color: #1f2937;
  margin: 0;
}

.new-digest-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.new-digest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.new-digest-btn span {
  font-size: 1.2rem;
  font-weight: bold;
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error p {
  color: #dc2626;
  margin-bottom: 1rem;
}

.retry-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.retry-btn:hover {
  background: #2563eb;
}

.empty-state .empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.create-first-btn {
  background: #10b981;
  color: white;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.create-first-btn:hover {
  background: #059669;
  transform: translateY(-2px);
}

.digest-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.digest-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.digest-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.timestamp {
  color: #6b7280;
  font-size: 0.875rem;
}

.share-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.share-btn:hover {
  background: #f3f4f6;
}

.card-content {
  margin-bottom: 1rem;
}

.overview h4 {
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.overview p {
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f9fafb;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  min-width: 60px;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #667eea;
}

.preview-section {
  margin-bottom: 0.5rem;
}

.preview-section strong {
  color: #374151;
  font-size: 0.875rem;
}

.preview-section ul {
  list-style: none;
  padding: 0;
  margin-top: 0.5rem;
}

.preview-section li {
  color: #4b5563;
  font-size: 0.875rem;
  padding: 0.25rem 0;
  line-height: 1.4;
}

.more-items {
  color: #6b7280;
  font-style: italic;
}

.card-footer {
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.view-details {
  color: #667eea;
  font-size: 0.875rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .digest-grid {
    grid-template-columns: 1fr;
  }
  
  .digest-card {
    padding: 1rem;
  }
}
</style>
