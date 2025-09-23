/**
 * 发货记录Excel导入工具
 */

import * as XLSX from 'xlsx'

/**
 * 读取发货记录Excel文件
 * @param {File} file - Excel文件
 * @returns {Promise<Object>} 解析结果
 */
export function readShipmentExcelFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('请选择文件'))
      return
    }

    // 检查文件类型
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      reject(new Error('请选择Excel文件(.xlsx, .xls)或CSV文件'))
      return
    }

    const reader = new FileReader()

    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result)

        if (file.name.toLowerCase().endsWith('.csv')) {
          // 处理CSV文件
          const text = new TextDecoder('utf-8').decode(data)
          const result = parseShipmentCSV(text)
          resolve(result)
        } else {
          // 处理Excel文件
          const result = parseShipmentExcelWithSheetJS(data)
          resolve(result)
        }
      } catch (error) {
        reject(new Error('文件解析失败：' + error.message))
      }
    }

    reader.onerror = function() {
      reject(new Error('文件读取失败'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * 使用SheetJS解析发货记录Excel文件
 * @param {Uint8Array} data - 文件数据
 * @returns {Object} 解析结果
 */
function parseShipmentExcelWithSheetJS(data) {
  const workbook = XLSX.read(data, { type: 'array' })
  
  // 获取第一个工作表
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  
  // 转换为JSON格式
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  
  if (jsonData.length === 0) {
    throw new Error('文件内容为空')
  }

  // 获取表头
  const headers = jsonData[0].map(header => String(header || '').trim()).filter(h => h)
  
  if (headers.length === 0) {
    throw new Error('未找到有效的表头')
  }

  // 解析数据行
  const rows = []
  for (let i = 1; i < jsonData.length; i++) {
    const rowData = jsonData[i]
    if (rowData && rowData.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
      const row = {}
      headers.forEach((header, index) => {
        const value = rowData[index]
        row[header] = value !== null && value !== undefined ? String(value).trim() : ''
      })
      rows.push(row)
    }
  }

  return {
    headers,
    data: rows,
    totalRows: rows.length
  }
}

/**
 * 解析发货记录CSV文件
 * @param {string} text - CSV文本内容
 * @returns {Object} 解析结果
 */
function parseShipmentCSV(text) {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) {
    throw new Error('文件内容为空')
  }

  // 解析表头
  const headers = parseCSVLine(lines[0])
  
  // 解析数据行
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length > 0 && values.some(v => v.trim())) {
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }
  }

  return {
    headers,
    data: rows,
    totalRows: rows.length
  }
}

/**
 * 解析CSV行
 * @param {string} line - CSV行
 * @returns {Array} 解析后的值数组
 */
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

/**
 * 验证发货记录导入表头
 * @param {Array} headers - 表头数组
 * @returns {Object} 验证结果
 */
export function validateShipmentImportHeaders(headers) {
  // 必填字段映射
  const requiredFields = {
    '发货日期': ['发货日期', '日期', 'shipmentDate', 'date'],
    '产品名称': ['产品名称', '产品', '商品名称', 'productName', 'product'],
    '数量': ['数量', '发货数量', 'quantity', 'qty'],
    '单价': ['单价', '价格', 'unitPrice', 'price'],
    '运费': ['运费', '邮费', 'shippingFee', 'shipping'],
    '偏远地区加收运费': ['偏远地区加收运费', '偏远费', '加收运费', 'remoteAreaFee', 'remoteFee'],
    '应收款单位': ['应收款单位', '收款单位', '客户', 'receivableUnit', 'customer']
  }

  // 可选字段映射
  const optionalFields = {
    '备注': ['备注', '说明', 'remark', 'note', 'description']
  }

  const mappedFields = {}
  const missingRequired = []

  // 检查必填字段
  Object.keys(requiredFields).forEach(fieldName => {
    const aliases = requiredFields[fieldName]
    const foundHeader = headers.find(header => 
      aliases.some(alias => header.toLowerCase().includes(alias.toLowerCase()))
    )
    
    if (foundHeader) {
      mappedFields[fieldName] = foundHeader
    } else {
      missingRequired.push(fieldName)
    }
  })

  // 检查可选字段
  Object.keys(optionalFields).forEach(fieldName => {
    const aliases = optionalFields[fieldName]
    const foundHeader = headers.find(header => 
      aliases.some(alias => header.toLowerCase().includes(alias.toLowerCase()))
    )
    
    if (foundHeader) {
      mappedFields[fieldName] = foundHeader
    }
  })

  return {
    isValid: missingRequired.length === 0,
    mappedFields,
    missingRequired,
    allFields: { ...requiredFields, ...optionalFields }
  }
}

/**
 * 转换发货记录导入数据格式
 * @param {Array} data - 原始数据
 * @param {Object} mappedFields - 字段映射
 * @returns {Array} 转换后的数据
 */
export function transformShipmentImportData(data, mappedFields) {
  return data.map(row => {
    const transformed = {}

    // 发货日期
    if (mappedFields['发货日期']) {
      const dateValue = row[mappedFields['发货日期']]
      transformed.shipmentDate = parseDate(dateValue)
    }

    // 产品名称
    if (mappedFields['产品名称']) {
      transformed.productName = String(row[mappedFields['产品名称']] || '').trim()
    }

    // 数量
    if (mappedFields['数量']) {
      transformed.quantity = parseNumber(row[mappedFields['数量']])
    }

    // 单价
    if (mappedFields['单价']) {
      transformed.unitPrice = parseNumber(row[mappedFields['单价']])
    }

    // 运费
    if (mappedFields['运费']) {
      transformed.shippingFee = parseNumber(row[mappedFields['运费']], 0)
    }

    // 偏远地区加收运费
    if (mappedFields['偏远地区加收运费']) {
      transformed.remoteAreaFee = parseNumber(row[mappedFields['偏远地区加收运费']], 0)
    }

    // 应收款单位
    if (mappedFields['应收款单位']) {
      transformed.receivableUnit = String(row[mappedFields['应收款单位']] || '').trim()
    }

    // 备注
    if (mappedFields['备注']) {
      transformed.remark = String(row[mappedFields['备注']] || '').trim()
    }

    return transformed
  })
}

