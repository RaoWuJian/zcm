<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑日数据报表' : '新增日数据报表'"
    width="800px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      @submit.prevent
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="日期" prop="date">
            <el-date-picker
              v-model="form.date"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="组别" prop="group">
            <el-input
              v-model="form.group"
              placeholder="请输入组别"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="投放产品" prop="product">
            <el-input
              v-model="form.product"
              placeholder="请输入产品名称"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="推广费" prop="promotionCost">
            <el-input-number
              v-model="form.promotionCost"
              :min="0"
              :precision="2"
              placeholder="推广费"
              style="width: 100%"
              @change="calculateROI"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="总销售额" prop="totalSalesAmount">
            <el-input-number
              v-model="form.totalSalesAmount"
              :min="0"
              :precision="2"
              placeholder="总销售额"
              style="width: 100%"
              @change="calculateROI"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="总销售数" prop="totalSalesCount">
            <el-input-number
              v-model="form.totalSalesCount"
              :min="0"
              :precision="0"
              placeholder="总销售数"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="投放ROI">
            <el-input
              :model-value="roiDisplay"
              readonly
              placeholder="自动计算"
            >
              <template #suffix>%</template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="汇报人" prop="reporter">
            <el-select
              v-model="form.reporter"
              placeholder="请选择汇报人"
              style="width: 100%"
              filterable
              remote
              reserve-keyword
              :remote-method="searchUsers"
              :loading="userLoading"
              clearable
              @focus="handleUserSelectFocus"
            >
              <el-option
                v-for="user in filteredUserOptions"
                :key="user.value"
                :label="user.label"
                :value="user.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="抄送人" prop="ccUsers">
        <el-select
          v-model="form.ccUsers"
          placeholder="请选择抄送人（可多选）"
          style="width: 100%"
          multiple
          filterable
          remote
          reserve-keyword
          :remote-method="searchUsers"
          :loading="userLoading"
          clearable
          collapse-tags
          collapse-tags-tooltip
          @focus="handleUserSelectFocus"
        >
          <el-option
            v-for="user in filteredUserOptions"
            :key="user.value"
            :label="user.label"
            :value="user.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
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
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { dailyReportApi, employeeApi } from '@/api/index'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  data: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['close', 'success'])

// 响应式数据
const formRef = ref()
const loading = ref(false)
const userOptions = ref([])
const filteredUserOptions = ref([])
const userLoading = ref(false)

// 表单数据
const form = reactive({
  date: '',
  group: '',
  product: '',
  promotionCost: 0,
  totalSalesAmount: 0,
  totalSalesCount: 0,
  reporter: '',
  ccUsers: [],
  remark: ''
})

// 表单验证规则
const rules = {
  date: [
    { required: true, message: '请选择日期', trigger: 'change' }
  ],
  group: [
    { required: true, message: '请输入组别', trigger: 'blur' },
    { max: 50, message: '组别名称最多50个字符', trigger: 'blur' }
  ],
  product: [
    { required: true, message: '请输入投放产品', trigger: 'blur' },
    { max: 100, message: '产品名称最多100个字符', trigger: 'blur' }
  ],
  promotionCost: [
    { required: true, message: '请输入推广费', trigger: 'blur' },
    { type: 'number', min: 0, message: '推广费必须大于等于0', trigger: 'blur' }
  ],
  totalSalesAmount: [
    { required: true, message: '请输入总销售额', trigger: 'blur' },
    { type: 'number', min: 0, message: '总销售额必须大于等于0', trigger: 'blur' }
  ],
  totalSalesCount: [
    { required: true, message: '请输入总销售数', trigger: 'blur' },
    { type: 'number', min: 0, message: '总销售数必须大于等于0', trigger: 'blur' }
  ],
  reporter: [
    { required: true, message: '请选择汇报人', trigger: 'change' }
  ],
  remark: [
    { max: 500, message: '备注最多500个字符', trigger: 'blur' }
  ]
}

// 计算属性
const isEdit = computed(() => {
  return props.data && props.data._id
})

const roiDisplay = computed(() => {
  if (form.promotionCost > 0) {
    const roi = ((form.totalSalesAmount - form.promotionCost) / form.promotionCost * 100)
    return roi.toFixed(2)
  }
  return '0.00'
})

// 计算ROI
const calculateROI = () => {
  // ROI会通过计算属性自动更新
}

// 获取用户列表
const fetchUsers = async (query = '', limit = 50) => {
  try {
    userLoading.value = true
    const params = { limit }
    if (query) {
      params.search = query
    }

    const response = await employeeApi.getUsersForReport(params)
    if (response && response.success) {
      const users = response.data.map(user => ({
        label: `${user.username} (${user.departmentPath || '未分配部门'})`,
        value: user._id,
        username: user.username,
        department: user.departmentPath || '未分配部门'
      }))

      if (query) {
        // 搜索时直接设置过滤结果
        filteredUserOptions.value = users
      } else {
        // 初始加载时设置所有用户和过滤结果
        userOptions.value = users
        filteredUserOptions.value = users
      }
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    userLoading.value = false
  }
}

// 搜索用户
const searchUsers = (query) => {
  if (query && query.trim()) {
    fetchUsers(query, 50) // 搜索时返回更多结果
  } else {
    // 没有搜索词时显示初始的20条
    filteredUserOptions.value = userOptions.value
  }
}

// 处理下拉框获得焦点
const handleUserSelectFocus = () => {
  if (filteredUserOptions.value.length === 0) {
    fetchUsers('', 50) // 初始加载50条
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    date: new Date().toISOString().split('T')[0], // 默认今天
    group: '',
    product: '',
    promotionCost: 0,
    totalSalesAmount: 0,
    totalSalesCount: 0,
    reporter: '',
    ccUsers: [],
    remark: ''
  })
  formRef.value?.clearValidate()
}

// 填充表单数据
const fillForm = (data) => {
  if (data && data._id) {
    Object.assign(form, {
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
      group: data.group || '',
      product: data.product || '',
      promotionCost: data.promotionCost || 0,
      totalSalesAmount: data.totalSalesAmount || 0,
      totalSalesCount: data.totalSalesCount || 0,
      reporter: data.reporter?._id || data.reporter || '',
      ccUsers: data.ccUsers?.map(user => user._id || user) || [],
      remark: data.remark || ''
    })
  } else {
    resetForm()
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    loading.value = true

    const submitData = { ...form }
    
    if (isEdit.value) {
      await dailyReportApi.updateDailyDataReport(props.data._id, submitData)
      ElMessage.success('日数据报表更新成功')
    } else {
      await dailyReportApi.createDailyDataReport(submitData)
      ElMessage.success('日数据报表创建成功')
    }

    emit('success')
    handleClose()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error(error.response?.data?.message || '操作失败')
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  emit('close')
}

// 监听数据变化
watch(() => props.data, (newData) => {
  fillForm(newData)
}, { immediate: true })

watch(() => props.visible, (visible) => {
  if (visible) {
    fillForm(props.data)
  }
})

// 初始化
onMounted(() => {
  resetForm()
  // 不在这里预加载用户，而是在下拉框获得焦点时加载
})
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}
</style>
