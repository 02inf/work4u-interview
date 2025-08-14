<template>
  <div class="digest-detail">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="digest" class="detail-content">
      <div class="header">
        <router-link to="/digests" class="back-link">← 返回列表</router-link>
        <h1>会议摘要详情</h1>
        <div class="meta">创建时间: {{ formatDate(digest.createdAt) }}</div>
      </div>

      <div class="content">
        <div class="section">
          <h2>会议概述</h2>
          <p>{{ digest.summary.overview }}</p>
        </div>

        <div class="section">
          <h2>关键决策</h2>
          <ul>
            <li v-for="decision in digest.summary.decisions" :key="decision">
              {{ decision }}
            </li>
          </ul>
        </div>

        <div class="section">
          <h2>行动项目</h2>
          <div v-for="item in digest.summary.actionItems" :key="item.task" class="action-item">
            <strong>{{ item.task }}</strong> - 负责人: {{ item.assignee }}
          </div>
        </div>

        <div class="section">
          <h2>原始记录</h2>
          <div class="transcript">{{ digest.transcript }}</div>
        </div>
      </div>

      <div class="actions">
        <button @click="shareDigest" class="share-btn">分享链接</button>
        <router-link to="/" class="new-btn">新建摘要</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDigestStore } from '../stores/digest'

const route = useRoute()
const digestStore = useDigestStore()

const loading = computed(() => digestStore.loading)
const error = computed(() => digestStore.error)
const digest = computed(() => digestStore.currentDigest)

onMounted(async () => {
  try {
    await digestStore.fetchDigest(route.params.id)
  } catch (err) {
    console.error('获取摘要详情失败:', err)
  }
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const shareDigest = async () => {
  const shareUrl = `${window.location.origin}/digest/${digest.value.id}`
  try {
    await navigator.clipboard.writeText(shareUrl)
    alert('链接已复制到剪贴板！')
  } catch (err) {
    alert('复制失败，请手动复制链接')
  }
}
</script>

<style scoped>
.digest-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
}

.error {
  color: #dc2626;
}

.header {
  margin-bottom: 2rem;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  display: block;
  margin-bottom: 1rem;
}

.back-link:hover {
  text-decoration: underline;
}

.header h1 {
  font-size: 2rem;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.meta {
  color: #6b7280;
  font-size: 0.875rem;
}

.content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
}

.section {
  margin-bottom: 2rem;
}

.section:last-child {
  margin-bottom: 0;
}

.section h2 {
  color: #1f2937;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0.5rem;
}

.section p, .section li {
  color: #4b5563;
  line-height: 1.6;
}

.section ul {
  list-style: none;
  padding: 0;
}

.section li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.section li:last-child {
  border-bottom: none;
}

.action-item {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.transcript {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 6px;
  white-space: pre-wrap;
  font-family: monospace;
  max-height: 300px;
  overflow-y: auto;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.share-btn, .new-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.share-btn {
  background: #3b82f6;
  color: white;
}

.share-btn:hover {
  background: #2563eb;
}

.new-btn {
  background: #10b981;
  color: white;
}

.new-btn:hover {
  background: #059669;
}
</style>
