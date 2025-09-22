<template>
  <div class="departments-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title">
        <el-icon class="title-icon"><OfficeBuilding /></el-icon>
        <h2>部门管理</h2>
      </div>
      <div class="page-description">
        管理部门架构和员工分配
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧部门树 -->
      <div class="left-panel">
        <div class="panel-header">
          <span class="panel-title">
            <el-icon><OfficeBuilding /></el-icon>
            部门架构
          </span>
          <div class="header-actions">
            <el-tooltip content="新增部门" placement="top" v-if="hasAnyPermission(['department:create','department:manage'])">
              <el-button size="small" type="primary" :icon="Plus" circle @click="handleAdd" />
            </el-tooltip>
            <!-- <el-tooltip content="展开全部" placement="top">
              <el-button size="small" :icon="Expand" circle @click="handleExpandAll" />
            </el-tooltip>
            <el-tooltip content="收起全部" placement="top">
              <el-button size="small" :icon="Fold" circle @click="handleCollapseAll" />
            </el-tooltip> -->
          </div>
        </div>
        
        <!-- 搜索框 -->
        <div class="search-section">
          <el-input
            v-model="searchForm.name"
            placeholder="搜索部门名称"
            clearable
            prefix-icon="Search"
            @input="handleSearch"
            @clear="handleReset"
          />
        </div>
        
        <!-- 部门树 -->
        <div class="tree-section">
          <el-tree
            ref="treeRef"
            :data="processedTreeData"
            :props="treeProps"
            node-key="_id"
            :expand-on-click-node="false"
            :highlight-current="true"
            @node-click="handleNodeClick"
            v-loading="treeLoading"
            :default-expanded-keys="defaultExpandedKeys"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span class="node-label">
                  <el-icon v-if="data.id === -1" class="company-icon"><OfficeBuilding /></el-icon>
                  {{ data.departmentName || data.name || node.label }}
                </span>
                <!-- 只有非公司节点才显示操作按钮 -->
                <div class="node-actions" v-if="data.id !== -1">
                  <el-dropdown @command="handleNodeAction" trigger="click" placement="bottom-start">
                    <el-button size="small" type="text" class="more-btn" @click.stop >
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu class="node-dropdown-menu">
                        <el-dropdown-item :command="{action: 'addChild', data: data}"  v-if="hasAnyPermission(['department:create','department:manage'])">
                          <el-icon><Plus /></el-icon>
                          新增
                        </el-dropdown-item>
                        <el-dropdown-item :command="{action: 'edit', data: data}"  v-if="hasAnyPermission(['department:update','department:manage'])">
                          <el-icon><Edit /></el-icon>
                          编辑
                        </el-dropdown-item>
                        <el-dropdown-item :command="{action: 'delete', data: data}" divided  v-if="hasAnyPermission(['department:delete','department:manage'])">
                          <el-icon><Delete /></el-icon>
                          删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧员工列表 -->
      <div class="right-panel">
        <div class="panel-header">
          <span class="panel-title">
            <el-icon><User /></el-icon>
            {{ selectedDepartment ? `${selectedDepartment.name || selectedDepartment.departmentName} - 员工列表` : '员工列表' }}
          </span>
          <div class="header-actions">
            <span class="employee-count">共 {{ filteredEmployeeList.length }} 人</span>
            <div class="action-buttons">
              <el-tooltip content="添加员工" placement="top">
                <el-button 
                  size="small" 
                  type="primary" 
                  :icon="Plus" 
                  circle 
                  @click="handleAddEmployee" 
                  :disabled="!selectedDepartment || selectedDepartment.id === -1"
                />
              </el-tooltip>
              <el-tooltip content="批量移除" placement="top">
                <el-button 
                  size="small" 
                  type="danger" 
                  :icon="Delete" 
                  circle 
                  @click="handleBatchRemoveEmployees" 
                  :disabled="!selectedDepartment || selectedDepartment.id === -1 || selectedEmployeesForRemove.length === 0"
                />
              </el-tooltip>
              <el-tooltip content="刷新" placement="top">
                <el-button size="small" :icon="Refresh" circle @click="refreshEmployeeData" />
              </el-tooltip>
            </div>
          </div>
        </div>
        
        <!-- 员工搜索 -->
        <div class="search-section">
          <el-input
            v-model="employeeSearchForm.search"
            placeholder="搜索员工姓名或账号"
            clearable
            prefix-icon="Search"
            @input="handleEmployeeSearch"
            @clear="handleEmployeeSearchReset"
          />
        </div>
        
        <!-- 员工列表 -->
        <div class="employee-section">
          <div v-if="!selectedDepartment" class="empty-state">
            <el-empty description="请选择左侧部门查看员工" />
          </div>
          <div v-else>
            <!-- 如果没有员工数据，显示空状态 -->
            <div v-if="!employeeLoading && filteredEmployeeList.length === 0" class="empty-state">
              <el-empty description="当前部门暂无员工" />
            </div>
            
            <!-- 员工表格 -->
            <el-table
              v-else
              :data="paginatedEmployeeList"
              v-loading="employeeLoading"
              stripe
              size="default"
              :height="tableHeight"
              element-loading-text="正在加载员工数据..."
              @selection-change="handleEmployeeTableSelectionChange"
            >
              <el-table-column type="selection" width="55" v-if="selectedDepartment && selectedDepartment.id !== -1" />
              <el-table-column label="员工信息" min-width="200">
                <template #default="{ row }">
                  <div class="employee-info">
                    <el-avatar :size="32" class="employee-avatar">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <div class="employee-details">
                      <div class="employee-name">{{ row.username }}</div>
                      <div class="employee-account">{{ row.loginAccount }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="部门" width="120">
                <template #default="{ row }">
                  <div>
                     {{ row.departmentPath || "无"}}
                  </div>
                </template>
              </el-table-column>
               <el-table-column label="角色" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.isAdmin ? 'warning' : 'info'" size="small">
                    {{ row.rolePermission?.roleName || '普通用户' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
                    {{ row.isActive ? '活跃' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" show-overflow-tooltip min-width="120" />
              <el-table-column label="创建时间" width="120">
                <template #default="{ row }">
                  <span class="time-text">{{ new Date(row.createdAt).toLocaleDateString() }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right" v-if="selectedDepartment && selectedDepartment.id !== -1">
                <template #default="{ row }">
                  <el-button 
                    size="small" 
                    type="danger" 
                    @click="handleRemoveEmployee(row)" 
                    link
                  >
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页组件 -->
            <div class="pagination-wrapper" v-if="selectedDepartment && filteredEmployeeList.length > 0">
              <el-pagination
                v-model:current-page="employeePagination.currentPage"
                v-model:page-size="employeePagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="filteredEmployeeList.length"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleEmployeePageSizeChange"
                @current-change="handleEmployeePageChange"
                class="custom-pagination"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      append-to-body
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="部门名称" prop="departmentName">
          <el-input v-model="form.departmentName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select v-model="form.parentId" placeholder="请选择上级部门" style="width: 100%" clearable>
            <el-option
              v-for="dept in filteredParentDepartmentOptions"
              :key="dept._id || 'null'"
              :label="dept.departmentName"
              :value="dept._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入部门描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加员工对话框 -->
    <el-dialog
      title="为部门添加员工"
      v-model="employeeDialogVisible"
      width="700px"
      append-to-body
      @close="handleEmployeeDialogClose"
    >
      <div class="employee-dialog-content">
        <div class="selected-department-info">
          <span class="info-label">目标部门：</span>
          <el-tag type="primary">{{ selectedDepartment?.departmentName || selectedDepartment?.name }}</el-tag>
        </div>
        
        <!-- 搜索现有员工 -->
        <div class="search-employees">
          <el-input
            v-model="employeeSearchKeyword"
            placeholder="搜索员工姓名或账号"
            prefix-icon="Search"
            clearable
            @input="handleSearchAllEmployees"
            style="margin-bottom: 16px;"
          />
        </div>
        
        <!-- 可选员工列表 -->
        <div class="available-employees">
          <div class="section-title">可选员工列表</div>
          <el-table
            :data="availableEmployees"
            v-loading="allEmployeesLoading"
            max-height="300px"
            stripe
            @selection-change="handleEmployeeSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column label="员工信息" min-width="200">
              <template #default="{ row }">
                <div class="employee-info">
                  <el-avatar :size="32" class="employee-avatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                  <div class="employee-details">
                    <div class="employee-name">{{ row.username }}</div>
                    <div class="employee-account">{{ row.loginAccount }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="当前部门" width="120">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ row.departmentPath || '未分配' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="角色" width="100">
              <template #default="{ row }">
                <el-tag :type="row.isAdmin ? 'warning' : 'info'" size="small">
                  {{ row.rolePermission?.roleName || '普通用户' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container" style="margin-top: 16px; text-align: center;">
            <el-pagination
              v-model:current-page="employeeDialogPagination.currentPage"
              v-model:page-size="employeeDialogPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="employeeDialogPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleEmployeeDialogPageSizeChange"
              @current-change="handleEmployeeDialogPageChange"
              small
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="employeeDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleConfirmAddEmployees" 
            :loading="addEmployeeLoading"
            :disabled="selectedEmployees.length === 0"
          >
            确定添加 ({{ selectedEmployees.length }}人)
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup >
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox} from 'element-plus'
import { Plus, Edit, Delete, Refresh, User, OfficeBuilding, MoreFilled } from '@element-plus/icons-vue'
import { departmentApi, employeeApi } from '@/api/index'
import { useUserStore } from '@/stores/user'
import hasAnyPermission from '@/utils/checkPermissions'

// 用户store
const userStore = useUserStore()

// 搜索表单
const searchForm = reactive({
  name: ''
})

// 员工搜索表单
const employeeSearchForm = reactive({
  search: ''
})

// 部门树数据
const treeData = ref([])
const treeLoading = ref(false)
const treeRef = ref()

// 默认展开的节点keys（支持字符串和数字ID）
const defaultExpandedKeys = ref([-1])

// 公司根节点（静态数据）
const companyNode = {
  _id: '-1', // 使用字符串负数避免与真实部门ID冲突
  id: -1,
  name: '招财猫',
  departmentName: '招财猫',
  code: 'COMPANY',
  departmentCode: 'COMPANY',
  description: '公司总部',
  createTime: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  departmentPath: '招财猫',
  level: 0,
  isActive: true,
  children: [] // 子部门将通过API动态填充
}

// 处理后的树形数据（包含公司根节点）
const processedTreeData = computed(() => {
  // 确保公司节点包含从API获取的部门数据
  // 由于 treeData.value 已经是构建好的树形结构，直接使用即可
  const companyWithData = {
    ...companyNode,
    children: treeData.value.length > 0 ? treeData.value.map(dept => ({
      ...dept,
      id: dept._id || dept.id,
      name: dept.departmentName || dept.name
    })) : []
  }
  return [companyWithData]
})

// 当前选中的部门
const selectedDepartment = ref(null)

// 员工列表数据
const allEmployeesCache = ref([]) // 缓存所有员工数据
// 员工列表 - 使用filteredEmployeeList替代
const employeeLoading = ref(false)

// 员工分页数据
const employeePagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 表格高度计算
const tableHeight = computed(() => {
  return 'calc(100vh - 380px)' // 根据页面布局调整
})

// 过滤后的员工列表（静态过滤）
const filteredEmployeeList = computed(() => {
  let employees = allEmployeesCache.value
  
  // 按部门过滤
  if (selectedDepartment.value && selectedDepartment.value.id !== -1) {
    const departmentPath = selectedDepartment.value.departmentPath || selectedDepartment.value.departmentName
    if (departmentPath) {
      // 显示当前部门及其所有子部门的员工
      employees = employees.filter(emp => {
        if (!emp.departmentPath) return false
        // 精确匹配当前部门或者是当前部门的子部门
        return emp.departmentPath === departmentPath || emp.departmentPath.startsWith(departmentPath + '->')
      })
    }
  }
  
  // 按搜索关键词过滤
  if (employeeSearchForm.search) {
    employees = employees.filter(emp => 
      emp.username.includes(employeeSearchForm.search) || 
      emp.loginAccount.includes(employeeSearchForm.search)
    )
  }
  
  return employees
})

// 静态分页处理
const paginatedEmployeeList = computed(() => {
  const filtered = filteredEmployeeList.value
  const start = (employeePagination.currentPage - 1) * employeePagination.pageSize
  const end = start + employeePagination.pageSize
  return filtered.slice(start, end)
})

// 过滤后的上级部门选项（编辑时不能选择自己和自己的子部门）
const filteredParentDepartmentOptions = computed(() => {
  if (!form._id) {
    // 新增时，不需要过滤
    return parentDepartmentOptions.value
  }
  
  // 编辑时，需要过滤掉自己和自己的所有子部门
  const currentDeptId = form._id
  
  // 获取当前部门的所有子部门ID
  const getChildrenIds = (dept) => {
    let ids = [dept._id]
    if (dept.children && dept.children.length > 0) {
      dept.children.forEach(child => {
        ids.push(...getChildrenIds(child))
      })
    }
    return ids
  }
  
  // 找到当前部门及其所有子部门
  const currentDept = findDepartmentById(treeData.value, currentDeptId)
  const excludeIds = currentDept ? getChildrenIds(currentDept) : [currentDeptId]
  
  return parentDepartmentOptions.value.filter(dept => 
    dept._id === '' || !excludeIds.includes(dept._id)
  )
})

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'departmentName'  // 修改为API返回的字段名
}

// 对话框
// 组件状态
// loading状态 - 已移除未使用
const dialogVisible = ref(false)
const dialogTitle = ref('新增部门')
const submitLoading = ref(false)
// 移动员工对话框 - 已移除未使用
const formRef = ref()

// 表单数据
const form = reactive({
  _id: undefined,
  departmentName: '',
  description: '',
  parentId: null,
  originalParentId: null
})

// 上级部门选项列表（在页面加载时获取）
const parentDepartmentOptions = ref([])

// 父部门名称
const parentDepartmentName = ref('')

// 员工对话框相关
const employeeDialogVisible = ref(false)
const employeeSearchKeyword = ref('')
const availableEmployees = ref([])
const selectedEmployees = ref([])
const allEmployeesLoading = ref(false)
const addEmployeeLoading = ref(false)

// 员工弹框分页
const employeeDialogPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 员工表格选择相关
const selectedEmployeesForRemove = ref([])
const removeEmployeeLoading = ref(false)

// 移除员工对话框相关 - 已移除未使用

// 检查同级部门名称是否重复的辅助函数
const checkDuplicateDepartmentName = (departmentName, parentId, excludeId = null) => {
  // 递归查找所有部门
  const findAllDepartments = (departments) => {
    let result = []
    for (const dept of departments) {
      result.push(dept)
      if (dept.children && dept.children.length > 0) {
        result = result.concat(findAllDepartments(dept.children))
      }
    }
    return result
  }

  const allDepartments = findAllDepartments(treeData.value)

  // 查找同级部门
  const siblings = allDepartments.filter(dept => {
    // 排除自己（编辑时）
    if (excludeId && (dept._id === excludeId || dept.id === excludeId)) {
      return false
    }

    // 比较父部门ID
    const deptParentId = dept.parentId || null
    const targetParentId = parentId || null

    return deptParentId === targetParentId
  })

  // 检查是否有重名
  return siblings.some(dept => dept.departmentName === departmentName)
}

// 自定义验证器：检查同级部门名称是否重复
const validateDepartmentName = async (_rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入部门名称'))
    return
  }

  // 如果是编辑模式且名称没有改变，跳过验证
  if (form._id && form.departmentName === value) {
    callback()
    return
  }

  try {
    // 获取当前选择的父部门ID
    const currentParentId = form.parentId || null

    // 检查同级部门中是否已存在相同名称
    const isDuplicate = checkDuplicateDepartmentName(value, currentParentId, form._id)

    if (isDuplicate) {
      callback(new Error('同级部门下已存在相同名称的部门'))
    } else {
      callback()
    }
  } catch (error) {
    callback() // 验证出错时不阻止提交，让后端处理
  }
}

// 表单验证规则
const rules = {
  departmentName: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { validator: validateDepartmentName, trigger: 'blur' }
  ]
}

// 将扁平的部门数组构建成树形结构
const buildDepartmentTree = (flatData) => {
  // 先适配数据格式
  const adaptedData = flatData.map(dept => ({
    ...dept,
    id: dept._id,           // 添加id字段兼容性
    name: dept.departmentName, // 添加name字段兼容性
    code: dept.departmentCode, // 添加code字段兼容性
    createTime: dept.createdAt, // 添加createTime字段兼容性
    children: []
  }))
  
  // 创建映射表，便于快速查找
  const departmentMap = new Map()
  adaptedData.forEach(dept => {
    departmentMap.set(dept._id, dept)
  })
  
  // 构建树形结构
  const tree = []
  
  adaptedData.forEach(dept => {
    if (dept.parentId && departmentMap.has(dept.parentId)) {
      // 有父部门，添加到父部门的children中
      const parent = departmentMap.get(dept.parentId)
      parent.children.push(dept)
    } else {
      // 没有父部门或父部门不存在，作为根节点
      tree.push(dept)
    }
  })
  
  // 对每个部门的children按level排序，确保层级正确显示
  const sortChildren = (departments) => {
    departments.forEach(dept => {
      if (dept.children && dept.children.length > 0) {
        dept.children.sort((a, b) => a.level - b.level || a.departmentName.localeCompare(b.departmentName))
        sortChildren(dept.children)
      }
    })
  }
  
  // 对根节点排序并递归排序子节点
  tree.sort((a, b) => a.level - b.level || a.departmentName.localeCompare(b.departmentName))
  sortChildren(tree)
  
  return tree
}

// 适配API数据为页面格式（保留原函数用于其他地方）
const adaptApiDataToPageFormat = (apiData) => {
  // 如果数据已经是树形结构，直接适配格式
  return apiData.map(dept => ({
    ...dept,
    id: dept._id,           // 添加id字段兼容性
    name: dept.departmentName, // 添加name字段兼容性
    code: dept.departmentCode, // 添加code字段兼容性
    createTime: dept.createdAt, // 添加createTime字段兼容性
    children: dept.children ? adaptApiDataToPageFormat(dept.children) : []
  }))
}

// 获取部门树形数据
const getDepartmentTree = async () => {
  treeLoading.value = true
  
  try {
    // 尝试从API获取数据
    const response = await departmentApi.getDepartmentTree({ isActive: true })
    
    if (response.success && response.data && Array.isArray(response.data)) {
      // 检查数据是否已经是树形结构（有children字段且不为空）
      const hasTreeStructure = response.data.some((dept) => 
        dept.children && Array.isArray(dept.children) && dept.children.length > 0
      )
      
      let processedData
      
      if (hasTreeStructure) {
        // 数据已经是树形结构，直接使用
        processedData = response.data
      } else {
        // 数据是扁平结构，需要构建树形结构
        processedData = buildDepartmentTree(response.data)
      }
      
      // 保存处理后的树形数据
      treeData.value = processedData
      
      // 扁平化所有部门用于上级部门选择器
      const flattenDepartments = (depts) => {
        let result = []
        depts.forEach(dept => {
          result.push(dept)
          // 递归处理子部门
          if (dept.children && dept.children.length > 0) {
            result.push(...flattenDepartments(dept.children))
          }
        })
        return result
      }
      
      const flatDepartments = flattenDepartments(processedData)
      
      // 设置上级部门选项："无" + 所有部门
      parentDepartmentOptions.value = [
        {
          _id: null,
          departmentName: '无（顶级部门）',
          departmentCode: '',
          departmentPath: '',
          level: 0,
          isActive: true,
          createdAt: '',
          updatedAt: ''
        },
        ...flatDepartments
      ]
      
    } else {
      ElMessage.error('获取部门数据失败')
      treeData.value = []
    }
  } catch (error) {
    ElMessage.error('获取部门数据失败')
    treeData.value = []
  } finally {
    treeLoading.value = false
  }
}

// 获取所有员工数据（用于缓存）
const loadAllEmployees = async () => {
  if (allEmployeesCache.value.length > 0) {
    // 如果已经缓存了数据，直接使用
    return
  }
  
  employeeLoading.value = true
  
  try {
    // 获取所有员工数据（不使用分页）
    const response = await employeeApi.getEmployees({
      page: 1,
      limit: 10000 // 获取大量数据以确保获取所有员工
    })
    
    if (response.success && response.data) {
      // 后端返回的数据结构：{ success: true, data: users[], count: number, pagination: {...} }
      allEmployeesCache.value = Array.isArray(response.data) ? response.data : []
    } else {
      allEmployeesCache.value = []
    }
    
  } catch (error) {
    ElMessage.error('获取员工数据失败')
    allEmployeesCache.value = []
  } finally {
    employeeLoading.value = false
  }
}

// 静态更新员工列表（不发送网络请求）
const updateEmployeeList = () => {
  // 静态过滤和分页通过computed属性自动处理
  // 这里只需要重置分页到第一页
  employeePagination.currentPage = 1
}

// 刷新员工数据（清空缓存并重新获取）
const refreshEmployeeData = async () => {
  allEmployeesCache.value = [] // 清空缓存
  await loadAllEmployees() // 重新加载所有员工数据
}

// 部门树节点点击
const handleNodeClick = (data) => {
  selectedDepartment.value = data
  // 重置分页到第一页
  employeePagination.currentPage = 1
  // 清空搜索条件
  employeeSearchForm.search = ''
  // 静态更新员工列表（不发送网络请求）
  updateEmployeeList()
}


// 搜索部门
const handleSearch = () => {
  if (searchForm.name) {
    // 搜索功能：过滤树节点
    filterTree()
  } else {
    getDepartmentTree()
  }
}

// 过滤树节点
const filterTree = () => {
  if (treeRef.value) {
    treeRef.value.filter(searchForm.name)
  }
}

// 员工搜索（静态搜索）
const handleEmployeeSearch = () => {
  // 重置到第一页，搜索通过computed属性自动处理
  employeePagination.currentPage = 1
}

// 员工搜索重置
const handleEmployeeSearchReset = () => {
  employeeSearchForm.search = ''
  employeePagination.currentPage = 1
}

// 员工分页 - 页面大小改变（静态分页）
const handleEmployeePageSizeChange = (size) => {
  employeePagination.pageSize = size
  employeePagination.currentPage = 1 // 重置到第一页
  // 静态分页，不需要网络请求
}

// 员工分页 - 当前页改变（静态分页）
const handleEmployeePageChange = (page) => {
  employeePagination.currentPage = page
  // 静态分页，不需要网络请求
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    name: ''
  })
  getDepartmentTree()
}

// 新增
const handleAdd = async () => {
  dialogTitle.value = '新增部门'
  resetForm()
  dialogVisible.value = true
  
  // 根据用户权限设置默认父部门
  if (userStore.userInfo?.isAdmin) {
    // 管理员：默认可以创建顶级部门
    parentDepartmentName.value = '招财猫'
    form.parentId = null // null表示顶级部门
  } else {
    // 非管理员：必须在当前用户部门下创建子部门
    const userDeptPath = userStore.userInfo?.departmentPath
    if (userDeptPath) {
      // 查找用户当前部门，设置为默认父部门
      const userDept = findDepartmentByPath(treeData.value, userDeptPath)
      if (userDept) {
        form.parentId = userDept._id
        parentDepartmentName.value = userDept.departmentName
      } else {
        parentDepartmentName.value = '当前用户部门'
      }
    } else {
      ElMessage.warning('您没有部门信息，无法创建部门，请联系管理员')
      dialogVisible.value = false
      return
    }
  }
}

// 部门节点操作处理
const handleNodeAction = (command) => {
  const { action, data } = command
  
  switch (action) {
    case 'addChild':
      handleAddChild(data)
      break
    case 'edit':
      handleEdit(data)
      break
    case 'delete':
      handleDelete(data)
      break
  }
}

// 新增子部门
const handleAddChild = async (row) => {
  // 公司节点不允许操作
  if (row.id === -1) {
    ElMessage.warning('公司节点不允许操作')
    return
  }
  
  dialogTitle.value = '新增子部门'
  resetForm()
  dialogVisible.value = true
  form.parentId = row._id || row.id || null
  parentDepartmentName.value = row.name || row.departmentName
}

// 编辑
const handleEdit = async (row) => {
  // 公司节点不允许编辑
  if (row.id === -1) {
    ElMessage.warning('公司信息不允许编辑')
    return
  }
  
  dialogTitle.value = '编辑部门'
  dialogVisible.value = true
  
  // 保存原始的parentId用于后端提交
  const originalParentId = row.parentId || null

  // 检查父部门是否存在于选项列表中（用于前端显示）
  let displayParentId = originalParentId
  if (displayParentId) {
    const parentExists = parentDepartmentOptions.value.some(dept => dept._id === displayParentId)
    if (!parentExists) {
      displayParentId = null // 前端显示为空，但保留originalParentId用于提交
    }
  }

  // 映射数据结构，适配静态数据和API数据的不同结构
  Object.assign(form, {
    _id: row._id,
    departmentName: row.departmentName,
    description: row.description || '',
    parentId: displayParentId, // 用于前端显示
    originalParentId: originalParentId // 用于后端提交
  })
  // 如果有父部门且父部门存在，查找父部门名称用于显示
  if (originalParentId && originalParentId !== '') {
    const parent = findDepartmentById(treeData.value, originalParentId)
    if (parent) {
      parentDepartmentName.value = parent.departmentName || parent.name || ''
    } else {
      parentDepartmentName.value = ''
    }
  } else {
    // 没有父部门的部门，就是顶级部门
    parentDepartmentName.value = '无（顶级部门）'
  }
}

// 删除
const handleDelete = async (row) => {
  // 公司节点不允许删除
  if (row.id === -1) {
    ElMessage.warning('公司信息不允许删除')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除部门 "${row.name || row.departmentName}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await departmentApi.deleteDepartment(String(row._id || row.id))
    if (response.success) {
      ElMessage.success('删除成功')
      getDepartmentTree()
      // 如果删除的是当前选中的部门，清空选中状态
      if (selectedDepartment.value?._id === row._id || selectedDepartment.value?.id === row.id) {
        selectedDepartment.value = null
      }
      // 刷新员工缓存数据
      await refreshEmployeeData()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 展开全部
// 展开/收起功能 - 已移除未使用

// 获取所有节点keys - 已移除未使用

// 根据ID查找部门（支持字符串ID）
const findDepartmentById = (departments, id ) => {
  for (const dept of departments) {
    if (dept.id === id || dept._id === id) {
      return dept
    }
    if (dept.children && dept.children.length > 0) {
      const found = findDepartmentById(dept.children, id)
      if (found) return found
    }
  }
  return null
}

// 根据部门路径查找部门
const findDepartmentByPath = (departments, path) => {
  for (const dept of departments) {
    if (dept.departmentPath === path) {
      return dept
    }
    if (dept.children && dept.children.length > 0) {
      const found = findDepartmentByPath(dept.children, path)
      if (found) return found
    }
  }
  return null
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitLoading.value = true
    
    // 准备提交数据，处理空值情况
    // 对于编辑操作，必须明确传递parentId，避免后端误判
    let finalParentId
    
    if (form._id) {
      // 编辑模式：直接使用当前表单的parentId值
      // 这样可以正确处理用户清空上级部门的情况
      finalParentId = form.parentId
    } else {
      // 新增模式：直接使用用户选择的parentId
      finalParentId = form.parentId
    }

    const submitData = {
      departmentName: form.departmentName,
      description: form.description,
      parentId: finalParentId // 直接使用finalParentId，null值会被正确处理
    }
    
    let response
    if (form._id) {
      // 编辑
      response = await departmentApi.updateDepartment(form._id, submitData)
    } else {
      // 新增
      response = await departmentApi.createDepartment(submitData)
    }
    
    if (response.success) {
      ElMessage.success(form._id ? '更新成功' : '创建成功')
      dialogVisible.value = false

      // 重新获取部门树
      await getDepartmentTree()
    }
  } catch (error) {
    ElMessage.error('提交失败')
  } finally {
    submitLoading.value = false
  }
}

// 对话框关闭
const handleDialogClose = () => {
  resetForm()
  parentDepartmentName.value = ''
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    _id: undefined,
    departmentName: '',
    description: '',
    parentId: null,
    originalParentId: null
  })
  parentDepartmentName.value = ''
  formRef.value?.clearValidate()
}

// 添加员工功能
const handleAddEmployee = async () => {
  if (!selectedDepartment.value || selectedDepartment.value.id === -1) {
    ElMessage.warning('请先选择一个具体的部门')
    return
  }
  
  employeeDialogVisible.value = true
  await getAllAvailableEmployees()
}

// 获取所有可用员工（支持分页和搜索）
const getAllAvailableEmployees = async () => {
  allEmployeesLoading.value = true
  try {
    // 构建查询参数
    const params = {
      page: employeeDialogPagination.currentPage,
      limit: employeeDialogPagination.pageSize
    }

    // 如果有搜索关键词，添加搜索参数
    if (employeeSearchKeyword.value.trim()) {
      params.search = employeeSearchKeyword.value.trim()
    }

    // 调用获取没有部门的员工API
    const response = await employeeApi.getNoDepartmentUser()

    if (response.success && response.data && response.data.userList) {
      let employees = response.data.userList

      // 前端搜索过滤（如果后端不支持搜索）
      if (employeeSearchKeyword.value.trim()) {
        const keyword = employeeSearchKeyword.value.trim().toLowerCase()
        employees = employees.filter(emp =>
          emp.username.toLowerCase().includes(keyword) ||
          emp.loginAccount.toLowerCase().includes(keyword)
        )
      }

      // 前端分页处理
      employeeDialogPagination.total = employees.length
      const start = (employeeDialogPagination.currentPage - 1) * employeeDialogPagination.pageSize
      const end = start + employeeDialogPagination.pageSize
      availableEmployees.value = employees.slice(start, end)
    } else {
      availableEmployees.value = []
      employeeDialogPagination.total = 0
    }
  } catch (error) {
    ElMessage.error('获取员工列表失败')
    availableEmployees.value = []
    employeeDialogPagination.total = 0
  } finally {
    allEmployeesLoading.value = false
  }
}

// 搜索防抖定时器
let searchTimer = null

// 搜索所有员工
const handleSearchAllEmployees = () => {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  // 设置防抖
  searchTimer = setTimeout(() => {
    // 重置到第一页
    employeeDialogPagination.currentPage = 1
    // 重新获取数据
    getAllAvailableEmployees()
  }, 300)
}

// 员工弹框分页处理
const handleEmployeeDialogPageChange = (page) => {
  employeeDialogPagination.currentPage = page
  getAllAvailableEmployees()
}

const handleEmployeeDialogPageSizeChange = (size) => {
  employeeDialogPagination.pageSize = size
  employeeDialogPagination.currentPage = 1
  getAllAvailableEmployees()
}

// 员工选择变化
const handleEmployeeSelectionChange = (selection) => {
  selectedEmployees.value = selection
}

// 确认添加员工
const handleConfirmAddEmployees = async () => {
  if (selectedEmployees.value.length === 0) {
    ElMessage.warning('请选择要添加的员工')
    return
  }
  
  if (!selectedDepartment.value || selectedDepartment.value.id === -1) {
    ElMessage.warning('请选择有效的部门')
    return
  }
  
  addEmployeeLoading.value = true
  
  try {
    // 这里需要调用API将员工分配到部门
    // 由于当前API结构不明确，这里使用模拟的方式
    const employeeIds = selectedEmployees.value.map(emp => emp._id)
    const departmentPath = selectedDepartment.value.departmentPath;
    if (departmentPath === '') {
       ElMessage.error('请选择部门')
      return
    }
    if (employeeIds.length === 0) {
       ElMessage.error('请选择员工')
      return
    }
    
    await employeeApi.addUserToDepartment({
      userIds: employeeIds,
      departmentPath: departmentPath
    })
    
    ElMessage.success(`成功为部门"${selectedDepartment.value.departmentName}"添加${selectedEmployees.value.length}名员工`)
    
    // 关闭对话框
    employeeDialogVisible.value = false
    
    // 并行刷新数据 - 确保数据及时更新
    await Promise.all([
      refreshEmployeeData(),
      getDepartmentTree()
    ])
    
    // 刷新后重新获取可用员工列表（为下次添加做准备）
    await getAllAvailableEmployees()
    
  } catch (error) {
    ElMessage.error('添加员工失败')
  } finally {
    addEmployeeLoading.value = false
  }
}

// 员工对话框关闭
const handleEmployeeDialogClose = () => {
  employeeSearchKeyword.value = ''
  availableEmployees.value = []
  selectedEmployees.value = []
  // 重置分页
  employeeDialogPagination.currentPage = 1
  employeeDialogPagination.total = 0
}

// 员工表格选择变化
const handleEmployeeTableSelectionChange = (selection) => {
  selectedEmployeesForRemove.value = selection
}

// 单个员工移除
const handleRemoveEmployee = async (employee) => {
  try {
    await ElMessageBox.confirm(
      `确定要将员工 "${employee.username}" 从当前部门移除吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await removeEmployeeFromDepartment([employee._id])
  } catch (error) {
    if (error !== 'cancel') {
    }
  }
}

// 批量移除员工
const handleBatchRemoveEmployees = async () => {
  if (selectedEmployeesForRemove.value.length === 0) {
    ElMessage.warning('请选择要移除的员工')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedEmployeesForRemove.value.length} 名员工从当前部门移除吗？`,
      '确认批量移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const employeeIds = selectedEmployeesForRemove.value.map(emp => emp._id)
    await removeEmployeeFromDepartment(employeeIds)
  } catch (error) {
    if (error !== 'cancel') {
    }
  }
}

// 移除员工的API调用
const removeEmployeeFromDepartment = async (employeeIds) => {
  if (!selectedDepartment.value || selectedDepartment.value.id === -1) {
    ElMessage.warning('请选择有效的部门')
    return
  }
  
  removeEmployeeLoading.value = true
  
  try {
    // 调用移除员工API - 将员工的departmentPath设为空
    for (const employeeId of employeeIds) {
      await employeeApi.updateEmployee(employeeId, {
        departmentPath: ''
      })
    }
    
    ElMessage.success(`成功移除 ${employeeIds.length} 名员工`)
    
    // 先清空选择状态
    selectedEmployeesForRemove.value = []
    
    // 并行刷新数据 - 确保数据及时更新
    await Promise.all([
      refreshEmployeeData(),
      getDepartmentTree()
    ])
    
    // 刷新后重新设置表格选择状态
    await nextTick(() => {
      // 如果表格存在，清空选择
      const table = document.querySelector('.el-table')
      if (table && table.__vue__) {
        table.__vue__.clearSelection()
      }
    })
    
  } catch (error) {
    ElMessage.error('移除员工失败')
  } finally {
    removeEmployeeLoading.value = false
  }
}

// 在页面上显示当前数据状态（用于调试）
// 调试信息 - 已移除未使用
onMounted(() => {
  // 并行加载部门树和员工数据
  Promise.all([
    getDepartmentTree(),
    loadAllEmployees()
  ]).then(() => {
    // 默认选中公司节点
    selectedDepartment.value = processedTreeData.value[0]
    
    // 默认展开公司节点和一级部门
    nextTick(() => {
      setTimeout(() => {
        if (treeRef.value && typeof treeRef.value.setCurrentKey === 'function') {
          treeRef.value.setCurrentKey(-1)
        }
        
        const firstLevelKeys = [-1]
        const companyData = processedTreeData.value[0]
        if (companyData && companyData.children && companyData.children.length > 0) {
          companyData.children.forEach(dept => {
            firstLevelKeys.push(dept.id || dept._id)
          })
        }
        defaultExpandedKeys.value = firstLevelKeys
      }, 100)
    })
  })
})
</script>

<style scoped>
.departments-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: 100vh;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* 页面标题 */
.page-header {
  margin-bottom: 20px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.title-icon {
  color: #409eff;
  font-size: 20px;
}

.page-title h2 {
  margin: 0;
  color: #303133;
  font-weight: 500;
  font-size: 18px;
}

.page-description {
  color: #909399;
  font-size: 13px;
  line-height: 1.4;
}

/* 主要内容区域 */
.main-content {
  display: flex;
  gap: 16px;
  height: calc(100vh - 160px);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  flex: 1; /* 1份 */
  min-width: 250px; /* 设置合理的最小宽度 */
  background: white;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出影响布局 */
}

/* 右侧面板 */
.right-panel {
  flex: 4; /* 4份 */
  min-width: 0; /* 允许flex子项收缩到比内容更小 */
  background: white;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 面板标题 */
.panel-header {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-weight: 500;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.employee-count {
  color: #909399;
  font-size: 12px;
  margin-right: 8px;
}

/* 搜索区域 */
.search-section {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f7fa;
}

/* 树形区域 */
.tree-section {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  overflow-x: hidden; /* 防止水平滚动条出现 */
}

/* 树节点 */
.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
  min-height: 36px;
  box-sizing: border-box;
  position: relative; /* 为下拉菜单定位提供参考 */
}

.node-label {
  flex: 1;
  color: #606266;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0; /* 防止文本溢出导致布局变化 */
  overflow: hidden;
}

.company-icon {
  color: #409eff;
  font-size: 16px;
  flex-shrink: 0; /* 防止图标被压缩 */
}

/* 节点操作按钮样式 */
.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  width: 32px; /* 固定宽度，防止布局变化 */
  height: 32px;
  justify-content: center;
  align-items: center;
  flex-shrink: 0; /* 防止被压缩 */
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.more-btn {
  color: #909399;
  padding: 4px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-btn:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

/* 下拉菜单样式修复 */
.node-dropdown-menu {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

/* 保持下拉按钮的尺寸稳定 */
:deep(.el-dropdown) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

/* 确保下拉菜单能正常显示 */
:deep(.el-dropdown__popper) {
  z-index: 2000 !important;
}

/* 保持树容器的溢出设置 */
.tree-section {
  overflow-y: auto;
  overflow-x: hidden; /* 防止水平滚动条出现 */
}

/* 公司节点特殊样式 */
:deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 4px;
  margin-bottom: 2px;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
  color: #409eff;
}

/* 公司根节点特殊样式 */
:deep(.el-tree-node[data-key="-1"] > .el-tree-node__content) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  font-weight: 600;
  color: #0369a1;
}

/* 公司节点不显示悬浮效果 */
:deep(.el-tree-node[data-key="-1"] > .el-tree-node__content:hover) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  cursor: default;
}

/* 员工区域 */
.employee-section {
  flex: 1;
  padding: 12px;
  overflow: hidden;
  min-width: 0;
}

/* 空状态 */
.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 员工信息 */
.employee-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.employee-avatar {
  background: #409eff;
  font-size: 12px;
}

.employee-details {
  flex: 1;
}

.employee-name {
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
  font-size: 14px;
}

.employee-account {
  font-size: 12px;
  color: #909399;
  margin-top: 1px;
}

/* 时间文字 */
.time-text {
  color: #909399;
  font-size: 12px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-tree) {
  background: transparent;
}

:deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 4px;
  margin-bottom: 2px;
  padding-left: 0;
  padding-right: 0;
  box-sizing: border-box;
  transition: background-color 0.2s;
  position: relative; /* 为子元素定位提供参考 */
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
  color: #409eff;
}

/* 保持扩展按钮区域的宽度稳定 */
:deep(.el-tree-node__expand-icon) {
  padding: 6px;
  width: 18px;
  height: 18px;
  text-align: center;
  flex-shrink: 0;
}

/* 保持树节点内容区域的宽度稳定 */
:deep(.el-tree-node__label) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 公司节点特殊样式 */
:deep(.el-tree-node[data-key="-1"] > .el-tree-node__content) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  font-weight: 600;
  color: #0369a1;
  box-sizing: border-box; /* 保持宽度稳定 */
}

/* 公司节点不显示悬浮效果 */
:deep(.el-tree-node[data-key="-1"] > .el-tree-node__content:hover) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  cursor: default;
}

/* 防止公司节点被选中时的样式变化 */
:deep(.el-tree-node[data-key="-1"].is-current > .el-tree-node__content) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  color: #0369a1;
}

:deep(.el-table) {
  border: none;
  font-size: 14px;
  width: 100%;
  table-layout: fixed;
}

:deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

:deep(.el-table .el-table__cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-table th.el-table__cell) {
  background: #fafafa;
  color: #606266;
  font-weight: 500;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
}

:deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #f5f7fa;
  padding: 8px 12px;
}

