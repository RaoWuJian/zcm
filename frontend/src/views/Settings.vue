<template>
  <div class="settings-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <el-menu
            :default-active="activeTab"
            class="settings-menu"
            @select="handleMenuSelect"
          >
            <el-menu-item index="basic">
              <el-icon><Setting /></el-icon>
              <span>基础设置</span>
            </el-menu-item>
            <el-menu-item index="security">
              <el-icon><Lock /></el-icon>
              <span>安全设置</span>
            </el-menu-item>
            <el-menu-item index="notification">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </el-menu-item>
            <el-menu-item index="system">
              <el-icon><Tools /></el-icon>
              <span>系统配置</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      
      <el-col :span="18">
        <!-- 基础设置 -->
        <el-card v-if="activeTab === 'basic'">
          <template #header>
            <span>基础设置</span>
          </template>
          
          <el-form :model="basicForm" label-width="120px">
            <el-form-item label="网站名称">
              <el-input v-model="basicForm.siteName" style="width: 300px" />
            </el-form-item>
            <el-form-item label="网站描述">
              <el-input
                v-model="basicForm.siteDescription"
                type="textarea"
                :rows="3"
                style="width: 500px"
              />
            </el-form-item>
            <el-form-item label="管理员邮箱">
              <el-input v-model="basicForm.adminEmail" style="width: 300px" />
            </el-form-item>
            <el-form-item label="时区">
              <el-select v-model="basicForm.timezone" style="width: 300px">
                <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                <el-option label="纽约时间 (UTC-5)" value="America/New_York" />
                <el-option label="伦敦时间 (UTC+0)" value="Europe/London" />
              </el-select>
            </el-form-item>
            <el-form-item label="语言">
              <el-select v-model="basicForm.language" style="width: 300px">
                <el-option label="中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 安全设置 -->
        <el-card v-if="activeTab === 'security'">
          <template #header>
            <span>安全设置</span>
          </template>
          
          <el-form :model="securityForm" label-width="120px">
            <el-form-item label="密码策略">
              <el-checkbox-group v-model="securityForm.passwordPolicy">
                <el-checkbox value="minLength">最少8位字符</el-checkbox>
                <el-checkbox value="uppercase">包含大写字母</el-checkbox>
                <el-checkbox value="lowercase">包含小写字母</el-checkbox>
                <el-checkbox value="numbers">包含数字</el-checkbox>
                <el-checkbox value="symbols">包含特殊字符</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="登录失败锁定">
              <el-switch v-model="securityForm.loginLockEnabled" />
              <span class="form-text">连续登录失败后锁定账户</span>
            </el-form-item>
            <el-form-item label="最大失败次数" v-if="securityForm.loginLockEnabled">
              <el-input-number v-model="securityForm.maxFailAttempts" :min="1" :max="10" />
            </el-form-item>
            <el-form-item label="锁定时长(分钟)" v-if="securityForm.loginLockEnabled">
              <el-input-number v-model="securityForm.lockDuration" :min="1" :max="1440" />
            </el-form-item>
            <el-form-item label="会话超时">
              <el-select v-model="securityForm.sessionTimeout" style="width: 200px">
                <el-option label="30分钟" :value="30" />
                <el-option label="1小时" :value="60" />
                <el-option label="2小时" :value="120" />
                <el-option label="4小时" :value="240" />
                <el-option label="8小时" :value="480" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 通知设置 -->
        <el-card v-if="activeTab === 'notification'">
          <template #header>
            <span>通知设置</span>
          </template>
          
          <el-form :model="notificationForm" label-width="120px">
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationForm.emailEnabled" />
            </el-form-item>
            <el-form-item label="SMTP服务器" v-if="notificationForm.emailEnabled">
              <el-input v-model="notificationForm.smtpHost" style="width: 300px" />
            </el-form-item>
            <el-form-item label="SMTP端口" v-if="notificationForm.emailEnabled">
              <el-input-number v-model="notificationForm.smtpPort" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="发送邮箱" v-if="notificationForm.emailEnabled">
              <el-input v-model="notificationForm.fromEmail" style="width: 300px" />
            </el-form-item>
            <el-form-item label="邮箱密码" v-if="notificationForm.emailEnabled">
              <el-input
                v-model="notificationForm.emailPassword"
                type="password"
                style="width: 300px"
              />
            </el-form-item>
            <el-form-item label="系统通知">
              <el-checkbox-group v-model="notificationForm.systemNotifications">
                <el-checkbox value="userRegistration">用户注册</el-checkbox>
                <el-checkbox value="orderCreated">新订单创建</el-checkbox>
                <el-checkbox value="systemError">系统错误</el-checkbox>
                <el-checkbox value="securityAlert">安全警告</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <!-- 系统配置 -->
        <el-card v-if="activeTab === 'system'">
          <template #header>
            <span>系统配置</span>
          </template>
          
          <el-form :model="systemForm" label-width="120px">
            <el-form-item label="调试模式">
              <el-switch v-model="systemForm.debugMode" />
              <span class="form-text">开启后会显示详细的错误信息</span>
            </el-form-item>
            <el-form-item label="缓存设置">
              <el-radio-group v-model="systemForm.cacheType">
                <el-radio value="memory">内存缓存</el-radio>
                <el-radio value="redis">Redis缓存</el-radio>
                <el-radio value="file">文件缓存</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="缓存过期时间">
              <el-input-number
                v-model="systemForm.cacheExpireTime"
                :min="1"
                :max="86400"
              />
              <span class="form-text">秒</span>
            </el-form-item>
            <el-form-item label="日志级别">
              <el-select v-model="systemForm.logLevel" style="width: 200px">
                <el-option label="调试" value="debug" />
                <el-option label="信息" value="info" />
                <el-option label="警告" value="warning" />
                <el-option label="错误" value="error" />
              </el-select>
            </el-form-item>
            <el-form-item label="数据备份">
              <el-switch v-model="systemForm.autoBackup" />
              <span class="form-text">自动备份数据库</span>
            </el-form-item>
            <el-form-item label="备份频率" v-if="systemForm.autoBackup">
              <el-select v-model="systemForm.backupFrequency" style="width: 200px">
                <el-option label="每天" value="daily" />
                <el-option label="每周" value="weekly" />
                <el-option label="每月" value="monthly" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSystemSettings">保存设置</el-button>
              <el-button type="danger" @click="clearCache">清除缓存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup >
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('basic')

