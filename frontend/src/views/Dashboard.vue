<template>
  <div class="dashboard">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon user">
              <el-icon size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.users }}</h3>
              <p>总用户数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon order">
              <el-icon size="32"><ShoppingCart /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.orders }}</h3>
              <p>总订单数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon revenue">
              <el-icon size="32"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <h3>¥{{ stats.revenue }}</h3>
              <p>总收入</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon growth">
              <el-icon size="32"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <h3>{{ stats.growth }}%</h3>
              <p>增长率</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最新活动</span>
            </div>
          </template>
          
          <el-timeline>
            <el-timeline-item
              v-for="activity in activities"
              :key="activity.id"
              :timestamp="activity.timestamp"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
            </div>
          </template>
          
          <div class="todo-list">
            <div v-for="todo in todos" :key="todo.id" class="todo-item">
              <el-checkbox v-model="todo.completed" @change="updateTodo(todo)">
                {{ todo.title }}
              </el-checkbox>
              <el-tag v-if="todo.priority === 'high'" type="danger" size="small">
                高优先级
              </el-tag>
              <el-tag v-else-if="todo.priority === 'medium'" type="warning" size="small">
                中优先级
              </el-tag>
              <el-tag v-else type="info" size="small">
                低优先级
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup >
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 移除TypeScript接口定义，使用普通JavaScript对象

const stats = ref({
  users: 1234,
  orders: 567,
  revenue: '123,456',
  growth: 12.5
})

const activities = ref([
  {
    id: 1,
    content: '用户张三完成了订单支付',
    timestamp: '2024-01-15 14:30'
  },
  {
    id: 2,
    content: '新用户李四注册成功',
    timestamp: '2024-01-15 13:45'
  },
  {
    id: 3,
    content: '管理员更新了系统配置',
    timestamp: '2024-01-15 12:20'
  },
  {
    id: 4,
    content: '收到新的客户反馈',
    timestamp: '2024-01-15 11:15'
  }
])

const todos = ref([
  {
    id: 1,
    title: '处理客户投诉',
    completed: false,
    priority: 'high'
  },
  {
    id: 2,
    title: '更新产品文档',
    completed: true,
    priority: 'medium'
  },
  {
    id: 3,
    title: '优化系统性能',
    completed: false,
    priority: 'medium'
  },
  {
    id: 4,
    title: '备份数据库',
    completed: false,
    priority: 'low'
  }
])

const updateTodo = (todo) => {
  if (todo.completed) {
    ElMessage.success(`已完成任务：${todo.title}`)
  } else {
    ElMessage.info(`已取消完成：${todo.title}`)
  }
}

onMounted(() => {
  // 模拟数据加载
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.mb-20 {
  margin-bottom: 20px;
}

.stat-card {
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.user {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.order {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.growth {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info h3 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-info p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.todo-list {
  max-height: 300px;
  overflow-y: auto;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f2f5;
}

.todo-item:last-child {
  border-bottom: none;
}
</style>