<template>
  <div class="report-statistics">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><DataAnalysis /></el-icon>
        <h2>汇报统计</h2>
      </div>
      <div class="page-description">
        查看和分析日报汇总统计数据
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-card business-style">
      <el-form :model="searchForm" class="business-search-form">
        <div class="search-fields">
          <el-form-item label="时间范围" class="search-item">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateRangeChange"
              style="width: 240px"
            />
          </el-form-item>

          <el-form-item label="统计维度" class="search-item">
            <el-select v-model="groupBy" @change="handleSearchChange" style="width: 120px">
              <el-option label="按汇报人" value="reporter" />
              <el-option label="按组别" value="group" />
              <el-option label="按投放类别" value="category" />
              <el-option label="按时间" value="time" />
            </el-select>
          </el-form-item>

          <el-form-item label="时间单位" class="search-item" v-if="groupBy === 'time'">
            <el-select v-model="timeUnit" @change="handleSearchChange" style="width: 100px">
              <el-option label="按日" value="day" />
              <el-option label="按周" value="week" />
              <el-option label="按月" value="month" />
            </el-select>
          </el-form-item>

          <el-form-item label="组别" class="search-item">
            <el-input
              v-model="searchForm.groupName"
              placeholder="输入组别名称"
              clearable
              @change="handleSearchChange"
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="产品名称" class="search-item">
            <el-input
              v-model="searchForm.productName"
              placeholder="输入产品名称"
              clearable
              @change="handleSearchChange"
              style="width: 150px"
            />
          </el-form-item>

          <el-form-item label="投放类别" class="search-item">
            <el-select
              v-model="searchForm.categoryId"
              placeholder="选择投放类别"
              clearable
              @change="handleSearchChange"
              style="width: 150px"
            >
              <el-option
                v-for="category in categories"
                :key="category._id"
                :label="category.name"
                :value="category._id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="报告类型" class="search-item">
            <el-select
              v-model="searchForm.reportType"
              placeholder="选择报告类型"
              clearable
              @change="handleReportTypeChange"
              style="width: 120px"
            >
              <el-option label="日报" value="daily" />
              <el-option label="时段报告" value="hourly" />
            </el-select>
          </el-form-item>

          <el-form-item label="时段" class="search-item" v-if="searchForm.reportType === 'hourly'">
            <el-select
              v-model="searchForm.reportHour"
              placeholder="选择时段"
              clearable
              @change="handleSearchChange"
              style="width: 100px"
            >
              <el-option label="14:00" value="14:00" />
              <el-option label="19:00" value="19:00" />
              <el-option label="24:00" value="24:00" />
            </el-select>
          </el-form-item>
        </div>

        <div class="search-actions">
          <el-button type="primary" @click="fetchStatistics" :loading="loading" size="small">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters" size="small" style="margin-left: 8px;">
            重置
          </el-button>
          <el-button type="success" @click="exportData" :loading="exportLoading" size="small" style="margin-left: 8px;" v-if="!isMobileDevice">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- 统计概览面板 -->
    <div class="stats-panel">
      <div class="stats-header" @click="showStatsPanel = !showStatsPanel">
        <div class="stats-title">
          <el-icon class="stats-toggle-icon" :class="{ 'rotated': showStatsPanel }">
            <ArrowDown />
          </el-icon>
          统计概览
        </div>
        <div class="stats-summary">
          总汇报数: {{ summary.totalReports || 0 }} |
          汇报人数: {{ summary.uniqueReportersCount || 0 }} |
          涉及组别: {{ summary.uniqueGroupsCount || 0 }}
        </div>
      </div>

      <el-collapse-transition>
        <div v-show="showStatsPanel" class="stats-content-wrapper">
          <el-row :gutter="20" class="stats-cards">
            <el-col :span="6">
              <div class="stats-item">
                <div class="stats-icon primary">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-value">{{ summary.totalReports || 0 }}</div>
                  <div class="stats-label">总汇报数</div>
                </div>
              </div>
            </el-col>

            <el-col :span="6">
              <div class="stats-item">
                <div class="stats-icon success">
                  <el-icon><User /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-value">{{ summary.uniqueReportersCount || 0 }}</div>
                  <div class="stats-label">汇报人数</div>
                </div>
              </div>
            </el-col>

            <el-col :span="6">
              <div class="stats-item">
                <div class="stats-icon warning">
                  <el-icon><UserFilled /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-value">{{ summary.uniqueGroupsCount || 0 }}</div>
                  <div class="stats-label">涉及组别</div>
                </div>
              </div>
            </el-col>

            <el-col :span="6">
              <div class="stats-item">
                <div class="stats-icon danger">
                  <el-icon><Money /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-value">{{ formatCurrency(summary.totalPromotionCost) }}</div>
                  <div class="stats-label">总推广费用</div>
                </div>
              </div>
            </el-col>
          </el-row>

          <!-- 报告类型统计 -->
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="12">
              <div class="stats-item">
                <div class="stats-icon primary">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-value">{{ summary.dailyReportsCount || 0 }}</div>
                  <div class="stats-label">日报数量</div>
                </div>
              </div>
            </el-col>

            <el-col :span="12">
              <div class="stats-item">
                <div class="stats-icon success">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-value">{{ summary.hourlyReportsCount || 0 }}</div>
                  <div class="stats-label">时段报告数量</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-collapse-transition>
    </div>

    <!-- 统计表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ getTableTitle() }}</span>
          <div class="table-actions">
            <el-button size="small" @click="exportStatistics" :loading="exportLoading" class="action-btn success" v-if="!isMobileDevice">
              <el-icon><Download /></el-icon>
              导出统计
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="statistics"
        v-loading="loading"
        stripe
        style="width: 100%"
        max-height="500"
        :default-sort="{ prop: 'count', order: 'descending' }"
      >
        <el-table-column
          :prop="getGroupColumnProp()"
          :label="getGroupColumnLabel()"
          min-width="120"
        >
          <template #default="{ row }">
            {{ getGroupColumnValue(row) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="count"
          label="汇报次数"
          width="120"
          sortable
          align="center"
        />

        <el-table-column
          prop="totalPromotionCost"
          label="总推广费用"
          width="160"
          sortable
          align="right"
        >
          <template #default="{ row }">
            <span class="price profit">{{ formatCurrency(row.totalPromotionCost) }}</span>
          </template>
        </el-table-column>

        <el-table-column
          v-if="!isMobileDevice"
          label="操作"
          width="120"
          align="center"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="exportRowData(row)"
              :loading="exportLoading"
              class="export-btn"
            >
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, Document, User, UserFilled, Money, DataAnalysis, ArrowDown } from '@element-plus/icons-vue'
import { dailyReportApi } from '@/api'
import { useCampaignCategoryStore } from '@/stores/campaignCategory'
import * as XLSX from 'xlsx'

// 响应式数据
const loading = ref(false)
const exportLoading = ref(false)
const dateRange = ref([])
const groupBy = ref('reporter')
const timeUnit = ref('day')
const statistics = ref([])
const summary = ref({})
const categories = ref([])
const showStatsPanel = ref(false) // 统计面板折叠状态

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索表单
const searchForm = reactive({
  groupName: '',
  productName: '',
  categoryId: '',
  reportType: '',
  reportHour: ''
})

// Store
const campaignCategoryStore = useCampaignCategoryStore()

// 初始化
onMounted(async () => {
  await loadCategories()
  await fetchStatistics()
})

// 加载投放类别
const loadCategories = async () => {
  try {
    await campaignCategoryStore.fetchMainCategories()
    categories.value = campaignCategoryStore.mainCategories
  } catch (error) {
    console.error('加载投放类别失败:', error)
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  loading.value = true
  try {
    const params = {
      groupBy: groupBy.value,
      timeUnit: timeUnit.value,
      page: currentPage.value,
      limit: pageSize.value,
      ...searchForm
    }

    if (dateRange.value && dateRange.value.length === 2) {
      // 处理日期范围，添加时间部分
      const startDate = new Date(dateRange.value[0])
      startDate.setHours(0, 0, 0, 0)
      params.startDate = startDate.toISOString()

      const endDate = new Date(dateRange.value[1])
      endDate.setHours(23, 59, 59, 999)
      params.endDate = endDate.toISOString()
    }

    const response = await dailyReportApi.getDailyReportStatistics(params)
    if (response.success) {
      statistics.value = response.data.statistics
      summary.value = response.data.summary
      total.value = response.data.total || response.data.statistics.length
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索条件变化（重置页码并搜索）
const handleSearchChange = () => {
  currentPage.value = 1 // 重置页码
  fetchStatistics()
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  handleSearchChange()
}

// 处理报告类型变化
const handleReportTypeChange = (value) => {
  // 如果切换到日报，清空时段筛选
  if (value !== 'hourly') {
    searchForm.reportHour = ''
  }
  handleSearchChange()
}

// 重置筛选条件
const resetFilters = () => {
  dateRange.value = []
  groupBy.value = 'group'
  timeUnit.value = 'day'
  searchForm.groupName = ''
  searchForm.productName = ''
  searchForm.categoryId = ''
  searchForm.reportType = ''
  searchForm.reportHour = ''
  currentPage.value = 1 // 重置页码
  fetchStatistics()
}

// 分页处理函数
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1 // 改变页面大小时重置到第一页
  fetchStatistics()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  fetchStatistics()
}

// 导出详细数据（全局导出 - 应用所有搜索条件）
const exportData = async () => {
  exportLoading.value = true
  try {
    // 收集所有搜索条件
    const params = {
      ...searchForm,
      limit: 10000 // 获取大量数据用于导出
    }

    // 添加日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      // 处理日期范围，添加时间部分
      const startDate = new Date(dateRange.value[0])
      startDate.setHours(0, 0, 0, 0)
      params.startDate = startDate.toISOString()

      const endDate = new Date(dateRange.value[1])
      endDate.setHours(23, 59, 59, 999)
      params.endDate = endDate.toISOString()
    }

    console.log('全局导出参数:', params)

    // 调用获取日报列表的API
    const response = await dailyReportApi.getDailyReports(params)
    if (response.success && response.data && response.data.length > 0) {
      // 创建工作表数据
      const wsData = []

      // 添加表头
      wsData.push(['日期', '组别/名字', '产品', '推广费', '总销售额', '转化数', 'ROI', '备注'])

      // 添加数据行
      const merges = [] // 用于存储合并单元格信息
      let currentRow = 1 // 从第二行开始（第一行是表头）

      // 遍历每个日报
      response.data.forEach(report => {
        const dateKey = formatDate(report.reportDate)
        const groupKey = report.groupName || '-'
        const remark = report.remark || '-'
        const products = report.products || []

        const startRow = currentRow
        const productCount = products.length

        if (productCount === 0) {
          // 如果没有产品，添加一行空数据
          wsData.push([dateKey, groupKey, '-', 0, 0, 0, 0, remark])
          currentRow++
        } else {
          // 添加每个产品的数据
          products.forEach((product, index) => {
            wsData.push([
              index === 0 ? dateKey : '', // 只在第一行显示日期
              index === 0 ? groupKey : '', // 只在第一行显示组别
              product.productName || '-',
              product.promotionCost || 0,
              product.totalSalesAmount || 0,
              product.totalSalesQuantity || 0,
              product.roi || 0,
              index === 0 ? remark : '' // 只在第一行显示备注
            ])
            currentRow++
          })

          // 如果有多个产品，需要合并日期、组别和备注单元格
          if (productCount > 1) {
            const endRow = currentRow - 1
            // 合并日期列 (A列)
            merges.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } })
            // 合并组别列 (B列)
            merges.push({ s: { r: startRow, c: 1 }, e: { r: endRow, c: 1 } })
            // 合并备注列 (H列)
            merges.push({ s: { r: startRow, c: 7 }, e: { r: endRow, c: 7 } })
          }
        }
      })

      // 创建工作表
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // 应用合并单元格
      if (merges.length > 0) {
        ws['!merges'] = merges
      }

      // 设置列宽
      ws['!cols'] = [
        { wch: 12 }, // 日期
        { wch: 15 }, // 组别/名字
        { wch: 20 }, // 产品
        { wch: 12 }, // 推广费
        { wch: 12 }, // 总销售额
        { wch: 10 }, // 转化数
        { wch: 12 }, // ROI
        { wch: 30 }  // 备注
      ]

      // 创建工作簿
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '详细数据')

      // 生成文件名
      let fileName = '统计数据_详细明细'
      if (dateRange.value && dateRange.value.length === 2) {
        fileName += `_${dateRange.value[0]}_至_${dateRange.value[1]}`
      } else {
        fileName += `_${new Date().toLocaleDateString().replace(/\//g, '-')}`
      }
      fileName += '.xlsx'

      XLSX.writeFile(wb, fileName)
      ElMessage.success('数据导出成功')
    } else {
      ElMessage.warning('没有可导出的数据')
    }
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败')
  } finally {
    exportLoading.value = false
  }
}

