const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Department = require('./models/Department');

async function debugUserDepartments() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zcm_db');
    console.log('✅ 数据库连接成功');

    // 查找所有用户
    const users = await User.find({}).populate('departmentIds');
    console.log('\n📋 所有用户信息:');
    users.forEach(user => {
      console.log(`- 用户: ${user.username} (${user.loginAccount})`);
      console.log(`  部门数量: ${user.departmentIds?.length || 0}`);
      if (user.departmentIds && user.departmentIds.length > 0) {
        user.departmentIds.forEach(dept => {
          console.log(`    - ${dept.departmentName} (ID: ${dept._id})`);
          console.log(`      上级部门ID: ${dept.parentId || '无'}`);
        });
      }
      console.log('');
    });

    // 查找所有部门
    const departments = await Department.find({});
    console.log('\n🏢 所有部门信息:');
    departments.forEach(dept => {
      console.log(`- 部门: ${dept.departmentName} (ID: ${dept._id})`);
      console.log(`  上级部门ID: ${dept.parentId || '无'}`);
      console.log(`  层级: ${dept.level}`);
      console.log('');
    });

    // 查找七部财务相关的用户
    const sevenDeptUsers = await User.find({}).populate({
      path: 'departmentIds',
      match: { departmentName: /七部|财务/i }
    });
    
    console.log('\n💰 七部财务相关用户:');
    sevenDeptUsers.forEach(user => {
      if (user.departmentIds && user.departmentIds.length > 0) {
        console.log(`- 用户: ${user.username} (${user.loginAccount})`);
        user.departmentIds.forEach(dept => {
          if (dept) {
            console.log(`  部门: ${dept.departmentName}`);
          }
        });
      }
    });

  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

debugUserDepartments();
