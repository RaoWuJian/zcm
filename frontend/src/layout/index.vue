<template>
  <div class="admin-layout">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside :width="isCollapsed ? '64px' : '200px'" class="sidebar">
        <div class="logo">
          <el-icon v-if="isCollapsed" size="24"><Setting /></el-icon>
          <span v-else>后台管理系统</span>
        </div>
        
        <el-menu
          :default-active="$route.path"
          :collapse="isCollapsed"
          router
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Dashboard /></el-icon>
            <template #title>仪表盘</template>
          </el-menu-item>
          
          <el-sub-menu index="/user-management" v-if="hasAnyPermission([
              'user:read',            // 查看员工信息
              'user:create',          // 创建员工账号
              'user:update',          // 编辑员工信息
              'user:delete',          // 删除员工账号
              'user:manage',          // 管理员工
              'department:read',          // 查看部门信息
              'department:create',        // 创建部门
              'department:update',        // 编辑部门信息
              'department:delete',        // 删除部门
              'department:manage',        // 管理部门
              'role:read',           // 查看角色信息
              'role:create',         // 创建角色
              'role:update',         // 编辑角色权限
              'role:delete',         // 删除角色
              'role:manage',         // 角色管理
            ])">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="/user-management/employees" v-if="hasAnyPermission([
              'user:read',            // 查看员工信息
              'user:create',          // 创建员工账号
              'user:update',          // 编辑员工信息
              'user:delete',          // 删除员工账号
              'user:manage',          // 管理员工
            ])">
              <el-icon><UserFilled /></el-icon>
              <template #title>员工管理</template>
            </el-menu-item>
            <el-menu-item index="/user-management/roles" v-if="hasAnyPermission([
              'role:read',           // 查看角色信息
              'role:create',         // 创建角色
              'role:update',         // 编辑角色权限
              'role:delete',         // 删除角色
              'role:manage',         // 角色管理
            ])">
              <el-icon><Avatar /></el-icon>
              <template #title>角色管理</template>
            </el-menu-item>
            <el-menu-item index="/user-management/departments" v-if="hasAnyPermission([
              'department:read',          // 查看部门信息
              'department:create',        // 创建部门
              'department:update',        // 编辑部门信息
              'department:delete',        // 删除部门
              'department:manage',        // 管理部门
            ])">
              <el-icon><OfficeBuilding /></el-icon>
              <template #title>部门管理</template>
            </el-menu-item>
          </el-sub-menu>
          
          <el-sub-menu index="/finance-reconciliation" v-if="hasAnyPermission([
            'finance:read',         // 查看财务信息
            'finance:create',       // 创建收支记录
            'finance:update',       // 编辑收支记录
            'finance:delete',       // 删除收支记录
            'finance:approve',      // 收支记录审批
            'finance:manage',       // 收支管理
            
            // 团队财务账户权限
            'finance:team_read',    // 查看团队账户
            'finance:team_manage',  // 团队财务管理
          ])">
            <template #title>
              <el-icon><Money /></el-icon>
              <span>财务对账</span>
            </template>
            <el-menu-item index="/finance-reconciliation/income-expense-list" >
              <el-icon><List /></el-icon>
              <template #title>收支列表</template>
            </el-menu-item>
            <el-menu-item index="/finance-reconciliation/team-accounts" v-if="hasAnyPermission([
              'finance:team_read',    // 查看团队账户
              'finance:team_manage',  // 团队财务管理
            ])">
              <el-icon><UserFilled /></el-icon>
              <template #title>团队账户</template>
            </el-menu-item>
            <!-- <el-menu-item index="/finance-reconciliation/income-expense-stats">
              <el-icon><DataAnalysis /></el-icon>
              <template #title>收支统计</template>
            </el-menu-item> -->
          </el-sub-menu>
          
          <el-sub-menu index="/product-management" v-if="hasAnyPermission([
              'product:read',        // 查看商品信息
              'product:create',      // 创建商品信息
              'product:update',      // 编辑商品信息
              'product:delete',      // 删除商品信息
              'product:budget',      // 财务测算
              'product:commission',  // 产品佣金
              'product:manage',      // 管理商品
            ])">
            <template #title>
              <el-icon><Box /></el-icon>
              <span>商品管理</span>
            </template>
            <el-menu-item index="/product-management/product-list" v-if="hasAnyPermission([
              'product:read',        // 查看商品信息
              'product:create',      // 创建商品信息
              'product:update',      // 编辑商品信息
              'product:delete',      // 删除商品信息
              'product:manage',      // 管理商品
            ])">
              <el-icon><List /></el-icon>
              <template #title>商品列表</template>
            </el-menu-item>
            <!-- <el-menu-item index="/product-management/product-stats">
              <el-icon><DataAnalysis /></el-icon>
              <template #title>商品统计</template>
            </el-menu-item> -->
            <el-menu-item index="/product-management/financial-projection" v-if="hasAnyPermission([
              'product:budget',
              'product:manage',      // 管理商品
            ])">
              <el-icon><List /></el-icon>
              <template #title>财务测算</template>
            </el-menu-item>
            <el-menu-item index="/product-management/commission-accounting" v-if="hasAnyPermission([
              'product:commission',
              'product:manage',      // 管理商品
            ])">
              <el-icon><Money /></el-icon>
              <template #title>产品佣金</template>
            </el-menu-item>
          </el-sub-menu>
          
          <!-- <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <template #title>系统设置</template>
          </el-menu-item> -->
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="header">
          <div class="header-left">
            <el-button 
              :icon="isCollapsed ? Expand : Fold" 
              @click="toggleSidebar"
              text
              size="large"
            />
          </div>
          
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-dropdown">
                <el-avatar :size="32">
                  {{ userInfo?.username?.charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="username">{{ userInfo?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主要内容 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup >
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { 
  Odometer, 
  User, 
  UserFilled, 
  Avatar, 
  OfficeBuilding, 
  Setting, 
  ArrowDown,
  Expand,
  Fold,
  Money,
  List,
  Box
} from '@element-plus/icons-vue'
import hasAnyPermission from '@/utils/checkPermissions'

const router = useRouter()
const userStore = useUserStore()

// 初始化用户信息
const isCollapsed = computed(() => userStore.isCollapsed)
const userInfo = computed(() => userStore.userInfo)

const toggleSidebar = () => {
  userStore.toggleSidebar()
}

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能待开发')
      break
    case 'logout':
      userStore.logout()
      router.push('/login')
      ElMessage.success('已退出登录')
      break
  }
}

</script>

<style scoped>
.admin-layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  background-color: #f0f2f5;
}

.el-container {
  height: 100vh !important;
  width: 100vw !important;
}

.sidebar {
  background-color: #304156;
  transition: width 0.28s ease;
  height: 100vh !important;
  overflow: hidden;
  position: relative;
  box-shadow: 2px 0 6px rgba(0,21,41,.35);
  z-index: 1001;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #434a50;
  flex-shrink: 0;
  background-color: #2c3e50;
}

.el-menu {
  height: calc(100vh - 60px) !important;
  overflow-y: auto;
  border-right: none;
  width: 100%;
  
  /* 优化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: #6c757d #343a40;
}

.el-menu::-webkit-scrollbar {
  width: 6px;
}

.el-menu::-webkit-scrollbar-track {
  background: #343a40;
}

.el-menu::-webkit-scrollbar-thumb {
  background-color: #6c757d;
  border-radius: 3px;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 60px !important;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  z-index: 1000;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.username {
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  height: calc(100vh - 60px) !important;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  max-width: 100%;
  max-height: calc(100vh - 60px);
  box-sizing: border-box;
  
  /* 优化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f1f1f1;
}

.main-content::-webkit-scrollbar {
  width: 6px;
}

.main-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.main-content::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 3px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background-color: #a8a8a8;
}

/* 内容包装器 - 防止内容超出 */
.content-wrapper {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 140px);
  display: block;
  position: relative;
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

/* 确保所有子组件都不超出边界 */
.content-wrapper > * {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* 全局防溢出保护 */
:deep(.page-container),
:deep(.dashboard),
:deep(.el-row),
:deep(.el-col) {
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 子菜单样式优化 */
:deep(.el-sub-menu .el-menu-item) {
  padding-left: 50px !important;
  background-color: rgba(0, 0, 0, 0.1) !important;
}

:deep(.el-sub-menu .el-menu-item:hover) {
  background-color: rgba(64, 158, 255, 0.2) !important;
}

:deep(.el-sub-menu .el-menu-item.is-active) {
  background-color: #409eff !important;
  color: #fff !important;
}

/* 动画优化 */
* {
  box-sizing: border-box;
}

.sidebar, .main-content {
  will-change: transform;
}
</style>