/**
 * 解析日期
 * @param {*} value - 日期值
 * @returns {string} 格式化的日期字符串
 */
function parseDate(value) {
  if (!value) return ''
  
  // 如果是Excel日期序列号
  if (typeof value === 'number' && value > 25569) {
    const date = new Date((value - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }
  
  // 如果是字符串日期
  const dateStr = String(value).trim()
  if (!dateStr) return ''
  
  // 尝试解析各种日期格式
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }
  
  return dateStr
}

/**
 * 解析数字
 * @param {*} value - 数字值
 * @param {number} defaultValue - 默认值
 * @returns {number} 解析后的数字
 */
function parseNumber(value, defaultValue = null) {
  if (value === null || value === undefined || value === '') {
    return defaultValue
  }

  const num = Number(String(value).replace(/[,，]/g, ''))
  return isNaN(num) ? defaultValue : num
}

/**
 * 验证发货记录导入数据
 * @param {Array} data - 导入数据
 * @returns {Object} 验证结果
 */
export function validateShipmentImportData(data) {
  const errors = []
  const warnings = []
  const validRows = []

  data.forEach((row, index) => {
    const rowErrors = []
    const rowWarnings = []

    // 验证必填字段
    if (!row.shipmentDate || row.shipmentDate.trim() === '') {
      rowErrors.push('发货日期不能为空')
    }

    if (!row.productName || row.productName.trim() === '') {
      rowErrors.push('产品名称不能为空')
    }

    if (row.quantity === null || row.quantity === undefined) {
      rowErrors.push('数量不能为空')
    } else if (row.quantity <= 0) {
      rowErrors.push('数量必须大于0')
    }

    if (row.unitPrice === null || row.unitPrice === undefined) {
      rowErrors.push('单价不能为空')
    } else if (row.unitPrice < 0) {
      rowErrors.push('单价不能为负数')
    }

    if (!row.receivableUnit || row.receivableUnit.trim() === '') {
      rowErrors.push('应收款单位不能为空')
    }

    // 验证数据范围（警告）
    if (row.quantity > 999999) {
      rowWarnings.push('数量超出合理范围')
    }

    if (row.unitPrice > 999999) {
      rowWarnings.push('单价超出合理范围')
    }

    if (row.shippingFee && row.shippingFee < 0) {
      rowErrors.push('运费不能为负数')
    }

    if (row.remoteAreaFee && row.remoteAreaFee < 0) {
      rowErrors.push('偏远地区加收运费不能为负数')
    }

    if (row.shippingFee > 99999) {
      rowWarnings.push('运费超出合理范围')
    }

    if (row.remoteAreaFee > 99999) {
      rowWarnings.push('偏远地区加收运费超出合理范围')
    }

    // 记录错误和警告
    if (rowErrors.length > 0) {
      errors.push({
        row: index + 1,
        errors: rowErrors
      })
    }

    if (rowWarnings.length > 0) {
      warnings.push({
        row: index + 1,
        warnings: rowWarnings
      })
    }

    // 只有没有错误的行才加入有效数据
    if (rowErrors.length === 0) {
      validRows.push(row)
    }
  })

  return {
    validRows,
    errors,
    warnings,
    validRowCount: validRows.length,
    totalRowCount: data.length
  }
}

/**
 * 生成发货记录导入模板
 * @returns {Object} 模板数据
 */
export function generateShipmentImportTemplate() {
  const headers = [
    '发货日期',
    '产品名称',
    '数量',
    '单价',
    '运费',
    '偏远地区加收运费',
    '应收款单位',
    '备注'
  ]

  const sampleData = [
    {
      '发货日期': '2024-01-01',
      '产品名称': '示例产品A',
      '数量': 10,
      '单价': 99.99,
      '运费': 15.00,
      '偏远地区加收运费': 5.00,
      '应收款单位': '示例公司A',
      '备注': '示例备注'
    },
    {
      '发货日期': '2024-01-02',
      '产品名称': '示例产品B',
      '数量': 5,
      '单价': 199.50,
      '运费': 20.00,
      '偏远地区加收运费': 0,
      '应收款单位': '示例公司B',
      '备注': ''
    }
  ]

  return {
    headers,
    data: sampleData
  }
}

/**
 * 导出发货记录到Excel
 * @param {Array} data - 数据
 * @param {string} filename - 文件名
 */
export function exportShipmentToExcel(data, filename = '发货记录') {
  try {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '发货记录')
    XLSX.writeFile(wb, filename + '.xlsx')
  } catch (error) {
    console.error('导出Excel失败:', error)
    throw new Error('导出Excel失败: ' + error.message)
  }
}

/**
 * 下载发货记录导入模板
 */
export function downloadShipmentImportTemplate() {
  try {
    const template = generateShipmentImportTemplate()
    exportShipmentToExcel(template.data, '发货记录导入模板')
  } catch (error) {
    console.error('下载模板失败:', error)
    throw new Error('下载模板失败: ' + error.message)
  }
}
