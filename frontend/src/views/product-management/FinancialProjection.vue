<template>
  <div class="financial-projection" :class="{ 'mobile-view': isMobileDevice }">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><List /></el-icon>
        <h2>财务测算</h2>
      </div>
      <div class="page-description">
        产品预算管理，实时计算毛利和佣金
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-card business-style" :class="{ 'mobile-search': isMobileDevice }">
      <el-form :model="searchForm" :inline="!isMobileDevice" class="business-search-form">
        <div class="search-fields" :class="{ 'mobile-fields': isMobileDevice }">
          <el-form-item label="产品名称" class="search-item">
            <el-autocomplete
              v-model="searchForm.productName"
              :fetch-suggestions="queryProductNameSuggestions"
              placeholder="请输入产品名称"
              clearable
              class="business-input"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="店铺名称" class="search-item">
            <el-autocomplete
              v-model="searchForm.shopName"
              :fetch-suggestions="queryShopNameSuggestions"
              placeholder="请输入店铺名称"
              clearable
              class="business-input"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="平台" class="search-item">
            <el-autocomplete
              v-model="searchForm.platform"
              :fetch-suggestions="queryPlatformSuggestions"
              placeholder="请输入平台名称"
              clearable
              class="business-input"
              style="width: 100%;"
            />
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
              style="width: 100%;"
              :shortcuts="dateShortcuts"
              @change="handleDateRangeChange"
            />
          </el-form-item>
          <el-form-item label="毛利范围" class="search-item">
            <div class="profit-range">
              <el-input-number
                v-model="searchForm.minGrossMargin"
                placeholder="最小毛利"
                :precision="2"
                class="range-input"
                style="width: 100%;"
              />
              <span class="range-separator">-</span>
              <el-input-number
                v-model="searchForm.maxGrossMargin"
                placeholder="最大毛利"
                :precision="2"
                class="range-input"
                style="width: 100%;"
              />
            </div>
          </el-form-item>
        </div>
        <div class="search-actions" :class="{ 'mobile-actions': isMobileDevice }">
          <el-button @click="handleSearch" type="primary" :icon="Search" class="business-btn">查询</el-button>
          <el-button @click="handleReset" class="business-btn">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="handleAdd" :icon="Plus" class="action-btn primary">
          新增预算
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="selectedBudgets.length === 0"
          :icon="Delete"
          class="action-btn danger"
        >
          批量删除
        </el-button>
        <el-button @click="handleExport" :icon="Download" class="action-btn" v-if="!isMobileDevice">
          导出数据
          <span v-if="selectedBudgets.length">({{ selectedBudgets.length }}条)</span>
        </el-button>
        <el-button type="info" @click="showImportDialog = true" :icon="Upload" class="action-btn info">
          Excel导入
        </el-button>
        <el-button type="warning" @click="showSummaryDialog = true" :icon="TrendCharts" class="action-btn warning">
          产品汇总
        </el-button>
        <el-button
          type="primary"
          @click="handleSelectedSummary"
          :disabled="selectedBudgets.length === 0"
          :icon="TrendCharts"
          class="action-btn primary"
          plain
        >
          多选汇总 ({{ selectedBudgets.length }})
        </el-button>
      </div>
      <div class="action-right" v-if="!isMobileDevice">
        <span class="total-count">共 {{ budgetStore.pagination?.totalRecords || 0 }} 条数据</span>
        <el-tooltip content="刷新数据" placement="top">
          <el-button @click="handleRefresh" :icon="Refresh" circle />
        </el-tooltip>
      </div>
    </div>

    <!-- 预算列表 -->
    <el-card class="table-card">
      <el-table
        :data="budgetStore.budgets"
        v-loading="budgetStore.loading"
        @selection-change="handleSelectionChange"
        stripe
        max-height="600"
        border
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="productName" label="产品名称" min-width="150" show-overflow-tooltip />

        <el-table-column prop="shopName" label="店铺名称" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.shopName || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="platform" label="平台" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.platform || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="sellingPrice" label="售价" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.sellingPrice?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="unitCost" label="成本单价" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.unitCost?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="shippingCost" label="运费" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.shippingCost?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="platformFee" label="平台费用" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.platformFee?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="handlingFee" label="手续费" width="100" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.handlingFee?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="grossMargin" label="毛利" width="120" align="right">
          <template #default="{ row }">
            <span :class="['price', row.grossMargin >= 0 ? 'profit' : 'loss']">
              ¥{{ row.grossMargin?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="actualCommission" label="实际佣金" width="120" align="right">
          <template #default="{ row }">
            <span :class="['commission', row.actualCommission >= 0 ? 'profit' : 'loss']">
              {{ row.actualCommission?.toFixed(2) || '0.00' }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="createdBy" label="创建者" width="120">
          <template #default="{ row }">
            {{ row.createdBy?.username || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatUtcToLocalDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-tooltip content="编辑" placement="top">
              <el-button
                size="small"
                type="primary"
                @click="handleEdit(row)"
                :icon="Edit"
                circle
              />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(row)"
                :icon="Delete"
                circle
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100, 1000]"
          :total="budgetStore.pagination.totalRecords"
          :layout="isMobileDevice ? 'total, sizes, prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :small="isMobileDevice"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
          :class="{ 'mobile-pagination': isMobileDevice }"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingBudget ? '编辑产品预算' : '新增产品预算'"
      :width="isMobileDevice ? '95%' : '900px'"
      :fullscreen="isMobileDevice"
      append-to-body
      @close="resetForm"
    >
      <el-form
        ref="budgetFormRef"
        :model="budgetForm"
        :rules="budgetRules"
        label-width="100px"
      >
        <el-form-item label="产品名称" prop="productName">
          <el-autocomplete
            v-model="budgetForm.productName"
            :fetch-suggestions="queryProductNameSuggestions"
            placeholder="请输入产品名称"
            style="width: 100%"
            maxlength="100"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="店铺名称" prop="shopName">
          <el-autocomplete
            v-model="budgetForm.shopName"
            :fetch-suggestions="queryShopNameSuggestions"
            placeholder="请输入店铺名称（可选）"
            style="width: 100%"
            maxlength="100"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-form-item label="平台" prop="platform">
          <el-autocomplete
            v-model="budgetForm.platform"
            :fetch-suggestions="queryPlatformSuggestions"
            placeholder="请输入平台名称（可选）"
            style="width: 100%"
            maxlength="50"
            show-word-limit
            clearable
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="售价" prop="sellingPrice">
              <el-input
                v-model="budgetForm.sellingPrice"
                placeholder="请输入数字"
                style="width: 100%"
                @input="(value) => handleNumberInput('sellingPrice', value)"
                @blur="updateCalculation"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成本单价" prop="unitCost">
              <el-input
                v-model="budgetForm.unitCost"
                placeholder="请输入数字"
                style="width: 100%"
                @input="(value) => handleNumberInput('unitCost', value)"
                @blur="updateCalculation"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运费" prop="shippingCost">
              <el-input
                v-model="budgetForm.shippingCost"
                placeholder="请输入数字"
                style="width: 100%"
                @input="(value) => handleNumberInput('shippingCost', value)"
                @blur="updateCalculation"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台费用" prop="platformFee">
              <el-input
                v-model="budgetForm.platformFee"
                placeholder="请输入数字"
                style="width: 100%"
                @input="(value) => handleNumberInput('platformFee', value)"
                @blur="updateCalculation"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="手续费" prop="handlingFee">
          <el-input
            v-model="budgetForm.handlingFee"
            placeholder="请输入数字"
            style="width: 100%"
            @input="(value) => handleNumberInput('handlingFee', value)"
            @blur="updateCalculation"
          />
        </el-form-item>

        <!-- 实时计算结果 -->
        <el-card class="calculation-preview" v-if="calculationResult">
          <template #header>
            <span>实时计算结果</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="12">
               <el-tooltip
                class="box-item"
                effect="dark"
                content="毛利 = 售价 - 成本单价 - 运费 - 平台费用 - 手续费"
                placement="top-start"
              >
                <div class="calc-item">
                  <span class="calc-label">毛利：</span>
                  <span :class="['calc-value', calculationResult.grossMargin >= 0 ? 'profit' : 'loss']">
                    ¥{{ calculationResult.grossMargin }}
                  </span>
                </div>
              </el-tooltip>
              
            </el-col>
            <el-col :span="12">
               <el-tooltip
                class="box-item"
                effect="dark"
                content="实际佣金 = (毛利 ÷ 售价) × 100%"
                placement="top-start"
              >
                <div class="calc-item">
                  <span class="calc-label">实际佣金：</span>
                  <span :class="['calc-value', calculationResult.actualCommission >= 0 ? 'profit' : 'loss']">
                    {{ calculationResult.actualCommission }}%
                  </span>
                </div>
              </el-tooltip>
            </el-col>
          </el-row>
        </el-card>

        <el-form-item label="备注" prop="description">
          <el-input
            v-model="budgetForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer" :class="{ 'mobile-footer': isMobileDevice }">
          <el-button @click="showAddDialog = false" :class="{ 'mobile-btn': isMobileDevice }">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" :class="{ 'mobile-btn': isMobileDevice }">
            {{ editingBudget ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Excel导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="Excel批量导入"
      :width="isMobileDevice ? '95%' : '900px'"
      :fullscreen="isMobileDevice"
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
              <li>必填字段：产品名称、售价</li>
              <li>可选字段：店铺名称、成本单价、运费、平台费用、手续费、备注</li>
              <li>数字字段支持负数和小数</li>
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
            max-height="400"
            class="preview-table"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="productName" label="产品名称" min-width="120" />
            <el-table-column prop="shopName" label="店铺名称" min-width="120" />
            <el-table-column prop="platform" label="平台" width="100" />
            <el-table-column prop="sellingPrice" label="售价" width="100" align="right">
              <template #default="{ row }">
                <span :class="{ 'negative-value': row.sellingPrice < 0 }">
                  ¥{{ row.sellingPrice?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="unitCost" label="成本单价" width="100" align="right">
              <template #default="{ row }">
                <span :class="{ 'negative-value': row.unitCost < 0 }">
                  ¥{{ row.unitCost?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="shippingCost" label="运费" width="80" align="right">
              <template #default="{ row }">
                <span :class="{ 'negative-value': row.shippingCost < 0 }">
                  ¥{{ row.shippingCost?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="platformFee" label="平台费用" width="100" align="right">
              <template #default="{ row }">
                <span :class="{ 'negative-value': row.platformFee < 0 }">
                  ¥{{ row.platformFee?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="handlingFee" label="手续费" width="80" align="right">
              <template #default="{ row }">
                <span :class="{ 'negative-value': row.handlingFee < 0 }">
                  ¥{{ row.handlingFee?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="备注" min-width="100" />
          </el-table>

          <div v-if="importData.length > 10" class="preview-more">
            <el-alert
              :title="`仅显示前10条记录，实际将导入 ${importData.length} 条记录`"
              type="info"
              :closable="false"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer" :class="{ 'mobile-footer': isMobileDevice }">
          <el-button @click="showImportDialog = false" :class="{ 'mobile-btn': isMobileDevice }">取消</el-button>
          <el-button
            v-if="importData.length > 0"
            type="primary"
            @click="handleImportConfirm"
            :loading="importSubmitting"
            :class="{ 'mobile-btn': isMobileDevice }"
          >
            确认导入 ({{ importData.length }} 条)
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 产品汇总对话框 -->
    <el-dialog
      v-model="showSummaryDialog"
      title="产品汇总分析"
      :width="isMobileDevice ? '95%' : '1000px'"
      :fullscreen="isMobileDevice"
      append-to-body
      @close="resetSummaryData"
    >
      <div class="summary-container">
        <!-- 搜索区域 -->
        <div class="summary-search">
          <el-form :model="summaryForm" inline @submit.prevent="fetchProductSummary">
            <el-form-item label="产品名称">
              <el-autocomplete
                v-model="summaryForm.productName"
                :fetch-suggestions="handleSummaryProductNameInput"
                placeholder="请输入产品名称"
                style="width: 300px"
                clearable
                @select="fetchProductSummary"
                @keyup.enter.prevent="fetchProductSummary"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="fetchProductSummary" :loading="summaryLoading" :icon="Search">
                查询汇总
              </el-button>
              <el-button @click="resetSummaryData" :icon="Refresh">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 汇总统计卡片 -->
        <div v-if="summaryAllData.length > 0" class="summary-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon success">
                    <el-icon><List /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">{{ summaryStats.recordCount }}</div>
                    <div class="stats-label">记录数量</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon commission">
                    <el-icon><Coin /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">{{ summaryStats.totalSellingPrice.toFixed(2) }}</div>
                    <div class="stats-label">总售价</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon profit">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">{{ summaryStats.totalGrossMargin.toFixed(2) }}</div>
                    <div class="stats-label">总毛利</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon" :class="summaryStats.totalActualCommission >= 0 ? 'profit' : 'danger'">
                    <el-icon><SuccessFilled v-if="summaryStats.totalActualCommission >= 0" /><WarningFilled v-else /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value" :class="summaryStats.totalActualCommission >= 0 ? 'profit' : 'loss'">
                      {{ summaryStats.totalActualCommission.toFixed(2) }}%
                    </div>
                    <div class="stats-label">平均实际佣金</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 详细数据表格 -->
        <div v-if="summaryAllData.length > 0" class="summary-table">
          <div class="table-header">
            <h4>{{ summaryForm.productName }} - 各店铺平台明细</h4>
          </div>

          <el-table
            :data="summaryData"
            border
            stripe
            max-height="400"
            :loading="summaryLoading"
          >
            <el-table-column type="index" label="序号" width="60" :index="(index) => (summaryCurrentPage - 1) * summaryPageSize + index + 1" />

            <el-table-column prop="productName" label="产品名称" min-width="120">
              <template #default="{ row }">
                <span>{{ row.productName || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="shopName" label="店铺名称" min-width="120">
              <template #default="{ row }">
                <span>{{ row.shopName || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="platform" label="平台" width="100">
              <template #default="{ row }">
                <span>{{ row.platform || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="sellingPrice" label="售价" width="100" align="right">
              <template #default="{ row }">
                <span class="price">¥{{ row.sellingPrice?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="grossMargin" label="毛利" width="100" align="right">
              <template #default="{ row }">
                <span :class="['price', row.grossMargin >= 0 ? 'profit' : 'loss']">
                  ¥{{ row.grossMargin?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="actualCommission" label="实际佣金" width="100" align="right">
              <template #default="{ row }">
                <span :class="['commission', row.actualCommission >= 0 ? 'profit' : 'loss']">
                  {{ row.actualCommission?.toFixed(2) || '0.00' }}%
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatUtcToLocalDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>

          <!-- 汇总分页 -->
          <div class="summary-pagination">
            <el-pagination
              v-model:current-page="summaryCurrentPage"
              v-model:page-size="summaryPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="summaryAllData.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSummarySizeChange"
              @current-change="handleSummaryPageChange"
            />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!summaryLoading" class="empty-state">
          <el-empty description="请输入产品名称查询汇总数据" />
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer" :class="{ 'mobile-footer': isMobileDevice }">
          <el-button @click="showSummaryDialog = false" :class="{ 'mobile-btn': isMobileDevice }">关闭</el-button>
          <el-button
            v-if="summaryAllData.length > 0 && !isMobileDevice"
            type="primary"
            @click="exportSummaryData"
            :icon="Download"
            :class="{ 'mobile-btn': isMobileDevice }"
          >
            导出汇总数据
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 多选汇总对话框 -->
    <el-dialog
      v-model="showSelectedSummaryDialog"
      title="多选数据汇总"
      :width="isMobileDevice ? '95%' : '60vw'"
      :fullscreen="isMobileDevice"
      append-to-body
    >
      <div class="selected-summary-container">
        <!-- 汇总统计卡片 -->
        <div class="summary-stats">
          <el-row :gutter="16" style="margin-bottom: 20px;">
            <el-col :span="8" :xs="24" :sm="12" :md="8" :lg="8">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon commission">
                    <el-icon><Coin /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">¥{{ selectedSummaryStats.totalSellingPrice.toFixed(2) }}</div>
                    <div class="stats-label">总售价</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="8" :xs="24" :sm="12" :md="8" :lg="8">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon profit">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">¥{{ selectedSummaryStats.totalGrossMargin.toFixed(2) }}</div>
                    <div class="stats-label">总毛利</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="8" :xs="24" :sm="12" :md="8" :lg="8">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon" :class="selectedSummaryStats.totalActualCommission >= 0 ? 'profit' : 'danger'">
                    <el-icon>
                      <SuccessFilled v-if="selectedSummaryStats.totalActualCommission >= 0" />
                      <WarningFilled v-else />
                    </el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value" :class="selectedSummaryStats.totalActualCommission >= 0 ? 'profit' : 'loss'">
                      {{ selectedSummaryStats.totalActualCommission.toFixed(2) }}%
                    </div>
                    <div class="stats-label">平均实际佣金</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 选中数据详情 -->
        <div class="selected-details">
          <div class="table-header">
            <h4>选中数据明细 (共{{ selectedSummaryStats.recordCount }}条)</h4>
          </div>

          <el-table
            :data="selectedBudgets"
            border
            stripe
            height="400"
          >
            <el-table-column prop="productName" label="产品名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="shopName" label="店铺名称" min-width="120" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.shopName || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="platform" label="平台" width="100" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.platform || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="sellingPrice" label="售价" width="100" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ row.sellingPrice?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="unitCost" label="成本单价" width="100" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ row.unitCost?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="grossMargin" label="毛利" width="100" align="right">
              <template #default="{ row }">
                <span class="amount" :class="row.grossMargin >= 0 ? 'profit' : 'loss'">
                  ¥{{ row.grossMargin?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="actualCommission" label="实际佣金%" width="120" align="right">
              <template #default="{ row }">
                <span class="amount" :class="row.actualCommission >= 0 ? 'profit' : 'loss'">
                  {{ row.actualCommission?.toFixed(2) || '0.00' }}%
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer" :class="{ 'mobile-footer': isMobileDevice }">
          <el-button @click="showSelectedSummaryDialog = false" :class="{ 'mobile-btn': isMobileDevice }">关闭</el-button>
          <el-button
            type="primary"
            @click="exportSelectedSummaryData"
            :icon="Download"
            :class="{ 'mobile-btn': isMobileDevice }"
            v-if="!isMobileDevice"
          >
            导出汇总数据
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Delete,
  Edit,
  List,
  Search,
  Refresh,
  Download,
  Upload,
  TrendCharts,
  Coin,
  SuccessFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import { useBudgetStore } from '../../stores/budget'
import { formatUtcToLocalDateTime } from '../../utils/dateUtils'
import { numberValidators } from '../../utils/inputValidation'
import { useResponsive } from '../../utils/responsive'
import {
  readFinancialExcelFile,
  validateFinancialImportHeaders,
  transformFinancialImportData,
  validateFinancialImportData,
  generateFinancialImportTemplate,
  exportFinancialToCSV,
  exportFinancialToExcel,
  downloadFinancialImportTemplate
} from '../../utils/financialExcelUtils'

// Store
const budgetStore = useBudgetStore()

// 响应式工具
const { isMobileDevice } = useResponsive()

// 响应式数据
const showAddDialog = ref(false)
const showImportDialog = ref(false)
const showSummaryDialog = ref(false)
const showSelectedSummaryDialog = ref(false)
const editingBudget = ref(null)
const selectedBudgets = ref([])
const submitting = ref(false)
const importSubmitting = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive({
  productName: '',
  shopName: '',
  platform: '',
  minGrossMargin: null,
  maxGrossMargin: null,
  startDate: '',
  endDate: ''
})

// 日期范围
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

// 预算表单
const budgetForm = reactive({
  productName: '',
  shopName: '',
  platform: '',
  sellingPrice: '',
  unitCost: '',
  shippingCost: '',
  platformFee: '',
  handlingFee: '',
  description: ''
})

// 表单验证规则
const budgetRules = {
  productName: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 1, max: 100, message: '产品名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  sellingPrice: [
    { required: true, message: '请输入售价', trigger: 'blur' }
  ]
}

// 表单引用
const budgetFormRef = ref()

// 计算结果
const calculationResult = ref(null)

// Excel导入相关数据
const importData = ref([])
const importColumns = ref([])
const importFile = ref(null)

// 自动完成数据
const shopNameSuggestions = ref([])
const platformSuggestions = ref([])
const productNameSuggestions = ref([])

// 产品汇总相关数据
const summaryForm = reactive({
  productName: ''
})
const summaryData = ref([])
const summaryAllData = ref([]) // 存储所有汇总数据
const summaryLoading = ref(false)
const summaryCurrentPage = ref(1)
const summaryPageSize = ref(10)
const summaryStats = ref({
  totalSellingPrice: 0,
  totalGrossMargin: 0,
  totalActualCommission: 0,
  recordCount: 0
})

// 多选汇总相关数据
const selectedSummaryStats = ref({
  totalSellingPrice: 0,
  totalGrossMargin: 0,
  totalActualCommission: 0,
  recordCount: 0
})

// 数字输入验证处理器
const handleNumberInput = (field, value) => {
  // 所有数字字段都支持小数和负数（支持各种调整和退款场景）
  const validatedValue = numberValidators.signedNumber(value)
  budgetForm[field] = validatedValue

  // 触发实时计算
  updateCalculation()

  return validatedValue
}

// Excel导入相关方法
// 处理文件上传
const handleFileUpload = async (file) => {
  try {
    importSubmitting.value = true

    // 读取Excel文件
    const result = await readFinancialExcelFile(file.raw)

    // 验证表头
    const headerValidation = validateFinancialImportHeaders(result.headers)

    if (!headerValidation.isValid) {
      ElMessage.error(`缺少必填字段: ${headerValidation.missingRequired.join(', ')}`)
      return false
    }

    // 转换数据格式
    const transformedData = transformFinancialImportData(result.data, headerValidation.mappedFields)

    // 验证数据
    const dataValidation = validateFinancialImportData(transformedData)

    // 保存导入数据
    importData.value = dataValidation.validRows
    importColumns.value = result.headers
    importFile.value = file.raw

    // 显示验证结果
    if (dataValidation.errors.length > 0) {
      ElMessage.warning(`发现 ${dataValidation.errors.length} 行数据有错误，已自动过滤`)
    }

    if (dataValidation.warnings.length > 0) {
      ElMessage.warning(`发现 ${dataValidation.warnings.length} 行数据有警告`)
    }

    ElMessage.success(`成功解析 ${dataValidation.validRowCount} 行有效数据`)

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
    const result = await budgetStore.batchAddBudget(importData.value)

    if (result.success) {
      ElMessage.success(result.message)
      showImportDialog.value = false
      resetImportData()
      // 重新加载数据
      handleRefresh()
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

// 下载导入模板
const downloadTemplate = () => {
  try {
    // 使用新的 Excel 导出功能
    downloadFinancialImportTemplate('财务测算导入模板')
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败：' + error.message)
  }
}

// 自动完成查询方法
// 产品名称自动完成查询
const queryProductNameSuggestions = (queryString, callback) => {
  const results = queryString
    ? productNameSuggestions.value.filter(item =>
        item.value.toLowerCase().includes(queryString.toLowerCase())
      )
    : productNameSuggestions.value
  callback(results.slice(0, 10)) // 限制显示10个建议
}

// 店铺名称自动完成查询
const queryShopNameSuggestions = (queryString, callback) => {
  const results = queryString
    ? shopNameSuggestions.value.filter(item =>
        item.value.toLowerCase().includes(queryString.toLowerCase())
      )
    : shopNameSuggestions.value
  callback(results.slice(0, 10))
}

// 平台自动完成查询
const queryPlatformSuggestions = (queryString, callback) => {
  const results = queryString
    ? platformSuggestions.value.filter(item =>
        item.value.toLowerCase().includes(queryString.toLowerCase())
      )
    : platformSuggestions.value
  callback(results.slice(0, 10))
}

// 获取自动完成建议数据
const fetchSuggestions = async () => {
  try {
    // 获取产品名称建议
    const productNameResult = await budgetStore.fetchProductNameSuggestions()
    if (productNameResult.success) {
      productNameSuggestions.value = productNameResult.data.map(name => ({ value: name }))
    }

    // 获取店铺名称建议
    const shopNameResult = await budgetStore.fetchShopNameSuggestions()
    if (shopNameResult.success) {
      shopNameSuggestions.value = shopNameResult.data.map(name => ({ value: name }))
    }

    // 获取平台建议
    const platformResult = await budgetStore.fetchPlatformSuggestions()
    if (platformResult.success) {
      platformSuggestions.value = platformResult.data.map(name => ({ value: name }))
    }
  } catch (error) {
    console.error('获取建议数据失败:', error)
  }
}

// 产品汇总相关方法
// 获取产品汇总数据
const fetchProductSummary = async () => {
  if (!summaryForm.productName.trim()) {
    ElMessage.warning('请输入产品名称')
    return
  }

  try {
    summaryLoading.value = true

    // 简化版本：直接从当前已加载的数据中筛选
    // 如果主列表没有数据，先加载一次
    if (budgetStore.budgets.length === 0) {
      await fetchBudgets()
    }

    // 从当前数据中筛选匹配的产品
    const searchTerm = summaryForm.productName.trim().toLowerCase()
    const allData = budgetStore.budgets.filter(item =>
      item.productName && item.productName.toLowerCase().includes(searchTerm)
    )

    // 存储所有数据用于统计和分页
    summaryAllData.value = allData

    // 重置分页
    summaryCurrentPage.value = 1

    // 更新当前页数据
    updateSummaryPageData()

    // 计算汇总统计（基于所有数据）
    calculateSummaryStats()

    if (summaryAllData.value.length === 0) {
      ElMessage.info('未找到相关产品数据')
    } else {
      ElMessage.success(`找到 ${summaryAllData.value.length} 条相关记录`)
    }

  } catch (error) {
    ElMessage.error('获取汇总数据失败')
  } finally {
    summaryLoading.value = false
  }
}

// 更新汇总分页数据
const updateSummaryPageData = () => {
  const start = (summaryCurrentPage.value - 1) * summaryPageSize.value
  const end = start + summaryPageSize.value
  summaryData.value = summaryAllData.value.slice(start, end)
}

// 汇总分页处理
const handleSummaryPageChange = (page) => {
  summaryCurrentPage.value = page
  updateSummaryPageData()
}

const handleSummarySizeChange = (size) => {
  summaryPageSize.value = size
  summaryCurrentPage.value = 1
  updateSummaryPageData()
}

// 计算汇总统计（基于所有数据，不是当前页数据）
const calculateSummaryStats = () => {
  if (summaryAllData.value.length === 0) {
    summaryStats.value = {
      totalSellingPrice: 0,
      totalGrossMargin: 0,
      totalActualCommission: 0,
      recordCount: 0
    }
    return
  }

  const stats = summaryAllData.value.reduce((acc, item) => {
    acc.totalSellingPrice += item.sellingPrice || 0
    acc.totalGrossMargin += item.grossMargin || 0
    return acc
  }, {
    totalSellingPrice: 0,
    totalGrossMargin: 0
  })

  // 计算平均实际佣金
  const totalActualCommission = summaryAllData.value.reduce((sum, item) => {
    return sum + (item.actualCommission || 0)
  }, 0)
  const averageActualCommission = summaryAllData.value.length > 0
    ? totalActualCommission / summaryAllData.value.length
    : 0

  summaryStats.value = {
    ...stats,
    totalActualCommission: averageActualCommission,
    recordCount: summaryAllData.value.length
  }
}

// 重置汇总数据
const resetSummaryData = () => {
  summaryForm.productName = ''
  summaryData.value = []
  summaryAllData.value = []
  summaryCurrentPage.value = 1
  summaryStats.value = {
    totalSellingPrice: 0,
    totalGrossMargin: 0,
    totalActualCommission: 0,
    recordCount: 0
  }
}

// 产品名称输入建议
const handleSummaryProductNameInput = (queryString, callback) => {
  const results = queryString
    ? productNameSuggestions.value.filter(item =>
        item.value.toLowerCase().includes(queryString.toLowerCase())
      )
    : productNameSuggestions.value
  callback(results)
}

// 多选汇总处理
const handleSelectedSummary = () => {
  if (selectedBudgets.value.length === 0) {
    ElMessage.warning('请先选择要汇总的数据')
    return
  }

  // 计算多选数据的统计
  const stats = selectedBudgets.value.reduce((acc, item) => {
    acc.totalSellingPrice += item.sellingPrice || 0
    acc.totalGrossMargin += item.grossMargin || 0
    return acc
  }, {
    totalSellingPrice: 0,
    totalGrossMargin: 0
  })

  // 计算平均实际佣金
  const totalActualCommission = selectedBudgets.value.reduce((sum, item) => {
    return sum + (item.actualCommission || 0)
  }, 0)
  const averageActualCommission = selectedBudgets.value.length > 0
    ? totalActualCommission / selectedBudgets.value.length
    : 0

  selectedSummaryStats.value = {
    ...stats,
    totalActualCommission: averageActualCommission,
    recordCount: selectedBudgets.value.length
  }

  showSelectedSummaryDialog.value = true
}

// 导出多选汇总数据
const exportSelectedSummaryData = () => {
  if (selectedBudgets.value.length === 0) {
    ElMessage.warning('暂无选中数据可导出')
    return
  }

  try {
    // 构建导出数据
    const exportData = [
      // 汇总统计行
      {
        '产品名称': '多选汇总统计',
        '店铺名称': '汇总',
        '平台': '全部',
        '售价': selectedSummaryStats.value.totalSellingPrice,
        '成本单价': '-',
        '运费': '-',
        '平台费用': '-',
        '手续费': '-',
        '毛利': selectedSummaryStats.value.totalGrossMargin,
        '实际佣金(%)': selectedSummaryStats.value.totalActualCommission.toFixed(2),
        '记录数量': selectedSummaryStats.value.recordCount,
        '创建时间': new Date().toLocaleString()
      },
      // 空行分隔
      {
        '产品名称': '',
        '店铺名称': '',
        '平台': '',
        '售价': '',
        '成本单价': '',
        '运费': '',
        '平台费用': '',
        '手续费': '',
        '毛利': '',
        '实际佣金(%)': '',
        '记录数量': '',
        '创建时间': ''
      },
      // 详细数据
      ...selectedBudgets.value.map(item => ({
        '产品名称': item.productName || '',
        '店铺名称': item.shopName || '',
        '平台': item.platform || '',
        '售价': item.sellingPrice || 0,
        '成本单价': item.unitCost || 0,
        '运费': item.shippingCost || 0,
        '平台费用': item.platformFee || 0,
        '手续费': item.handlingFee || 0,
        '毛利': item.grossMargin || 0,
        '实际佣金(%)': (item.actualCommission || 0).toFixed(2),
        '记录数量': 1,
        '创建时间': formatUtcToLocalDateTime(item.createdAt)
      }))
    ]

    // 使用 Excel 格式导出汇总数据
    const headers = Object.keys(exportData[0])
    const filename = `多选财务汇总数据_${new Date().toLocaleDateString().replace(/\//g, '-')}`

    try {
      // 尝试导出为 Excel 格式
      exportFinancialToExcel(exportData, headers, filename, '多选财务汇总')
      ElMessage.success('多选汇总数据导出成功（Excel格式）')
    } catch (excelError) {
      // 如果 Excel 导出失败，降级到 CSV
      console.warn('Excel导出失败，使用CSV格式：', excelError.message)
      exportFinancialToCSV(exportData, headers, filename)
      ElMessage.success('多选汇总数据导出成功（CSV格式）')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 导出汇总数据
const exportSummaryData = () => {
  if (summaryAllData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  try {
    // 构建导出数据
    const exportData = [
      // 汇总统计行
      {
        '产品名称': `${summaryForm.productName} - 汇总统计`,
        '店铺名称': '汇总',
        '平台': '全部',
        '售价': summaryStats.value.totalSellingPrice,
        '毛利': summaryStats.value.totalGrossMargin,
        '实际佣金(%)': summaryStats.value.totalActualCommission.toFixed(2),
        '记录数量': summaryStats.value.recordCount,
        '创建时间': new Date().toLocaleString()
      },
      // 空行分隔
      {
        '产品名称': '',
        '店铺名称': '',
        '平台': '',
        '售价': '',
        '毛利': '',
        '实际佣金(%)': '',
        '记录数量': '',
        '创建时间': ''
      },
      // 详细数据
      ...summaryAllData.value.map((item, index) => ({
        '产品名称': item.productName || '',
        '店铺名称': item.shopName || '',
        '平台': item.platform || '',
        '售价': item.sellingPrice || 0,
        '成本单价': item.unitCost || 0,
        '运费': item.shippingCost || 0,
        '平台费用': item.platformFee || 0,
        '手续费': item.handlingFee || 0,
        '毛利': item.grossMargin || 0,
        '实际佣金(%)': (item.actualCommission || 0).toFixed(2),
        '创建时间': formatUtcToLocalDateTime(item.createdAt)
      }))
    ]

    // 使用 Excel 格式导出汇总数据
    const headers = Object.keys(exportData[0])
    const filename = `${summaryForm.productName}_财务测算汇总_${new Date().toLocaleDateString().replace(/\//g, '-')}`

    try {
      // 尝试导出为 Excel 格式
      exportFinancialToExcel(exportData, headers, filename, `${summaryForm.productName}财务汇总`)
      ElMessage.success('汇总数据导出成功（Excel格式）')
    } catch (excelError) {
      // 如果 Excel 导出失败，降级到 CSV
      console.warn('Excel导出失败，使用CSV格式：', excelError.message)

      const csvContent = exportFinancialToCSV(exportData, headers)

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

      ElMessage.success('汇总数据导出成功（CSV格式）')
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 方法
const updateCalculation = () => {
  // 将字符串转换为数字进行计算
  const calculationData = {
    sellingPrice: parseFloat(budgetForm.sellingPrice) || 0,
    unitCost: parseFloat(budgetForm.unitCost) || 0,
    shippingCost: parseFloat(budgetForm.shippingCost) || 0,
    platformFee: parseFloat(budgetForm.platformFee) || 0,
    handlingFee: parseFloat(budgetForm.handlingFee) || 0
  }
  calculationResult.value = budgetStore.calculateBudget(calculationData)
}

// 监听表单变化，实时计算
watch(
  () => [
    budgetForm.sellingPrice,
    budgetForm.unitCost,
    budgetForm.shippingCost,
    budgetForm.platformFee
  ],
  () => {
    updateCalculation()
  },
  { immediate: true }
)

// 日期范围处理函数
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
  fetchBudgets()
}

const handleReset = () => {
  Object.assign(searchForm, {
    productName: '',
    shopName: '',
    platform: '',
    minGrossMargin: null,
    maxGrossMargin: null,
    startDate: '',
    endDate: ''
  })
  dateRange.value = []
  currentPage.value = 1
  fetchBudgets()
}

const handleRefresh = () => {
  fetchBudgets()
}

const fetchBudgets = () => {
  const params = {
    page: currentPage.value,
    limit: pageSize.value,
    ...searchForm
  }
  budgetStore.fetchBudgets(params)
}

const handleSelectionChange = (selection) => {
  selectedBudgets.value = selection
}

// 新增预算
const handleAdd = () => {
  resetForm()
  showAddDialog.value = true
}

const handleEdit = (budget) => {
  editingBudget.value = budget
  Object.assign(budgetForm, {
    productName: budget.productName,
    shopName: budget.shopName || '',
    platform: budget.platform || '',
    sellingPrice: String(budget.sellingPrice || 0),
    unitCost: String(budget.unitCost || 0),
    shippingCost: String(budget.shippingCost || 0),
    platformFee: String(budget.platformFee || 0),
    handlingFee: String(budget.handlingFee || 0),
    description: budget.description || ''
  })
  showAddDialog.value = true
}

const handleDelete = async (budget) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除产品预算 "${budget.productName}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await budgetStore.deleteBudget(budget._id)
    if (result.success) {
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消删除
  }
}

const handleBatchDelete = async () => {
  if (selectedBudgets.value.length === 0) {
    ElMessage.warning('请选择要删除的预算记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedBudgets.value.length} 条预算记录吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedBudgets.value.map(budget => budget._id)
    const result = await budgetStore.batchDeleteBudgets(ids)
    if (result.success) {
      ElMessage.success(result.message)
      selectedBudgets.value = []
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消删除
  }
}

const handleSubmit = async () => {
  if (!budgetFormRef.value) return

  try {
    await budgetFormRef.value.validate()
    submitting.value = true

    // 转换字符串为数字类型再提交
    const submitData = {
      ...budgetForm,
      sellingPrice: parseFloat(budgetForm.sellingPrice) || 0,
      unitCost: parseFloat(budgetForm.unitCost) || 0,
      shippingCost: parseFloat(budgetForm.shippingCost) || 0,
      platformFee: parseFloat(budgetForm.platformFee) || 0,
      handlingFee: parseFloat(budgetForm.handlingFee) || 0
    }

    let result
    if (editingBudget.value) {
      result = await budgetStore.updateBudget(editingBudget.value._id, submitData)
    } else {
      result = await budgetStore.addBudget(submitData)
    }

    if (result.success) {
      ElMessage.success(result.message)
      showAddDialog.value = false
      resetForm()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  editingBudget.value = null
  Object.assign(budgetForm, {
    productName: '',
    shopName: '',
    platform: '',
    sellingPrice: '',
    unitCost: '',
    shippingCost: '',
    platformFee: '',
    handlingFee: '',
    description: ''
  })
  calculationResult.value = null
  if (budgetFormRef.value) {
    budgetFormRef.value.resetFields()
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchBudgets()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchBudgets()
}

// 导出数据
const handleExport = async () => {
  try {
    // 优先导出勾选的数据，如果没有勾选则导出所有数据
    const exportData = selectedBudgets.value.length > 0 ? selectedBudgets.value : budgetStore.budgets

    if (exportData.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    const data = exportData.map(item => ({
      '产品名称': item.productName || '',
      '店铺名称': item.shopName  || '',
      '平台': item.platform || '',
      '售价': item.sellingPrice || 0,
      '成本单价': item.unitCost || 0,
      '产品运费': item.shippingCost || 0,
      '平台费用': item.platformFee || 0,
      '手续费': item.handlingFee || 0,
      '毛利': item.grossMargin || 0,
      '实际佣金(%)': item.actualCommission || 0,
      '备注': item.description || '',
      '创建者': item.createdBy?.username || '',
      '创建时间': item.createdAt ? formatUtcToLocalDateTime(item.createdAt) : '',
      '更新者': item.updatedBy?.username || '',
      '更新时间': item.updatedAt ? formatUtcToLocalDateTime(item.updatedAt) : ''
    }))

    // 使用 Excel 格式导出
    const headers = Object.keys(data[0])
    const exportType = selectedBudgets.value.length > 0 ? `勾选${selectedBudgets.value.length}条` : '全部'
    const filename = `财务测算数据_${exportType}_${new Date().toLocaleDateString().replace(/\//g, '-')}`

    try {
      // 尝试导出为 Excel 格式
      exportFinancialToExcel(data, headers, filename, '财务测算数据')
      const exportTypeMsg = selectedBudgets.value.length > 0 ? `勾选的${selectedBudgets.value.length}条数据` : '全部数据'
      ElMessage.success(`导出${exportTypeMsg}成功（Excel格式）`)
    } catch (excelError) {
      // 如果 Excel 导出失败，降级到 CSV
      console.warn('Excel导出失败，使用CSV格式：', excelError.message)

      const csvContent = exportFinancialToCSV(data, headers)

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

      const exportTypeMsg = selectedBudgets.value.length > 0 ? `勾选的${selectedBudgets.value.length}条数据` : '全部数据'
      ElMessage.success(`导出${exportTypeMsg}成功（CSV格式）`)
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 生命周期
onMounted(() => {
  fetchBudgets()
  fetchSuggestions()
})
</script>

<style scoped>
.financial-projection {
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

.search-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 16px;
  margin-bottom: 16px;
}

.search-left {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.search-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.business-btn {
  background: #f7f8fa;
  border-color: #d9d9d9;
  color: #666;
}

.business-btn:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
}

.action-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.action-left {
  display: flex;
  gap: 12px;
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

.stats-cards {
  margin-bottom: 20px;
}

/* 统计卡片样式 */
.stats-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 8px;
}

.stats-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
}

.stats-icon.profit {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.stats-icon.commission {
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
  color: white;
}

.stats-icon.success {
  background: linear-gradient(135deg, #409eff 0%, #66b3ff 100%);
  color: white;
}

.stats-icon.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #ff8a8a 100%);
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

.stats-value.profit {
  color: #67c23a;
}

.stats-value.loss {
  color: #f56c6c;
}

.stats-value.consumption {
  color: #e6a23c;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.price {
  font-weight: 600;
}

.price.profit {
  color: #67c23a;
}

.price.loss {
  color: #f56c6c;
}

.commission {
  font-weight: 600;
}

.commission.profit {
  color: #67c23a;
}

.commission.loss {
  color: #f56c6c;
}

.pagination-wrapper {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}

.calculation-preview {
  margin: 20px 0;
  background: #f8f9fa;
}

.calc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.calc-label {
  font-weight: 500;
  color: #606266;
}

.calc-value {
  font-weight: 600;
  font-size: 16px;
}

.calc-value.profit {
  color: #67c23a;
}

.calc-value.loss {
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 移动端适配 (< 768px) */
@media (max-width: 767px) {
  /* 容器 */
  .financial-projection.mobile-view {
    padding: 0;
  }

  /* 页面标题 */
  .page-header {
    padding: 12px;
    margin-bottom: 12px;
  }

  .page-title h2 {
    font-size: 18px;
  }

  .page-description {
    font-size: 13px;
  }

  /* 搜索栏 */
  .search-card.mobile-search {
    margin-bottom: 12px;
    border-radius: 0;
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
    width: 100%;
    margin-right: 0 !important;
  }

  .search-item :deep(.el-form-item__content) {
    width: 100%;
  }

  .search-item :deep(.el-input),
  .search-item :deep(.el-autocomplete),
  .search-item :deep(.el-date-editor),
  .search-item :deep(.el-input-number) {
    width: 100% !important;
  }

  .profit-range {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .profit-range .range-input {
    flex: 1;
  }

  .profit-range .range-separator {
    line-height: 32px;
  }

  .search-actions.mobile-actions {
    width: 100%;
    display: flex;
    gap: 8px;
  }

  .search-actions.mobile-actions .business-btn {
    flex: 1;
    height: 44px;
    font-size: 14px;
  }

  /* 操作栏 */
  .action-card {
    padding: 12px;
    margin-bottom: 12px;
    flex-direction: column;
    gap: 12px;
  }

  .action-left {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-start;
  }

  .action-left .el-button {
    flex: 1;
    min-width: calc(50% - 4px);
    height: 44px;
    font-size: 13px;
  }

  /* 表格 */
  .table-card {
    padding: 8px;
    border-radius: 0;
    overflow-x: auto;
  }

  .table-card :deep(.el-table) {
    font-size: 13px;
  }

  .table-card :deep(.el-table th) {
    font-size: 13px;
    padding: 8px 0;
  }

  .table-card :deep(.el-table td) {
    padding: 8px 0;
  }

  .table-card :deep(.el-button.is-circle) {
    width: 28px;
    height: 28px;
    padding: 6px;
  }

  /* 分页 */
  .pagination-wrapper {
    padding: 12px 0;
    overflow-x: auto;
  }

  .mobile-pagination {
    justify-content: center !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
  }

  .mobile-pagination :deep(.el-pagination__total) {
    order: 1;
    flex: 0 0 100%;
    text-align: center;
    margin: 0 0 8px 0 !important;
    font-size: 13px;
  }

  .mobile-pagination :deep(.el-pagination__sizes) {
    order: 2;
    margin: 0 !important;
  }

  .mobile-pagination :deep(.btn-prev),
  .mobile-pagination :deep(.btn-next),
  .mobile-pagination :deep(.el-pager li) {
    min-width: 32px !important;
    height: 32px !important;
    line-height: 32px !important;
    font-size: 13px !important;
  }

  /* 对话框 */
  :deep(.el-dialog.is-fullscreen) {
    .el-dialog__header {
      padding: 12px;
    }

    .el-dialog__body {
      padding: 12px;
    }

    .el-dialog__footer {
      padding: 12px;
    }
  }

  .dialog-footer.mobile-footer {
    display: flex;
    gap: 12px;
  }

  .dialog-footer.mobile-footer .mobile-btn {
    flex: 1;
    height: 44px;
    font-size: 15px;
  }

  /* 表单响应式 */
  :deep(.el-form-item__label) {
    font-size: 14px;
  }

  :deep(.el-row) {
    margin: 0 !important;
  }

  :deep(.el-col) {
    padding: 0 !important;
  }

  /* 计算预览卡片 */
  .calculation-preview {
    margin-top: 12px;
  }

  .calculation-preview :deep(.el-card__header) {
    padding: 10px;
    font-size: 14px;
  }

  .calculation-preview :deep(.el-card__body) {
    padding: 10px;
  }

  .calc-item {
    margin-bottom: 8px;
  }

  .calc-label {
    font-size: 13px;
  }

  .calc-value {
    font-size: 16px;
  }
}

/* Excel导入样式 */
.import-container {
  .upload-section {
    .upload-tips {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;

      h4 {
        margin: 0 0 10px 0;
        color: #303133;
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          margin-bottom: 5px;
          color: #606266;
        }
      }

      .template-download {
        margin-top: 15px;
        text-align: center;
      }
    }

    .upload-demo {
      margin-top: 20px;
    }
  }

  .preview-section {
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      h4 {
        margin: 0;
        color: #303133;
      }
    }

    .preview-table {
      .negative-value {
        color: #f56c6c;
        font-weight: 500;
      }
    }

    .preview-more {
      margin-top: 15px;
    }
  }
}

.action-btn.info {
  background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
  border: none;
  color: white;
}

.action-btn.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
  border: none;
  color: white;
}

/* 产品汇总样式 */
.summary-container {
  .summary-search {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 6px;
  }

  .summary-stats {
    margin-bottom: 20px;

    .stats-value.profit {
      color: #67c23a;
    }

    .stats-value.loss {
      color: #f56c6c;
    }
  }

  .summary-table {
    .table-header {
      margin-bottom: 15px;

      h4 {
        margin: 0;
        color: #303133;
        font-size: 16px;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 0;
  }

  .summary-pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}

/* 移动端 - 导入和汇总对话框 */
@media (max-width: 767px) {
  .import-container {
    .upload-tips {
      padding: 12px;
      font-size: 13px;

      h4 {
        font-size: 14px;
      }

      ul li {
        font-size: 12px;
      }
    }

    .preview-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;

      h4 {
        font-size: 14px;
      }
    }

    .preview-table {
      font-size: 12px;
    }
  }

  .summary-container {
    .summary-search {
      padding: 12px;

      .el-form {
        flex-direction: column;

        .el-form-item {
          margin-bottom: 12px;
          margin-right: 0;
          width: 100%;
        }

        .el-form-item :deep(.el-input),
        .el-form-item :deep(.el-autocomplete) {
          width: 100% !important;
        }
      }
    }

    .summary-stats {
      margin-bottom: 12px;

      :deep(.el-row) {
        margin: 0 !important;
      }

      :deep(.el-col) {
        padding: 0 !important;
        margin-bottom: 12px;
      }
    }

    .summary-table {
      .table-header h4 {
        font-size: 14px;
      }
    }

    .summary-pagination {
      margin-top: 12px;
    }
  }

  .selected-summary-container {
    .summary-stats {
      :deep(.el-row) {
        margin: 0 !important;
      }

      :deep(.el-col) {
        padding: 0 !important;
        margin-bottom: 12px;
      }
    }

    .selected-details {
      .table-header h4 {
        font-size: 14px;
      }
    }
  }
}

/* 多选汇总弹框样式 */
.selected-summary-container {
  .summary-stats {
    margin-bottom: 20px;
  }

  .selected-details {
    .table-header {
      margin-bottom: 16px;

      h4 {
        margin: 0;
        color: #374151;
        font-size: 16px;
        font-weight: 600;
      }
    }
  }
}
</style>

