import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElNotification } from 'element-plus'

export const useNotificationStore = defineStore('notification', () => {
  // 通知列表
  const notifications = ref([])

  // 已处理的通知ID集合，用于去重
  const processedNotificationIds = ref(new Set())

  // 立即从本地存储加载数据（在store创建时就执行）
  const initializeFromStorage = () => {
    try {
      const stored = localStorage.getItem('notifications')
      const processedIds = localStorage.getItem('processedNotificationIds')

      if (stored) {
        const parsedNotifications = JSON.parse(stored)
        // 恢复日期对象
        parsedNotifications.forEach(n => {
          n.createdAt = new Date(n.createdAt)
        })
        notifications.value = parsedNotifications
      }

      if (processedIds) {
        processedNotificationIds.value = new Set(JSON.parse(processedIds))
      }
    } catch (error) {
      console.error('Store created - failed to load from storage:', error)
    }
  }

  // 立即执行初始化
  initializeFromStorage()

  // 未读消息数量
  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.isRead).length
  })

  // 从本地存储加载通知
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('notifications')
      const processedIds = localStorage.getItem('processedNotificationIds')

      if (stored) {
        const parsedNotifications = JSON.parse(stored)
        // 恢复日期对象
        parsedNotifications.forEach(n => {
          n.createdAt = new Date(n.createdAt)
        })
        notifications.value = parsedNotifications
      }

      if (processedIds) {
        processedNotificationIds.value = new Set(JSON.parse(processedIds))
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error)
    }
  }

  // 保存到本地存储
  const saveToStorage = () => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications.value))
      localStorage.setItem('processedNotificationIds', JSON.stringify([...processedNotificationIds.value]))
    } catch (error) {
      console.error('Failed to save notifications to storage:', error)
    }
  }

  // 检查通知是否已存在（去重）
  const isDuplicateNotification = (notification) => {
    // 使用服务器端的ID或者基于内容的唯一标识
    const uniqueId = notification.id ||
      `${notification.title}-${notification.message}-${notification.data?.reportId || ''}`

    return processedNotificationIds.value.has(uniqueId)
  }

  // 添加通知
  const addNotification = (notification) => {
    // 检查是否为重复通知
    if (isDuplicateNotification(notification)) {
      return null
    }

    const newNotification = {
      id: notification.id || (Date.now() + Math.random()),
      title: notification.title,
      message: notification.message,
      type: notification.type || 'info', // info, success, warning, error
      isRead: false,
      createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
      data: notification.data || null,
      action: notification.action || null, // 点击时的操作
      category: notification.category || 'general',
      ...notification
    }

    // 记录已处理的通知ID
    const uniqueId = newNotification.id ||
      `${newNotification.title}-${newNotification.message}-${newNotification.data?.reportId || ''}`
    processedNotificationIds.value.add(uniqueId)

    // 添加到列表顶部
    notifications.value.unshift(newNotification)

    // 显示浏览器通知
    showBrowserNotification(newNotification)

    // 显示页面内通知
    showPageNotification(newNotification)

    // 限制通知数量，保留最新的100条
    if (notifications.value.length > 100) {
      notifications.value = notifications.value.slice(0, 100)
    }

    // 保存到本地存储
    saveToStorage()

    return newNotification
  }

  // 标记为已读
  const markAsRead = (notificationId) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.isRead = true
      saveToStorage()
    }
  }

  // 标记所有为已读
  const markAllAsRead = () => {
    notifications.value.forEach(n => {
      n.isRead = true
    })
    saveToStorage()
  }

  // 删除通知
  const removeNotification = (notificationId) => {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index > -1) {
      notifications.value.splice(index, 1)
      saveToStorage()
    }
  }

  // 根据日报ID移除相关通知
  const removeNotificationsByReportId = (reportId) => {
    const reportIdStr = reportId.toString()
    const initialCount = notifications.value.length

    notifications.value = notifications.value.filter(notification => {
      const notificationReportId = notification.data?.reportId
      if (!notificationReportId) return true

      const isMatch = notificationReportId === reportId ||
                     notificationReportId === reportIdStr ||
                     notificationReportId.toString() === reportIdStr

      return !isMatch
    })

    const removedCount = initialCount - notifications.value.length
    if (removedCount > 0) {
      saveToStorage()
    }

    return removedCount
  }

  // 清空所有通知
  const clearAll = () => {
    notifications.value = []
    processedNotificationIds.value.clear()
    saveToStorage()
  }

  // 显示浏览器原生通知
  const showBrowserNotification = (notification) => {
    if (!('Notification' in window)) {
      console.warn('此浏览器不支持桌面通知')
      return
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: true // 需要用户交互才关闭
      })

      browserNotification.onclick = () => {
        window.focus()
        if (notification.action) {
          notification.action()
        }
        browserNotification.close()
      }

      // 5秒后自动关闭
      setTimeout(() => {
        browserNotification.close()
      }, 5000)
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showBrowserNotification(notification)
        }
      })
    }
  }

  // 显示页面内通知
  const showPageNotification = (notification) => {
    const typeMap = {
      info: 'info',
      success: 'success',
      warning: 'warning',
      error: 'error'
    }

    ElNotification({
      title: notification.title,
      message: notification.message,
      type: typeMap[notification.type] || 'info',
      duration: notification.type === 'error' ? 0 : 4500, // 错误消息不自动关闭
      showClose: true,
      onClick: () => {
        if (notification.action) {
          notification.action()
        }
      }
    })
  }


  // 添加审批通知
  const addApprovalNotification = (reportData, isApproved) => {
    const notification = {
      title: isApproved ? '报告审批通过' : '报告审批被拒',
      message: `您的日数据报表已被${isApproved ? '审批通过' : '拒绝'}`,
      type: isApproved ? 'success' : 'warning',
      data: reportData,
      category: 'approval',
      action: () => {
        window.location.href = `/work-reports/daily-data?id=${reportData._id}`
      }
    }

    return addNotification(notification)
  }

  // 添加日报通知（已废弃，现在通过WebSocket接收）
  const addDailyReportNotification = (reportData) => {
    // 为了向后兼容，保留此方法
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const notification = {
      title: '新的日报提交',
      message: `${reportData.submitterName}提交了${reportData.productName}的日报（${formatDate(reportData.reportDate)}），请查看`,
      type: 'info',
      data: reportData,
      category: 'daily_report',
      action: () => {
        // 跳转到日报详情页面并显示模态框
        import('@/router').then(({ default: router }) => {
          router.push({
            path: '/work-reports/daily-reports',
            query: { showDetail: reportData.reportId }
          })
        })
      }
    }

    return addNotification(notification)
  }

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  // 从服务器获取未读通知
  const fetchUnreadNotifications = async () => {
    try {
      const { default: api } = await import('@/api')

      // 检查 API 方法是否存在
      if (!api || typeof api.getUnreadNotifications !== 'function') {
        console.warn('getUnreadNotifications API method not available')
        return
      }

      const response = await api.getUnreadNotifications()

      if (response.success && response.data) {
        // 添加服务器端的未读通知，去重机制会自动处理
        response.data.forEach(notification => {
          addNotification({
            ...notification,
            id: notification.id || notification._id,
            createdAt: new Date(notification.createdAt)
          })
        })

        // 已从服务器加载未读通知
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error)
    }
  }

  // 初始化通知存储
  const initialize = async () => {
    // 先从本地存储加载
    loadFromStorage()

    // 然后从服务器获取未读通知
    await fetchUnreadNotifications()
  }

  // 清理过期的已处理通知ID（保留最近7天的记录）
  const cleanupProcessedIds = () => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

    const validNotifications = notifications.value.filter(n => {
      const createdAt = new Date(n.createdAt)
      return createdAt.getTime() > sevenDaysAgo
    })

    // 重建已处理ID集合，只保留有效通知的ID
    const validIds = new Set()
    validNotifications.forEach(n => {
      const uniqueId = n.id || `${n.title}-${n.message}-${n.data?.reportId || ''}`
      validIds.add(uniqueId)
    })

    processedNotificationIds.value = validIds
    notifications.value = validNotifications
    saveToStorage()
  }

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    removeNotificationsByReportId,
    clearAll,
    addApprovalNotification,
    addDailyReportNotification,
    requestNotificationPermission,
    initialize,
    loadFromStorage,
    fetchUnreadNotifications,
    cleanupProcessedIds
  }
})