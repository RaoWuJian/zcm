<template>
  <div class="work-reports-container" :class="{ 'mobile-view': isMobileDevice }">
    <!-- 移动端Tab导航 -->
    <div v-if="isMobileDevice" class="mobile-tabs">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="reports-tabs">
        <el-tab-pane
          v-for="tab in tabs"
          :key="tab.path"
          :label="tab.label"
          :name="tab.path"
        >
          <template #label>
            <div class="tab-label">
              <el-icon><component :is="tab.icon" /></el-icon>
              <span>{{ tab.label }}</span>
            </div>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 页面内容 -->
    <div class="reports-content" :class="{ 'with-tabs': isMobileDevice }">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResponsive } from '@/utils/responsive'
import { Document, DataAnalysis, Setting, TrendCharts } from '@element-plus/icons-vue'

// 响应式工具
const { isMobileDevice } = useResponsive()

// 路由
const router = useRouter()
const route = useRoute()

// Tab配置
const tabs = [
  {
    path: '/work-reports/promotion-calculator',
    label: '推广计算器',
    icon: TrendCharts
  },
  {
    path: '/work-reports/daily-reports',
    label: '日报管理',
    icon: Document
  },
  {
    path: '/work-reports/report-statistics',
    label: '汇报统计',
    icon: DataAnalysis
  },
  {
    path: '/work-reports/campaign-categories',
    label: '分类设置',
    icon: Setting
  }
]

// 当前激活的Tab
const activeTab = ref(route.path)

// 监听路由变化，更新激活的Tab
watch(() => route.path, (newPath) => {
  activeTab.value = newPath
}, { immediate: true })

// Tab点击事件
const handleTabClick = (tab) => {
  const targetPath = tab.paneName
  if (targetPath !== route.path) {
    router.push(targetPath)
  }
}
</script>

<style scoped>
.work-reports-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.reports-content {
  flex: 1;
  overflow: auto;
}

/* 移动端Tab导航 */
.mobile-tabs {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  position: sticky;
  top: 0;
  z-index: 100;
}

.reports-tabs {
  padding: 0 12px;
}

.reports-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.reports-tabs :deep(.el-tabs__nav-wrap) {
  padding: 8px 0;
}

.reports-tabs :deep(.el-tabs__item) {
  padding: 0 12px;
  height: 40px;
  line-height: 40px;
  font-size: 14px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-label .el-icon {
  font-size: 16px;
}

/* 有Tab时内容区域调整 */
.reports-content.with-tabs {
  height: calc(100% - 56px);
}

/* 移动端样式 */
@media (max-width: 767px) {
  .work-reports-container.mobile-view {
    height: 100%;
  }

  .mobile-tabs {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  .reports-tabs :deep(.el-tabs__item) {
    font-size: 13px;
    padding: 0 8px;
  }

  .tab-label span {
    font-size: 13px;
  }

  .tab-label .el-icon {
    font-size: 14px;
  }
}
</style>