// 导出统计数据
const exportStatistics = () => {
  try {
    const exportData = statistics.value.map(item => {
      const baseData = {
        [getGroupColumnLabel()]: getGroupColumnValue(item),
        '汇报次数': item.count,
        '总推广费用': item.totalPromotionCost
      }

      return baseData
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '统计汇总')
    XLSX.writeFile(wb, `${getTableTitle()}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
    ElMessage.success('统计数据导出成功')
  } catch (error) {
    console.error('导出统计数据失败:', error)
    ElMessage.error('导出统计数据失败')
  }
}

// 导出单行数据
const exportRowData = async (row) => {
  exportLoading.value = true
  try {
    // 构建针对该行的筛选条件，只使用该行特定的筛选条件
    const params = {
      limit: 10000 // 获取大量数据用于导出
    }

    // 根据统计维度添加特定的筛选条件
    if (groupBy.value === 'group') {
      // 只导出该组别的数据
      params.groupName = row._id
    } else if (groupBy.value === 'reporter') {
      // 只导出该汇报人的数据
      if (row._id?.reporterId) {
        params.submitterId = row._id.reporterId
      } else {
        ElMessage.error('无效的汇报人信息')
        exportLoading.value = false
        return
      }
    } else if (groupBy.value === 'category') {
      // 只导出该投放类别的数据
      if (row._id?.categoryId) {
        params.categoryId = row._id.categoryId
      } else {
        ElMessage.error('无效的投放类别信息')
        exportLoading.value = false
        return
      }
    } else if (groupBy.value === 'time') {
      // 只导出该时间段的数据
      const timeStr = row._id
      if (timeUnit.value === 'day') {
        // 处理日期范围，添加时间部分
        const startDate = new Date(timeStr)
        startDate.setHours(0, 0, 0, 0)
        params.startDate = startDate.toISOString()

        const endDate = new Date(timeStr)
        endDate.setHours(23, 59, 59, 999)
        params.endDate = endDate.toISOString()
      } else if (timeUnit.value === 'month') {
        // 处理月的时间范围
        const [year, month] = timeStr.split('-')
        const startDate = new Date(`${year}-${month}-01`)
        startDate.setHours(0, 0, 0, 0)
        params.startDate = startDate.toISOString()

        const lastDay = new Date(year, month, 0).getDate()
        const endDate = new Date(`${year}-${month}-${lastDay.toString().padStart(2, '0')}`)
        endDate.setHours(23, 59, 59, 999)
        params.endDate = endDate.toISOString()
      } else {
        // 周的处理暂时使用原始时间字符串
        params.timeFilter = timeStr
      }
    }

    // 如果当前有全局时间范围筛选，且不是时间维度统计，则保留时间筛选
    if (dateRange.value && dateRange.value.length === 2 && groupBy.value !== 'time') {
      // 处理日期范围，添加时间部分
      const startDate = new Date(dateRange.value[0])
      startDate.setHours(0, 0, 0, 0)
      params.startDate = startDate.toISOString()

      const endDate = new Date(dateRange.value[1])
      endDate.setHours(23, 59, 59, 999)
      params.endDate = endDate.toISOString()
    }

    // 应用全局的报告类型和时段筛选
    if (searchForm.reportType) {
      params.reportType = searchForm.reportType
    }
    if (searchForm.reportHour) {
      params.reportHour = searchForm.reportHour
    }
    // 应用其他全局筛选条件（如果需要）
    if (searchForm.productName) {
      params.productName = searchForm.productName
    }

    console.log('行级导出参数:', params)

    // 调用获取日报列表的API
    const response = await dailyReportApi.getDailyReports(params)
    if (response.success && response.data && response.data.length > 0) {
      // 创建工作表数据
      const wsData = []

      // 添加表头
      wsData.push(['日期', '组别/名字', '产品', '推广费', '总销售额', '转化数', 'ROI', '备注'])

      // 添加数据行
      const merges = [] // 用于存储合并单元格信息
      let currentRow = 1 // 从第二行开始（第一行是表头）

      // 遍历每个日报
      response.data.forEach(report => {
        const dateKey = formatDate(report.reportDate)
        const groupKey = report.groupName || '-'
        const remark = report.remark || '-'
        const products = report.products || []

        const startRow = currentRow
        const productCount = products.length

        if (productCount === 0) {
          // 如果没有产品，添加一行空数据
          wsData.push([dateKey, groupKey, '-', 0, 0, 0, 0, remark])
          currentRow++
        } else {
          // 添加每个产品的数据
          products.forEach((product, index) => {
            wsData.push([
              index === 0 ? dateKey : '', // 只在第一行显示日期
              index === 0 ? groupKey : '', // 只在第一行显示组别
              product.productName || '-',
              product.promotionCost || 0,
              product.totalSalesAmount || 0,
              product.totalSalesQuantity || 0,
              product.roi || 0,
              index === 0 ? remark : '' // 只在第一行显示备注
            ])
            currentRow++
          })

          // 如果有多个产品，需要合并日期、组别和备注单元格
          if (productCount > 1) {
            const endRow = currentRow - 1
            // 合并日期列 (A列)
            merges.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } })
            // 合并组别列 (B列)
            merges.push({ s: { r: startRow, c: 1 }, e: { r: endRow, c: 1 } })
            // 合并备注列 (H列)
            merges.push({ s: { r: startRow, c: 7 }, e: { r: endRow, c: 7 } })
          }
        }
      })

      // 创建工作表
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // 应用合并单元格
      if (merges.length > 0) {
        ws['!merges'] = merges
      }

      // 设置列宽
      ws['!cols'] = [
        { wch: 12 }, // 日期
        { wch: 15 }, // 组别/名字
        { wch: 20 }, // 产品
        { wch: 12 }, // 推广费
        { wch: 12 }, // 总销售额
        { wch: 10 }, // 转化数
        { wch: 12 }, // ROI
        { wch: 30 }  // 备注
      ]

      // 创建工作簿
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '详细数据')

      // 生成文件名
      const dimensionValue = getGroupColumnValue(row)
      const fileName = `${getGroupColumnLabel()}_${dimensionValue}_详细数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`

      XLSX.writeFile(wb, fileName)
      ElMessage.success('数据导出成功')
    } else {
      ElMessage.warning('没有可导出的数据')
    }
  } catch (error) {
    console.error('导出行数据失败:', error)
    ElMessage.error('导出数据失败')
  } finally {
    exportLoading.value = false
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  try {
    const d = new Date(date)
    const month = d.getMonth() + 1
    const day = d.getDate()
    return `${month}月${day}号`
  } catch (error) {
    return '-'
  }
}

// 格式化货币
const formatCurrency = (value) => {
  if (!value) return '¥0'
  return `¥${Number(value).toLocaleString()}`
}

// 获取表格标题
const getTableTitle = () => {
  const titles = {
    group: '按组别统计',
    reporter: '按汇报人统计',
    category: '按投放类别统计',
    time: `按${timeUnit.value === 'day' ? '日' : timeUnit.value === 'week' ? '周' : '月'}统计`
  }
  return titles[groupBy.value] || '统计数据'
}

// 获取分组列属性
const getGroupColumnProp = () => {
  return '_id'
}

// 获取分组列标签
const getGroupColumnLabel = () => {
  const labels = {
    group: '组别名称',
    reporter: '汇报人',
    category: '投放类别',
    time: '时间'
  }
  return labels[groupBy.value] || '分组'
}

// 获取分组列值
const getGroupColumnValue = (row) => {
  if (groupBy.value === 'reporter') {
    return row._id?.reporterName || '未知用户'
  } else if (groupBy.value === 'category') {
    return row._id?.categoryName || '未分类'
  } else {
    return row._id || '未知'
  }
}




</script>

<style scoped>
.report-statistics {
  padding: 20px;
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

/* 搜索卡片 - 商务简洁风格 */
.search-card.business-style {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 16px;
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
  margin-bottom: 0;
  margin-right: 0;
}

.search-item .el-form-item__label {
  color: #606266;
  font-size: 13px;
  font-weight: 500;
  padding-bottom: 4px;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 0;
}

/* 可折叠统计面板 */
.stats-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.stats-header:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
}

.stats-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.stats-toggle-icon {
  margin-right: 8px;
  transition: transform 0.3s ease;
}

.stats-toggle-icon.rotated {
  transform: rotate(180deg);
}

.stats-summary {
  font-size: 14px;
  color: #6b7280;
}

.stats-content-wrapper {
  padding: 20px;
}

.stats-item {
  display: flex;
  align-items: center;
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
}

.stats-icon.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: white;
}

.stats-icon.success {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
}

.stats-icon.danger {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  color: white;
}

.stats-icon.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
  color: white;
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

/* 表格卡片 */
.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 10px;
}

/* 按钮样式 */
.action-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 13px;
}

.action-btn.success {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
  color: white;
}

/* 表格样式 */
.price {
  font-weight: 600;
}

.price.profit {
  color: #67c23a;
}

/* 导出按钮样式 */
.export-btn {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  border-radius: 4px;
}

.export-btn .el-icon {
  margin-right: 4px;
}

/* 分页样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 20px 0;
}

.mr-1 {
  margin-right: 4px;
}

.mb-1 {
  margin-bottom: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .report-statistics {
    padding: 10px;
  }

  .search-fields {
    flex-direction: column;
    align-items: stretch;
  }

  .search-item {
    margin-bottom: 10px;
  }

  .stats-cards {
    flex-direction: column;
  }

  .stats-cards .el-col {
    margin-bottom: 10px;
  }

  .stats-header {
    padding: 12px 16px;
  }

  .stats-title {
    font-size: 14px;
  }

  .stats-content-wrapper {
    padding: 16px;
  }
}
</style>
