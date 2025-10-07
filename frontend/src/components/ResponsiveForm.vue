<template>
  <el-form
    ref="formRef"
    v-bind="$attrs"
    :model="model"
    :rules="rules"
    :label-position="formLabelPosition"
    :label-width="formLabelWidth"
    class="responsive-form"
    :class="{ 'mobile-form': isMobileDevice }"
  >
    <slot></slot>
  </el-form>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useResponsive } from '@/utils/responsive'

const props = defineProps({
  model: {
    type: Object,
    required: true
  },
  rules: {
    type: Object,
    default: () => ({})
  },
  // 桌面端标签位置
  desktopLabelPosition: {
    type: String,
    default: 'right'
  },
  // 移动端标签位置
  mobileLabelPosition: {
    type: String,
    default: 'top'
  },
  // 桌面端标签宽度
  desktopLabelWidth: {
    type: String,
    default: '100px'
  },
  // 移动端标签宽度
  mobileLabelWidth: {
    type: String,
    default: 'auto'
  }
})

// 表单引用
const formRef = ref()

// 响应式检测
const { isMobileDevice } = useResponsive()

// 表单标签位置
const formLabelPosition = computed(() => {
  return isMobileDevice.value ? props.mobileLabelPosition : props.desktopLabelPosition
})

// 表单标签宽度
const formLabelWidth = computed(() => {
  return isMobileDevice.value ? props.mobileLabelWidth : props.desktopLabelWidth
})

// 暴露表单方法
defineExpose({
  validate: (...args) => formRef.value?.validate(...args),
  validateField: (...args) => formRef.value?.validateField(...args),
  resetFields: (...args) => formRef.value?.resetFields(...args),
  clearValidate: (...args) => formRef.value?.clearValidate(...args),
  scrollToField: (...args) => formRef.value?.scrollToField(...args)
})
</script>

<style scoped>
.responsive-form {
  width: 100%;
}

/* 移动端表单样式 */
.mobile-form {
  padding: 0;
}

.mobile-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.mobile-form :deep(.el-form-item__label) {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  line-height: 32px;
  padding-bottom: 4px;
}

.mobile-form :deep(.el-form-item__content) {
  line-height: 44px;
}

/* 移动端输入框样式 */
.mobile-form :deep(.el-input__wrapper) {
  min-height: 44px;
  padding: 8px 12px;
}

.mobile-form :deep(.el-input__inner) {
  font-size: 14px;
  height: auto;
  line-height: 1.5;
}

.mobile-form :deep(.el-textarea__inner) {
  font-size: 14px;
  padding: 12px;
  min-height: 80px;
}

/* 移动端选择器样式 */
.mobile-form :deep(.el-select) {
  width: 100%;
}

.mobile-form :deep(.el-select .el-input__wrapper) {
  min-height: 44px;
}

/* 移动端日期选择器样式 */
.mobile-form :deep(.el-date-editor) {
  width: 100%;
}

.mobile-form :deep(.el-date-editor .el-input__wrapper) {
  min-height: 44px;
}

/* 移动端按钮样式 */
.mobile-form :deep(.el-button) {
  min-height: 44px;
  padding: 10px 20px;
  font-size: 15px;
  border-radius: 6px;
}

/* 移动端单选框/复选框样式 */
.mobile-form :deep(.el-radio),
.mobile-form :deep(.el-checkbox) {
  margin-right: 16px;
  margin-bottom: 8px;
}

.mobile-form :deep(.el-radio__label),
.mobile-form :deep(.el-checkbox__label) {
  font-size: 14px;
  padding-left: 8px;
}

.mobile-form :deep(.el-radio__inner),
.mobile-form :deep(.el-checkbox__inner) {
  width: 18px;
  height: 18px;
}

/* 移动端开关样式 */
.mobile-form :deep(.el-switch) {
  height: 28px;
}

.mobile-form :deep(.el-switch__core) {
  height: 28px;
  min-width: 50px;
}

/* 移动端表单错误提示 */
.mobile-form :deep(.el-form-item__error) {
  font-size: 13px;
  padding-top: 4px;
  line-height: 1.4;
}

/* 移动端表单按钮组 */
.mobile-form :deep(.form-actions) {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.mobile-form :deep(.form-actions .el-button) {
  flex: 1;
}
</style>

