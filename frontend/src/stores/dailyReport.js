import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { dailyReportApi } from '../api/index'

export const useDailyReportStore = defineStore('dailyReport', () => {
  // 状态
  const reports = ref([])
  const loading = ref(false)
  const pagination = ref({
    current: 1,
    total: 0,
    pageSize: 10,
    pages: 0
  })

  // 计算属性
  const profitableReports = computed(() => {
    return reports.value.filter(report => report.roi > 1)
  })

  const topROIReports = computed(() => {
    return [...reports.value]
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5)
  })

  // 方法
  const fetchReports = async (params = {}) => {
    try {
      loading.value = true
      const response = await dailyReportApi.getDailyReports(params)

      if (response.success && response.data) {
        reports.value = response.data || []
        pagination.value = {
          current: response.pagination?.current || 1,
          total: response.pagination?.total || 0,
          pageSize: response.pagination?.pageSize || 10,
          pages: response.pagination?.pages || 0
        }

        // 返回数据和可能的统计信息
        return {
          success: true,
          data: response.data,
          total: response.pagination?.total || 0,
          tabCounts: response.tabCounts // 包含Tab统计信息
        }
      } else {
        return { success: false, message: response.message || '获取日报列表失败' }
      }
    } catch (error) {
      console.error('获取日报列表失败:', error)
      return { success: false, message: '获取日报列表时发生错误' }
    } finally {
      loading.value = false
    }
  }


  const getReport = async (id) => {
    try {
      const response = await dailyReportApi.getDailyReport(id)
      
      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取日报详情失败' }
      }
    } catch (error) {
      console.error('获取日报详情失败:', error)
      return { success: false, message: '获取日报详情时发生错误' }
    }
  }

  const addReport = async (reportData) => {
    try {
      const response = await dailyReportApi.createDailyReport(reportData)

      if (response.success) {
        // 重新获取列表
        await fetchReports()
        return { 
          success: true, 
          message: response.message || '添加日报成功',
          data: response.data,
          notificationData: response.notificationData 
        }
      } else {
        return { success: false, message: response.message || '添加日报失败' }
      }
    } catch (error) {
      console.error('添加日报失败:', error)
      return { success: false, message: '添加日报时发生错误' }
    }
  }

  const updateReport = async (id, reportData) => {
    try {
      const response = await dailyReportApi.updateDailyReport(id, reportData)
      
      if (response.success) {
        // 重新获取列表
        await fetchReports()
        return { success: true, message: response.message || '更新日报成功' }
      } else {
        return { success: false, message: response.message || '更新日报失败' }
      }
    } catch (error) {
      console.error('更新日报失败:', error)
      return { success: false, message: '更新日报时发生错误' }
    }
  }

  const deleteReport = async (id) => {
    try {
      const response = await dailyReportApi.deleteDailyReport(id)
      
      if (response.success) {
        // 重新获取列表
        await fetchReports()
        return { success: true, message: response.message || '删除日报成功' }
      } else {
        return { success: false, message: response.message || '删除日报失败' }
      }
    } catch (error) {
      console.error('删除日报失败:', error)
      return { success: false, message: '删除日报时发生错误' }
    }
  }

  const clearReports = () => {
    reports.value = []
    pagination.value = {
      current: 1,
      total: 0,
      pageSize: 10,
      pages: 0
    }
  }

  // 实时计算预览数据
  const calculatePreview = (formData) => {
    const promotionCost = parseFloat(formData.promotionCost) || 0
    const totalSalesAmount = parseFloat(formData.totalSalesAmount) || 0
    const totalSalesQuantity = parseInt(formData.totalSalesQuantity) || 0
    
    // 计算平均订单价值
    const avgOrderValue = totalSalesQuantity > 0 
      ? (totalSalesAmount / totalSalesQuantity).toFixed(2)
      : 0
    
    // 计算单位获客成本
    const costPerAcquisition = totalSalesQuantity > 0
      ? (promotionCost / totalSalesQuantity).toFixed(2)
      : 0
    
    return {
      avgOrderValue: parseFloat(avgOrderValue),
      costPerAcquisition: parseFloat(costPerAcquisition)
    }
  }

  // 格式化日期为显示格式
  const formatReportDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 格式化货币显示
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '¥0.00'
    return `¥${parseFloat(amount).toLocaleString('zh-CN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  // 格式化ROI显示
  const formatROI = (roi) => {
    if (!roi && roi !== 0) return '0.00'
    return parseFloat(roi).toFixed(2)
  }

  return {
    // 状态
    reports,
    loading,
    pagination,

    // 计算属性
    profitableReports,
    topROIReports,

    // 方法
    fetchReports,
    getReport,
    addReport,
    updateReport,
    deleteReport,
    clearReports,
    calculatePreview,
    formatReportDate,
    formatCurrency,
    formatROI
  }
})
