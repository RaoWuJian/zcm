// 精度处理工具
export const precisionCalculate = {
  // 加法
  add(...numbers) {
    const sum = numbers.reduce((acc, num) => {
      const numValue = parseFloat(num) || 0
      return acc + numValue
    }, 0)
    return parseFloat(sum.toFixed(2))
  },

  // 减法
  subtract(minuend, ...subtrahends) {
    const minuendValue = parseFloat(minuend) || 0
    const result = subtrahends.reduce((diff, num) => {
      const numValue = parseFloat(num) || 0
      return diff - numValue
    }, minuendValue)
    return parseFloat(result.toFixed(2))
  },

  // 乘法
  multiply(...numbers) {
    const product = numbers.reduce((acc, num) => {
      const numValue = parseFloat(num) || 0
      return acc * numValue
    }, 1)
    return parseFloat(product.toFixed(2))
  },

  // 除法
  divide(dividend, divisor) {
    const dividendValue = parseFloat(dividend) || 0
    const divisorValue = parseFloat(divisor) || 0
    if (!divisorValue) return 0
    return parseFloat((dividendValue / divisorValue).toFixed(2))
  },

  // 百分比计算
  percentage(value, total) {
    const valueNum = parseFloat(value) || 0
    const totalNum = parseFloat(total) || 0
    if (!totalNum) return 0
    return parseFloat(((valueNum / totalNum) * 100).toFixed(2))
  },

  // 四舍五入到指定小数位
  round(number, decimals = 2) {
    const numValue = parseFloat(number) || 0
    return parseFloat(numValue.toFixed(decimals))
  }
}