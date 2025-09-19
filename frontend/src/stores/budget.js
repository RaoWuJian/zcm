import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { budgetApi } from '../api/index'
import { precisionCalculate } from '@/utils/precision'

export const useBudgetStore = defineStore('budget', () => {
  // 状态
  const budgets = ref([])
  const loading = ref(false)
  const pagination = ref({
    current: 1,
    total: 0,
    count: 0,
    totalRecords: 0
  })
  
  // 计算属性
  const profitableBudgets = computed(() => {
    return budgets.value.filter(budget => budget.grossMargin > 0)
  })
  
  const lossBudgets = computed(() => {
    return budgets.value.filter(budget => budget.grossMargin < 0)
  })
  
  const topProfitBudgets = computed(() => {
    return [...budgets.value]
      .sort((a, b) => b.grossMargin - a.grossMargin)
      .slice(0, 10)
  })
  
  const averageCommission = computed(() => {
    if (budgets.value.length === 0) return 0
    const total = budgets.value.reduce((sum, budget) => sum + budget.actualCommission, 0)
    return total / budgets.value.length
  })
  
  const totalGrossMargin = computed(() => {
    return budgets.value.reduce((sum, budget) => sum + budget.grossMargin, 0)
  })
  
  const totalRevenue = computed(() => {
    return budgets.value.reduce((sum, budget) => sum + budget.sellingPrice, 0)
  })
  
  // 方法
  const fetchBudgets = async (params = {}) => {
    try {
      loading.value = true
      const response = await budgetApi.getBudgets(params)
      
      if (response.success && response.data) {
        budgets.value = response.data || []
        pagination.value = {
          current: response.pagination?.current || 1,
          total: response.pagination?.total || 0,
          count: response.pagination?.count || 0,
          totalRecords: response.pagination?.totalRecords || 0
        }
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取预算列表失败' }
      }
    } catch (error) {
      return { success: false, message: '获取预算列表时发生错误' }
    } finally {
      loading.value = false
    }
  }
  
  const addBudget = async (budgetData) => {
    try {
      const response = await budgetApi.createBudget(budgetData)

      if (response.success) {
        // 重新获取列表
        await fetchBudgets()
        return { success: true, message: response.message || '添加预算成功' }
      } else {
        return { success: false, message: response.message || '添加预算失败' }
      }
    } catch (error) {
      return { success: false, message: '添加预算时发生错误' }
    }
  }

  const batchAddBudget = async (budgetDataList) => {
    try {
      const response = await budgetApi.batchCreateBudgets(budgetDataList)

      if (response.success) {
        // 重新获取列表
        await fetchBudgets()
        return { success: true, message: response.message || '批量添加预算成功' }
      } else {
        return { success: false, message: response.message || '批量添加预算失败' }
      }
    } catch (error) {
      return { success: false, message: '批量添加预算时发生错误' }
    }
  }
  
  const updateBudget = async (id, budgetData) => {
    try {
      const response = await budgetApi.updateBudget(id, budgetData)
      
      if (response.success) {
        // 重新获取列表
        await fetchBudgets()
        return { success: true, message: response.message || '更新预算成功' }
      } else {
        return { success: false, message: response.message || '更新预算失败' }
      }
    } catch (error) {
      return { success: false, message: '更新预算时发生错误' }
    }
  }
  
  const deleteBudget = async (id) => {
    try {
      const response = await budgetApi.deleteBudget(id)
      
      if (response.success) {
        // 重新获取列表
        await fetchBudgets()
        return { success: true, message: response.message || '删除预算成功' }
      } else {
        return { success: false, message: response.message || '删除预算失败' }
      }
    } catch (error) {
      return { success: false, message: '删除预算时发生错误' }
    }
  }
  
  const batchDeleteBudgets = async (ids) => {
    try {
      const response = await budgetApi.batchDeleteBudgets(ids)
      
      if (response.success) {
        // 重新获取列表
        await fetchBudgets()
        return { success: true, message: response.message || '批量删除预算成功' }
      } else {
        return { success: false, message: response.message || '批量删除预算失败' }
      }
    } catch (error) {
      return { success: false, message: '批量删除预算时发生错误' }
    }
  }
  
  const clearBudgets = () => {
    budgets.value = []
    pagination.value = {
      current: 1,
      total: 0,
      count: 0,
      totalRecords: 0
    }
  }
  
  // 计算预算数据（用于实时预览）
  const calculateBudget = (data) => {
    const sellingPrice = parseFloat(data.sellingPrice) || 0
    const unitCost = parseFloat(data.unitCost) || 0
    const shippingCost = parseFloat(data.shippingCost) || 0
    const platformFee = parseFloat(data.platformFee) || 0
    const handlingFee = parseFloat(data.handlingFee) || 0

    // 毛利 = 售价 - 成本单价 - 产品运费 - 平台费用 - 手续费
    const grossMargin = precisionCalculate.subtract(
      sellingPrice,
      unitCost,
      shippingCost,
      platformFee,
      handlingFee
    )

    // 实际佣金 = (毛利 ÷ 售价) × 100%
    const actualCommission = precisionCalculate.percentage(grossMargin, sellingPrice)

    return {
      grossMargin,
      actualCommission
    }
  }

  // 获取产品名称建议
  const fetchProductNameSuggestions = async () => {
    try {
      const response = await budgetApi.getProductNameSuggestions()
      return response
    } catch (error) {
      console.error('获取产品名称建议失败:', error)
      return { success: false, data: [] }
    }
  }

  // 获取店铺名称建议
  const fetchShopNameSuggestions = async () => {
    try {
      const response = await budgetApi.getShopNameSuggestions()
      return response
    } catch (error) {
      console.error('获取店铺名称建议失败:', error)
      return { success: false, data: [] }
    }
  }

  // 获取平台建议
  const fetchPlatformSuggestions = async () => {
    try {
      const response = await budgetApi.getPlatformSuggestions()
      return response
    } catch (error) {
      console.error('获取平台建议失败:', error)
      return { success: false, data: [] }
    }
  }

  return {
    // 状态
    budgets,
    loading,
    pagination,
    
    // 计算属性
    profitableBudgets,
    lossBudgets,
    topProfitBudgets,
    averageCommission,
    totalGrossMargin,
    totalRevenue,
    
    // 方法
    fetchBudgets,
    addBudget,
    batchAddBudget,
    updateBudget,
    deleteBudget,
    batchDeleteBudgets,
    clearBudgets,
    calculateBudget,
    fetchProductNameSuggestions,
    fetchShopNameSuggestions,
    fetchPlatformSuggestions
  }
})