const basicForm = reactive({
  siteName: '后台管理系统',
  siteDescription: '基于Vue3 + TypeScript + Element Plus的后台管理系统',
  adminEmail: 'admin@example.com',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN'
})

const securityForm = reactive({
  passwordPolicy: ['minLength', 'uppercase', 'lowercase', 'numbers'],
  loginLockEnabled: true,
  maxFailAttempts: 5,
  lockDuration: 30,
  sessionTimeout: 120
})

const notificationForm = reactive({
  emailEnabled: false,
  smtpHost: '',
  smtpPort: 587,
  fromEmail: '',
  emailPassword: '',
  systemNotifications: ['userRegistration', 'systemError']
})

const systemForm = reactive({
  debugMode: false,
  cacheType: 'memory',
  cacheExpireTime: 3600,
  logLevel: 'info',
  autoBackup: true,
  backupFrequency: 'daily'
})

const handleMenuSelect = (index) => {
  activeTab.value = index
}

const saveBasicSettings = () => {
  ElMessage.success('基础设置保存成功')
}

const saveSecuritySettings = () => {
  ElMessage.success('安全设置保存成功')
}

const saveNotificationSettings = () => {
  ElMessage.success('通知设置保存成功')
}

const saveSystemSettings = () => {
  ElMessage.success('系统配置保存成功')
}

const clearCache = () => {
  ElMessage.success('缓存清除成功')
}
</script>

<style scoped>
.settings-page {
  padding: 0;
}

.settings-menu {
  border-right: none;
}

.form-text {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>