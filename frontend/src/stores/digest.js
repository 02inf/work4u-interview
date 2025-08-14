import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useDigestStore = defineStore('digest', () => {
  const digests = ref([])
  const currentDigest = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 获取所有摘要
  const fetchDigests = async () => {
    try {
      loading.value = true
      error.value = null
      const response = await axios.get('/api/digests')
      digests.value = response.data
    } catch (err) {
      error.value = '获取摘要列表失败'
      console.error('Error fetching digests:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取单个摘要
  const fetchDigest = async (id) => {
    try {
      loading.value = true
      error.value = null
      const response = await axios.get(`/api/digests/${id}`)
      currentDigest.value = response.data
      return response.data
    } catch (err) {
      error.value = '获取摘要详情失败'
      console.error('Error fetching digest:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建新摘要
  const createDigest = async (transcript) => {
    try {
      loading.value = true
      error.value = null
      const response = await axios.post('/api/digests', { transcript })
      const newDigest = response.data
      digests.value.unshift(newDigest)
      return newDigest
    } catch (err) {
      error.value = '创建摘要失败'
      console.error('Error creating digest:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 计算属性
  const sortedDigests = computed(() => {
    return [...digests.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  })

  return {
    digests,
    currentDigest,
    loading,
    error,
    sortedDigests,
    fetchDigests,
    fetchDigest,
    createDigest
  }
})
