/**
 * 产品佣金批量创建功能测试脚本
 * 验证佣金利润和净利润的计算是否正确
 */

const testBatchCreateCommission = () => {
  console.log('开始测试产品佣金批量创建功能...\n')
  
  // 测试数据
  const testRecords = [
    {
      name: 'iPhone 14',
      shopName: '苹果官方旗舰店',
      platform: '淘宝',
      netTransactionData: 1000.00,
      commission: 5.5,
      dailyConsumption: 50.00,
      description: '苹果手机佣金核算'
    },
    {
      name: 'MacBook Pro',
      shopName: '苹果专卖店',
      platform: '京东',
      netTransactionData: 2000.00,
      commission: 3.2,
      dailyConsumption: 80.00,
      description: '苹果笔记本佣金核算'
    },
    {
      name: 'iPad Air',
      shopName: '苹果授权店',
      platform: '天猫',
      netTransactionData: 800.00,
      commission: -2.0, // 负佣金（返利场景）
      dailyConsumption: 30.00,
      description: '负佣金返利测试'
    }
  ]
  
  console.log('测试数据:')
  testRecords.forEach((record, index) => {
    console.log(`记录 ${index + 1}:`, {
      产品: record.name,
      店铺: record.shopName,
      平台: record.platform,
      净成交数据: record.netTransactionData,
      佣金百分比: record.commission + '%',
      今日消耗: record.dailyConsumption
    })
  })
  
  console.log('\n预期计算结果:')
  
  // 模拟精确计算工具
  const precisionCalculate = {
    multiply(a, b) {
      const result = (a || 0) * (b || 0)
      return parseFloat(result.toFixed(2))
    },
    divide(a, b) {
      if (!b) return 0
      const result = (a || 0) / (b || 0)
      return parseFloat(result.toFixed(2))
    },
    subtract(a, b) {
      const result = (a || 0) - (b || 0)
      return parseFloat(result.toFixed(2))
    }
  }
  
  testRecords.forEach((record, index) => {
    // 佣金利润 = 净成交数据 × 佣金%
    const commissionProfit = precisionCalculate.multiply(
      record.netTransactionData,
      precisionCalculate.divide(record.commission, 100)
    )
    
    // 净利润 = 佣金利润 - 今日消耗
    const netProfit = precisionCalculate.subtract(commissionProfit, record.dailyConsumption)
    
    console.log(`记录 ${index + 1} 计算结果:`)
    console.log(`  佣金利润 = ${record.netTransactionData} × (${record.commission}% ÷ 100)`)
    console.log(`  佣金利润 = ${record.netTransactionData} × ${precisionCalculate.divide(record.commission, 100)}`)
    console.log(`  佣金利润 = ${commissionProfit}`)
    console.log(`  净利润 = ${commissionProfit} - ${record.dailyConsumption} = ${netProfit}`)
    console.log('')
  })
  
  console.log('API调用示例:')
  console.log('POST /api/commission-accounting/batch')
  console.log('Content-Type: application/json')
  console.log('Authorization: Bearer <token>')
  console.log('')
  console.log('请求体:')
  console.log(JSON.stringify({ records: testRecords }, null, 2))
  
  console.log('\n预期响应:')
  console.log(`{
  "success": true,
  "message": "成功创建 ${testRecords.length} 条核算佣金记录",
  "data": [
    {
      "_id": "...",
      "name": "iPhone 14",
      "netTransactionData": 1000.00,
      "commission": 5.5,
      "commissionProfit": 55.00,  // 自动计算
      "dailyConsumption": 50.00,
      "netProfit": 5.00,          // 自动计算
      "createdBy": "...",
      // ... 其他字段
    }
    // ... 其他记录
  ]
}`)
}

// 测试边界情况
const testEdgeCases = () => {
  console.log('\n测试边界情况...\n')
  
  const edgeCases = [
    {
      name: '零值测试',
      data: {
        netTransactionData: 0,
        commission: 0,
        dailyConsumption: 0
      },
      expected: '佣金利润 = 0, 净利润 = 0'
    },
    {
      name: '负佣金测试',
      data: {
        netTransactionData: 1000,
        commission: -5,
        dailyConsumption: 20
      },
      expected: '佣金利润 = -50, 净利润 = -70'
    },
    {
      name: '高消耗测试',
      data: {
        netTransactionData: 500,
        commission: 10,
        dailyConsumption: 100
      },
      expected: '佣金利润 = 50, 净利润 = -50'
    }
  ]
  
  const precisionCalculate = {
    multiply: (a, b) => parseFloat(((a || 0) * (b || 0)).toFixed(2)),
    divide: (a, b) => b ? parseFloat(((a || 0) / (b || 0)).toFixed(2)) : 0,
    subtract: (a, b) => parseFloat(((a || 0) - (b || 0)).toFixed(2))
  }
  
  edgeCases.forEach(testCase => {
    const { netTransactionData, commission, dailyConsumption } = testCase.data
    
    const commissionProfit = precisionCalculate.multiply(
      netTransactionData,
      precisionCalculate.divide(commission, 100)
    )
    const netProfit = precisionCalculate.subtract(commissionProfit, dailyConsumption)
    
    console.log(`${testCase.name}:`)
    console.log(`  输入: 净成交=${netTransactionData}, 佣金=${commission}%, 消耗=${dailyConsumption}`)
    console.log(`  计算: 佣金利润=${commissionProfit}, 净利润=${netProfit}`)
    console.log(`  预期: ${testCase.expected}`)
    console.log('')
  })
}

// 测试常见问题
const testCommonIssues = () => {
  console.log('\n常见问题排查...\n')
  
  console.log('1. 检查 precisionCalculate 导入:')
  console.log('   确保控制器顶部有: const { precisionCalculate } = require("../utils/precision")')
  console.log('')
  
  console.log('2. 检查计算逻辑:')
  console.log('   佣金利润 = 净成交数据 × (佣金% ÷ 100)')
  console.log('   净利润 = 佣金利润 - 今日消耗')
  console.log('')
  
  console.log('3. 检查 insertMany vs save:')
  console.log('   insertMany() 不会触发 pre("save") 中间件')
  console.log('   需要在控制器中手动计算')
  console.log('')
  
  console.log('4. 检查数据类型:')
  console.log('   确保数字字段为 Number 类型，不是字符串')
  console.log('')
  
  console.log('5. 检查前端显示:')
  console.log('   确认前端显示的是 commissionProfit 字段')
  console.log('   检查是否有缓存问题')
}

// 运行测试
if (require.main === module) {
  testBatchCreateCommission()
  testEdgeCases()
  testCommonIssues()
  
  console.log('\n总结:')
  console.log('- 批量创建需要手动计算佣金利润和净利润')
  console.log('- 支持负数佣金（返利场景）')
  console.log('- 使用精确计算避免浮点数误差')
  console.log('- insertMany() 不触发模型中间件')
  console.log('- 需要确保 precisionCalculate 正确导入')
}

module.exports = { testBatchCreateCommission, testEdgeCases, testCommonIssues }
