<template>
  <div class="design-request-container">
    <!-- 搜索区域 -->
    <div class="search-card business-style">
      <el-form :model="searchForm" class="business-search-form">
        <div class="search-fields">
          <el-form-item label="状态" class="search-item">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
              class="business-select"
            >
              <el-option label="待处理" value="pending" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </el-form-item>

          <el-form-item label="关键字" class="search-item">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索需求描述或备注"
              clearable
              class="business-input"
            />
          </el-form-item>
        </div>

        <div class="search-actions">
          <el-button type="primary" :icon="Search" @click="handleSearch" class="business-btn">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset" class="business-btn">
            重置
          </el-button>
        </div>
      </el-form>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-card">
      <div class="action-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd" class="action-btn">
          新增需求
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
          class="action-btn"
        >
          批量删除
        </el-button>
        <el-button :icon="Refresh" @click="fetchData" class="action-btn">
          刷新
        </el-button>
      </div>
      <div class="total-count">
        共 {{ pagination.total || 0 }} 条记录
      </div>
    </div>

    <!-- 表格区域 -->
    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        max-height="600"
        @selection-change="handleSelectionChange"
        class="table-container"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="createdAt" label="时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="requirement" label="需求" min-width="200" show-overflow-tooltip />
        <el-table-column prop="department.departmentName" label="部门" width="120" />
        <el-table-column label="图片" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.images && row.images.length > 0" type="success">
              {{ row.images.length }}
            </el-tag>
            <el-tag v-else type="info">0</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedDesigner.username" label="分配美工" width="120">
          <template #default="{ row }">
            <span v-if="row.assignedDesigner">{{ row.assignedDesigner.username }}</span>
            <el-tag v-else type="info" size="small">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="expectedCompletionDate" label="预计完成时间" width="120">
          <template #default="{ row }">
            <span v-if="row.expectedCompletionDate">{{ formatDate(row.expectedCompletionDate, 'date') }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="贴图文件" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.attachmentFiles && row.attachmentFiles.length > 0" type="success">
              {{ row.attachmentFiles.length }}
            </el-tag>
            <el-tag v-else type="info">0</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="completedAt" label="已完成时间" width="120">
          <template #default="{ row }">
            <span v-if="row.completedAt">{{ formatDate(row.completedAt, 'date') }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pending'" type="warning">待处理</el-tag>
            <el-tag v-else-if="row.status === 'in_progress'" type="primary">进行中</el-tag>
            <el-tag v-else-if="row.status === 'completed'" type="success">已完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleView(row)">查看</el-button>
            <el-button type="warning" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="dialogTitle"
      width="800px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="需求描述" prop="requirement">
          <el-input
            v-model="form.requirement"
            type="textarea"
            :rows="4"
            placeholder="请输入需求描述"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="图片">
          <div class="image-upload-container">
            <div class="image-list">
              <!-- 已上传的图片 -->
              <div v-for="(image, index) in formImages" :key="index" class="image-item">
                <el-image
                  :src="getImageUrl(image)"
                  fit="cover"
                  :preview-src-list="formImages.map(img => getImageUrl(img))"
                  :initial-index="index"
                  class="uploaded-image"
                />
                <div class="image-actions">
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    circle
                    @click="removeImage(index)"
                  />
                </div>
              </div>

              <!-- 上传按钮 -->
              <el-upload
                v-if="!formImages || formImages.length < 9"
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
              支持 JPG、PNG、GIF 格式，单个文件不超过 5MB，最多上传 9 张图片
            </el-text>
          </div>
        </el-form-item>

        <el-form-item label="分配美工">
          <el-select
            v-model="form.assignedDesigner"
            placeholder="请选择美工"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="user in userList"
              :key="user._id"
              :label="user.username"
              :value="user._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="预计完成时间">
          <el-date-picker
            v-model="form.expectedCompletionDate"
            type="date"
            placeholder="选择预计完成时间"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="贴图文件">
          <el-upload
            ref="fileUploadRef"
            :auto-upload="false"
            :on-change="handleAttachmentChange"
            :on-remove="handleAttachmentRemove"
            :file-list="attachmentFileList"
            multiple
          >
            <el-button :icon="Upload">选择文件</el-button>
          </el-upload>
          <div class="upload-tips">
            <el-text size="small" type="info">
              支持常见文件格式，单个文件不超过 10MB
            </el-text>
          </div>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注">
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
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="showViewDialog"
      title="需求详情"
      width="800px"
    >
      <el-descriptions v-if="viewData" :column="2" border>
        <el-descriptions-item label="时间">
          {{ formatDate(viewData.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="部门">
          {{ viewData.department?.departmentName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="需求描述" :span="2">
          {{ viewData.requirement }}
        </el-descriptions-item>
        <el-descriptions-item label="分配美工">
          {{ viewData.assignedDesigner?.username || '未分配' }}
        </el-descriptions-item>
        <el-descriptions-item label="预计完成时间">
          {{ viewData.expectedCompletionDate ? formatDate(viewData.expectedCompletionDate, 'date') : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="已完成时间">
          {{ viewData.completedAt ? formatDate(viewData.completedAt, 'date') : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="viewData.status === 'pending'" type="warning">待处理</el-tag>
          <el-tag v-else-if="viewData.status === 'in_progress'" type="primary">进行中</el-tag>
          <el-tag v-else-if="viewData.status === 'completed'" type="success">已完成</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="图片" :span="2">
          <div v-if="viewData.images && viewData.images.length > 0" class="view-images">
            <el-image
              v-for="(image, index) in viewData.images"
              :key="index"
              :src="getImageUrl(image)"
              fit="cover"
              :preview-src-list="viewData.images.map(img => getImageUrl(img))"
              :initial-index="index"
              class="view-image"
            />
          </div>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="贴图文件" :span="2">
          <div v-if="viewData.attachmentFiles && viewData.attachmentFiles.length > 0">
            <div v-for="file in viewData.attachmentFiles" :key="file._id" class="file-item">
              <el-link :href="getFileUrl(file._id)" target="_blank" :icon="Download">
                {{ file.originalName }}
              </el-link>
            </div>
          </div>
          <span v-else>无</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ viewData.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Delete, Upload, Download } from '@element-plus/icons-vue'
import { designRequestApi, fileApi, employeeApi } from '@/api/index'
import { formatDate as formatDateUtil } from '@/utils/dateUtils'

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const showDialog = ref(false)
const showViewDialog = ref(false)
const viewData = ref(null)
const editingId = ref(null)
const formRef = ref(null)
const uploadRef = ref(null)
const fileUploadRef = ref(null)
const userList = ref([])

// 搜索表单
const searchForm = reactive({
  status: '',
  keyword: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  pages: 0
})

// 表单数据
const form = reactive({
  requirement: '',
  images: [],
  assignedDesigner: null,
  expectedCompletionDate: null,
  attachmentFiles: [],
  status: 'pending',
  remark: ''
})

// 图片相关
const formImages = ref([])
const pendingImageFiles = ref([])

// 附件相关
const attachmentFileList = ref([])
const pendingAttachmentFiles = ref([])

// 表单验证规则
const formRules = {
  requirement: [
    { required: true, message: '请输入需求描述', trigger: 'blur' },
    { max: 1000, message: '需求描述最多1000个字符', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  return editingId.value ? '编辑美工需求' : '新增美工需求'
})

// 格式化日期
const formatDate = (date, type = 'datetime') => {
  if (!date) return '-'
  return formatDateUtil(date, type)
}

// 获取图片URL
const getImageUrl = (image) => {
  // 如果是新上传的图片（带预览URL）
  if (image && image.url && image.isNew) {
    return image.url
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  if (typeof image === 'string') {
    return `${baseUrl}/files/${image}`
  }
  if (image && image._id) {
    return `${baseUrl}/files/${image._id}`
  }
  return ''
}

// 获取文件URL
const getFileUrl = (fileId) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  return `${baseUrl}/files/${fileId}`
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    const response = await designRequestApi.getDesignRequests(params)
    if (response.success) {
      tableData.value = response.data
      if (response.pagination) {
        Object.assign(pagination, response.pagination)
      }
    } else {
      ElMessage.error(response.message || '获取数据失败')
    }
  } catch (error) {
    // 显示具体的错误信息给用户
    let errorMessage = '获取数据失败，请稍后重试'

    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    const response = await employeeApi.getEmployees({ limit: 1000 })
    if (response.success) {
      userList.value = response.data
    } else {
      ElMessage.error(response.message || '获取用户列表失败')
    }
  } catch (error) {
    // 获取用户列表失败不影响主要功能
    // 如果需要提示用户，可以取消下面的注释
    // let errorMessage = '获取用户列表失败'
    // if (error.response && error.response.data && error.response.data.message) {
    //   errorMessage = error.response.data.message
    // }
    // ElMessage.warning(errorMessage)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 重置
const handleReset = () => {
  searchForm.status = ''
  searchForm.keyword = ''
  pagination.page = 1
  fetchData()
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

const handleSizeChange = (size) => {
  pagination.limit = size
  pagination.page = 1
  fetchData()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 重置表单
const resetForm = () => {
  form.requirement = ''
  form.images = []
  form.assignedDesigner = null
  form.expectedCompletionDate = null
  form.attachmentFiles = []
  form.status = 'pending'
  form.remark = ''
  formImages.value = []
  pendingImageFiles.value = []
  attachmentFileList.value = []
  pendingAttachmentFiles.value = []
  editingId.value = null
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 新增
const handleAdd = () => {
  resetForm()
  showDialog.value = true
}

// 编辑
const handleEdit = (row) => {
  resetForm()
  editingId.value = row._id
  form.requirement = row.requirement
  form.assignedDesigner = row.assignedDesigner?._id || null
  form.expectedCompletionDate = row.expectedCompletionDate
  form.status = row.status
  form.remark = row.remark || ''

  // 设置已有图片
  if (row.images && row.images.length > 0) {
    formImages.value = row.images.map(img => img._id || img)
  }

  // 设置已有附件
  if (row.attachmentFiles && row.attachmentFiles.length > 0) {
    attachmentFileList.value = row.attachmentFiles.map((file, index) => ({
      uid: file._id || `existing-${index}`,  // el-upload 需要 uid 来识别文件
      name: file.originalName,
      url: getFileUrl(file._id),
      id: file._id,
      status: 'success'  // 标记为已上传成功
    }))
  }

  showDialog.value = true
}

// 查看
const handleView = (row) => {
  viewData.value = row
  showViewDialog.value = true
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个美工需求吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await designRequestApi.deleteDesignRequest(row._id)
    if (response.success) {
      ElMessage.success(response.message || '删除成功')
      fetchData()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      // 显示具体的错误信息给用户
      let errorMessage = '删除失败，请稍后重试'

      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      ElMessage.error(errorMessage)
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的美工需求')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个美工需求吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const ids = selectedRows.value.map(row => row._id)
    const response = await designRequestApi.batchDeleteDesignRequests(ids)
    if (response.success) {
      ElMessage.success(response.message || '批量删除成功')
      fetchData()
    } else {
      ElMessage.error(response.message || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      // 显示具体的错误信息给用户
      let errorMessage = '批量删除失败，请稍后重试'

      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      ElMessage.error(errorMessage)
    }
  }
}

// 图片上传前验证
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

// 图片文件变化
const handleFileChange = (file, fileList) => {
  if (formImages.value.length + pendingImageFiles.value.length >= 9) {
    ElMessage.warning('最多只能上传9张图片')
    return
  }

  // 添加到待上传列表
  pendingImageFiles.value.push(file.raw)

  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    formImages.value.push({
      url: e.target.result,
      isNew: true,
      file: file.raw
    })
  }
  reader.readAsDataURL(file.raw)
}

// 移除图片
const removeImage = (index) => {
  const image = formImages.value[index]

  // 如果是新上传的图片，也要从待上传列表中移除
  if (image && image.isNew) {
    const fileIndex = pendingImageFiles.value.findIndex(f => f === image.file)
    if (fileIndex > -1) {
      pendingImageFiles.value.splice(fileIndex, 1)
    }
  }

  formImages.value.splice(index, 1)
}

// 附件文件变化
const handleAttachmentChange = (file, fileList) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    fileList.pop()
    return
  }

  pendingAttachmentFiles.value.push(file.raw)
  attachmentFileList.value = fileList
}

// 附件文件移除
const handleAttachmentRemove = (file, fileList) => {
  // 更新文件列表
  attachmentFileList.value = fileList

  // 如果是新上传的文件（在待上传列表中），也要移除
  const index = pendingAttachmentFiles.value.findIndex(f => f === file.raw)
  if (index > -1) {
    pendingAttachmentFiles.value.splice(index, 1)
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
    // 提取后端返回的具体错误信息
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message)
    }
    throw error
  }
}

// 上传单个附件文件
const uploadSingleAttachment = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await fileApi.uploadFile(formData)
    if (response.success && response.data) {
      return response.data._id || response.data.id
    } else {
      throw new Error(response.message || '文件上传失败')
    }
  } catch (error) {
    // 提取后端返回的具体错误信息
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message)
    }
    throw error
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  submitLoading.value = true

  try {
    // 上传新图片
    const uploadedImageIds = []
    if (pendingImageFiles.value.length > 0) {
      for (const file of pendingImageFiles.value) {
        try {
          const imageId = await uploadSingleImage(file)
          uploadedImageIds.push(imageId)
        } catch (error) {
          ElMessage.error(`图片上传失败: ${error.message}`)
          submitLoading.value = false
          return
        }
      }
    }

    // 上传新附件
    const uploadedAttachmentIds = []
    if (pendingAttachmentFiles.value.length > 0) {
      for (const file of pendingAttachmentFiles.value) {
        try {
          const fileId = await uploadSingleAttachment(file)
          uploadedAttachmentIds.push(fileId)
        } catch (error) {
          ElMessage.error(`文件上传失败: ${error.message}`)
          submitLoading.value = false
          return
        }
      }
    }

    // 合并图片ID（过滤掉新上传的预览对象，只保留已有的ID）
    const existingImageIds = formImages.value
      .filter(img => !img.isNew && (typeof img === 'string' || img._id))
      .map(img => typeof img === 'string' ? img : img._id)
    const allImageIds = [...existingImageIds, ...uploadedImageIds]

    // 合并附件ID（保留已有的附件）
    const existingAttachmentIds = attachmentFileList.value
      .filter(file => file.id)
      .map(file => file.id)
    const allAttachmentIds = [...existingAttachmentIds, ...uploadedAttachmentIds]

    // 准备提交数据
    const submitData = {
      requirement: form.requirement,
      images: allImageIds,
      assignedDesigner: form.assignedDesigner || null,
      expectedCompletionDate: form.expectedCompletionDate || null,
      attachmentFiles: allAttachmentIds,
      status: form.status,
      remark: form.remark
    }

    let response
    if (editingId.value) {
      response = await designRequestApi.updateDesignRequest(editingId.value, submitData)
    } else {
      response = await designRequestApi.createDesignRequest(submitData)
    }

    if (response.success) {
      ElMessage.success(response.message || (editingId.value ? '更新成功' : '创建成功'))
      showDialog.value = false
      resetForm()
      fetchData()
    } else {
      // 后端返回 success: false 的情况
      ElMessage.error(response.message || '操作失败')
    }
  } catch (error) {
    // 显示具体的错误信息给用户
    let errorMessage = '操作失败，请稍后重试'

    if (error.response && error.response.data && error.response.data.message) {
      // 后端返回的错误信息
      errorMessage = error.response.data.message
    } else if (error.message) {
      // 前端错误信息
      errorMessage = error.message
    }

    ElMessage.error(errorMessage)
  } finally {
    submitLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchData()
  fetchUsers()
})
</script>

<style scoped>
.design-request-container {
  padding: 20px;
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
}

.business-select {
  width: 180px;
}

.business-input {
  width: 200px;
}

.search-actions {
  display: flex;
  gap: 8px;
  align-self: flex-start;
}

.business-btn {
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
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
  flex-wrap: wrap;
}

.action-btn {
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
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

.pagination-wrapper {
  display: flex;
    justify-content: flex-end;
  margin-top: 24px;
}

.text-muted {
  color: #909399;
}

/* 图片上传相关样式 */
.image-upload-container {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-item {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  padding: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-item:hover .image-actions {
  opacity: 1;
}

.image-uploader {
  width: 100px;
  height: 100px;
}

.upload-trigger {
  width: 100px;
  height: 100px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-trigger:hover {
  border-color: #409eff;
}

.upload-icon {
  font-size: 24px;
  color: #8c939d;
}

.upload-text {
  margin-top: 8px;
  font-size: 12px;
  color: #8c939d;
}

.upload-tips {
  margin-top: 8px;
}

/* 查看详情样式 */
.view-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.view-image {
  width: 100px;
  height: 100px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
}

.file-item {
  margin-bottom: 8px;
}

/* 响应式设计 - 移动端适配 */
@media (max-width: 768px) {
  .design-request-container {
    padding: 12px;
  }

  /* 搜索区域移动端适配 */
  .search-card.business-style {
    padding: 16px;
  }

  .search-fields {
    flex-direction: column;
    gap: 12px;
  }

  .search-item {
    width: 100%;
  }

  .business-select,
  .business-input {
    width: 100%;
  }

  .search-actions {
    width: 100%;
    justify-content: stretch;
  }

  .search-actions .el-button {
    flex: 1;
  }

  /* 操作栏移动端适配 */
  .action-card {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 12px 16px;
  }

  .action-left {
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    width: 100%;
  }

  .total-count {
    text-align: center;
  }

  /* 表格移动端适配 */
  .table-card {
    padding: 12px;
    overflow-x: auto;
  }

  /* 分页移动端适配 */
  .pagination-wrapper {
    margin-top: 16px;
  }

  .pagination-wrapper :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }

  /* 图片列表移动端适配 */
  .image-list {
    gap: 8px;
  }

  .image-item,
  .image-uploader,
  .upload-trigger {
    width: 80px;
    height: 80px;
  }

  /* 对话框移动端适配 */
  :deep(.el-dialog) {
    width: 95% !important;
    margin: 0 auto;
  }

  :deep(.el-dialog__body) {
    padding: 16px;
  }
}

/* 小屏幕设备（手机横屏） */
@media (max-width: 480px) {
  .design-request-container {
    padding: 8px;
  }

  .search-card.business-style {
    padding: 12px;
  }

  .action-card {
    padding: 10px 12px;
  }

  .table-card {
    padding: 8px;
  }

  /* 表格字体大小调整 */
  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 8px 0;
  }

  /* 按钮大小调整 */
  .action-btn,
  .business-btn {
    font-size: 13px;
    padding: 6px 12px;
  }
}
</style>


