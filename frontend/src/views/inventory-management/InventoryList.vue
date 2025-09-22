<template>
  <div class="inventory-management">
    <!-- 页面标题 -->
     <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><List /></el-icon>
        <h2>库存管理</h2>
      </div>
      <div class="page-description">
        库存管理，实时出库、入库等
      </div>
    </div>

    <!-- 搜索筛选卡片 -->
    <div class="search-card business-style">
      <el-form :model="searchForm" :inline="true" class="business-search-form">
        <div class="search-fields">
          <el-form-item label="关键词搜索" class="search-item">
            <el-input
              v-model="searchForm.search"
              placeholder="搜索外部编码、内部编码、货号名称、厂家"
              clearable
              class="business-input"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="厂家" class="search-item">
            <el-input
              v-model="searchForm.manufacturer"
              placeholder="请输入厂家"
              clearable
              class="business-input"
            />
          </el-form-item>
          <el-form-item label="状态" class="search-item">
            <el-select
              v-model="searchForm.status"
              placeholder="全部状态"
              clearable
              class="business-select"
            >
              <el-option label="活跃" value="active" />
              <el-option label="预警" value="warning" />
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
        </div>

        <div class="search-actions">
          <el-button type="primary" @click="handleSearch" :icon="Search" size="small">查询</el-button>
          <el-button @click="handleReset" size="small">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards" v-if="inventoryStore.statistics">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ inventoryStore.statistics.inventory?.total || 0 }}</div>
              <div class="stat-label">总库存记录</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon active">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ inventoryStore.statistics.inventory?.active || 0 }}</div>
              <div class="stat-label">活跃库存</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ inventoryStore.statistics.inventory?.warning || 0 }}</div>
              <div class="stat-label">预警数量</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon quantity">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ inventoryStore.statistics.quantity?.totalQuantity || 0 }}</div>
              <div class="stat-label">总库存数量</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="handleAddInventory" :icon="Plus" class="action-btn primary" v-if="hasAnyPermission(['inventory:create'])">
          添加库存
        </el-button>
        <el-button
          type="primary"
          @click="handleSelectedSummary"
          :disabled="selectedRows.length === 0"
          :icon="DataAnalysis"
          class="action-btn primary"
          plain
        >
          多选汇总 ({{ selectedRows.length }})
        </el-button>
        <el-button @click="handleExport" :icon="Download" class="action-btn">
          导出数据
          <span v-if="selectedRows.length">({{ selectedRows.length }}条)</span>
        </el-button>
      </div>
      <div class="action-right">
        <span class="total-info">共 {{ inventoryStore.pagination.totalRecords }} 条记录</span>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card">
      <el-table
        :data="inventoryStore.inventories"
        v-loading="inventoryStore.loading"
        stripe
        max-height="600"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="externalCode" label="外部编码" width="120" show-overflow-tooltip />
        <el-table-column prop="internalCode" label="内部编码" width="120" show-overflow-tooltip />
        <el-table-column prop="productName" label="货号名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="manufacturer" label="厂家" width="120" show-overflow-tooltip />
        <el-table-column prop="specification" label="规格" width="100" show-overflow-tooltip />
        <el-table-column prop="currentQuantity" label="当前库存" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getQuantityTagType(row.currentQuantity)">
              {{ row.currentQuantity }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="productionDate" label="生产日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.productionDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="bulkDate" label="大货日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.bulkDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="120" align="center">
          <template #default="{ row }">
            <div v-if="row.images && row.images.length > 0" class="image-numbers-container">
              <span
                v-for="(image, index) in row.images"
                :key="image._id || image.id || index"
                class="image-number-item"
                @click="previewSingleImage(row.images, index)"
                :title="`点击查看第${index + 1}张图片`"
              >
                {{ index + 1 }}
              </span>
            </div>
            <span v-else class="no-image">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)" v-if="hasAnyPermission(['inventory:update'])" link>
              编辑
            </el-button>
            <el-button type="success" size="small" @click="handleInventoryIn(row)" v-if="hasAnyPermission(['inventory:in'])" link>
              入库
            </el-button>
            <el-button type="warning" size="small" @click="handleInventoryOut(row)" v-if="hasAnyPermission(['inventory:out'])" :disabled="row.currentQuantity <= 0" link>
              出库
            </el-button>
            <el-button type="info" size="small" @click="handleViewRecords(row)" link>
              记录
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)" v-if="hasAnyPermission(['inventory:delete'])" :disabled="row.currentQuantity > 0" link>
              删除
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
          :total="inventoryStore.pagination.totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingInventory ? '编辑库存' : '添加库存'"
      width="800px"
      append-to-body
      @close="handleDialogClose"
    >
      <el-form
        ref="inventoryFormRef"
        :model="inventoryForm"
        :rules="inventoryRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="外部编码" prop="externalCode">
              <el-input v-model="inventoryForm.externalCode" placeholder="请输入外部编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="货号名称" prop="productName">
              <el-input v-model="inventoryForm.productName" placeholder="请输入货号名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="厂家" prop="manufacturer">
              <el-input v-model="inventoryForm.manufacturer" placeholder="请输入厂家" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格" prop="specification">
              <el-input v-model="inventoryForm.specification" placeholder="请输入规格" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产日期" prop="productionDate">
              <el-date-picker
                v-model="inventoryForm.productionDate"
                type="date"
                placeholder="请选择生产日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="大货日期" prop="bulkDate">
              <el-date-picker
                v-model="inventoryForm.bulkDate"
                type="date"
                placeholder="请选择大货日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="当前库存" prop="currentQuantity">
              <el-input-number
                v-model="inventoryForm.currentQuantity"
                :min="0"
                :precision="0"
                style="width: 100%"
                placeholder="请输入当前库存数量"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="商品图片">
          <div class="image-upload-container">
            <!-- 图片预览和上传区域 - 统一在一行显示 -->
            <div class="image-items-container">
              <!-- 已选择的图片预览 -->
              <div
                v-for="(image, index) in formImages"
                :key="image._id || image.id || index"
                class="image-preview-item"
              >
                <el-image
                  :src="getImageUrlSync(image)"
                  :preview-src-list="getFormImageUrls()"
                  :initial-index="index"
                  fit="cover"
                  class="preview-image"
                />
                <div class="image-overlay">
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    circle
                    @click="removeImage(index)"
                    class="delete-btn"
                  />
                </div>
              </div>

              <!-- 上传按钮 - 与图片在同一行 -->
              <el-upload
                v-if="!formImages || formImages.length < 5"
                ref="uploadRef"
                :auto-upload="false"
                :before-upload="beforeUpload"
                :on-change="handleFileChange"
                :show-file-list="false"
                accept="image/*"
                multiple
                class="image-uploader"
              >
                <div class="upload-trigger">
                  <el-icon class="upload-icon"><Plus /></el-icon>
                  <div class="upload-text">选择图片</div>
                </div>
              </el-upload>
            </div>
          </div>
          <div class="upload-tips">
            <el-text size="small" type="info">
              支持 JPG、PNG、GIF 格式，单个文件不超过 5MB，最多上传 5 张图片
            </el-text>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="inventoryForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ editingInventory ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 入库操作弹框 -->
    <el-dialog
      v-model="showInDialog"
      title="入库操作"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="inForm" label-width="80px">
        <el-form-item label="商品名称">
          <span>{{ currentInventory?.productName }}</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span>{{ currentInventory?.currentQuantity }}</span>
        </el-form-item>
        <el-form-item label="入库数量" required>
          <el-input
            v-model.number="inForm.quantity"
            type="number"
            placeholder="请输入入库数量"
            min="1"
          />
        </el-form-item>
        <el-form-item label="入库原因" required>
          <el-input
            v-model="inForm.reason"
            placeholder="请输入入库原因"
            maxlength="100"
            show-word-limit
            type="textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showInDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmInventoryIn" :loading="inLoading">
            确定入库
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 出库操作弹框 -->
    <el-dialog
      v-model="showOutDialog"
      title="出库操作"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form :model="outForm" label-width="80px">
        <el-form-item label="商品名称">
          <span>{{ currentInventory?.productName }}</span>
        </el-form-item>
        <el-form-item label="当前库存">
          <span>{{ currentInventory?.currentQuantity }}</span>
        </el-form-item>
        <el-form-item label="出库数量" required>
          <el-input
            v-model.number="outForm.quantity"
            type="number"
            placeholder="请输入出库数量"
            min="1"
            :max="currentInventory?.currentQuantity"
          />
        </el-form-item>
        <el-form-item label="出库原因" required>
          <el-input
            v-model="outForm.reason"
            placeholder="请输入出库原因"
            maxlength="100"
            type="textarea"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showOutDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmInventoryOut" :loading="outLoading">
            确定出库
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 多选汇总对话框 -->
    <el-dialog
      v-model="showSelectedSummaryDialog"
      title="多选数据汇总"
      width="60vw"
      append-to-body
    >
      <div class="selected-summary-container">
        <!-- 汇总统计卡片 -->
        <div class="summary-stats">
          <el-row :gutter="16" style="margin-bottom: 20px;">
            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon total">
                    <el-icon><Box /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">{{ selectedSummaryStats.totalCurrentQuantity }}</div>
                    <div class="stats-label">总当前库存</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon active">
                    <el-icon><CircleCheck /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">{{ selectedSummaryStats.averageQuantity }}</div>
                    <div class="stats-label">平均库存</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon warning">
                    <el-icon><Warning /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">{{ selectedSummaryStats.activeCount }}</div>
                    <div class="stats-label">活跃商品数</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon quantity">
                    <el-icon><DataAnalysis /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">{{ selectedSummaryStats.recordCount }}</div>
                    <div class="stats-label">选中记录数</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 详细数据表格 -->
        <div class="summary-table">
          <el-table :data="selectedRows" max-height="400" border stripe>
            <el-table-column prop="externalCode" label="外部编码" width="120" />
            <el-table-column prop="internalCode" label="内部编码" width="120" />
            <el-table-column prop="productName" label="货号名称" min-width="150" />
            <el-table-column prop="manufacturer" label="厂家" width="120" />
            <el-table-column prop="currentQuantity" label="当前库存" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getQuantityTagType(row.currentQuantity)">
                  {{ row.currentQuantity }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportSelectedSummaryData" type="primary" :icon="Download">
            导出汇总数据
          </el-button>
          <el-button @click="showSelectedSummaryDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 操作记录弹框 -->
    <el-dialog
      v-model="showRecordsDialog"
      :title="`操作记录 - ${currentInventory?.productName || ''}`"
      width="70vw"
      append-to-body
    >
      <div class="records-container">
        <!-- 搜索表单 -->
        <div class="records-search-form">
          <el-form :model="recordsSearchForm" inline>
            <el-form-item label="操作类型">
              <el-select v-model="recordsSearchForm.operationType" placeholder="请选择" clearable style="width: 120px">
                <el-option label="创建" value="create" />
                <el-option label="更新" value="update" />
                <el-option label="入库" value="in" />
                <el-option label="出库" value="out" />
                <el-option label="删除" value="delete" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作原因">
              <el-input
                v-model="recordsSearchForm.reason"
                placeholder="请输入操作原因关键词"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="操作人">
              <el-input
                v-model="recordsSearchForm.operatedBy"
                placeholder="请输入操作人姓名或账号"
                clearable
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="操作时间">
              <el-date-picker
                v-model="recordsSearchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 240px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRecordsSearch" :icon="Search">查询</el-button>
              <el-button @click="handleRecordsReset">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 操作记录表格 -->
        <el-table
          :data="inventoryRecords"
          v-loading="recordsLoading"
          stripe
          border
          max-height="400"
        >
          <el-table-column prop="operationType" label="操作类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getOperationTypeTagType(row.operationType)">
                {{ getOperationTypeText(row.operationType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量变化" width="120" align="center">
            <template #default="{ row }">
              <span :class="getQuantityChangeClass(row.operationType, row.quantity)">
                {{ getQuantityChangeText(row.operationType, row.quantity) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="quantityBefore" label="变化前" width="100" align="center" />
          <el-table-column prop="quantityAfter" label="变化后" width="100" align="center" />
          <el-table-column prop="reason" label="操作原因" min-width="200" show-overflow-tooltip />
          <el-table-column prop="operatedBy" label="操作人" width="120">
            <template #default="{ row }">
              {{ row.operatedBy?.username || '系统' }}
            </template>
          </el-table-column>
          <el-table-column prop="operatedAt" label="操作时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.operatedAt) }}
            </template>
          </el-table-column>
        </el-table>

        <div v-if="inventoryRecords.length === 0 && !recordsLoading" class="no-records">
          <el-empty description="暂无操作记录" />
        </div>

        <!-- 分页组件 -->
        <div v-if="recordsTotal > 0" class="records-pagination">
          <el-pagination
            v-model:current-page="recordsCurrentPage"
            v-model:page-size="recordsPageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="recordsTotal"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handleRecordsPageChange"
            @size-change="handleRecordsPageSizeChange"
          />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showRecordsDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片预览器 -->
    <el-image-viewer
      v-if="imagePreviewVisible"
      teleported
      :url-list="getPreviewImageUrls()"
      :initial-index="currentImageIndex"
      @close="closeImagePreview"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Delete,
  Search,
  Refresh,
  RefreshRight,
  Download,
  Box,
  CircleCheck,
  Warning,
  DataAnalysis,
  List
} from '@element-plus/icons-vue'
import { useInventoryStore } from '../../stores/inventory'
import { fileApi, inventoryApi } from '../../api/index'
import checkPermissions from '../../utils/checkPermissions'
import { exportToCSV, exportToExcel } from '../../utils/excelUtils'

// 权限检查函数
const hasAnyPermission = checkPermissions

// 使用 Pinia store
const inventoryStore = useInventoryStore()

// 响应式数据
const submitting = ref(false)
const showAddDialog = ref(false)
const editingInventory = ref(null)
const inventoryFormRef = ref()
const uploadRef = ref()
const currentPage = ref(1)
const pageSize = ref(20)
const dateRange = ref([])
const formImages = ref([])

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
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    }
  },
  {
    text: '最近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return [start, end]
    }
  },
  {
    text: '上月',
    value: () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return [start, end]
    }
  }
]

