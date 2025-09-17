import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index'
import { useUserStore } from './stores/user'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)

// 异步初始化用户信息并验证鉴权
const userStore = useUserStore()
userStore.initUserInfo().then((result) => {
  if (result) {
    console.log('用户初始化结果:', result.message)

    if (!result.authenticated) {
      // 用户未通过鉴权，清除可能的无效数据
      console.log('用户未通过鉴权，将跳转到登录页')
    } else {
      console.log('用户鉴权成功，已获取用户信息')
    }
  } else {
    console.log('用户未登录，处于访客状态')
  }

  // 无论鉴权结果如何，都要挂载应用
  // 路由守卫会处理未登录用户的重定向
  app.use(router)
  app.use(ElementPlus, { locale: zhCn })
  app.mount('#app')
}).catch((error) => {
  console.error('初始化用户信息时发生错误:', error)
  // 即使发生错误也要挂载应用
  app.use(router)
  app.use(ElementPlus, { locale: zhCn })
  app.mount('#app')
})


