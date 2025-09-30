import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { campaignCategoryApi } from '../api/index'

export const useCampaignCategoryStore = defineStore('campaignCategory', () => {
  // 状态
  const categories = ref([])
  const mainCategories = ref([])
  const categoriesWithChildren = ref([])
  const loading = ref(false)
  const pagination = ref({
    current: 1,
    total: 0,
    pageSize: 20
  })

  // 计算属性
  const mainCategoryOptions = computed(() => {
    return mainCategories.value.map(category => ({
      label: category.name,
      value: category._id,
      disabled: !category.isActive
    }))
  })

  const categoryTreeOptions = computed(() => {
    return categoriesWithChildren.value.map(category => ({
      label: category.name,
      value: category._id,
      disabled: !category.isActive,
      children: category.subCategories?.map(sub => ({
        label: sub.name,
        value: sub._id,
        disabled: !sub.isActive
      })) || []
    }))
  })

  // 方法
  const fetchCategories = async (params = {}) => {
    try {
      loading.value = true
      const response = await campaignCategoryApi.getCategories(params)

      if (response.success && response.data) {
        categories.value = response.data || []
        pagination.value = {
          current: response.pagination?.current || 1,
          total: response.pagination?.total || 0,
          pageSize: response.pagination?.pageSize || 20
        }
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取分类列表失败' }
      }
    } catch (error) {
      console.error('获取分类列表失败:', error)
      return { success: false, message: '获取分类列表时发生错误' }
    } finally {
      loading.value = false
    }
  }

  const fetchMainCategories = async () => {
    try {
      const response = await campaignCategoryApi.getMainCategories()
      
      if (response.success && response.data) {
        mainCategories.value = response.data || []
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取大类列表失败' }
      }
    } catch (error) {
      console.error('获取大类列表失败:', error)
      return { success: false, message: '获取大类列表时发生错误' }
    }
  }

  const fetchCategoriesWithChildren = async () => {
    try {
      const response = await campaignCategoryApi.getCategoriesWithChildren()
      
      if (response.success && response.data) {
        categoriesWithChildren.value = response.data || []
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取分类树失败' }
      }
    } catch (error) {
      console.error('获取分类树失败:', error)
      return { success: false, message: '获取分类树时发生错误' }
    }
  }

  const fetchSubCategories = async (mainCategoryId) => {
    try {
      if (!mainCategoryId) {
        return { success: true, data: [] }
      }

      const response = await campaignCategoryApi.getSubCategories(mainCategoryId)
      
      if (response.success && response.data) {
        return { success: true, data: response.data }
      } else {
        return { success: false, message: response.message || '获取子类列表失败' }
      }
    } catch (error) {
      console.error('获取子类列表失败:', error)
      return { success: false, message: '获取子类列表时发生错误' }
    }
  }

  // 添加大类
  const addCategory = async (categoryData) => {
    try {
      const response = await campaignCategoryApi.createCategory(categoryData)

      if (response.success) {
        // 重新获取列表
        await Promise.all([
          fetchCategories(),
          fetchMainCategories(),
          fetchCategoriesWithChildren()
        ])
        return { success: true, message: response.message || '添加大类成功', data: response.data }
      } else {
        return { success: false, message: response.message || '添加大类失败' }
      }
    } catch (error) {
      console.error('添加大类失败:', error)
      return { success: false, message: '添加大类时发生错误' }
    }
  }

  // 更新大类
  const updateCategory = async (id, categoryData) => {
    try {
      const response = await campaignCategoryApi.updateCategory(id, categoryData)
      
      if (response.success) {
        // 重新获取列表
        await Promise.all([
          fetchCategories(),
          fetchMainCategories(),
          fetchCategoriesWithChildren()
        ])
        return { success: true, message: response.message || '更新大类成功', data: response.data }
      } else {
        return { success: false, message: response.message || '更新大类失败' }
      }
    } catch (error) {
      console.error('更新大类失败:', error)
      return { success: false, message: '更新大类时发生错误' }
    }
  }

  // 删除大类
  const deleteCategory = async (id) => {
    try {
      const response = await campaignCategoryApi.deleteCategory(id)
      
      if (response.success) {
        // 重新获取列表
        await Promise.all([
          fetchCategories(),
          fetchMainCategories(),
          fetchCategoriesWithChildren()
        ])
        return { success: true, message: response.message || '删除大类成功' }
      } else {
        return { success: false, message: response.message || '删除大类失败' }
      }
    } catch (error) {
      console.error('删除大类失败:', error)
      return { success: false, message: '删除大类时发生错误' }
    }
  }

  // 添加小类
  const addSubCategory = async (categoryId, subCategoryData) => {
    try {
      const response = await campaignCategoryApi.addSubCategory(categoryId, subCategoryData)

      if (response.success) {
        // 更新相关列表
        await Promise.all([
          fetchCategoriesWithChildren(),
          fetchMainCategories()
        ])
        return { success: true, message: response.message || '添加小类成功', data: response.data }
      } else {
        return { success: false, message: response.message || '添加小类失败' }
      }
    } catch (error) {
      console.error('添加小类失败:', error)
      return { success: false, message: '添加小类时发生错误' }
    }
  }

  // 更新小类
  const updateSubCategory = async (categoryId, subCategoryId, subCategoryData) => {
    try {
      const response = await campaignCategoryApi.updateSubCategory(categoryId, subCategoryId, subCategoryData)
      
      if (response.success) {
        // 更新相关列表
        await Promise.all([
          fetchCategoriesWithChildren(),
          fetchMainCategories()
        ])
        return { success: true, message: response.message || '更新小类成功', data: response.data }
      } else {
        return { success: false, message: response.message || '更新小类失败' }
      }
    } catch (error) {
      console.error('更新小类失败:', error)
      return { success: false, message: '更新小类时发生错误' }
    }
  }

  // 删除小类
  const deleteSubCategory = async (categoryId, subCategoryId) => {
    try {
      const response = await campaignCategoryApi.deleteSubCategory(categoryId, subCategoryId)
      
      if (response.success) {
        // 更新相关列表
        await Promise.all([
          fetchCategoriesWithChildren(),
          fetchMainCategories()
        ])
        return { success: true, message: response.message || '删除小类成功', data: response.data }
      } else {
        return { success: false, message: response.message || '删除小类失败' }
      }
    } catch (error) {
      console.error('删除小类失败:', error)
      return { success: false, message: '删除小类时发生错误' }
    }
  }

  const updateCategoriesOrder = async (categories) => {
    try {
      const response = await campaignCategoryApi.updateCategoriesOrder(categories)
      
      if (response.success) {
        // 重新获取列表
        await fetchCategories()
        return { success: true, message: response.message || '排序更新成功' }
      } else {
        return { success: false, message: response.message || '排序更新失败' }
      }
    } catch (error) {
      console.error('排序更新失败:', error)
      return { success: false, message: '排序更新时发生错误' }
    }
  }

  const clearCategories = () => {
    categories.value = []
    mainCategories.value = []
    categoriesWithChildren.value = []
    pagination.value = {
      current: 1,
      total: 0,
      pageSize: 20
    }
  }

  // 获取分类的完整路径名称
  const getCategoryFullPath = (category, subCategoryId = null) => {
    if (subCategoryId) {
      const subCategory = category.subCategories?.find(sub => sub._id === subCategoryId)
      return subCategory ? `${category.name} > ${subCategory.name}` : category.name
    }
    return category.name
  }

  return {
    // 状态
    categories,
    mainCategories,
    categoriesWithChildren,
    loading,
    pagination,

    // 计算属性
    mainCategoryOptions,
    categoryTreeOptions,

    // 方法
    fetchCategories,
    fetchMainCategories,
    fetchCategoriesWithChildren,
    fetchSubCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    updateCategoriesOrder,
    clearCategories,
    getCategoryFullPath
  }
})