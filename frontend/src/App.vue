<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup >
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/user'

const router = useRouter()
const userStore = useUserStore()

// 处理认证失败的自定义事件
const handleAuthLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  // 监听认证失败事件
  window.addEventListener('auth-logout', handleAuthLogout)
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('auth-logout', handleAuthLogout)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: #f0f2f5;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
}

/* 覆盖 Element Plus 默认样式 */
.el-container {
  height: 100% !important;
  width: 100% !important;
}

.el-aside {
  height: 100vh !important;
}

.el-header {
  height: 60px !important;
  padding: 0 !important;
}

.el-main {
  padding: 0 !important;
  height: calc(100vh - 60px) !important;
}

.el-card {
  border-radius: 8px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.el-table {
  border-radius: 8px;
  overflow: hidden;
}

.el-button {
  border-radius: 4px;
}

.el-input {
  border-radius: 4px;
}

.el-select {
  border-radius: 4px;
}

/* 确保所有页面元素都不超出屏幕 */
* {
  max-width: 100vw;
  max-height: 100vh;
}

/* 防止滚动条占用空间 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
