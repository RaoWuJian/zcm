import { defineStore } from 'pinia'
import { authApi } from '@/api/index'

// JWT token 解析和验证函数
const parseJwtToken = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    return null
  }
}

// 检查 token 是否过期
const isTokenExpired = (token) => {
  const payload = parseJwtToken(token)
  if (!payload || !payload.exp) {
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000)
  return currentTime >= payload.exp
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    isCollapsed: false // 侧边栏折叠状态
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token && !isTokenExpired(state.token),
    getUserInfo: (state) => state.userInfo,
    isTokenValid: (state) => !!state.token && !isTokenExpired(state.token)
  },
  
  actions: {
    // 异步登录
    async loginAsync(username, password) {
      try {
        const result = await authApi.login({
          loginAccount: username,
          loginPassword: password
        })
        if (result.success && result.data) {
          // 清除旧的缓存信息
           this.userInfo = null
          // 设置新的登录信息
          this.login(result.data.token, result.data.userInfo)
          return { success: true, message: result.message }
        } else {
          return { success: false, message: result.message }
        }
      } catch (error) {
        return { success: false, message: '登录过程中出现错误' }
      }
    },

    // 获取当前用户信息
    async fetchUserInfo() {
      try {
        const result = await authApi.getUserInfo()
        if (result.success && result.data) {
          this.userInfo = result.data

          // 同步更新localStorage中的用户信息
          localStorage.setItem('userInfo', JSON.stringify(result.data))
          return { success: true, data: result.data }
        } else {
          return { success: false, message: result.message || '获取用户信息失败' }
        }
      } catch (error) {
        // 如果获取失败且是认证错误，清除本地数据
        if (error.response?.status === 401) {
          this.logout()
        }
        return { success: false, message: '获取用户信息时出现错误' }
      }
    },
    
    // 登录
    login(token, userInfo) {
      this.token = token
      this.userInfo = userInfo
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },
    
    // 退出登录
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },
    
    // 切换侧边栏
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed
    },
    
    // 初始化用户信息（从localStorage恢复并从服务器获取最新数据）
    async initUserInfo() {
      const token = localStorage.getItem('token')
      const userInfo = localStorage.getItem('userInfo')

      // 如果没有token，直接返回未登录状态
      if (!token) {
        return { success: false, authenticated: false, message: '用户未登录' }
      }

      // 检查 token 是否过期
      if (isTokenExpired(token)) {
        this.logout()
        return { success: false, authenticated: false, message: 'Token已过期' }
      }

      // 设置token到store
      this.token = token

      // 尝试解析本地用户信息
      if (userInfo) {
        try {
          this.userInfo = JSON.parse(userInfo)
        } catch (error) {
          // 如果解析失败，清除无效数据
          this.logout()
          return { success: false, authenticated: false, message: '本地用户信息损坏' }
        }
      }

      // 从服务器验证token有效性并获取最新用户信息
      const result = await this.fetchUserInfo()

      if (result.success) {
        return { success: true, authenticated: true, message: '用户信息初始化成功', data: result.data }
      } else {

        // 如果服务器验证失败，检查是否是401认证错误
        if (result.message?.includes('401') || result.message?.includes('未授权') || result.message?.includes('认证')) {
          this.logout()
          return { success: false, authenticated: false, message: '认证失败，请重新登录' }
        }

        // 如果是网络错误等其他问题，但本地有用户信息，可以继续使用
        if (this.userInfo) {
          return { success: true, authenticated: true, message: '使用本地缓存用户信息', data: this.userInfo }
        } else {
          this.logout()
          return { success: false, authenticated: false, message: '无法获取用户信息' }
        }
      }
    },
    
    // 检查登录状态是否有效
    checkAuthStatus() {
      const token = localStorage.getItem('token')
      const userInfo = localStorage.getItem('userInfo')

      if (!token || !userInfo) {
        this.logout()
        return false
      }

      // 检查 token 是否过期
      if (isTokenExpired(token)) {
        this.logout()
        return false
      }

      return true
    }
  }
})