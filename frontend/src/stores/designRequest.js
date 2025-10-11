import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/index'

export const useDesignRequestStore = defineStore('designRequest', () => {
  // 状态
  const designRequests = ref([])
  const currentDesignRequest = ref(null)
  const loading = ref(false)
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // 计算属性
  const totalRequests = computed(() => pagination.value.total)
  const pendingRequests = computed(() => 
    designRequests.value.filter(req => req.status === 'pending')
  )
  const inProgressRequests = computed(() => 
    designRequests.value.filter(req => req.status === 'in_progress')
  )
  const completedRequests = computed(() => 
    designRequests.value.filter(req => req.status === 'completed')
  )

  // 获取美工需求列表
  const fetchDesignRequests = async (params = {}) => {
    loading.value = true
    try {
      const response = await api.get('/design-requests', { params })
      if (response.success) {
        designRequests.value = response.data
        if (response.pagination) {
          pagination.value = response.pagination
        }
      }
      return response
    } catch (error) {
      console.error('获取美工需求列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取单个美工需求详情
  const fetchDesignRequest = async (id) => {
    loading.value = true
    try {
      const response = await api.get(`/design-requests/${id}`)
      if (response.success) {
        currentDesignRequest.value = response.data
      }
      return response
    } catch (error) {
      console.error('获取美工需求详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建美工需求
  const createDesignRequest = async (data) => {
    loading.value = true
    try {
      const response = await api.post('/design-requests', data)
      if (response.success) {
        // 添加到列表开头
        designRequests.value.unshift(response.data)
        pagination.value.total += 1
      }
      return response
    } catch (error) {
      console.error('创建美工需求失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新美工需求
  const updateDesignRequest = async (id, data) => {
    loading.value = true
    try {
      const response = await api.put(`/design-requests/${id}`, data)
      if (response.success) {
        // 更新列表中的数据
        const index = designRequests.value.findIndex(req => req._id === id)
        if (index !== -1) {
          designRequests.value[index] = response.data
        }
        // 更新当前详情
        if (currentDesignRequest.value?._id === id) {
          currentDesignRequest.value = response.data
        }
      }
      return response
    } catch (error) {
      console.error('更新美工需求失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除美工需求
  const deleteDesignRequest = async (id) => {
    loading.value = true
    try {
      const response = await api.delete(`/design-requests/${id}`)
      if (response.success) {
        // 从列表中移除
        designRequests.value = designRequests.value.filter(req => req._id !== id)
        pagination.value.total -= 1
      }
      return response
    } catch (error) {
      console.error('删除美工需求失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 批量删除美工需求
  const batchDeleteDesignRequests = async (ids) => {
    loading.value = true
    try {
      const response = await api.delete('/design-requests/batch', { data: { ids } })
      if (response.success) {
        // 从列表中移除
        designRequests.value = designRequests.value.filter(req => !ids.includes(req._id))
        pagination.value.total -= ids.length
      }
      return response
    } catch (error) {
      console.error('批量删除美工需求失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  const resetState = () => {
    designRequests.value = []
    currentDesignRequest.value = null
    loading.value = false
    pagination.value = {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    }
  }

  return {
    // 状态
    designRequests,
    currentDesignRequest,
    loading,
    pagination,
    
    // 计算属性
    totalRequests,
    pendingRequests,
    inProgressRequests,
    completedRequests,
    
    // 方法
    fetchDesignRequests,
    fetchDesignRequest,
    createDesignRequest,
    updateDesignRequest,
    deleteDesignRequest,
    batchDeleteDesignRequests,
    resetState
  }
})

