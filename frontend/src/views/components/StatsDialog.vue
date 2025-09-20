<template>
  <el-dialog
    v-model="visible"
    title="操作统计分析"
    width="1000px"
    :before-close="handleClose"
  >
    <div class="stats-content">
      <!-- 统计参数 -->
      <div class="stats-params">
        <el-form :model="params" inline>
          <el-form-item label="统计天数">
            <el-select v-model="params.days" @change="fetchStats">
              <el-option label="最近7天" :value="7" />
              <el-option label="最近30天" :value="30" />
              <el-option label="最近90天" :value="90" />
            </el-select>
          </el-form-item>
          <el-form-item label="模块">
            <el-select v-model="params.module" placeholder="全部模块" clearable @change="fetchStats">
              <el-option
                v-for="item in store.moduleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading" class="stats-charts">
        <!-- 操作类型统计 -->
        <div class="chart-section">
          <h4>操作类型分布</h4>
          <div ref="operationTypeChart" class="chart-container"></div>
        </div>

        <!-- 模块统计 -->
        <div class="chart-section">
          <h4>模块操作分布</h4>
          <div ref="moduleChart" class="chart-container"></div>
        </div>

        <!-- 每日操作趋势 -->
        <div class="chart-section full-width">
          <h4>每日操作趋势</h4>
          <div ref="dailyChart" class="chart-container-large"></div>
        </div>

        <!-- 活跃用户 -->
        <div class="chart-section full-width">
          <h4>活跃用户排行</h4>
          <el-table :data="stats?.activeUsers || []" style="width: 100%">
            <el-table-column prop="operatorName" label="用户姓名" />
            <el-table-column prop="operatorAccount" label="用户账号" />
            <el-table-column prop="count" label="操作次数" />
            <el-table-column prop="lastOperation" label="最后操作时间">
              <template #default="{ row }">
                {{ formatDate(row.lastOperation) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { useOperationLogStore } from '@/stores/operationLog'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const store = useOperationLogStore()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const stats = ref(null)
const operationTypeChart = ref(null)
const moduleChart = ref(null)
const dailyChart = ref(null)

const params = reactive({
  days: 30,
  module: ''
})

let operationTypeChartInstance = null
let moduleChartInstance = null
let dailyChartInstance = null

// 获取统计数据
const fetchStats = async () => {
  loading.value = true
  try {
    const response = await store.fetchStats(params)
    if (response.success) {
      stats.value = response.data
      await nextTick()
      initCharts()
    }
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  initOperationTypeChart()
  initModuleChart()
  initDailyChart()
}

// 初始化操作类型图表
const initOperationTypeChart = () => {
  if (!operationTypeChart.value || !stats.value?.operationTypeStats) return

  if (operationTypeChartInstance) {
    operationTypeChartInstance.dispose()
  }

  operationTypeChartInstance = echarts.init(operationTypeChart.value)

  const data = stats.value.operationTypeStats.map(item => ({
    name: getOperationTypeText(item._id),
    value: item.totalCount
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '操作类型',
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  operationTypeChartInstance.setOption(option)
}

// 初始化模块图表
const initModuleChart = () => {
  if (!moduleChart.value || !stats.value?.moduleStats) return

  if (moduleChartInstance) {
    moduleChartInstance.dispose()
  }

  moduleChartInstance = echarts.init(moduleChart.value)

  const data = stats.value.moduleStats.map(item => ({
    name: getModuleText(item._id),
    value: item.count
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '模块',
        type: 'pie',
        radius: ['40%', '70%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  moduleChartInstance.setOption(option)
}

// 初始化每日趋势图表
const initDailyChart = () => {
  if (!dailyChart.value || !stats.value?.dailyStats) return

  if (dailyChartInstance) {
    dailyChartInstance.dispose()
  }

  dailyChartInstance = echarts.init(dailyChart.value)

  const dates = stats.value.dailyStats.map(item => item._id)
  const counts = stats.value.dailyStats.map(item => item.count)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '操作次数',
        type: 'line',
        data: counts,
        smooth: true,
        areaStyle: {}
      }
    ]
  }

  dailyChartInstance.setOption(option)
}

// 获取操作类型文本
const getOperationTypeText = (type) => {
  const option = store.operationTypeOptions.find(opt => opt.value === type)
  return option ? option.label : type
}

// 获取模块文本
const getModuleText = (module) => {
  const option = store.moduleOptions.find(opt => opt.value === module)
  return option ? option.label : module
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 监听对话框显示状态
watch(visible, (newVal) => {
  if (newVal) {
    fetchStats()
  }
})

// 组件卸载时销毁图表
const destroyCharts = () => {
  if (operationTypeChartInstance) {
    operationTypeChartInstance.dispose()
    operationTypeChartInstance = null
  }
  if (moduleChartInstance) {
    moduleChartInstance.dispose()
    moduleChartInstance = null
  }
  if (dailyChartInstance) {
    dailyChartInstance.dispose()
    dailyChartInstance = null
  }
}

// 监听对话框关闭，销毁图表
watch(visible, (newVal) => {
  if (!newVal) {
    destroyCharts()
  }
})
</script>

<style scoped>
.stats-content {
  max-height: 600px;
  overflow-y: auto;
}

.stats-params {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stats-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-section {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
}

.chart-section.full-width {
  grid-column: 1 / -1;
}

.chart-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.chart-container-large {
  width: 100%;
  height: 400px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
