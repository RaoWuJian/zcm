import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { commissionAccountingApi } from '../api/index'
import { precisionCalculate } from '@/utils/precision'

export const useCommissionAccountingStore = defineStore('commissionAccounting', () => {
  // 状态
  const commissionAccountings = ref([])
  const loading = ref(false)
  const pagination = ref({
    current: 1,
    total: 0,
    count: 0,
    totalRecords: 0
  })
  
  // 计算属性
  const profitableAccountings = computed(() => {
    return commissionAccountings.value.filter(accounting => accounting.netProfit > 0)
  })
  
  const lossAccountings = computed(() => {
    return commissionAccountings.value.filter(accounting => accounting.netProfit < 0)
  })
  
  const topProfitAccountings = computed(() => {
    return [...commissionAccountings.value]
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 10)
  })
  
  const averageCommission = computed(() => {
    if (commissionAccountings.value.length === 0) return 0
    const total = commissionAccountings.value.reduce((sum, accounting) => sum + accounting.commission, 0)
    return total / commissionAccountings.value.length
  })
  
  const totalCommissionProfit = computed(() => {
    return commissionAccountings.value.reduce((sum, accounting) => sum + accounting.commissionProfit, 0)
  })
  
  const totalNetProfit = computed(() => {
    return commissionAccountings.value.reduce((sum, accounting) => sum + accounting.netProfit, 0)
  })
  
  const totalNetTransactionData = computed(() => {
    return commissionAccountings.value.reduce((sum, accounting) => sum + accounting.netTransactionData, 0)
  })
  
  // 方法
  const fetchCommissionAccountings = async (params = {}) => {
    try {
      loading.value = true
      const response = await commissionAccountingApi.getCommissionAccountings(params)
      
      if (response.success && response.data) {
        commissionAccountings.value = response.data || []
        pagination.value = {
          current: response.pagination?.current || 1,
          total: response.pagination?.total || 0,
          count: response.pagination?.count || 0,
          totalRecords: response.pagination?.totalRecords || 0
        }
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取核算佣金列表失败' }
      }
    } catch (error) {
      return { success: false, message: '获取核算佣金列表时发生错误' }
    } finally {
      loading.value = false
    }
  }
  
  const addCommissionAccounting = async (accountingData) => {
    try {
      const response = await commissionAccountingApi.createCommissionAccounting(accountingData)

      if (response.success) {
        // 重新获取列表
        await fetchCommissionAccountings()
        return { success: true, message: response.message || '添加核算佣金成功' }
      } else {
        return { success: false, message: response.message || '添加核算佣金失败' }
      }
    } catch (error) {
      return { success: false, message: '添加核算佣金时发生错误' }
    }
  }

  const batchAddCommissionAccounting = async (records) => {
    try {
      const response = await commissionAccountingApi.batchCreateCommissionAccounting(records)

      if (response.success) {
        // 重新获取列表
        await fetchCommissionAccountings()
        return { success: true, message: response.message || '批量添加核算佣金成功', data: response.data }
      } else {
        return { success: false, message: response.message || '批量添加核算佣金失败', errors: response.errors }
      }
    } catch (error) {
      return { success: false, message: '批量添加核算佣金时发生错误' }
    }
  }
  
  const updateCommissionAccounting = async (id, accountingData) => {
    try {
      const response = await commissionAccountingApi.updateCommissionAccounting(id, accountingData)
      
      if (response.success) {
        // 重新获取列表
        await fetchCommissionAccountings()
        return { success: true, message: response.message || '更新核算佣金成功' }
      } else {
        return { success: false, message: response.message || '更新核算佣金失败' }
      }
    } catch (error) {
      return { success: false, message: '更新核算佣金时发生错误' }
    }
  }
  
  const deleteCommissionAccounting = async (id) => {
    try {
      const response = await commissionAccountingApi.deleteCommissionAccounting(id)
      
      if (response.success) {
        // 重新获取列表
        await fetchCommissionAccountings()
        return { success: true, message: response.message || '删除核算佣金成功' }
      } else {
        return { success: false, message: response.message || '删除核算佣金失败' }
      }
    } catch (error) {
      return { success: false, message: '删除核算佣金时发生错误' }
    }
  }
  
  const batchDeleteCommissionAccountings = async (ids) => {
    try {
      const response = await commissionAccountingApi.batchDeleteCommissionAccountings(ids)
      
      if (response.success) {
        // 重新获取列表
        await fetchCommissionAccountings()
        return { success: true, message: response.message || '批量删除核算佣金成功' }
      } else {
        return { success: false, message: response.message || '批量删除核算佣金失败' }
      }
    } catch (error) {
      return { success: false, message: '批量删除核算佣金时发生错误' }
    }
  }
  
  const clearCommissionAccountings = () => {
    commissionAccountings.value = []
    pagination.value = {
      current: 1,
      total: 0,
      count: 0,
      totalRecords: 0
    }
  }
  
  // 计算核算佣金数据（用于实时预览）
  const calculateCommissionAccounting = (data) => {
    const netTransactionData = parseFloat(data.netTransactionData) || 0
    const commission = parseFloat(data.commission) || 0
    const dailyConsumption = parseFloat(data.dailyConsumption) || 0

    // 佣金利润 = 净成交数据 × 佣金%
    const commissionProfit = precisionCalculate.multiply(
      netTransactionData,
      precisionCalculate.divide(commission, 100)
    )

    // 净利润 = 佣金利润 - 今日消耗
    const netProfit = precisionCalculate.subtract(commissionProfit, dailyConsumption)

    return {
      commissionProfit,
      netProfit
    }
  }

  // 获取店铺名称建议
  const fetchShopNameSuggestions = async () => {
    try {
      const response = await commissionAccountingApi.getShopNameSuggestions()
      if (response.success) {
        return { success: true, data: response.data || [] }
      } else {
        return { success: false, message: response.message || '获取店铺名称建议失败' }
      }
    } catch (error) {
      return { success: false, message: '获取店铺名称建议时发生错误' }
    }
  }

  // 获取平台建议
  const fetchPlatformSuggestions = async () => {
    try {
      const response = await commissionAccountingApi.getPlatformSuggestions()
      if (response.success) {
        return { success: true, data: response.data || [] }
      } else {
        return { success: false, message: response.message || '获取平台建议失败' }
      }
    } catch (error) {
      return { success: false, message: '获取平台建议时发生错误' }
    }
  }

  // 获取产品名称建议
  const fetchProductNameSuggestions = async () => {
    try {
      const response = await commissionAccountingApi.getProductNameSuggestions()
      if (response.success) {
        return { success: true, data: response.data || [] }
      } else {
        return { success: false, message: response.message || '获取产品名称建议失败' }
      }
    } catch (error) {
      return { success: false, message: '获取产品名称建议时发生错误' }
    }
  }
  
  return {
    // 状态
    commissionAccountings,
    loading,
    pagination,
    
    // 计算属性
    profitableAccountings,
    lossAccountings,
    topProfitAccountings,
    averageCommission,
    totalCommissionProfit,
    totalNetProfit,
    totalNetTransactionData,
    
    // 方法
    fetchCommissionAccountings,
    addCommissionAccounting,
    batchAddCommissionAccounting,
    updateCommissionAccounting,
    deleteCommissionAccounting,
    batchDeleteCommissionAccountings,
    clearCommissionAccountings,
    calculateCommissionAccounting,
    fetchShopNameSuggestions,
    fetchPlatformSuggestions,
    fetchProductNameSuggestions
  }
})
