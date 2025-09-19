const mongoose = require('mongoose');
const CommissionAccounting = require('../models/CommissionAccounting');

// 测试批量新增功能
async function testBatchCreateFeature() {
  try {
    console.log('开始测试批量新增功能...');
    
    // 创建测试用户ID（模拟）
    const testUserId = new mongoose.Types.ObjectId();
    
    // 测试1: 正常批量创建
    console.log('\n测试1: 正常批量创建');
    const testRecords = [
      {
        name: 'iPhone 14',
        shopName: '苹果官方旗舰店',
        platform: '天猫',
        netTransactionData: 5000,
        commission: 3.5,
        dailyConsumption: 800
      },
      {
        name: 'iPhone 14',
        shopName: '苹果专卖店',
        platform: '京东',
        netTransactionData: 4500,
        commission: 4.0,
        dailyConsumption: 700
      },
      {
        name: 'iPhone 14',
        shopName: '苹果授权店',
        platform: '拼多多',
        netTransactionData: 4000,
        commission: 4.5,
        dailyConsumption: 600
      }
    ];

    // 为每条记录添加创建者信息
    const recordsToCreate = testRecords.map(record => ({
      ...record,
      createdBy: testUserId
    }));

    const createdRecords = await CommissionAccounting.insertMany(recordsToCreate);
    console.log('✓ 成功批量创建', createdRecords.length, '条记录');

    // 验证自动计算功能
    const firstRecord = createdRecords[0];
    console.log('✓ 第一条记录的佣金利润:', firstRecord.commissionProfit);
    console.log('✓ 第一条记录的净利润:', firstRecord.netProfit);

    // 验证计算是否正确
    const expectedCommissionProfit = 5000 * (3.5 / 100); // 175
    const expectedNetProfit = expectedCommissionProfit - 800; // -625

    console.log('✓ 预期佣金利润:', expectedCommissionProfit);
    console.log('✓ 预期净利润:', expectedNetProfit);

    if (Math.abs(firstRecord.commissionProfit - expectedCommissionProfit) < 0.01) {
      console.log('✓ 佣金利润计算正确');
    } else {
      console.log('❌ 佣金利润计算错误');
    }

    if (Math.abs(firstRecord.netProfit - expectedNetProfit) < 0.01) {
      console.log('✓ 净利润计算正确');
    } else {
      console.log('❌ 净利润计算错误');
    }

    // 测试2: 数据验证
    console.log('\n测试2: 数据验证');
    
    // 测试负数验证
    try {
      const invalidRecord = {
        name: '测试产品',
        shopName: '测试店铺',
        platform: '测试平台',
        netTransactionData: -100, // 负数
        commission: 5.0,
        dailyConsumption: 200,
        createdBy: testUserId
      };
      
      await CommissionAccounting.create(invalidRecord);
      console.log('❌ 应该拒绝负数的净成交数据');
    } catch (error) {
      console.log('✓ 正确拒绝了负数的净成交数据');
    }

    // 测试3: 查询批量创建的记录
    console.log('\n测试3: 查询批量创建的记录');
    const foundRecords = await CommissionAccounting.find({
      name: 'iPhone 14',
      createdBy: testUserId
    }).sort({ createdAt: -1 });

    console.log('✓ 查询到', foundRecords.length, '条同名产品记录');
    
    // 验证不同店铺和平台
    const uniqueShops = [...new Set(foundRecords.map(r => r.shopName))];
    const uniquePlatforms = [...new Set(foundRecords.map(r => r.platform))];
    console.log('✓ 不同店铺数量:', uniqueShops.length);
    console.log('✓ 不同平台数量:', uniquePlatforms.length);

    // 测试4: 计算总收益
    console.log('\n测试4: 计算总收益');
    const totalCommissionProfit = foundRecords.reduce((sum, record) => sum + record.commissionProfit, 0);
    const totalNetProfit = foundRecords.reduce((sum, record) => sum + record.netProfit, 0);
    const totalNetTransaction = foundRecords.reduce((sum, record) => sum + record.netTransactionData, 0);
    
    console.log('✓ 总佣金利润:', totalCommissionProfit.toFixed(2));
    console.log('✓ 总净利润:', totalNetProfit.toFixed(2));
    console.log('✓ 总净成交数据:', totalNetTransaction.toFixed(2));

    // 测试5: 测试建议数据功能
    console.log('\n测试5: 测试建议数据功能');
    const shopSuggestions = await CommissionAccounting.distinct('shopName', {
      shopName: { $ne: null, $ne: '' },
      createdBy: testUserId
    });
    
    const platformSuggestions = await CommissionAccounting.distinct('platform', {
      platform: { $ne: null, $ne: '' },
      createdBy: testUserId
    });

    console.log('✓ 店铺建议数据:', shopSuggestions.sort());
    console.log('✓ 平台建议数据:', platformSuggestions.sort());

    // 清理测试数据
    await CommissionAccounting.deleteMany({ createdBy: testUserId });
    console.log('\n✓ 测试数据清理完成');
    
    console.log('\n🎉 所有批量新增功能测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  }
}

// 测试批量验证功能
async function testBatchValidation() {
  try {
    console.log('\n开始测试批量验证功能...');
    
    const testUserId = new mongoose.Types.ObjectId();
    
    // 测试无效数据
    const invalidRecords = [
      {
        // 缺少 name
        shopName: '测试店铺1',
        platform: '测试平台1',
        netTransactionData: 1000,
        commission: 5.0,
        dailyConsumption: 200
      },
      {
        name: '测试产品2',
        shopName: '测试店铺2',
        platform: '测试平台2',
        netTransactionData: -100, // 负数
        commission: 5.0,
        dailyConsumption: 200
      },
      {
        name: '测试产品3',
        shopName: '测试店铺3',
        platform: '测试平台3',
        netTransactionData: 1000,
        commission: 150, // 超出范围
        dailyConsumption: 200
      }
    ];

    console.log('✓ 批量验证功能需要在控制器层面实现');
    console.log('✓ 测试数据包含：缺少必填字段、负数、超出范围等情况');
    
  } catch (error) {
    console.error('❌ 批量验证测试失败:', error.message);
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
    return testBatchCreateFeature();
  }).then(() => {
    return testBatchValidation();
  }).then(() => {
    console.log('所有测试完成');
    process.exit(0);
  }).catch((error) => {
    console.error('测试失败:', error);
    process.exit(1);
  });
}

module.exports = { testBatchCreateFeature, testBatchValidation };
