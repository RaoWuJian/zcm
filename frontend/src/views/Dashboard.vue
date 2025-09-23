<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">
            <span class="greeting">{{ greeting }}</span>
            <span class="username">{{ userInfo?.username || '用户' }}</span>
            <span class="wave">👋</span>
          </h1>
          <p class="welcome-subtitle">{{ welcomeMessage }}</p>
          <div class="current-time">
            <el-icon class="time-icon"><Clock /></el-icon>
            <span>{{ currentTime }}</span>
          </div>
        </div>
        <div class="welcome-avatar">
          <el-avatar :size="80" class="user-avatar">
            <span class="avatar-text">{{ getAvatarText(userInfo) }}</span>
          </el-avatar>
          <div class="avatar-decoration"></div>
        </div>
      </div>
    </div>

    <!-- 2025年最火轮播图设计 -->
    <div class="modern-carousel-section">
      <div class="carousel-container">
        <el-carousel
          :interval="5000"
          :height="'400px'"
          indicator-position="none"
          arrow="hover"
          class="futuristic-carousel"
        >
          <el-carousel-item v-for="item in carouselItems" :key="item.id" class="carousel-slide">
            <div class="slide-content" :class="item.theme">
              <!-- 背景装饰 -->
              <div class="slide-background">
                <div class="bg-gradient" :style="{ background: item.gradient }"></div>
                <div class="bg-pattern">
                  <div class="pattern-grid"></div>
                  <div class="floating-shapes">
                    <div class="shape shape-1"></div>
                    <div class="shape shape-2"></div>
                    <div class="shape shape-3"></div>
                  </div>
                </div>
                <div class="bg-overlay"></div>
              </div>

              <!-- 内容区域 -->
              <div class="slide-main">
                <div class="slide-left">
                  <div class="slide-badge">
                    <span class="badge-text">{{ item.badge }}</span>
                  </div>
                  <h2 class="slide-title">{{ item.title }}</h2>
                  <p class="slide-description">{{ item.description }}</p>
                  <div class="slide-features">
                    <div v-for="feature in item.features" :key="feature" class="feature-tag">
                      <span class="tag-icon">✨</span>
                      <span class="tag-text">{{ feature }}</span>
                    </div>
                  </div>
                  <div class="slide-actions">
                    <button class="action-btn primary" @click="handleCarouselAction(item, 'primary')">
                      {{ item.primaryAction }}
                    </button>
                    <button class="action-btn secondary" @click="handleCarouselAction(item, 'secondary')">
                      {{ item.secondaryAction }}
                    </button>
                  </div>
                </div>

                <div class="slide-right">
                  <div class="slide-visual">
                    <div class="visual-container">
                      <div class="visual-icon">
                        <span class="icon-emoji">{{ item.icon }}</span>
                      </div>
                      <div class="visual-stats">
                        <div v-for="stat in item.stats" :key="stat.label" class="stat-item">
                          <span class="stat-number">{{ stat.value }}</span>
                          <span class="stat-label">{{ stat.label }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="visual-decoration">
                      <div class="deco-circle"></div>
                      <div class="deco-line"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>

        <!-- 自定义指示器 -->
        <div class="custom-indicators">
          <div
            v-for="(item, index) in carouselItems"
            :key="index"
            class="indicator-item"
            :class="{ active: currentSlide === index }"
            @click="goToSlide(index)"
          >
            <div class="indicator-dot"></div>
            <span class="indicator-label">{{ item.shortTitle }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 个人信息和快捷操作 -->
    <el-row :gutter="20" class="info-section">
      <!-- 个人信息卡片 -->
      <el-col :span="8">
        <el-card class="info-card personal-info">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><User /></el-icon>
              <span>个人信息</span>
            </div>
          </template>
          <div class="personal-content">
            <div class="info-item">
              <span class="info-label">姓名</span>
              <span class="info-value">{{ userInfo?.username || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">登录账号</span>
              <span class="info-value">{{ userInfo?.loginAccount || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">部门</span>
              <span class="info-value">{{ getDepartmentName(userInfo?.departmentPath) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">角色</span>
              <span class="info-value">{{ getRoleName(userInfo) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">账户状态</span>
              <span class="info-value">
                <el-tag :type="userInfo?.isActive ? 'success' : 'danger'" size="small">
                  {{ userInfo?.isActive ? '正常' : '已禁用' }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">备注</span>
              <span class="info-value">{{ userInfo?.remark || '无' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 今日寄语 -->
      <el-col :span="8">
        <el-card class="info-card daily-quote">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <el-icon class="header-icon"><ChatDotRound /></el-icon>
                <span>今日寄语</span>
              </div>
              <el-button
                type="text"
                size="small"
                class="refresh-btn"
                @click="updateDailyQuote"
                title="换一句"
              >
                <el-icon class="refresh-icon"><Refresh /></el-icon>
              </el-button>
            </div>
          </template>
          <div class="quote-content">
            <div class="quote-text">
              <el-icon class="quote-icon"><ChatLineRound /></el-icon>
              <p class="quote-message">{{ dailyQuote.content }}</p>
            </div>
            <div class="quote-author">
              <span>—— {{ dailyQuote.author }}</span>
            </div>
            <div class="quote-category">
              <el-tag type="success" size="small">{{ dailyQuote.category }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 快捷操作 -->
      <el-col :span="8">
        <el-card class="info-card quick-actions">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Operation /></el-icon>
              <span>快捷操作</span>
            </div>
          </template>
          <div class="actions-grid">
            <div v-for="action in quickActions" :key="action.id" class="action-item" @click="handleQuickAction(action)">
              <div class="action-icon" :style="{ background: action.color }">
                <el-icon :size="20">
                  <component :is="action.icon" />
                </el-icon>
              </div>
              <span class="action-label">{{ action.label }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统公告和温馨提示 -->
    <el-row :gutter="20" class="notice-section">
      <!-- 系统公告 -->
      <el-col :span="12">
        <el-card class="notice-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Bell /></el-icon>
              <span>系统公告</span>
              <el-badge :value="notices.length" class="notice-badge" />
            </div>
          </template>
          <div class="notice-list">
            <div v-for="notice in notices" :key="notice.id" class="notice-item">
              <div class="notice-content">
                <div class="notice-title">
                  <el-icon class="notice-type-icon" :class="notice.type">
                    <component :is="getNoticeIcon(notice.type)" />
                  </el-icon>
                  <span>{{ notice.title }}</span>
                  <el-tag v-if="notice.isNew" type="danger" size="small">新</el-tag>
                </div>
                <p class="notice-desc">{{ notice.content }}</p>
                <span class="notice-time">{{ notice.time }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 温馨提示 -->
      <el-col :span="12">
        <el-card class="tips-card">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"></el-icon>
              <span>温馨提示</span>
            </div>
          </template>
          <div class="tips-content">
            <div v-for="tip in tips" :key="tip.id" class="tip-item">
              <div class="tip-icon">
                <el-icon :color="tip.color">
                  <component :is="tip.icon" />
                </el-icon>
              </div>
              <div class="tip-text">
                <h4 class="tip-title">{{ tip.title }}</h4>
                <p class="tip-desc">{{ tip.content }}</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部装饰 -->
    <div class="footer-decoration">
      <div class="decoration-text">
        <p>{{ footerMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import {
  Clock,
  User,
  ChatDotRound,
  ChatLineRound,
  Operation,
  Bell,
  Refresh
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

// 用户信息
const userInfo = computed(() => userStore.userInfo)

// 当前时间
const currentTime = ref('')

// 定时器管理
const timeTimer = ref(null)
const quoteTimer = ref(null)

// 欢迎语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
})

// 欢迎消息
const welcomeMessage = computed(() => {
  const messages = [
    '今天也要加油哦！愿你的每一天都充满阳光与希望 ✨',
    '新的一天开始了，让我们一起创造美好的回忆吧 🌟',
    '你的努力和坚持，终将成就更好的自己 💪',
    '每一个小小的进步，都是通向成功的重要一步 🚀',
    '保持微笑，保持热情，美好的事情正在路上 😊'
  ]
  const today = new Date().getDate()
  return messages[today % messages.length]
})

// 轮播图当前索引
const currentSlide = ref(0)

// 2025年最火轮播图数据
const carouselItems = ref([
  {
    id: 1,
    theme: 'theme-collaboration',
    title: '团队协作无界限',
    shortTitle: '团队协作',
    badge: '协作办公',
    description: '支持多人实时协作，云端同步，权限管理，让团队工作更高效，沟通更顺畅。',
    icon: '🤝',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    features: ['实时同步', '权限管理', '团队共享'],
    primaryAction: '开始协作',
    secondaryAction: '功能演示',
    stats: [
      { value: '∞', label: '团队规模' },
      { value: '1ms', label: '同步延迟' }
    ]
  },
  {
    id: 2,
    theme: 'theme-security',
    badge: '安全保障',
    title: '银行级数据安全防护',
    shortTitle: '安全防护',
    description: '采用最先进的加密技术和多重安全验证，确保您的财务数据绝对安全，让您安心使用。',
    icon: '🛡️',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    features: ['端到端加密', '多重验证', '实时监控'],
    primaryAction: '查看安全',
    secondaryAction: '安全报告',
    stats: [
      { value: '256位', label: '加密强度' },
      { value: '24/7', label: '安全监控' }
    ]
  },
  {
    id: 3,
    theme: 'theme-ai',
    badge: 'AI智能',
    title: '智能财务管理新时代',
    shortTitle: '智能管理',
    description: '基于人工智能的财务分析系统，让数据说话，让决策更精准。体验前所未有的智能化财务管理。',
    icon: '🤖',
    gradient: 'linear-gradient(135deg, #979cb1 0%, #6aa5a2 100%)',
    features: ['AI数据分析', '智能预测', '自动分类'],
    primaryAction: '立即体验',
    secondaryAction: '了解更多',
    stats: [
      { value: '99.9%', label: '准确率' },
      { value: '10x', label: '效率提升' }
    ]
  },
  {
    id: 4,
    theme: 'theme-analytics',
    badge: '数据洞察',
    title: '可视化数据分析',
    shortTitle: '数据分析',
    description: '强大的数据可视化引擎，多维度分析报表，帮您发现业务增长机会，洞察市场趋势。',
    icon: '📊',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    features: ['可视化图表', '趋势分析', '智能报告'],
    primaryAction: '查看报表',
    secondaryAction: '数据演示',
    stats: [
      { value: '50+', label: '图表类型' },
      { value: '实时', label: '数据更新' }
    ]
  }
])



// 今日寄语数据库
const quoteDatabase = [
  // 励志类
  { content: '成功不是终点，失败不是末日，继续前进的勇气才最可贵。', author: '温斯顿·丘吉尔', category: '励志' },
  { content: '今天的努力，是为了明天的美好生活。', author: '佚名', category: '励志' },
  { content: '相信自己，你比想象中更强大。', author: '佚名', category: '励志' },
  { content: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采', category: '励志' },
  { content: '机会总是留给有准备的人。', author: '路易·巴斯德', category: '励志' },
  { content: '不要等待机会，而要创造机会。', author: '佚名', category: '励志' },
  { content: '成功的秘诀在于坚持自己的目标。', author: '本杰明·迪斯雷利', category: '励志' },
  { content: '困难是人生的垫脚石，而不是绊脚石。', author: '佚名', category: '励志' },

  // 奋斗类
  { content: '天行健，君子以自强不息。', author: '《周易》', category: '奋斗' },
  { content: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '佚名', category: '奋斗' },
  { content: '路漫漫其修远兮，吾将上下而求索。', author: '屈原', category: '奋斗' },
  { content: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子', category: '奋斗' },
  { content: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈', category: '奋斗' },
  { content: '千里之行，始于足下。', author: '老子', category: '奋斗' },
  { content: '锲而舍之，朽木不折；锲而不舍，金石可镂。', author: '荀子', category: '奋斗' },

  // 智慧类
  { content: '知识就是力量。', author: '弗朗西斯·培根', category: '智慧' },
  { content: '学而时习之，不亦说乎？', author: '孔子', category: '智慧' },
  { content: '三人行，必有我师焉。', author: '孔子', category: '智慧' },
  { content: '读万卷书，行万里路。', author: '佚名', category: '智慧' },
  { content: '温故而知新，可以为师矣。', author: '孔子', category: '智慧' },
  { content: '博学之，审问之，慎思之，明辨之，笃行之。', author: '《礼记》', category: '智慧' },
  { content: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游', category: '智慧' },

  // 人生感悟类
  { content: '人生如梦，一尊还酹江月。', author: '苏轼', category: '人生' },
  { content: '山重水复疑无路，柳暗花明又一村。', author: '陆游', category: '人生' },
  { content: '海纳百川，有容乃大；壁立千仞，无欲则刚。', author: '林则徐', category: '人生' },
  { content: '落红不是无情物，化作春泥更护花。', author: '龚自珍', category: '人生' },
  { content: '人生得意须尽欢，莫使金樽空对月。', author: '李白', category: '人生' },
  { content: '长风破浪会有时，直挂云帆济沧海。', author: '李白', category: '人生' },
  { content: '会当凌绝顶，一览众山小。', author: '杜甫', category: '人生' },

  // 成功类
  { content: '成功是99%的汗水加上1%的灵感。', author: '爱迪生', category: '成功' },
  { content: '失败是成功之母。', author: '佚名', category: '成功' },
  { content: '成功不是偶然的，而是必然的。', author: '佚名', category: '成功' },
  { content: '成功的人找方法，失败的人找借口。', author: '佚名', category: '成功' },
  { content: '成功需要付出代价，不成功需要付出更高的代价。', author: '佚名', category: '成功' },

  // 时间管理类
  { content: '时间就是金钱，效率就是生命。', author: '佚名', category: '时间' },
  { content: '一寸光阴一寸金，寸金难买寸光阴。', author: '佚名', category: '时间' },
  { content: '明日复明日，明日何其多。', author: '钱福', category: '时间' },
  { content: '时间是最公平的，给每个人都是24小时。', author: '佚名', category: '时间' },
  { content: '合理安排时间，就等于节约时间。', author: '弗朗西斯·培根', category: '时间' },

  // 团队合作类
  { content: '团结就是力量。', author: '佚名', category: '团队' },
  { content: '一个篱笆三个桩，一个好汉三个帮。', author: '佚名', category: '团队' },
  { content: '众人拾柴火焰高。', author: '佚名', category: '团队' },
  { content: '单丝不成线，独木不成林。', author: '佚名', category: '团队' },
  { content: '三个臭皮匠，顶个诸葛亮。', author: '佚名', category: '团队' },

  // 创新类
  { content: '创新是一个民族进步的灵魂。', author: '江泽民', category: '创新' },
  { content: '想象力比知识更重要。', author: '爱因斯坦', category: '创新' },
  { content: '创新就是创造性地破坏。', author: '熊彼特', category: '创新' },
  { content: '不创新，就死亡。', author: '艾柯卡', category: '创新' },

  // 财务智慧类
  { content: '理财不在乎多少，而在乎是否开始。', author: '佚名', category: '财务' },
  { content: '你不理财，财不理你。', author: '佚名', category: '财务' },
  { content: '投资自己，是最好的投资。', author: '巴菲特', category: '财务' },
  { content: '复利是世界第八大奇迹。', author: '爱因斯坦', category: '财务' },
  { content: '风险来自于你不知道自己在做什么。', author: '巴菲特', category: '财务' }
]

// 今日寄语（随机选择）
const dailyQuote = ref({
  content: '成功不是终点，失败不是末日，继续前进的勇气才最可贵。',
  author: '温斯顿·丘吉尔',
  category: '励志'
})

// 快捷操作
const quickActions = ref([
  {
    id: 1,
    label: '个人设置',
    icon: 'Setting',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    route: '/profile'
  },
  {
    id: 2,
    label: '新建记录',
    icon: 'Plus',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    route: '/finance/income-expense'
  },
  {
    id: 3,
    label: '数据报表',
    icon: 'DataAnalysis',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    route: '/reports'
  },
  {
    id: 4,
    label: '帮助文档',
    icon: 'Document',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    route: '/help'
  }
])

// 系统公告
const notices = ref([
  {
    id: 1,
    title: '系统升级通知',
    content: '系统将于本周末进行升级维护，届时可能会有短暂的服务中断，请提前做好准备。',
    time: '2025-01-20 10:30',
    type: 'info',
    isNew: true
  },
  {
    id: 2,
    title: '新功能上线',
    content: '财务报表功能已正式上线，支持多维度数据分析和可视化展示。',
    time: '2025-01-18 14:20',
    type: 'success',
    isNew: true
  },
  {
    id: 3,
    title: '安全提醒',
    content: '请定期更换密码，确保账户安全。建议使用强密码并开启双重验证。',
    time: '2025-01-15 09:15',
    type: 'warning',
    isNew: false
  }
])

// 温馨提示
const tips = ref([
  {
    id: 1,
    title: '工作效率小贴士',
    content: '合理安排工作时间，适当休息，保持良好的工作状态。',
    icon: 'Star',
    color: '#f39c12'
  },
  {
    id: 2,
    title: '数据备份提醒',
    content: '重要数据请及时备份，避免意外丢失造成损失。',
    icon: 'Shield',
    color: '#3498db'
  },
  {
    id: 3,
    title: '系统使用建议',
    content: '遇到问题时，可以查看帮助文档或联系技术支持。',
    icon: 'Tools',
    color: '#2ecc71'
  }
])

// 底部消息
const footerMessage = ref('愿您在招财猫的陪伴下，工作顺利，生活愉快！🎉')

// 更新当前时间
const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取部门名称（从部门路径中提取最后一级）
const getDepartmentName = (departmentPath) => {
  if (!departmentPath) return '未设置'
  const parts = departmentPath.split('->')
  return parts[parts.length - 1] || '未设置'
}

// 获取角色名称
const getRoleName = (user) => {
  if (!user) return '未设置'

  // 如果是管理员
  if (user.isAdmin) return '系统管理员'

  // 如果有角色权限信息
  if (user.rolePermission && user.rolePermission.roleName) {
    return user.rolePermission.roleName
  }

  // 默认返回
  return '普通用户'
}

// 获取头像显示文字
const getAvatarText = (user) => {
  if (!user) return 'U'

  // 优先使用用户名的第一个字符
  if (user.username) {
    return user.username.charAt(0).toUpperCase()
  }

  // 其次使用登录账号的第一个字符
  if (user.loginAccount) {
    return user.loginAccount.charAt(0).toUpperCase()
  }

  return 'U'
}

// 获取公告图标
const getNoticeIcon = (type) => {
  const iconMap = {
    info: 'InfoFilled',
    success: 'SuccessFilled',
    warning: 'WarningFilled',
    error: 'QuestionFilled'
  }
  return iconMap[type] || 'InfoFilled'
}

// 处理轮播图操作
const handleCarouselAction = (item, actionType) => {
  if (actionType === 'primary') {
    ElMessage.success(`${item.primaryAction}: ${item.title}`)
    // 根据不同的主要操作执行相应逻辑
    switch (item.id) {
      case 1:
        // 跳转到AI功能页面
        break
      case 2:
        // 跳转到安全设置页面
        break
      case 3:
        // 跳转到团队管理页面
        break
      case 4:
        // 跳转到数据报表页面
        router.push('/reports')
        break
    }
  } else {
    ElMessage.info(`${item.secondaryAction}: ${item.title}`)
    // 次要操作，如显示详情弹窗等
  }
}

// 跳转到指定轮播图
const goToSlide = (index) => {
  currentSlide.value = index
  // 这里可以通过ref控制轮播图跳转
}

// 随机选择今日寄语
const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * quoteDatabase.length)
  return quoteDatabase[randomIndex]
}

// 更新今日寄语
const updateDailyQuote = () => {
  dailyQuote.value = getRandomQuote()
}

// 启动定时器
const startTimers = () => {
  // 启动时间更新定时器
  if (!timeTimer.value) {
    timeTimer.value = setInterval(updateCurrentTime, 1000)
  }

  // 启动寄语更新定时器
  if (!quoteTimer.value) {
    quoteTimer.value = setInterval(updateDailyQuote, 30 * 60 * 1000) // 30分钟
  }
}

// 停止定时器
const stopTimers = () => {
  if (timeTimer.value) {
    clearInterval(timeTimer.value)
    timeTimer.value = null
  }

  if (quoteTimer.value) {
    clearInterval(quoteTimer.value)
    quoteTimer.value = null
  }
}

// 页面可见性变化处理
const handleVisibilityChange = () => {
  if (document.hidden) {
    // 页面不可见时停止定时器
    stopTimers()
  } else {
    // 页面可见时启动定时器
    updateCurrentTime() // 立即更新时间
    startTimers()
  }
}



// 处理快捷操作
const handleQuickAction = (action) => {
  if (action.route) {
    router.push(action.route)
  } else {
    ElMessage.info(`点击了：${action.label}`)
  }
}

onMounted(() => {
  // 初始化时间和寄语
  updateCurrentTime()
  updateDailyQuote()

  // 启动定时器
  startTimers()

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  // 清理定时器
  stopTimers()

  // 移除事件监听器
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  box-sizing: border-box;
}

/* 欢迎区域 */
.welcome-section {
  background: linear-gradient(135deg, #2ae2eb 0%, #32a5a5 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 28px;
  color: white;
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.welcome-text {
  flex: 1;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.greeting {
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.username {
  color: #ffd700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.wave {
  font-size: 28px;
  animation: wave 2s ease-in-out infinite;
}

.welcome-subtitle {
  font-size: 16px;
  margin: 0 0 16px 0;
  opacity: 0.9;
  line-height: 1.5;
}

.current-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.8;
}

.time-icon {
  font-size: 16px;
}

.welcome-avatar {
  position: relative;
}

.user-avatar {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
  font-size: 24px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.avatar-decoration {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 96px;
  height: 96px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: rotate 10s linear infinite;
}

/* 2025年最火轮播图设计 */
.modern-carousel-section {
  margin: 8px 0 32px 0;
}

.carousel-container {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

.futuristic-carousel {
  border-radius: 24px;
  overflow: hidden;
}

.carousel-slide {
  border-radius: 24px;
  overflow: hidden;
}

.slide-content {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.slide-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.9;
}

.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
}

.pattern-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: gridMove 20s linear infinite;
}

.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
}

.slide-main {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 60px;
  color: white;
}

.slide-left {
  flex: 1;
  max-width: 60%;
}

.slide-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.slide-title {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 20px 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.slide-description {
  font-size: 18px;
  line-height: 1.6;
  margin: 0 0 30px 0;
  opacity: 0.9;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slide-features {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 40px;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 8px 14px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tag-icon {
  font-size: 12px;
}

.slide-actions {
  display: flex;
  gap: 16px;
}

.action-btn {
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;
}

.action-btn.primary {
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
}

.action-btn.primary:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.4);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.slide-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 40%;
}

.slide-visual {
  position: relative;
  text-align: center;
}

.visual-container {
  position: relative;
  z-index: 2;
}

.visual-icon {
  font-size: 120px;
  margin-bottom: 30px;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3));
  animation: iconFloat 3s ease-in-out infinite;
}

.visual-stats {
  display: flex;
  gap: 30px;
  justify-content: center;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 6px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.visual-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.deco-circle {
  width: 300px;
  height: 300px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: rotate 20s linear infinite;
}

.deco-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  transform: translate(-50%, -50%);
  animation: rotate 15s linear infinite reverse;
}

/* 自定义指示器 */
.custom-indicators {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 3;
}

.indicator-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.indicator-item:hover,
.indicator-item.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.indicator-item.active .indicator-dot {
  background: white;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.indicator-label {
  font-size: 12px;
  font-weight: 500;
  color: white;
  opacity: 0.8;
}

.indicator-item.active .indicator-label {
  opacity: 1;
}

/* 信息区域 */
.info-section {
  margin-bottom: 24px;
}

.info-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  height: 100%;
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: #667eea;
}

.refresh-btn {
  padding: 4px;
  color: #667eea;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  color: #5a67d8;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 4px;
}

.refresh-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

.refresh-btn:hover .refresh-icon {
  transform: rotate(180deg);
}

/* 个人信息卡片 */
.personal-content {
  padding: 8px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

/* 今日寄语卡片 */
.quote-content {
  text-align: center;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
}

.quote-text {
  position: relative;
  margin-bottom: 20px;
  max-width: 90%;
}

.quote-icon {
  position: absolute;
  top: -12px;
  left: -12px;
  font-size: 28px;
  color: #667eea;
  opacity: 0.2;
}

.quote-message {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin: 0;
  font-style: italic;
  padding: 8px 0;
  text-align: center;
  font-weight: 500;
}

.quote-author {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  font-weight: 500;
}

.quote-category {
  display: flex;
  justify-content: center;
}

/* 快捷操作卡片 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 8px 0;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.action-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 8px;
  transition: transform 0.3s ease;
}

.action-item:hover .action-icon {
  transform: scale(1.1);
}

.action-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

/* 公告区域 */
.notice-section {
  margin-bottom: 24px;
}

.notice-card,
.tips-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.notice-card:hover,
.tips-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.notice-badge {
  margin-left: 8px;
}

.notice-list {
  max-height: 320px;
  overflow-y: auto;
}

.notice-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-content {
  position: relative;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.notice-type-icon {
  font-size: 16px;
}

.notice-type-icon.info {
  color: #409eff;
}

.notice-type-icon.success {
  color: #67c23a;
}

.notice-type-icon.warning {
  color: #e6a23c;
}

.notice-type-icon.error {
  color: #f56c6c;
}

.notice-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.notice-time {
  font-size: 12px;
  color: #999;
}

/* 温馨提示 */
.tips-content {
  padding: 8px 0;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
}

.tip-item:last-child {
  border-bottom: none;
}

.tip-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.tip-text {
  flex: 1;
}

.tip-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px 0;
}

.tip-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

/* 底部装饰 */
.footer-decoration {
  text-align: center;
  padding: 32px 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 16px;
  margin-top: 24px;
}

.decoration-text p {
  font-size: 16px;
  color: #667eea;
  margin: 0;
  font-weight: 500;
}

/* 动画效果 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(180deg);
  }
}

@keyframes wave {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 轮播图专用动画 */
@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(50px, 50px);
  }
}

@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.05);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.slide-content.theme-ai .slide-title {
  animation: slideIn 0.8s ease-out 0.2s both;
}

.slide-content.theme-security .slide-title {
  animation: slideIn 0.8s ease-out 0.3s both;
}

.slide-content.theme-collaboration .slide-title {
  animation: slideIn 0.8s ease-out 0.4s both;
}

.slide-content.theme-analytics .slide-title {
  animation: slideIn 0.8s ease-out 0.5s both;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .welcome-title {
    font-size: 28px;
  }

  .slide-title {
    font-size: 36px;
  }

  .slide-main {
    padding: 40px;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .visual-icon {
    font-size: 100px;
  }

  .deco-circle {
    width: 250px;
    height: 250px;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 20px 16px;
  }

  .welcome-section {
    padding: 24px 20px;
    margin-bottom: 20px;
  }

  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .welcome-title {
    font-size: 24px;
    flex-direction: column;
    gap: 8px;
  }

  .welcome-subtitle {
    font-size: 14px;
  }

  .modern-carousel-section {
    margin-bottom: 20px;
  }

  .carousel-container {
    border-radius: 16px;
  }

  .slide-main {
    flex-direction: column;
    padding: 30px 20px;
    text-align: center;
  }

  .slide-left {
    max-width: 100%;
    margin-bottom: 30px;
  }

  .slide-right {
    max-width: 100%;
  }

  .slide-title {
    font-size: 28px;
  }

  .slide-description {
    font-size: 16px;
  }

  .slide-features {
    justify-content: center;
  }

  .slide-actions {
    justify-content: center;
  }

  .visual-icon {
    font-size: 80px;
  }

  .visual-stats {
    gap: 20px;
  }

  .stat-number {
    font-size: 24px;
  }

  .custom-indicators {
    bottom: 20px;
    gap: 12px;
  }

  .indicator-item {
    padding: 6px 12px;
  }

  .indicator-label {
    display: none;
  }

  .info-section,
  .notice-section {
    margin-bottom: 20px;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .action-item {
    padding: 12px;
  }

  .action-icon {
    width: 40px;
    height: 40px;
  }

  .action-label {
    font-size: 13px;
  }

  .notice-list,
  .tips-content {
    max-height: 240px;
  }

  .footer-decoration {
    padding: 24px 16px;
    margin-top: 20px;
  }

  .decoration-text p {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 16px 12px;
  }

  .welcome-title {
    font-size: 20px;
  }

  .welcome-subtitle {
    font-size: 13px;
  }

  .user-avatar {
    width: 60px;
    height: 60px;
    font-size: 20px;
  }

  .avatar-decoration {
    width: 76px;
    height: 76px;
  }

  .slide-main {
    padding: 20px 16px;
  }

  .slide-title {
    font-size: 24px;
  }

  .slide-description {
    font-size: 14px;
  }

  .slide-badge {
    font-size: 11px;
    padding: 6px 12px;
  }

  .action-btn {
    padding: 12px 20px;
    font-size: 14px;
  }

  .slide-actions {
    flex-direction: column;
    gap: 12px;
  }

  .visual-icon {
    font-size: 60px;
  }

  .stat-number {
    font-size: 20px;
  }

  .stat-label {
    font-size: 12px;
  }

  .custom-indicators {
    bottom: 15px;
    gap: 8px;
  }

  .indicator-item {
    padding: 4px 8px;
  }

  .indicator-dot {
    width: 6px;
    height: 6px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .info-item {
    padding: 10px 0;
  }

  .info-label,
  .info-value {
    font-size: 13px;
  }

  .quote-content {
    padding: 16px 12px;
    min-height: 160px;
  }

  .quote-text {
    max-width: 95%;
  }

  .quote-message {
    font-size: 14px;
    line-height: 1.6;
  }

  .quote-author {
    font-size: 13px;
  }
}

/* 滚动条样式 */
.notice-list::-webkit-scrollbar,
.tips-content::-webkit-scrollbar {
  width: 4px;
}

.notice-list::-webkit-scrollbar-track,
.tips-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.notice-list::-webkit-scrollbar-thumb,
.tips-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.notice-list::-webkit-scrollbar-thumb:hover,
.tips-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 快捷操作卡片 */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 8px 0;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: 12px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-label {
  font-size: 12px;
  color: #333;
  font-weight: 500;
  text-align: center;
}

/* 公告区域 */
.notice-section {
  margin-bottom: 24px;
}

.notice-card,
.tips-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.notice-card:hover,
.tips-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.notice-badge {
  margin-left: auto;
}

.notice-list {
  max-height: 320px;
  overflow-y: auto;
}

.notice-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-content {
  position: relative;
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.notice-type-icon {
  font-size: 16px;
}

.notice-type-icon.info {
  color: #409eff;
}

.notice-type-icon.success {
  color: #67c23a;
}

.notice-type-icon.warning {
  color: #e6a23c;
}

.notice-type-icon.error {
  color: #f56c6c;
}

.notice-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.notice-time {
  font-size: 12px;
  color: #999;
}

/* 温馨提示卡片 */
.tips-content {
  padding: 8px 0;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f2f5;
}

.tip-item:last-child {
  border-bottom: none;
}

.tip-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.tip-text {
  flex: 1;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 4px 0;
}

.tip-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

/* 底部装饰 */
.footer-decoration {
  text-align: center;
  padding: 32px 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 16px;
  margin-top: 24px;
}

.decoration-text p {
  font-size: 16px;
  color: #667eea;
  margin: 0;
  font-weight: 500;
}

/* 动画效果 */
@keyframes wave {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .welcome-title {
    font-size: 28px;
  }

  .carousel-title {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }

  .welcome-section {
    padding: 24px 20px;
  }

  .welcome-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .welcome-title {
    font-size: 24px;
    justify-content: center;
  }

  .carousel-overlay {
    padding: 20px;
  }

  .carousel-title {
    font-size: 18px;
  }

  .carousel-description {
    font-size: 14px;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .action-item {
    padding: 12px;
  }

  .action-icon {
    width: 40px;
    height: 40px;
  }

  .info-card {
    margin-bottom: 16px;
  }
}

@media (max-width: 480px) {
  .welcome-section {
    padding: 20px 16px;
  }

  .welcome-title {
    font-size: 20px;
    flex-direction: column;
    gap: 8px;
  }

  .welcome-subtitle {
    font-size: 14px;
  }

  .carousel-overlay {
    padding: 16px;
  }

  .carousel-title {
    font-size: 16px;
  }

  .carousel-description {
    font-size: 13px;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .user-avatar {
    width: 60px;
    height: 60px;
    font-size: 20px;
  }

  .avatar-decoration {
    width: 76px;
    height: 76px;
  }
}

/* 滚动条样式 */
.notice-list::-webkit-scrollbar {
  width: 4px;
}

.notice-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.notice-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.notice-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>