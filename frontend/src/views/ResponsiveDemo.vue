<template>
  <div class="responsive-demo">
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>📱 响应式适配演示</span>
        </div>
      </template>
      
      <div class="device-info">
        <el-descriptions :column="isMobileDevice ? 1 : 3" border>
          <el-descriptions-item label="设备类型">
            <el-tag :type="deviceTypeColor">{{ deviceTypeText }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前断点">
            <el-tag>{{ breakpoint.toUpperCase() }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="窗口尺寸">
            {{ windowWidth }} × {{ windowHeight }}
          </el-descriptions-item>
          <el-descriptions-item label="屏幕方向">
            {{ isPortrait ? '竖屏' : '横屏' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 响应式表格演示 -->
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>📊 响应式表格演示</span>
          <el-button size="small" @click="loadTableData">刷新数据</el-button>
        </div>
      </template>
      
      <ResponsiveTable
        :data="tableData"
        :loading="tableLoading"
        :mobile-columns="mobileColumns"
        :has-actions="true"
        row-key="id"
        @row-click="handleRowClick"
      >
        <!-- 桌面端表格列 -->
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="department" label="部门" width="120" />
        <el-table-column prop="position" label="职位" width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '在职' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        
        <!-- 移动端操作按钮 -->
        <template #mobile-actions="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          <el-button size="small" @click="handleView(row)">查看</el-button>
        </template>
      </ResponsiveTable>
    </el-card>

    <!-- 响应式表单演示 -->
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>📝 响应式表单演示</span>
        </div>
      </template>
      
      <ResponsiveForm
        ref="formRef"
        :model="formData"
        :rules="formRules"
      >
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12">
            <el-form-item label="部门" prop="department">
              <el-select v-model="formData.department" placeholder="请选择部门">
                <el-option label="技术部" value="tech" />
                <el-option label="产品部" value="product" />
                <el-option label="运营部" value="operation" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" type="email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24" :sm="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24">
            <el-form-item label="入职日期" prop="joinDate">
              <el-date-picker
                v-model="formData.joinDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="formData.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入备注"
              />
            </el-form-item>
          </el-col>
          
          <el-col :xs="24">
            <el-form-item class="form-actions">
              <el-button type="primary" @click="handleSubmit">提交</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </ResponsiveForm>
    </el-card>

    <!-- 响应式栅格演示 -->
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>📐 响应式栅格演示</span>
        </div>
      </template>
      
      <el-row :gutter="gridConfig.gutter">
        <el-col
          v-for="i in 6"
          :key="i"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
          :xl="4"
        >
          <div class="grid-item">
            <div class="grid-content">
              <h3>卡片 {{ i }}</h3>
              <p>响应式栅格布局</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useResponsive, getResponsiveGridConfig } from '@/utils/responsive'
import ResponsiveTable from '@/components/ResponsiveTable.vue'
import ResponsiveForm from '@/components/ResponsiveForm.vue'

// 响应式检测
const {
  windowWidth,
  windowHeight,
  breakpoint,
  deviceType,
  isMobileDevice,
  isPortrait
} = useResponsive()

// 设备类型显示
const deviceTypeText = computed(() => {
  const map = {
    mobile: '移动端',
    tablet: '平板',
    desktop: '桌面'
  }
  return map[deviceType.value] || '未知'
})

const deviceTypeColor = computed(() => {
  const map = {
    mobile: 'success',
    tablet: 'warning',
    desktop: 'primary'
  }
  return map[deviceType.value] || 'info'
})

// 栅格配置
const gridConfig = computed(() => getResponsiveGridConfig(deviceType.value))

// 表格数据
const tableLoading = ref(false)
const tableData = ref([
  { id: 1, name: '张三', department: '技术部', position: '前端工程师', email: 'zhangsan@example.com', phone: '13800138000', status: '在职' },
  { id: 2, name: '李四', department: '产品部', position: '产品经理', email: 'lisi@example.com', phone: '13800138001', status: '在职' },
  { id: 3, name: '王五', department: '运营部', position: '运营专员', email: 'wangwu@example.com', phone: '13800138002', status: '离职' },
  { id: 4, name: '赵六', department: '技术部', position: '后端工程师', email: 'zhaoliu@example.com', phone: '13800138003', status: '在职' },
  { id: 5, name: '孙七', department: '设计部', position: 'UI设计师', email: 'sunqi@example.com', phone: '13800138004', status: '在职' }
])

// 移动端表格列配置
const mobileColumns = [
  { prop: 'name', label: '姓名', primary: true },
  { prop: 'department', label: '部门' },
  { prop: 'position', label: '职位' },
  { prop: 'status', label: '状态', formatter: (row) => row.status }
]

// 表单数据
const formRef = ref(null)
const formData = ref({
  name: '',
  department: '',
  email: '',
  phone: '',
  joinDate: '',
  remark: ''
})

const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  department: [{ required: true, message: '请选择部门', trigger: 'change' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }]
}

// 方法
const loadTableData = () => {
  tableLoading.value = true
  setTimeout(() => {
    tableLoading.value = false
    ElMessage.success('数据刷新成功')
  }, 1000)
}

const handleRowClick = (row) => {
  console.log('点击行:', row)
}

const handleEdit = (row) => {
  ElMessage.info(`编辑: ${row.name}`)
}

const handleDelete = (row) => {
  ElMessage.warning(`删除: ${row.name}`)
}

const handleView = (row) => {
  ElMessage.info(`查看: ${row.name}`)
}

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('表单提交成功')
      console.log('表单数据:', formData.value)
    }
  })
}

const handleReset = () => {
  formRef.value.resetFields()
  ElMessage.info('表单已重置')
}
</script>

<style scoped>
.responsive-demo {
  width: 100%;
}

.info-card,
.demo-card {
  margin-bottom: 20px;
}

@media (max-width: 767px) {
  .info-card,
  .demo-card {
    margin-bottom: 12px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.device-info {
  margin-top: 16px;
}

.grid-item {
  margin-bottom: 16px;
}

.grid-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.grid-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.grid-content p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}
</style>

