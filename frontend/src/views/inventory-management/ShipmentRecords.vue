<template>
  <div class="shipment-records-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><Document /></el-icon>
        发货记录
      </h2>
      <p class="page-description">管理商品发货明细记录</p>
    </div>

    <!-- 搜索筛选卡片 -->
    <div class="search-card business-style">
      <el-form :model="searchForm" :inline="true" class="business-search-form">
        <div class="search-fields">
          <el-form-item label="关键词搜索" class="search-item">
            <el-input
              v-model="searchForm.search"
              placeholder="搜索产品名称、应收款单位、备注"
              clearable
              class="business-input"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="产品名称" class="search-item">
            <el-input
              v-model="searchForm.productName"
              placeholder="请输入产品名称"
              clearable
              class="business-input"
            />
          </el-form-item>
          <el-form-item label="应收款单位" class="search-item">
            <el-input
              v-model="searchForm.receivableUnit"
              placeholder="请输入应收款单位"
              clearable
              class="business-input"
            />
          </el-form-item>
          <el-form-item label="审批状态" class="search-item">
            <el-select
              v-model="searchForm.approvalStatus"
              placeholder="请选择审批状态"
              clearable
              class="business-input"
              style="width: 200px;"
            >
              <el-option label="待审批" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </el-form-item>
          <el-form-item label="发货日期" class="search-item">
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

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button
          type="primary"
          @click="handleAdd"
          :icon="Plus"
          class="action-btn primary"
          v-if="hasAnyPermission(['shipment:create'])"
        >
          添加发货记录
        </el-button>
        <el-button
          type="success"
          @click="showImportDialog = true"
          :icon="Upload"
          class="action-btn"
          v-if="hasAnyPermission(['shipment:create'])"
        >
          批量导入
        </el-button>
        <el-button @click="handleExport" :icon="Download" class="action-btn" v-if="!isMobileDevice">
          导出数据
        </el-button>
      </div>
      <div class="action-right">
        <span class="total-info">共 {{ pagination.totalRecords }} 条记录</span>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        max-height="600"
        border
      >
        <el-table-column prop="shipmentDate" label="发货日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.shipmentDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="100" align="center"/>
        <el-table-column prop="unitPrice" label="单价" width="100" align="center">
          <template #default="{ row }">
            ¥{{ row.unitPrice.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="shippingFee" label="运费" width="100" align="center">
          <template #default="{ row }">
            ¥{{ row.shippingFee.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="remoteAreaFee" label="偏远地区加收" width="120" align="center">
          <template #default="{ row }">
            ¥{{ row.remoteAreaFee.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="合计金额" width="120" align="center">
          <template #default="{ row }">
            <span class="amount-text">¥{{ row.totalAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="receivableUnit" label="应收款单位" min-width="150" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column prop="approvalStatus" label="审批状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getApprovalStatusType(row.approvalStatus)"
              size="small"
            >
              {{ getApprovalStatusText(row.approvalStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-if="hasAnyPermission(['shipment:update']) && row.approvalStatus === 'pending'"
              link
            >
              编辑
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleApprove(row)"
              v-if="hasAnyPermission(['shipment:approve']) && row.approvalStatus === 'pending'"
              link
            >
              审批
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="handleViewApproval(row)"
              v-if="row.approvalStatus !== 'pending'"
              link
            >
              查看审批
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="hasAnyPermission(['shipment:delete']) && row.approvalStatus === 'pending'"
              link
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div v-if="pagination.totalRecords > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </div>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="showDialog"
      append-to-body
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="dialog-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input
                v-model="formData.productName"
                placeholder="请输入产品名称"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发货日期" prop="shipmentDate">
              <el-date-picker
                v-model="formData.shipmentDate"
                type="date"
                placeholder="选择发货日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发货数量" prop="quantity">
              <el-input
                v-model="formData.quantity"
                placeholder="请输入发货数量"
                style="width: 100%"
                @input="(value) => handleNumberInput('quantity', value)"
                @blur="updateCalculatedTotal"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价" prop="unitPrice">
              <el-input
                v-model="formData.unitPrice"
                placeholder="请输入单价"
                style="width: 100%"
                @input="(value) => handleNumberInput('unitPrice', value)"
                @blur="updateCalculatedTotal"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运费" prop="shippingFee">
              <el-input
                v-model="formData.shippingFee"
                placeholder="请输入运费"
                style="width: 100%"
                @input="(value) => handleNumberInput('shippingFee', value)"
                @blur="updateCalculatedTotal"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="偏远地区加收" prop="remoteAreaFee">
              <el-input
                v-model="formData.remoteAreaFee"
                placeholder="请输入偏远地区加收运费"
                style="width: 100%"
                @input="(value) => handleNumberInput('remoteAreaFee', value)"
                @blur="updateCalculatedTotal"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="合计金额">
              <el-input
                :value="calculatedTotal"
                disabled
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应收款单位" prop="receivableUnit">
              <el-input
                v-model="formData.receivableUnit"
                placeholder="请输入应收款单位"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Excel导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="Excel批量导入"
      width="800px"
      append-to-body
      @close="resetImportData"
    >
      <div class="import-container">
        <!-- 步骤1: 文件上传 -->
        <div v-if="!importData.length" class="upload-section">
          <div class="upload-tips">
            <h4>导入说明：</h4>
            <ul>
              <li>支持 Excel (.xlsx, .xls) 和 CSV 文件格式</li>
              <li>必填字段：发货日期、产品名称、数量、单价、应收款单位</li>
              <li>可选字段：运费、偏远地区加收运费、备注</li>
              <li>发货日期格式：YYYY-MM-DD（如：2024-01-01）</li>
              <li>数字字段支持小数，运费和偏远地区加收运费默认为0</li>
              <li>建议先下载模板，按格式填写数据</li>
            </ul>

            <div class="template-download">
              <el-button type="primary" @click="downloadTemplate" :icon="Download">
                下载导入模板
              </el-button>
            </div>
          </div>

          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileUpload"
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .xlsx, .xls, .csv 格式文件
              </div>
            </template>
          </el-upload>
        </div>

        <!-- 步骤2: 数据预览 -->
        <div v-else class="preview-section">
          <div class="preview-header">
            <h4>数据预览 (共 {{ importData.length }} 条记录)</h4>
            <div class="preview-actions">
              <el-button @click="resetImportData" :icon="Refresh">重新上传</el-button>
            </div>
          </div>

          <el-table
            :data="importData.slice(0, 10)"
            border
            stripe
            style="width: 100%"
            max-height="400"
          >
            <el-table-column prop="shipmentDate" label="发货日期" width="120" />
            <el-table-column prop="productName" label="产品名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="unitPrice" label="单价" width="100" />
            <el-table-column prop="shippingFee" label="运费" width="80" />
            <el-table-column prop="remoteAreaFee" label="偏远费" width="80" />
            <el-table-column prop="receivableUnit" label="应收款单位" min-width="120" show-overflow-tooltip />
            <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip />
          </el-table>

          <div v-if="importData.length > 10" class="preview-more">
            <el-text type="info">仅显示前10条记录，共{{ importData.length }}条</el-text>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button
            v-if="importData.length > 0"
            type="primary"
            @click="handleImportConfirm"
            :loading="importSubmitting"
          >
            确认导入 ({{ importData.length }}条)
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 审批弹框 -->
    <el-dialog
      v-model="showApprovalDialog"
      title="发货记录审批"
      width="800px"
      append-to-body
      @close="resetApprovalForm"
      class="approval-dialog"
    >
      <div class="approval-dialog-content">
        <div v-if="currentRecord">
          <!-- 发货记录信息 -->
          <el-card class="record-info-card" style="margin-bottom: 20px;">
            <template #header>
              <span>发货记录信息</span>
            </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="发货日期">{{ formatDate(currentRecord.shipmentDate) }}</el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ currentRecord.productName }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ currentRecord.quantity }}</el-descriptions-item>
            <el-descriptions-item label="单价">¥{{ currentRecord.unitPrice?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="运费">¥{{ currentRecord.shippingFee?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="偏远地区加收">¥{{ currentRecord.remoteAreaFee?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="合计金额">
              <span class="amount-text">¥{{ currentRecord.totalAmount?.toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="应收款单位">{{ currentRecord.receivableUnit }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ currentRecord.remark || '无' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 审批表单 -->
        <el-form
          ref="approvalFormRef"
          :model="approvalForm"
          :rules="approvalRules"
          label-width="120px"
        >
          <el-form-item label="审批结果" prop="approvalStatus">
            <el-radio-group v-model="approvalForm.approvalStatus">
              <el-radio value="approved">
                <el-icon><Check /></el-icon>
                审批通过
              </el-radio>
              <el-radio value="rejected">
                <el-icon><Close /></el-icon>
                审批拒绝
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="审批意见">
            <el-input
              v-model="approvalForm.approvalComment"
              type="textarea"
              :rows="6"
              placeholder="请输入审批意见（选填）"
              maxlength="1000"
              show-word-limit
              resize="vertical"
            />
            <div class="form-tip">
              <el-text size="small" type="info">
                审批意见为选填项，可详细说明审批理由或注意事项
              </el-text>
            </div>
          </el-form-item>

          <el-form-item label="审批凭证">
            <div class="image-upload-container">
              <!-- 图片预览和上传区域 -->
              <div class="image-items-container">
                <!-- 已选择的图片预览 -->
                <div
                  v-for="(image, index) in approvalImages"
                  :key="image._id || image.id || index"
                  class="image-preview-item"
                >
                  <el-image
                    :src="getApprovalImageUrl(image)"
                    :preview-src-list="getApprovalImageUrls()"
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
                      @click="removeApprovalImage(index)"
                      class="delete-btn"
                    />
                  </div>
                </div>

                <!-- 上传按钮 - 与图片在同一行 -->
                <el-upload
                  v-if="!approvalImages || approvalImages.length < 5"
                  ref="approvalUploadRef"
                  :auto-upload="false"
                  :before-upload="beforeApprovalImageUpload"
                  :on-change="handleApprovalImageChange"
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
        </el-form>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showApprovalDialog = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleApprovalSubmit"
            :loading="approvalSubmitting"
          >
            提交审批
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看审批弹框 -->
    <el-dialog
      v-model="showViewApprovalDialog"
      title="审批详情"
      width="800px"
      append-to-body
      class="approval-dialog"
    >
      <div class="approval-dialog-content">
        <div v-if="currentRecord">
          <!-- 发货记录信息 -->
          <el-card class="record-info-card" style="margin-bottom: 20px;">
            <template #header>
              <span>发货记录信息</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="发货日期">{{ formatDate(currentRecord.shipmentDate) }}</el-descriptions-item>
              <el-descriptions-item label="产品名称">{{ currentRecord.productName }}</el-descriptions-item>
              <el-descriptions-item label="数量">{{ currentRecord.quantity }}</el-descriptions-item>
              <el-descriptions-item label="单价">¥{{ currentRecord.unitPrice?.toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="运费">¥{{ currentRecord.shippingFee?.toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="偏远地区加收">¥{{ currentRecord.remoteAreaFee?.toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="合计金额">
                <span class="amount-text">¥{{ currentRecord.totalAmount?.toFixed(2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="应收款单位">{{ currentRecord.receivableUnit }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="2">{{ currentRecord.remark || '无' }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 审批信息 -->
          <el-card class="approval-info-card">
            <template #header>
              <span>审批信息</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="审批状态">
                <el-tag
                  :type="getApprovalStatusType(currentRecord.approvalStatus)"
                  size="small"
                >
                  {{ getApprovalStatusText(currentRecord.approvalStatus) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="审批人">
                {{ currentRecord.approvedBy?.username || '未审批' }}
              </el-descriptions-item>
              <el-descriptions-item label="审批时间">
                {{ currentRecord.approvedAt ? formatDate(currentRecord.approvedAt) : '未审批' }}
              </el-descriptions-item>
              <el-descriptions-item label="审批意见" :span="2">
                <div class="approval-comment-display">
                  <div v-if="currentRecord.approvalComment" class="comment-content">
                    {{ currentRecord.approvalComment }}
                  </div>
                  <el-text v-else type="info" size="small">无审批意见</el-text>
                </div>
              </el-descriptions-item>
            </el-descriptions>

            <!-- 审批图片 -->
            <div v-if="currentRecord.approvalImages && currentRecord.approvalImages.length > 0" style="margin-top: 20px;">
              <h4>审批凭证</h4>
              <div class="approval-images-container">
                <el-image
                  v-for="(image, index) in currentRecord.approvalImages"
                  :key="image._id || image.id || index"
                  :src="getApprovalImageUrl(image)"
                  :preview-src-list="getViewApprovalImageUrls()"
                  :initial-index="index"
                  style="width: 100px; height: 100px; margin-right: 10px; margin-bottom: 10px;"
                  fit="cover"
                  class="approval-image-preview"
                />
              </div>
            </div>
          </el-card>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showViewApprovalDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Download,
  Upload,
  Refresh,
  Document,
  Check,
  Close,
  Delete
} from '@element-plus/icons-vue'
import { shipmentRecordApi, fileApi } from '../../api/index'
import checkPermissions from '../../utils/checkPermissions'
import { exportToExcel } from '../../utils/excelUtils'
import { numberValidators } from '../../utils/inputValidation'
import { precisionCalculate } from '../../utils/precision'
import {
  readShipmentExcelFile,
  validateShipmentImportHeaders,
  transformShipmentImportData,
  validateShipmentImportData,
  downloadShipmentImportTemplate
} from '../../utils/shipmentExcelUtils'

// 权限检查函数
const hasAnyPermission = checkPermissions

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 导入相关
const showImportDialog = ref(false)
const importSubmitting = ref(false)
const importData = ref([])
const importColumns = ref([])
const importFile = ref(null)

// 审批相关
const showApprovalDialog = ref(false)
const showViewApprovalDialog = ref(false)
const approvalSubmitting = ref(false)
const currentRecord = ref(null)
const approvalFormRef = ref()
const approvalUploadRef = ref()
const approvalImages = ref([])

// 审批表单数据
const approvalForm = reactive({
  approvalStatus: 'approved',
  approvalComment: '',
  approvalImageIds: []
})

// 表格数据
const tableData = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  totalRecords: 0
})

// 搜索表单
const searchForm = reactive({
  productName: '',
  receivableUnit: '',
  search: '',
  approvalStatus: ''
})

const dateRange = ref([])

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

// 表单数据
const formData = reactive({
  shipmentDate: '',
  productName: '',
  quantity: null,
  unitPrice: null,
  shippingFee: 0,
  remoteAreaFee: 0,
  receivableUnit: '',
  remark: ''
})

// 表单验证规则
const formRules = {
  shipmentDate: [
    { required: true, message: '请选择发货日期', trigger: 'change' }
  ],
  productName: [
    { required: true, message: '请输入产品名称', trigger: 'blur' }
  ],
  quantity: [
    { required: true, message: '请输入发货数量', trigger: 'blur' },
    { min: 0.01, message: '发货数量必须大于0', trigger: 'blur' }
  ],
  unitPrice: [
    { required: true, message: '请输入单价', trigger: 'blur' },
    {  min: 0, message: '单价不能为负数', trigger: 'blur' }
  ],
  receivableUnit: [
    { required: true, message: '请输入应收款单位', trigger: 'blur' }
  ]
}

// 审批表单验证规则
const approvalRules = {
  approvalStatus: [
    { required: true, message: '请选择审批结果', trigger: 'change' }
  ]
  // 审批意见不是必填项，可以为空
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑发货记录' : '添加发货记录')

const calculatedTotal = computed(() => {
  // 确保所有值都转换为数字类型
  const quantity = parseFloat(formData.quantity) || 0
  const unitPrice = parseFloat(formData.unitPrice) || 0
  const shippingFee = parseFloat(formData.shippingFee) || 0
  const remoteAreaFee = parseFloat(formData.remoteAreaFee) || 0

  // 使用 precisionCalculate 进行精确计算
  // 先计算产品金额：数量 × 单价
  const productAmount = precisionCalculate.multiply(quantity, unitPrice)
  // 再计算总金额：产品金额 + 运费 + 偏远地区加收
  const total = precisionCalculate.add(productAmount, shippingFee, remoteAreaFee)

  return `¥${total.toFixed(2)}`
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 数字输入验证处理器
const handleNumberInput = (field, value) => {
  // 数量必须大于0，其他字段可以为0
  if (field === 'quantity') {
    const validatedValue = numberValidators.positiveNumber(value)
    formData[field] = validatedValue
  } else {
    // 单价、运费、偏远地区加收运费都支持正数和0
    const validatedValue = numberValidators.amount(value)
    formData[field] = validatedValue
  }
}

// 更新计算总额（在blur事件中调用）
const updateCalculatedTotal = () => {
  // 触发计算属性重新计算，这里不需要额外逻辑
  // calculatedTotal 计算属性会自动更新
}

// 获取发货记录列表
const fetchShipmentRecords = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.current,
      limit: pagination.pageSize,
      ...searchForm
    }

    // 添加日期范围
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }

    // 确保空字符串的审批状态不被传递给后端
    if (params.approvalStatus === '') {
      delete params.approvalStatus
    }

    const response = await shipmentRecordApi.getRecords(params)

    if (response.success) {
      tableData.value = response.data || []
      pagination.totalRecords = response.pagination?.totalRecords || 0
    } else {
      ElMessage.error(response.message || '获取发货记录失败')
    }
  } catch (error) {
    console.error('获取发货记录失败:', error)
    ElMessage.error('获取发货记录时发生错误')
  } finally {
    loading.value = false
  }
}



// 搜索
const handleSearch = () => {
  pagination.current = 1
  fetchShipmentRecords()
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  // 日期范围变化时自动搜索
  handleSearch()
}

// 重置搜索
const handleReset = () => {
  // 明确重置所有搜索条件
  searchForm.productName = ''
  searchForm.receivableUnit = ''
  searchForm.search = ''
  searchForm.approvalStatus = ''
  dateRange.value = []
  pagination.current = 1

  // 确保审批状态选择器也被重置
  nextTick(() => {
    fetchShipmentRecords()
  })
}

// 分页处理
const handlePageChange = (page) => {
  pagination.current = page
  fetchShipmentRecords()
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  pagination.current = 1
  fetchShipmentRecords()
}

// 添加记录
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  showDialog.value = true
}

// 编辑记录
const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(formData, {
    id: row._id,
    shipmentDate: row.shipmentDate?.split('T')[0] || '',
    productName: row.productName,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    shippingFee: row.shippingFee,
    remoteAreaFee: row.remoteAreaFee,
    receivableUnit: row.receivableUnit,
    remark: row.remark || ''
  })

  showDialog.value = true
}

// 删除记录
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除发货记录"${row.productName}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await shipmentRecordApi.deleteRecord(row._id)

    if (response.success) {
      ElMessage.success('删除成功')
      fetchShipmentRecords()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除发货记录失败:', error)
      ElMessage.error('删除时发生错误')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()

    submitLoading.value = true

    const submitData = { ...formData }
    delete submitData.id

    let response
    if (isEdit.value) {
      response = await shipmentRecordApi.updateRecord(formData.id, submitData)
    } else {
      response = await shipmentRecordApi.createRecord(submitData)
    }

    if (response.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      showDialog.value = false
      fetchShipmentRecords()
    } else {
      ElMessage.error(response.message || (isEdit.value ? '更新失败' : '创建失败'))
    }
  } catch (error) {
    console.error('提交表单失败:', error)
    ElMessage.error('提交时发生错误')
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    shipmentDate: new Date().toISOString().split('T')[0],
    productName: '',
    quantity: null,
    unitPrice: null,
    shippingFee: 0,
    remoteAreaFee: 0,
    receivableUnit: '',
    remark: ''
  })
  formRef.value?.resetFields()
}

// 导出数据
const handleExport = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }

  const exportData = tableData.value.map(item => ({
    '发货日期': formatDate(item.shipmentDate),
    '产品名称': item.productName,
    '数量': item.quantity,
    '单价': item.unitPrice,
    '运费': item.shippingFee,
    '偏远地区加收': item.remoteAreaFee,
    '合计金额': item.totalAmount,
    '应收款单位': item.receivableUnit,
    '备注': item.remark || '',
    '创建时间': formatDate(item.createdAt)
  }))

  // 定义表头
  const headers = [
    '发货日期',
    '产品名称',
    '数量',
    '单价',
    '运费',
    '偏远地区加收',
    '合计金额',
    '应收款单位',
    '备注',
    '创建时间'
  ]

  try {
    exportToExcel(exportData, headers, '发货记录', '发货记录')
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败: ' + error.message)
  }
}

// Excel导入相关方法
// 下载导入模板
const downloadTemplate = () => {
  try {
    downloadShipmentImportTemplate()
    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败: ' + error.message)
  }
}

// 处理文件上传
const handleFileUpload = async (file) => {
  try {
    importSubmitting.value = true

    // 读取Excel文件
    const result = await readShipmentExcelFile(file.raw)

    // 验证表头
    const headerValidation = validateShipmentImportHeaders(result.headers)

    if (!headerValidation.isValid) {
      ElMessage.error('缺少必填字段: ' + headerValidation.missingRequired.join(', '))
      return false
    }

    // 转换数据格式
    const transformedData = transformShipmentImportData(result.data, headerValidation.mappedFields)

    // 验证数据
    const dataValidation = validateShipmentImportData(transformedData)

    // 保存导入数据
    importData.value = dataValidation.validRows
    importColumns.value = result.headers
    importFile.value = file.raw

    // 显示验证结果
    if (dataValidation.errors.length > 0) {
      ElMessage.warning('发现 ' + dataValidation.errors.length + ' 行数据有错误，已自动过滤')
    }

    if (dataValidation.warnings.length > 0) {
      ElMessage.warning('发现 ' + dataValidation.warnings.length + ' 行数据有警告')
    }

    ElMessage.success('成功解析 ' + dataValidation.validRowCount + ' 行有效数据')

    return false // 阻止自动上传
  } catch (error) {
    ElMessage.error('文件解析失败: ' + error.message)
    return false
  } finally {
    importSubmitting.value = false
  }
}

// 确认导入数据
const handleImportConfirm = async () => {
  if (!importData.value || importData.value.length === 0) {
    ElMessage.error('没有可导入的数据')
    return
  }

  try {
    importSubmitting.value = true

    // 使用批量创建接口
    const result = await shipmentRecordApi.batchCreateRecord(importData.value)

    if (result.success) {
      ElMessage.success(result.message)
      showImportDialog.value = false
      resetImportData()
      // 重新加载数据
      fetchShipmentRecords()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('导入失败: ' + error.message)
  } finally {
    importSubmitting.value = false
  }
}

// 重置导入数据
const resetImportData = () => {
  importData.value = []
  importColumns.value = []
  importFile.value = null
}

// 审批相关函数
// 获取审批状态文本
const getApprovalStatusText = (status) => {
  const statusMap = {
    'pending': '待审批',
    'approved': '已通过',
    'rejected': '已拒绝'
  }
  return statusMap[status] || '未知'
}

// 获取审批状态类型
const getApprovalStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return typeMap[status] || 'info'
}

// 处理审批
const handleApprove = (record) => {
  currentRecord.value = record
  resetApprovalForm()
  showApprovalDialog.value = true
}

// 查看审批详情
const handleViewApproval = (record) => {
  currentRecord.value = record
  showViewApprovalDialog.value = true
}

// 重置审批表单
const resetApprovalForm = () => {
  approvalForm.approvalStatus = 'approved'
  approvalForm.approvalComment = ''
  approvalForm.approvalImageIds = []
  approvalImages.value = []
  if (approvalFormRef.value) {
    approvalFormRef.value.resetFields()
  }
}

// 获取审批图片URL（同步版本，用于模板）
const getApprovalImageUrl = (image) => {
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

// 获取审批图片URL列表（用于el-image预览）
const getApprovalImageUrls = () => {
  if (!approvalImages.value || !Array.isArray(approvalImages.value)) {
    return []
  }
  return approvalImages.value.map(image => getApprovalImageUrl(image)).filter(url => url)
}

// 获取查看审批时的图片URL列表（用于el-image预览）
const getViewApprovalImageUrls = () => {
  if (!currentRecord.value || !currentRecord.value.approvalImages || !Array.isArray(currentRecord.value.approvalImages)) {
    return []
  }
  return currentRecord.value.approvalImages.map(image => getApprovalImageUrl(image)).filter(url => url)
}

// 审批图片上传前检查
const beforeApprovalImageUpload = (file) => {
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
  if (approvalImages.value.length >= 5) {
    ElMessage.error('最多只能上传 5 张图片!')
    return false
  }

  return false // 阻止自动上传
}

// 审批图片文件选择变化回调
const handleApprovalImageChange = (file, fileList) => {
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
  if (approvalImages.value.length >= 5) {
    ElMessage.error('最多只能上传 5 张图片!')
    return
  }

  // 添加到临时图片列表
  approvalImages.value.push(rawFile)
  ElMessage.success('图片添加成功')
}

// 移除审批图片
const removeApprovalImage = (index) => {
  approvalImages.value.splice(index, 1)
}

// 上传单个审批图片文件
const uploadSingleApprovalImage = async (file) => {
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

// 提交审批
const handleApprovalSubmit = async () => {
  if (!approvalFormRef.value) return

  try {
    await approvalFormRef.value.validate()
    approvalSubmitting.value = true

    // 上传所有图片
    const imageIds = []
    if (approvalImages.value && approvalImages.value.length > 0) {
      for (const image of approvalImages.value) {
        if (image instanceof File) {
          try {
            const imageId = await uploadSingleApprovalImage(image)
            imageIds.push(imageId)
          } catch (error) {
            ElMessage.error(`图片上传失败: ${error.message}`)
            return
          }
        } else if (image._id || image.id) {
          // 已经上传的图片
          imageIds.push(image._id || image.id)
        }
      }
    }

    const result = await shipmentRecordApi.approveRecord(currentRecord.value._id, {
      approvalStatus: approvalForm.approvalStatus,
      approvalComment: approvalForm.approvalComment,
      approvalImageIds: imageIds
    })

    if (result.success) {
      ElMessage.success(result.message)
      showApprovalDialog.value = false
      resetApprovalForm()
      // 重新加载数据
      fetchShipmentRecords()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    if (error !== false) { // 不是表单验证错误
      ElMessage.error('审批失败: ' + error.message)
    }
  } finally {
    approvalSubmitting.value = false
  }
}

// 监听表单字段变化，实时更新计算总额
watch(
  () => [
    formData.quantity,
    formData.unitPrice,
    formData.shippingFee,
    formData.remoteAreaFee
  ],
  () => {
    // 计算属性会自动更新，这里可以添加额外的逻辑（如果需要）
  },
  { immediate: true }
)

// 监听对话框关闭
watch(showDialog, (newVal) => {
  if (!newVal) {
    resetForm()
  }
})

// 页面加载时获取数据
onMounted(() => {
  fetchShipmentRecords()
})
</script>

<style scoped>
.shipment-records-container {
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
  gap: 8px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-description {
  color: #606266;
  margin: 0;
  font-size: 14px;
}

/* 搜索卡片样式 - 与库存列表保持一致 */
.search-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  overflow: hidden;
}

.business-style {
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

.search-item {
  margin-bottom: 0 !important;
  min-width: 200px;
}

.search-item .el-form-item__label {
  font-weight: 500;
  color: #1f2329;
  font-size: 14px;
}

.business-input,
.business-select {
  width: 200px;
}

.search-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.action-card,
.table-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.action-card {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  gap: 12px;
}

.action-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-weight: 500;
}

.action-btn.primary {
  background: linear-gradient(135deg, #409eff 0%, #66b3ff 100%);
  border: none;
  color: white;
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #337ecc 0%, #5aa3ff 100%);
}

.total-info {
  color: #606266;
  font-size: 14px;
}

.table-card {
  padding: 20px;
}

.amount-text {
  font-weight: 600;
  color: #e6a23c;
}

.pagination-container {
  display: flex;
  justify-content: right;
  margin-top: 20px;
}

.dialog-form {
  padding: 0 20px;
}

.dialog-footer {
  text-align: right;
}

/* 导入对话框样式 */
.import-container {
  padding: 20px 0;
}

.upload-section {
  text-align: center;
}

.upload-tips {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: left;
}

.upload-tips h4 {
  margin: 0 0 12px 0;
  color: #1f2329;
  font-size: 16px;
}

.upload-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.upload-tips li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.template-download {
  margin-top: 16px;
  text-align: center;
}

.upload-demo {
  margin-top: 20px;
}

.preview-section {
  margin-top: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h4 {
  margin: 0;
  color: #1f2329;
  font-size: 16px;
}

.preview-more {
  margin-top: 12px;
  text-align: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .shipment-records-container {
    padding: 10px;
  }

  .search-fields {
    flex-direction: column;
    gap: 12px;
  }

  .search-item {
    min-width: auto;
    width: 100%;
  }

  .business-input,
  .business-select {
    width: 100%;
  }

  .search-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .action-card {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .action-left {
    justify-content: center;
  }

  .action-right {
    text-align: center;
  }

  .preview-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .import-container {
    padding: 10px 0;
  }
}

/* 图片上传样式 */
.image-upload-container {
  width: 100%;
}

.image-items-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
}

.image-preview-item {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  background: #f5f7fa;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  transition: opacity 0.3s;
}

.image-preview-item:hover .image-overlay {
  opacity: 1;
}

.delete-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  border: none !important;
  color: #f56c6c !important;
}

.image-uploader {
  width: 100px;
  height: 100px;
}

.upload-trigger {
  width: 100px;
  height: 100px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-trigger:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.upload-icon {
  font-size: 24px;
  color: #8c939d;
  margin-bottom: 4px;
}

.upload-text {
  font-size: 12px;
  color: #8c939d;
}

.upload-trigger:hover .upload-icon,
.upload-trigger:hover .upload-text {
  color: #409eff;
}

.upload-tips {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

/* 审批相关样式 */
.record-info-card,
.approval-info-card {
  margin-bottom: 20px;
}

.amount-text {
  font-weight: 600;
  color: #409eff;
}

.form-tip {
  margin-top: 4px;
}

.approval-comment-display {
  max-width: 100%;
}

.comment-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  color: #303133;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  border-left: 3px solid #409eff;
  max-height: 200px;
  overflow-y: auto;
}

.approval-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.approval-image-preview {
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  transition: all 0.3s;
}

.approval-image-preview:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

/* 审批弹窗样式 */
:deep(.approval-dialog) {
  .el-dialog {
    max-height: 85vh;
    display: flex;
    flex-direction: column;
  }

  .el-dialog__header {
    flex-shrink: 0;
  }

  .el-dialog__body {
    flex: 1;
    overflow: hidden;
    padding: 10px 20px;
  }

  .el-dialog__footer {
    flex-shrink: 0;
    padding: 10px 20px 20px;
  }
}

.approval-dialog-content {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 5px;
}

/* 滚动条样式 */
.approval-dialog-content::-webkit-scrollbar {
  width: 6px;
}

.approval-dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.approval-dialog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.approval-dialog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  :deep(.approval-dialog) .el-dialog {
    width: 90% !important;
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  :deep(.approval-dialog) .el-dialog {
    width: 95% !important;
    margin: 0 auto;
  }

  .approval-dialog-content {
    max-height: 60vh;
  }
}
</style>
