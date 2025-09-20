<template>
  <div class="login-container">
    <!-- 背景装饰元素 -->
    <div class="bg-decorations">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
      <div class="gradient-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
    </div>

    <!-- 左上角Logo区域 -->
    <div class="logo-section">
      <div class="logo-container">
        <div class="logo-image">
          <img src="@/assets/log.png" alt="招财猫" class="logo-img" />
        </div>
        <div class="logo-text">
          <h1 class="brand-name">招财猫</h1>
          <p class="brand-subtitle">智能财务管理系统</p>
        </div>
      </div>
    </div>

    <!-- 右侧登录区域 -->
    <div class="login-section">
      <div class="login-card">
        <div class="login-header">
          <div class="welcome-text">
            <h2 class="login-title">欢迎回来</h2>
            <p class="login-subtitle">登录您的账户以继续使用</p>
          </div>
          <div class="login-decoration">
            <div class="decoration-line"></div>
          </div>
        </div>

        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          size="large"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username" class="form-item">
            <div class="input-wrapper">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                prefix-icon="User"
                class="modern-input"
              />
            </div>
          </el-form-item>

          <el-form-item prop="password" class="form-item">
            <div class="input-wrapper">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                show-password
                class="modern-input"
              />
            </div>
          </el-form-item>

          <el-form-item class="form-item remember-item">
            <el-checkbox v-model="loginForm.remember" class="remember-checkbox">
              记住我
            </el-checkbox>
            <a href="#" class="forgot-password">忘记密码？</a>
          </el-form-item>

          <el-form-item class="form-item">
            <el-button
              type="primary"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
            >
              <span v-if="!loading">立即登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <div class="divider">
            <span class="divider-text">或者</span>
          </div>
          <div class="social-login">
            <button class="social-btn social-wechat">
              <i class="social-icon">微</i>
              <span>微信登录</span>
            </button>
            <button class="social-btn social-phone">
              <i class="social-icon">📱</i>
              <span>手机登录</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 版权信息 -->
    <div class="copyright">
      <p>&copy; 2025 招财猫智能财务管理系统. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const rules = {
  username: [
    { required: true, message: '请输入登录账号名', trigger: 'blur' },
    { min: 3, message: '登录账号名至少3个字符', trigger: 'blur' },
    { max: 30, message: '登录账号名最多30个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '登录账号名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' },
    { max: 50, message: '密码最多50个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // 使用store的异步登录方法
    const result = await userStore.loginAsync(loginForm.username, loginForm.password)

    if (result.success) {
      ElMessage.success(result.message || '登录成功')
      router.push('/dashboard')
    } else {
      // 显示具体的错误信息
      const errorMessage = result.message || '登录失败'
      ElMessage.error(errorMessage)
    }
  } catch (error) {
    // 处理表单验证错误
    if (error.fields) {
      // 表单验证失败，显示第一个验证错误
      const firstError = Object.values(error.fields)[0][0]
      ElMessage.error(firstError.message)
    } else {
      // 网络或其他错误
      ElMessage.error('登录过程中出现错误，请稍后重试')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 主容器 - 2025年前沿设计 */
.login-container {
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  background: url('@/assets/bj.jpeg') center/cover no-repeat;
  display: flex;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 背景装饰元素 */
.bg-decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* 浮动几何形状 */
.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 80px;
  height: 80px;
  top: 10%;
  left: 15%;
  animation-delay: 0s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 60%;
  left: 8%;
  animation-delay: 2s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  top: 30%;
  right: 20%;
  animation-delay: 4s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  right: 10%;
  animation-delay: 1s;
}

.shape-5 {
  width: 40px;
  height: 40px;
  top: 80%;
  left: 40%;
  animation-delay: 3s;
}

/* 渐变光球 */
.gradient-orbs {
  position: absolute;
  width: 100%;
  height: 100%;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  animation: pulse 4s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(74, 144, 226, 0.3) 0%, transparent 70%);
  top: -10%;
  left: -10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%);
  bottom: -5%;
  right: -5%;
  animation-delay: 2s;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%);
  top: 50%;
  left: 30%;
  animation-delay: 1s;
}

/* 左上角Logo区域 */
.logo-section {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  padding: 40px 50px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-image {
  position: relative;
}

.logo-img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  transition: transform 0.3s ease;
}

.logo-img:hover {
  transform: scale(1.05) rotate(5deg);
}

.logo-text {
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.brand-name {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: 14px;
  margin: 4px 0 0 0;
  opacity: 0.9;
  font-weight: 400;
}

/* 右侧登录区域 */
.login-section {
  position: absolute;
  right: 0;
  top: 0;
  width: 480px;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  z-index: 10;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow:
    0 32px 64px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
}

/* 登录头部 */
.login-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

.welcome-text {
  margin-bottom: 20px;
}

.login-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #1a1a1a 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  font-weight: 400;
}

.login-decoration {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.decoration-line {
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #4f46e5, #06b6d4);
  border-radius: 2px;
}

/* 登录表单 */
.login-form {
  margin-bottom: 32px;
}

.form-item {
  margin-bottom: 24px;
}

.form-item:deep(.el-form-item__content) {
  line-height: normal;
}

.input-wrapper {
  position: relative;
}

.modern-input {
  --el-input-height: 52px;
}

.modern-input:deep(.el-input__wrapper) {
  background: rgba(248, 250, 252, 0.8);
  border: 2px solid rgba(226, 232, 240, 0.8);
  border-radius: 16px;
  padding: 0 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.modern-input:deep(.el-input__wrapper:hover) {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
}

.modern-input:deep(.el-input__wrapper.is-focus) {
  border-color: #6366f1;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.modern-input:deep(.el-input__inner) {
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
  height: 48px;
  line-height: 48px;
}

.modern-input:deep(.el-input__inner::placeholder) {
  color: #94a3b8;
  font-weight: 400;
}

.modern-input:deep(.el-input__prefix) {
  color: #64748b;
  font-size: 18px;
}

.modern-input:deep(.el-input__suffix) {
  color: #64748b;
}

/* 记住我和忘记密码 */
.remember-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.remember-item:deep(.el-form-item__content) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.remember-checkbox:deep(.el-checkbox__label) {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.remember-checkbox:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #6366f1;
  border-color: #6366f1;
}

.forgot-password {
  font-size: 14px;
  color: #6366f1;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.forgot-password:hover {
  color: #4f46e5;
  text-decoration: underline;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
}

.login-button:hover::before {
  left: 100%;
}

.login-button:active {
  transform: translateY(0);
}

.login-button:deep(.el-button__text) {
  position: relative;
  z-index: 1;
}

/* 登录页脚 */
.login-footer {
  margin-top: 32px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 24px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
}

.divider-text {
  background: rgba(255, 255, 255, 0.95);
  padding: 0 16px;
  font-size: 14px;
  color: #94a3b8;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

/* 社交登录 */
.social-login {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.social-btn {
  flex: 1;
  height: 48px;
  border: 2px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
}

.social-btn:hover {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.social-icon {
  font-size: 16px;
  font-weight: 600;
}

.social-wechat:hover {
  border-color: #07c160;
  color: #07c160;
}

.social-phone:hover {
  border-color: #6366f1;
  color: #6366f1;
}

/* 版权信息 */
.copyright {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  text-align: center;
}

.copyright p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  font-weight: 400;
}

/* 动画效果 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 入场动画 */
.logo-section {
  animation: slideInLeft 0.8s ease-out;
}

.login-section {
  animation: slideInRight 0.8s ease-out 0.2s both;
}

.copyright {
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .login-section {
    width: 420px;
  }

  .logo-section {
    padding: 30px 40px;
  }

  .brand-name {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
  }

  .logo-section {
    position: relative;
    width: 100%;
    padding: 20px;
    text-align: center;
    margin-bottom: 20px;
  }

  .logo-container {
    justify-content: center;
    gap: 15px;
  }

  .logo-img {
    width: 50px;
    height: 50px;
  }

  .brand-name {
    font-size: 22px;
  }

  .brand-subtitle {
    font-size: 13px;
  }

  .login-section {
    position: relative;
    width: 100%;
    max-width: 400px;
    height: auto;
    padding: 0;
  }

  .login-card {
    padding: 32px 24px;
    border-radius: 20px;
    margin: 0 auto;
  }

  .login-title {
    font-size: 28px;
  }

  .login-subtitle {
    font-size: 15px;
  }

  .copyright {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    margin-top: 20px;
  }

  .copyright p {
    color: rgba(255, 255, 255, 0.9);
  }

  /* 隐藏部分装饰元素以提升性能 */
  .shape-3,
  .shape-4,
  .shape-5 {
    display: none;
  }

  .orb-2,
  .orb-3 {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 15px;
  }

  .login-card {
    padding: 28px 20px;
    border-radius: 16px;
  }

  .login-title {
    font-size: 24px;
  }

  .modern-input {
    --el-input-height: 48px;
  }

  .modern-input:deep(.el-input__inner) {
    font-size: 15px;
    height: 44px;
    line-height: 44px;
  }

  .login-button {
    height: 48px;
    font-size: 15px;
  }

  .social-btn {
    height: 44px;
    font-size: 13px;
  }

  .logo-img {
    width: 45px;
    height: 45px;
  }

  .brand-name {
    font-size: 20px;
  }
}

/* 高分辨率屏幕优化 */
@media (min-width: 1920px) {
  .login-section {
    width: 520px;
  }

  .login-card {
    max-width: 450px;
    padding: 56px 48px;
  }

  .logo-section {
    padding: 50px 60px;
  }

  .brand-name {
    font-size: 32px;
  }

  .brand-subtitle {
    font-size: 16px;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: rgba(15, 23, 42, 0.95);
    border-color: rgba(51, 65, 85, 0.3);
  }

  .login-title {
    background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .login-subtitle {
    color: #94a3b8;
  }

  .modern-input:deep(.el-input__wrapper) {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(51, 65, 85, 0.8);
  }

  .modern-input:deep(.el-input__inner) {
    color: #f1f5f9;
  }

  .social-btn {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(51, 65, 85, 0.8);
    color: #cbd5e1;
  }
}

/* 减少动画效果（用户偏好） */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .shape,
  .orb {
    animation: none;
  }
}
</style>