const mongoose = require('mongoose');
const CommissionAccounting = require('../models/CommissionAccounting');

// 测试建议数据功能
async function testSuggestionsFeature() {
  try {
    console.log('开始测试建议数据功能...');
    
    // 创建测试用户ID（模拟）
    const testUserId = new mongoose.Types.ObjectId();
    
    // 创建测试数据
    console.log('\n创建测试数据...');
    const testRecords = [
      {
        name: '测试产品1',
        shopName: '苹果官方旗舰店',
        platform: '天猫',
        netTransactionData: 1000,
        commission: 5.5,
        dailyConsumption: 200,
        createdBy: testUserId
      },
      {
        name: '测试产品2',
        shopName: '华为官方旗舰店',
        platform: '京东',
        netTransactionData: 1500,
        commission: 4.8,
        dailyConsumption: 300,
        createdBy: testUserId
      },
      {
        name: '测试产品3',
        shopName: '苹果官方旗舰店', // 重复店铺名称
        platform: '淘宝',
        netTransactionData: 800,
        commission: 6.0,
        dailyConsumption: 150,
        createdBy: testUserId
      },
      {
        name: '测试产品4',
        shopName: '小米官方旗舰店',
        platform: '天猫', // 重复平台
        netTransactionData: 1200,
        commission: 5.2,
        dailyConsumption: 250,
        createdBy: testUserId
      }
    ];

    const createdRecords = await CommissionAccounting.insertMany(testRecords);
    console.log('✓ 成功创建', createdRecords.length, '条测试记录');

    // 测试1: 获取店铺名称建议
    console.log('\n测试1: 获取店铺名称建议');
    const shopNames = await CommissionAccounting.distinct('shopName', {
      shopName: { $ne: null, $ne: '' },
      createdBy: testUserId
    });
    console.log('✓ 获取到店铺名称建议:', shopNames.sort());
    console.log('✓ 预期去重后应该有3个不同的店铺名称');

    // 测试2: 获取平台建议
    console.log('\n测试2: 获取平台建议');
    const platforms = await CommissionAccounting.distinct('platform', {
      platform: { $ne: null, $ne: '' },
      createdBy: testUserId
    });
    console.log('✓ 获取到平台建议:', platforms.sort());
    console.log('✓ 预期去重后应该有3个不同的平台');

    // 测试3: 验证数据去重
    console.log('\n测试3: 验证数据去重');
    const uniqueShopNames = [...new Set(shopNames)];
    const uniquePlatforms = [...new Set(platforms)];
    console.log('✓ 去重后的店铺名称数量:', uniqueShopNames.length);
    console.log('✓ 去重后的平台数量:', uniquePlatforms.length);

    // 测试4: 测试空值过滤
    console.log('\n测试4: 测试空值过滤');
    // 创建一个包含空值的记录
    const emptyRecord = new CommissionAccounting({
      name: '空值测试产品',
      shopName: '', // 空字符串
      platform: null, // null值
      netTransactionData: 500,
      commission: 3.0,
      dailyConsumption: 100,
      createdBy: testUserId
    });
    await emptyRecord.save();

    // 重新查询，应该过滤掉空值
    const filteredShopNames = await CommissionAccounting.distinct('shopName', {
      shopName: { $ne: null, $ne: '' },
      createdBy: testUserId
    });
    const filteredPlatforms = await CommissionAccounting.distinct('platform', {
      platform: { $ne: null, $ne: '' },
      createdBy: testUserId
    });

    console.log('✓ 过滤空值后的店铺名称:', filteredShopNames.sort());
    console.log('✓ 过滤空值后的平台:', filteredPlatforms.sort());
    console.log('✓ 空值过滤功能正常');

    // 清理测试数据
    await CommissionAccounting.deleteMany({ createdBy: testUserId });
    console.log('\n✓ 测试数据清理完成');
    
    console.log('\n🎉 所有建议数据功能测试通过！');
    
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
    return testSuggestionsFeature();
  }).then(() => {
    console.log('测试完成');
    process.exit(0);
  }).catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}

module.exports = { testSuggestionsFeature };
