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

    
    // 检查是否已存在管理员账户
    const existingAdmin = await User.findOne({ 
      $or: [
        { loginAccount: adminUserData.loginAccount },
        { isAdmin: true }
      ]
    });

    if (existingAdmin) {
       // console.log('✅ 管理员账户已存在:', {
        用户名: existingAdmin.username,
        登录账号: existingAdmin.loginAccount,
        部门路径: existingAdmin.departmentPath,
        创建时间: existingAdmin.createdAt
      });
      return existingAdmin;
    }


    
    // 创建新的管理员账户
    const adminUser = await User.create(adminUserData);
    

     // console.log('📋 账户信息:', {
      用户名: adminUser.username,
      登录账号: adminUser.loginAccount,
      初始密码: adminUserData.loginPassword,
      角色权限: adminUser.rolePermission,
      部门路径: adminUser.departmentPath,
      管理员权限: adminUser.isAdmin,
      账户状态: adminUser.isActive ? '活跃' : '禁用',
      创建时间: adminUser.createdAt
    });
    

    
    return adminUser;
    
  } catch (error) {

    throw error;
  }
};

/**
 * 初始化数据库和管理员账户
 */
const initializeSystem = async () => {
  try {


    
    // 连接数据库
    await connectDB();
    
    // 创建管理员账户
    await createAdminUser();
    








    
  } catch (error) {

    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();

    process.exit(0);
  }
};

/**
 * 重置管理员密码
 */
const resetAdminPassword = async (newPassword = '123456') => {
  try {

    
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

      return;
    }
    
    // 更新密码
    adminUser.loginPassword = newPassword;
    // 清除rolePermission以避免验证错误
    adminUser.rolePermission = undefined;
    await adminUser.save();
    


    
  } catch (error) {

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