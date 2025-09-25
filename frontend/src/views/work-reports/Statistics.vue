<template>
  <div class="statistics-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>数据统计</h2>
      <p>日数据报表统计分析</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
        <el-form-item label="组别">
          <el-input
            v-model="filterForm.group"
            placeholder="请输入组别"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchStatistics" :icon="Search">查询</el-button>
          <el-button @click="resetFilter" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-value">{{ overallStats.totalReports || 0 }}</div>
            <div class="stat-label">总报表数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-value">¥{{ (overallStats.totalPromotionCost || 0).toFixed(2) }}</div>
            <div class="stat-label">总推广费</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-value">¥{{ (overallStats.totalSalesAmount || 0).toFixed(2) }}</div>
            <div class="stat-label">总销售额</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-value">{{ (overallStats.averageROI || 0).toFixed(2) }}%</div>
            <div class="stat-label">平均ROI</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 按组别统计 -->
    <el-card class="chart-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>按组别统计</span>
        </div>
      </template>
      <el-table :data="groupStats" stripe>
        <el-table-column prop="group" label="组别" />
        <el-table-column prop="totalReports" label="报表数量" align="right" />
        <el-table-column prop="totalPromotionCost" label="总推广费" align="right">
          <template #default="{ row }">
            ¥{{ row.totalPromotionCost.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalSalesAmount" label="总销售额" align="right">
          <template #default="{ row }">
            ¥{{ row.totalSalesAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalSalesCount" label="总销售数" align="right" />
        <el-table-column prop="averageROI" label="平均ROI" align="right">
          <template #default="{ row }">
            <span :class="{ 'roi-positive': row.averageROI > 0, 'roi-negative': row.averageROI < 0 }">
              {{ row.averageROI.toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 按日期统计 -->
    <el-card class="chart-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>按日期统计</span>
        </div>
      </template>
      <el-table :data="dateStats" stripe max-height="400">
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalReports" label="报表数量" align="right" width="100" />
        <el-table-column prop="totalPromotionCost" label="总推广费" align="right" width="120">
          <template #default="{ row }">
            ¥{{ row.totalPromotionCost.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalSalesAmount" label="总销售额" align="right" width="120">
          <template #default="{ row }">
            ¥{{ row.totalSalesAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalSalesCount" label="总销售数" align="right" width="100" />
        <el-table-column prop="averageROI" label="平均ROI" align="right" width="100">
          <template #default="{ row }">
            <span :class="{ 'roi-positive': row.averageROI > 0, 'roi-negative': row.averageROI < 0 }">
              {{ row.averageROI.toFixed(2) }}%
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { dailyReportApi } from '@/api/index'

// 响应式数据
const loading = ref(false)
const overallStats = ref({})
const groupStats = ref([])
const dateStats = ref([])

// 筛选表单
const filterForm = reactive({
  dateRange: [],
  group: ''
})

// 获取统计数据
const fetchStatistics = async () => {
  try {
    loading.value = true
    const params = {
      ...filterForm
    }

    // 处理日期范围
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startDate = filterForm.dateRange[0]
      params.endDate = filterForm.dateRange[1]
      delete params.dateRange
    }

    const response = await dailyReportApi.getStatistics(params)
    if (response.data.success) {
      overallStats.value = response.data.data.overall || {}
      groupStats.value = response.data.data.byGroup || []
      dateStats.value = response.data.data.byDate || []
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilter = () => {
  Object.assign(filterForm, {
    dateRange: [],
    group: ''
  })
  fetchStatistics()
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 初始化
onMounted(() => {
  // 默认查询最近30天的数据
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  
  filterForm.dateRange = [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  ]
  
  fetchStatistics()
})
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.filter-card {
  margin-bottom: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.roi-positive {
  color: #67c23a;
  font-weight: bold;
}

.roi-negative {
  color: #f56c6c;
  font-weight: bold;
}
</style>