// 图片预览相关
const imagePreviewVisible = ref(false)
const previewImages = ref([])
const currentImageIndex = ref(0)

// 入库出库弹框相关
const showInDialog = ref(false)
const showOutDialog = ref(false)
const currentInventory = ref(null)
const inLoading = ref(false)
const outLoading = ref(false)

// 入库表单
const inForm = reactive({
  quantity: null,
  reason: ''
})

// 出库表单
const outForm = reactive({
  quantity: null,
  reason: ''
})

// 多选相关
const selectedRows = ref([])
const showSelectedSummaryDialog = ref(false)

// 多选汇总统计数据
const selectedSummaryStats = ref({
  totalCurrentQuantity: 0,
  averageQuantity: 0,
  activeCount: 0,
  recordCount: 0
})

// 操作记录弹框相关
const showRecordsDialog = ref(false)
const inventoryRecords = ref([])
const recordsLoading = ref(false)
const recordsCurrentPage = ref(1)
const recordsPageSize = ref(10)
const recordsTotal = ref(0)

// 操作记录搜索表单
const recordsSearchForm = reactive({
  operationType: '',
  reason: '',
  operatedBy: '',
  dateRange: []
})

// 搜索表单
const searchForm = reactive({
  search: '',
  manufacturer: '',
  status: '',
  startDate: '',
  endDate: ''
})