:deep(.el-tag) {
  border-radius: 4px;
  font-size: 12px;
}

:deep(.el-button--small) {
  font-size: 12px;
  padding: 4px 8px;
}

/* 对话框 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  text-align: right;
}

/* 员工对话框样式 */
.employee-dialog-content {
  max-height: 600px;
  overflow-y: auto;
}

.selected-department-info {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  color: #606266;
  font-weight: 500;
  font-size: 14px;
}

.section-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
  font-size: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.available-employees {
  margin-bottom: 16px;
}

.selected-employees {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bae6fd;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 员工信息卡片在对话框中的样式调整 */
.employee-dialog-content .employee-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.employee-dialog-content .employee-avatar {
  background: #409eff;
  font-size: 12px;
}

.employee-dialog-content .employee-details {
  flex: 1;
}

/* 员工弹框分页样式 */
.employee-dialog-content .pagination-container {
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 16px;
}

.employee-dialog-content .el-pagination {
  justify-content: center;
}

.employee-dialog-content .employee-name {
  font-weight: 500;
  color: #303133;
  line-height: 1.2;
  font-size: 14px;
}

.employee-dialog-content .employee-account {
  font-size: 12px;
  color: #909399;
  margin-top: 1px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .left-panel {
    min-width: 220px;
  }
}

@media (max-width: 992px) {
  .main-content {
    flex-direction: column;
    height: auto;
  }
  
  .left-panel {
    flex: none;
    width: 100%;
    min-width: unset;
    max-width: unset;
    height: 400px;
  }
  
  .right-panel {
    flex: none;
    height: 500px;
  }
}

/* 分页样式 */
.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.custom-pagination {
  --el-pagination-font-size: 14px;
  --el-pagination-bg-color: #ffffff;
  --el-pagination-text-color: #1f2329;
  --el-pagination-border-radius: 6px;
}
</style>