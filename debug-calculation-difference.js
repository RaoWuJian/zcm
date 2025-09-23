/**
 * 调试统计计算差异的脚本
 * 用于验证前端和后端统计计算的差异
 */

// 模拟后端精度计算工具
const backendPrecisionCalculate = {
  add(...numbers) {
    return parseFloat(numbers.reduce((sum, num) => sum + (num || 0), 0).toFixed(2))
  },
  
  subtract(minuend, ...subtrahends) {
    const result = subtrahends.reduce((diff, num) => diff - (num || 0), minuend || 0)
    return parseFloat(result.toFixed(2))
  },
  
  multiply(...numbers) {
    return parseFloat(numbers.reduce((product, num) => product * (num || 0), 1).toFixed(2))
  },
  
  divide(dividend, divisor) {
    if (!divisor) return 0
    return parseFloat((dividend / divisor).toFixed(2))
  }
}

// 模拟前端简单加法（不使用精度计算）
const frontendSimpleAdd = (...numbers) => {
  return numbers.reduce((sum, num) => sum + (num || 0), 0)
}

// 测试数据
const testData = [
  {
    netTransactionData: 1000.50,
    commission: 3.5,
    dailyConsumption: 200.25,
    commissionProfit: 35.02,  // 1000.50 * 0.035 = 35.0175 -> 35.02
    netProfit: -165.23        // 35.02 - 200.25 = -165.23
  },
  {
    netTransactionData: 2500.75,
    commission: 4.2,
    dailyConsumption: 150.50,
    commissionProfit: 105.03,  // 2500.75 * 0.042 = 105.0315 -> 105.03
    netProfit: -45.47         // 105.03 - 150.50 = -45.47
  },
  {
    netTransactionData: 800.33,
    commission: 2.8,
    dailyConsumption: 75.80,
    commissionProfit: 22.41,  // 800.33 * 0.028 = 22.4092 -> 22.41
    netProfit: -53.39         // 22.41 - 75.80 = -53.39
  }
]

console.log('=== 调试统计计算差异 ===\n')

console.log('测试数据:')
testData.forEach((item, index) => {
  console.log(`记录 ${index + 1}:`)
  console.log(`  净成交数据: ${item.netTransactionData}`)
  console.log(`  佣金百分比: ${item.commission}%`)
  console.log(`  今日消耗: ${item.dailyConsumption}`)
  console.log(`  佣金利润: ${item.commissionProfit}`)
  console.log(`  净利润: ${item.netProfit}`)
  console.log('')
})

// 后端计算方式（使用精度计算）
console.log('=== 后端计算方式（使用精度计算） ===')
const backendStats = testData.reduce((acc, item) => {
  const netTransactionData = Number(item.netTransactionData) || 0
  const commissionProfit = Number(item.commissionProfit) || 0
  const netProfit = Number(item.netProfit) || 0
  const dailyConsumption = Number(item.dailyConsumption) || 0

  acc.totalNetTransactionData = backendPrecisionCalculate.add(acc.totalNetTransactionData, netTransactionData)
  acc.totalCommissionProfit = backendPrecisionCalculate.add(acc.totalCommissionProfit, commissionProfit)
  acc.totalNetProfit = backendPrecisionCalculate.add(acc.totalNetProfit, netProfit)
  acc.totalDailyConsumption = backendPrecisionCalculate.add(acc.totalDailyConsumption, dailyConsumption)
  acc.recordCount += 1

  return acc
}, {
  totalNetTransactionData: 0,
  totalCommissionProfit: 0,
  totalNetProfit: 0,
  totalDailyConsumption: 0,
  recordCount: 0
})

console.log('后端统计结果:')
console.log(`  总净成交数据: ${backendStats.totalNetTransactionData}`)
console.log(`  总佣金利润: ${backendStats.totalCommissionProfit}`)
console.log(`  总净利润: ${backendStats.totalNetProfit}`)
console.log(`  总今日消耗: ${backendStats.totalDailyConsumption}`)
console.log(`  记录数量: ${backendStats.recordCount}`)
console.log('')

