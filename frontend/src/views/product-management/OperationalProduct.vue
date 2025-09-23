<template>
  <div class="operational-product">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><List /></el-icon>
        <h2>运营商品</h2>
      </div>
      <div class="page-description">
        运营商品管理，实时计算佣金利润和净利润
      </div>
    </div>
    <!-- 搜索栏 -->
    <div class="search-card business-style">
      <el-form :model="searchForm" class="business-search-form">
        <div class="search-fields">
          <el-form-item label="产品名称" class="search-item">
             <el-autocomplete
                v-model="searchForm.name"
                :fetch-suggestions="queryProductNameSuggestions"
                placeholder="请输入产品名称"
                maxlength="100"
                show-word-limit
                clearable
                style="width: 100%"
              />
          </el-form-item>
          <el-form-item label="店铺名称" class="search-item">
            <el-autocomplete
                v-model="searchForm.shopName"
                :fetch-suggestions="queryShopNameSuggestions"
                placeholder="请输入店铺名称"
                maxlength="100"
                show-word-limit
                clearable
                style="width: 100%"
              />
          </el-form-item>
          <el-form-item label="平台" class="search-item">
            <el-autocomplete
                v-model="searchForm.platform"
                :fetch-suggestions="queryPlatformSuggestions"
                placeholder="请输入平台名称"
                maxlength="100"
                show-word-limit
                clearable
                style="width: 100%"
              />
          </el-form-item>
          <el-form-item label="团队" class="search-item">
            <el-autocomplete
                v-model="searchForm.team"
                :fetch-suggestions="queryTeamSuggestions"
                placeholder="请输入团队名称"
                maxlength="100"
                show-word-limit
                clearable
                style="width: 100%"
              />
          </el-form-item>
          <el-form-item label="产品日期" class="search-item">
            <el-date-picker
              v-model="productDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 350px;"
              :shortcuts="dateShortcuts"
              @change="handleProductDateRangeChange"
            />
          </el-form-item>
          <el-form-item label="创建时间" class="search-item">
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

          <el-form-item label="净利润范围" class="search-item">
            <div class="profit-range">
              <el-input
                v-model="searchForm.minProfit"
                placeholder="最小净利润"
                class="range-input"
                @input="(value) => handleSearchProfitInput('minProfit', value)"
              />
              <span class="range-separator">-</span>
              <el-input
                v-model="searchForm.maxProfit"
                placeholder="最大净利润"
                class="range-input"
                @input="(value) => handleSearchProfitInput('maxProfit', value)"
              />
            </div>
          </el-form-item>
        </div>

        <div class="search-actions">
          <el-button type="primary" @click="handleSearch" :icon="Search"  size="small">查询</el-button>
          <el-button @click="handleReset"  size="small" style="margin-left: 8px;">重置</el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" @click="showAddDialog = true" :icon="Plus" class="action-btn primary">
          新增核算
        </el-button>
        <el-button type="success" @click="showBatchAddDialog = true" :icon="Plus" class="action-btn success">
          批量新增
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
          :disabled="selectedAccountings.length === 0"
          :icon="TrendCharts"
          class="action-btn primary"
          plain
        >
          多选汇总 ({{ selectedAccountings.length }})
        </el-button>
        <el-button
          type="danger"
          @click="handleBatchDelete"
          :disabled="selectedAccountings.length === 0"
          :icon="Delete"
          class="action-btn danger"
        >
          批量删除
        </el-button>
        <el-button @click="handleExport" :icon="Download" class="action-btn">
          导出数据
          <span v-if="selectedAccountings.length">({{ selectedAccountings.length }}条)</span>
        </el-button>
      </div>
      <div class="action-right">
        <span class="total-count">共 {{ operationalProductStore.pagination?.total || 0 }} 条数据</span>
        <el-tooltip content="刷新数据" placement="top">
          <el-button @click="handleRefresh" :icon="Refresh" circle />
        </el-tooltip>
      </div>
    </div>

    <!-- 可折叠统计面板 -->
    <div class="stats-panel">
      <div class="stats-header" @click="toggleStatsPanel">
        <div class="stats-title">
          <el-icon class="stats-title-icon"><DataAnalysis /></el-icon>
          <span>数据统计</span>
          <el-tooltip content="统计基于当前查询条件下的所有数据，只在第一页时计算以提高性能" placement="top">
            <el-icon class="stats-info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="stats-toggle">
          <el-icon class="toggle-icon" :class="{ 'expanded': showStatsPanel }">
            <ArrowDown />
          </el-icon>
        </div>
      </div>

      <el-collapse-transition>
        <div v-show="showStatsPanel" class="stats-content-wrapper">
          <div class="stats-cards">
            <el-row :gutter="20">
              <el-col :span="4">
                <el-card class="stats-card">
                  <div class="stats-content">
                    <div class="stats-icon commission">
                      <el-icon><Coin /></el-icon>
                    </div>
                    <div class="stats-info">
                      <div class="stats-value">¥{{ operationalProductStore.totalNetTransactionData.toFixed(2) }}</div>
                      <div class="stats-label">总净成交</div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="4">
                <el-card class="stats-card">
                  <div class="stats-content">
                    <div class="stats-icon profit">
                      <el-icon><TrendCharts /></el-icon>
                    </div>
                    <div class="stats-info">
                      <div class="stats-value">¥{{ operationalProductStore.totalCommissionProfit.toFixed(2) }}</div>
                      <div class="stats-label">总佣金利润</div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="4">
                <el-card class="stats-card">
                  <div class="stats-content">
                    <div class="stats-icon warning">
                      <el-icon><Money /></el-icon>
                    </div>
                    <div class="stats-info">
                      <div class="stats-value consumption">¥{{ operationalProductStore.totalDailyConsumption.toFixed(2) }}</div>
                      <div class="stats-label">总消耗</div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="4">
                <el-card class="stats-card">
                  <div class="stats-content">
                    <div class="stats-icon" :class="operationalProductStore.totalNetProfit >= 0 ? 'success' : 'danger'">
                      <el-icon>
                        <SuccessFilled v-if="operationalProductStore.totalNetProfit >= 0" />
                        <WarningFilled v-else />
                      </el-icon>
                    </div>
                    <div class="stats-info">
                      <div class="stats-value" :class="operationalProductStore.totalNetProfit >= 0 ? 'profit' : 'loss'">
                        ¥{{ operationalProductStore.totalNetProfit.toFixed(2) }}
                      </div>
                      <div class="stats-label">总净利润</div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="4">
                <el-card class="stats-card">
                  <div class="stats-content">
                    <div class="stats-icon info">
                      <el-icon><List /></el-icon>
                    </div>
                    <div class="stats-info">
                      <div class="stats-value">{{ operationalProductStore.totalOrderCount || 0 }}</div>
                      <div class="stats-label">总订单数量</div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="4">
                <el-card class="stats-card">
                  <div class="stats-content">
                    <div class="stats-icon primary">
                      <el-icon><DataAnalysis /></el-icon>
                    </div>
                    <div class="stats-info">
                      <div class="stats-value">{{ operationalProductStore.stats.recordCount || 0 }}</div>
                      <div class="stats-label">记录总数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-collapse-transition>
    </div>

    <!-- 运营商品列表 -->
    <el-card class="table-card">
      <el-table
        :data="operationalProductStore.operationalProducts"
        v-loading="operationalProductStore.loading"
        @selection-change="handleSelectionChange"
        stripe
        border
        style="width: 100%"
        max-height="600"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="name" label="产品名称" min-width="150" show-overflow-tooltip />

        <el-table-column prop="productTime" label="产品时间" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.productTime ? formatDateOnly(row.productTime) : '-' }}</span>
          </template>
        </el-table-column>

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

        <el-table-column prop="team" label="团队" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.team || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="netTransactionData" label="净成交数据" width="120" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.netTransactionData?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="commission" label="佣金(%)" width="100" align="right">
          <template #default="{ row }">
            <span class="commission">{{ row.commission?.toFixed(2) || '0.00' }}%</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="commissionProfit" label="佣金利润" width="120" align="right">
          <template #default="{ row }">
            <span :class="['price', row.commissionProfit >= 0 ? 'profit' : 'loss']">
              ¥{{ row.commissionProfit?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="dailyConsumption" label="今日消耗" width="120" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.dailyConsumption?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="netProfit" label="净利润" width="120" align="right">
          <template #default="{ row }">
            <span :class="['price', row.netProfit >= 0 ? 'profit' : 'loss']">
              ¥{{ row.netProfit?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="orderCount" label="订单数量" width="100" align="right">
          <template #default="{ row }">
            <span class="count">{{ row.orderCount || '0' }}</span>
          </template>
        </el-table-column>

         <el-table-column prop="description" label="备注" width="200">
          <template #default="{ row }">
            <span >{{ row.description || '-' }}</span>
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
        
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)" link>编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" link>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="operationalProductStore.pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingProduct ? '编辑运营商品' : '新增运营商品'"
      width="900px"
      append-to-body
      @close="resetForm"
    >
      <el-form
        ref="productFormRef"
        :model="productForm"
        :rules="productRules"
        label-width="120px"
      >
      
        <el-form-item label="产品名称" prop="name">
          <el-autocomplete
            v-model="productForm.name"
            :fetch-suggestions="queryProductNameSuggestions"
            placeholder="请输入产品名称"
            maxlength="100"
            show-word-limit
            clearable
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="产品时间">
          <el-date-picker
            v-model="productForm.productTime"
            type="date"
            placeholder="请选择产品日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            clearable
          />
        </el-form-item>

        <el-form-item label="店铺名称" prop="shopName">
          <el-autocomplete
            v-model="productForm.shopName"
            :fetch-suggestions="queryShopNameSuggestions"
            placeholder="请输入店铺名称（可选）"
            maxlength="100"
            show-word-limit
            clearable
            style="width: 100%"
            @select="handleShopNameSelect"
          />
        </el-form-item>

        <el-form-item label="平台" prop="platform">
          <el-autocomplete
            v-model="productForm.platform"
            :fetch-suggestions="queryPlatformSuggestions"
            placeholder="请输入平台名称（可选）"
            maxlength="50"
            show-word-limit
            clearable
            style="width: 100%"
            @select="handlePlatformSelect"
          />
        </el-form-item>

        <el-form-item label="团队" prop="team">
          <el-autocomplete
            v-model="productForm.team"
            :fetch-suggestions="queryTeamSuggestions"
            placeholder="请输入团队名称（可选）"
            maxlength="50"
            show-word-limit
            clearable
            style="width: 100%"
            @select="handleTeamSelect"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="净成交数据" prop="netTransactionData">
              <el-input
                v-model="productForm.netTransactionData"
                placeholder="支持负数，如: -500.25"
                style="width: 100%"
                @input="(value) => handleNumberInput('netTransactionData', value)"
                @blur="updateCalculation"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="佣金(%)" prop="commission">
              <el-input
                v-model="productForm.commission"
                placeholder="支持负数，如: -2.5"
                style="width: 100%"
                @input="(value) => handleNumberInput('commission', value)"
                @blur="updateCalculation"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="今日消耗" prop="dailyConsumption">
          <el-input
            v-model="productForm.dailyConsumption"
            placeholder="支持负数，如: -100.50"
            style="width: 100%"
            @input="(value) => handleNumberInput('dailyConsumption', value)"
            @blur="updateCalculation"
          />
        </el-form-item>

        <el-form-item label="订单数量" prop="orderCount">
          <el-input
            v-model="productForm.orderCount"
            placeholder="请输入订单数量，如: 100"
            style="width: 100%"
            @input="(value) => handleNumberInput('orderCount', value)"
          />
        </el-form-item>

        <!-- 实时计算结果 -->
        <el-card class="calculation-preview" >
          <template #header>
            <span>实时计算结果</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="calc-item">
                <span class="calc-label">佣金利润：</span>
                <span :class="['calc-value', calculationResult && calculationResult.commissionProfit >= 0 ? 'profit' : 'loss']">
                  ¥{{ calculationResult ? calculationResult.commissionProfit : 0 }}
                </span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="calc-item">
                <span class="calc-label">净利润：</span>
                <span :class="['calc-value', calculationResult && calculationResult.netProfit >= 0 ? 'profit' : 'loss']">
                  ¥{{ calculationResult ? calculationResult.netProfit : 0 }}
                </span>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-form-item label="备注" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ editingProduct ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量新增对话框 -->
    <el-dialog
      v-model="showBatchAddDialog"
      title="批量新增运营商品"
      width="900px"
      append-to-body
      @close="resetBatchForm"
    >
      <el-form
        ref="batchFormRef"
        :model="batchForm"
        :rules="batchRules"
        label-width="120px"
      >
        <!-- 第一行：产品名称、今日消耗 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-autocomplete
                v-model="batchForm.productName"
                :fetch-suggestions="queryProductNameSuggestions"
                placeholder="请输入产品名称"
                maxlength="100"
                show-word-limit
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="今日总消耗" prop="totalDailyConsumption">
              <div style="display: flex; gap: 8px;">
                <el-input
                  v-model="batchForm.totalDailyConsumption"
                  placeholder="支持负数，如: -100.50"
                  style="flex: 1"
                  @input="handleBatchTotalDailyConsumptionInput"
                />
                <el-button
                  type="primary"
                  @click="distributeTotalConsumptionToPlatforms"
                  :disabled="!batchForm.totalDailyConsumption || batchForm.records.length === 0"
                  style="white-space: nowrap;"
                >
                  分摊
                </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 第二行：备注 -->
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注" prop="description">
              <el-input
                v-model="batchForm.description"
                placeholder="请输入备注信息（可选）"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          <span style="font-weight: 600; color: #409eff;">店铺平台数据</span>
        </el-divider>

        <div class="batch-records">
          <div
            v-for="(record, index) in batchForm.records"
            :key="index"
            class="batch-record-item"
          >
            <div class="record-header">
              <span class="record-title">第 {{ index + 1 }} 个店铺/平台</span>
              <el-button
                v-if="batchForm.records.length > 1"
                type="danger"
                size="small"
                @click="removeBatchRecord(index)"
                :icon="Delete"
                circle
              />
            </div>

            <!-- 两列布局：左列输入，右列计算结果 -->
            <el-row :gutter="24">
              <!-- 左列：数据输入 -->
              <el-col :span="12">
                <el-row :gutter="16">
                  <el-col :span="24">
                    <el-form-item label="店铺名称">
                      <el-autocomplete
                        v-model="record.shopName"
                        :fetch-suggestions="queryShopNameSuggestions"
                        placeholder="请输入店铺名称"
                        maxlength="100"
                        clearable
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="平台">
                      <el-autocomplete
                        v-model="record.platform"
                        :fetch-suggestions="queryPlatformSuggestions"
                        placeholder="请输入平台名称"
                        maxlength="50"
                        clearable
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="团队">
                      <el-autocomplete
                        v-model="record.team"
                        :fetch-suggestions="queryTeamSuggestions"
                        placeholder="请输入团队名称"
                        maxlength="50"
                        clearable
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="净成交数据" :required="true">
                      <el-input
                        v-model="record.netTransactionData"
                        placeholder="支持负数，如: -500.25"
                        style="width: 100%"
                        @input="(value) => handleBatchNumberInput(index, 'netTransactionData', value)"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="佣金(%)" :required="true">
                      <el-input
                        v-model="record.commission"
                        placeholder="支持负数，如: -2.5"
                        style="width: 100%"
                        @input="(value) => handleBatchNumberInput(index, 'commission', value)"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="今日消耗">
                      <el-input
                        v-model="record.dailyConsumption"
                        placeholder="自动分摊或手动输入，支持负数"
                        style="width: 100%"
                        @input="(value) => handleDailyConsumptionInput(index, value)"
                        @focus="onDailyConsumptionFocus(index)"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="24">
                    <el-form-item label="订单数量">
                      <el-input
                        v-model="record.orderCount"
                        placeholder="请输入订单数量，如: 100"
                        style="width: 100%"
                        @input="(value) => handleBatchNumberInput(index, 'orderCount', value)"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-col>

              <!-- 右列：计算结果 -->
              <el-col :span="12">
                <div class="calculation-panel">
                  <div class="panel-title">实时计算结果</div>
                  <div class="calculation-content" v-if="batchCalculationResults[index]">
                    <!-- 佣金利润和净利润占一行 -->
                    <el-row :gutter="16">
                      <el-col :span="12">
                        <div class="calc-item-compact">
                          <div class="calc-label-compact">佣金利润</div>
                          <div :class="['calc-value-compact', batchCalculationResults[index].commissionProfit >= 0 ? 'profit' : 'loss']">
                            ¥{{ batchCalculationResults[index].commissionProfit.toFixed(2) }}
                          </div>
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div class="calc-item-compact">
                          <div class="calc-label-compact">净利润</div>
                          <div :class="['calc-value-compact', batchCalculationResults[index].netProfit >= 0 ? 'profit' : 'loss']">
                            ¥{{ batchCalculationResults[index].netProfit.toFixed(2) }}
                          </div>
                        </div>
                      </el-col>
                    </el-row>

                    <!-- 计算公式说明 -->
                    <div class="formula-info">
                      <div class="formula-line">
                        <span class="formula-text">佣金利润 = 净成交数据 × 佣金%</span>
                      </div>
                      <div class="formula-line">
                        <span class="formula-text">净利润 = 佣金利润 - 今日消耗</span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="no-calculation">
                    <el-icon class="calc-icon"></el-icon>
                    <span>请输入数据查看计算结果</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>

          <div class="add-record-btn">
            <el-button type="dashed" @click="addBatchRecord" :icon="Plus" style="width: 100%;">
              添加更多店铺/平台
            </el-button>
          </div>

          <!-- 总计显示 -->
          <div class="batch-summary" v-if="batchCalculationResults.length > 0">
            <el-divider content-position="center">
              <span style="font-weight: 600; color: #409eff;">汇总统计</span>
            </el-divider>

            <!-- 第一行：基础数据 -->
            <el-row :gutter="16" style="margin-bottom: 16px;">
              <el-col :span="6">
                <div class="summary-item">
                  <div class="summary-label">总净成交数据</div>
                  <div class="summary-value">
                    ¥{{ batchForm.records.reduce((sum, record) => sum + (parseFloat(record.netTransactionData) || 0), 0).toFixed(2) }}
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="summary-item">
                  <div class="summary-label">总佣金利润</div>
                  <div class="summary-value profit">
                    ¥{{ batchCalculationResults.reduce((sum, result) => sum + result.commissionProfit, 0).toFixed(2) }}
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="summary-item">
                  <div class="summary-label">今日总消耗</div>
                  <div class="summary-value consumption">
                    ¥{{ batchForm.records.reduce((sum, record) => sum + (parseFloat(record.dailyConsumption) || 0), 0).toFixed(2) }}
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="summary-item">
                  <div class="summary-label">总净利润</div>
                  <div :class="['summary-value', batchCalculationResults.reduce((sum, result) => sum + result.netProfit, 0) >= 0 ? 'profit' : 'loss']">
                    ¥{{ batchCalculationResults.reduce((sum, result) => sum + result.netProfit, 0).toFixed(2) }}
                  </div>
                </div>
              </el-col>
            </el-row>

            <!-- 第二行：计算公式说明 -->
            <div class="formula-explanation">
              <div class="formula-text">
                <span class="formula-highlight">总净利润</span> =
                <span class="formula-highlight profit">总佣金利润</span> -
                <span class="formula-highlight consumption">今日总消耗</span>
              </div>
              <div class="formula-calculation">
                ¥{{ batchCalculationResults.reduce((sum, result) => sum + result.netProfit, 0).toFixed(2) }} =
                ¥{{ batchCalculationResults.reduce((sum, result) => sum + result.commissionProfit, 0).toFixed(2) }} -
                ¥{{ batchForm.records.reduce((sum, record) => sum + (parseFloat(record.dailyConsumption) || 0), 0).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showBatchAddDialog = false">取消</el-button>
          <el-button type="primary" @click="handleBatchSubmit" :loading="batchSubmitting">
            批量创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Excel导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="Excel批量导入"
      width="900px"
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
              <li>必填字段：产品名称、净成交数据、佣金</li>
              <li>可选字段：产品时间、店铺名称、平台、团队、今日消耗、订单数量、备注</li>
              <li>产品时间格式：YYYY-MM-DD（如：2024-01-01）</li>
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
            <el-table-column prop="name" label="产品名称" min-width="120" />
            <el-table-column prop="productTime" label="产品时间" width="120">
              <template #default="{ row }">
                <span>{{ row.productTime ? formatDateOnly(row.productTime) : '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="shopName" label="店铺名称" min-width="120" />
            <el-table-column prop="platform" label="平台" width="80" />
            <el-table-column prop="team" label="团队" width="100" />
            <el-table-column prop="netTransactionData" label="净成交数据" width="120">
              <template #default="{ row }">
                <span :class="{ 'negative-value': row.netTransactionData < 0 }">
                  {{ row.netTransactionData }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="commission" label="佣金(%)" width="100">
              <template #default="{ row }">
                <span :class="{ 'negative-value': row.commission < 0 }">
                  {{ row.commission }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="dailyConsumption" label="今日消耗" width="100">
              <template #default="{ row }">
                <span :class="{ 'negative-value': row.dailyConsumption < 0 }">
                  {{ row.dailyConsumption }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="orderCount" label="订单数量" width="100">
              <template #default="{ row }">
                <span>{{ row.orderCount || '0' }}</span>
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
        <span class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button
            v-if="importData.length > 0"
            type="primary"
            @click="handleImportConfirm"
            :loading="importSubmitting"
          >
            确认导入 ({{ importData.length }} 条)
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 产品汇总对话框 -->
    <el-dialog
      v-model="showSummaryDialog"
      title="产品汇总分析"
      width="1000px"
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
          <!-- 第一行：基础统计数据 -->
          <el-row :gutter="16" style="margin-bottom: 20px;">
            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon commission">
                    <el-icon><Coin /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">¥{{ summaryStats.totalNetTransaction.toFixed(2) }}</div>
                    <div class="stats-label">总净成交</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon profit">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">¥{{ summaryStats.totalCommissionProfit.toFixed(2) }}</div>
                    <div class="stats-label">总佣金利润</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon" :class="summaryStats.totalDailyConsumption >= 0 ? 'warning' : 'success'">
                    <el-icon><Money /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value" :class="summaryStats.totalDailyConsumption >= 0 ? 'consumption' : 'profit'">
                      ¥{{ summaryStats.totalDailyConsumption.toFixed(2) }}
                    </div>
                    <div class="stats-label">今日总消耗</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon" :class="summaryStats.totalNetProfit >= 0 ? 'profit' : 'danger'">
                    <el-icon>
                      <SuccessFilled v-if="summaryStats.totalNetProfit >= 0" />
                      <WarningFilled v-else />
                    </el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value" :class="summaryStats.totalNetProfit >= 0 ? 'profit' : 'loss'">
                      ¥{{ summaryStats.totalNetProfit.toFixed(2) }}
                    </div>
                    <div class="stats-label">总净利润</div>
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

            <el-table-column prop="team" label="团队" width="100">
              <template #default="{ row }">
                <span>{{ row.team || '-' }}</span>
              </template>
            </el-table-column>

            <el-table-column prop="netTransactionData" label="净成交数据" width="120" align="right">
              <template #default="{ row }">
                <span :class="['price', row.netTransactionData >= 0 ? '' : 'loss']">
                  ¥{{ row.netTransactionData?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="commission" label="佣金(%)" width="100" align="right">
              <template #default="{ row }">
                <span class="commission">{{ row.commission?.toFixed(2) || '0.00' }}%</span>
              </template>
            </el-table-column>

            <el-table-column prop="commissionProfit" label="佣金利润" width="120" align="right">
              <template #default="{ row }">
                <span :class="['price', row.commissionProfit >= 0 ? 'profit' : 'loss']">
                  ¥{{ row.commissionProfit?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="dailyConsumption" label="今日消耗" width="120" align="right">
              <template #default="{ row }">
                <span :class="['price', row.dailyConsumption >= 0 ? '' : 'loss']">
                  ¥{{ row.dailyConsumption?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="netProfit" label="净利润" width="120" align="right">
              <template #default="{ row }">
                <span :class="['price', row.netProfit >= 0 ? 'profit' : 'loss']">
                  ¥{{ row.netProfit?.toFixed(2) || '0.00' }}
                </span>
              </template>
            </el-table-column>

            <el-table-column prop="createdAt" label="创建时间" width="180">
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
        <span class="dialog-footer">
          <el-button @click="showSummaryDialog = false">关闭</el-button>
          <el-button
            v-if="summaryAllData.length > 0"
            type="primary"
            @click="exportSummaryData"
            :icon="Download"
          >
            导出汇总数据
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
                  <div class="stats-icon commission">
                    <el-icon><Coin /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">¥{{ selectedSummaryStats.totalNetTransaction.toFixed(2) }}</div>
                    <div class="stats-label">总净成交</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon profit">
                    <el-icon><TrendCharts /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value">¥{{ selectedSummaryStats.totalCommissionProfit.toFixed(2) }}</div>
                    <div class="stats-label">总佣金利润</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon" :class="selectedSummaryStats.totalDailyConsumption >= 0 ? 'warning' : 'success'">
                    <el-icon><Money /></el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value" :class="selectedSummaryStats.totalDailyConsumption >= 0 ? 'consumption' : 'profit'">
                      ¥{{ selectedSummaryStats.totalDailyConsumption.toFixed(2) }}
                    </div>
                    <div class="stats-label">今日总消耗</div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6" :xs="12" :sm="8" :md="6" :lg="6">
              <el-card class="stats-card">
                <div class="stats-content">
                  <div class="stats-icon" :class="selectedSummaryStats.totalNetProfit >= 0 ? 'profit' : 'danger'">
                    <el-icon>
                      <SuccessFilled v-if="selectedSummaryStats.totalNetProfit >= 0" />
                      <WarningFilled v-else />
                    </el-icon>
                  </div>
                  <div class="stats-info">
                    <div class="stats-value" :class="selectedSummaryStats.totalNetProfit >= 0 ? 'profit' : 'loss'">
                      ¥{{ selectedSummaryStats.totalNetProfit.toFixed(2) }}
                    </div>
                    <div class="stats-label">总净利润</div>
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
            :data="selectedAccountings"
            border
            stripe
            height="400"
          >
            <el-table-column prop="name" label="产品名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="productTime" label="产品时间" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.productTime ? formatDateOnly(row.productTime) : '-' }}</span>
              </template>
            </el-table-column>
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
            <el-table-column prop="team" label="团队" width="100" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.team || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="netTransactionData" label="净成交数据" width="120" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ row.netTransactionData?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="commission" label="佣金%" width="80" align="right">
              <template #default="{ row }">
                <span>{{ row.commission?.toFixed(1) || '0.0' }}%</span>
              </template>
            </el-table-column>
            <el-table-column prop="commissionProfit" label="佣金利润" width="120" align="right">
              <template #default="{ row }">
                <span class="amount profit">¥{{ row.commissionProfit?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="dailyConsumption" label="今日消耗" width="120" align="right">
              <template #default="{ row }">
                <span class="amount consumption">¥{{ row.dailyConsumption?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="netProfit" label="净利润" width="120" align="right">
              <template #default="{ row }">
                <span class="amount" :class="row.netProfit >= 0 ? 'profit' : 'loss'">
                  ¥{{ row.netProfit?.toFixed(2) || '0.00' }}
                </span>
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
          >
            导出汇总数据
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Delete,
  List,
  Search,
  Refresh,
  Download,
  Upload,
  TrendCharts,
  Coin,
  Money,
  SuccessFilled,
  WarningFilled,
  DataAnalysis,
  ArrowDown,
  InfoFilled,
} from '@element-plus/icons-vue'
import { useOperationalProductStore } from '@/stores/operationalProduct'
import { formatUtcToLocalDateTime } from '@/utils/dateUtils'

// 格式化日期（只显示日期部分）
const formatDateOnly = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
  } catch (error) {
    return '-'
  }
}
import { numberValidators } from '@/utils/inputValidation'
import {
  readExcelFile,
  validateImportHeaders,
  transformImportData,
  validateImportData,
  generateImportTemplate,
  exportToCSV,
  exportToExcel,
  downloadImportTemplate,
  downloadOperationalProductImportTemplate
} from '@/utils/excelUtils'

// Store
const operationalProductStore = useOperationalProductStore()

// 响应式数据
const showAddDialog = ref(false)
const showBatchAddDialog = ref(false)
const showImportDialog = ref(false)
const showSummaryDialog = ref(false)
const showSelectedSummaryDialog = ref(false)
const editingProduct = ref(null)
const submitting = ref(false)
const batchSubmitting = ref(false)
const importSubmitting = ref(false)
const selectedAccountings = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

// 统计面板控制
const showStatsPanel = ref(false) // 默认折叠

// 搜索表单
const searchForm = reactive({
  name: '',
  shopName: '',
  platform: '',
  team: '',
  minProfit: null,
  maxProfit: null,
  startDate: '',
  endDate: '',
  productStartDate: '',
  productEndDate: ''
})

// 创建时间日期范围
const dateRange = ref([])

// 产品日期范围
const productDateRange = ref([])

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

// 运营商品表单
const productForm = reactive({
  name: '',
  productTime: '',
  shopName: '',
  platform: '',
  team: '',
  netTransactionData: 0,
  commission: 0,
  dailyConsumption: 0,
  orderCount: 0,
  description: ''
})

// 批量新增表单
const batchForm = reactive({
  productName: '',
  description: '',
  totalDailyConsumption: 0, // 今日总消耗
  records: [
    {
      shopName: '',
      platform: '',
      team: '',
      netTransactionData: 0,
      commission: 0,
      dailyConsumption: 0, // 每个平台的今日消耗
      orderCount: 0
    }
  ]
})

// 表单引用
const productFormRef = ref()
const batchFormRef = ref()

// 表单验证规则
const productRules = {
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 1, max: 100, message: '名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
}

// 批量新增验证规则
const batchRules = {
  productName: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 1, max: 100, message: '产品名称长度在 1 到 100 个字符', trigger: 'blur' }
  ]
}

// 计算结果
const calculationResult = ref(null)

// 建议数据
const shopNameSuggestions = ref([])
const platformSuggestions = ref([])
const productNameSuggestions = ref([])
const teamSuggestions = ref([])

// 批量新增计算结果
const batchCalculationResults = ref([])

// Excel导入相关数据
const importData = ref([])
const importColumns = ref([])
const importFile = ref(null)

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
  totalNetTransaction: 0,
  totalCommissionProfit: 0,
  totalNetProfit: 0,
  totalDailyConsumption: 0,
  recordCount: 0
})

// 多选汇总相关数据
const selectedSummaryStats = ref({
  totalNetTransaction: 0,
  totalCommissionProfit: 0,
  totalNetProfit: 0,
  totalDailyConsumption: 0,
  recordCount: 0
})

// 实时计算
const updateCalculation = () => {
  const calculationData = {
    netTransactionData: parseFloat(productForm.netTransactionData) || 0,
    commission: parseFloat(productForm.commission) || 0,
    dailyConsumption: parseFloat(productForm.dailyConsumption) || 0
  }
  calculationResult.value = operationalProductStore.calculateCommissionAccounting(calculationData)
}

// 批量新增实时计算
const updateBatchCalculation = () => {
  batchCalculationResults.value = batchForm.records.map(record => {
    const calculationData = {
      netTransactionData: parseFloat(record.netTransactionData) || 0,
      commission: parseFloat(record.commission) || 0,
      dailyConsumption: parseFloat(record.dailyConsumption) || 0
    }
    return operationalProductStore.calculateCommissionAccounting(calculationData)
  })
}

// 监听表单变化，实时计算
watch(
  () => [productForm.netTransactionData, productForm.commission, productForm.dailyConsumption],
  () => {
    updateCalculation()
  },
  { immediate: true }
)

// 监听批量表单变化，实时计算
watch(
  () => [batchForm.records, batchForm.totalDailyConsumption],
  () => {
    updateBatchCalculation()
  },
  { deep: true, immediate: true }
)

// 获取运营商品列表
const fetchAccountings = async () => {
  const params = {
    page: currentPage.value,
    limit: pageSize.value,
    ...searchForm
  }

  // 过滤空值
  Object.keys(params).forEach(key => {
    if (params[key] === '' || params[key] === null || params[key] === undefined) {
      delete params[key]
    }
  })

  await operationalProductStore.fetchOperationalProducts(params)
}

// 创建时间日期范围处理函数
const handleDateRangeChange = (dates) => {
  if (dates && dates.length === 2) {
    searchForm.startDate = dates[0]
    searchForm.endDate = dates[1]
  } else {
    searchForm.startDate = ''
    searchForm.endDate = ''
  }
}

// 产品日期范围处理函数
const handleProductDateRangeChange = (dates) => {
  if (dates && dates.length === 2) {
    searchForm.productStartDate = dates[0]
    searchForm.productEndDate = dates[1]
  } else {
    searchForm.productStartDate = ''
    searchForm.productEndDate = ''
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  // 清空之前的统计数据，因为搜索条件改变了
  operationalProductStore.stats.totalNetTransactionData = 0
  operationalProductStore.stats.totalCommissionProfit = 0
  operationalProductStore.stats.totalNetProfit = 0
  operationalProductStore.stats.totalDailyConsumption = 0
  operationalProductStore.stats.averageCommission = 0
  operationalProductStore.stats.recordCount = 0
  fetchAccountings()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    shopName: '',
    platform: '',
    team: '',
    minProfit: null,
    maxProfit: null,
    startDate: '',
    endDate: '',
    productStartDate: '',
    productEndDate: ''
  })
  dateRange.value = []
  productDateRange.value = []
  currentPage.value = 1

  // 清空统计数据，因为搜索条件重置了
  operationalProductStore.stats.totalNetTransactionData = 0
  operationalProductStore.stats.totalCommissionProfit = 0
  operationalProductStore.stats.totalNetProfit = 0
  operationalProductStore.stats.totalDailyConsumption = 0
  operationalProductStore.stats.averageCommission = 0
  operationalProductStore.stats.recordCount = 0

  // 重置后重新设置默认搜索今天
  initializeDefaultSearch()
  fetchAccountings()
}

// 切换统计面板
const toggleStatsPanel = () => {
  showStatsPanel.value = !showStatsPanel.value
}

// 刷新
const handleRefresh = () => {
  fetchAccountings()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedAccountings.value = selection
}

// 编辑
const handleEdit = (product) => {
  editingProduct.value = product
  Object.assign(productForm, {
    name: product.name,
    productTime: product.productTime ? formatDateOnly(product.productTime) : '',
    shopName: product.shopName || '',
    platform: product.platform || '',
    team: product.team || '',
    netTransactionData: product.netTransactionData,
    commission: product.commission,
    dailyConsumption: product.dailyConsumption,
    orderCount: product.orderCount || 0,
    description: product.description || ''
  })
  updateCalculation()
  showAddDialog.value = true
}

// 删除
const handleDelete = async (product) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除运营商品 "${product.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await operationalProductStore.deleteOperationalProduct(product._id)
    if (result.success) {
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedAccountings.value.length === 0) {
    ElMessage.warning('请选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedAccountings.value.length} 条运营商品记录吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedAccountings.value.map(product => product._id)
    const result = await operationalProductStore.batchDeleteOperationalProducts(ids)

    if (result.success) {
      ElMessage.success(result.message)
      selectedAccountings.value = []
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await productFormRef.value.validate()

    submitting.value = true

    // 转换字符串为数字类型再提交
    const submitData = {
      ...productForm,
      netTransactionData: parseFloat(productForm.netTransactionData) || 0,
      commission: parseFloat(productForm.commission) || 0,
      dailyConsumption: parseFloat(productForm.dailyConsumption) || 0
    }

    let result

    if (editingProduct.value) {
      // 更新
      result = await operationalProductStore.updateOperationalProduct(editingProduct.value._id, submitData)
    } else {
      // 新增
      result = await operationalProductStore.addOperationalProduct(submitData)
    }

    if (result.success) {
      ElMessage.success(result.message)
      showAddDialog.value = false
      resetForm()
      // 重新加载建议数据，以便新添加的数据能够出现在建议列表中
      loadSuggestions()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  editingProduct.value = null
  Object.assign(productForm, {
    name: '',
    productTime: '',
    shopName: '',
    platform: '',
    team: '',
    netTransactionData: 0,
    commission: 0,
    dailyConsumption: 0,
    orderCount: 0,
    description: ''
  })
  calculationResult.value = null

  if (productFormRef.value) {
    productFormRef.value.resetFields()
  }
}

// 分页
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  // 改变页面大小时回到第一页，清空统计数据以便重新计算
  operationalProductStore.stats.totalNetTransactionData = 0
  operationalProductStore.stats.totalCommissionProfit = 0
  operationalProductStore.stats.totalNetProfit = 0
  operationalProductStore.stats.totalDailyConsumption = 0
  operationalProductStore.stats.averageCommission = 0
  operationalProductStore.stats.recordCount = 0
  fetchAccountings()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  fetchAccountings()
}

// 获取建议数据
const loadSuggestions = async () => {
  try {
    // 获取店铺名称建议
    const shopNameResult = await operationalProductStore.fetchShopNameSuggestions()
    if (shopNameResult.success) {
      shopNameSuggestions.value = shopNameResult.data.map(name => ({ value: name }))
    }

    // 获取平台建议
    const platformResult = await operationalProductStore.fetchPlatformSuggestions()
    if (platformResult.success) {
      platformSuggestions.value = platformResult.data.map(name => ({ value: name }))
    }

    // 获取产品名称建议
    const productNameResult = await operationalProductStore.fetchProductNameSuggestions()
    if (productNameResult.success) {
      productNameSuggestions.value = productNameResult.data.map(name => ({ value: name }))
    }

    // 获取团队建议
    const teamResult = await operationalProductStore.fetchTeamSuggestions()
    if (teamResult.success) {
      teamSuggestions.value = teamResult.data.map(name => ({ value: name }))
    }
  } catch (error) {
    console.error('获取建议数据失败:', error)
  }
}

// 店铺名称自动完成查询
const queryShopNameSuggestions = (queryString, callback) => {
  const results = queryString
    ? shopNameSuggestions.value.filter(item =>
        item.value.toLowerCase().includes(queryString.toLowerCase())
      )
    : shopNameSuggestions.value
  callback(results)
}

// 平台自动完成查询
const queryPlatformSuggestions = (queryString, callback) => {
  const results = queryString
    ? platformSuggestions.value.filter(item =>
        item.value.toLowerCase().includes(queryString.toLowerCase())
      )
    : platformSuggestions.value
  callback(results)
}

// 产品名称自动完成查询
const queryProductNameSuggestions = (queryString, callback) => {
  const results = queryString
    ? productNameSuggestions.value.filter(item =>
        item.value.toLowerCase().includes(queryString.toLowerCase())
      )
    : productNameSuggestions.value
  callback(results)
}

// 团队自动完成查询
const queryTeamSuggestions = (queryString, callback) => {
  const results = queryString
    ? teamSuggestions.value.filter(item =>
        item.value.toLowerCase().includes(queryString.toLowerCase())
      )
    : teamSuggestions.value
  callback(results)
}

// 店铺名称选择处理
const handleShopNameSelect = (item) => {
  productForm.shopName = item.value
}

// 平台选择处理
const handlePlatformSelect = (item) => {
  productForm.platform = item.value
}

// 团队选择处理
const handleTeamSelect = (item) => {
  productForm.team = item.value
}

// 数字输入验证处理器
const handleNumberInput = (field, value) => {
  // 所有数字字段都支持小数和负数
  const validatedValue = numberValidators.signedNumber(value)

  // 更新显示值（保持输入框显示验证后的值）
  productForm[field] = validatedValue

  // 如果需要数值计算，在其他地方转换
  return validatedValue
}



// 批量表单数字输入处理
const handleBatchNumberInput = (recordIndex, field, value) => {
  // 所有字段都支持小数和负数
  const validatedValue = numberValidators.signedNumber(value)
  batchForm.records[recordIndex][field] = validatedValue

  // 触发实时计算更新
  nextTick(() => {
    updateBatchCalculation()
  })

  return validatedValue
}

// 批量表单今日总消耗处理
const handleBatchTotalDailyConsumptionInput = (value) => {
  // 今日总消耗：支持小数和负数（可能有退款或调整）
  const validatedValue = numberValidators.signedNumber(value)
  batchForm.totalDailyConsumption = validatedValue

  // 不再自动分摊，需要用户点击分摊按钮
  return validatedValue
}

// 计算单个平台的平摊消耗（保留两位小数）
const calculatePlatformConsumption = () => {
  const totalConsumption = parseFloat(batchForm.totalDailyConsumption) || 0
  const platformCount = batchForm.records.length
  if (platformCount === 0) return 0

  // 保留两位小数
  return parseFloat((totalConsumption / platformCount).toFixed(2))
}

// 将总消耗平摊到各个平台
const distributeTotalConsumptionToPlatforms = () => {
  if (!batchForm.totalDailyConsumption || batchForm.records.length === 0) {
    ElMessage.warning('请先输入今日总消耗和添加平台数据')
    return
  }

  const platformConsumption = calculatePlatformConsumption()

  // 强制分摊到所有平台，覆盖已有值
  batchForm.records.forEach(record => {
    record.dailyConsumption = platformConsumption
  })

  // 处理分摊后的余数，确保总和等于原始总消耗
  const actualTotal = batchForm.records.reduce((sum, record) => sum + (parseFloat(record.dailyConsumption) || 0), 0)
  const difference = parseFloat(batchForm.totalDailyConsumption) - actualTotal

  // 如果有余数，加到第一个平台上
  if (Math.abs(difference) > 0.001 && batchForm.records.length > 0) {
    batchForm.records[0].dailyConsumption = parseFloat((batchForm.records[0].dailyConsumption + difference).toFixed(2))
  }

  ElMessage.success(`已将总消耗 ¥${batchForm.totalDailyConsumption} 平摊到 ${batchForm.records.length} 个平台`)
}

// 处理单个平台今日消耗输入
const handleDailyConsumptionInput = (recordIndex, value) => {
  // 验证并设置值
  const validatedValue = numberValidators.signedNumber(value)
  batchForm.records[recordIndex].dailyConsumption = validatedValue

  // 重新计算总消耗（所有平台消耗的总和）
  updateTotalDailyConsumption()

  return validatedValue
}

// 更新今日总消耗（根据各平台消耗计算）
const updateTotalDailyConsumption = () => {
  const total = batchForm.records.reduce((sum, record) => {
    return sum + (parseFloat(record.dailyConsumption) || 0)
  }, 0)

  // 保留两位小数
  batchForm.totalDailyConsumption = parseFloat(total.toFixed(2))
}

// 当用户聚焦到平台消耗输入框时，如果值为0则自动填入平摊值
const onDailyConsumptionFocus = (index) => {
  const record = batchForm.records[index]
  if (!record.dailyConsumption || record.dailyConsumption === 0) {
    const platformConsumption = calculatePlatformConsumption()
    record.dailyConsumption = platformConsumption
    // 更新总消耗
    updateTotalDailyConsumption()
  }
}

// 搜索表单利润输入处理
const handleSearchProfitInput = (field, value) => {
  // 利润可能为负数，支持小数和负数
  const validatedValue = numberValidators.signedAmount(value)
  const numValue = validatedValue === '' ? null : parseFloat(validatedValue)
  searchForm[field] = isNaN(numValue) ? null : numValue
  return validatedValue
}

// Excel导入相关方法
// 处理文件上传
const handleFileUpload = async (file) => {
  try {
    importSubmitting.value = true

    // 读取Excel文件
    const result = await readExcelFile(file.raw)

    // 验证表头
    const headerValidation = validateImportHeaders(result.headers)

    if (!headerValidation.isValid) {
      ElMessage.error(`缺少必填字段: ${headerValidation.missingRequired.join(', ')}`)
      return false
    }

    // 转换数据格式
    const transformedData = transformImportData(result.data, headerValidation.mappedFields)

    // 验证数据
    const dataValidation = validateImportData(transformedData)

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
    const result = await operationalProductStore.batchAddOperationalProducts(importData.value)

    if (result.success) {
      ElMessage.success(result.message)
      showImportDialog.value = false
      resetImportData()
      // 重新加载建议数据
      loadSuggestions()
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
    // 使用运营商品专用的 Excel 导出功能
    downloadOperationalProductImportTemplate('运营商品导入模板')
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败：' + error.message)
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
    if (operationalProductStore.operationalProducts.length === 0) {
      await loadAccountings()
    }

    // 从当前数据中筛选匹配的产品
    const searchTerm = summaryForm.productName.trim().toLowerCase()
    const allData = operationalProductStore.operationalProducts.filter(item =>
      item.name && item.name.toLowerCase().includes(searchTerm)
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
      totalNetTransaction: 0,
      totalCommissionProfit: 0,
      totalNetProfit: 0,
      totalDailyConsumption: 0,
      recordCount: 0
    }
    return
  }

  const stats = summaryAllData.value.reduce((acc, item) => {
    acc.totalNetTransaction += item.netTransactionData || 0
    acc.totalCommissionProfit += item.commissionProfit || 0
    acc.totalNetProfit += item.netProfit || 0
    acc.totalDailyConsumption += item.dailyConsumption || 0
    return acc
  }, {
    totalNetTransaction: 0,
    totalCommissionProfit: 0,
    totalNetProfit: 0,
    totalDailyConsumption: 0
  })

  summaryStats.value = {
    ...stats,
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
    totalNetTransaction: 0,
    totalCommissionProfit: 0,
    totalNetProfit: 0,
    totalDailyConsumption: 0,
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
  if (selectedAccountings.value.length === 0) {
    ElMessage.warning('请先选择要汇总的数据')
    return
  }

  // 计算多选数据的统计
  const stats = selectedAccountings.value.reduce((acc, item) => {
    acc.totalNetTransaction += item.netTransactionData || 0
    acc.totalCommissionProfit += item.commissionProfit || 0
    acc.totalNetProfit += item.netProfit || 0
    acc.totalDailyConsumption += item.dailyConsumption || 0
    return acc
  }, {
    totalNetTransaction: 0,
    totalCommissionProfit: 0,
    totalNetProfit: 0,
    totalDailyConsumption: 0
  })

  selectedSummaryStats.value = {
    ...stats,
    recordCount: selectedAccountings.value.length
  }

  showSelectedSummaryDialog.value = true
}

// 导出多选汇总数据
const exportSelectedSummaryData = () => {
  if (selectedAccountings.value.length === 0) {
    ElMessage.warning('暂无选中数据可导出')
    return
  }

  try {
    // 构建导出数据
    const exportData = [
      // 汇总统计行
      {
        '产品名称': '多选汇总统计',
        '产品时间': '-',
        '店铺名称': '汇总',
        '平台': '全部',
        '团队': '全部',
        '净成交数据': selectedSummaryStats.value.totalNetTransaction,
        '佣金(%)': '-',
        '佣金利润': selectedSummaryStats.value.totalCommissionProfit,
        '今日消耗': selectedSummaryStats.value.totalDailyConsumption,
        '净利润': selectedSummaryStats.value.totalNetProfit,
        '记录数量': selectedSummaryStats.value.recordCount,
        '创建时间': new Date().toLocaleString()
      },
      // 空行分隔
      {
        '产品名称': '',
        '产品时间': '',
        '店铺名称': '',
        '平台': '',
        '团队': '',
        '净成交数据': '',
        '佣金(%)': '',
        '佣金利润': '',
        '今日消耗': '',
        '净利润': '',
        '记录数量': '',
        '创建时间': ''
      },
      // 详细数据
      ...selectedAccountings.value.map(item => ({
        '产品名称': item.name || '',
        '产品时间': item.productTime ? formatDateOnly(item.productTime) : '',
        '店铺名称': item.shopName || '',
        '平台': item.platform || '',
        '团队': item.team || '',
        '净成交数据': item.netTransactionData || 0,
        '佣金(%)': item.commission || 0,
        '佣金利润': item.commissionProfit || 0,
        '今日消耗': item.dailyConsumption || 0,
        '净利润': item.netProfit || 0,
        '记录数量': 1,
        '创建时间': formatUtcToLocalDateTime(item.createdAt)
      }))
    ]

    // 使用 Excel 格式导出汇总数据
    const headers = Object.keys(exportData[0])
    const filename = `多选汇总数据_${new Date().toLocaleDateString().replace(/\//g, '-')}`

    try {
      // 尝试导出为 Excel 格式
      exportToExcel(exportData, headers, filename, '多选汇总')
      ElMessage.success('多选汇总数据导出成功（Excel格式）')
    } catch (excelError) {
      // 如果 Excel 导出失败，降级到 CSV
      console.warn('Excel导出失败，使用CSV格式：', excelError.message)
      exportToCSV(exportData, headers, filename)
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
        '团队': '全部',
        '净成交数据': summaryStats.value.totalNetTransaction,
        '佣金(%)': '-',
        '佣金利润': summaryStats.value.totalCommissionProfit,
        '今日消耗': summaryStats.value.totalDailyConsumption,
        '净利润': summaryStats.value.totalNetProfit,
        '记录数量': summaryStats.value.recordCount,
        '创建时间': new Date().toLocaleString()
      },
      // 空行分隔
      {
        '产品名称': '',
        '店铺名称': '',
        '平台': '',
        '团队': '',
        '净成交数据': '',
        '佣金(%)': '',
        '佣金利润': '',
        '今日消耗': '',
        '净利润': '',
        '记录数量': '',
        '创建时间': ''
      },
      // 详细数据
      ...summaryAllData.value.map((item, index) => ({
        '产品名称': item.name || '',
        '店铺名称': item.shopName || '',
        '平台': item.platform || '',
        '团队': item.team || '',
        '净成交数据': item.netTransactionData || 0,
        '佣金(%)': item.commission || 0,
        '佣金利润': item.commissionProfit || 0,
        '今日消耗': item.dailyConsumption || 0,
        '净利润': item.netProfit || 0,
        '记录数量': index + 1,
        '创建时间': item.createdAt ? formatUtcToLocalDateTime(item.createdAt) : ''
      }))
    ]

    // 使用 Excel 格式导出汇总数据
    const headers = Object.keys(exportData[0])
    const filename = `${summaryForm.productName}_汇总数据_${new Date().toLocaleDateString().replace(/\//g, '-')}`

    try {
      // 尝试导出为 Excel 格式
      exportToExcel(exportData, headers, filename, `${summaryForm.productName}汇总`)
      ElMessage.success('汇总数据导出成功（Excel格式）')
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

      ElMessage.success('汇总数据导出成功（CSV格式）')
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 批量新增相关方法
// 添加新的记录行
const addBatchRecord = () => {
  // 添加新记录时，如果有总消耗，自动填入建议的平摊值
  const suggestedConsumption = batchForm.totalDailyConsumption ?
    calculatePlatformConsumption() : 0

  batchForm.records.push({
    shopName: '',
    platform: '',
    team: '',
    netTransactionData: 0,
    commission: 0,
    dailyConsumption: suggestedConsumption,
    orderCount: 0
  })

  // 如果添加了新记录且有总消耗，重新计算平摊
  if (batchForm.totalDailyConsumption) {
    // 延迟执行，确保新记录已添加
    nextTick(() => {
      distributeTotalConsumptionToPlatforms()
    })
  }
}

// 删除记录行
const removeBatchRecord = (index) => {
  if (batchForm.records.length > 1) {
    batchForm.records.splice(index, 1)

    // 删除记录后重新计算总消耗
    updateTotalDailyConsumption()

    // 如果有总消耗设置，重新分摊到剩余平台
    if (batchForm.totalDailyConsumption) {
      nextTick(() => {
        distributeTotalConsumptionToPlatforms()
      })
    }
  }
}

// 批量新增提交
const handleBatchSubmit = async () => {
  try {
    await batchFormRef.value.validate()

    // 验证每行数据
    const validationErrors = []
    batchForm.records.forEach((record, index) => {
      if (!record.shopName && !record.platform) {
        validationErrors.push(`第${index + 1}行：店铺名称和平台至少填写一个`)
      }
      if (record.netTransactionData === null || record.netTransactionData === undefined) {
        validationErrors.push(`第${index + 1}行：请输入净成交数据`)
      }
      if (record.commission === null || record.commission === undefined) {
        validationErrors.push(`第${index + 1}行：请输入佣金`)
      }
      // 移除数值范围限制，支持负数
    })

    if (validationErrors.length > 0) {
      ElMessage.error(validationErrors[0])
      return
    }

    batchSubmitting.value = true

    // 构建要提交的记录数组
    const recordsToSubmit = batchForm.records.map(record => ({
      name: batchForm.productName,
      shopName: record.shopName || '',
      platform: record.platform || '',
      netTransactionData: parseFloat(record.netTransactionData) || 0,
      commission: parseFloat(record.commission) || 0,
      dailyConsumption: parseFloat(record.dailyConsumption) || 0, // 使用每个平台的今日消耗
      description: batchForm.description || ''
    }))

    const result = await operationalProductStore.batchAddOperationalProducts(recordsToSubmit)

    if (result.success) {
      ElMessage.success(result.message)
      showBatchAddDialog.value = false
      resetBatchForm()
      // 重新加载建议数据
      loadSuggestions()
    } else {
      if (result.errors && result.errors.length > 0) {
        ElMessage.error(result.errors[0])
      } else {
        ElMessage.error(result.message)
      }
    }
  } catch (error) {
    ElMessage.error('表单验证失败')
  } finally {
    batchSubmitting.value = false
  }
}

// 重置批量新增表单
const resetBatchForm = () => {
  Object.assign(batchForm, {
    productName: '',
    description: '',
    totalDailyConsumption: 0, // 修正字段名
    records: [
      {
        shopName: '',
        platform: '',
        team: '',
        netTransactionData: 0,
        commission: 0,
        dailyConsumption: 0, // 确保每个平台的今日消耗也被重置
        orderCount: 0
      }
    ]
  })

  // 重置计算结果
  batchCalculationResults.value = []

  if (batchFormRef.value) {
    batchFormRef.value.resetFields()
  }
}

// 导出数据
const handleExport = async () => {
  try {
    // 优先导出勾选的数据，如果没有勾选则导出所有数据
    const exportData = selectedAccountings.value.length > 0 ? selectedAccountings.value : operationalProductStore.operationalProducts

    if (exportData.length === 0) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    const data = exportData.map(item => ({
      '名称': item.name || '',
      '产品时间': item.productTime ? formatDateOnly(item.productTime) : '',
      '店铺名称': item.shopName || '',
      '平台': item.platform || '',
      '团队': item.team || '',
      '净成交数据': item.netTransactionData || 0,
      '佣金(%)': item.commission || 0,
      '佣金利润': item.commissionProfit || 0,
      '今日消耗': item.dailyConsumption || 0,
      '净利润': item.netProfit || 0,
      '备注': item.description || '',
      '创建者': item.createdBy?.username || '',
      '创建时间': item.createdAt ? formatUtcToLocalDateTime(item.createdAt) : '',
      '更新者': item.updatedBy?.username || '',
      '更新时间': item.updatedAt ? formatUtcToLocalDateTime(item.updatedAt) : ''
    }))

    // 使用 Excel 格式导出
    const headers = Object.keys(data[0])
    const exportType = selectedAccountings.value.length > 0 ? `勾选${selectedAccountings.value.length}条` : '全部'
    const filename = `运营商品数据_${exportType}_${new Date().toLocaleDateString().replace(/\//g, '-')}`

    try {
      // 尝试导出为 Excel 格式
      exportToExcel(data, headers, filename, '运营商品数据')
      const exportTypeMsg = selectedAccountings.value.length > 0 ? `勾选的${selectedAccountings.value.length}条数据` : '全部数据'
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

      const exportTypeMsg = selectedAccountings.value.length > 0 ? `勾选的${selectedAccountings.value.length}条数据` : '全部数据'
      ElMessage.success(`导出${exportTypeMsg}成功（CSV格式）`)
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 初始化默认搜索今天的数据
const initializeDefaultSearch = () => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0] // YYYY-MM-DD格式

  // 设置默认日期为今天
  searchForm.startDate = todayStr
  searchForm.endDate = todayStr
  dateRange.value = [today, today]
}

// 生命周期
onMounted(() => {
  initializeDefaultSearch() // 先设置默认搜索条件
  fetchAccountings() // 然后获取数据
  loadSuggestions()
})
</script>

<style scoped>
.commission-product {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
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

.business-input {
  width: 180px;
}

.business-input .el-input__wrapper {
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  box-shadow: none;
}

.business-input .el-input__wrapper:hover {
  border-color: #c0c4cc;
}

.business-input .el-input__wrapper.is-focus {
  border-color: #409eff;
}

.profit-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-input {
  width: 140px;
}

.range-separator {
  color: #909399;
  font-size: 14px;
  margin: 0 4px;
}

.search-actions {
  display: flex;
  gap: 8px;
  align-self: flex-start;
}



.business-btn {
  border-radius: 4px;
  font-size: 13px;
  padding: 8px 16px;
  min-width: 64px;
  height: 32px;
}

.business-btn.el-button--primary {
  background-color: #409eff;
  border-color: #409eff;
}

.business-btn.el-button--primary:hover {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

/* 操作栏 */
.action-card {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-left {
  display: flex;
  gap: 12px;
}

.action-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.total-count {
  color: #909399;
  font-size: 14px;
}

/* 按钮样式 */
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
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.stats-title-icon {
  font-size: 18px;
  color: #6366f1;
}

.stats-info-icon {
  font-size: 14px;
  color: #6b7280;
  cursor: help;

  &:hover {
    color: #4f46e5;
  }
}

.stats-toggle {
  display: flex;
  align-items: center;
}

.toggle-icon {
  font-size: 16px;
  color: #6b7280;
  transition: transform 0.3s ease;
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

.stats-content-wrapper {
  padding: 20px;
}

/* 统计卡片 */
.stats-cards {
  margin: 0;
}

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

.stats-label {
  font-size: 14px;
  color: #909399;
}

/* 表格卡片 */
.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 表格样式 */
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
  color: #e6a23c;
}

.commission.profit {
  color: #67c23a;
}

.commission.loss {
  color: #f56c6c;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: right;
  margin-top: 20px;
}

/* 计算预览卡片 */
.calculation-preview {
  margin: 16px 0;
  border: 1px solid #e4e7ed;
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

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 批量新增对话框样式 */
.batch-records {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.batch-record-item {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  background-color: #fafafa;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.batch-record-item:hover {
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

/* 批量新增计算面板 */
.calculation-panel {
  height: 100%;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 12px;
  text-align: center;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
}

.calculation-content {
  flex: 1;
}

.calc-item-compact {
  text-align: center;
  padding: 8px;
  background-color: white;
  border-radius: 6px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.calc-label-compact {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.calc-value-compact {
  font-weight: 700;
  font-size: 16px;
}

.calc-value-compact.profit {
  color: #67c23a;
}

.calc-value-compact.loss {
  color: #f56c6c;
}

.formula-info {
  margin-top: 12px;
  padding: 8px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.formula-line {
  margin-bottom: 4px;
  text-align: center;
}

.formula-line:last-child {
  margin-bottom: 0;
}

.formula-text {
  font-size: 11px;
  color: #666;
  font-family: 'Courier New', monospace;
}

.no-calculation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #999;
  font-size: 13px;
}

.calc-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: #ccc;
}

/* 批量新增汇总统计 */
.batch-summary {
  margin-top: 20px;
  padding: 16px;
  background-color: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
}

.summary-item {
  text-align: center;
  padding: 12px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
  font-weight: 500;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #374151;
}

.summary-value.profit {
  color: #059669;
}

.summary-value.loss {
  color: #dc2626;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .commission-product {
    padding: 10px;
  }

  .search-card .el-form {
    flex-direction: column;
    align-items: stretch;
  }

  .search-left {
    margin-bottom: 16px;
  }



  .action-card {
    flex-direction: column;
    gap: 16px;
  }

  .action-left {
    justify-content: center;
  }

  .stats-cards .el-col {
    margin-bottom: 16px;
  }

  /* 统计面板响应式 */
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

    .stats-value.consumption {
      color: #e6a23c;
    }
  }

  .summary-table {
    .table-header {
      margin-bottom: 15px;

      h4 {
        margin: 0;
        color: #303133;
        font-size: 16px;
        font-weight: 600;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .import-container {
    .preview-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
  }

  .summary-container {
    .summary-stats {
      .el-col {
        margin-bottom: 15px;
      }
    }

    .summary-search {
      .el-form {
        flex-direction: column;

        .el-form-item {
          margin-bottom: 15px;
          margin-right: 0;
        }
      }
    }
  }
}

/* 分摊按钮样式 */
.el-button {
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

/* 今日总消耗输入框样式 */
.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;

  .el-icon {
    font-size: 14px;
  }
}

/* 公式说明样式 */
.formula-explanation {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;

  .formula-text {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: #0f172a;

    .formula-highlight {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;

      &.profit {
        background-color: #dcfce7;
        color: #166534;
      }

      &.consumption {
        background-color: #fef3c7;
        color: #92400e;
      }
    }
  }

  .formula-calculation {
    font-size: 13px;
    color: #64748b;
    font-family: 'Courier New', monospace;
  }
}

/* 汇总统计公式卡片 */
.formula-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;

  .formula-content {
    text-align: center;

    .formula-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 16px;

      .el-icon {
        color: #3b82f6;
      }
    }

    .formula-expression {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;

      .formula-item {
        padding: 6px 12px;
        border-radius: 6px;

        &.profit {
          background-color: #dcfce7;
          color: #166534;
        }

        &.consumption {
          background-color: #fef3c7;
          color: #92400e;
        }
      }

      .formula-operator {
        font-size: 18px;
        font-weight: 700;
        color: #64748b;
      }
    }

    .formula-calculation {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 14px;
      font-family: 'Courier New', monospace;

      .calculation-result {
        font-weight: 700;
        font-size: 16px;

        &.profit {
          color: #166534;
        }

        &.loss {
          color: #dc2626;
        }
      }

      .calculation-operator {
        font-weight: 600;
        color: #64748b;
      }

      .calculation-value {
        font-weight: 600;

        &.profit {
          color: #166534;
        }

        &.consumption {
          color: #92400e;
        }
      }
    }
  }
}

/* 批量新增汇总统计样式优化 */
.batch-summary {
  .summary-item {
    text-align: center;

    .summary-value {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;

      &.profit {
        color: #166534;
      }

      &.loss {
        color: #dc2626;
      }

      &.consumption {
        color: #92400e;
      }
    }

    .summary-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
  }
}

/* 主列表页面简化版公式卡片 */
.formula-card-simple {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;

  .formula-content-simple {
    text-align: center;
    padding: 8px 0;

    .formula-expression-simple {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;

      .formula-item-simple {
        padding: 4px 8px;
        border-radius: 4px;

        &.profit {
          background-color: #dcfce7;
          color: #166534;
        }

        &.consumption {
          background-color: #fef3c7;
          color: #92400e;
        }
      }

      .formula-operator-simple {
        font-size: 16px;
        font-weight: 700;
        color: #64748b;
      }
    }

    .formula-calculation-simple {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 12px;
      font-family: 'Courier New', monospace;

      .calculation-result-simple {
        font-weight: 700;
        font-size: 14px;

        &.profit {
          color: #166534;
        }

        &.loss {
          color: #dc2626;
        }
      }

      .calculation-operator-simple {
        font-weight: 600;
        color: #64748b;
      }

      .calculation-value-simple {
        font-weight: 600;

        &.profit {
          color: #166534;
        }

        &.consumption {
          color: #92400e;
        }
      }
    }
  }
}

/* 统计卡片数值样式 */
.stats-value {
  &.consumption {
    color: #92400e;
  }

  &.profit {
    color: #166534;
  }

  &.loss {
    color: #dc2626;
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
