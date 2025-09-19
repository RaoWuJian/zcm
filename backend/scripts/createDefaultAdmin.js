#!/usr/bin/env node
'use strict';

/**
 * 快速创建默认管理员用户脚本
 * 
 * 使用方法:
 * node createDefaultAdmin.js
 * 
 * 默认创建:
 * - 用户名: 系统管理员
 * - 登录账号: admin
 * - 密码: admin123456
 * - 角色: 超级管理员
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

// 默认管理员信息
const DEFAULT_ADMIN = {
  username: '系统管理员',
  loginAccount: 'yanqiadmin',
  loginPassword: 'yanqi123456',
  remark: '系统默认管理员账户'
};

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

// 创建超级管理员角色
async function createSuperAdminRole() {
  try {
    let superAdminRole = await Role.findOne({ roleName: '超级管理员' });

    if (!superAdminRole) {
      colorLog('yellow', '创建超级管理员角色...');

      // 生成8位唯一编码
      const code = 'ADMIN' + Date.now().toString().slice(-3);

      // 创建一个临时用户ID用于角色创建
      const tempUserId = new mongoose.Types.ObjectId();

      superAdminRole = await Role.create({
        roleName: '超级管理员',
        code: code,
        description: '系统超级管理员，拥有所有权限',
        permissions: [
          // 用户管理权限
          'user:read', 'user:create', 'user:update', 'user:delete', 'user:manage',
          // 角色管理权限
          'role:read', 'role:create', 'role:update', 'role:delete', 'role:manage',
          // 部门管理权限
          'department:read', 'department:create', 'department:update', 'department:delete', 'department:manage',
          // 商品管理权限
          'product:read', 'product:create', 'product:update', 'product:delete', 'product:budget', 'product:commission', 'product:manage',
          // 财务管理权限
          'finance:read', 'finance:create', 'finance:update', 'finance:delete', 'finance:approve', 'finance:manage',
          // 团队财务账户权限
          'finance:team_read', 'finance:team_manage'
        ],
        createdBy: tempUserId,
        createdByDepartmentPath: ''
      });
      colorLog('green', '超级管理员角色创建成功');
    } else {
      colorLog('blue', '超级管理员角色已存在');
    }

    return superAdminRole;
  } catch (error) {
    colorLog('red', `创建超级管理员角色失败: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    colorLog('cyan', '='.repeat(60));
    colorLog('cyan', '              快速创建默认管理员用户');
    colorLog('cyan', '='.repeat(60));
    console.log('');

    // 连接数据库
    const uri = process.env.MONGODB_URI || DEFAULT_URI;
    colorLog('blue', `连接数据库: ${uri}`);
    
    await mongoose.connect(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    colorLog('green', '数据库连接成功');
    console.log('');

    // 检查是否已存在管理员用户
    const existingUser = await User.findOne({ loginAccount: DEFAULT_ADMIN.loginAccount });
    
    if (existingUser) {
      colorLog('yellow', `管理员用户 "${DEFAULT_ADMIN.loginAccount}" 已存在`);
      
      // 确保现有用户是管理员
      if (!existingUser.isAdmin) {
        colorLog('yellow', '将现有用户设置为管理员...');
        existingUser.isAdmin = true;
        existingUser.isActive = true;
        await existingUser.save();
        colorLog('green', '用户已设置为管理员');
      }
      
      // 显示现有用户信息
      console.log('');
      colorLog('blue', '现有管理员用户信息:');
      console.log(`  ID: ${existingUser._id}`);
      console.log(`  用户名: ${existingUser.username}`);
      console.log(`  登录账号: ${existingUser.loginAccount}`);
      console.log(`  备注: ${existingUser.remark}`);
      console.log(`  状态: ${existingUser.isActive ? '激活' : '禁用'}`);
      console.log(`  管理员: ${existingUser.isAdmin ? '是' : '否'}`);
      console.log(`  创建时间: ${existingUser.createdAt.toLocaleString('zh-CN')}`);
      
      return;
    }

    // 创建或获取超级管理员角色
    const superAdminRole = await createSuperAdminRole();

    // 创建默认管理员用户
    colorLog('blue', '创建默认管理员用户...');
    
    const user = await User.create({
      username: DEFAULT_ADMIN.username,
      loginAccount: DEFAULT_ADMIN.loginAccount,
      loginPassword: DEFAULT_ADMIN.loginPassword,
      remark: DEFAULT_ADMIN.remark,
      isActive: true,
      isAdmin: true,
      rolePermission: superAdminRole._id,
      departmentPath: ''
    });

    colorLog('green', '默认管理员用户创建成功!');

    // 显示用户信息
    console.log('');
    colorLog('green', '='.repeat(60));
    colorLog('green', '                用户创建成功');
    colorLog('green', '='.repeat(60));
    console.log(`  ID: ${user._id}`);
    console.log(`  用户名: ${user.username}`);
    console.log(`  登录账号: ${user.loginAccount}`);
    console.log(`  登录密码: ${DEFAULT_ADMIN.loginPassword}`);
    console.log(`  备注: ${user.remark}`);
    console.log(`  角色: 超级管理员`);
    console.log(`  状态: ${user.isActive ? '激活' : '禁用'}`);
    console.log(`  创建时间: ${user.createdAt.toLocaleString('zh-CN')}`);
    console.log('');
    
    colorLog('cyan', '='.repeat(60));
    colorLog('cyan', '                 登录信息');
    colorLog('cyan', '='.repeat(60));
    colorLog('yellow', `  账号: ${user.loginAccount}`);
    colorLog('yellow', `  密码: ${DEFAULT_ADMIN.loginPassword}`);
    console.log('');
    colorLog('magenta', '请妥善保管登录信息，建议首次登录后立即修改密码！');
    console.log('');

  } catch (error) {
    colorLog('red', `操作失败: ${error.message}`);
    
    if (error.code === 11000) {
      colorLog('red', '登录账号已存在');
    } else if (error.name === 'ValidationError') {
      colorLog('red', '数据验证失败:');
      Object.values(error.errors).forEach(err => {
        colorLog('red', `  - ${err.message}`);
      });
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
