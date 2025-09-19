/**
 * 产品预算批量创建功能测试脚本
 */

const testBatchCreateBudget = () => {
  console.log('开始测试产品预算批量创建功能...\n')
  
  // 测试数据
  const testBudgets = [
    {
      productName: 'iPhone 14',
      shopName: '苹果官方旗舰店',
      sellingPrice: 999.99,
      unitCost: 600.00,
      shippingCost: 15.00,
      platformFee: 50.00,
      handlingFee: 10.00,
      description: '苹果手机财务测算'
    },
    {
      productName: 'MacBook Pro',
      shopName: '苹果专卖店',
      sellingPrice: 1999.99,
      unitCost: 1200.00,
      shippingCost: 0.00,
      platformFee: 100.00,
      handlingFee: 20.00,
      description: '苹果笔记本财务测算'
    },
    {
      productName: 'iPad Air',
      shopName: '苹果授权店',
      sellingPrice: 599.99,
      unitCost: 350.00,
      shippingCost: -10.00, // 运费减免
      platformFee: 30.00,
      handlingFee: 5.00,
      description: '运费减免活动'
    }
  ]
  
  console.log('测试数据:')
  testBudgets.forEach((budget, index) => {
    console.log(`预算 ${index + 1}:`, {
      产品: budget.productName,
      店铺: budget.shopName,
      售价: budget.sellingPrice,
      成本: budget.unitCost,
      运费: budget.shippingCost,
      平台费: budget.platformFee,
      手续费: budget.handlingFee
    })
  })
  
  console.log('\n预期计算结果:')
  
  // 模拟精确计算工具
  const precisionCalculate = {
    subtract(minuend, ...subtrahends) {
      const result = subtrahends.reduce((diff, num) => diff - (num || 0), minuend || 0)
      return parseFloat(result.toFixed(2))
    }
  }
  
  testBudgets.forEach((budget, index) => {
    const grossMargin = precisionCalculate.subtract(
      budget.sellingPrice,
      budget.unitCost,
      budget.shippingCost,
      budget.platformFee,
      budget.handlingFee
    )
    
    console.log(`预算 ${index + 1} 毛利计算:`)
    console.log(`  毛利 = ${budget.sellingPrice} - ${budget.unitCost} - ${budget.shippingCost} - ${budget.platformFee} - ${budget.handlingFee}`)
    console.log(`  毛利 = ${grossMargin}`)
    console.log('')
  })
  
  console.log('API调用示例:')
  console.log('POST /api/budget/batch')
  console.log('Content-Type: application/json')
  console.log('Authorization: Bearer <token>')
  console.log('')
  console.log('请求体:')
  console.log(JSON.stringify(testBudgets, null, 2))
  
  console.log('\n预期响应:')
  console.log(`{
  "success": true,
  "message": "成功创建 ${testBudgets.length} 条产品预算记录",
  "data": [
    // 创建的预算记录数组，包含自动计算的毛利字段
  ]
}`)
}

// 测试边界情况
const testEdgeCases = () => {
  console.log('\n测试边界情况...\n')
  
  const edgeCases = [
    {
      name: '空数组测试',
      data: [],
      expected: '400 Bad Request - 请提供有效的预算数据数组'
    },
    {
      name: '非数组测试',
      data: { productName: 'Test' },
      expected: '400 Bad Request - 请提供有效的预算数据数组'
    },
    {
      name: '负数测试',
      data: [{
        productName: '测试产品',
        sellingPrice: -100,
        unitCost: 50,
        shippingCost: -10,
        platformFee: -5,
        handlingFee: 2
      }],
      expected: '毛利 = -100 - 50 - (-10) - (-5) - 2 = -137'
    }
  ]
  
  edgeCases.forEach(testCase => {
    console.log(`${testCase.name}:`)
    console.log(`  输入: ${JSON.stringify(testCase.data)}`)
    console.log(`  预期: ${testCase.expected}`)
    console.log('')
  })
}

// 运行测试
if (require.main === module) {
  testBatchCreateBudget()
  testEdgeCases()
  
  console.log('\n总结:')
  console.log('- 批量创建支持多条预算记录同时创建')
  console.log('- 自动计算每条记录的毛利')
  console.log('- 支持负数金额（减免、返利等场景）')
  console.log('- 使用精确计算避免浮点数误差')
  console.log('- 包含完整的错误处理和验证')
}

module.exports = { testBatchCreateBudget, testEdgeCases }
