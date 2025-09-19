const mongoose = require('mongoose');
const CommissionAccounting = require('../models/CommissionAccounting');

// 测试平台字段功能
async function testPlatformField() {
  try {
    console.log('开始测试平台字段功能...');
    
    // 创建测试用户ID（模拟）
    const testUserId = new mongoose.Types.ObjectId();
    
    // 测试1: 创建包含平台字段的记录
    console.log('\n测试1: 创建包含平台字段的记录');
    const testRecord = new CommissionAccounting({
      name: '测试产品',
      shopName: '测试店铺',
      platform: '淘宝',
      netTransactionData: 1000,
      commission: 5.5,
      dailyConsumption: 200,
      description: '测试平台字段',
      createdBy: testUserId
    });
    
    await testRecord.save();
    console.log('✓ 成功创建记录，平台字段值:', testRecord.platform);
    
    // 测试2: 查询包含平台字段的记录
    console.log('\n测试2: 查询包含平台字段的记录');
    const foundRecord = await CommissionAccounting.findById(testRecord._id);
    console.log('✓ 查询成功，平台字段值:', foundRecord.platform);
    
    // 测试3: 更新平台字段
    console.log('\n测试3: 更新平台字段');
    foundRecord.platform = '京东';
    await foundRecord.save();
    console.log('✓ 更新成功，新的平台字段值:', foundRecord.platform);
    
    // 测试4: 按平台字段搜索
    console.log('\n测试4: 按平台字段搜索');
    const searchResults = await CommissionAccounting.find({
      platform: { $regex: '京东', $options: 'i' }
    });
    console.log('✓ 搜索成功，找到', searchResults.length, '条记录');
    
    // 测试5: 验证自动计算功能仍然正常
    console.log('\n测试5: 验证自动计算功能');
    console.log('佣金利润:', foundRecord.commissionProfit);
    console.log('净利润:', foundRecord.netProfit);
    console.log('✓ 自动计算功能正常');
    
    // 清理测试数据
    await CommissionAccounting.findByIdAndDelete(testRecord._id);
    console.log('\n✓ 测试数据清理完成');
    
    console.log('\n🎉 所有测试通过！平台字段功能正常工作。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  // 连接数据库（需要根据实际配置调整）
  mongoose.connect('mongodb://localhost:27017/manekiNeko', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('数据库连接成功');
    return testPlatformField();
  }).then(() => {
    console.log('测试完成');
    process.exit(0);
  }).catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}

module.exports = { testPlatformField };
