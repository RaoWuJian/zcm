/**
 * 日期时间工具函数
 */

/**
 * 将UTC时间字符串转换为本地日期格式（YYYY-MM-DD）
 * @param utcTime UTC时间字符串，如 2025-09-13T05:46:32.182Z
 * @returns 本地日期字符串，如 2025-09-12
 */
export function formatUtcToLocalDate(utcTime) {
  if (!utcTime) return ''
  
  try {
    const date = new Date(utcTime)
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).replace(/\//g, '-')
  } catch (error) {
    console.error('日期格式化错误:', error)
    return utcTime || ''
  }
}

/**
 * 将UTC时间字符串转换为本地时间格式（YYYY-MM-DD HH:mm:ss）
 * @param utcTime UTC时间字符串，如 2025-09-13T05:46:32.182Z
 * @returns 本地时间字符串，如 2025-09-12 13:46:32
 */
export function formatUtcToLocalDateTime(utcTime) {
  if (!utcTime) return ''
  
  try {
    const date = new Date(utcTime)
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
    console.error('日期时间格式化错误:', error)
    return utcTime || ''
  }
}

/**
 * 获取当前日期的字符串格式（YYYY-MM-DD）
 * @returns 当前日期字符串
 */
export function getCurrentDate() {
  return new Date().toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).replace(/\//g, '-')
}

/**
 * 检查日期字符串是否为有效日期
 * @param dateStr 日期字符串
 * @returns 是否为有效日期
 */
export function isValidDate(dateStr) {
  if (!dateStr) return false
  
  try {
    const date = new Date(dateStr)
    return !isNaN(date.getTime())
  } catch (error) {
    return false
  }
}