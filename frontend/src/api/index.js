import api from './request'

// 认证API
export const authApi = {
  // 用户登录
  login: (data) => {
    return api.post('/users/login', data)
  },
  
  // 获取当前用户信息（后端为 /api/users/me）
  getUserInfo: () => {
    return api.get('/users/me')
  },
  
  // 用户登出
  logout: () => {
    return api.post('/users/logout')
  }
}

// 员工管理API
export const employeeApi = {
  // 创建员工
  createEmployee: (data) => {
    return api.post('/users', data)
  },
  
  // 获取员工列表
  getEmployees: (params) => {
    return api.get('/users', { params })
  },
  
  // 获取员工详情
  getEmployee: (id) => {
    return api.get(`/users/${id}`)
  },
  
  // 更新员工信息
  updateEmployee: (id, data) => {
    return api.put(`/users/${id}`, data)
  },
  
  // 删除员工
  deleteEmployee: (id) => {
    return api.delete(`/users/${id}`)
  },
  
  // 批量删除员工
  batchDeleteEmployees: (ids) => {
    return api.delete('/users/batch', { data: { ids } })
  },
  
  // 重置员工密码
  resetPassword: (id, newPassword) => {
    return api.put(`/users/${id}/password`, { newPassword })
  },

  // 获取没有部门的员工
  getNoDepartmentUser: () => {
    return api.get('/users/getNoDepartmentUser')
  },

  // 批量添加用户到部门
  addUserToDepartment: (data) => {
    return api.put('/users/add-to-department', data)
  }
}

// 角色管理API
export const roleApi = {
  // 获取角色列表
  getRoles: (params) => {
    return api.get('/roles', { params })
  },

  // 创建角色
  createRole: (data) => {
    return api.post('/roles', data)
  },

  // 获取角色详情
  getRole: (id) => {
    return api.get(`/roles/${id}`)
  },

  // 更新角色
  updateRole: (id, data) => {
    return api.put(`/roles/${id}`, data)
  },

  // 删除角色
  deleteRole: (id) => {
    return api.delete(`/roles/${id}`)
  },

  // 批量删除角色
  batchDeleteRoles: (ids) => {
    return api.delete('/roles/batch', { data: { ids } })
  },

  // 获取所有权限列表
  getPermissions: () => {
    return api.get('/roles/permissions')
  },

  // 获取可用权限（别名，兼容旧代码）
  getAvailablePermissions: () => {
    return api.get('/roles/permissions')
  },

  // 获取角色统计
  getRoleStats: (params) => {
    return api.get('/roles/stats', { params })
  }
}

// 部门管理API
export const departmentApi = {
  // 获取部门列表
  getDepartments: (params) => {
    return api.get('/departments', { params })
  },
  
  // 创建部门
  createDepartment: (data) => {
    return api.post('/departments', data)
  },
  
  // 获取部门详情
  getDepartment: (id) => {
    return api.get(`/departments/${id}`)
  },
  
  // 更新部门
  updateDepartment: (id, data) => {
    return api.put(`/departments/${id}`, data)
  },
  
  // 删除部门
  deleteDepartment: (id) => {
    return api.delete(`/departments/${id}`)
  },
  
  // 获取部门树形结构
  getDepartmentTree: () => {
    return api.get('/departments/tree')
  },
  
  // 获取部门员工
  getDepartmentEmployees: (id, params) => {
    return api.get(`/departments/${id}/employees`, { params })
  }
}

// 财务管理API
export const financeApi = {
  // 新增收支记录
  createRecord: (data) => {
    return api.post('/finance', data)
  },
  
  // 获取收支记录列表
  getRecords: (params) => {
    return api.get('/finance', { params })
  },
  
  // 获取收支记录详情
  getRecord: (id) => {
    return api.get(`/finance/${id}`)
  },
  
  // 更新收支记录
  updateRecord: (id, data) => {
    return api.put(`/finance/${id}`, data)
  },
  
  // 删除收支记录
  deleteRecord: (id) => {
    return api.delete(`/finance/${id}`)
  },
  
  // 批量删除收支记录
  batchDeleteRecords: (ids) => {
    return api.delete('/finance/batch', { data: { ids } })
  },
  
  // 审批收支记录
  approveRecord: (id, data) => {
    return api.put(`/finance/${id}/approve`, data)
  },
  
  // 获取财务统计
  getFinanceStats: (params) => {
    return api.get('/finance/stats', { params })
  }
}

