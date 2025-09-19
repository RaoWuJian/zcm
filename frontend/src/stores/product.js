import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productApi } from '../api/index'

export const useProductStore = defineStore('product', () => {
  // 状态
  const products = ref([])
  const loading = ref(false)
  const statistics = ref(null)
  const pagination = ref({
    current: 1,
    total: 0,
    count: 0,
    totalRecords: 0
  })
  
  // 建议数据（用于自动补全）
  const suggestions = ref({
    teams: [],
    suppliers: [],
    storeNames: [],
    platforms: []
  })
  
  const suggestionsLoaded = ref(false)
  const suggestionsLoading = ref(false)
  
  // 团队选项
  const teamOptions = ref([
    { value: '团队A', label: '团队A' },
    { value: '团队B', label: '团队B' },
    { value: '团队C', label: '团队C' },
    { value: '团队D', label: '团队D' },
    { value: '团队E', label: '团队E' }
  ])
  
  // 平台选项
  const platformOptions = ref([
    { value: '淘宝', label: '淘宝' },
    { value: '天猫', label: '天猫' },
    { value: '京东', label: '京东' },
    { value: '拼多多', label: '拼多多' },
    { value: '抖音', label: '抖音' },
    { value: '快手', label: '快手' },
    { value: '小红书', label: '小红书' },
    { value: '微信小程序', label: '微信小程序' },
    { value: '其他', label: '其他' }
  ])
  
  // 计算属性
  const profitableProducts = computed(() => {
    return products.value.filter(product => product.dailyTotalProfit > 0)
  })
  
  const lossProducts = computed(() => {
    return products.value.filter(product => product.dailyTotalProfit < 0)
  })
  
  const topProfitProducts = computed(() => {
    return [...products.value]
      .sort((a, b) => b.dailyTotalProfit - a.dailyTotalProfit)
      .slice(0, 10)
  })
  
  const totalProfit = computed(() => {
    return products.value.reduce((sum, product) => sum + product.dailyTotalProfit, 0)
  })
  
  const totalRevenue = computed(() => {
    return products.value.reduce((sum, product) => sum + product.dailyPaymentAmount, 0)
  })
  
  // 方法
  const fetchProducts = async (params = {}) => {
    try {
      loading.value = true
      const response = await productApi.getProducts(params)
      
      if (response.success && response.data) {
        products.value = response.data || []
        pagination.value = {
          current: response.data.pagination?.current || 1,
          total: response.pagination?.total || 0,
          count: response.pagination?.count || 0,
          totalRecords: response.pagination?.totalRecords || 0
        }
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取商品列表失败' }
      }
    } catch (error) {
      return { success: false, message: '获取商品列表时发生错误' }
    } finally {
      loading.value = false
    }
  }
  
  const fetchProductStats = async (params = {}) => {
    try {
      const response = await productApi.getProductStats(params)
      
      if (response.success && response.data) {
        statistics.value = response.data
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取商品统计失败' }
      }
    } catch (error) {
      return { success: false, message: '获取商品统计时发生错误' }
    }
  }
  
  const fetchProductSuggestions = async () => {
    if (suggestionsLoaded.value || suggestionsLoading.value) {
      return { success: true, data: suggestions.value }
    }
    
    try {
      suggestionsLoading.value = true
      const response = await productApi.getProductSuggestions()
      
      if (response.success && response.data) {
        suggestions.value = response.data
        suggestionsLoaded.value = true
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取商品建议数据失败' }
      }
    } catch (error) {
      return { success: false, message: '获取商品建议数据时发生错误' }
    } finally {
      suggestionsLoading.value = false
    }
  }
  
  const addProduct = async (productData) => {
    try {
      const response = await productApi.createProduct(productData)

      if (response.success) {
        // 重新获取商品列表
        await fetchProducts()
        return { success: true, message: response.message || '添加商品成功' }
      } else {
        return { success: false, message: response.message || '添加商品失败' }
      }
    } catch (error) {
      return { success: false, message: '添加商品时发生错误' }
    }
  }

  const batchAddProducts = async (productsData) => {
    try {
      const response = await productApi.batchCreateProducts(productsData)

      if (response.success) {
        // 重新获取商品列表
        await fetchProducts()
        return { success: true, message: response.message || '批量添加商品成功' }
      } else {
        return { success: false, message: response.message || '批量添加商品失败' }
      }
    } catch (error) {
      return { success: false, message: '批量添加商品时发生错误' }
    }
  }
  
  const updateProduct = async (id, productData) => {
    try {
      const response = await productApi.updateProduct(id, productData)
      
      if (response.success) {
        // 重新获取商品列表
        await fetchProducts()
        return { success: true, message: response.message || '更新商品成功' }
      } else {
        return { success: false, message: response.message || '更新商品失败' }
      }
    } catch (error) {
      return { success: false, message: '更新商品时发生错误' }
    }
  }
  
  const deleteProduct = async (id) => {
    try {
      const response = await productApi.deleteProduct(id)
      
      if (response.success) {
        // 重新获取商品列表
        await fetchProducts()
        return { success: true, message: response.message || '删除商品成功' }
      } else {
        return { success: false, message: response.message || '删除商品失败' }
      }
    } catch (error) {
      return { success: false, message: '删除商品时发生错误' }
    }
  }
  
  const batchDeleteProducts = async (ids) => {
    try {
      const response = await productApi.batchDeleteProducts(ids)
      
      if (response.success) {
        // 重新获取商品列表
        await fetchProducts()
        return { success: true, message: response.message || '批量删除商品成功' }
      } else {
        return { success: false, message: response.message || '批量删除商品失败' }
      }
    } catch (error) {
      return { success: false, message: '批量删除商品时发生错误' }
    }
  }
  
  const clearProducts = () => {
    products.value = []
    pagination.value = {
      current: 1,
      total: 0,
      count: 0,
      totalRecords: 0
    }
  }
  
  const clearStatistics = () => {
    statistics.value = null
  }
  
  return {
    // 状态
    products,
    loading,
    statistics,
    pagination,
    suggestions,
    suggestionsLoaded,
    suggestionsLoading,
    teamOptions,
    platformOptions,
    
    // 计算属性
    profitableProducts,
    lossProducts,
    topProfitProducts,
    totalProfit,
    totalRevenue,
    
    // 方法
    fetchProducts,
    fetchProductStats,
    fetchProductSuggestions,
    addProduct,
    batchAddProducts,
    updateProduct,
    deleteProduct,
    batchDeleteProducts,
    clearProducts,
    clearStatistics
  }
})
