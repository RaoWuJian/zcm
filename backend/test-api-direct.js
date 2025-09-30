const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const { getSuperiorUsers } = require('./controllers/userController');

async function testAPIDirectly() {
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

    // 生成JWT token
    const token = jwt.sign({ id: sevenDeptUser._id }, process.env.JWT_SECRET || 'test_secret', {
      expiresIn: '1h'
    });

    console.log('\n🔑 生成的Token:', token.substring(0, 50) + '...');

    // 模拟请求对象
    const mockReq = {
      user: sevenDeptUser,
      headers: {
        authorization: `Bearer ${token}`
      }
    };

    // 模拟响应对象
    const mockRes = {
      json: (data) => {
        console.log('\n📊 API响应结果:');
        console.log(JSON.stringify(data, null, 2));
        return mockRes;
      },
      status: (code) => {
        console.log(`\n📡 HTTP状态码: ${code}`);
        return mockRes;
      }
    };

    // 直接调用getSuperiorUsers函数
    console.log('\n🚀 调用getSuperiorUsers API...');
    await getSuperiorUsers(mockReq, mockRes);

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

testAPIDirectly();
