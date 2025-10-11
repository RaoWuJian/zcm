<template>
  <div class="income-expense-list" :class="{ 'mobile-view': isMobileDevice }">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><List /></el-icon>
        <h2>收支列表</h2>
      </div>
      <div class="page-description">
        管理团队的收入支出记录
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-card business-style" :class="{ 'mobile-search': isMobileDevice }">
      <el-form :model="searchForm" :inline="!isMobileDevice" class="business-search-form">
        <div class="search-fields" :class="{ 'mobile-fields': isMobileDevice }">
          <el-form-item label="记录名称" class="search-item">
            <el-input
              v-model="searchForm.recordName"
              placeholder="请输入记录名称"
              clearable
              class="business-input"
            />
          </el-form-item>
          <el-form-item label="收支类型" class="search-item">
            <el-select 
              v-model="searchForm.type" 
              placeholder="全部类型" 
              clearable
              class="business-select"
            >
              <el-option label="收入" value="income" />
              <el-option label="支出" value="expense" />
            </el-select>
          </el-form-item>
          <el-form-item label="公司账户" class="search-item">
            <el-select 
              v-model="searchForm.account" 
              placeholder="全部公司账户" 
              clearable
              class="business-select"
              filterable
            >
              <el-option 
                v-for="account in teamAccounts" 
                :key="account._id" 
                :label="account.name" 
                :value="account._id"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ account.name }}</span>
                  <span style="color: #999; font-size: 12px;">{{ (account).accountNumber || '' }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="团队账户" class="search-item">
            <el-select
              v-model="searchForm.companyAccountId"
              placeholder="全部团队账户"
              clearable
              class="business-select"
            >
              <el-option
                v-for="account in teamAccounts"
                :key="account._id"
                :label="account.name"
                :value="account._id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="记录大类" class="search-item">
            <el-select
              v-model="searchForm.categoryId"
              placeholder="全部大类"
              clearable
              class="business-select"
              @change="handleSearchCategoryChange"
            >
              <el-option
                v-for="category in recordTypes"
                :key="category._id"
                :label="category.name"
                :value="category._id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="记录小类" class="search-item">
            <el-select
              v-model="searchForm.subCategoryId"
              placeholder="全部小类"
              clearable
              class="business-select"
              :disabled="!searchForm.categoryId"
            >
              <el-option
                v-for="subCategory in searchSubCategories"
                :key="subCategory._id"
                :label="subCategory.name"
                :value="subCategory._id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="审批状态" class="search-item">
            <el-select
              v-model="searchForm.approvalStatus"
              placeholder="全部状态"
              clearable
              class="business-select"
            >
              <el-option label="待审批" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词" class="search-item">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索说明"
              clearable
              class="business-input"
            />
          </el-form-item>
          <el-form-item label="操作人" class="search-item">
            <el-select
              v-model="searchForm.operatorId"
              placeholder="选择操作人"
              clearable
              filterable
              remote
              :remote-method="searchOperators"
              :loading="operatorLoading"
              class="business-select"
            >
              <el-option
                v-for="user in operatorOptions"
                :key="user._id"
                :label="user.username"
                :value="user._id"
              >
                <span style="float: left">{{ user.username }}</span>
              </el-option>
            </el-select>
          </el-form-item>
           <el-form-item label="时间筛选" class="search-item">
            <el-date-picker
              v-model="searchForm.dateRange"
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

        <div class="search-actions" :class="{ 'mobile-actions': isMobileDevice }">
          <el-button type="primary" @click="handleSearch" :icon="Search" class="business-btn">查询</el-button>
          <el-button @click="handleReset" class="business-btn">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="handleAdd" :icon="Plus" class="action-btn primary" v-if="hasAnyPermission(['finance:create','finance:manage'])">
          新增收支记录
        </el-button>
        <el-button
          type="primary"
          @click="handleSelectedSummary"
          :disabled="selectedRows.length === 0"
          :icon="TrendCharts"
          class="action-btn primary"
          plain
        >
          多选汇总 ({{ selectedRows.length }})
        </el-button>
        <el-button
          type="success"
          @click="handleBatchApprove('approved')"
          :disabled="!canBatchApprove"
          :icon="Check"
          class="action-btn success"
          v-if="hasAnyPermission(['finance:approve','finance:manage'])"
        >
          批量通过
          <span v-if="pendingSelectedRows.length">({{ pendingSelectedRows.length }})</span>
        </el-button>
        <el-button
          type="warning"
          @click="handleBatchApprove('rejected')"
          :disabled="!canBatchApprove"
          :icon="Close"
          class="action-btn warning"
          v-if="hasAnyPermission(['finance:approve','finance:manage'])"
        >
          批量拒绝
          <span v-if="pendingSelectedRows.length">({{ pendingSelectedRows.length }})</span>
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="!selectedRows.length"
          :icon="Delete"
          class="action-btn danger"
          v-if="hasAnyPermission(['finance:delete','finance:manage'])"
        >
          批量删除
          <span v-if="selectedRows.length">({{ selectedRows.length }})</span>
        </el-button>
        <el-button @click="handleExport" :icon="Download" class="action-btn" v-if="!isMobileDevice">
          导出数据
          <span v-if="selectedRows.length">({{ selectedRows.length }}条)</span>
        </el-button>
      </div>
      <div class="action-right" v-if="!isMobileDevice">
        <span class="total-count">共 {{ pagination.total || 0 }} 条数据</span>
        <el-tooltip content="刷新数据" placement="top">
          <el-button @click="initData" :icon="Refresh" circle />
        </el-tooltip>
        <el-tooltip content="列设置" placement="top">
          <el-button :icon="Setting" circle />
        </el-tooltip>
      </div>
    </div>

    <!-- 表格卡片 -->
    <div class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        max-height="600"
        border
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="公司账户" width="120">
          <template #default="{ row }">
            <span class="account-text">{{ row.teamAccountName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="团队账户" width="120">
          <template #default="{ row }">
            <span class="company-account-text">{{ row.companyAccountId?.name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="记录名称" min-width="140">
          <template #default="{ row }">
            <div class="record-name">
              <span class="name-text">{{ row.recordName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag 
              :type="row.type === 'income' ? 'success' : 
                     row.type === 'recharge' ? 'warning' : 'danger'" 
              size="small"
            >
              {{ row.type === 'income' ? '收入' : 
                 row.type === 'recharge' || (row.paymentName === '系统充值') ? '系统充值' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <div class="amount-wrapper">
              <span :class="['amount-text', row.type === 'income' ? 'income' : 'expense']">
                {{ row.type === 'income' ? '+' : '-' }}¥{{ row.amount.toLocaleString() }}
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="记录大类" width="100">
          <template #default="{ row }">
            <span class="category-text">{{ row.recordType?.categoryName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="记录小类" width="100">
          <template #default="{ row }">
            <span class="subcategory-text">{{ row.recordType?.subCategoryName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="150">
          <template #default="{ row }">
            <span class="time-text">{{ formatUtcToLocalDate(row.transactionTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="description-text">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="凭证" width="120" align="center">
          <template #default="{ row }">
            <div v-if="row.images && row.images.length > 0" class="image-numbers-container">
              <span
                v-for="(image, index) in row.images"
                :key="image._id || image.id || index"
                class="image-number-item"
                @click="previewSingleImage(row.images, index)"
                :title="`点击查看第${index + 1}张凭证`"
              >
                {{ index + 1 }}
              </span>
            </div>
            <span v-else class="no-image">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="100">
          <template #default="{ row }">
            <div class="operator-info">
              <el-icon class="operator-icon"><User /></el-icon>
              <span class="operator-name">{{ row.operatorName || row.operator || '未知' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.approvalStatus === 'approved' ? 'success' : 
                     row.approvalStatus === 'rejected' ? 'danger' : 'warning'"
              size="small"
            >
              {{ row.approvalStatus === 'pending' ? '待审批' : 
                 row.approvalStatus === 'approved' ? '已通过' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" type="info" @click="handleDetail(row)" link>
              详情
            </el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)" link  v-if="hasAnyPermission(['finance:update','finance:manage']) && ((row.approvalStatus === 'pending') || row.isSuperior)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" link v-if="hasAnyPermission(['finance:delete','finance:manage']) && ((row.approvalStatus === 'pending') || row.isSuperior)">
              删除
            </el-button>
            <template v-if="row.approvalStatus === 'pending' && row.isSuperior && hasAnyPermission(['finance:approve','finance:manage'])">
              <el-button size="small" type="success" @click="handleApprove(row, 'approved')" link>
                通过
              </el-button>
              <el-button size="small" type="warning" @click="handleApprove(row, 'rejected')" link>
                拒绝
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          :layout="isMobileDevice ? 'total, sizes, prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :small="isMobileDevice"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
          :class="{ 'mobile-pagination': isMobileDevice }"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="isMobileDevice ? '95%' : '800px'"
      :fullscreen="isMobileDevice"
      style="max-height: 80vh; overflow: auto;"
      append-to-body
      @close="handleDialogClose"
      class="record-dialog"
    >
      <ResponsiveForm :model="form" :rules="rules" ref="formRef">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="公司账户" prop="teamId" required>
              <el-select v-model="form.teamId" placeholder="请选择公司账户" filterable>
                <el-option 
                  v-for="account in teamAccounts" 
                  :key="account._id" 
                  :label="account.name" 
                  :value="account._id"
                >
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>{{ account.name }}</span>
                    <span style="color: #999; font-size: 12px;">{{ (account).accountNumber || '' }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="团队账户" prop="companyAccountId">
              <el-select v-model="form.companyAccountId" placeholder="请选择团队账户" filterable clearable>
                <el-option
                  v-for="account in teamAccounts"
                  :key="account._id"
                  :label="account.name"
                  :value="account._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="记录名称" prop="name" required>
              <el-input v-model="form.name" placeholder="请输入记录名称" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="收支类型" prop="type" required>
              <el-radio-group v-model="form.type">
                <el-radio label="income">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <el-icon style="color: #00b42a;"><TrendCharts /></el-icon>
                    <span>收入</span>
                  </div>
                </el-radio>
                <el-radio label="expense">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <el-icon style="color: #f53f3f;"><Minus /></el-icon>
                    <span>支出</span>
                  </div>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
           <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="金额" prop="amount" required>
              <el-input-number
                v-model="form.amount"
                :min="0"
                :precision="2"
                placeholder="请输入金额"
                style="width: 100%;"
              >
                <template #prefix>¥</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="收支时间" prop="occurredAt" required>
              <el-date-picker
                v-model="form.occurredAt"
                type="date"
                placeholder="选择收支日期"
                value-format="YYYY-MM-DD"
                format="YYYY-MM-DD"
                style="width: 100%;"
                class="dialog-date-picker"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
         <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="记录大类" prop="categoryId" required>
              <el-select
                v-model="form.categoryId"
                placeholder="请选择记录大类"
                filterable
                clearable
                @change="handleCategoryChange"
                style="width: 100%"
              >
                <el-option
                  v-for="category in recordTypes"
                  :key="category._id"
                  :label="category.name"
                  :value="category._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item label="记录小类" prop="subCategoryId" :required="isSubCategoryRequired">
              <el-select
                v-model="form.subCategoryId"
                placeholder="请选择记录小类"
                filterable
                clearable
                :disabled="!form.categoryId"
                style="width: 100%"
              >
                <el-option
                  v-for="subCategory in subCategories"
                  :key="subCategory._id"
                  :label="subCategory.name"
                  :value="subCategory._id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item :label="form.type === 'income' ? '收款方名称' : '付款方名称'" prop="paymentName">
              <el-input v-model="form.paymentName" :placeholder="form.type === 'income' ? '请输入收款方名称' : '请输入付款方名称'" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item :label="form.type === 'income' ? '收款账号' : '付款账号'" prop="account">
              <el-input v-model="form.account" :placeholder="form.type === 'income' ? '请输入收款账号' : '请输入付款账号'" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24">
            <el-form-item label="说明/备注" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="请输入说明或备注信息"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 图片上传区域 -->
        <el-row>
          <el-col :span="24">
            <el-form-item label="上传凭证" prop="images" required>
              <div
                class="image-upload-container"
                @paste="handlePaste"
                tabindex="0"
                ref="uploadContainerRef"
              >
                <!-- 图片预览和上传区域 - 统一在一行显示 -->
                <div class="image-items-container">
                  <!-- 已选择的图片预览 -->
                  <div
                    v-for="(image, index) in form.images"
                    :key="image._id || image.id || index"
                    class="image-preview-item"
                  >
                    <el-image
                      :ref="el => setImageRef(el, index)"
                      :src="getImageUrlSync(image)"
                      :preview-src-list="getFormImageUrls()"
                      :initial-index="index"
                      fit="cover"
                      class="preview-image"
                      :preview-teleported="true"
                    />
                    <div class="image-overlay">
                      <div class="overlay-buttons">
                        <el-button
                          type="primary"
                          size="small"
                          :icon="ZoomIn"
                          circle
                          @click="previewImage(index)"
                          class="preview-btn"
                        />
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
                  </div>

                  <!-- 上传按钮 - 与图片在同一行 -->
                  <el-upload
                    v-if="!form.images || form.images.length < 9"
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
                  <el-icon><InfoFilled /></el-icon>
                  支持 JPG、PNG、GIF 格式，单个文件不超过 10MB，最多上传 8 张图片
                </el-text>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </ResponsiveForm>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
        </span>
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
            <el-col :span="8" :xs="24" :sm="12" :md="8" :lg="8">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon income">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value income">¥{{ selectedSummaryStats.totalIncome.toFixed(2) }}</div>
                    <div class="stats-label">总收入</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="8" :xs="24" :sm="12" :md="8" :lg="8">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon expense">
                    <el-icon><Minus /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value expense">¥{{ selectedSummaryStats.totalExpense.toFixed(2) }}</div>
                    <div class="stats-label">总支出</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="8" :xs="24" :sm="12" :md="8" :lg="8">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon" :class="selectedSummaryStats.netProfit >= 0 ? 'profit' : 'loss'">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value" :class="selectedSummaryStats.netProfit >= 0 ? 'profit' : 'loss'">
                      ¥{{ selectedSummaryStats.netProfit.toFixed(2) }}
                    </div>
                    <div class="stats-label">净利润</div>
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
            :data="selectedRows"
            border
            stripe
            height="400"
          >
            <el-table-column prop="recordName" label="记录名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
                  {{ row.type === 'income' ? '收入' : '支出' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">
                <span class="amount-text" :class="row.type">
                  ¥{{ row.amount?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="teamAccountName" label="团队账户" width="120" show-overflow-tooltip />
            <el-table-column prop="payerName" label="收款/付款方" width="120" show-overflow-tooltip />
            <el-table-column prop="transactionTime" label="发生时间" width="120">
              <template #default="{ row }">
                <span class="time-text">{{ formatUtcToLocalDate(row.transactionTime || row.occurredAt) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="approvalStatus" label="审批状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getApprovalStatusType(row.approvalStatus)" size="small">
                  {{ getApprovalStatusLabel(row.approvalStatus) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showSelectedSummaryDialog = false">关闭</el-button>
          <el-button
            type="primary"
            @click="exportSelectedSummaryData"
            :icon="Download"
            v-if="!isMobileDevice"
          >
            导出汇总数据
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 财务记录详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="财务记录详情"
      width="800px"
      append-to-body
      @close="handleDetailDialogClose"
      class="finance-detail-dialog"
    >
      <div v-if="selectedRecord" class="finance-detail-content">
        <!-- 基本信息 -->
        <el-card class="detail-card" style="margin-bottom: 20px;">
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="1" border class="detail-descriptions">
            <el-descriptions-item label="记录名称" label-class-name="detail-label" class-name="detail-content">
              <div class="field-content" :title="selectedRecord.recordName || selectedRecord.name">
                {{ selectedRecord.recordName || selectedRecord.name }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="收支类型" label-class-name="detail-label" class-name="detail-content">
              <el-tag
                :type="selectedRecord.type === 'income' ? 'success' : 'danger'"
                size="small"
              >
                {{ selectedRecord.type === 'income' ? '收入' : '支出' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="金额" label-class-name="detail-label" class-name="detail-content">
              <span :class="['amount-text', selectedRecord.type === 'income' ? 'income' : 'expense']">
                {{ selectedRecord.type === 'income' ? '+' : '-' }}¥{{ selectedRecord.amount?.toLocaleString() }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="收支时间" label-class-name="detail-label" class-name="detail-content">
              {{ formatUtcToLocalDate(selectedRecord.transactionTime || selectedRecord.occurredAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="公司账户" label-class-name="detail-label" class-name="detail-content">
              <div class="field-content" :title="selectedRecord.teamAccountName || selectedRecord.teamId?.name">
                {{ selectedRecord.teamAccountName || selectedRecord.teamId?.name }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="团队账户" label-class-name="detail-label" class-name="detail-content">
              <div class="field-content" :title="selectedRecord.companyAccountId?.name || '-'">
                {{ selectedRecord.companyAccountId?.name || '-' }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="记录大类" label-class-name="detail-label" class-name="detail-content">
              <div class="field-content" :title="selectedRecord.recordType?.categoryName || '-'">
                {{ selectedRecord.recordType?.categoryName || '-' }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="记录小类" label-class-name="detail-label" class-name="detail-content">
              <div class="field-content" :title="selectedRecord.recordType?.subCategoryName || '-'">
                {{ selectedRecord.recordType?.subCategoryName || '-' }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item :label="selectedRecord.type === 'income' ? '收款方名称' : '付款方名称'" label-class-name="detail-label" class-name="detail-content">
              <div class="field-content" :title="selectedRecord.payerName || selectedRecord.paymentName || '-'">
                {{ selectedRecord.payerName || selectedRecord.paymentName || '-' }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item :label="selectedRecord.type === 'income' ? '收款账号' : '付款账号'" label-class-name="detail-label" class-name="detail-content">
              <div class="field-content" :title="selectedRecord.payerAccount || selectedRecord.account || '-'">
                {{ selectedRecord.payerAccount || selectedRecord.account || '-' }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="说明/备注" label-class-name="detail-label" class-name="detail-content">
              <div class="description-content">
                <div v-if="selectedRecord.description" class="description-text field-content" :title="selectedRecord.description">
                  {{ selectedRecord.description }}
                </div>
                <div v-else class="no-description">
                  无备注信息
                </div>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 审批信息 -->
        <el-card class="detail-card" style="margin-bottom: 20px;">
          <template #header>
            <span>审批信息</span>
          </template>
          <el-descriptions :column="2" border class="detail-descriptions">
            <el-descriptions-item label="审批状态" label-class-name="detail-label" class-name="detail-content">
              <el-tag
                :type="selectedRecord.approvalStatus === 'approved' ? 'success' :
                       selectedRecord.approvalStatus === 'rejected' ? 'danger' : 'warning'"
                size="small"
              >
                {{ selectedRecord.approvalStatus === 'pending' ? '待审批' :
                   selectedRecord.approvalStatus === 'approved' ? '已通过' : '已拒绝' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审批人" label-class-name="detail-label" class-name="detail-content">
              <div class="field-content" :title="selectedRecord.approvedBy?.username || '未审批'">
                {{ selectedRecord.approvedBy?.username || '未审批' }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="审批时间" label-class-name="detail-label" class-name="detail-content">
              {{ selectedRecord.approvedAt ? formatUtcToLocalDate(selectedRecord.approvedAt) : '未审批' }}
            </el-descriptions-item>
            <el-descriptions-item label="审批意见" :span="2" label-class-name="detail-label" class-name="detail-content">
              <div class="approval-comment-display">
                <div v-if="selectedRecord.approvalComment" class="comment-content field-content" :title="selectedRecord.approvalComment">
                  {{ selectedRecord.approvalComment }}
                </div>
                <div v-else class="no-comment">
                  {{ selectedRecord.approvalStatus === 'pending' ? '待审批' : '无审批意见' }}
                </div>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 操作信息 -->
        <el-card class="detail-card" style="margin-bottom: 20px;">
          <template #header>
            <span>操作信息</span>
          </template>
          <el-descriptions :column="2" border class="detail-descriptions">
            <el-descriptions-item label="创建人" label-class-name="detail-label" class-name="detail-content">
              <div class="field-content" :title="selectedRecord.createdBy?.username || selectedRecord.operatorName || '未知'">
                {{ selectedRecord.createdBy?.username || selectedRecord.operatorName || '未知' }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间" label-class-name="detail-label" class-name="detail-content">
              {{ selectedRecord.createdAt ? formatUtcToLocalDate(selectedRecord.createdAt) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="更新人" label-class-name="detail-label" class-name="detail-content">
              <div class="field-content" :title="selectedRecord.updatedBy?.username || '-'">
                {{ selectedRecord.updatedBy?.username || '-' }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="更新时间" label-class-name="detail-label" class-name="detail-content">
              {{ selectedRecord.updatedAt ? formatUtcToLocalDate(selectedRecord.updatedAt) : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 凭证图片 -->
        <el-card v-if="selectedRecord.images && selectedRecord.images.length > 0" class="detail-card">
          <template #header>
            <span>凭证图片</span>
          </template>
          <div class="images-grid">
            <div
              v-for="(image, index) in selectedRecord.images"
              :key="image._id || image.id || index"
              class="image-item"
              @click="previewSingleImage(selectedRecord.images, index)"
            >
              <img
                :src="image.url"
                :alt="`凭证${index + 1}`"
                class="image-thumbnail"
              />
              <div class="image-overlay">
                <span>点击查看</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDetailDialogClose">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup >
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Refresh,
  Delete,
  Download,
  Setting,
  List,
  User,
  TrendCharts,
  Minus,
  Search,
  Check,
  Close,
  InfoFilled,
  Picture,
  ZoomIn,
  Edit
} from '@element-plus/icons-vue'
import { financeApi, teamAccountApi, fileApi, recordTypeApi, employeeApi } from '@/api/index';
import hasAnyPermission from '@/utils/checkPermissions'
import { formatUtcToLocalDate } from '@/utils/dateUtils'
import { useResponsive } from '@/utils/responsive'
import ResponsiveForm from '@/components/ResponsiveForm.vue'

// 响应式检测
const { isMobileDevice } = useResponsive()

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const showSelectedSummaryDialog = ref(false)
const detailDialogVisible = ref(false)
const selectedRecord = ref(null)

// 图片预览相关
const imagePreviewVisible = ref(false)
const previewImages = ref([])
const currentImageIndex = ref(0)
const dialogTitle = ref('新增收支记录')
const tableData = ref([])
const formRef = ref()
const selectedRows = ref([])
const submitLoading = ref(false)
const uploadRef = ref()

// 团队账户数据
const teamAccounts = ref([])

// 多选汇总相关数据
const selectedSummaryStats = ref({
  totalIncome: 0,
  totalExpense: 0,
  netProfit: 0,
  incomeCount: 0,
  expenseCount: 0,
  recordCount: 0
})

// 记录类型和小类数据
const recordTypes = ref([])
const subCategories = ref([])
const searchSubCategories = ref([]) // 搜索用的小类数据

// 加载记录类型
const loadRecordTypes = async () => {
  try {
    const response = await recordTypeApi.getRecordTypes()
    if (response.success) {
      recordTypes.value = response.data || []
    }
  } catch (error) {
    // 加载失败，使用空数组
  }
}

// 处理大类变化
const handleCategoryChange = async (categoryId, clearSubCategory = true) => {
  if (clearSubCategory) {
    form.subCategoryId = null
  }
  subCategories.value = []

  if (categoryId) {
    try {
      const response = await recordTypeApi.getSubCategories(categoryId)
      if (response.success) {
        subCategories.value = response.data || []
      }
    } catch (error) {
      // 加载失败，使用空数组
    }
  }

  // 触发小类字段的验证，因为验证规则依赖于当前的小类选项
  nextTick(() => {
    if (formRef.value) {
      formRef.value.validateField('subCategoryId')
    }
  })
}

// 处理搜索大类变化
const handleSearchCategoryChange = async (categoryId) => {
  searchForm.subCategoryId = ''
  searchSubCategories.value = []

  if (categoryId) {
    try {
      const response = await recordTypeApi.getSubCategories(categoryId)
      if (response.success) {
        searchSubCategories.value = response.data || []
      }
    } catch (error) {
      // 加载失败，使用空数组
    }
  }
}

// 搜索表单
// 搜索表单
const searchForm = reactive({
  recordName: '',
  type: '',
  category: '',
  account: '',
  approvalStatus: '',
  amountRange: '',
  dateRange: [],
  keyword: '',
  categoryId: '', // 记录大类
  subCategoryId: '', // 记录小类
  companyAccountId: '', // 公司账户
  operatorId: '' // 操作人ID
})

// 操作人搜索相关
const operatorOptions = ref([])
const operatorLoading = ref(false)

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
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

// 表单数据
const form = reactive({
  _id: null,
  teamId: null, // 团队账户ID
  name: '', // 记录名称
  type: 'income' | 'expense', // 类型：income/expense
  amount: 0, // 金额
  occurredAt: '', // 发生时间
  companyAccountId: null, // 公司账户ID（仅标签作用）
  paymentName: '', // 收款/付款方名称
  account: '', // 收款/付款账号
  description: '', // 说明/备注
  images: [], // 关联的图片
  categoryId: null,
  subCategoryId: null,
  recordType: {
    categoryId: null,
    categoryName: '',
    subCategoryId: null,
    subCategoryName: ''
  }
})

// 记录要删除的已保存图片ID
const deletedImageIds = ref([])

// 计算属性：小类是否必填
const isSubCategoryRequired = computed(() => {
  return form.categoryId && subCategories.value.length > 0
})

// 计算属性：待审批的选中行
const pendingSelectedRows = computed(() => {
  return selectedRows.value.filter(row =>
    row.approvalStatus === 'pending' && row.isSuperior
  )
})

// 计算属性：是否可以批量审批
const canBatchApprove = computed(() => {
  return pendingSelectedRows.value.length > 0 &&
         hasAnyPermission(['finance:approve', 'finance:manage'])
})

// 自定义验证函数：检查小类是否必填
const validateSubCategory = (rule, value, callback) => {
  // 如果没有选择大类，则小类不需要验证
  if (!form.categoryId) {
    callback()
    return
  }

  // 如果选择了大类但没有小类选项，则小类不需要验证
  if (subCategories.value.length === 0) {
    callback()
    return
  }

  // 如果有小类选项但没有选择小类，则验证失败
  if (!value) {
    callback(new Error('请选择记录小类'))
    return
  }

  callback()
}

// 自定义验证函数：检查图片是否必填
const validateImages = (rule, value, callback) => {
  // 检查是否有图片
  if (!value || !Array.isArray(value) || value.length === 0) {
    callback(new Error('请上传至少一张凭证图片'))
    return
  }

  callback()
}

// 表单验证规则
const rules = {
  teamId: [{ required: true, message: '请选择团队账户', trigger: 'change' }],
  name: [{ required: true, message: '请输入记录名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择收支类型', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ],
  occurredAt: [{ required: true, message: '请选择收支日期', trigger: 'change' }],
  categoryId: [{ required: true, message: '请选择记录大类', trigger: 'change' }],
  subCategoryId: [{ validator: validateSubCategory, trigger: 'change' }],
  images: [{ validator: validateImages, trigger: 'change' }],
}

// 初始化团队账户数据
const initTeamAccounts = async () => {
  try {
    const response = await teamAccountApi.getTeamAccounts({ isActive: true })
    if (response && response.data) {
      teamAccounts.value = response.data.data || response.data || []
    }
  } catch (error) {
    ElMessage.error('获取团队账户列表失败')
  }
}

// 初始化数据
const initData = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.currentPage,
      limit: pagination.pageSize
    }

    // 只添加有值的搜索条件
    if (searchForm.recordName) params.name = searchForm.recordName
    if (searchForm.type) params.type = searchForm.type
    if (searchForm.category) params.category = searchForm.category
    if (searchForm.account) params.teamId = searchForm.account
    if (searchForm.approvalStatus) params.approvalStatus = searchForm.approvalStatus
    if (searchForm.keyword) params.search = searchForm.keyword
    if (searchForm.companyAccountId) params.companyAccountId = searchForm.companyAccountId
    if (searchForm.categoryId) params.categoryId = searchForm.categoryId
    if (searchForm.subCategoryId) params.subCategoryId = searchForm.subCategoryId
    if (searchForm.operatorId) params.createdBy = searchForm.operatorId
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }

    const response = await financeApi.getRecords(params)
    
    if (response && response.data) {
      const data = response.data
      
      // 如果后端返回的是数组数据，检查是否有总记录数信息
      pagination.total = response.pagination?.totalRecords || 0
      if (Array.isArray(data)) {
        tableData.value = data
        // 从响应中获取总记录数，而不是当前页数据长度
       
      } else {
        // 如果后端返回的是对象包装的数据
        tableData.value = data.records || data.data || data.list || []
      }
      
      // 数据字段映射，确保前端显示正确
      tableData.value = tableData.value.map((item) => {
        // 调试日志：查看原始数据结构


        
        // 获取操作人信息
        let operatorName = '未知';
        if (item.createdBy) {
          // 如果有createdBy对象，优先使用username
          operatorName = item.createdBy.username || item.createdBy.name || item.createdBy;
        } else if (item.paymentName === '系统充值') {
          // 如果是系统充值但没有操作人，显示为系统
          operatorName = '系统';
        }
        
        // 如果operatorName还是对象类型，尝试提取字符串
        if (typeof operatorName === 'object' && operatorName !== null) {
          operatorName = (operatorName).username || (operatorName).name || '未知';
        }
        

        
        return {
          ...item,
          id: item._id || item.id,
          recordName: item.name,
          teamAccountName: item.teamId?.name || '未知账户',
          transactionTime: item.occurredAt,
          payerName: item.paymentName,
          payerAccount: item.account,
          operator: operatorName,
          operatorName: operatorName,
          approvalStatus: item.approvalStatus || 'pending'
        };
      })
      
    } else {
      ElMessage.error('获取数据失败')
    }
  } catch (error) {
    ElMessage.error('获取数据失败，请重试')
  } finally {
    loading.value = false
  }
}

// 查询
const handleSearch = async () => {
  pagination.currentPage = 1 // 重置到第一页
  await initData()
}

// 重置
const handleReset = () => {
  searchForm.recordName = ''
  searchForm.type = ''
  searchForm.category = ''
  searchForm.account = ''
  searchForm.approvalStatus = ''
  searchForm.amountRange = ''
  searchForm.dateRange = []
  searchForm.keyword = ''
  searchForm.categoryId = ''
  searchForm.subCategoryId = ''
  searchForm.companyAccountId = ''
  searchForm.operatorId = ''
  searchSubCategories.value = [] // 清空搜索小类数据
  operatorOptions.value = [] // 清空操作人选项
  handleSearch()
}

// 日期范围变化处理
const handleDateRangeChange = (dates) => {
  searchForm.dateRange = dates
  // 可以在这里添加自动搜索逻辑，或者让用户手动点击查询按钮
}

// 搜索操作人
const searchOperators = async (query) => {
  if (!query) {
    operatorOptions.value = []
    return
  }

  try {
    operatorLoading.value = true
    const response = await employeeApi.getReporters({
      search: query,
      limit: 20
    })

    if (response.success && response.data) {
      operatorOptions.value = response.data
    } else {
      operatorOptions.value = []
    }
  } catch (error) {
    operatorOptions.value = []
  } finally {
    operatorLoading.value = false
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量删除
const handleBatchDelete = async () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请选择要删除的记录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedRows.value.map(row => row.id || row._id)
    const response = await financeApi.batchDeleteRecords(ids)
    
    if (response) {
      selectedRows.value = []
      await initData() // 重新获取数据
      ElMessage.success('删除成功')
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请重试')
    } else {
      ElMessage.info('已取消删除')
    }
  }
}

// 导出数据
const handleExport = async () => {
  try {
    // 优先导出勾选的数据，如果没有勾选则导出所有数据
    const exportData = selectedRows.value.length > 0 ? selectedRows.value : tableData.value

    if (exportData.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    const data = exportData.map(item => ({
      '记录名称': item.recordName || '',
      '类型': item.type === 'income' ? '收入' : '支出',
      '分类': getCategoryLabel(item.category),
      '金额': `¥${item.amount?.toFixed(2) || '0.00'}`,
      '账户': item.account || '',
      '审批状态': getApprovalStatusLabel(item.approvalStatus),
      '备注': item.remark || '',
      '创建者': item.createdBy?.username || '',
      '创建时间': item.createdAt ? formatUtcToLocalDate(item.createdAt) : '',
      '更新者': item.updatedBy?.username || '',
      '更新时间': item.updatedAt ? formatUtcToLocalDate(item.updatedAt) : ''
    }))

    // 转换为CSV格式
    const csv = [Object.keys(data[0]).join(',')]
    data.forEach(row => {
      csv.push(Object.values(row).map(value => `"${value}"`).join(','))
    })

    // 添加BOM以支持Excel正确显示中文
    const bom = '\uFEFF'
    const blob = new Blob([bom + csv.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const exportType = selectedRows.value.length > 0 ? `勾选${selectedRows.value.length}条` : '全部'
    a.download = `收支记录数据_${exportType}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    const exportTypeMsg = selectedRows.value.length > 0 ? `勾选的${selectedRows.value.length}条数据` : '全部数据'
    ElMessage.success(`导出${exportTypeMsg}成功`)
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 获取分类标签
const getCategoryLabel = (category) => {
  const categoryMap = {
    salary: '工资',
    bonus: '奖金',
    office_supplies: '办公用品',
    travel: '差旅费',
    training: '培训费',
    other: '其他'
  }
  return categoryMap[category] || category
}

// 获取审批状态标签
const getApprovalStatusLabel = (status) => {
  const statusMap = {
    pending: '待审批',
    approved: '已审批',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}

// 获取审批状态类型
const getApprovalStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取账户标签 - 已导出使用
// const getAccountLabel = (account) => {
//   const accountMap: Record<string, string> = {
//     company: '公司账户',
//     cash: '现金',
//     other: '其他'
//   }
//   return accountMap[account] || account
// }

// 多选汇总处理
const handleSelectedSummary = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要汇总的数据')
    return
  }

  // 计算多选数据的统计
  const stats = selectedRows.value.reduce((acc, item) => {
    const amount = item.amount || 0
    if (item.type === 'income') {
      acc.totalIncome += amount
      acc.incomeCount += 1
    } else if (item.type === 'expense') {
      acc.totalExpense += amount
      acc.expenseCount += 1
    }
    return acc
  }, {
    totalIncome: 0,
    totalExpense: 0,
    incomeCount: 0,
    expenseCount: 0
  })

  selectedSummaryStats.value = {
    ...stats,
    netProfit: stats.totalIncome - stats.totalExpense,
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
    // 构建导出数据
    const exportData = [
      // 汇总统计行
      {
        '记录名称': '多选汇总统计',
        '类型': '汇总',
        '金额': `收入: ¥${selectedSummaryStats.value.totalIncome.toFixed(2)}, 支出: ¥${selectedSummaryStats.value.totalExpense.toFixed(2)}`,
        '净利润': `¥${selectedSummaryStats.value.netProfit.toFixed(2)}`,
        '收入笔数': selectedSummaryStats.value.incomeCount,
        '支出笔数': selectedSummaryStats.value.expenseCount,
        '总记录数': selectedSummaryStats.value.recordCount,
        '统计时间': new Date().toLocaleString()
      }
    ]

    // 导出为CSV格式
    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(','),
      ...exportData.map(row =>
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n')

    // 创建下载链接
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `多选收支汇总数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    ElMessage.success('多选汇总数据导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增收支记录'
  resetForm()
  dialogVisible.value = true

  // 对话框打开后，聚焦到上传容器以便使用粘贴功能
  nextTick(() => {
    if (uploadContainerRef.value) {
      uploadContainerRef.value.focus()
    }
  })
}

// 编辑
const handleEdit = async (row) => {
  dialogTitle.value = '编辑收支记录'

  Object.assign(form, row)
  
  // 确保图片数据正确处理 - 编辑时图片都是已保存的
  if (row.images && Array.isArray(row.images)) {
    form.images = row.images.map(img => {
      // 如果是populate的完整对象，直接使用
      if (typeof img === 'object' && img !== null && img._id) {
        return img
      }

      // 如果只是ID字符串，需要转换为对象格式
      if (typeof img === 'string') {
        return { _id: img }
      }

      return img
    })
  } else {
    form.images = []
  }
  form.teamId = row.teamId._id;
  form.companyAccountId = row.companyAccountId._id;
  // 处理记录类型数据
  if (row.recordType) {
    form.categoryId = row.recordType.categoryId || null
    form.subCategoryId = row.recordType.subCategoryId || null
    form.recordType = {
      categoryId: row.recordType.categoryId || null,
      categoryName: row.recordType.categoryName || '',
      subCategoryId: row.recordType.subCategoryId || null,
      subCategoryName: row.recordType.subCategoryName || ''
    }

    // 如果有大类，加载对应的小类，但不清空当前的小类选择
    if (form.categoryId) {
      await handleCategoryChange(form.categoryId, false)
    }
  }

  // 确保companyAccountId字段正确设置
  // form.companyAccountId = row.companyAccountId || null

  dialogVisible.value = true
}

// 查看详情
const handleDetail = async (row) => {
  try {
    loading.value = true
    const response = await financeApi.getRecord(row._id || row.id)

    if (response.success) {
      selectedRecord.value = response.data
      detailDialogVisible.value = true
    } else {
      ElMessage.error('获取记录详情失败')
    }
  } catch (error) {
    ElMessage.error('获取记录详情失败，请重试')
  } finally {
    loading.value = false
  }
}

// 关闭详情对话框
const handleDetailDialogClose = () => {
  detailDialogVisible.value = false
  selectedRecord.value = null
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条收支记录吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await financeApi.deleteRecord(row.id || row._id)
    
    if (response) {
      await initData() // 重新获取数据
      ElMessage.success('删除成功')
    } else {
      ElMessage.error('删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请重试')
    } else {
      ElMessage.info('已取消删除')
    }
  }
}

// 审批财务记录
const handleApprove = async (row, status) => {
  try {
    const actionText = status === 'approved' ? '通过' : '拒绝'
    
    const result = await ElMessageBox.prompt(
      `确认${actionText}此条财务记录？`,
      `${actionText}审批`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入审批意见（可选）',
        inputValidator: () => true // 允许空输入
      }
    )
    
    loading.value = true
    
    const response = await financeApi.approveRecord(row._id || row.id, {
      approvalStatus: status,
      approvalComment: result.value || ''
    })
    
    if (response.success) {
      ElMessage.success(`${actionText}成功`)

      // 直接更新本地数据，提供更好的用户体验
      const index = tableData.value.findIndex(item =>
        (item._id || item.id) === (row._id || row.id)
      )
      if (index !== -1) {
        tableData.value[index].approvalStatus = status
      }

      // 同时重新加载数据以确保数据一致性
      await initData()
    } else {
      ElMessage.error(response.message || `${actionText}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '审批失败')
    }
  } finally {
    loading.value = false
  }
}

// 批量审批财务记录
const handleBatchApprove = async (status) => {
  try {
    const actionText = status === 'approved' ? '通过' : '拒绝'
    const pendingRows = pendingSelectedRows.value

    if (pendingRows.length === 0) {
      ElMessage.warning('没有可审批的记录')
      return
    }

    const result = await ElMessageBox.prompt(
      `确认批量${actionText}选中的 ${pendingRows.length} 条财务记录？`,
      `批量${actionText}审批`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入审批意见（可选）',
        inputValidator: () => true // 允许空输入
      }
    )

    loading.value = true

    // 批量审批
    const approvalPromises = pendingRows.map(row =>
      financeApi.approveRecord(row._id || row.id, {
        approvalStatus: status,
        approvalComment: result.value || ''
      })
    )

    const results = await Promise.allSettled(approvalPromises)

    // 统计成功和失败的数量
    const successCount = results.filter(result =>
      result.status === 'fulfilled' && result.value.success
    ).length
    const failCount = results.length - successCount

    if (successCount > 0) {
      ElMessage.success(`批量${actionText}成功 ${successCount} 条记录${failCount > 0 ? `，失败 ${failCount} 条` : ''}`)

      // 更新本地数据
      pendingRows.forEach(row => {
        const index = tableData.value.findIndex(item =>
          (item._id || item.id) === (row._id || row.id)
        )
        if (index !== -1) {
          tableData.value[index].approvalStatus = status
        }
      })

      // 清空选中状态
      selectedRows.value = []

      // 重新加载数据以确保数据一致性
      await initData()
    } else {
      ElMessage.error(`批量${actionText}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '批量审批失败')
    }
  } finally {
    loading.value = false
  }
}

// 图片相关方法
// 获取图片URL
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
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  const url = `${baseUrl}/files/${imageId}`

  return url
}

// 图片加载错误处理
const handleImageError = (event) => {
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
}

// 预览行中的图片
const previewRowImages = (row) => {
  if (row.images && row.images.length > 0) {
    previewImages.value = [...row.images]
    currentImageIndex.value = 0
    imagePreviewVisible.value = true
  }
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

// 获取表单图片URL列表（用于el-image预览）
const getFormImageUrls = () => {
  if (!form.images || !Array.isArray(form.images)) {
    return []
  }
  return form.images.map(image => getImageUrlSync(image)).filter(url => url)
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
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }

  // 检查图片数量
  if (form.images.length >= 8) {
    ElMessage.error('最多只能上传 8 张图片!')
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
  const isLt10M = rawFile.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return
  }

  // 检查图片数量
  if (form.images.length >= 8) {
    ElMessage.error('最多只能上传 8 张图片!')
    return
  }

  // 添加到临时图片列表
  form.images.push(rawFile)
  ElMessage.success('图片添加成功')

  // 触发图片字段验证
  nextTick(() => {
    if (formRef.value) {
      formRef.value.validateField('images')
    }
  })
}

// 删除图片
const removeImage = async (index) => {
  try {
    const image = form.images[index]

    await ElMessageBox.confirm(
      '确定要删除这张图片吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 如果是临时文件（File对象），释放URL
    if (image instanceof File) {
      const url = getImageUrlSync(image)
      URL.revokeObjectURL(url)
    } else if (image._id || image.id) {
      // 如果是已保存的图片，记录到删除列表中，提交时再删除
      deletedImageIds.value.push(image._id || image.id)
    }

    form.images.splice(index, 1)
    ElMessage.success('图片删除成功')

    // 触发图片字段验证
    nextTick(() => {
      if (formRef.value) {
        formRef.value.validateField('images')
      }
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除图片失败')
    }
  }
}

// 处理粘贴事件
const uploadContainerRef = ref(null)

// 图片引用管理
const imageRefs = ref([])
const setImageRef = (el, index) => {
  if (el) {
    imageRefs.value[index] = el
  }
}

// 预览图片 - 使用现有的预览状态
const previewImage = (index) => {
  // 设置预览图片列表和当前索引
  previewImages.value = [...form.images]
  currentImageIndex.value = index
  imagePreviewVisible.value = true
}

const handlePaste = async (event) => {
  const items = event.clipboardData?.items
  if (!items) return

  // 检查图片数量限制
  if (form.images.length >= 8) {
    ElMessage.warning('最多只能上传 8 张图片!')
    return
  }

  let hasImage = false
  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    // 检查是否为图片
    if (item.type.indexOf('image') !== -1) {
      hasImage = true
      const file = item.getAsFile()

      if (file) {
        // 检查文件大小
        const isLt10M = file.size / 1024 / 1024 < 10
        if (!isLt10M) {
          ElMessage.error('图片大小不能超过 10MB!')
          continue
        }

        // 检查图片数量
        if (form.images.length >= 8) {
          ElMessage.warning('最多只能上传 8 张图片!')
          break
        }

        // 创建一个新的 File 对象，添加时间戳作为文件名
        const timestamp = new Date().getTime()
        const newFile = new File([file], `粘贴图片_${timestamp}.${file.type.split('/')[1]}`, {
          type: file.type
        })

        // 添加到图片列表
        form.images.push(newFile)
        ElMessage.success('图片粘贴成功')

        // 触发图片字段验证
        nextTick(() => {
          if (formRef.value) {
            formRef.value.validateField('images')
          }
        })
      }
    }
  }

  if (hasImage) {
    event.preventDefault()
  }
}

// 获取图片名称
const getImageName = (image) => {
  if (image instanceof File) {
    return image.name
  }
  if (image.originalName) {
    return image.originalName
  }
  if (image.filename) {
    return image.filename
  }
  return '未知文件'
}

// 获取图片大小（格式化显示）
const getImageSize = (image) => {
  let size = 0

  if (image instanceof File) {
    size = image.size
  } else if (image.size) {
    size = image.size
  }

  if (size === 0) return ''

  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`
  } else {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }
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

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid, fields) => {
    if (valid) {
      try {
        submitLoading.value = true

        if (!form.teamId) {
          ElMessage.error('请选择团队账户')
          return
        }

        // 处理图片上传
        const imageIds = []

        for (const image of form.images) {
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

        // 设置记录类型信息
        if (form.categoryId) {
          const category = recordTypes.value.find(c => c._id === form.categoryId)
          form.recordType.categoryId = form.categoryId
          form.recordType.categoryName = category?.name || ''
        }

        if (form.subCategoryId) {
          const subCategory = subCategories.value.find(s => s._id === form.subCategoryId)
          form.recordType.subCategoryId = form.subCategoryId
          form.recordType.subCategoryName = subCategory?.name || ''
        }

        const submitData = {
          teamId: form.teamId,
          name: form.name,
          type: form.type,
          amount: form.amount,
          occurredAt: form.occurredAt,
          companyAccountId: form.companyAccountId,
          paymentName: form.paymentName,
          account: form.account,
          description: form.description,
          images: imageIds,
          recordType: form.recordType
        }

        let response
        if (form._id) {
          // 编辑
          response = await financeApi.updateRecord(form._id, submitData)
        } else {
          // 新增
          response = await financeApi.createRecord(submitData)
        }

        if (response) {
          // 删除标记为删除的图片文件
          if (deletedImageIds.value.length > 0) {
            try {
              await fileApi.batchDeleteFiles(deletedImageIds.value)
            } catch (error) {
              // 即使删除文件失败，也不影响主流程
            }
          }

          ElMessage.success(form._id ? '更新成功' : '添加成功')
          dialogVisible.value = false
          resetForm()
          await initData() // 重新获取数据
        } else {
          ElMessage.error('操作失败')
        }
      } catch (error) {
        ElMessage.error('操作失败，请重试')
      } finally {
        submitLoading.value = false
      }
    } else {
      // 验证失败，显示详细错误信息
      const errorMessages = []
      const fieldLabels = {
        teamId: '公司账户',
        name: '记录名称',
        type: '收支类型',
        amount: '金额',
        occurredAt: '收支时间',
        categoryId: '记录大类',
        subCategoryId: '记录小类',
        images: '上传凭证'
      }

      if (fields) {
        Object.keys(fields).forEach(field => {
          const label = fieldLabels[field] || field
          errorMessages.push(label)
        })
      }

      if (errorMessages.length > 0) {
        ElMessage.error(`请填写以下必填项：${errorMessages.join('、')}`)
      } else {
        ElMessage.error('请检查表单填写是否完整')
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  // 释放临时图片的URL
  form.images.forEach(image => {
    if (image instanceof File) {
      const url = getImageUrlSync(image)
      URL.revokeObjectURL(url)
    }
  })

  form._id = null
  form.teamId = null
  form.name = ''
  form.type = 'income'
  form.amount = 0
  form.occurredAt = ''
  form.companyAccountId = null
  form.paymentName = ''
  form.account = ''
  form.description = ''
  form.images = []
  form.categoryId = null
  form.subCategoryId = null
  form.recordType = {
    categoryId: null,
    categoryName: '',
    subCategoryId: null,
    subCategoryName: ''
  }

  // 清空删除列表
  deletedImageIds.value = []

  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 关闭对话框
const handleDialogClose = () => {
  resetForm()
}

// 分页相关
const handleSizeChange = async (size) => {
  pagination.pageSize = size
  pagination.currentPage = 1 // 重置到第一页
  await initData()
}

const handleCurrentChange = async (page) => {
  pagination.currentPage = page
  await initData()
}

onMounted(() => {
  initTeamAccounts()
  initData()
  loadRecordTypes()
})
</script>

<style scoped>
.income-expense-list {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
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

@media screen and (max-width: 1200px) {
  .business-search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-fields {
    margin-bottom: 12px;
  }
  
  .search-actions {
    margin-left: 0 !important;
    margin-top: 0;
    text-align: right;
  }
  
  .business-input,
  .business-select {
    width: 140px;
  }
}

@media screen and (max-width: 768px) {
  .search-card.business-style {
    padding: 12px;
  }
  
  .search-fields {
    flex-direction: column;
    gap: 8px;
  }
  
  .search-item {
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .business-input,
  .business-select {
    width: 100%;
  }
  
  .search-actions {
    text-align: center;
    margin-top: 12px;
  }
}

/* 操作栏 */
.action-card {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
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

/* 按钮样式 */
.action-btn {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn.primary {
  background: linear-gradient(135deg, #409eff 0%, #66b3ff 100%);
  border: none;
  color: white;
}

.action-btn.success {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
  color: white;
}

.action-btn.danger {
  background: linear-gradient(135deg, #f56c6c 0%, #ff8a8a 100%);
  border: none;
  color: white;
}

.action-btn.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
  border: none;
  color: white;
}

.action-btn.info {
  background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
  border: none;
  color: white;
}

.action-btn.danger:disabled {
  background: #f5f7fa;
  color: #c0c4cc;
  box-shadow: none;
}

.action-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.total-count {
  color: #86909c;
  font-size: 14px;
}

/* 表格卡片 */
.table-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 2px 0 rgba(31, 35, 41, 0.08);
  border: 1px solid #e4e7ed;
}

.table-card .el-table {
  border-radius: 6px;
  overflow: hidden;
}

.table-card .el-table th {
  background-color: #fafbfc;
  color: #1f2329;
  font-weight: 600;
}

.time-text {
  color: #1f2329;
  font-size: 14px;
}

.category-text {
  color: #1f2329;
  background: #f2f3f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.amount-wrapper {
  display: flex;
  align-items: center;
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

.account-text {
  color: #1f2329;
  background: #e8f4ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #0e7a0d;
}

.description-text {
  color: #4e5969;
  font-size: 14px;
}

.operator-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.operator-icon {
  color: #86909c;
  font-size: 14px;
}

.operator-name {
  color: #1f2329;
  font-size: 14px;
}

/* 分页 */
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

.record-dialog {
  height: 600px;
  overflow: auto;
}

.record-dialog .el-form-item {
  margin-bottom: 22px;
}

.record-dialog .el-form-item__label {
  font-weight: 600;
  color: #1f2329;
  line-height: 32px;
}

.record-dialog .el-radio {
  margin-right: 24px;
}

.record-dialog .el-radio__label {
  font-weight: 500;
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

/* 表格新样式 */
.record-name {
  display: flex;
  align-items: center;
}

.name-text {
  color: #1f2329;
  font-weight: 500;
  font-size: 14px;
}

.payer-text {
  color: #1f2329;
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

/* 对话框脚注 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .income-expense-list {
    padding: 16px;
  }
  
  .search-card {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .search-form .el-row {
    margin-bottom: 10px;
  }
  
  .search-form .el-form-item__label {
    font-size: 12px;
    margin-bottom: 3px;
  }
  
  .search-actions {
    text-align: center;
    padding-top: 10px;
  }
  
  .search-btn,
  .reset-btn {
    width: 90px;
    margin: 0 6px;
    padding: 6px 16px;
    font-size: 12px;
  }
  
  .action-card {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 12px;
  }
  
  .action-left {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .action-right {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .search-card {
    padding: 10px;
  }
  
  .search-title {
    font-size: 13px;
    margin-bottom: 8px;
  }
  
  .search-form .el-form-item__label::before {
    width: 2px;
    height: 8px;
    margin-right: 4px;
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

.action-card:hover,
.table-card:hover {
  box-shadow: 0 4px 8px 0 rgba(31, 35, 41, 0.12);
}



/* 输入框聚焦动画 */
.search-input .el-input__wrapper,
.search-select .el-select__wrapper,
.search-date-picker .el-date-editor {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 图片上传相关样式 */
.image-upload-container {
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background: #fafafa;
  transition: all 0.3s ease;
  outline: none;
}

.image-upload-container:focus {
  border-color: #409eff;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
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

.image-preview-item:hover .preview-image {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  backdrop-filter: blur(2px);
}

.image-preview-item:hover .image-overlay {
  opacity: 1;
}

.overlay-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
}

.preview-btn {
  background: rgba(64, 158, 255, 0.9) !important;
  border: none !important;
  color: white !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3) !important;
  transition: all 0.3s ease !important;
}

.preview-btn:hover {
  background: rgba(64, 158, 255, 1) !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4) !important;
}

.delete-btn {
  background: rgba(245, 63, 63, 0.9) !important;
  border: none !important;
  color: white !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 8px rgba(245, 63, 63, 0.3) !important;
  transition: all 0.3s ease !important;
}

.delete-btn:hover {
  background: rgba(245, 63, 63, 1) !important;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 12px rgba(245, 63, 63, 0.4) !important;
}

.image-uploader {
  display: inline-block;
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
  font-size: 24px;
  color: #8c939d;
  margin-bottom: 4px;
}

.upload-trigger:hover .upload-icon {
  color: #409eff;
}

.upload-text {
  font-size: 12px;
  color: #8c939d;
}

.upload-trigger:hover .upload-text {
  color: #409eff;
}

.upload-tips {
  margin-top: 8px;
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

.no-image {
  color: #c0c4cc;
  font-size: 12px;
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

.stats-icon.income {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.stats-icon.expense {
  background: linear-gradient(135deg, #f56c6c 0%, #ff8a8a 100%);
  color: white;
}

.stats-icon.loss {
  background: linear-gradient(135deg, #f56c6c 0%, #ff8a8a 100%);
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

.stats-value.income {
  color: #67c23a;
}

.stats-value.expense {
  color: #f56c6c;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

/* 财务记录详情对话框样式 */
.finance-detail-dialog .el-dialog__body {
  padding: 20px;
}

.finance-detail-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-bottom: 0;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.detail-card .el-card__header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.detail-card .el-card__header span {
  font-weight: 600;
  color: #303133;
}

.approval-comment-display {
  min-height: 20px;
}

.comment-content {
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  color: #606266;
  line-height: 1.5;
}

.no-comment {
  color: #c0c4cc;
  font-style: italic;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid #e4e7ed;
  transition: all 0.3s ease;
}

.image-item:hover {
  border-color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.image-thumbnail {
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
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-item:hover .image-overlay {
  opacity: 1;
}

.amount-text.income {
  color: #67c23a;
  font-weight: 600;
}

.amount-text.expense {
  color: #f56c6c;
  font-weight: 600;
}

.description-content {
  min-height: 20px;
}

.description-text {
  padding: 8px 12px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  color: #495057;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-description {
  color: #c0c4cc;
  font-style: italic;
}

/* 详情对话框字段内容样式 */
.detail-descriptions .detail-label {
  width: 120px;
  min-width: 120px;
  font-weight: 600;
  color: #303133;
}

.detail-descriptions .detail-content {
  max-width: calc(100% - 120px);
}

.field-content {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
  line-height: 1.5;
}

.field-content:hover {
  color: #409eff;
}

/* 多行文本溢出处理 */
.description-text.field-content {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 4.5em;
  line-height: 1.5;
}

.comment-content.field-content {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 3em;
  line-height: 1.5;
}

/* 移动端适配 (< 768px) */
@media (max-width: 767px) {
  /* 容器 */
  .income-expense-list.mobile-view {
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
    padding: 12px;
    flex-direction: column;
    gap: 12px;
  }

  .search-fields.mobile-fields {
    flex-direction: column;
    width: 100%;
    gap: 12px;
  }

  .search-item {
    width: 100%;
  }

  .business-input,
  .business-select {
    width: 100%;
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
  .record-dialog :deep(.el-dialog__header) {
    padding: 12px;
  }

  .record-dialog :deep(.el-dialog__body) {
    padding: 12px;
  }

  .record-dialog :deep(.el-dialog__footer) {
    padding: 12px;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
  }

  .dialog-footer .el-button {
    flex: 1;
    height: 44px;
    font-size: 15px;
  }
}

</style>