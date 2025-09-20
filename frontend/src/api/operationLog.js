import request from './request'

// 获取操作日志列表
export const getOperationLogs = (params) => {
  return request({
    url: '/operation-logs',
    method: 'get',
    params
  })
}

// 获取单个操作日志详情
export const getOperationLog = (id) => {
  return request({
    url: `/operation-logs/${id}`,
    method: 'get'
  })
}

// 获取操作统计信息
export const getOperationStats = (params) => {
  return request({
    url: '/operation-logs/stats',
    method: 'get',
    params
  })
}

// 获取用户操作历史
export const getUserOperationHistory = (userId, params) => {
  return request({
    url: `/operation-logs/user/${userId}`,
    method: 'get',
    params
  })
}

// 删除操作日志（批量）
export const deleteOperationLogs = (data) => {
  return request({
    url: '/operation-logs',
    method: 'delete',
    data
  })
}
