// 精度处理工具
const precisionCalculate = {
  // 加法
  add(...numbers) {
    return parseFloat(numbers.reduce((sum, num) => sum + (num || 0), 0).toFixed(2))
  },
  
  // 减法
  subtract(minuend, ...subtrahends) {
    const result = subtrahends.reduce((diff, num) => diff - (num || 0), minuend || 0)
    return parseFloat(result.toFixed(2))
  },
  
  // 乘法
  multiply(...numbers) {
    return parseFloat(numbers.reduce((product, num) => product * (num || 0), 1).toFixed(2))
  },
  
  // 除法
  divide(dividend, divisor) {
    if (!divisor) return 0
    return parseFloat((dividend / divisor).toFixed(2))
  },

  // 百分比计算
  percentage(value, total) {
    if (!total) return 0
    return parseFloat(((value / total) * 100).toFixed(2))
  },

  // 四舍五入到指定小数位
  round(number, decimals = 2) {
    return parseFloat(Number(number).toFixed(decimals))
  }
}

module.exports = { precisionCalculate }
