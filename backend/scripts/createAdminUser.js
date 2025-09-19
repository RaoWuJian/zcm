#!/usr/bin/env node
'use strict';

/**
 * 创建管理员用户脚本
 * 
 * 使用方法:
 * node createAdminUser.js --username "管理员" --account "admin" --password "123456" --remark "系统管理员"
 * 
 * 参数说明:
 * --username: 用户显示名称 (必填)
 * --account: 登录账号 (必填)
 * --password: 登录密码 (必填，至少6位)
 * --remark: 备注信息 (可选)
 * --force: 强制覆盖已存在的用户 (可选)
 */

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
}
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
}

const User = require('../models/User');
const Role = require('../models/Role');

const DEFAULT_URI = 'mongodb://localhost:27017/zcm_db';

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 参数解析工具
function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function requireArg(name, description) {
  const value = getArg(name);
  if (!value) {
    colorLog('red', `错误: 缺少必需参数 --${name} (${description})`);
    showUsage();
    process.exit(1);
  }
  return value;
}

function showUsage() {
  console.log('\n使用方法:');
  console.log('node createAdminUser.js --username "管理员" --account "admin" --password "123456" [选项]');
  console.log('\n必需参数:');
  console.log('  --username    用户显示名称');
  console.log('  --account     登录账号 (3-30个字符)');
  console.log('  --password    登录密码 (至少6个字符)');
  console.log('\n可选参数:');
  console.log('  --remark      备注信息');
  console.log('  --force       强制覆盖已存在的用户');
  console.log('  --help        显示帮助信息');
  console.log('\n示例:');
  console.log('node createAdminUser.js --username "系统管理员" --account "admin" --password "admin123456" --remark "超级管理员账户"');
}

// 验证参数
function validateParams(username, account, password) {
  const errors = [];

  if (username.length > 50) {
    errors.push('用户名最多50个字符');
  }

  if (account.length < 3 || account.length > 30) {
    errors.push('登录账号必须在3-30个字符之间');
  }

  if (!/^[a-zA-Z0-9_]+$/.test(account)) {
    errors.push('登录账号只能包含字母、数字和下划线');
  }

  if (password.length < 6) {
    errors.push('密码至少6个字符');
  }

  return errors;
}

// 创建超级管理员角色
async function createSuperAdminRole() {
  try {
    let superAdminRole = await Role.findOne({ name: '超级管理员' });
    
    if (!superAdminRole) {
      colorLog('yellow', '创建超级管理员角色...');
      superAdminRole = await Role.create({
        name: '超级管理员',
        description: '系统超级管理员，拥有所有权限',
        permissions: [
          // 用户管理权限
          'user:view', 'user:create', 'user:update', 'user:delete', 'user:manage',
          // 角色管理权限
          'role:view', 'role:create', 'role:update', 'role:delete', 'role:manage',
          // 部门管理权限
          'department:view', 'department:create', 'department:update', 'department:delete', 'department:manage',
          // 商品管理权限
          'product:view', 'product:create', 'product:update', 'product:delete', 'product:manage',
          // 财务管理权限
          'finance:view', 'finance:create', 'finance:update', 'finance:delete', 'finance:manage',
          // 佣金管理权限
          'commission:view', 'commission:create', 'commission:update', 'commission:delete', 'commission:manage',
          // 预算管理权限
          'budget:view', 'budget:create', 'budget:update', 'budget:delete', 'budget:manage',
          // 系统管理权限
          'system:view', 'system:manage'
        ],
        isActive: true
      });
      colorLog('green', '超级管理员角色创建成功');
    }
    
    return superAdminRole;
  } catch (error) {
    colorLog('red', `创建超级管理员角色失败: ${error.message}`);
    throw error;
  }
}

async function main() {
  // 检查帮助参数
  if (hasFlag('help')) {
    showUsage();
    process.exit(0);
  }

  // 获取参数
  const username = requireArg('username', '用户显示名称');
  const account = requireArg('account', '登录账号');
  const password = requireArg('password', '登录密码');
  const remark = getArg('remark') || '系统管理员账户';
  const force = hasFlag('force');

  // 验证参数
  const validationErrors = validateParams(username, account, password);
  if (validationErrors.length > 0) {
    colorLog('red', '参数验证失败:');
    validationErrors.forEach(error => colorLog('red', `  - ${error}`));
    process.exit(1);
  }

  // 连接数据库
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  colorLog('blue', `连接数据库: ${uri}`);
  
  try {
    await mongoose.connect(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    colorLog('green', '数据库连接成功');
  } catch (error) {
    colorLog('red', `数据库连接失败: ${error.message}`);
    process.exit(1);
  }

  try {
    // 检查用户是否已存在
    let existingUser = await User.findOne({ loginAccount: account });
    
    if (existingUser && !force) {
      colorLog('yellow', `用户 "${account}" 已存在`);
      colorLog('yellow', '如果要覆盖现有用户，请使用 --force 参数');
      process.exit(1);
    }

    // 创建或获取超级管理员角色
    const superAdminRole = await createSuperAdminRole();

    let user;
    if (existingUser && force) {
      // 更新现有用户
      colorLog('yellow', `更新现有用户: ${account}`);
      existingUser.username = username;
      existingUser.loginPassword = password; // 会通过pre-save钩子自动加密
      existingUser.remark = remark;
      existingUser.isActive = true;
      existingUser.isAdmin = true;
      existingUser.rolePermission = superAdminRole._id;
      existingUser.departmentPath = '';
      
      user = await existingUser.save();
      colorLog('green', `管理员用户 "${account}" 更新成功!`);
    } else {
      // 创建新用户
      colorLog('blue', `创建新管理员用户: ${account}`);
      user = await User.create({
        username,
        loginAccount: account,
        loginPassword: password, // 会通过pre-save钩子自动加密
        remark,
        isActive: true,
        isAdmin: true,
        rolePermission: superAdminRole._id,
        departmentPath: ''
      });
      colorLog('green', `管理员用户 "${account}" 创建成功!`);
    }

    // 显示用户信息
    console.log('\n用户信息:');
    console.log(`  ID: ${user._id}`);
    console.log(`  用户名: ${user.username}`);
    console.log(`  登录账号: ${user.loginAccount}`);
    console.log(`  备注: ${user.remark}`);
    console.log(`  角色: 超级管理员`);
    console.log(`  状态: ${user.isActive ? '激活' : '禁用'}`);
    console.log(`  创建时间: ${user.createdAt.toLocaleString('zh-CN')}`);

  } catch (error) {
    colorLog('red', `操作失败: ${error.message}`);
    if (error.code === 11000) {
      colorLog('red', '登录账号已存在，请使用不同的账号名');
    }
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    colorLog('blue', '数据库连接已关闭');
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  colorLog('red', `未捕获的异常: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  colorLog('red', `未处理的Promise拒绝: ${reason}`);
  process.exit(1);
});

// 运行主函数
main().catch((error) => {
  colorLog('red', `脚本执行失败: ${error.message}`);
  process.exit(1);
});
