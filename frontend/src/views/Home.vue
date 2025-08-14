<template>
  <div class="home">
    <div class="hero-section">
      <h2>开始您的AI会议摘要</h2>
      <p>粘贴会议记录，让AI为您生成结构化摘要</p>
    </div>

    <div class="main-content">
      <div class="input-section">
        <h3>会议记录</h3>
        <div class="transcript-input">
          <textarea
            v-model="transcript"
            placeholder="请在此粘贴您的会议记录..."
            :disabled="loading"
            rows="12"
          ></textarea>
          <div class="input-footer">
            <span class="char-count">{{ transcript.length }} 字符</span>
            <button
              @click="clearTranscript"
              class="clear-btn"
              :disabled="!transcript.trim()"
            >
              清空
            </button>
          </div>
        </div>

        <button
          @click="generateDigest"
          :disabled="!transcript.trim() || loading"
          class="generate-btn"
        >
          <span v-if="loading">生成中...</span>
          <span v-else>生成摘要</span>
        </button>
      </div>

      <div v-if="currentDigest" class="result-section">
        <h3>生成的摘要</h3>
        <div class="digest-content">
          <div class="overview">
            <h4>会议概述</h4>
            <p>{{ currentDigest.summary.overview }}</p>
          </div>
          
          <div class="decisions">
            <h4>关键决策</h4>
            <ul>
              <li v-for="decision in currentDigest.summary.decisions" :key="decision">
                {{ decision }}
              </li>
            </ul>
          </div>
          
          <div class="action-items">
            <h4>行动项目</h4>
            <ul>
              <li v-for="item in currentDigest.summary.actionItems" :key="item.task">
                <strong>{{ item.task }}</strong> - 负责人: {{ item.assignee }}
              </li>
            </ul>
          </div>
        </div>

        <div class="actions">
          <button @click="saveDigest" class="save-btn">保存摘要</button>
          <button @click="shareDigest" class="share-btn">分享链接</button>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <div class="quick-actions">
      <router-link to="/digests" class="view-all-btn">
        查看所有摘要
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDigestStore } from '../stores/digest'

const router = useRouter()
const digestStore = useDigestStore()

const transcript = ref('')
const currentDigest = ref(null)

const loading = computed(() => digestStore.loading)
const error = computed(() => digestStore.error)

const clearTranscript = () => {
  transcript.value = ''
  currentDigest.value = null
}

const generateDigest = async () => {
  if (!transcript.value.trim()) return
  
  try {
    const digest = await digestStore.createDigest(transcript.value)
    currentDigest.value = digest
    // 自动滚动到结果部分
    setTimeout(() => {
      document.querySelector('.result-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  } catch (err) {
    console.error('生成摘要失败:', err)
  }
}

const saveDigest = () => {
  if (currentDigest.value) {
    router.push(`/digest/${currentDigest.value.id}`)
  }
}

const shareDigest = async () => {
  if (currentDigest.value) {
    const shareUrl = `${window.location.origin}/digest/${currentDigest.value.id}`
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
}
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
}

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-section h2 {
  font-size: 2rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.hero-section p {
  color: #6b7280;
  font-size: 1.1rem;
}

.main-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
}

.input-section h3 {
  margin-bottom: 1rem;
  color: #1f2937;
  font-size: 1.25rem;
}

.transcript-input {
  margin-bottom: 1.5rem;
}

textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s;
}

textarea:focus {
  outline: none;
  border-color: #667eea;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.char-count {
  color: #6b7280;
  font-size: 0.875rem;
}

.clear-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.clear-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generate-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.result-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.result-section h3 {
  margin-bottom: 1.5rem;
  color: #1f2937;
  font-size: 1.25rem;
}

.digest-content {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.overview, .decisions, .action-items {
  margin-bottom: 1.5rem;
}

.overview:last-child, .decisions:last-child, .action-items:last-child {
  margin-bottom: 0;
}

.overview h4, .decisions h4, .action-items h4 {
  color: #374151;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.overview p {
  color: #4b5563;
  line-height: 1.6;
}

.decisions ul, .action-items ul {
  list-style: none;
  padding: 0;
}

.decisions li, .action-items li {
  color: #4b5563;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  line-height: 1.5;
}

.decisions li:last-child, .action-items li:last-child {
  border-bottom: none;
}

.actions {
  display: flex;
  gap: 1rem;
}

.save-btn, .share-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: #10b981;
  color: white;
}

.save-btn:hover {
  background: #059669;
}

.share-btn {
  background: #3b82f6;
  color: white;
}

.share-btn:hover {
  background: #2563eb;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #fecaca;
  margin-top: 1rem;
}

.quick-actions {
  text-align: center;
}

.view-all-btn {
  display: inline-block;
  background: #f3f4f6;
  color: #374151;
  text-decoration: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.view-all-btn:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .hero-section h2 {
    font-size: 1.75rem;
  }
}
</style>
