const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');

async function testSuperiorUsersAPI() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zcm_db');
    console.log('✅ 数据库连接成功');

    // 查找七部财务用户
    const sevenDeptUser = await User.findOne({ loginAccount: 'xinyu008' }).populate('departmentIds');
    
    if (!sevenDeptUser) {
      console.log('❌ 未找到七部财务用户');
      return;
    }

    console.log('\n👤 测试用户信息:');
    console.log(`- 用户: ${sevenDeptUser.username} (${sevenDeptUser.loginAccount})`);
    console.log(`- 用户ID: ${sevenDeptUser._id}`);
    console.log(`- 部门数量: ${sevenDeptUser.departmentIds?.length || 0}`);
    
    if (sevenDeptUser.departmentIds && sevenDeptUser.departmentIds.length > 0) {
      sevenDeptUser.departmentIds.forEach(dept => {
        console.log(`  - 部门: ${dept.departmentName} (ID: ${dept._id})`);
        console.log(`    上级部门ID: ${dept.parentId || '无'}`);
      });
    }

    // 模拟getSuperiorUsers函数的逻辑
    console.log('\n🔍 开始查找上级用户...');
    
    const superiorUsers = [];
    const Department = require('./models/Department');

    // 获取当前用户所在的部门
    for (const department of sevenDeptUser.departmentIds) {
      console.log(`\n处理部门: ${department.departmentName}, parentId: ${department.parentId}`);
      
      // 1. 获取直属上级部门的人员
      if (department.parentId) {
        try {
          const parentDept = await Department.findById(department.parentId);
          console.log(`上级部门: ${parentDept?.departmentName}`);
          
          if (parentDept) {
            const parentUsers = await User.find({
              departmentIds: parentDept._id,
              isActive: true
            }).select('username loginAccount departmentIds');

            console.log(`上级部门用户数量: ${parentUsers.length}`);
            parentUsers.forEach(user => {
              console.log(`  - ${user.username} (${user.loginAccount})`);
            });

            superiorUsers.push(...parentUsers.map(user => ({
              _id: user._id,
              username: user.username,
              loginAccount: user.loginAccount,
              relation: '上级部门',
              departmentName: parentDept.departmentName
            })));

            // 2. 获取上上级部门的人员
            if (parentDept.parentId) {
              try {
                const grandParentDept = await Department.findById(parentDept.parentId);
                console.log(`上上级部门: ${grandParentDept?.departmentName}`);
                
                if (grandParentDept) {
                  const grandParentUsers = await User.find({
                    departmentIds: grandParentDept._id,
                    isActive: true
                  }).select('username loginAccount departmentIds');

                  console.log(`上上级部门用户数量: ${grandParentUsers.length}`);
                  grandParentUsers.forEach(user => {
                    console.log(`  - ${user.username} (${user.loginAccount})`);
                  });

                  superiorUsers.push(...grandParentUsers.map(user => ({
                    _id: user._id,
                    username: user.username,
                    loginAccount: user.loginAccount,
                    relation: '上上级部门',
                    departmentName: grandParentDept.departmentName
                  })));
                }
              } catch (grandParentError) {
                console.error('获取上上级部门失败:', grandParentError);
              }
            } else {
              console.log('上级部门没有上上级部门');
            }
          }
        } catch (parentError) {
          console.error('获取上级部门失败:', parentError);
        }
      } else {
        console.log('部门没有上级部门');
      }
    }

    // 去重
    const uniqueUsers = [];
    const userMap = new Map();

    superiorUsers.forEach(user => {
      const key = user._id.toString();
      if (!userMap.has(key)) {
        userMap.set(key, user);
        uniqueUsers.push(user);
      }
    });

    console.log(`\n📊 最终结果:`);
    console.log(`找到的上级用户数量: ${uniqueUsers.length}`);
    uniqueUsers.forEach(user => {
      console.log(`- ${user.username} (${user.loginAccount}) - ${user.relation} - ${user.departmentName}`);
    });

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

testSuperiorUsersAPI();
