<template>
  <div class="notification-center">
    <!-- 通知图标和徽章 -->
    <el-dropdown trigger="click" @command="handleCommand">
      <div class="notification-trigger">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-icon size="20" class="notification-icon">
            <Bell />
          </el-icon>
        </el-badge>
      </div>

      <template #dropdown>
        <el-dropdown-menu class="notification-dropdown">
          <!-- 头部 -->
          <div class="notification-header">
            <span class="title">消息通知</span>
            <div class="actions">
              <el-button
                text
                size="small"
                @click="markAllAsRead"
                :disabled="unreadCount === 0"
              >
                全部已读
              </el-button>
              <el-button
                text
                size="small"
                @click="clearAll"
                :disabled="notifications.length === 0"
              >
                清空
              </el-button>
            </div>
          </div>

          <!-- 通知列表 -->
          <div class="notification-list">
            <div v-if="notifications.length === 0" class="empty-state">
              <el-icon size="48" color="#c0c4cc">
                <BellFilled />
              </el-icon>
              <p>暂无通知</p>
            </div>

            <div
              v-for="notification in displayNotifications"
              :key="notification.id"
              class="notification-item"
              :class="{ 'unread': !notification.isRead }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-content">
                <div class="notification-title">
                  <span>{{ notification.title }}</span>
                  <el-tag
                    v-if="notification.category === 'daily_report'"
                    size="small"
                    type="primary"
                    round
                  >
                    日报
                  </el-tag>
                  <el-tag
                    v-if="!notification.isRead"
                    size="small"
                    type="danger"
                    round
                  >
                    新
                  </el-tag>
                </div>
                <div class="notification-message">{{ notification.message }}</div>
                <div v-if="notification.data && notification.category === 'daily_report'" class="notification-details">
                  <span class="detail-item">组别：{{ notification.data.groupName }}</span>
                  <span class="detail-item">产品：{{ notification.data.productName }}</span>
                </div>
                <div class="notification-time">
                  {{ formatTime(notification.createdAt) }}
                </div>
              </div>
              <div class="notification-actions">
                <el-button
                  text
                  size="small"
                  @click.stop="removeNotification(notification.id)"
                >
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- 显示更多 -->
            <div v-if="notifications.length > displayLimit" class="show-more">
              <el-button text @click="showAllNotifications">
                查看全部 {{ notifications.length }} 条通知
              </el-button>
            </div>
          </div>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 全部通知对话框 -->
    <el-dialog
      v-model="showAllDialog"
      title="全部通知"
      width="600px"
      :before-close="handleCloseAllDialog"
    >
      <div class="all-notifications">
        <div v-if="notifications.length === 0" class="empty-state">
          <el-icon size="48" color="#c0c4cc">
            <BellFilled />
          </el-icon>
          <p>暂无通知</p>
        </div>

        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.isRead }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-content">
            <div class="notification-title">
              <span>{{ notification.title }}</span>
              <el-tag
                v-if="notification.category === 'daily_report'"
                size="small"
                type="primary"
                round
              >
                日报
              </el-tag>
              <el-tag
                v-if="!notification.isRead"
                size="small"
                type="danger"
                round
              >
                新
              </el-tag>
            </div>
            <div class="notification-message">{{ notification.message }}</div>
            <div v-if="notification.data && notification.category === 'daily_report'" class="notification-details">
              <span class="detail-item">组别：{{ notification.data.groupName }}</span>
              <span class="detail-item">产品：{{ notification.data.productName }}</span>
            </div>
            <div class="notification-time">
              {{ formatTime(notification.createdAt) }}
            </div>
          </div>
          <div class="notification-actions">
            <el-button
              text
              size="small"
              @click.stop="removeNotification(notification.id)"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, BellFilled, Close } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

// 显示限制
const displayLimit = 5
const showAllDialog = ref(false)

// 计算属性
const notifications = computed(() => notificationStore.notifications)
const unreadCount = computed(() => notificationStore.unreadCount)

const displayNotifications = computed(() => {
  return notifications.value.slice(0, displayLimit)
})

// 格式化时间
const formatTime = (date) => {
  const now = new Date()
  const time = new Date(date)
  const diff = now - time

  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else if (diff < 604800000) { // 7天内
    return `${Math.floor(diff / 86400000)}天前`
  } else {
    return time.toLocaleDateString()
  }
}

// 处理通知点击
const handleNotificationClick = (notification) => {
  // 标记为已读
  notificationStore.markAsRead(notification.id)

  // 执行自定义操作
  if (notification.action) {
    notification.action()
  }

  // 关闭对话框
  showAllDialog.value = false
}

// 标记全部已读
const markAllAsRead = () => {
  notificationStore.markAllAsRead()
  ElMessage.success('已标记全部为已读')
}

// 清空所有通知
const clearAll = () => {
  notificationStore.clearAll()
  ElMessage.success('已清空所有通知')
}



// 移除单个通知
const removeNotification = (id) => {
  notificationStore.removeNotification(id)
}

// 显示全部通知
const showAllNotifications = () => {
  showAllDialog.value = true
}

// 关闭全部通知对话框
const handleCloseAllDialog = (done) => {
  showAllDialog.value = false
  if (done) done()
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'markAllRead':
      markAllAsRead()
      break
    case 'clearAll':
      clearAll()
      break
  }
}
</script>

<style scoped>
.notification-trigger {
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.notification-trigger:hover {
  background-color: #f5f7fa;
}

.notification-icon {
  color: #606266;
}

.notification-dropdown {
  width: 350px;
  max-height: 500px;
  padding: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  background-color: #f8f9fa;
}

.notification-header .title {
  font-weight: 500;
  color: #303133;
}

.notification-header .actions {
  display: flex;
  gap: 8px;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 40px 16px;
  color: #909399;
}

.empty-state p {
  margin-top: 12px;
  margin-bottom: 0;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notification-title span {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.notification-message {
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  color: #909399;
  font-size: 12px;
}

.notification-details {
  margin: 4px 0;
  font-size: 12px;
  color: #606266;
}

.detail-item {
  margin-right: 12px;
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
}

.notification-actions {
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.show-more {
  text-align: center;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background-color: #f8f9fa;
}

.all-notifications {
  max-height: 60vh;
  overflow-y: auto;
}

.all-notifications .notification-item {
  border-radius: 6px;
  margin-bottom: 8px;
  border: 1px solid #ebeef5;
}

.all-notifications .notification-item:last-child {
  margin-bottom: 0;
}
</style>