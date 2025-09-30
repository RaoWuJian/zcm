import { io } from 'socket.io-client'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'

class WebSocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.heartbeatInterval = null
    this.activityTimeout = null
    this.lastActivity = Date.now()
    this.inactivityThreshold = 30 * 60 * 1000 // 30分钟
    this.activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    this.notificationStore = null
    this.userStore = null
    this.isDestroyed = false // 添加销毁标志

    // 绑定方法到实例，确保可以正确移除监听器
    this.handleUserActivity = this.handleUserActivity.bind(this)
  }

  // 初始化WebSocket连接
  async initialize() {
    try {
      this.notificationStore = useNotificationStore()
      this.userStore = useUserStore()
      
      // 设置用户活跃度监听
      this.setupActivityDetection()
      
      // 建立连接
      await this.connect()
      
      console.log('WebSocket service initialized')
    } catch (error) {
      console.error('Failed to initialize WebSocket service:', error)
    }
  }

  // 建立WebSocket连接
  async connect() {
    // 如果服务已销毁，不再尝试连接
    if (this.isDestroyed) {
      console.log('WebSocket service is destroyed, skipping connection')
      return
    }

    if (this.isConnecting || this.isConnected) {
      return
    }

    this.isConnecting = true

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const serverUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001'

      this.socket = io(serverUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: false // 我们手动处理重连
      })

      this.setupSocketEvents()
      
      // 等待连接建立
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        this.socket.on('connected', () => {
          clearTimeout(timeout)
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout)
          reject(error)
        })
      })

    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.isConnecting = false
      this.scheduleReconnect()
      throw error
    }
  }

  // 设置Socket事件监听
  setupSocketEvents() {
    if (!this.socket) return

    // 连接成功
    this.socket.on('connected', (data) => {
      console.log('WebSocket connected:', data)
      this.isConnected = true
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.startHeartbeat()
    })

    // 接收通知
    this.socket.on('notification', (notification) => {
      console.log('Received notification:', notification)
      this.updateActivity()

      if (this.notificationStore) {
        // 添加通知，内置去重机制会处理重复通知
        const result = this.notificationStore.addNotification({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          category: notification.category,
          data: notification.data,
          isRead: false,
          createdAt: notification.createdAt,
          action: this.createNotificationAction(notification)
        })

        if (result) {
          console.log('Notification added successfully:', notification.title)
        } else {
          console.log('Duplicate notification ignored:', notification.title)
        }
      }
    })

    // 心跳响应
    this.socket.on('ping', () => {
      this.socket.emit('pong')
      this.updateActivity()
    })

    // 强制断开
    this.socket.on('force_disconnect', (data) => {
      console.log('Force disconnected:', data.reason)
      this.cleanup()
    })

    // 不活跃断开
    this.socket.on('inactive_disconnect', (data) => {
      console.log('Disconnected due to inactivity:', data)
      this.cleanup()
    })

    // 系统消息
    this.socket.on('system_message', (message) => {
      console.log('System message:', message)
      if (this.notificationStore) {
        this.notificationStore.addNotification({
          title: '系统通知',
          message: message.content || message,
          type: 'info',
          category: 'system'
        })
      }
    })

    // 连接断开
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      this.isConnected = false
      this.stopHeartbeat()
      
      // 根据断开原因决定是否重连
      if (reason !== 'io client disconnect' && reason !== 'transport close') {
        this.scheduleReconnect()
      }
    })

    // 连接错误
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.isConnected = false
      this.isConnecting = false
      this.scheduleReconnect()
    })

    // 其他错误
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }

  // 创建通知点击动作
  createNotificationAction(notification) {
    if (notification.category === 'daily_report' && notification.data?.reportId) {
      return () => {
        // 跳转到日报详情
        import('@/router').then(({ default: router }) => {
          router.push({
            path: '/work-reports/daily-reports',
            query: { showDetail: notification.data.reportId }
          })
        })
      }
    }
    return null
  }

  // 设置用户活跃度检测
  setupActivityDetection() {
    // 监听用户活动事件
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.handleUserActivity, true)
    })

    // 定期检查用户活跃度
    this.activityTimeout = setInterval(() => {
      this.checkUserActivity()
    }, 60000) // 每分钟检查一次
  }

  // 处理用户活动
  handleUserActivity() {
    // 如果服务已销毁，不处理任何活动
    if (this.isDestroyed) {
      return
    }

    this.updateActivity()

    // 如果用户重新活跃且未连接，尝试重连
    if (!this.isConnected && !this.isConnecting) {
      // 检查是否有 token，没有 token 说明用户未登录
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('No token found, skipping reconnection')
        return
      }

      console.log('User became active, attempting to reconnect...')
      this.connect().catch(error => {
        console.error('Reconnection failed:', error)
      })
    }
  }

  // 更新活跃时间
  updateActivity() {
    this.lastActivity = Date.now()
    
    // 向服务器发送活跃信号
    if (this.isConnected && this.socket) {
      this.socket.emit('user_activity')
    }
  }

  // 检查用户活跃度
  checkUserActivity() {
    const now = Date.now()
    const inactiveTime = now - this.lastActivity

    if (inactiveTime > this.inactivityThreshold) {
      console.log('User inactive for too long, disconnecting...')
      this.disconnect()
    }
  }

  // 开始心跳
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.socket) {
        this.updateActivity()
      }
    }, 30000) // 30秒发送一次活跃信号
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 安排重连
  scheduleReconnect() {
    // 如果服务已销毁，不再重连
    if (this.isDestroyed) {
      console.log('WebSocket service is destroyed, skipping reconnection')
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`)

    setTimeout(() => {
      // 再次检查是否已销毁
      if (this.isDestroyed) {
        console.log('WebSocket service was destroyed during reconnection delay')
        return
      }

      if (!this.isConnected && !this.isConnecting) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
        })
      }
    }, delay)
  }

  // 标记通知为已读
  markNotificationAsRead(notificationId) {
    if (this.isConnected && this.socket) {
      this.socket.emit('mark_notification_read', { notificationId })
    }
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
    this.cleanup()
  }

  // 清理资源
  cleanup() {
    this.isConnected = false
    this.isConnecting = false
    this.stopHeartbeat()
    
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket = null
    }
  }

  // 销毁服务
  destroy() {
    console.log('Destroying WebSocket service...')

    // 设置销毁标志，防止任何重连尝试
    this.isDestroyed = true

    // 清理连接
    this.cleanup()

    // 移除活动监听器（使用绑定的方法引用）
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity, true)
    })

    // 清理定时器
    if (this.activityTimeout) {
      clearInterval(this.activityTimeout)
      this.activityTimeout = null
    }

    // 重置重连计数
    this.reconnectAttempts = 0

    console.log('WebSocket service destroyed')
  }

  // 重新初始化服务（用于重新登录后）
  reinitialize() {
    console.log('Reinitializing WebSocket service...')

    // 重置销毁标志
    this.isDestroyed = false

    // 重置重连计数
    this.reconnectAttempts = 0

    // 重新初始化
    this.initialize()
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      lastActivity: this.lastActivity
    }
  }
}

// 创建单例实例
const websocketService = new WebSocketService()

export default websocketService
