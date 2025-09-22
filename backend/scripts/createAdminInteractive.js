#!/usr/bin/env node
'use strict';

/**
 * 交互式创建管理员用户脚本
 * 
 * 使用方法:
 * node createAdminInteractive.js
 * 
 * 然后按照提示输入用户信息
 */

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const readline = require('readline');

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

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 封装问题询问
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// 隐藏密码输入
function questionPassword(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    
    const onData = (char) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          console.log('');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit(1);
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    };
    
    process.stdin.on('data', onData);
  });
}

// 验证输入
function validateInput(type, value) {
  switch (type) {
    case 'username':
      if (!value.trim()) return '用户名不能为空';
      if (value.length > 50) return '用户名最多50个字符';
      return null;
    
    case 'account':
      if (!value.trim()) return '登录账号不能为空';
      if (value.length < 3 || value.length > 30) return '登录账号必须在3-30个字符之间';
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return '登录账号只能包含字母、数字和下划线';
      return null;
    
    case 'password':
      if (!value) return '密码不能为空';
      if (value.length < 6) return '密码至少6个字符';
      return null;
    
    default:
      return null;
  }
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
          'user:view', 'user:create', 'user:update', 'user:delete', 'user:manage',
          'role:view', 'role:create', 'role:update', 'role:delete', 'role:manage',
          'department:view', 'department:create', 'department:update', 'department:delete', 'department:manage',
          'product:view', 'product:create', 'product:update', 'product:delete', 'product:manage',
          'finance:view', 'finance:create', 'finance:update', 'finance:delete', 'finance:manage',
          'commission:view', 'commission:create', 'commission:update', 'commission:delete', 'commission:manage',
          'budget:view', 'budget:create', 'budget:update', 'budget:delete', 'budget:manage',
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
  try {
    colorLog('cyan', '='.repeat(50));
    colorLog('cyan', '         创建管理员用户向导');
    colorLog('cyan', '='.repeat(50));
    console.log('');

    // 连接数据库
    const uri = process.env.MONGODB_URI || DEFAULT_URI;
    colorLog('blue', `连接数据库: ${uri}`);
    
    await mongoose.connect(uri);
    colorLog('green', '数据库连接成功');
    console.log('');

    // 收集用户信息
    let username, account, password, remark;

    // 用户名
    while (true) {
      username = await question('请输入用户显示名称: ');
      const error = validateInput('username', username);
      if (error) {
        colorLog('red', error);
        continue;
      }
      break;
    }

    // 登录账号
    while (true) {
      account = await question('请输入登录账号 (3-30个字符，只能包含字母、数字和下划线): ');
      const error = validateInput('account', account);
      if (error) {
        colorLog('red', error);
        continue;
      }

      // 检查账号是否已存在
      const existingUser = await User.findOne({ loginAccount: account });
      if (existingUser) {
        const overwrite = await question(`账号 "${account}" 已存在，是否覆盖? (y/N): `);
        if (overwrite.toLowerCase() === 'y' || overwrite.toLowerCase() === 'yes') {
          break;
        }
        continue;
      }
      break;
    }

    // 密码
    while (true) {
      password = await questionPassword('请输入登录密码 (至少6个字符): ');
      const error = validateInput('password', password);
      if (error) {
        colorLog('red', error);
        continue;
      }

      const confirmPassword = await questionPassword('请确认密码: ');
      if (password !== confirmPassword) {
        colorLog('red', '两次输入的密码不一致');
        continue;
      }
      break;
    }

    // 备注
    remark = await question('请输入备注信息 (可选): ');
    if (!remark.trim()) {
      remark = '系统管理员账户';
    }

    console.log('');
    colorLog('yellow', '确认信息:');
    console.log(`  用户名: ${username}`);
    console.log(`  登录账号: ${account}`);
    console.log(`  密码: ${'*'.repeat(password.length)}`);
    console.log(`  备注: ${remark}`);
    console.log('');

    const confirm = await question('确认创建管理员用户? (Y/n): ');
    if (confirm.toLowerCase() === 'n' || confirm.toLowerCase() === 'no') {
      colorLog('yellow', '操作已取消');
      return;
    }

    // 创建或获取超级管理员角色
    const superAdminRole = await createSuperAdminRole();

    // 检查用户是否已存在
    let existingUser = await User.findOne({ loginAccount: account });
    let user;

    if (existingUser) {
      // 更新现有用户
      colorLog('yellow', `更新现有用户: ${account}`);
      existingUser.username = username;
      existingUser.loginPassword = password;
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
        loginPassword: password,
        remark,
        isActive: true,
        isAdmin: true,
        rolePermission: superAdminRole._id,
        departmentPath: ''
      });
      colorLog('green', `管理员用户 "${account}" 创建成功!`);
    }

    // 显示用户信息
    console.log('');
    colorLog('green', '='.repeat(50));
    colorLog('green', '           用户创建成功');
    colorLog('green', '='.repeat(50));
    console.log(`  ID: ${user._id}`);
    console.log(`  用户名: ${user.username}`);
    console.log(`  登录账号: ${user.loginAccount}`);
    console.log(`  备注: ${user.remark}`);
    console.log(`  角色: 超级管理员`);
    console.log(`  状态: ${user.isActive ? '激活' : '禁用'}`);
    console.log(`  创建时间: ${user.createdAt.toLocaleString('zh-CN')}`);
    console.log('');
    colorLog('cyan', '现在您可以使用此账号登录系统了！');

  } catch (error) {
    colorLog('red', `操作失败: ${error.message}`);
    if (error.code === 11000) {
      colorLog('red', '登录账号已存在');
    }
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.connection.close();
    colorLog('blue', '数据库连接已关闭');
  }
}

// 处理Ctrl+C
process.on('SIGINT', () => {
  console.log('\n');
  colorLog('yellow', '操作已取消');
  rl.close();
  process.exit(0);
});

// 运行主函数
main().catch((error) => {
  colorLog('red', `脚本执行失败: ${error.message}`);
  rl.close();
  process.exit(1);
});
