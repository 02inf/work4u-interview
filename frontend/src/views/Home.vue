<template>
  <div class="home">
    <el-row :gutter="20">
      <!-- 左侧输入区域 -->
      <el-col :span="12">
        <el-card header="输入会议记录">
          <el-form @submit.prevent="generateSummary">
            <el-form-item>
              <el-input
                v-model="transcript"
                type="textarea"
                :rows="15"
                placeholder="请在这里粘贴会议记录..."
                maxlength="10000"
                show-word-limit
              />
            </el-form-item>
            <el-form-item>
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-button 
                    type="primary" 
                    @click="generateSummary"
                    :loading="isGenerating"
                    :disabled="!transcript.trim()"
                    style="width: 100%"
                  >
                    <el-icon><Magic /></el-icon>
                    {{ isGenerating ? '正在生成摘要...' : '生成摘要' }}
                  </el-button>
                </el-col>
                <el-col :span="12">
                  <el-button 
                    type="success" 
                    @click="generateSummaryStream"
                    :loading="isStreamGenerating"
                    :disabled="!transcript.trim()"
                    style="width: 100%"
                  >
                    <el-icon><Lightning /></el-icon>
                    {{ isStreamGenerating ? '流式生成中...' : '流式生成' }}
                  </el-button>
                </el-col>
              </el-row>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧结果区域 -->
      <el-col :span="12">
        <el-card header="生成的摘要">
          <div v-if="currentSummary" class="summary-result">
            <div class="summary-section">
              <h4>📋 会议概述</h4>
              <p>{{ currentSummary.overview }}</p>
            </div>

            <div class="summary-section" v-if="currentSummary.keyDecisions && currentSummary.keyDecisions.length">
              <h4>✅ 关键决定</h4>
              <ul>
                <li v-for="decision in currentSummary.keyDecisions" :key="decision">
                  {{ decision }}
                </li>
              </ul>
            </div>

            <div class="summary-section" v-if="currentSummary.actionItems && currentSummary.actionItems.length">
              <h4>📝 行动项目</h4>
              <el-table :data="currentSummary.actionItems" size="small">
                <el-table-column prop="task" label="任务" />
                <el-table-column prop="assignee" label="负责人" width="120" />
              </el-table>
            </div>

            <div class="summary-actions">
              <el-button @click="copyShareLink" type="success" size="small">
                <el-icon><Share /></el-icon>
                复制分享链接
              </el-button>
            </div>
          </div>

          <div v-else-if="isStreamGenerating" class="streaming-state">
            <div class="stream-content">
              <h4>🔄 实时生成中...</h4>
              <div class="stream-text">{{ streamingText }}</div>
            </div>
          </div>

          <div v-else-if="isGenerating" class="loading-state">
            <el-skeleton :rows="5" animated />
            <p style="text-align: center; margin-top: 20px;">AI正在分析会议记录并生成摘要...</p>
          </div>

          <div v-else class="empty-state">
            <el-empty description="请在左侧输入会议记录并点击生成摘要" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 历史摘要 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card header="历史摘要">
          <div v-if="summaries.length === 0" class="empty-state">
            <el-empty description="暂无历史摘要" />
          </div>
          <div v-else>
            <el-table :data="summaries" style="width: 100%">
              <el-table-column 
                prop="overview" 
                label="摘要" 
                show-overflow-tooltip
                min-width="300"
              />
              <el-table-column 
                prop="createdAt" 
                label="创建时间" 
                width="180"
                :formatter="formatDate"
              />
              <el-table-column label="操作" width="200">
                <template #default="scope">
                  <el-button @click="viewSummary(scope.row)" type="primary" size="small">
                    查看详情
                  </el-button>
                  <el-button @click="copyShareLink(scope.row)" type="success" size="small">
                    分享
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { summaryApi } from '@/services/api'
import { Magic, Share, Lightning } from '@element-plus/icons-vue'

