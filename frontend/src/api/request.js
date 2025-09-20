import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api', // 使用环境变量，默认后端地址
  timeout: 15000, // 增加超时时间
  headers: {
    'Content-Type': 'application/json'
  },
  // 添加跨域配置
  withCredentials: false, // 如果后端支持credentials，可以设置为true
  // 添加更多配置以解决CORS问题
  crossDomain: true
})

// API配置信息

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const data = response.data

    // 情况1：后端采用统一响应结构 { success, data, message }
    if (typeof data?.success === 'boolean') {
      if (data.success) {
        return data
      } else {
        const msg = data.message || '请求失败'
        ElMessage.error(msg)
        return Promise.reject(new Error(msg))
      }
    }

    // 情况2：后端直接返回业务数据（无 success 包装）
    // 统一规范为 { success: true, data, message: '' }
    return { success: true, data, message: '' }
  },
  (error) => {
    let message = '网络错误'
    let shouldLogout = false

    // 处理网络错误
    if (!error.response) {
      // 网络错误或CORS错误
      if (error.code === 'ERR_NETWORK') {
        message = '网络连接失败，请检查网络或服务器状态'
      } else if (error.message && error.message.includes('CORS')) {
        message = '跨域请求被拒绝，请联系管理员'
      } else {
        message = '请求失败，请稍后重试'
      }
    } else {
      // HTTP错误
      switch (error.response.status) {
        case 400:
          message = error.response.data?.message || '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          shouldLogout = true
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址出错'
          break
        case 422:
          message = error.response.data?.message || '请求参数错误'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        default:
          message = error.response.data?.message || `请求失败 (${error.response.status})`
      }
    }

    // 处理登出逻辑
    if (shouldLogout) {
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        // 使用延迟派发事件，确保当前请求处理完成
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('auth-logout'))
        }, 100)
      } catch (err) {
        console.error('处理登出时出错:', err)
      }
    }

    console.error('请求错误:', error)
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default api