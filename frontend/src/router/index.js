import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'Dashboard' }
      },
      {
        path: 'test-permissions',
        name: 'TestPermissions',
        component: () => import('../views/TestPermissions.vue'),
        meta: { title: '权限测试', icon: 'Tools' }
      },
      {
        path: 'user-management',
        name: 'UserManagement',
        component: () => import('../views/user-management/index.vue'), // 添加容器组件
        redirect: '/user-management/employees', // 添加默认重定向
        meta: { title: '用户管理', icon: 'User' },
        children: [
          {
            path: 'employees',
            name: 'Employees',
            component: () => import('../views/user-management/Employees.vue'),
            meta: { title: '员工管理', icon: 'UserFilled' }
          },
          {
            path: 'roles',
            name: 'Roles',
            component: () => import('../views/user-management/Roles.vue'),
            meta: { title: '角色管理', icon: 'Avatar' }
          },
          {
            path: 'departments',
            name: 'Departments',
            component: () => import('../views/user-management/Departments.vue'),
            meta: { title: '部门管理', icon: 'OfficeBuilding' }
          }
        ]
      },
      {
        path: 'finance-reconciliation',
        name: 'FinanceReconciliation',
        component: () => import('../views/finance-reconciliation/index.vue'),
        redirect: '/finance-reconciliation/income-expense-list',
        meta: { title: '财务对账', icon: 'Money' },
        children: [
          {
            path: 'income-expense-list',
            name: 'IncomeExpenseList',
            component: () => import('../views/finance-reconciliation/IncomeExpenseList.vue'),
            meta: { title: '收支列表', icon: 'List' }
          },
          {
            path: 'team-accounts',
            name: 'TeamAccounts',
            component: () => import('../views/finance-reconciliation/TeamAccounts.vue'),
            meta: { title: '团队账户', icon: 'UserFilled' }
          },
          {
            path: 'record-type-settings',
            name: 'RecordTypeSettings',
            component: () => import('../views/finance-reconciliation/RecordTypeSettings.vue'),
            meta: { title: '类型设置', icon: 'Setting' }
          },
          // {
          //   path: 'income-expense-stats',
          //   name: 'IncomeExpenseStats',
          //   component: () => import('../views/finance-reconciliation/IncomeExpenseStats.vue'),
          //   meta: { title: '收支统计', icon: 'DataAnalysis' }
          // }
        ]
      },
      {
        path: 'product-management',
        name: 'ProductManagement',
        component: () => import('../views/product-management/index.vue'),
        redirect: '/product-management/product-list',
        meta: { title: '商品管理', icon: 'Box' },
        children: [
          {
            path: 'product-list',
            name: 'ProductList',
            component: () => import('../views/product-management/ProductList.vue'),
            meta: { title: '商品列表', icon: 'List' }
          },
          {
            path: 'financial-projection',
            name: 'FinancialProjection',
            component: () => import('../views/product-management/FinancialProjection.vue'),
            meta: { title: '财务测算', icon: 'Notification' }
          },
          {
            path: 'commission-accounting',
            name: 'CommissionAccounting',
            component: () => import('../views/product-management/CommissionAccounting.vue'),
            meta: { title: '产品佣金', icon: 'Money' }
          },
          {
            path: 'operational-product',
            name: 'OperationalProduct',
            component: () => import('../views/product-management/OperationalProduct.vue'),
            meta: { title: '运营商品', icon: 'Money' }
          }
          // {
          //   path: 'product-stats',
          //   name: 'ProductStats',
          //   component: () => import('../views/product-management/ProductStats.vue'),
          //   meta: { title: '商品统计', icon: 'DataAnalysis' }
          // }
        ]
      },
      {
        path: 'inventory-management',
        name: 'InventoryManagement',
        component: () => import('../views/inventory-management/index.vue'),
        redirect: '/inventory-management/inventory-list',
        meta: { title: '库存管理', icon: 'Box' },
        children: [
          {
            path: 'inventory-list',
            name: 'InventoryList',
            component: () => import('../views/inventory-management/InventoryList.vue'),
            meta: { title: '库存列表', icon: 'List' }
          },
          {
            path: 'shipment-records',
            name: 'ShipmentRecords',
            component: () => import('../views/inventory-management/ShipmentRecords.vue'),
            meta: { title: '库存记录', icon: 'Document' }
          }
        ]
      },
      {
        path: 'operation-logs',
        name: 'OperationLogs',
        component: () => import('../views/OperationLogs.vue'),
        meta: { title: '操作日志', icon: 'Document', hideInMenu: true }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      },
      {
        path: 'test',
        name: 'ProductTest',
        component: () => import('../components/ProductTest.vue'),
        meta: { title: '商品测试', icon: 'Setting' }
      },
      {
        path: 'test-permissions',
        name: 'TestPermissions',
        component: () => import('../views/TestPermissions.vue'),
        meta: { title: '权限测试', icon: 'Tools' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()

  // 检查用户登录状态和鉴权状态
  const isAuthenticated = userStore.isLoggedIn && userStore.checkAuthStatus()

  if (to.meta.requiresAuth && !isAuthenticated) {
    // 需要认证但未登录，跳转到登录页
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    // 已登录用户访问登录页，跳转到仪表盘
    next('/dashboard')
  } else {
    next()
  }
})

export default router