export default {
  name: 'Home',
  components: {
    Magic,
    Share,
    Lightning
  },
  data() {
    return {
      transcript: '',
      currentSummary: null,
      summaries: [],
      isGenerating: false,
      isStreamGenerating: false,
      streamingText: ''
    }
  },
  mounted() {
    this.loadSummaries()
  },
  methods: {
    async generateSummary() {
      if (!this.transcript.trim()) {
        ElMessage.warning('请输入会议记录')
        return
      }

      this.isGenerating = true
      this.currentSummary = null

      try {
        const response = await summaryApi.generateSummary(this.transcript)
        this.currentSummary = response.data
        this.loadSummaries() // 重新加载历史记录
        ElMessage.success('摘要生成成功!')
      } catch (error) {
        console.error('生成摘要失败:', error)
        ElMessage.error('生成摘要失败，请稍后重试')
      } finally {
        this.isGenerating = false
      }
    },

    async generateSummaryStream() {
      if (!this.transcript.trim()) {
        ElMessage.warning('请输入会议记录')
        return
      }

      this.isStreamGenerating = true
      this.streamingText = ''
      this.currentSummary = null

      try {
        await summaryApi.generateSummaryStream(
          this.transcript,
          (chunk) => {
            this.streamingText += chunk
          },
          (error) => {
            console.error('流式生成失败:', error)
            ElMessage.error('流式生成失败，请稍后重试')
          }
        )
        
        // 流式完成后，尝试解析结果并保存
        this.parseStreamingResult()
        
      } catch (error) {
        console.error('流式生成失败:', error)
        ElMessage.error('流式生成失败，请稍后重试')
      } finally {
        this.isStreamGenerating = false
      }
    },

    parseStreamingResult() {
      try {
        // 尝试从流式文本中提取JSON
        const jsonStart = this.streamingText.indexOf('{')
        const jsonEnd = this.streamingText.lastIndexOf('}') + 1
        
        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          const jsonStr = this.streamingText.substring(jsonStart, jsonEnd)
          const parsed = JSON.parse(jsonStr)
          
          // 创建摘要对象
          this.currentSummary = {
            overview: parsed.overview,
            keyDecisions: parsed.keyDecisions || [],
            actionItems: parsed.actionItems || [],
            publicId: 'temp-' + Date.now(), // 临时ID
            createdAt: new Date().toISOString()
          }
          
          ElMessage.success('流式摘要生成完成!')
        }
      } catch (error) {
        console.error('解析流式结果失败:', error)
        ElMessage.warning('流式生成完成，但解析结果时出错')
      }
    },

    async loadSummaries() {
      try {
        const response = await summaryApi.getAllSummaries()
        this.summaries = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      } catch (error) {
        console.error('加载历史摘要失败:', error)
      }
    },

    viewSummary(summary) {
      this.currentSummary = summary
    },

    copyShareLink(summary = this.currentSummary) {
      if (!summary) return
      
      const shareUrl = `${window.location.origin}/summary/${summary.publicId}`
      navigator.clipboard.writeText(shareUrl).then(() => {
        ElMessage.success('分享链接已复制到剪贴板')
      }).catch(() => {
        ElMessage.error('复制失败')
      })
    },

    formatDate(row, column, cellValue) {
      return new Date(cellValue).toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
}

.summary-result {
  max-height: 500px;
  overflow-y: auto;
}

.summary-section {
  margin-bottom: 20px;
}

.summary-section h4 {
  margin-bottom: 10px;
  color: #409EFF;
}

.summary-section ul {
  margin: 0;
  padding-left: 20px;
}

.summary-section li {
  margin-bottom: 5px;
}

.summary-actions {
  margin-top: 20px;
  text-align: right;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.streaming-state {
  padding: 20px;
}

.stream-content h4 {
  color: #67C23A;
  margin-bottom: 15px;
}

.stream-text {
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
  line-height: 1.5;
}
</style>