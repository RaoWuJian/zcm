<template>
  <div class="inventory-management" :class="{ 'mobile-view': isMobileDevice }">
    <!-- 移动端Tab导航 -->
    <div v-if="isMobileDevice" class="mobile-tabs">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick" class="inventory-tabs">
        <el-tab-pane
          v-for="tab in visibleTabs"
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
    <div class="inventory-content" :class="{ 'with-tabs': isMobileDevice }">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useResponsive } from '@/utils/responsive'
import hasAnyPermission from '@/utils/checkPermissions'
import { List, Document } from '@element-plus/icons-vue'

// 响应式工具
const { isMobileDevice } = useResponsive()

// 路由
const router = useRouter()
const route = useRoute()

// Tab配置
const tabs = [
  {
    path: '/inventory-management/inventory-list',
    label: '库存列表',
    icon: List,
    permissions: ['inventory:create', 'inventory:update', 'inventory:delete', 'inventory:in', 'inventory:out']
  },
  {
    path: '/inventory-management/shipment-records',
    label: '库存记录',
    icon: Document,
    permissions: ['shipment:create', 'shipment:update', 'shipment:delete', 'shipment:approve']
  }
]

// 根据权限过滤可见的Tab
const visibleTabs = computed(() => {
  return tabs.filter(tab => {
    // 如果没有配置权限，则显示
    if (!tab.permissions || tab.permissions.length === 0) {
      return true
    }
    // 检查是否有任一权限
    return hasAnyPermission(tab.permissions)
  })
})

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
.inventory-management {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.inventory-content {
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

.inventory-tabs {
  padding: 0 12px;
}

.inventory-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.inventory-tabs :deep(.el-tabs__nav-wrap) {
  padding: 8px 0;
}

.inventory-tabs :deep(.el-tabs__item) {
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
.inventory-content.with-tabs {
  height: calc(100% - 56px);
}

/* 移动端样式 */
@media (max-width: 767px) {
  .inventory-management.mobile-view {
    height: 100%;
  }

  .mobile-tabs {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  .inventory-tabs :deep(.el-tabs__item) {
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
