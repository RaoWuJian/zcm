<template>
  <div class="daily-report-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><Document /></el-icon>
        <h2>日报管理</h2>
      </div>
      <div class="page-description">
        查看和管理团队日报数据
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-card business-style">
      <el-form :model="filterForm" class="business-search-form">
        <div class="search-fields">
          <el-form-item label="报告类型" class="search-item">
            <el-select
              v-model="filterForm.reportType"
              placeholder="选择报告类型"
              clearable
              class="business-select"
              @change="handleReportTypeChange"
            >
              <el-option label="日报" value="daily" />
              <el-option label="时段报告" value="hourly" />
            </el-select>
          </el-form-item>

          <el-form-item label="时段" class="search-item" v-if="filterForm.reportType === 'hourly'">
            <el-select
              v-model="filterForm.reportHour"
              placeholder="选择时段"
              clearable
              class="business-select"
            >
              <el-option label="14:00" value="14:00" />
              <el-option label="19:00" value="19:00" />
              <el-option label="24:00" value="24:00" />
            </el-select>
          </el-form-item>

          <el-form-item label="产品名称" class="search-item">
            <el-input
              v-model="filterForm.productName"
              placeholder="请输入产品名称"
              clearable
              class="business-input"
            />
          </el-form-item>
          <el-form-item label="组别" class="search-item">
            <el-input
              v-model="filterForm.groupName"
              placeholder="请输入组别名称"
              clearable
              class="business-input"
            />
          </el-form-item>

          <el-form-item label="投放大类" class="search-item">
            <el-select
              v-model="filterForm.mainCategory"
              placeholder="选择大类"
              clearable
              class="business-select"
            >
              <el-option
                v-for="category in mainCategories"
                :key="category._id"
                :label="category.name"
                :value="category._id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="关键字" class="search-item">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索备注内容"
              clearable
              class="business-input"
            />
          </el-form-item>
           <el-form-item label="提交人" class="search-item">
            <el-select
              v-model="filterForm.submitter"
              placeholder="选择提交人"
              clearable
              filterable
              remote
              :remote-method="searchUsers"
              class="business-select"
            >
              <el-option
                v-for="user in userOptions"
                :key="user._id"
                :label="user.username"
                :value="user._id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="汇报对象" class="search-item">
            <el-select
              v-model="filterForm.reporter"
              placeholder="选择汇报对象"
              clearable
              filterable
              remote
              :remote-method="searchFilterReporters"
              class="business-select"
            >
              <el-option
                v-for="user in filterReporterOptions"
                :key="user._id"
                :label="user.username"
                :value="user._id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="日期范围" class="search-item">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateRangeChange"
              class="business-input"
              style="width: 240px"
            />
          </el-form-item>
         
        </div>

        <div class="search-actions">
          <el-button type="primary" @click="handleSearch" :icon="Search" class="business-btn">
            搜索
          </el-button>
          <el-button @click="resetFilter" :icon="Refresh" class="business-btn">
            重置
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button 
          type="primary" 
          @click="openAddDialog"
          :icon="Plus"
          class="action-btn primary"
          v-if="hasAnyPermission(['dailyDataReport:create'])"
        >
          提交日报
        </el-button>
      </div>
      <div class="action-right">
        <span class="total-count">共 {{ pagination.total }} 条日报</span>
      </div>
    </div>

    <!-- 日报列表 -->
    <div class="table-card">
      <!-- Tab 栏 -->
      <div class="tab-container">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="report-tabs">
          <el-tab-pane label="我创建的" name="my-reports">
            <template #label>
              <div class="tab-label">
                <el-icon><EditPen /></el-icon>
                <span>我创建的</span>
              </div>
            </template>
          </el-tab-pane>
          <el-tab-pane label="汇报给我的" name="reports-to-me">
            <template #label>
              <div class="tab-label">
                <el-icon><Message /></el-icon>
                <span>汇报给我的</span>
              </div>
            </template>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <div class="table-container">
        <el-table
          :data="reports"
          v-loading="loading"
          stripe
          border
          max-height="600"
          @selection-change="handleSelectionChange"
        >
        <el-table-column type="selection" width="50" />

        <el-table-column prop="reportDate" label="日期" width="110" sortable>
          <template #default="{ row }">
            {{ formatDate(row.reportDate) }}
          </template>
        </el-table-column>

        <el-table-column label="报告类型" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.reportType === 'daily' ? 'primary' : 'success'"
              size="small"
            >
              {{ row.reportType === 'daily' ? '日报' : '时段报告' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="时段" width="80">
          <template #default="{ row }">
            <span v-if="row.reportType === 'hourly'">{{ row.reportHour }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="groupName" label="组别" width="100" />

        <el-table-column label="产品名称" min-width="180">
          <template #default="{ row }">
            <div v-if="row.products && row.products.length > 0">
              <el-tag
                v-for="(product, index) in row.products"
                :key="index"
                size="small"
                style="margin-right: 5px; margin-bottom: 3px;"
              >
                {{ product.productName }}
              </el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="推广费" width="120">
          <template #default="{ row }">
            {{ formatCurrency(row.totalPromotionCost || 0) }}
          </template>
        </el-table-column>

        <el-table-column label="总销售额" width="120">
          <template #default="{ row }">
            {{ formatCurrency(row.totalSalesAmountSum || 0) }}
          </template>
        </el-table-column>

        <el-table-column label="总销售数" width="100">
          <template #default="{ row }">
            {{ row.totalSalesQuantitySum || 0 }}件
          </template>
        </el-table-column>

        <el-table-column label="平均ROI" width="100">
          <template #default="{ row }">
            <el-tag
              :type="(row.avgROI || 0) >= 1 ? 'success' : 'warning'"
              size="small"
            >
              {{ formatROI(row.avgROI || 0) }}
            </el-tag>
          </template>
        </el-table-column>



        <el-table-column label="汇报人" width="120">
          <template #default="{ row }">
            <div class="reporters-list">
              <template v-if="row.reporters && row.reporters.length > 0">
                <!-- 显示第一个汇报人 -->
                <el-tag
                  size="small"
                  class="reporter-tag"
                >
                  {{ row.reporters[0].username }}
                </el-tag>

                <!-- 如果有多个汇报人，显示+号和数量 -->
                <el-tooltip
                  v-if="row.reporters.length > 1"
                  placement="top"
                  effect="dark"
                >
                  <template #content>
                    <div class="reporters-tooltip">
                      <div class="tooltip-title">全部汇报人：</div>
                      <div
                        v-for="reporter in row.reporters"
                        :key="reporter._id"
                        class="tooltip-reporter"
                      >
                        • {{ reporter.username }}
                      </div>
                    </div>
                  </template>
                  <el-tag
                    size="small"
                    type="info"
                    class="more-reporters-tag"
                  >
                    +{{ row.reporters.length - 1 }}
                  </el-tag>
                </el-tooltip>
              </template>
              <span v-else class="no-reporters">-</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="submitter" label="提交人" width="100">
          <template #default="{ row }">
            {{ row.submitter?.username }}
          </template>
        </el-table-column>

        <el-table-column prop="remarks" label="备注" min-width="150">
          <template #default="{ row }">
            <div class="remarks-content">
              <span v-if="!row.remarks || row.remarks.length === 0" class="no-remarks">-</span>
              <el-tooltip
                v-else-if="row.remarks.length > 20"
                :content="row.remarks"
                placement="top"
                effect="dark"
              >
                <span class="remarks-text">{{ row.remarks.substring(0, 20) }}...</span>
              </el-tooltip>
              <span v-else class="remarks-text">{{ row.remarks }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="提交时间" width="150" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="viewReport(row)"
              :icon="View"
              link
            >
              查看
            </el-button>

            <el-button
              type="warning"
              size="small"
              @click="editReport(row)"
              :icon="Edit"
              v-if="canEdit(row) && hasAnyPermission(['dailyDataReport:update'])"
              link
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteReport(row)"
              :icon="Delete"
              v-if="canDelete(row) && hasAnyPermission(['dailyDataReport:delete'])"
              link
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
        />
      </div>
    </div>

    <!-- 日报详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="日报详情"
      width="900px"
      :close-on-click-modal="false"
      max-height="600px"
      append-to-body
    >
      <div v-if="currentReport" class="report-detail">
        <!-- 基本信息 -->
        <el-divider content-position="left">
          <span style="font-weight: 600; color: #409eff;">基本信息</span>
        </el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="报告类型">
            <el-tag
              :type="currentReport.reportType === 'daily' ? 'primary' : 'success'"
              size="small"
            >
              {{ currentReport.reportType === 'daily' ? '日报' : '时段报告' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时段">
            <span v-if="currentReport.reportType === 'hourly'">{{ currentReport.reportHour }}</span>
            <span v-else style="color: #c0c4cc;">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="日期">
            {{ formatDate(currentReport.reportDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="组别">
            {{ currentReport.groupName }}
          </el-descriptions-item>
          <el-descriptions-item label="汇报人" :span="2">
            <div class="reporters-detail">
              <el-tag
                v-for="reporter in currentReport.reporters"
                :key="reporter._id"
                class="reporter-tag"
              >
                {{ reporter.username }}
              </el-tag>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="提交人">
            {{ currentReport.submitter?.username }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(currentReport.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2" v-if="currentReport.remark">
            {{ currentReport.remark }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 产品列表 -->
        <el-divider content-position="left">
          <span style="font-weight: 600; color: #409eff;">产品列表</span>
        </el-divider>

        <div class="product-detail-records" v-if="currentReport.products && currentReport.products.length > 0">
          <div
            v-for="(product, index) in currentReport.products"
            :key="index"
            class="product-detail-item"
          >
            <div class="record-header">
              <span class="record-title">产品 {{ index + 1 }}：{{ product.productName }}</span>
            </div>

            <el-row :gutter="20">
              <el-col :span="24">
                <div class="detail-field">
                  <span class="detail-label">产品名称：</span>
                  <span class="detail-value">{{ product.productName }}</span>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-field">
                  <span class="detail-label">投放大类：</span>
                  <span class="detail-value">{{ product.campaignMainCategory?.name || '-' }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-field">
                  <span class="detail-label">投放小类：</span>
                  <span class="detail-value">{{ product.campaignSubCategory?.name || '无' }}</span>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-field">
                  <span class="detail-label">推广费：</span>
                  <span class="detail-value">{{ formatCurrency(product.promotionCost || 0) }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-field">
                  <span class="detail-label">总销售额：</span>
                  <span class="detail-value">{{ formatCurrency(product.totalSalesAmount || 0) }}</span>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-field">
                  <span class="detail-label">总销售数：</span>
                  <span class="detail-value">{{ product.totalSalesQuantity || 0 }}件</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-field">
                  <span class="detail-label">投放ROI：</span>
                  <el-tag
                    :type="(product.roi || 0) >= 1 ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ formatROI(product.roi || 0) }}
                  </el-tag>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑日报弹框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="isEditMode ? '编辑日报' : '新增日报'"
      width="900px"
      @close="handleAddDialogClose"
      max-height="600px"
      append-to-body
    >
      <el-form
        ref="reportFormRef"
        :model="reportForm"
        :rules="reportRules"
        label-width="120px"
      >
        <!-- 公共字段区域 -->
        <el-divider content-position="left">
          <span style="font-weight: bold; font-size: 16px;">基本信息</span>
        </el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报告类型" prop="reportType" required>
              <el-select
                v-model="reportForm.reportType"
                placeholder="请选择报告类型"
                style="width: 100%"
                @change="handleFormReportTypeChange"
              >
                <el-option label="日报" value="daily" />
                <el-option label="时段报告" value="hourly" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="reportForm.reportType === 'hourly'">
            <el-form-item label="时段" prop="reportHour" required>
              <el-select
                v-model="reportForm.reportHour"
                placeholder="请选择时段"
                style="width: 100%"
              >
                <el-option label="14:00" value="14:00" />
                <el-option label="19:00" value="19:00" />
                <el-option label="24:00" value="24:00" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="日期" prop="reportDate" required>
              <el-date-picker
                v-model="reportForm.reportDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                :disabled-date="disabledDate"
                class="dialog-date-picker"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组别" prop="groupName" required>
              <el-input
                v-model="reportForm.groupName"
                placeholder="请输入组别名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="汇报人" prop="reporters" required>
              <el-select
                v-model="reportForm.reporters"
                placeholder="请选择汇报人（支持搜索用户名、账号）"
                multiple
                filterable
                remote
                :remote-method="searchReporters"
                @focus="loadDefaultReporters"
                style="width: 100%"
                :loading="reporterLoading"
                loading-text="搜索中..."
                no-data-text="未找到匹配的用户"
                no-match-text="未找到匹配的用户"
              >
                <el-option
                  v-for="user in reporterOptions"
                  :key="user._id"
                  :label="`${user.username}${user.departmentNames ? ' (' + user.departmentNames + ')' : ''}`"
                  :value="user._id"
                >
                  <span style="float: left">{{ user.username }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ user.departmentNames || '无部门' }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remarks">
              <el-input
                v-model="reportForm.remarks"
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息（可选）"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 产品列表区域 -->
        <el-divider content-position="left">
          <span style="font-weight: 600; color: #409eff;">产品列表</span>
        </el-divider>

        <div class="product-records">
          <div
            v-for="(product, index) in reportForm.products"
            :key="index"
            class="product-record-item"
          >
            <div class="record-header">
              <span class="record-title">产品 {{ index + 1 }}</span>
              <el-button
                v-if="reportForm.products.length > 1"
                type="danger"
                size="small"
                @click="removeProduct(index)"
                :icon="Delete"
                circle
              />
            </div>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="产品名称" required>
                <el-autocomplete
                  v-model="product.productName"
                  placeholder="请输入产品名称"
                  style="width: 100%"
                  :fetch-suggestions="queryProductNameSuggestions"
                  :trigger-on-focus="false"
                  maxlength="200"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="投放大类" required>
                <el-select
                  v-model="product.campaignMainCategory"
                  placeholder="请选择投放大类"
                  style="width: 100%"
                  @change="onProductMainCategoryChange(index, $event)"
                  filterable
                >
                  <el-option
                    v-for="category in mainCategories"
                    :key="category._id"
                    :label="category.name"
                    :value="category._id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="投放小类">
                <el-select
                  v-model="product.campaignSubCategory"
                  placeholder="请选择投放小类"
                  style="width: 100%"
                  :disabled="!productSubCategories[index] || !productSubCategories[index].length"
                  clearable
                  filterable
                >
                  <el-option
                    v-for="category in productSubCategories[index]"
                    :key="category._id"
                    :label="category.name"
                    :value="category._id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="推广费" required>
                <el-input
                  v-model="product.promotionCost"
                  placeholder="请输入推广费"
                  style="width: 100%;"
                >
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="总销售额" required>
                <el-input
                  v-model="product.totalSalesAmount"
                  placeholder="请输入总销售额"
                  style="width: 100%;"
                >
                  <template #append>元</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="总销售数" required>
                <el-input
                  v-model="product.totalSalesQuantity"
                  placeholder="请输入总销售数"
                  style="width: 100%;"
                >
                  <template #append>件</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="投放ROI" required>
                <el-input
                  v-model="product.roi"
                  placeholder="请输入投放ROI"
                  style="width: 100%;"
                />
              </el-form-item>
            </el-col>
          </el-row>
          </div>

          <div class="add-record-btn">
            <el-button type="dashed" @click="addProduct" :icon="Plus" style="width: 100%;">
              添加产品
            </el-button>
          </div>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleAddDialogClose">取消</el-button>
          <el-button @click="resetReportForm">重置</el-button>
          <el-button
            type="primary"
            @click="submitReport"
            :loading="submittingReport"
          >
            {{ isEditMode ? '更新' : '确定' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, View, Edit, Delete, Document, EditPen, Message, Download } from '@element-plus/icons-vue'
import { useDailyReportStore } from '@/stores/dailyReport'
import { useCampaignCategoryStore } from '@/stores/campaignCategory'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import { employeeApi, dailyReportApi } from '@/api/index'
import { debounce } from 'lodash-es'
import { numberValidators } from '@/utils/inputValidation'
import hasAnyPermission from '@/utils/checkPermissions'
import * as XLSX from 'xlsx'

const router = useRouter()
const route = useRoute()
const dailyReportStore = useDailyReportStore()
const campaignCategoryStore = useCampaignCategoryStore()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

// 响应式数据
const loading = ref(false)
const showDetailDialog = ref(false)
const showAddDialog = ref(false)
const currentReport = ref(null)
const selectedReports = ref([])
const userOptions = ref([])
const filterReporterOptions = ref([])
const dateRange = ref([])
const productNameSuggestions = ref([])

// Tab 相关
const activeTab = ref('my-reports') // 默认显示我创建的

// 日报表单相关
const reportFormRef = ref()
const submittingReport = ref(false)
const subCategories = ref([])
const reporterOptions = ref([])
const reporterLoading = ref(false)
const isEditMode = ref(false)
const editingReportId = ref(null)

// 过滤表单
const filterForm = reactive({
  reportType: '',
  reportHour: '',
  groupName: '',
  mainCategory: '',
  submitter: '',
  reporter: '',
  productName: '',
  keyword: '',
  startDate: '',
  endDate: ''
})

// 处理报告类型变化
const handleReportTypeChange = (value) => {
  // 如果切换到日报，清空时段筛选
  if (value !== 'hourly') {
    filterForm.reportHour = ''
  }
}

// 日报表单数据
const reportForm = reactive({
  // 公共字段
  reportType: 'daily',
  reportHour: '',
  reportDate: new Date(),
  groupName: '',
  reporters: [],
  remarks: '',

  // 产品列表
  products: [
    {
      productName: '',
      campaignMainCategory: '',
      campaignSubCategory: '',
      promotionCost: '',
      totalSalesAmount: '',
      totalSalesQuantity: '',
      roi: ''
    }
  ]
})

// 处理表单报告类型变化
const handleFormReportTypeChange = (value) => {
  // 如果切换到日报，清空时段
  if (value !== 'hourly') {
    reportForm.reportHour = ''
  }
}

// 表单验证规则
const reportRules = {
  reportType: [
    { required: true, message: '请选择报告类型', trigger: 'change' }
  ],
  reportHour: [
    {
      validator: (rule, value, callback) => {
        if (reportForm.reportType === 'hourly' && !value) {
          callback(new Error('时段报告必须选择时段'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  reportDate: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ],
  groupName: [
    { required: true, message: '请输入组别名称', trigger: 'blur' },
    { min: 1, max: 100, message: '组别名称长度在1到100个字符', trigger: 'blur' }
  ],
  reporters: [
    { required: true, type: 'array', min: 1, message: '请选择至少一个汇报人', trigger: 'change' }
  ]
}

// 验证产品列表
const validateProducts = () => {
  if (!reportForm.products || reportForm.products.length === 0) {
    ElMessage.error('至少需要添加一个产品')
    return false
  }

  for (let i = 0; i < reportForm.products.length; i++) {
    const product = reportForm.products[i]
    const index = i + 1

    if (!product.productName || product.productName.trim() === '') {
      ElMessage.error(`产品${index}：请输入产品名称`)
      return false
    }

    if (!product.campaignMainCategory) {
      ElMessage.error(`产品${index}：请选择投放大类`)
      return false
    }

    if (product.promotionCost === '' || product.promotionCost === null || product.promotionCost === undefined) {
      ElMessage.error(`产品${index}：请输入推广费`)
      return false
    }
    const promotionCost = parseFloat(product.promotionCost)
    if (isNaN(promotionCost) || promotionCost < 0) {
      ElMessage.error(`产品${index}：推广费必须是大于等于0的数字`)
      return false
    }

    if (product.totalSalesAmount === '' || product.totalSalesAmount === null || product.totalSalesAmount === undefined) {
      ElMessage.error(`产品${index}：请输入总销售额`)
      return false
    }
    const totalSalesAmount = parseFloat(product.totalSalesAmount)
    if (isNaN(totalSalesAmount) || totalSalesAmount < 0) {
      ElMessage.error(`产品${index}：总销售额必须是大于等于0的数字`)
      return false
    }

    if (product.totalSalesQuantity === '' || product.totalSalesQuantity === null || product.totalSalesQuantity === undefined) {
      ElMessage.error(`产品${index}：请输入总销售数`)
      return false
    }
    const totalSalesQuantity = parseInt(product.totalSalesQuantity)
    if (isNaN(totalSalesQuantity) || totalSalesQuantity < 0 || !Number.isInteger(totalSalesQuantity)) {
      ElMessage.error(`产品${index}：总销售数必须是大于等于0的整数`)
      return false
    }

    if (product.roi === '' || product.roi === null || product.roi === undefined) {
      ElMessage.error(`产品${index}：请输入ROI`)
      return false
    }
    const roi = parseFloat(product.roi)
    if (isNaN(roi) || roi < 0) {
      ElMessage.error(`产品${index}：ROI必须是大于等于0的数字`)
      return false
    }
  }

  return true
}

// 计算属性
const reports = computed(() => dailyReportStore.reports)
const pagination = computed(() => dailyReportStore.pagination)
const mainCategories = computed(() => campaignCategoryStore.mainCategories)
const categoriesWithChildren = computed(() => campaignCategoryStore.categoriesWithChildren)
const currentUser = computed(() => userStore.userInfo)
const isDev = computed(() => import.meta.env.DEV)

// 禁用未来日期
const disabledDate = (time) => {
  return time.getTime() > Date.now()
}

// 监听大类变化
const onMainCategoryChange = (mainCategoryId) => {
  subCategories.value = []
  reportForm.campaignSubCategory = ''
  
  if (mainCategoryId && categoriesWithChildren.value && Array.isArray(categoriesWithChildren.value)) {
    // 从 categoriesWithChildren 中找到选中的大类，获取其子类
    const selectedMainCategory = categoriesWithChildren.value.find(cat => cat._id === mainCategoryId)
    if (selectedMainCategory && selectedMainCategory.subCategories && Array.isArray(selectedMainCategory.subCategories)) {
      subCategories.value = selectedMainCategory.subCategories.filter(sub => sub.isActive !== false)
    }
  }
}

// 数字输入处理函数 - 支持小数（用于金额和ROI）
const handleNumberInput = (field, value) => {
  reportForm[field] = numberValidators.amount(value)
}

// 整数输入处理函数 - 仅支持整数（用于销售数量）
const handleIntegerInput = (field, value) => {
  reportForm[field] = numberValidators.positiveInteger(value)
}

// 搜索汇报人
const searchReporters = debounce(async (query) => {
  reporterLoading.value = true
  try {
    const response = await employeeApi.getReporters({
      search: query || '',
      limit: 50,
      isActive: true
    })

    if (response.success) {
      reporterOptions.value = response.data || []
    }
  } catch (error) {
    console.error('搜索汇报人失败:', error)
    ElMessage.error('搜索汇报人失败')
  } finally {
    reporterLoading.value = false
  }
}, 300)

// 加载默认汇报人选项
const loadDefaultReporters = async () => {
  reporterLoading.value = true
  try {
    const response = await employeeApi.getReporters({
      limit: 50,
      isActive: true
    })

    if (response.success) {
      reporterOptions.value = response.data || []
    }
  } catch (error) {
    console.error('加载默认汇报人失败:', error)
    ElMessage.error('加载汇报人列表失败')
  } finally {
    reporterLoading.value = false
  }
}

// 获取产品名称建议
const loadProductNameSuggestions = async () => {
  try {
    const response = await dailyReportApi.getProductNameSuggestions()
    if (response.success) {
      productNameSuggestions.value = response.data || []
    }
  } catch (error) {
    console.error('加载产品名称建议失败:', error)
  }
}

// 查询产品名称建议（用于自动完成）
const queryProductNameSuggestions = (queryString, callback) => {
  if (!queryString) {
    callback([])
    return
  }

  const results = productNameSuggestions.value
    .filter(name => name.toLowerCase().includes(queryString.toLowerCase()))
    .map(name => ({ value: name }))

  callback(results)
}

// 产品管理方法
// 添加产品
const addProduct = () => {
  reportForm.products.push({
    productName: '',
    campaignMainCategory: '',
    campaignSubCategory: '',
    promotionCost: '',
    totalSalesAmount: '',
    totalSalesQuantity: '',
    roi: ''
  })
}

// 删除产品
const removeProduct = (index) => {
  if (reportForm.products.length <= 1) {
    ElMessage.warning('至少需要保留一个产品')
    return
  }
  reportForm.products.splice(index, 1)
}

// 每个产品的子分类列表
const productSubCategories = ref([])

// 初始化产品子分类数组
const initProductSubCategories = () => {
  productSubCategories.value = reportForm.products.map(() => [])
}

// 产品大类变化处理
const onProductMainCategoryChange = (productIndex, categoryId) => {
  const product = reportForm.products[productIndex]
  product.campaignSubCategory = ''

  if (!categoryId) {
    productSubCategories.value[productIndex] = []
    return
  }

  const category = mainCategories.value.find(cat => cat._id === categoryId)
  if (category && category.subCategories) {
    productSubCategories.value[productIndex] = category.subCategories.filter(sub => sub.isActive)
  } else {
    productSubCategories.value[productIndex] = []
  }
}

// 提交日报
const submitReport = async () => {
  try {
    const valid = await reportFormRef.value.validate()
    if (!valid) return

    // 验证产品列表
    if (!validateProducts()) {
      return
    }

    submittingReport.value = true

    // 构建提交数据
    const submitData = {
      reportType: reportForm.reportType,
      reportHour: reportForm.reportType === 'hourly' ? reportForm.reportHour : null,
      reportDate: reportForm.reportDate,
      groupName: reportForm.groupName.trim(),
      reporters: reportForm.reporters,
      remark: reportForm.remarks?.trim() || '',
      products: reportForm.products.map(product => ({
        productName: product.productName.trim(),
        campaignMainCategory: product.campaignMainCategory,
        campaignSubCategory: product.campaignSubCategory || null,
        promotionCost: parseFloat(product.promotionCost) || 0,
        totalSalesAmount: parseFloat(product.totalSalesAmount) || 0,
        totalSalesQuantity: parseInt(product.totalSalesQuantity) || 0,
        roi: parseFloat(product.roi) || 0
      }))
    }

    let result
    if (isEditMode.value && editingReportId.value) {
      // 编辑模式：更新日报
      result = await dailyReportStore.updateReport(editingReportId.value, submitData)
    } else {
      // 新增模式：创建日报
      result = await dailyReportStore.addReport(submitData)
    }

    if (result.success) {
      ElMessage.success(isEditMode.value ? '日报更新成功' : result.message)
      
      // 通知现在通过WebSocket实时推送，不需要前端模拟
      // 通知已通过WebSocket发送
      
      // 关闭弹框并刷新列表（包含统计信息更新）
      handleAddDialogClose()
      fetchReports({}, true)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    submittingReport.value = false
  }
}

// 重置日报表单
const resetReportForm = () => {
  reportFormRef.value?.resetFields()
  productSubCategories.value = []
  // 清除编辑模式
  isEditMode.value = false
  editingReportId.value = null
  // 不清空 reporterOptions，保留已加载的选项
  Object.assign(reportForm, {
    reportType: 'daily',
    reportHour: '',
    reportDate: new Date(),
    groupName: '',
    reporters: [],
    remarks: '',
    products: [
      {
        productName: '',
        campaignMainCategory: '',
        campaignSubCategory: '',
        promotionCost: '',
        totalSalesAmount: '',
        totalSalesQuantity: '',
        roi: ''
      }
    ]
  })
  initProductSubCategories()
}

// 关闭新增对话框
const handleAddDialogClose = () => {
  resetReportForm()
  showAddDialog.value = false
}

// Tab 切换处理
const handleTabChange = (tabName) => {
  activeTab.value = tabName
  pagination.value.current = 1 // 重置到第一页
  fetchReports()
}

// 获取日报列表
const fetchReports = async (params = {}) => {
  loading.value = true
  try {
    const queryParams = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
      ...filterForm,
      ...params
    }

    // 处理日期范围，添加时间部分
    if (queryParams.startDate) {
      // 开始日期设置为 00:00:00
      const startDate = new Date(queryParams.startDate)
      startDate.setHours(0, 0, 0, 0)
      queryParams.startDate = startDate.toISOString()
    }
    if (queryParams.endDate) {
      // 结束日期设置为 23:59:59
      const endDate = new Date(queryParams.endDate)
      endDate.setHours(23, 59, 59, 999)
      queryParams.endDate = endDate.toISOString()
    }

    // 根据当前Tab添加过滤条件
    if (activeTab.value === 'my-reports') {
      // 我创建的日报
      queryParams.isMyReports = 'true'
    } else if (activeTab.value === 'reports-to-me') {
      // 汇报给我的日报
      queryParams.isReportsToMe = 'true'
    }

    const result = await dailyReportStore.fetchReports(queryParams)

    if (!result.success) {
      ElMessage.error(result.message)
    }

    return result
  } catch (error) {
    console.error('获取日报列表失败:', error)
    ElMessage.error('获取数据失败')
    return { success: false, message: '获取数据失败' }
  } finally {
    loading.value = false
  }
}



// 处理日期范围变化
const handleDateRangeChange = (dates) => {
  if (dates && dates.length === 2) {
    filterForm.startDate = dates[0]
    filterForm.endDate = dates[1]
  } else {
    filterForm.startDate = ''
    filterForm.endDate = ''
  }
}

// 搜索用户（提交人）
const searchUsers = async (query) => {
  if (!query) {
    userOptions.value = []
    return
  }

  try {
    const response = await employeeApi.getReporters({
      search: query,
      limit: 50,
      isActive: true
    })

    if (response.success) {
      userOptions.value = response.data || []
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
  }
}

// 搜索汇报对象（用于筛选）
const searchFilterReporters = async (query) => {
  if (!query) {
    filterReporterOptions.value = []
    return
  }

  try {
    const response = await employeeApi.getReporters({
      search: query,
      limit: 50,
      isActive: true
    })

    if (response.success) {
      filterReporterOptions.value = response.data || []
    }
  } catch (error) {
    console.error('搜索汇报对象失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.current = 1
  fetchReports({}, false) // 搜索时不需要重新获取统计信息
}

// 重置过滤条件
const resetFilter = () => {
  Object.keys(filterForm).forEach(key => {
    filterForm[key] = ''
  })
  dateRange.value = []
  userOptions.value = []
  filterReporterOptions.value = []

  // 重置为默认的当天日期范围
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  dateRange.value = [todayStr, todayStr]
  filterForm.startDate = todayStr
  filterForm.endDate = todayStr

  pagination.value.current = 1
  fetchReports({}, false) // 重置时不需要重新获取统计信息
}

// 刷新数据
const refreshData = () => {
  fetchReports({}, true) // 刷新时重新获取统计信息
}

// 分页处理
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.current = 1
  fetchReports({}, false) // 分页时不需要重新获取统计信息
}

const handleCurrentChange = (page) => {
  pagination.value.current = page
  fetchReports({}, false) // 分页时不需要重新获取统计信息
}

// 选择处理
const handleSelectionChange = (selection) => {
  selectedReports.value = selection
}





// 查看日报详情
const viewReport = async (report) => {
  try {
    // 显示日报详情
    currentReport.value = report
    showDetailDialog.value = true

    // 检查当前用户是否是汇报人，如果是则自动标记已读
    const currentUserId = userStore.userInfo?._id
    const isReporter = report.reporters?.some(reporter =>
      (typeof reporter === 'object' ? reporter._id : reporter) === currentUserId
    )

    if (isReporter && !report.isReadByCurrentUser) {
      try {
        // 调用后端API标记已读
        const response = await dailyReportApi.markDailyReportAsRead(report._id)

        if (response.success) {
          // 更新本地状态
          report.isReadByCurrentUser = true

          // 从通知系统中移除相关通知
          await removeReportNotification(report._id)
        }
      } catch (error) {
        console.error('标记已读失败:', error)
        // 不影响查看功能，只记录错误
      }
    }
  } catch (error) {
    console.error('查看日报详情失败:', error)
    ElMessage.error('查看日报详情失败')
  }
}

// 从通知系统中移除日报相关通知
const removeReportNotification = async (reportId) => {
  try {
    const notificationStore = useNotificationStore()

    // 使用新的方法移除与该日报相关的通知
    notificationStore.removeNotificationsByReportId(reportId)
  } catch (error) {
    console.error('移除通知失败:', error)
  }
}

// 编辑日报
const editReport = async (report) => {
  try {
    // 获取完整的日报数据
    const response = await dailyReportApi.getDailyReport(report._id)
    if (response.success) {
      const reportData = response.data

      // 填充表单数据
      Object.assign(reportForm, {
        reportType: reportData.reportType || 'daily',
        reportHour: reportData.reportHour || '',
        reportDate: new Date(reportData.reportDate),
        groupName: reportData.groupName || '',
        reporters: reportData.reporters?.map(r => r._id) || [],
        remarks: reportData.remark || '',
        products: reportData.products?.map(product => ({
          productName: product.productName || '',
          campaignMainCategory: product.campaignMainCategory?._id || '',
          campaignSubCategory: product.campaignSubCategory?._id || '',
          promotionCost: product.promotionCost?.toString() || '',
          totalSalesAmount: product.totalSalesAmount?.toString() || '',
          totalSalesQuantity: product.totalSalesQuantity?.toString() || '',
          roi: product.roi?.toString() || ''
        })) || [
          {
            productName: '',
            campaignMainCategory: '',
            campaignSubCategory: '',
            promotionCost: '',
            totalSalesAmount: '',
            totalSalesQuantity: '',
            roi: ''
          }
        ]
      })

      // 设置编辑模式
      editingReportId.value = report._id
      isEditMode.value = true

      // 初始化产品子分类
      initProductSubCategories()

      // 为每个产品加载对应的小类
      reportForm.products.forEach((product, index) => {
        if (product.campaignMainCategory) {
          onProductMainCategoryChange(index, product.campaignMainCategory)
        }
      })

      // 显示弹窗
      showAddDialog.value = true
    } else {
      ElMessage.error('获取日报详情失败')
    }
  } catch (error) {
    console.error('编辑日报失败:', error)
    ElMessage.error('编辑日报失败，请重试')
  }
}

// 删除日报
const deleteReport = async (report) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${formatDate(report.reportDate)} 的日报吗？`,
      '确认删除',
      {
        type: 'warning'
      }
    )

    const result = await dailyReportStore.deleteReport(report._id)
    if (result.success) {
      ElMessage.success(result.message)
      fetchReports({}, true) // 删除后刷新数据并更新统计信息
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除日报失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 显示新增弹框
const openAddDialog = () => {
  showAddDialog.value = true
}


// 权限检查
const canEdit = (report) => {
  return currentUser.value?.isAdmin || report.submitter?._id === currentUser.value?._id
}

const canDelete = (report) => {
  return currentUser.value?.isAdmin || report.submitter?._id === currentUser.value?._id
}

// 格式化方法
const formatDate = (date) => {
  return dailyReportStore.formatReportDate(date)
}

const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const formatCurrency = (amount) => {
  return dailyReportStore.formatCurrency(amount)
}

const formatROI = (roi) => {
  return dailyReportStore.formatROI(roi)
}





// 初始化数据（优化版本）
const initData = async () => {
  try {
    // 确保activeTab设置为我创建的
    activeTab.value = 'my-reports'

    // 设置默认日期范围为当天
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    dateRange.value = [todayStr, todayStr]
    filterForm.startDate = todayStr
    filterForm.endDate = todayStr

    // 并行执行基础数据获取和日报数据获取
    await Promise.all([
      // 基础数据获取
      Promise.all([
        campaignCategoryStore.fetchMainCategories(),
        campaignCategoryStore.fetchCategoriesWithChildren(),
        loadDefaultReporters()
      ]),
      // 日报数据获取（带上默认日期范围）
      fetchReports()
    ])

    // 检查URL参数，如果有showDetail参数，自动显示详情
    const showDetailId = route.query.showDetail
    if (showDetailId) {
      const report = reports.value.find(r => r._id === showDetailId)
      if (report) {
        viewReport(report)
      } else {
        // 如果当前页面没有找到，尝试获取详情
        try {
          const result = await dailyReportStore.getReport(showDetailId)
          if (result.success) {
            currentReport.value = result.data
            showDetailDialog.value = true
          }
        } catch (error) {
          console.error('获取日报详情失败:', error)
        }
      }

      // 清除URL参数
      router.replace({ query: { ...route.query, showDetail: undefined } })
    }

    return { success: true }
  } catch (error) {
    console.error('初始化数据失败:', error)
  }
}

// 监听弹框打开，初始化数据
watch(() => showAddDialog.value, async (newVal) => {
  if (newVal) {
    // 初始化分类数据和汇报人选项
    try {
      await Promise.all([
        campaignCategoryStore.fetchMainCategories(),
        campaignCategoryStore.fetchCategoriesWithChildren(),
        loadDefaultReporters(),
        loadProductNameSuggestions()
      ])
      
      if (!mainCategories.value || mainCategories.value.length === 0) {
        ElMessage.warning('未加载到投放大类数据，请检查权限或重新加载')
      }
    } catch (error) {
      console.error('初始化弹框数据失败:', error)
      ElMessage.error('加载数据失败，请重试')
    }
  }
})

onMounted(async () => {
  // 等待用户信息加载完成
  if (!userStore.user) {
    await userStore.fetchUserInfo()
  }

  // 初始化产品子分类数组
  initProductSubCategories()

  await initData()

  // 检查URL参数，如果有showDetail参数，则显示对应的日报详情
  const showDetailId = route.query.showDetail
  if (showDetailId) {
    try {
      const response = await dailyReportApi.getDailyReport(showDetailId)
      if (response.success) {
        currentReport.value = response.data
        showDetailDialog.value = true

        // 清除URL参数，避免刷新时重复显示
        router.replace({ query: {} })
      }
    } catch (error) {
      console.error('获取日报详情失败:', error)
    }
  }
})
</script>

<style scoped>
.daily-report-list {
  padding: 20px;
}

/* 页面标题 */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.title-icon {
  font-size: 24px;
  color: #409eff;
  margin-right: 12px;
}

.page-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2329;
}

.page-description {
  color: #86909c;
  font-size: 14px;
  margin: 0;
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

.business-input,
.business-select {
  width: 150px;
  font-size: 13px;
}

.business-input :deep(.el-input__wrapper),
.business-select :deep(.el-input__wrapper) {
  border-radius: 4px;
  min-height: 28px;
}

.business-btn {
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 4px;
  height: 28px;
}

.search-actions {
  display: flex;
  gap: 8px;
  align-self: flex-start;
}

/* 操作栏 */
.action-card {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  gap: 12px;
}

.action-btn {
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
}

.action-btn.primary {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border: none;
  color: white;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.3);
}

.action-btn.primary:hover {
  background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.4);
}

.total-count {
  color: #86909c;
  font-size: 14px;
  font-weight: 500;
}

/* 表格卡片 */
.table-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.table-container {
  width: 100%;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 100%;
}

.category-info .el-tag {
  font-size: 12px;
  padding: 2px 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-tag {
  margin-left: 0;
}

.reporters-list,
.reporters-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  max-width: 100%;
}

.reporter-tag {
  margin: 0;
  font-size: 12px;
  padding: 2px 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.report-detail {
  max-height: 60vh;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .daily-report-list {
    padding: 16px;
  }

  .filter-form {
    flex-direction: column;
  }

  .filter-form .el-form-item {
    margin-right: 0;
    margin-bottom: 16px;
  }

  .toolbar {
    flex-direction: column;
  }

  .category-info {
    align-items: flex-start;
  }

  .reporters-list {
    max-width: 120px;
  }
}

/* 表格样式优化 */
.table-card .el-table {
  border-radius: 6px;
  overflow: hidden;
}

.table-card .el-table th {
  background-color: #fafbfc;
  color: #1f2329;
  font-weight: 600;
}

:deep(.el-tag + .el-tag) {
  margin-left: 4px;
}

/* 表格内容样式 */
.time-text {
  color: #1f2329;
  font-size: 14px;
}

.amount-text {
  font-weight: 600;
  font-size: 14px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.amount-text.income {
  color: #00b42a;
}

.amount-text.expense {
  color: #f53f3f;
}

/* Tab栏样式 */
.tab-container {
  margin-bottom: 16px;
  padding: 0 4px;
}

.report-tabs {
  --el-tabs-header-height: 44px;
}

.report-tabs .el-tabs__header {
  margin: 0;
  border-bottom: 1px solid #e4e7ed;
}

.report-tabs .el-tabs__nav-wrap::after {
  height: 1px;
  background-color: #e4e7ed;
}

.report-tabs .el-tabs__item {
  padding: 0 16px;
  height: 44px;
  line-height: 44px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.report-tabs .el-tabs__item:hover {
  color: #409eff;
}

.report-tabs .el-tabs__item.is-active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.tab-label .el-icon {
  font-size: 16px;
}

.tab-badge {
  margin-left: 4px;
}

.tab-badge :deep(.el-badge__content) {
  border: 1px solid #fff;
  font-size: 11px;
  height: 16px;
  line-height: 14px;
  padding: 0 4px;
  min-width: 16px;
}

/* 分页样式 */
.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.custom-pagination {
  --el-pagination-font-size: 14px;
  --el-pagination-bg-color: #ffffff;
  --el-pagination-text-color: #1f2329;
  --el-pagination-border-radius: 6px;
}

/* 对话框样式 */
.record-dialog .el-dialog__body {
  padding: 20px 24px;
}

.record-dialog .el-form-item {
  margin-bottom: 22px;
}

.record-dialog .el-form-item__label {
  font-weight: 600;
  color: #1f2329;
  line-height: 32px;
}

/* 对话框中的时间选择器修复 */
.dialog-date-picker {
  width: 100%;
}

.dialog-date-picker .el-date-editor {
  width: 100%;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: border-color 0.3s;
}

.dialog-date-picker .el-date-editor:hover {
  border-color: #409eff;
}

.dialog-date-picker .el-date-editor.is-active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.dialog-date-picker .el-date-editor .el-input__inner {
  height: 30px;
  line-height: 30px;
  font-size: 14px;
}

.dialog-date-picker .el-date-editor .el-input__prefix {
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.dialog-date-picker .el-date-editor .el-input__suffix {
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

/* 对话框脚注 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 汇报人列表样式 */
.reporters-list {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.reporter-tag {
  flex-shrink: 0;
}

.more-reporters-tag {
  cursor: pointer;
  flex-shrink: 0;
}

.more-reporters-tag:hover {
  opacity: 0.8;
}

.no-reporters {
  color: #c0c4cc;
  font-style: italic;
}

/* 汇报人提示框样式 */
.reporters-tooltip {
  max-width: 200px;
}

.tooltip-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #fff;
}

.tooltip-reporter {
  margin-bottom: 4px;
  color: #fff;
  line-height: 1.4;
}

.tooltip-reporter:last-child {
  margin-bottom: 0;
}

/* 备注列样式 */
.remarks-content {
  max-width: 150px;
}

.remarks-text {
  color: #606266;
  line-height: 1.4;
  word-break: break-all;
  cursor: pointer;
}

.no-remarks {
  color: #c0c4cc;
  font-style: italic;
}

.remarks-text:hover {
  color: #409eff;
}

/* 产品列表样式 - 参考批量新增核算佣金 */
.product-records {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.product-record-item {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  background-color: #fafafa;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.product-record-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.record-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.add-record-btn {
  margin-top: 16px;
}

.add-record-btn .el-button {
  border: 2px dashed #c0c4cc;
  background-color: #fafafa;
  color: #909399;
  transition: all 0.3s;
}

.add-record-btn .el-button:hover {
  border-color: #409eff;
  color: #409eff;
  background-color: #ecf5ff;
}

/* 详情对话框产品列表样式 */
.product-detail-records {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
}

.product-detail-item {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  background-color: #fafafa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.detail-field {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.detail-label {
  font-weight: 500;
  color: #606266;
  min-width: 90px;
  font-size: 14px;
}

.detail-value {
  color: #303133;
  font-size: 14px;
}

</style>
