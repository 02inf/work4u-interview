<template>
  <div class="summary-detail">
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="summary" class="summary-content">
      <el-page-header @back="goBack" content="摘要详情">
        <template #extra>
          <el-button @click="copyLink" type="success">
            <el-icon><Share /></el-icon>
            复制链接
          </el-button>
        </template>
      </el-page-header>

      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>会议摘要</span>
            <small style="color: #909399;">
              创建于: {{ formatDate(summary.createdAt) }}
            </small>
          </div>
        </template>

        <div class="summary-section">
          <h3>📋 会议概述</h3>
          <p class="overview">{{ summary.overview }}</p>
        </div>

        <div class="summary-section" v-if="summary.keyDecisions && summary.keyDecisions.length">
          <h3>✅ 关键决定</h3>
          <ul class="decisions-list">
            <li v-for="decision in summary.keyDecisions" :key="decision">
              {{ decision }}
            </li>
          </ul>
        </div>

        <div class="summary-section" v-if="summary.actionItems && summary.actionItems.length">
          <h3>📝 行动项目</h3>
          <el-table :data="summary.actionItems" stripe>
            <el-table-column prop="task" label="任务描述" />
            <el-table-column prop="assignee" label="负责人" width="150" />
          </el-table>
        </div>
      </el-card>
    </div>

    <div v-else class="error-state">
      <el-result
        icon="warning"
        title="摘要不存在"
        sub-title="抱歉，您要查看的摘要不存在或已被删除"
      >
        <template #extra>
          <el-button type="primary" @click="goHome">返回首页</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { summaryApi } from '@/services/api'
import { Share } from '@element-plus/icons-vue'

export default {
  name: 'Summary',
  components: {
    Share
  },
  props: {
    publicId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      summary: null,
      loading: true
    }
  },
  mounted() {
    this.loadSummary()
  },
  methods: {
    async loadSummary() {
      try {
        const response = await summaryApi.getSummaryByPublicId(this.publicId)
        this.summary = response.data
      } catch (error) {
        console.error('加载摘要失败:', error)
        this.summary = null
      } finally {
        this.loading = false
      }
    },

    copyLink() {
      const url = window.location.href
      navigator.clipboard.writeText(url).then(() => {
        ElMessage.success('链接已复制到剪贴板')
      }).catch(() => {
        ElMessage.error('复制失败')
      })
    },

    goBack() {
      this.$router.go(-1)
    },

    goHome() {
      this.$router.push('/')
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleString('zh-CN')
    }
  }
}
</script>

<style scoped>
.summary-detail {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-section {
  margin-bottom: 30px;
}

.summary-section h3 {
  color: #409EFF;
  margin-bottom: 15px;
  font-size: 18px;
}

.overview {
  font-size: 16px;
  line-height: 1.6;
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #409EFF;
}

.decisions-list {
  margin: 0;
  padding-left: 20px;
}

.decisions-list li {
  margin-bottom: 10px;
  line-height: 1.5;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px 20px;
}
</style>