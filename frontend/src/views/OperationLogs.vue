<template>
  <div class="operation-logs">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Document /></el-icon>
        <h2>操作日志</h2>
      </div>
      <div class="page-description">
        查看系统中所有用户的操作记录
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-card business-style">
      <el-form :model="filters" :inline="true" class="business-search-form">
        <div class="search-fields">
          <el-form-item label="操作类型" class="search-item">
            <el-select
              v-model="filters.operationType"
              placeholder="请选择操作类型"
              clearable
              class="business-select"
              filterable
            >
              <el-option
                v-for="item in store.operationTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="模块" class="search-item">
            <el-select
              v-model="filters.module"
              placeholder="请选择模块"
              clearable
              class="business-select"
              filterable
            >
              <el-option
                v-for="item in store.moduleOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="时间筛选" class="search-item">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 350px;"
              :shortcuts="dateShortcuts"
              @change="handleDateRangeChange"
            />
          </el-form-item>

          <el-form-item label="关键词" class="search-item">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索操作描述、资源名称、操作人"
              clearable
              class="business-input"
              style="width: 200px;"
            />
          </el-form-item>
        </div>

        <div class="search-actions">
          <el-button type="primary" @click="handleSearch" :icon="Search" size="small">查询</el-button>
          <el-button @click="handleReset" size="small" style="margin-left: 8px;">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-right">
        <span class="total-count">共 {{ store.pagination?.totalLogs || 0 }} 条数据</span>
        <el-tooltip content="刷新数据" placement="top">
          <el-button @click="refreshLogs" :icon="Refresh" circle :loading="store.loading" />
        </el-tooltip>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card">
      <el-table
        :data="store.formattedLogs"
        v-loading="store.loading"
        stripe
        max-height="600"
        border
      >
        <el-table-column prop="operationTypeText" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getOperationTypeTagType(row.operationType)"
              size="small"
            >
              {{ row.operationTypeText }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="moduleText" label="模块" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getModuleTagType(row.module)"
              size="small"
              effect="plain"
            >
              {{ row.moduleText }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="操作描述" min-width="200" show-overflow-tooltip />

        <el-table-column prop="resourceName" label="资源名称" width="150" show-overflow-tooltip />

        <el-table-column prop="operatorName" label="操作人" width="120" />

        <el-table-column prop="requestInfo.ip" label="IP地址" width="120" />

        <el-table-column prop="resultText" label="结果" width="80">
          <template #default="{ row }">
            <el-tag
              :type="row.result === 'SUCCESS' ? 'success' : 'danger'"
              size="small"
            >
              {{ row.resultText }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="operatedAtFormatted" label="操作时间" width="160" />

        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="viewDetail(row)"
              link
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="store.pagination.totalLogs"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
        />
      </div>
    </div>

    <!-- 详情对话框 -->
    <LogDetailDialog 
      v-model="detailDialogVisible" 
      :log="selectedLog"
    />


  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Document, Search } from '@element-plus/icons-vue'
import { useOperationLogStore } from '@/stores/operationLog'
import LogDetailDialog from './components/LogDetailDialog.vue'

const store = useOperationLogStore()

// 响应式数据
const currentPage = ref(1)
const pageSize = ref(20)
const dateRange = ref([])
const detailDialogVisible = ref(false)
const selectedLog = ref(null)

// 筛选条件
const filters = reactive({
  operationType: '',
  module: '',
  keyword: '',
  startDate: '',
  endDate: ''
})

// 日期快捷选项
const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const today = new Date()
      return [today, today]
    }
  },
  {
    text: '昨天',
    value: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return [yesterday, yesterday]
    }
  },
  {
    text: '最近3天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 2)
      return [start, end]
    }
  },
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    }
  },
  {
    text: '半个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 14)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(1)
      return [start, end]
    }
  },
  {
    text: '上个月',
    value: () => {
      const end = new Date()
      end.setDate(0) // 上个月最后一天
      const start = new Date()
      start.setMonth(start.getMonth() - 1, 1) // 上个月第一天
      return [start, end]
    }
  },
  {
    text: '三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 3)
      return [start, end]
    }
  }
]

// 获取操作类型标签类型
const getOperationTypeTagType = (type) => {
  const typeMap = {
    'CREATE': 'success',
    'UPDATE': 'warning',
    'DELETE': 'danger',
    'LOGIN': 'info',
    'LOGOUT': 'info',
    'APPROVE': 'success',
    'REJECT': 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取模块标签类型
const getModuleTagType = (module) => {
  const moduleMap = {
    'USER': 'primary',
    'DEPARTMENT': 'success',
    'FINANCE': 'warning',
    'PRODUCT': 'info',
    'ROLE': 'danger'
  }
  return moduleMap[module] || 'info'
}

// 处理日期范围变化
const handleDateRangeChange = (dates) => {
  if (dates && dates.length === 2) {
    filters.startDate = dates[0]
    filters.endDate = dates[1]
  } else {
    filters.startDate = ''
    filters.endDate = ''
  }
}

// 搜索
const handleSearch = () => {
  store.setFilters(filters)
  currentPage.value = 1
  fetchLogs()
}

// 重置
const handleReset = () => {
  Object.assign(filters, {
    operationType: '',
    module: '',
    keyword: '',
    startDate: '',
    endDate: ''
  })
  dateRange.value = []
  store.resetFilters()
  currentPage.value = 1

  // 重置后重新设置默认搜索今天
  initializeDefaultSearch()
  fetchLogs()
}

// 初始化默认搜索今天的数据
const initializeDefaultSearch = () => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD格式

  // 设置默认日期为今天
  filters.startDate = todayStr
  filters.endDate = todayStr
  dateRange.value = [today, today]
}

// 刷新日志
const refreshLogs = () => {
  fetchLogs()
}



// 查看详情
const viewDetail = (log) => {
  selectedLog.value = log
  detailDialogVisible.value = true
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchLogs()
}

// 当前页变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchLogs()
}

// 获取日志列表
const fetchLogs = async () => {
  try {
    await store.fetchLogs(currentPage.value, pageSize.value)
  } catch (error) {
    ElMessage.error('获取操作日志失败')
  }
}

// 初始化
onMounted(() => {
  initializeDefaultSearch() // 先设置默认搜索条件
  fetchLogs()
})
</script>

<style scoped>
/* 商务简洁风格样式 */
.search-card.business-style {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.business-search-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-fields {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.search-item {
  margin: 0 !important;
  margin-right: 0 !important;
}

.business-input,
.business-select {
  width: 150px !important;
  height: 28px !important;
  font-size: 13px !important;
}

.business-input .el-input__inner,
.business-select .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
}

.search-actions {
  display: flex;
  gap: 8px;
  align-self: flex-start;
}

.business-btn {
  height: 28px !important;
  padding: 0 12px !important;
  font-size: 13px !important;
  border-radius: 4px !important;
}

/* 响应式布局 */
@media screen and (max-width: 1200px) {
  .search-fields {
    width: 100%;
  }

  .search-actions {
    align-self: flex-start;
  }
}

@media screen and (max-width: 768px) {
  .search-fields {
    flex-direction: column;
  }

  .search-item {
    width: 100%;
  }

  .business-input,
  .business-select {
    width: 100% !important;
  }

  .search-actions {
    align-self: flex-start;
  }
}

/* 原有的其他样式 */
.operation-logs {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.title-icon {
  font-size: 24px;
  margin-right: 12px;
  color: #409eff;
}

.page-description {
  color: #666;
  font-size: 14px;
}

.action-card {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 16px;
}



.action-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.total-count {
  color: #666;
  font-size: 14px;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pagination-wrapper {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}


</style>
