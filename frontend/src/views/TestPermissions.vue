<template>
  <div class="test-permissions">
    <h2>权限组件测试</h2>
    
    <div class="test-info">
      <h3>当前选中的权限：</h3>
      <pre>{{ JSON.stringify(selectedPermissions, null, 2) }}</pre>
      <p>权限数量：{{ selectedPermissions.length }}</p>
    </div>
    
    <div class="test-actions">
      <el-button @click="testSelectAll">测试全选</el-button>
      <el-button @click="testClearAll">测试清空</el-button>
      <el-button @click="testManualSet">手动设置权限</el-button>
    </div>
    
    <div class="permissions-component">
      <RolePermissionsManager v-model="selectedPermissions" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import RolePermissionsManager from '@/components/RolePermissionsManager.vue'

const selectedPermissions = ref([])

const testSelectAll = () => {
}

const testClearAll = () => {
  selectedPermissions.value = []
}

const testManualSet = () => {
  selectedPermissions.value = ['user:read', 'user:create', 'department:read']
}
</script>

<style scoped>
.test-permissions {
  padding: 20px;
}

.test-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.test-info pre {
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}

.test-actions {
  margin-bottom: 20px;
}

.test-actions .el-button {
  margin-right: 10px;
}

.permissions-component {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}
</style>
