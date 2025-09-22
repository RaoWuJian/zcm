import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { inventoryApi, inventoryRecordApi } from '../api/index'

export const useInventoryStore = defineStore('inventory', () => {
  // 状态
  const inventories = ref([])
  const loading = ref(false)
  const statistics = ref(null)
  const pagination = ref({
    current: 1,
    total: 0,
    count: 0,
    totalRecords: 0
  })

  // 操作记录相关状态
  const records = ref([])
  const recordsLoading = ref(false)
  const recordsPagination = ref({
    current: 1,
    total: 0,
    count: 0,
    totalRecords: 0
  })

  // 计算属性
  const activeInventories = computed(() => {
    return inventories.value.filter(inventory => inventory.status === 'active')
  })

  const depletedInventories = computed(() => {
    return inventories.value.filter(inventory => inventory.status === 'depleted')
  })

  const totalQuantity = computed(() => {
    return inventories.value.reduce((sum, inventory) => sum + inventory.currentQuantity, 0)
  })

  const lowStockInventories = computed(() => {
    return inventories.value.filter(inventory => 
      inventory.currentQuantity > 0 && inventory.currentQuantity <= 10
    )
  })

  // 方法
  const fetchInventories = async (params = {}) => {
    try {
      loading.value = true
      const response = await inventoryApi.getInventories(params)
      
      if (response.success && response.data) {
        inventories.value = response.data || []
        pagination.value = {
          current: response.pagination?.current || 1,
          total: response.pagination?.total || 0,
          count: response.pagination?.count || 0,
          totalRecords: response.pagination?.totalRecords || 0
        }
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取库存列表失败' }
      }
    } catch (error) {
      return { success: false, message: '获取库存列表时发生错误' }
    } finally {
      loading.value = false
    }
  }

  const fetchInventoryStats = async (params = {}) => {
    try {
      const response = await inventoryApi.getInventoryStats(params)
      
      if (response.success) {
        statistics.value = response.data
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取统计数据失败' }
      }
    } catch (error) {
      return { success: false, message: '获取统计数据时发生错误' }
    }
  }

  const addInventory = async (inventoryData) => {
    try {
      const response = await inventoryApi.createInventory(inventoryData)

      if (response.success) {
        return { success: true, data: response.data, message: response.message }
      } else {
        return { success: false, message: response.message || '创建库存记录失败' }
      }
    } catch (error) {
      return { success: false, message: '创建库存记录时发生错误' }
    }
  }

  const addInventoryWithImage = async (formData) => {
    try {
      const response = await inventoryApi.createInventoryWithImage(formData)

      if (response.success) {
        return { success: true, data: response.data, message: response.message }
      } else {
        return { success: false, message: response.message || '创建库存记录失败' }
      }
    } catch (error) {
      return { success: false, message: '创建库存记录时发生错误' }
    }
  }

  const updateInventory = async (id, inventoryData) => {
    try {
      const response = await inventoryApi.updateInventory(id, inventoryData)

      if (response.success) {
        return { success: true, data: response.data, message: response.message }
      } else {
        return { success: false, message: response.message || '更新库存记录失败' }
      }
    } catch (error) {
      return { success: false, message: '更新库存记录时发生错误' }
    }
  }

  const updateInventoryWithImage = async (id, formData) => {
    try {
      const response = await inventoryApi.updateInventoryWithImage(id, formData)

      if (response.success) {
        return { success: true, data: response.data, message: response.message }
      } else {
        return { success: false, message: response.message || '更新库存记录失败' }
      }
    } catch (error) {
      return { success: false, message: '更新库存记录时发生错误' }
    }
  }

  const deleteInventory = async (id) => {
    try {
      const response = await inventoryApi.deleteInventory(id)
      
      if (response.success) {
        return { success: true, message: response.message }
      } else {
        return { success: false, message: response.message || '删除库存记录失败' }
      }
    } catch (error) {
      return { success: false, message: '删除库存记录时发生错误' }
    }
  }

  const inventoryIn = async (id, data) => {
    try {
      const response = await inventoryApi.inventoryIn(id, data)
      
      if (response.success) {
        return { success: true, data: response.data, message: response.message }
      } else {
        return { success: false, message: response.message || '入库操作失败' }
      }
    } catch (error) {
      return { success: false, message: '入库操作时发生错误' }
    }
  }

  const inventoryOut = async (id, data) => {
    try {
      const response = await inventoryApi.inventoryOut(id, data)
      
      if (response.success) {
        return { success: true, data: response.data, message: response.message }
      } else {
        return { success: false, message: response.message || '出库操作失败' }
      }
    } catch (error) {
      return { success: false, message: '出库操作时发生错误' }
    }
  }

  const fetchInventoryRecords = async (params = {}) => {
    try {
      recordsLoading.value = true
      const response = await inventoryRecordApi.getRecords(params)
      
      if (response.success && response.data) {
        records.value = response.data || []
        recordsPagination.value = {
          current: response.pagination?.current || 1,
          total: response.pagination?.total || 0,
          count: response.pagination?.count || 0,
          totalRecords: response.pagination?.totalRecords || 0
        }
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取操作记录失败' }
      }
    } catch (error) {
      return { success: false, message: '获取操作记录时发生错误' }
    } finally {
      recordsLoading.value = false
    }
  }

  const fetchInventoryRecordsByInventoryId = async (id, params = {}) => {
    try {
      recordsLoading.value = true
      const response = await inventoryApi.getInventoryRecords(id, params)
      
      if (response.success && response.data) {
        records.value = response.data || []
        recordsPagination.value = {
          current: response.pagination?.current || 1,
          total: response.pagination?.total || 0,
          count: response.pagination?.count || 0,
          totalRecords: response.pagination?.totalRecords || 0
        }
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取操作记录失败' }
      }
    } catch (error) {
      return { success: false, message: '获取操作记录时发生错误' }
    } finally {
      recordsLoading.value = false
    }
  }

  const clearInventories = () => {
    inventories.value = []
    pagination.value = {
      current: 1,
      total: 0,
      count: 0,
      totalRecords: 0
    }
  }

  const clearRecords = () => {
    records.value = []
    recordsPagination.value = {
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
    inventories,
    loading,
    statistics,
    pagination,
    records,
    recordsLoading,
    recordsPagination,
    
    // 计算属性
    activeInventories,
    depletedInventories,
    totalQuantity,
    lowStockInventories,
    
    // 方法
    fetchInventories,
    fetchInventoryStats,
    addInventory,
    addInventoryWithImage,
    updateInventory,
    updateInventoryWithImage,
    deleteInventory,
    inventoryIn,
    inventoryOut,
    fetchInventoryRecords,
    fetchInventoryRecordsByInventoryId,
    clearInventories,
    clearRecords,
    clearStatistics
  }
})
