<template>
  <div class="product-test">
    <h1>商品数据测试</h1>
    
    <div class="test-section">
      <h2>认证状态</h2>
      <p>Token: {{ token ? '已设置' : '未设置' }}</p>
      <p>用户信息: {{ userInfo ? userInfo.username : '未登录' }}</p>
      
      <el-button @click="testLogin" :loading="loginLoading">测试登录</el-button>
      <el-button @click="testGetProducts" :loading="dataLoading">获取商品数据</el-button>
    </div>
    
    <div class="test-section">
      <h2>API响应</h2>
      <pre>{{ apiResponse }}</pre>
    </div>
    
    <div class="test-section">
      <h2>商品数据</h2>
      <div v-if="productStore.loading">加载中...</div>
      <div v-else-if="productStore.products.length === 0">无数据</div>
      <div v-else>
        <p>商品数量: {{ productStore.products.length }}</p>
        <ul>
          <li v-for="product in productStore.products" :key="product._id">
            {{ product.name }} - {{ product.team }} - {{ product.platform }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup >
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useProductStore } from '../stores/product'
import { authApi, productApi } from '../api/index'

const userStore = useUserStore()
const productStore = useProductStore()

const loginLoading = ref(false)
const dataLoading = ref(false)
const apiResponse = ref('')

const token = computed(() => userStore.token)
const userInfo = computed(() => userStore.userInfo)

const testLogin = async () => {
  loginLoading.value = true
  try {
    const result = await authApi.login({
      loginAccount: 'admin',
      loginPassword: 'admin123'
    })
    
    apiResponse.value = JSON.stringify(result, null, 2)
    
    if (result.success && result.data) {
      userStore.login(result.data.token, result.data.userInfo)
    }
  } catch (error) {
    apiResponse.value = `登录错误: ${error}`
  } finally {
    loginLoading.value = false
  }
}

const testGetProducts = async () => {
  dataLoading.value = true
  try {
    const result = await productApi.getProducts()
    apiResponse.value = JSON.stringify(result, null, 2)
    
    // 也更新store中的数据
    await productStore.fetchProducts()
  } catch (error) {
    apiResponse.value = `获取商品数据错误: ${error}`
  } finally {
    dataLoading.value = false
  }
}

onMounted(() => {
  // 初始化用户信息
  userStore.initUserInfo()
})
</script>

<style scoped>
.product-test {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.test-section h2 {
  margin-top: 0;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
}

.el-button {
  margin-right: 10px;
}
</style>