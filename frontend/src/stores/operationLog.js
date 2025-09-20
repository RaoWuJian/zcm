import { defineStore } from 'pinia'
import {
  getOperationLogs,
  getOperationLog,
  getUserOperationHistory,
  deleteOperationLogs
} from '@/api/operationLog'

export const useOperationLogStore = defineStore('operationLog', {
  state: () => ({
    logs: [],
    currentLog: null,
    pagination: {
      currentPage: 1,
      totalPages: 0,
      totalLogs: 0,
      hasNext: false,
      hasPrev: false
    },
    loading: false,
    filters: {
      operationType: '',
      module: '',
      operatorId: '',
      resourceId: '',
      startDate: '',
      endDate: '',
      keyword: '',
      sortBy: 'operatedAt',
      sortOrder: 'desc'
    }
  }),

  getters: {
    // 操作类型选项
    operationTypeOptions: () => [
      { label: '创建', value: 'CREATE' },
      { label: '更新', value: 'UPDATE' },
      { label: '删除', value: 'DELETE' },
      { label: '登录', value: 'LOGIN' },
      { label: '登出', value: 'LOGOUT' },
      { label: '审批', value: 'APPROVE' },
      { label: '拒绝', value: 'REJECT' }
    ],

    // 模块选项
    moduleOptions: () => [
      { label: '用户', value: 'USER' },
      { label: '部门', value: 'DEPARTMENT' },
      { label: '财务', value: 'FINANCE' },
      { label: '产品', value: 'PRODUCT' },
      { label: '角色', value: 'ROLE' },
      { label: '团队账户', value: 'TEAM_ACCOUNT' },
      { label: '文件', value: 'FILE' },
      { label: '佣金', value: 'COMMISSION' },
      { label: '预算', value: 'BUDGET' }
    ],

    // 格式化的日志列表
    formattedLogs: (state) => {
      return state.logs.map(log => ({
        ...log,
        operationTypeText: state.operationTypeOptions.find(opt => opt.value === log.operationType)?.label || log.operationType,
        moduleText: state.moduleOptions.find(opt => opt.value === log.module)?.label || log.module,
        resultText: log.result === 'SUCCESS' ? '成功' : '失败',
        operatedAtFormatted: new Date(log.operatedAt).toLocaleString('zh-CN')
      }))
    }
  },

  actions: {
    // 获取操作日志列表
    async fetchLogs(page = 1, limit = 20) {
      this.loading = true
      try {
        const params = {
          page,
          limit,
          ...this.filters
        }
        
        const response = await getOperationLogs(params)
        
        if (response.success) {
          this.logs = response.data
          this.pagination = response.pagination
        }
        
        return response
      } catch (error) {
        console.error('获取操作日志失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取单个操作日志详情
    async fetchLogDetail(id) {
      this.loading = true
      try {
        const response = await getOperationLog(id)
        
        if (response.success) {
          this.currentLog = response.data
        }
        
        return response
      } catch (error) {
        console.error('获取操作日志详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },



    // 获取用户操作历史
    async fetchUserHistory(userId, params = {}) {
      this.loading = true
      try {
        const response = await getUserOperationHistory(userId, params)
        return response
      } catch (error) {
        console.error('获取用户操作历史失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 删除操作日志
    async deleteLogs(data) {
      try {
        const response = await deleteOperationLogs(data)
        
        if (response.success) {
          // 重新获取日志列表
          await this.fetchLogs(this.pagination.currentPage)
        }
        
        return response
      } catch (error) {
        console.error('删除操作日志失败:', error)
        throw error
      }
    },

    // 设置筛选条件
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },

    // 重置筛选条件
    resetFilters() {
      this.filters = {
        operationType: '',
        module: '',
        operatorId: '',
        resourceId: '',
        startDate: '',
        endDate: '',
        keyword: '',
        sortBy: 'operatedAt',
        sortOrder: 'desc'
      }
    },

    // 清空当前日志详情
    clearCurrentLog() {
      this.currentLog = null
    }
  }
})
