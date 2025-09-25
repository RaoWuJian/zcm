/**
 * 库存Excel导入工具
 */

import * as XLSX from 'xlsx'

/**
 * 读取库存Excel文件
 * @param {File} file - Excel文件
 * @returns {Promise<Object>} 解析结果
 */
export function readInventoryExcelFile(file) {
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
          const result = parseInventoryCSV(text)
          resolve(result)
        } else {
          // 处理Excel文件
          const result = parseInventoryExcelWithSheetJS(data)
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
 * 使用SheetJS解析库存Excel文件
 * @param {Uint8Array} data - 文件数据
 * @returns {Object} 解析结果
 */
function parseInventoryExcelWithSheetJS(data) {
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
    const values = jsonData[i]
    if (values && values.length > 0 && values.some(v => v !== null && v !== undefined && String(v).trim() !== '')) {
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
 * 解析库存CSV文件
 * @param {string} text - CSV文本内容
 * @returns {Object} 解析结果
 */
function parseInventoryCSV(text) {
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
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
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
 * 验证库存导入表头
 * @param {Array} headers - 表头数组
 * @returns {Object} 验证结果
 */
export function validateInventoryImportHeaders(headers) {
  // 必填字段映射
  const requiredFields = {
    '外部编码': ['外部编码', '编码', 'externalCode', 'code'],
    '生产日期': ['生产日期', '生产时间', 'productionDate', 'production'],
    '大货日期': ['大货日期', '大货时间', 'bulkDate', 'bulk'],
    '当前库存数量': ['当前库存数量', '库存数量', '数量', 'currentQuantity', 'quantity'],
    '规格': ['规格', '型号', 'specification', 'spec'],
    '厂家': ['厂家', '制造商', 'manufacturer', 'maker'],
    '货号名称': ['货号名称', '产品名称', '商品名称', 'productName', 'product']
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
    allFields: Object.keys(requiredFields).concat(Object.keys(optionalFields))
  }
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
 * 转换库存导入数据格式
 * @param {Array} data - 原始数据
 * @param {Object} mappedFields - 字段映射
 * @returns {Array} 转换后的数据
 */
export function transformInventoryImportData(data, mappedFields) {
  return data.map(row => {
    const transformed = {}

    // 外部编码
    if (mappedFields['外部编码']) {
      transformed.externalCode = String(row[mappedFields['外部编码']] || '').trim()
    }

    // 生产日期
    if (mappedFields['生产日期']) {
      const dateValue = row[mappedFields['生产日期']]
      transformed.productionDate = parseDate(dateValue)
    }

    // 大货日期
    if (mappedFields['大货日期']) {
      const dateValue = row[mappedFields['大货日期']]
      transformed.bulkDate = parseDate(dateValue)
    }

    // 当前库存数量
    if (mappedFields['当前库存数量']) {
      transformed.currentQuantity = parseNumber(row[mappedFields['当前库存数量']])
    }

    // 规格
    if (mappedFields['规格']) {
      transformed.specification = String(row[mappedFields['规格']] || '').trim()
    }

    // 厂家
    if (mappedFields['厂家']) {
      transformed.manufacturer = String(row[mappedFields['厂家']] || '').trim()
    }

    // 货号名称
    if (mappedFields['货号名称']) {
      transformed.productName = String(row[mappedFields['货号名称']] || '').trim()
    }

    // 备注
    if (mappedFields['备注']) {
      transformed.remark = String(row[mappedFields['备注']] || '').trim()
    }

    return transformed
  })
}

/**
 * 验证库存导入数据
 * @param {Array} data - 导入数据
 * @returns {Object} 验证结果
 */
export function validateInventoryImportData(data) {
  const errors = []
  const warnings = []
  const validRows = []

  data.forEach((row, index) => {
    const rowErrors = []
    const rowWarnings = []

    // 验证必填字段
    if (!row.externalCode || row.externalCode.trim() === '') {
      rowErrors.push('外部编码不能为空')
    }

    if (!row.productionDate || row.productionDate.trim() === '') {
      rowErrors.push('生产日期不能为空')
    } else {
      // 验证日期格式
      const date = new Date(row.productionDate)
      if (isNaN(date.getTime())) {
        rowErrors.push('生产日期格式不正确')
      }
    }

    if (!row.bulkDate || row.bulkDate.trim() === '') {
      rowErrors.push('大货日期不能为空')
    } else {
      // 验证日期格式
      const date = new Date(row.bulkDate)
      if (isNaN(date.getTime())) {
        rowErrors.push('大货日期格式不正确')
      }
    }

    if (row.currentQuantity === null || row.currentQuantity === undefined) {
      rowErrors.push('当前库存数量不能为空')
    } else if (row.currentQuantity < 0) {
      rowErrors.push('当前库存数量不能为负数')
    }

    if (!row.specification || row.specification.trim() === '') {
      rowErrors.push('规格不能为空')
    }

    if (!row.manufacturer || row.manufacturer.trim() === '') {
      rowErrors.push('厂家不能为空')
    }

    if (!row.productName || row.productName.trim() === '') {
      rowErrors.push('货号名称不能为空')
    }

    // 验证数据长度（警告）
    if (row.externalCode && row.externalCode.length > 50) {
      rowWarnings.push('外部编码长度超过50个字符')
    }

    if (row.specification && row.specification.length > 100) {
      rowWarnings.push('规格长度超过100个字符')
    }

    if (row.manufacturer && row.manufacturer.length > 100) {
      rowWarnings.push('厂家长度超过100个字符')
    }

    if (row.productName && row.productName.length > 200) {
      rowWarnings.push('货号名称长度超过200个字符')
    }

    if (row.remark && row.remark.length > 500) {
      rowWarnings.push('备注长度超过500个字符')
    }

    // 验证数据范围（警告）
    if (row.currentQuantity > 999999) {
      rowWarnings.push('库存数量超出合理范围')
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
 * 生成库存导入模板
 * @returns {Object} 模板数据
 */
export function generateInventoryImportTemplate() {
  const headers = [
    '外部编码',
    '生产日期',
    '大货日期',
    '当前库存数量',
    '规格',
    '厂家',
    '货号名称',
    '备注'
  ]

  const sampleData = [
    {
      '外部编码': 'EXT001',
      '生产日期': '2024-01-01',
      '大货日期': '2024-01-15',
      '当前库存数量': 1000,
      '规格': '标准规格',
      '厂家': '示例厂家A',
      '货号名称': '示例产品A',
      '备注': '示例备注'
    },
    {
      '外部编码': 'EXT002',
      '生产日期': '2024-01-02',
      '大货日期': '2024-01-16',
      '当前库存数量': 500,
      '规格': '特殊规格',
      '厂家': '示例厂家B',
      '货号名称': '示例产品B',
      '备注': ''
    }
  ]

  return {
    headers,
    data: sampleData
  }
}

/**
 * 导出库存数据到Excel
 * @param {Array} data - 数据
 * @param {string} filename - 文件名
 */
export function exportInventoryToExcel(data, filename = '库存数据') {
  try {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '库存数据')
    XLSX.writeFile(wb, filename + '.xlsx')
  } catch (error) {
    console.error('导出Excel失败:', error)
    throw new Error('导出Excel失败: ' + error.message)
  }
}

/**
 * 下载库存导入模板
 */
export function downloadInventoryImportTemplate() {
  try {
    const template = generateInventoryImportTemplate()
    exportInventoryToExcel(template.data, '库存导入模板')
  } catch (error) {
    console.error('下载模板失败:', error)
    throw new Error('下载模板失败: ' + error.message)
  }
}
