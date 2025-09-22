/**
 * 格式化工具函数
 */

/**
 * 格式化数字，保留指定小数位数
 * @param {number|string} value - 要格式化的数字
 * @param {number} decimals - 小数位数，默认2位
 * @returns {string} 格式化后的数字字符串
 */
export function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || value === '') {
    return '0.00'
  }
  
  const num = Number(value)
  if (isNaN(num)) {
    return '0.00'
  }
  
  return num.toFixed(decimals)
}

/**
 * 格式化日期时间
 * @param {string|Date} dateTime - 日期时间
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(dateTime) {
  if (!dateTime) return '-'
  
  try {
    const date = new Date(dateTime)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  } catch (error) {
    return dateTime || '-'
  }
}

/**
 * 格式化金额，添加千分位分隔符
 * @param {number|string} amount - 金额
 * @param {number} decimals - 小数位数，默认2位
 * @returns {string} 格式化后的金额字符串
 */
export function formatAmount(amount, decimals = 2) {
  if (amount === null || amount === undefined || amount === '') {
    return '0.00'
  }
  
  const num = Number(amount)
  if (isNaN(num)) {
    return '0.00'
  }
  
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * 格式化百分比
 * @param {number|string} value - 百分比值
 * @param {number} decimals - 小数位数，默认2位
 * @returns {string} 格式化后的百分比字符串
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined || value === '') {
    return '0.00%'
  }
  
  const num = Number(value)
  if (isNaN(num)) {
    return '0.00%'
  }
  
  return num.toFixed(decimals) + '%'
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小字符串
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化日期（仅日期部分）
 * @param {string|Date} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  if (!date) return '-'
  
  try {
    const d = new Date(date)
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
  } catch (error) {
    return date || '-'
  }
}

/**
 * 格式化时间（仅时间部分）
 * @param {string|Date} time - 时间
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(time) {
  if (!time) return '-'
  
  try {
    const t = new Date(time)
    return t.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (error) {
    return time || '-'
  }
}
