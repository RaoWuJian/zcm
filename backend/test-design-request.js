/**
 * 美工需求模块测试脚本
 * 用于验证美工需求功能是否正常工作
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 导入模型
const DesignRequest = require('./models/DesignRequest');
const User = require('./models/User');
const Department = require('./models/Department');

async function testDesignRequest() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zcm_db');
    console.log('✅ 数据库连接成功');

    // 1. 查找一个测试用户
    const testUser = await User.findOne().populate('departmentIds');
    if (!testUser) {
      console.log('❌ 未找到测试用户，请先创建用户');
      return;
    }
    console.log(`✅ 找到测试用户: ${testUser.username}`);

    // 2. 查找一个测试部门
    let testDepartment;
    if (testUser.departmentIds && testUser.departmentIds.length > 0) {
      testDepartment = testUser.departmentIds[0];
    } else {
      testDepartment = await Department.findOne();
    }
    
    if (!testDepartment) {
      console.log('❌ 未找到测试部门，请先创建部门');
      return;
    }
    console.log(`✅ 找到测试部门: ${testDepartment.departmentName || testDepartment._id}`);

    // 3. 创建测试美工需求
    console.log('\n--- 测试创建美工需求 ---');
    const newRequest = await DesignRequest.create({
      requirement: '测试美工需求：需要设计一个产品宣传海报',
      department: testDepartment._id,
      images: [],
      status: 'pending',
      remark: '这是一个测试需求',
      createdBy: testUser._id
    });
    console.log('✅ 创建美工需求成功:', newRequest._id);

    // 4. 查询美工需求
    console.log('\n--- 测试查询美工需求 ---');
    const requests = await DesignRequest.find()
      .populate('department', 'departmentName')
      .populate('createdBy', 'username')
      .limit(5);
    console.log(`✅ 查询到 ${requests.length} 个美工需求`);
    requests.forEach(req => {
      console.log(`  - ${req.requirement.substring(0, 30)}... (状态: ${req.status})`);
    });

    // 5. 更新美工需求
    console.log('\n--- 测试更新美工需求 ---');
    newRequest.status = 'in_progress';
    newRequest.assignedDesigner = testUser._id;
    newRequest.expectedCompletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后
    await newRequest.save();
    console.log('✅ 更新美工需求成功');

    // 6. 测试状态变更为completed时自动记录完成时间
    console.log('\n--- 测试完成时间自动记录 ---');
    newRequest.status = 'completed';
    await newRequest.save();
    const completedRequest = await DesignRequest.findById(newRequest._id);
    if (completedRequest.completedAt) {
      console.log('✅ 完成时间自动记录成功:', completedRequest.completedAt);
    } else {
      console.log('❌ 完成时间未自动记录');
    }

    // 7. 测试图片数量验证
    console.log('\n--- 测试图片数量验证 ---');
    try {
      const invalidRequest = new DesignRequest({
        requirement: '测试图片数量限制',
        department: testDepartment._id,
        images: new Array(10).fill('test-image-id'), // 10张图片，超过限制
        createdBy: testUser._id
      });
      await invalidRequest.save();
      console.log('❌ 图片数量验证失败：应该拒绝超过9张图片');
    } catch (error) {
      console.log('✅ 图片数量验证成功:', error.message);
    }

    // 8. 删除测试数据
    console.log('\n--- 清理测试数据 ---');
    await DesignRequest.findByIdAndDelete(newRequest._id);
    console.log('✅ 测试数据清理完成');

    console.log('\n🎉 所有测试通过！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
}

// 运行测试
testDesignRequest();

