import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { operationalProductApi } from '../api/index'
import { precisionCalculate } from '@/utils/precision'

export const useOperationalProductStore = defineStore('operationalProduct', () => {
  // 状态
  const operationalProducts = ref([])
  const loading = ref(false)
  const pagination = ref({
    current: 1,
    total: 0,
    count: 0,
    totalRecords: 0
  })

  // 统计数据（基于所有查询结果，不仅仅是当前页）
  const stats = ref({
    totalNetTransactionData: 0,
    totalCommissionProfit: 0,
    totalNetProfit: 0,
    totalDailyConsumption: 0,
    totalOrderCount: 0,
    averageCommission: 0,
    recordCount: 0
  })
  
  // 计算属性
  const profitableProducts = computed(() => {
    return operationalProducts.value.filter(product => product.netProfit > 0)
  })
  
  const lossProducts = computed(() => {
    return operationalProducts.value.filter(product => product.netProfit < 0)
  })
  
  const topProfitProducts = computed(() => {
    return [...operationalProducts.value]
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 10)
  })
  
  // 基于所有查询数据的统计（从后端获取）
  const averageCommission = computed(() => {
    return stats.value.averageCommission || 0
  })

  const totalCommissionProfit = computed(() => {
    return stats.value.totalCommissionProfit || 0
  })

  const totalNetProfit = computed(() => {
    return stats.value.totalNetProfit || 0
  })

  const totalNetTransactionData = computed(() => {
    return stats.value.totalNetTransactionData || 0
  })

  const totalDailyConsumption = computed(() => {
    return stats.value.totalDailyConsumption || 0
  })

  const totalOrderCount = computed(() => {
    return stats.value.totalOrderCount || 0
  })

  // 获取运营商品列表
  const fetchOperationalProducts = async (params = {}) => {
    loading.value = true
    try {
      const response = await operationalProductApi.getOperationalProducts(params)

      if (response.success && response.data) {
        operationalProducts.value = response.data || []
        pagination.value = {
          current: response.pagination?.current || response.pagination?.page || 1,
          total: response.pagination?.total || 0,
          count: response.pagination?.count || 0,
          totalRecords: response.pagination?.totalRecords || 0
        }

        // 更新统计数据（只在第一页时更新，其他页面保持统计数据不变）
        if (response.stats) {
          stats.value = {
            totalNetTransactionData: response.stats.totalNetTransactionData || 0,
            totalCommissionProfit: response.stats.totalCommissionProfit || 0,
            totalNetProfit: response.stats.totalNetProfit || 0,
            totalDailyConsumption: response.stats.totalDailyConsumption || 0,
            totalOrderCount: response.stats.totalOrderCount || 0,
            averageCommission: response.stats.averageCommission || 0,
            recordCount: response.stats.recordCount || 0
          }
        }
        // 如果不是第一页且没有返回stats，保持现有的统计数据不变

        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取运营商品列表失败' }
      }
    } catch (error) {
      return { success: false, message: '获取运营商品列表时发生错误' }
    } finally {
      loading.value = false
    }
  }
  
  const addOperationalProduct = async (productData) => {
    try {
      const response = await operationalProductApi.createOperationalProduct(productData)

      if (response.success) {
        // 重新获取列表
        await fetchOperationalProducts()
        return { success: true, message: response.message || '添加运营商品成功' }
      } else {
        return { success: false, message: response.message || '添加运营商品失败' }
      }
    } catch (error) {
      return { success: false, message: '添加运营商品时发生错误' }
    }
  }

  const batchAddOperationalProducts = async (products) => {
    try {
      const response = await operationalProductApi.batchCreateOperationalProducts(products)
      
      if (response.success) {
        // 重新获取列表
        await fetchOperationalProducts()
        return { success: true, message: response.message || '批量添加运营商品成功' }
      } else {
        return { success: false, message: response.message || '批量添加运营商品失败' }
      }
    } catch (error) {
      return { success: false, message: '批量添加运营商品时发生错误' }
    }
  }
  
  const updateOperationalProduct = async (id, productData) => {
    try {
      const response = await operationalProductApi.updateOperationalProduct(id, productData)
      
      if (response.success) {
        // 重新获取列表
        await fetchOperationalProducts()
        return { success: true, message: response.message || '更新运营商品成功' }
      } else {
        return { success: false, message: response.message || '更新运营商品失败' }
      }
    } catch (error) {
      return { success: false, message: '更新运营商品时发生错误' }
    }
  }

  const deleteOperationalProduct = async (id) => {
    try {
      const response = await operationalProductApi.deleteOperationalProduct(id)
      
      if (response.success) {
        // 重新获取列表
        await fetchOperationalProducts()
        return { success: true, message: response.message || '删除运营商品成功' }
      } else {
        return { success: false, message: response.message || '删除运营商品失败' }
      }
    } catch (error) {
      return { success: false, message: '删除运营商品时发生错误' }
    }
  }

  const batchDeleteOperationalProducts = async (ids) => {
    try {
      const response = await operationalProductApi.batchDeleteOperationalProducts(ids)
      
      if (response.success) {
        // 重新获取列表
        await fetchOperationalProducts()
        return { success: true, message: response.message || '批量删除运营商品成功' }
      } else {
        return { success: false, message: response.message || '批量删除运营商品失败' }
      }
    } catch (error) {
      return { success: false, message: '批量删除运营商品时发生错误' }
    }
  }

  const clearOperationalProducts = () => {
    operationalProducts.value = []
    pagination.value = {
      current: 1,
      total: 0,
      count: 0,
      totalRecords: 0
    }
    stats.value = {
      totalNetTransactionData: 0,
      totalCommissionProfit: 0,
      totalNetProfit: 0,
      totalDailyConsumption: 0,
      totalOrderCount: 0,
      averageCommission: 0,
      recordCount: 0
    }
  }
  
  // 计算运营商品数据（用于实时预览）
  const calculateOperationalProduct = (data) => {
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

  // 获取建议数据
  const fetchShopNameSuggestions = async () => {
    try {
      const response = await operationalProductApi.getShopNameSuggestions()
      return response.success ? response.data : []
    } catch (error) {
      return []
    }
  }

  const fetchPlatformSuggestions = async () => {
    try {
      const response = await operationalProductApi.getPlatformSuggestions()
      return response.success ? response.data : []
    } catch (error) {
      return []
    }
  }

  const fetchProductNameSuggestions = async () => {
    try {
      const response = await operationalProductApi.getProductNameSuggestions()
      return response.success ? response.data : []
    } catch (error) {
      return []
    }
  }

  const fetchTeamSuggestions = async () => {
    try {
      const response = await operationalProductApi.getTeamSuggestions()
      return response.success ? response.data : []
    } catch (error) {
      return []
    }
  }

  // 计算运营商品数据（用于实时预览）
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

  return {
    // 状态
    operationalProducts,
    loading,
    pagination,
    stats,

    // 计算属性
    profitableProducts,
    lossProducts,
    topProfitProducts,
    averageCommission,
    totalCommissionProfit,
    totalNetProfit,
    totalNetTransactionData,
    totalDailyConsumption,
    totalOrderCount,

    // 方法
    fetchOperationalProducts,
    addOperationalProduct,
    batchAddOperationalProducts,
    updateOperationalProduct,
    deleteOperationalProduct,
    batchDeleteOperationalProducts,
    clearOperationalProducts,
    calculateOperationalProduct,
    calculateCommissionAccounting,
    fetchShopNameSuggestions,
    fetchPlatformSuggestions,
    fetchProductNameSuggestions,
    fetchTeamSuggestions
  }
})
