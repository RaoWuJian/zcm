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
  // 无论鉴权结果如何，都要挂载应用
  // 路由守卫会处理未登录用户的重定向
  app.use(router)
  app.use(ElementPlus, { locale: zhCn })
  app.mount('#app')
}).catch((error) => {
  // 即使发生错误也要挂载应用
  app.use(router)
  app.use(ElementPlus, { locale: zhCn })
  app.mount('#app')
})