// 库存表单
const inventoryForm = reactive({
  externalCode: '',
  productName: '',
  manufacturer: '',
  specification: '',
  productionDate: '',
  bulkDate: '',
  currentQuantity: 0,
  remark: ''
})

// 表单验证规则
const inventoryRules = {
  externalCode: [
    { required: true, message: '请输入外部编码', trigger: 'blur' }
  ],
  productName: [
    { required: true, message: '请输入货号名称', trigger: 'blur' }
  ],
  manufacturer: [
    { required: true, message: '请输入厂家', trigger: 'blur' }
  ],
  specification: [
    { required: true, message: '请输入规格', trigger: 'blur' }
  ],
  productionDate: [
    { required: true, message: '请选择生产日期', trigger: 'change' }
  ],
  bulkDate: [
    { required: true, message: '请选择大货日期', trigger: 'change' }
  ],
  currentQuantity: [
    { required: true, message: '请输入当前库存数量', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value === null || value === undefined || value === '') {
          callback(new Error('请输入当前库存数量'))
        } else if (isNaN(value) || value < 0) {
          callback(new Error('数量不能为负数'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 工具函数
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getQuantityTagType = (quantity) => {
  if (quantity === 0) return 'danger'
  if (quantity <= 10) return 'warning'
  return 'success'
}

const getStatusTagType = (status) => {
  const typeMap = {
    'active': 'success',
    'warning': 'warning'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    'active': '活跃',
    'warning': '预警'
  }
  return textMap[status] || status
}

// 操作记录相关辅助函数
const getOperationTypeTagType = (operationType) => {
  const typeMap = {
    'create': 'success',
    'update': 'info',
    'in': 'success',
    'out': 'warning',
    'delete': 'danger'
  }
  return typeMap[operationType] || 'info'
}

const getOperationTypeText = (operationType) => {
  const textMap = {
    'create': '创建',
    'update': '更新',
    'in': '入库',
    'out': '出库',
    'delete': '删除'
  }
  return textMap[operationType] || operationType
}

const getQuantityChangeClass = (operationType, quantity) => {
  if (operationType === 'in') return 'quantity-increase'
  if (operationType === 'out') return 'quantity-decrease'
  return ''
}

const getQuantityChangeText = (operationType, quantity) => {
  if (operationType === 'in') return `+${quantity}`
  if (operationType === 'out') return `-${Math.abs(quantity)}`
  return quantity || 0
}

// 操作记录搜索处理
const handleRecordsSearch = () => {
  if (currentInventory.value) {
    fetchInventoryRecords(currentInventory.value._id, true)
  }
}

// 重置操作记录搜索
const handleRecordsReset = () => {
  recordsSearchForm.operationType = ''
  recordsSearchForm.reason = ''
  recordsSearchForm.operatedBy = ''
  recordsSearchForm.dateRange = []
  if (currentInventory.value) {
    fetchInventoryRecords(currentInventory.value._id, true)
  }
}

// 操作记录分页处理
const handleRecordsPageChange = (page) => {
  recordsCurrentPage.value = page
  if (currentInventory.value) {
    fetchInventoryRecords(currentInventory.value._id, false)
  }
}

// 操作记录页面大小变化
const handleRecordsPageSizeChange = (size) => {
  recordsPageSize.value = size
  recordsCurrentPage.value = 1
  if (currentInventory.value) {
    fetchInventoryRecords(currentInventory.value._id, false)
  }
}

const getImageUrl = (fileId) => {
  if (!fileId) return ''
  // 构建文件访问URL，使用FileInfo的_id
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/files/${fileId}`
}

const getImagePreviewList = (images) => {
  return images.map(image => getImageUrl(image._id))
}

// 获取图片URL（同步版本，用于模板）
const getImageUrlSync = (image) => {
  // 如果是临时文件（File对象），创建本地URL
  if (image instanceof File) {
    return URL.createObjectURL(image)
  }

  // 如果是已保存的文件
  const imageId = typeof image === 'string' ? image : (image._id || image.id)

  if (!imageId) {
    return ''
  }

  // 生成文件访问URL（不需要token）
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const url = `${baseUrl}/files/${imageId}`

  return url
}

// 获取表单图片URL列表（用于el-image预览）
const getFormImageUrls = () => {
  if (!formImages.value || !Array.isArray(formImages.value)) {
    return []
  }
  return formImages.value.map(image => getImageUrlSync(image)).filter(url => url)
}

// 预览单张图片
const previewSingleImage = (images, index) => {
  if (images && images.length > 0 && index >= 0 && index < images.length) {
    previewImages.value = [...images]
    currentImageIndex.value = index
    imagePreviewVisible.value = true
  }
}

// 关闭图片预览
const closeImagePreview = () => {
  imagePreviewVisible.value = false
  previewImages.value = []
  currentImageIndex.value = 0
}

// 获取预览图片URL列表
const getPreviewImageUrls = () => {
  if (!previewImages.value || !Array.isArray(previewImages.value)) {
    return []
  }
  return previewImages.value.map(image => getImageUrlSync(image)).filter(url => url)
}

// 图片加载错误处理
const handleImageError = (event) => {
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
}

// 事件处理函数
const handleDateRangeChange = (dates) => {
  if (dates && dates.length === 2) {
    searchForm.startDate = dates[0]
    searchForm.endDate = dates[1]
  } else {
    searchForm.startDate = ''
    searchForm.endDate = ''
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
  fetchStats()
}

const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    manufacturer: '',
    status: '',
    startDate: '',
    endDate: ''
  })
  dateRange.value = []
  currentPage.value = 1
  fetchData()
  fetchStats()
}

const handleRefresh = () => {
  fetchData()
  fetchStats()
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  fetchData()
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  fetchData()
}

const fetchData = () => {
  const params = {
    page: currentPage.value,
    limit: pageSize.value,
    ...searchForm
  }
  inventoryStore.fetchInventories(params)
}

const fetchStats = () => {
  const params = {}

  // 传递所有搜索条件
  if (searchForm.search) params.search = searchForm.search
  if (searchForm.manufacturer) params.manufacturer = searchForm.manufacturer
  if (searchForm.status) params.status = searchForm.status
  if (searchForm.startDate) params.startDate = searchForm.startDate
  if (searchForm.endDate) params.endDate = searchForm.endDate

  inventoryStore.fetchInventoryStats(params)
}

const resetForm = () => {
  inventoryForm.externalCode = ''
  inventoryForm.productName = ''
  inventoryForm.manufacturer = ''
  inventoryForm.specification = ''
  inventoryForm.productionDate = ''
  inventoryForm.bulkDate = ''
  inventoryForm.currentQuantity = 0
  inventoryForm.remark = ''
  formImages.value = []
}

// 上传前检查
const beforeUpload = (file) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }

  // 检查文件大小
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }

  // 检查图片数量
  if (formImages.value.length >= 5) {
    ElMessage.error('最多只能上传 5 张图片!')
    return false
  }

  return false // 阻止自动上传
}

// 文件选择变化回调
const handleFileChange = (file, fileList) => {
  const rawFile = file.raw

  // 检查文件类型
  const isImage = rawFile.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return
  }

  // 检查文件大小
  const isLt5M = rawFile.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return
  }

  // 检查图片数量
  if (formImages.value.length >= 5) {
    ElMessage.error('最多只能上传 5 张图片!')
    return
  }

  // 添加到临时图片列表
  formImages.value.push(rawFile)
  ElMessage.success('图片添加成功')
}

// 移除图片
const removeImage = (index) => {
  formImages.value.splice(index, 1)
}

// 上传单个图片文件
const uploadSingleImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fileApi.uploadFile(formData)

    if (response.success && response.data) {
      return response.data._id || response.data.id
    } else {
      throw new Error(response.message || '图片上传失败')
    }
  } catch (error) {
    throw error
  }
}

const handleAddInventory = () => {
  resetForm()
  editingInventory.value = null
  showAddDialog.value = true
}

const handleEdit = (inventory) => {
  editingInventory.value = inventory
  inventoryForm.externalCode = inventory.externalCode
  inventoryForm.productName = inventory.productName
  inventoryForm.manufacturer = inventory.manufacturer
  inventoryForm.specification = inventory.specification
  inventoryForm.productionDate = inventory.productionDate?.split('T')[0] || ''
  inventoryForm.bulkDate = inventory.bulkDate?.split('T')[0] || ''
  inventoryForm.currentQuantity = inventory.currentQuantity
  inventoryForm.remark = inventory.remark || ''

  // 设置图片预览
  if (inventory.images && inventory.images.length > 0) {
    formImages.value = [...inventory.images]
  } else {
    formImages.value = []
  }

  showAddDialog.value = true
}

const handleSubmit = async () => {
  if (!inventoryFormRef.value) return

  try {
    await inventoryFormRef.value.validate()
    submitting.value = true

    // 处理图片上传
    const imageIds = []

    for (const image of formImages.value) {
      if (image instanceof File) {
        // 新上传的图片，需要先上传到服务器
        try {
          const imageId = await uploadSingleImage(image)
          imageIds.push(imageId)
        } catch (error) {
          ElMessage.error(`图片上传失败: ${error.message}`)
          return
        }
      } else {
        // 已存在的图片，直接使用ID
        imageIds.push(image._id || image.id || image)
      }
    }

    const submitData = {
      ...inventoryForm,
      currentQuantity: Number(inventoryForm.currentQuantity) || 0,
      images: imageIds
    }

    let result
    if (editingInventory.value) {
      // 编辑模式
      result = await inventoryStore.updateInventory(editingInventory.value._id, submitData)
      if (result.success) {
        ElMessage.success('编辑成功')
      } else {
        ElMessage.error(result.message || '编辑失败')
      }
    } else {
      // 新增模式
      result = await inventoryStore.addInventory(submitData)
      if (result.success) {
        ElMessage.success('添加成功')
      } else {
        ElMessage.error(result.message || '添加失败')
      }
    }

    if (result.success) {
      showAddDialog.value = false
      fetchData()
      fetchStats()
    }
  } catch {
    // 验证失败
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  resetForm()
  editingInventory.value = null
}

const handleDelete = async (inventory) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除库存记录 "${inventory.productName}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const result = await inventoryStore.deleteInventory(inventory._id)
    if (result.success) {
      ElMessage.success('删除成功')
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch {
    // 用户取消删除
  }
}

const handleInventoryIn = (inventory) => {
  currentInventory.value = inventory
  inForm.quantity = null
  inForm.reason = ''
  showInDialog.value = true
}

const confirmInventoryIn = async () => {
  // 验证表单
  if (!inForm.quantity || inForm.quantity <= 0) {
    ElMessage.error('请输入有效的入库数量')
    return
  }

  if (!inForm.reason.trim()) {
    ElMessage.error('请输入入库原因')
    return
  }

  inLoading.value = true

  try {
    const result = await inventoryStore.inventoryIn(currentInventory.value._id, {
      quantity: Number(inForm.quantity),
      reason: inForm.reason.trim()
    })

    if (result.success) {
      ElMessage.success('入库成功')
      showInDialog.value = false
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(result.message || '入库失败')
    }
  } catch (error) {
    ElMessage.error('入库操作失败')
  } finally {
    inLoading.value = false
  }
}

const handleInventoryOut = (inventory) => {
  currentInventory.value = inventory
  outForm.quantity = null
  outForm.reason = ''
  showOutDialog.value = true
}

const confirmInventoryOut = async () => {
  // 验证表单
  if (!outForm.quantity || outForm.quantity <= 0) {
    ElMessage.error('请输入有效的出库数量')
    return
  }

  if (outForm.quantity > currentInventory.value.currentQuantity) {
    ElMessage.error(`出库数量不能超过当前库存（${currentInventory.value.currentQuantity}）`)
    return
  }

  if (!outForm.reason.trim()) {
    ElMessage.error('请输入出库原因')
    return
  }

  outLoading.value = true

  try {
    const result = await inventoryStore.inventoryOut(currentInventory.value._id, {
      quantity: Number(outForm.quantity),
      reason: outForm.reason.trim()
    })

    if (result.success) {
      ElMessage.success('出库成功')
      showOutDialog.value = false
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(result.message || '出库失败')
    }
  } catch (error) {
    ElMessage.error('出库操作失败')
  } finally {
    outLoading.value = false
  }
}


const handleViewRecords = (inventory) => {
  // 打开操作记录弹框
  currentInventory.value = inventory
  showRecordsDialog.value = true
  fetchInventoryRecords(inventory._id)
}

// 获取库存操作记录
const fetchInventoryRecords = async (inventoryId, resetPage = true) => {
  if (resetPage) {
    recordsCurrentPage.value = 1
  }

  recordsLoading.value = true
  try {
    const params = {
      page: recordsCurrentPage.value,
      limit: recordsPageSize.value
    }

    // 添加搜索条件
    if (recordsSearchForm.operationType) {
      params.operationType = recordsSearchForm.operationType
    }
    if (recordsSearchForm.reason) {
      params.reason = recordsSearchForm.reason
    }
    if (recordsSearchForm.operatedBy) {
      params.operatedBy = recordsSearchForm.operatedBy
    }
    if (recordsSearchForm.dateRange && recordsSearchForm.dateRange.length === 2) {
      params.startDate = recordsSearchForm.dateRange[0]
      params.endDate = recordsSearchForm.dateRange[1]
    }

    const response = await inventoryApi.getInventoryRecords(inventoryId, params)

    if (response.success) {
      inventoryRecords.value = response.data || []
      recordsTotal.value = response.pagination?.totalRecords || 0
    } else {
      ElMessage.error('获取操作记录失败')
      inventoryRecords.value = []
      recordsTotal.value = 0
    }
  } catch (error) {
    ElMessage.error('获取操作记录时发生错误')
    inventoryRecords.value = []
    recordsTotal.value = 0
  } finally {
    recordsLoading.value = false
  }
}

const handleExport = async () => {
  try {
    // 优先导出勾选的数据，如果没有勾选则导出所有数据
    const exportData = selectedRows.value.length > 0 ? selectedRows.value : inventoryStore.inventories

    if (exportData.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    const data = exportData.map(item => ({
      '外部编码': item.externalCode || '',
      '内部编码': item.internalCode || '',
      '货号名称': item.productName || '',
      '厂家': item.manufacturer || '',
      '当前库存': item.currentStock || 0,
      '预警库存': item.warningStock || 0,
      '状态': item.currentStock <= item.warningStock ? '预警' : '正常',
      '单位': item.unit || '',
      '成本价': item.costPrice || 0,
      '售价': item.sellingPrice || 0,
      '库存价值': (item.currentStock || 0) * (item.costPrice || 0),
      '备注': item.remark || '',
      '创建时间': item.createdAt ? formatDate(item.createdAt) : '',
      '更新时间': item.updatedAt ? formatDate(item.updatedAt) : ''
    }))

    // 使用 Excel 格式导出
    const headers = Object.keys(data[0])
    const exportType = selectedRows.value.length > 0 ? `勾选${selectedRows.value.length}条` : '全部'
    const filename = `库存数据_${exportType}_${new Date().toLocaleDateString().replace(/\//g, '-')}`

    try {
      // 尝试导出为 Excel 格式
      exportToExcel(data, headers, filename, '库存数据')
      const exportTypeMsg = selectedRows.value.length > 0 ? `勾选的${selectedRows.value.length}条数据` : '全部数据'
      ElMessage.success(`导出${exportTypeMsg}成功（Excel格式）`)
    } catch (excelError) {
      // 如果 Excel 导出失败，降级到 CSV
      console.warn('Excel导出失败，使用CSV格式：', excelError.message)

      const csvContent = exportToCSV(data, headers)

      // 添加BOM以支持Excel正确显示中文
      const bom = '\uFEFF'
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      const exportTypeMsg = selectedRows.value.length > 0 ? `勾选的${selectedRows.value.length}条数据` : '全部数据'
      ElMessage.success(`导出${exportTypeMsg}成功（CSV格式）`)
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 多选处理
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 多选汇总处理
const handleSelectedSummary = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要汇总的数据')
    return
  }

  // 计算多选数据的统计
  const stats = selectedRows.value.reduce((acc, item) => {
    acc.totalCurrentQuantity += item.currentQuantity || 0
    if (item.status === 'active') {
      acc.activeCount += 1
    }
    return acc
  }, {
    totalCurrentQuantity: 0,
    activeCount: 0
  })

  selectedSummaryStats.value = {
    ...stats,
    averageQuantity: selectedRows.value.length > 0 ? Math.round(stats.totalCurrentQuantity / selectedRows.value.length) : 0,
    recordCount: selectedRows.value.length
  }

  showSelectedSummaryDialog.value = true
}

// 导出多选汇总数据
const exportSelectedSummaryData = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('暂无选中数据可导出')
    return
  }

  try {
    const exportData = [
      // 汇总统计行
      {
        '外部编码': '多选汇总统计',
        '内部编码': '汇总',
        '货号名称': '全部',
        '厂家': '全部',
        '规格': '全部',
        '当前库存': selectedSummaryStats.value.totalCurrentQuantity,
        '状态': `活跃商品数: ${selectedSummaryStats.value.activeCount}`,
        '生产日期': '',
        '大货日期': '',
        '创建时间': '',
        '备注': `选中记录数: ${selectedSummaryStats.value.recordCount}, 平均库存: ${selectedSummaryStats.value.averageQuantity}`
      },
      // 分隔行
      {
        '外部编码': '--- 详细数据 ---',
        '内部编码': '',
        '货号名称': '',
        '厂家': '',
        '规格': '',
        '当前库存': '',
        '状态': '',
        '生产日期': '',
        '大货日期': '',
        '创建时间': '',
        '备注': ''
      },
      // 详细数据
      ...selectedRows.value.map(item => ({
        '外部编码': item.externalCode || '',
        '内部编码': item.internalCode || '',
        '货号名称': item.productName || '',
        '厂家': item.manufacturer || '',
        '规格': item.specification || '',
        '当前库存': item.currentQuantity || 0,
        '状态': getStatusText(item.status),
        '生产日期': formatDate(item.productionDate),
        '大货日期': formatDate(item.bulkDate),
        '创建时间': formatDate(item.createdAt),
        '备注': item.remark || ''
      }))
    ]

    // 使用 Excel 格式导出
    const headers = Object.keys(exportData[0])
    const filename = `库存多选汇总数据_${new Date().toLocaleDateString().replace(/\//g, '-')}`

    try {
      // 尝试导出为 Excel 格式
      exportToExcel(exportData, headers, filename, '库存多选汇总数据')
      ElMessage.success('多选汇总数据导出成功（Excel格式）')
    } catch (excelError) {
      // 如果 Excel 导出失败，降级到 CSV
      console.warn('Excel导出失败，使用CSV格式：', excelError.message)

      const csvContent = exportToCSV(exportData, headers)

      // 添加BOM以支持Excel正确显示中文
      const bom = '\uFEFF'
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      ElMessage.success('多选汇总数据导出成功（CSV格式）')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 生命周期
onMounted(() => {
  fetchData()
  fetchStats()
})
</script>

<style scoped>
.inventory-management {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.page-title h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
  margin: 0;
}

.page-description {
  color: #86909c;
  font-size: 14px;
  margin: 0;
}

.title-icon {
  font-size: 24px;
  margin-right: 12px;
  color: #409eff;
}

/* 搜索卡片 - 商务简洁风格 */
.search-card.business-style {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
  padding: 20px;
  margin-bottom: 20px;
}

.business-search-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.search-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.search-item {
  margin-bottom: 0;
  margin-right: 0;
}

.search-item .el-form-item__label {
  color: #606266;
  font-size: 13px;
  font-weight: 500;
  line-height: 32px;
  margin-bottom: 4px;
}

.business-input {
  width: 200px;
}

.business-select {
  width: 150px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  border: 1px solid #e4e7ed;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #409eff 0%, #66b3ff 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
}

.stat-icon.quantity {
  background: linear-gradient(135deg, #f56c6c 0%, #ff8a8a 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #1f2329;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #86909c;
}

.action-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  border: 1px solid #e4e7ed;
}

.action-left {
  display: flex;
  gap: 12px;
}

.action-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 14px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #409eff 0%, #66b3ff 100%);
  border: none;
  color: white;
}

.action-btn.primary:hover {
  opacity: 0.9;
}

.total-info {
  color: #86909c;
  font-size: 14px;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  border: 1px solid #e4e7ed;
}

.table-card .el-table th {
  background-color: #fafbfc;
  color: #1f2329;
  font-weight: 600;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: right;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #409eff;
}

.upload-placeholder {
  text-align: center;
  color: #8c939d;
  font-size: 12px;
}

.upload-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #86909c;
}

.no-image {
  color: #c0c4cc;
  font-size: 12px;
}

/* 表格中的图片数字序号 */
.image-numbers-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px;
}

.image-number-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  background: #409eff;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.image-number-item:hover {
  background: #1890ff;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.image-number-item:active {
  transform: scale(0.95);
}

/* 图片上传相关样式 */
.image-upload-container {
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

/* 图片项目容器 - 支持图片和上传按钮在同一行 */
.image-items-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}

.image-preview-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid #e4e7ed;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-preview-item:hover {
  border-color: #409eff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-preview-item:hover .image-overlay {
  opacity: 1;
}

.delete-btn {
  background: rgba(245, 63, 63, 0.9) !important;
  border: none !important;
  color: white !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.3s ease !important;
}

.delete-btn:hover {
  background: rgba(245, 63, 63, 1) !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 12px rgba(245, 63, 63, 0.4) !important;
}

/* 上传按钮样式 */
.image-uploader {
  width: 120px;
  height: 120px;
}

.upload-trigger {
  width: 120px;
  height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-trigger:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.upload-icon {
  font-size: 32px;
  color: #8c939d;
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.upload-trigger:hover .upload-icon {
  color: #409eff;
}

.upload-text {
  font-size: 12px;
  color: #8c939d;
  transition: color 0.3s ease;
}

.upload-trigger:hover .upload-text {
  color: #409eff;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .search-card.business-style {
    padding: 12px;
  }

  .search-fields {
    gap: 8px;
  }

  .search-item {
    margin-right: 0;
    margin-bottom: 8px;
  }

  .business-input,
  .business-select {
    width: 100%;
    min-width: 200px;
  }
}

/* 动画效果 */
.search-card,
.action-card,
.table-card {
  transition: all 0.3s ease;
}

.search-card:hover {
  box-shadow: 0 4px 12px 0 rgba(31, 35, 41, 0.15);
  transform: translateY(-2px);
}

/* 多选汇总弹框样式 */
.selected-summary-container {
  .summary-stats {
    margin-bottom: 20px;
  }

  .stats-card {
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
  }

  .stats-content {
    display: flex;
    align-items: center;
    padding: 16px;
  }

  .stats-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    font-size: 20px;
    color: white;
  }

  .stats-info {
    flex: 1;
  }

  .stats-value {
    font-size: 24px;
    font-weight: 600;
    color: #1f2329;
    line-height: 1;
    margin-bottom: 4px;
  }

  .stats-label {
    font-size: 14px;
    color: #86909c;
  }

  .summary-table {
    margin-top: 20px;
  }
}

/* 操作记录弹框样式 */
.records-container {
  max-height: 700px;
  overflow-y: auto;
}

.records-search-form {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #e9ecef;
}

.records-search-form .el-form {
  margin-bottom: 0;
}

.records-search-form .el-form-item {
  margin-bottom: 12px;
}

.records-search-form .el-form-item__label {
  font-weight: 500;
  color: #1f2329;
}

.records-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: right;
}

.no-records {
  padding: 40px 0;
  text-align: center;
}

.quantity-increase {
  color: #67c23a;
  font-weight: 600;
}

.quantity-decrease {
  color: #f56c6c;
  font-weight: 600;
}

/* 操作记录弹框响应式 */
@media screen and (max-width: 768px) {
  .records-search-form .el-form {
    display: flex;
    flex-direction: column;
  }

  .records-search-form .el-form-item {
    width: 100%;
  }

  .records-search-form .el-input,
  .records-search-form .el-select,
  .records-search-form .el-date-picker {
    width: 100% !important;
  }
}
</style>