// 前端计算方式（简单加法）
console.log('=== 前端计算方式（简单加法） ===')
const frontendStats = testData.reduce((acc, item) => {
  acc.totalNetTransaction += item.netTransactionData || 0
  acc.totalCommissionProfit += item.commissionProfit || 0
  acc.totalNetProfit += item.netProfit || 0
  acc.totalDailyConsumption += item.dailyConsumption || 0
  return acc
}, {
  totalNetTransaction: 0,
  totalCommissionProfit: 0,
  totalNetProfit: 0,
  totalDailyConsumption: 0
})

console.log('前端统计结果:')
console.log(`  总净成交数据: ${frontendStats.totalNetTransaction}`)
console.log(`  总佣金利润: ${frontendStats.totalCommissionProfit}`)
console.log(`  总净利润: ${frontendStats.totalNetProfit}`)
console.log(`  总今日消耗: ${frontendStats.totalDailyConsumption}`)
console.log('')

// 手动计算验证
console.log('=== 手动计算验证 ===')
let manualNetTransaction = 0
let manualCommissionProfit = 0
let manualNetProfit = 0
let manualDailyConsumption = 0

testData.forEach(item => {
  manualNetTransaction += item.netTransactionData
  manualCommissionProfit += item.commissionProfit
  manualNetProfit += item.netProfit
  manualDailyConsumption += item.dailyConsumption
})

console.log('手动计算结果:')
console.log(`  总净成交数据: ${manualNetTransaction}`)
console.log(`  总佣金利润: ${manualCommissionProfit}`)
console.log(`  总净利润: ${manualNetProfit}`)
console.log(`  总今日消耗: ${manualDailyConsumption}`)
console.log('')

// 差异分析
console.log('=== 差异分析 ===')
console.log('后端 vs 前端差异:')
console.log(`  净成交数据差异: ${backendStats.totalNetTransactionData - frontendStats.totalNetTransaction}`)
console.log(`  佣金利润差异: ${backendStats.totalCommissionProfit - frontendStats.totalCommissionProfit}`)
console.log(`  净利润差异: ${backendStats.totalNetProfit - frontendStats.totalNetProfit}`)
console.log(`  今日消耗差异: ${backendStats.totalDailyConsumption - frontendStats.totalDailyConsumption}`)
console.log('')

console.log('后端 vs 手动计算差异:')
console.log(`  净成交数据差异: ${backendStats.totalNetTransactionData - manualNetTransaction}`)
console.log(`  佣金利润差异: ${backendStats.totalCommissionProfit - manualCommissionProfit}`)
console.log(`  净利润差异: ${backendStats.totalNetProfit - manualNetProfit}`)
console.log(`  今日消耗差异: ${backendStats.totalDailyConsumption - manualDailyConsumption}`)
console.log('')

console.log('前端 vs 手动计算差异:')
console.log(`  净成交数据差异: ${frontendStats.totalNetTransaction - manualNetTransaction}`)
console.log(`  佣金利润差异: ${frontendStats.totalCommissionProfit - manualCommissionProfit}`)
console.log(`  净利润差异: ${frontendStats.totalNetProfit - manualNetProfit}`)
console.log(`  今日消耗差异: ${frontendStats.totalDailyConsumption - manualDailyConsumption}`)

// 精度问题演示
console.log('\n=== 精度问题演示 ===')
const num1 = 0.1
const num2 = 0.2
const directAdd = num1 + num2
const precisionAdd = backendPrecisionCalculate.add(num1, num2)

console.log(`直接加法: ${num1} + ${num2} = ${directAdd}`)
console.log(`精度加法: ${num1} + ${num2} = ${precisionAdd}`)
console.log(`差异: ${directAdd - precisionAdd}`)
