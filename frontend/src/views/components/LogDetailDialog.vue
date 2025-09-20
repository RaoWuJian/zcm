<template>
  <el-dialog
    v-model="visible"
    title="操作日志详情"
    width="800px"
    :before-close="handleClose"
  >
    <div v-if="log" class="log-detail">
      <!-- 基本信息 -->
      <el-descriptions title="基本信息" :column="2" border>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getOperationTypeTagType(log.operationType)">
            {{ getOperationTypeText(log.operationType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作模块">
          <el-tag :type="getModuleTagType(log.module)" effect="plain">
            {{ getModuleText(log.module) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="资源ID">
          {{ log.resourceId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="资源名称">
          {{ log.resourceName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">
          {{ log.description }}
        </el-descriptions-item>
        <el-descriptions-item label="操作结果">
          <el-tag :type="log.result === 'SUCCESS' ? 'success' : 'danger'">
            {{ log.result === 'SUCCESS' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ formatDate(log.operatedAt) }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 操作人信息 -->
      <el-descriptions title="操作人信息" :column="2" border style="margin-top: 20px">
        <el-descriptions-item label="操作人姓名">
          {{ log.operatorName }}
        </el-descriptions-item>
        <el-descriptions-item label="操作人账号">
          {{ log.operatorAccount }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 请求信息 -->
      <el-descriptions title="请求信息" :column="2" border style="margin-top: 20px">
        <el-descriptions-item label="请求方法">
          <el-tag size="small">{{ log.requestInfo?.method || '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="请求URL">
          {{ log.requestInfo?.url || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ log.requestInfo?.ip || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="用户代理" :span="2">
          <div class="user-agent">
            {{ log.requestInfo?.userAgent || '-' }}
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 数据变更 -->
      <div v-if="log.beforeData || log.afterData" style="margin-top: 20px">
        <h4>数据变更</h4>
        <el-tabs type="border-card">
          <el-tab-pane v-if="log.beforeData" label="变更前数据">
            <pre class="json-data">{{ formatJson(log.beforeData) }}</pre>
          </el-tab-pane>
          <el-tab-pane v-if="log.afterData" label="变更后数据">
            <pre class="json-data">{{ formatJson(log.afterData) }}</pre>
          </el-tab-pane>
          <el-tab-pane v-if="log.beforeData && log.afterData" label="差异对比">
            <div class="diff-view">
              <div class="diff-section">
                <h5>变更前</h5>
                <pre class="json-data before">{{ formatJson(log.beforeData) }}</pre>
              </div>
              <div class="diff-section">
                <h5>变更后</h5>
                <pre class="json-data after">{{ formatJson(log.afterData) }}</pre>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 错误信息 -->
      <div v-if="log.errorMessage" style="margin-top: 20px">
        <h4>错误信息</h4>
        <el-alert
          :title="log.errorMessage"
          type="error"
          :closable="false"
          show-icon
        />
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
import { computed } from 'vue'
import { useOperationLogStore } from '@/stores/operationLog'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  log: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const store = useOperationLogStore()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

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

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 格式化JSON
const formatJson = (data) => {
  if (!data) return ''
  try {
    return JSON.stringify(data, null, 2)
  } catch (error) {
    return String(data)
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.log-detail {
  max-height: 600px;
  overflow-y: auto;
}

.user-agent {
  word-break: break-all;
  font-size: 12px;
  color: #666;
}

.json-data {
  background-color: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.diff-view {
  display: flex;
  gap: 20px;
}

.diff-section {
  flex: 1;
}

.diff-section h5 {
  margin: 0 0 10px 0;
  color: #606266;
}

.json-data.before {
  border-left: 4px solid #f56c6c;
}

.json-data.after {
  border-left: 4px solid #67c23a;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