// 文件管理API
export const fileApi = {
  // 上传文件
  uploadFile: (formData) => {
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取文件列表
  getFiles: (params) => {
    return api.get('/files', { params })
  },

  // 获取文件信息
  getFileInfo: (id) => {
    return api.get(`/files/info/${id}`)
  },

  // 下载/查看文件
  downloadFile: (id) => {
    return api.get(`/files/${id}`, {
      responseType: 'blob'
    })
  },

  // 获取文件URL（用于预览）
  getFileUrl: (id) => {
    return `${api.defaults.baseURL}/files/${id}`
  },

  // 更新文件信息
  updateFileInfo: (id, data) => {
    return api.put(`/files/info/${id}`, data)
  },

  // 删除文件
  deleteFile: (id) => {
    return api.delete(`/files/${id}`)
  },

  // 批量删除文件
  batchDeleteFiles: (ids) => {
    return api.delete('/files/batch', { data: { ids } })
  }
}

// 团队账户管理API
export const teamAccountApi = {
  // 获取团队账户列表
  getTeamAccounts: (params) => {
    return api.get('/team-accounts', { params })
  },
  
  // 创建团队账户
  createTeamAccount: (data) => {
    return api.post('/team-accounts', data)
  },
  
  // 获取团队账户详情
  getTeamAccount: (id) => {
    return api.get(`/team-accounts/${id}`)
  },
  
  // 更新团队账户
  updateTeamAccount: (id, data) => {
    return api.put(`/team-accounts/${id}`, data)
  },
  
  // 删除团队账户
  deleteTeamAccount: (id) => {
    return api.delete(`/team-accounts/${id}`)
  },
  
  // 获取账户记录
  getAccountRecords: (id, params) => {
    return api.get(`/team-accounts/${id}/records`, { params })
  },

  // 获取团队账户记录（别名方法，保持向后兼容）
  getTeamAccountRecords: (id, params) => {
    return api.get(`/team-accounts/${id}/records`, { params })
  },
  
  // 账户充值
  rechargeAccount: (id, data) => {
    return api.post(`/team-accounts/${id}/recharge`, data)
  },
  
  // 账户扣费
  deductAccount: (id, data) => {
    return api.post(`/team-accounts/${id}/deduct`, data)
  }
}

// 商品管理API
export const productApi = {
  // 获取商品列表
  getProducts: (params) => {
    return api.get('/products', { params })
  },

  // 创建商品
  createProduct: (data) => {
    return api.post('/products', data)
  },

  // 批量创建商品
  batchCreateProducts: (data) => {
    return api.post('/products/batch', data)
  },

  // 获取商品详情
  getProduct: (id) => {
    return api.get(`/products/${id}`)
  },

  // 更新商品
  updateProduct: (id, data) => {
    return api.put(`/products/${id}`, data)
  },

  // 删除商品
  deleteProduct: (id) => {
    return api.delete(`/products/${id}`)
  },

  // 批量删除商品
  batchDeleteProducts: (ids) => {
    return api.delete('/products/batch', { data: { ids } })
  },

  // 获取商品统计
  getProductStats: (params) => {
    return api.get('/products/stats', { params })
  },

  // 获取商品建议数据
  getProductSuggestions: () => {
    return api.get('/products/suggestions')
  },

  // 导出商品数据
  exportProducts: (params) => {
    return api.get('/products/export', { params, responseType: 'blob' })
  }
}

// 产品预算管理API
export const budgetApi = {
  // 获取产品预算列表
  getBudgets: (params) => {
    return api.get('/budget', { params })
  },

  // 创建产品预算
  createBudget: (data) => {
    return api.post('/budget', data)
  },

  // 批量创建产品预算
  batchCreateBudgets: (data) => {
    return api.post('/budget/batch', data)
  },

  // 获取产品预算详情
  getBudget: (id) => {
    return api.get(`/budget/${id}`)
  },

  // 更新产品预算
  updateBudget: (id, data) => {
    return api.put(`/budget/${id}`, data)
  },

  // 删除产品预算
  deleteBudget: (id) => {
    return api.delete(`/budget/${id}`)
  },

  // 批量删除产品预算
  batchDeleteBudgets: (ids) => {
    return api.delete('/budget/batch', { data: { ids } })
  },

  // 获取产品名称建议
  getProductNameSuggestions: () => {
    return api.get('/budget/suggestions/product-names')
  },

  // 获取店铺名称建议
  getShopNameSuggestions: () => {
    return api.get('/budget/suggestions/shop-names')
  },

  // 获取平台建议
  getPlatformSuggestions: () => {
    return api.get('/budget/suggestions/platforms')
  }
}

// 核算佣金管理API
export const commissionAccountingApi = {
  // 获取核算佣金列表
  getCommissionAccountings: (params) => {
    return api.get('/commission-accounting', { params })
  },

  // 创建核算佣金记录
  createCommissionAccounting: (data) => {
    return api.post('/commission-accounting', data)
  },

  // 批量创建核算佣金记录
  batchCreateCommissionAccounting: (records) => {
    return api.post('/commission-accounting/batch', { records })
  },

  // 获取核算佣金详情
  getCommissionAccounting: (id) => {
    return api.get(`/commission-accounting/${id}`)
  },

  // 更新核算佣金记录
  updateCommissionAccounting: (id, data) => {
    return api.put(`/commission-accounting/${id}`, data)
  },

  // 删除核算佣金记录
  deleteCommissionAccounting: (id) => {
    return api.delete(`/commission-accounting/${id}`)
  },

  // 批量删除核算佣金记录
  batchDeleteCommissionAccountings: (ids) => {
    return api.delete('/commission-accounting/batch', { data: { ids } })
  },

  // 获取店铺名称建议
  getShopNameSuggestions: () => {
    return api.get('/commission-accounting/suggestions/shop-names')
  },

  // 获取平台建议
  getPlatformSuggestions: () => {
    return api.get('/commission-accounting/suggestions/platforms')
  },

  // 获取产品名称建议
  getProductNameSuggestions: () => {
    return api.get('/commission-accounting/suggestions/product-names')
  },

  // 获取团队建议
  getTeamSuggestions: () => {
    return api.get('/commission-accounting/suggestions/teams')
  }
}

// 运营商品管理API
export const operationalProductApi = {
  // 获取运营商品列表
  getOperationalProducts: (params) => {
    return api.get('/operational-products', { params })
  },

  // 创建运营商品记录
  createOperationalProduct: (data) => {
    return api.post('/operational-products', data)
  },

  // 批量创建运营商品记录
  batchCreateOperationalProducts: (records) => {
    return api.post('/operational-products/batch', { records })
  },

  // 获取运营商品详情
  getOperationalProduct: (id) => {
    return api.get(`/operational-products/${id}`)
  },

  // 更新运营商品记录
  updateOperationalProduct: (id, data) => {
    return api.put(`/operational-products/${id}`, data)
  },

  // 删除运营商品记录
  deleteOperationalProduct: (id) => {
    return api.delete(`/operational-products/${id}`)
  },

  // 批量删除运营商品记录
  batchDeleteOperationalProducts: (ids) => {
    return api.delete('/operational-products/batch', { data: { ids } })
  },

  // 获取店铺名称建议
  getShopNameSuggestions: () => {
    return api.get('/operational-products/suggestions/shop-names')
  },

  // 获取平台建议
  getPlatformSuggestions: () => {
    return api.get('/operational-products/suggestions/platforms')
  },

  // 获取产品名称建议
  getProductNameSuggestions: () => {
    return api.get('/operational-products/suggestions/product-names')
  },

  // 获取团队建议
  getTeamSuggestions: () => {
    return api.get('/operational-products/suggestions/teams')
  }
}

// 库存管理API
export const inventoryApi = {
  // 获取库存列表
  getInventories: (params) => {
    return api.get('/inventory', { params })
  },

  // 创建库存记录
  createInventory: (data) => {
    return api.post('/inventory', data)
  },

  // 创建库存记录（带图片）
  createInventoryWithImage: (formData) => {
    return api.post('/inventory', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 批量创建库存记录
  batchCreateInventory: (records) => {
    return api.post('/inventory/batch', { records })
  },

  // 获取库存详情
  getInventory: (id) => {
    return api.get(`/inventory/${id}`)
  },

  // 更新库存记录
  updateInventory: (id, data) => {
    return api.put(`/inventory/${id}`, data)
  },

  // 更新库存记录（带图片）
  updateInventoryWithImage: (id, formData) => {
    return api.put(`/inventory/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除库存记录
  deleteInventory: (id) => {
    return api.delete(`/inventory/${id}`)
  },

  // 入库操作
  inventoryIn: (id, data) => {
    return api.post(`/inventory/${id}/in`, data)
  },

  // 出库操作
  inventoryOut: (id, data) => {
    return api.post(`/inventory/${id}/out`, data)
  },

  // 获取库存统计
  getInventoryStats: (params) => {
    return api.get('/inventory/stats', { params })
  },

  // 获取特定库存的操作记录
  getInventoryRecords: (id, params) => {
    return api.get(`/inventory/${id}/records`, { params })
  }
}

// 库存操作记录API
export const inventoryRecordApi = {
  // 获取所有操作记录
  getRecords: (params) => {
    return api.get('/inventory-records', { params })
  }
}

// 发货记录API
export const shipmentRecordApi = {
  // 获取发货记录列表
  getRecords: (params) => {
    return api.get('/shipment-records', { params })
  },

  // 创建发货记录
  createRecord: (data) => {
    return api.post('/shipment-records', data)
  },

  // 批量创建发货记录
  batchCreateRecord: (records) => {
    return api.post('/shipment-records/batch', { records })
  },

  // 获取发货记录详情
  getRecord: (id) => {
    return api.get(`/shipment-records/${id}`)
  },

  // 更新发货记录
  updateRecord: (id, data) => {
    return api.put(`/shipment-records/${id}`, data)
  },

  // 删除发货记录
  deleteRecord: (id) => {
    return api.delete(`/shipment-records/${id}`)
  },

  // 获取发货记录统计
  getStats: (params) => {
    return api.get('/shipment-records/stats', { params })
  },

  // 审批发货记录
  approveRecord: (id, data) => {
    return api.put(`/shipment-records/${id}/approve`, data)
  }
}

// 记录类型管理API
export const recordTypeApi = {
  // 获取所有记录类型
  getRecordTypes: () => {
    return api.get('/record-types')
  },

  // 创建记录类型
  createRecordType: (data) => {
    return api.post('/record-types', data)
  },

  // 更新记录类型
  updateRecordType: (id, data) => {
    return api.put(`/record-types/${id}`, data)
  },

  // 删除记录类型
  deleteRecordType: (id) => {
    return api.delete(`/record-types/${id}`)
  },

  // 获取指定大类的小类
  getSubCategories: (categoryId) => {
    return api.get(`/record-types/${categoryId}/subcategories`)
  },

  // 添加小类
  addSubCategory: (categoryId, data) => {
    return api.post(`/record-types/${categoryId}/subcategories`, data)
  },

  // 更新小类
  updateSubCategory: (categoryId, subCategoryId, data) => {
    return api.put(`/record-types/${categoryId}/subcategories/${subCategoryId}`, data)
  },

  // 删除小类
  deleteSubCategory: (categoryId, subCategoryId) => {
    return api.delete(`/record-types/${categoryId}/subcategories/${subCategoryId}`)
  }
}
