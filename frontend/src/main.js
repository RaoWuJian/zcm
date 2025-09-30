import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index'
import { useUserStore } from './stores/user'
import { useNotificationStore } from './stores/notification'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './style.css'
import App from './App.vue'
import websocketService from './services/websocketService'

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)

// 异步初始化用户信息并验证鉴权
const userStore = useUserStore()
const notificationStore = useNotificationStore()

userStore.initUserInfo().then(async (result) => {
  // 无论鉴权结果如何，都要挂载应用
  // 路由守卫会处理未登录用户的重定向
  app.use(router)
  app.use(ElementPlus, { locale: zhCn })
  app.mount('#app')

  // 初始化通知存储（从本地存储加载）
  try {
    console.log('Initializing notification store...')
    await notificationStore.initialize()
    console.log('Notification store initialized successfully')
  } catch (error) {
    console.error('Failed to initialize notification store:', error)
  }

  // 如果用户已登录，初始化WebSocket服务
  if (result && userStore.isLoggedIn) {
    try {
      await websocketService.initialize()
      console.log('WebSocket service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize WebSocket service:', error)
    }
  }
}).catch(async (error) => {
  // 即使发生错误也要挂载应用
  app.use(router)
  app.use(ElementPlus, { locale: zhCn })
  app.mount('#app')

  // 仍然尝试初始化通知存储
  try {
    console.log('Initializing notification store (fallback)...')
    await notificationStore.initialize()
    console.log('Notification store initialized successfully (fallback)')
  } catch (error) {
    console.error('Failed to initialize notification store (fallback):', error)
  }
})


