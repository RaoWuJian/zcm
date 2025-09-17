const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/database');

// 加载环境变量
require('dotenv').config({ path: __dirname + '/.env' });

// 初始化管理员账户数据
const adminUserData = {
  username: '系统管理员',
  loginAccount: 'admin',
  loginPassword: '123456', // 初始密码，建议首次登录后修改
  remark: '系统初始化创建的管理员账户',
  rolePermission: null, // 先设为null，后面才设置
  departmentPath: '',
  isActive: true,
  isAdmin: true
};

/**
 * 创建管理员账户
 */
const createAdminUser = async () => {
  try {
    console.log('🔍 检查管理员账户是否存在...');
    
    // 检查是否已存在管理员账户
    const existingAdmin = await User.findOne({ 
      $or: [
        { loginAccount: adminUserData.loginAccount },
        { isAdmin: true }
      ]
    });

    if (existingAdmin) {
      console.log('✅ 管理员账户已存在:', {
        用户名: existingAdmin.username,
        登录账号: existingAdmin.loginAccount,
        部门路径: existingAdmin.departmentPath,
        创建时间: existingAdmin.createdAt
      });
      return existingAdmin;
    }

    console.log('🚀 创建管理员账户...');
    
    // 创建新的管理员账户
    const adminUser = await User.create(adminUserData);
    
    console.log('✅ 管理员账户创建成功!');
    console.log('📋 账户信息:', {
      用户名: adminUser.username,
      登录账号: adminUser.loginAccount,
      初始密码: adminUserData.loginPassword,
      角色权限: adminUser.rolePermission,
      部门路径: adminUser.departmentPath,
      管理员权限: adminUser.isAdmin,
      账户状态: adminUser.isActive ? '活跃' : '禁用',
      创建时间: adminUser.createdAt
    });
    
    console.log('⚠️  安全提醒: 请在首次登录后立即修改默认密码!');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ 创建管理员账户失败:', error.message);
    throw error;
  }
};

/**
 * 初始化数据库和管理员账户
 */
const initializeSystem = async () => {
  try {
    console.log('🚀 开始系统初始化...');
    console.log('📡 连接数据库:', process.env.MONGODB_URI);
    
    // 连接数据库
    await connectDB();
    
    // 创建管理员账户
    await createAdminUser();
    
    console.log('🎉 系统初始化完成!');
    console.log('\n🔐 管理员登录信息:');
    console.log('   登录账号:', adminUserData.loginAccount);
    console.log('   初始密码:', adminUserData.loginPassword);
    console.log('\n📡 API端点:');
    console.log('   注册: POST /api/users/register');
    console.log('   登录: POST /api/users/login');
    console.log('   用户管理: GET /api/users');
    
  } catch (error) {
    console.error('❌ 系统初始化失败:', error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n📡 数据库连接已关闭');
    process.exit(0);
  }
};

/**
 * 重置管理员密码
 */
const resetAdminPassword = async (newPassword = '123456') => {
  try {
    console.log('🔑 重置管理员密码...');
    
    // 连接数据库
    await connectDB();
    
    // 查找管理员账户
    const adminUser = await User.findOne({ 
      $or: [
        { loginAccount: 'admin' },
        { isAdmin: true }
      ]
    });
    
    if (!adminUser) {
      console.log('❌ 未找到管理员账户，请先运行初始化');
      return;
    }
    
    // 更新密码
    adminUser.loginPassword = newPassword;
    // 清除rolePermission以避免验证错误
    adminUser.rolePermission = undefined;
    await adminUser.save();
    
    console.log('✅ 管理员密码重置成功!');
    console.log('🔐 新密码:', newPassword);
    
  } catch (error) {
    console.error('❌ 重置密码失败:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'reset-password':
    const newPassword = args[1] || 'admin123456';
    resetAdminPassword(newPassword);
    break;
  case 'init':
  default:
    initializeSystem();
    break;
}

module.exports = {
  createAdminUser,
  initializeSystem,
  resetAdminPassword
};