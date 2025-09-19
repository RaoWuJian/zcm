/**
 * Excel文件处理工具
 * 使用 SheetJS (xlsx) 库解析Excel文件
 */

import * as XLSX from 'xlsx'

/**
 * 读取Excel文件内容
 * @param {File} file - Excel文件
 * @returns {Promise<Object>} 解析结果
 */
export function readExcelFile(file) {
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
          const result = parseCSV(text)
          resolve(result)
        } else {
          // 处理Excel文件 - 使用 SheetJS
          const result = parseExcelWithSheetJS(data)
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
 * 解析CSV文件
 * @param {string} text - CSV文本内容
 * @returns {Object} 解析结果
 */
function parseCSV(text) {
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
 * 使用 SheetJS 解析Excel文件
 * @param {Uint8Array} data - Excel文件数据
 * @returns {Object} 解析结果
 */
function parseExcelWithSheetJS(data) {
  try {
    // 使用 SheetJS 读取工作簿
    const workbook = XLSX.read(data, {
      type: 'array',
      codepage: 65001 // UTF-8 编码，解决中文乱码问题
    })

    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      throw new Error('Excel文件中没有找到工作表')
    }

    const worksheet = workbook.Sheets[firstSheetName]

    // 将工作表转换为JSON数组
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // 使用数组格式，第一行作为表头
      defval: '', // 空单元格的默认值
      blankrows: false // 跳过空行
    })

    if (jsonData.length === 0) {
      throw new Error('Excel文件内容为空')
    }

    // 提取表头
    const headers = jsonData[0].map(header => String(header).trim()).filter(h => h)

    if (headers.length === 0) {
      throw new Error('Excel文件表头为空')
    }

    // 提取数据行
    const rows = []
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i]
      if (rowData && rowData.length > 0 && rowData.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
        const row = {}
        headers.forEach((header, index) => {
          const cellValue = rowData[index]
          row[header] = cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : ''
        })
        rows.push(row)
      }
    }

    return {
      headers,
      data: rows,
      totalRows: rows.length,
      sheetName: firstSheetName
    }
  } catch (error) {
    throw new Error('Excel文件解析失败：' + error.message)
  }
}

/**
 * 验证导入数据的字段映射
 * @param {Array} headers - 表头数组
 * @returns {Object} 字段映射结果
 */
export function validateImportHeaders(headers) {
  // 定义字段映射规则
  const fieldMappings = {
    '产品名称': 'name',
    '名称': 'name',
    'name': 'name',
    '店铺名称': 'shopName',
    '店铺': 'shopName',
    'shop': 'shopName',
    'shopName': 'shopName',
    '平台': 'platform',
    'platform': 'platform',
    '净成交数据': 'netTransactionData',
    '净成交': 'netTransactionData',
    'netTransaction': 'netTransactionData',
    'netTransactionData': 'netTransactionData',
    '佣金': 'commission',
    '佣金(%)': 'commission',
    '佣金百分比': 'commission',
    'commission': 'commission',
    '今日消耗': 'dailyConsumption',
    '消耗': 'dailyConsumption',
    'consumption': 'dailyConsumption',
    'dailyConsumption': 'dailyConsumption',
    '备注': 'description',
    '描述': 'description',
    'description': 'description',
    'remark': 'description'
  }

  const mappedFields = {}
  const unmappedHeaders = []
  const requiredFields = ['name', 'netTransactionData', 'commission']
  const foundRequired = []

  headers.forEach(header => {
    const trimmedHeader = header.trim()
    const mappedField = fieldMappings[trimmedHeader]
    
    if (mappedField) {
      mappedFields[trimmedHeader] = mappedField
      if (requiredFields.includes(mappedField)) {
        foundRequired.push(mappedField)
      }
    } else {
      unmappedHeaders.push(trimmedHeader)
    }
  })

  // 检查必填字段
  const missingRequired = requiredFields.filter(field => !foundRequired.includes(field))

  return {
    mappedFields,
    unmappedHeaders,
    missingRequired,
    isValid: missingRequired.length === 0,
    requiredFields,
    foundRequired
  }
}

/**
 * 转换导入数据为标准格式
 * @param {Array} data - 原始数据
 * @param {Object} fieldMapping - 字段映射
 * @returns {Array} 转换后的数据
 */
export function transformImportData(data, fieldMapping) {
  return data.map((row, index) => {
    const transformedRow = {
      _rowIndex: index + 1, // 添加行号用于错误提示
      name: '',
      shopName: '',
      platform: '',
      netTransactionData: 0,
      commission: 0,
      dailyConsumption: 0,
      description: ''
    }

    // 根据字段映射转换数据
    Object.entries(fieldMapping).forEach(([originalField, mappedField]) => {
      const value = row[originalField]
      
      if (value !== undefined && value !== null) {
        if (mappedField === 'netTransactionData' || mappedField === 'commission' || mappedField === 'dailyConsumption') {
          // 数字字段处理
          const numValue = parseFloat(String(value).replace(/[^\d.-]/g, ''))
          transformedRow[mappedField] = isNaN(numValue) ? 0 : numValue
        } else {
          // 文本字段处理
          transformedRow[mappedField] = String(value).trim()
        }
      }
    })

    return transformedRow
  })
}

/**
 * 验证导入数据
 * @param {Array} data - 导入数据
 * @returns {Object} 验证结果
 */
export function validateImportData(data) {
  const errors = []
  const warnings = []
  const validRows = []

  data.forEach((row, index) => {
    const rowErrors = []
    const rowWarnings = []

    // 验证必填字段
    if (!row.name || row.name.trim() === '') {
      rowErrors.push('产品名称不能为空')
    }

    if (row.netTransactionData === null || row.netTransactionData === undefined) {
      rowErrors.push('净成交数据不能为空')
    }

    if (row.commission === null || row.commission === undefined) {
      rowErrors.push('佣金不能为空')
    }

    // 验证数据范围
    if (row.netTransactionData < -99999999 || row.netTransactionData > 99999999) {
      rowWarnings.push('净成交数据超出合理范围')
    }

    if (row.commission < -100 || row.commission > 100) {
      rowWarnings.push('佣金超出合理范围(-100% ~ 100%)')
    }

    if (row.dailyConsumption < -99999999 || row.dailyConsumption > 99999999) {
      rowWarnings.push('今日消耗超出合理范围')
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

    // 如果没有错误，添加到有效行
    if (rowErrors.length === 0) {
      validRows.push(row)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validRows,
    totalRows: data.length,
    validRowCount: validRows.length,
    errorRowCount: errors.length
  }
}

/**
 * 生成导入模板数据
 * @returns {Object} 模板数据
 */
export function generateImportTemplate() {
  const headers = ['产品名称', '店铺名称', '平台', '净成交数据', '佣金(%)', '今日消耗', '备注']
  const sampleData = [
    {
      '产品名称': 'iPhone 14',
      '店铺名称': '苹果官方旗舰店',
      '平台': '天猫',
      '净成交数据': '5000',
      '佣金(%)': '3.5',
      '今日消耗': '800',
      '备注': '苹果手机销售'
    },
    {
      '产品名称': 'iPhone 14',
      '店铺名称': '苹果专卖店',
      '平台': '京东',
      '净成交数据': '4500',
      '佣金(%)': '4.0',
      '今日消耗': '700',
      '备注': '苹果手机销售'
    }
  ]

  return {
    headers,
    data: sampleData
  }
}

/**
 * 导出数据为CSV格式
 * @param {Array} data - 数据数组
 * @param {Array} headers - 表头数组
 * @returns {string} CSV字符串
 */
export function exportToCSV(data, headers) {
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header] || ''
        // 如果值包含逗号或引号，需要用引号包围
        if (String(value).includes(',') || String(value).includes('"')) {
          return `"${String(value).replace(/"/g, '""')}"`
        }
        return String(value)
      }).join(',')
    )
  ].join('\n')

  return csvContent
}

/**
 * 导出数据为Excel格式
 * @param {Array} data - 数据数组
 * @param {Array} headers - 表头数组
 * @param {string} filename - 文件名（不含扩展名）
 * @param {string} sheetName - 工作表名称
 */
export function exportToExcel(data, headers, filename = 'export', sheetName = 'Sheet1') {
  try {
    // 创建工作簿
    const workbook = XLSX.utils.book_new()

    // 准备数据，表头在第一行
    const worksheetData = [
      headers,
      ...data.map(row => headers.map(header => row[header] || ''))
    ]

    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // 设置列宽（可选）
    const colWidths = headers.map(header => ({
      wch: Math.max(header.length, 15) // 最小宽度15字符
    }))
    worksheet['!cols'] = colWidths

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // 导出文件
    XLSX.writeFile(workbook, `${filename}.xlsx`)

    return true
  } catch (error) {
    throw new Error('Excel导出失败：' + error.message)
  }
}

/**
 * 下载导入模板
 * @param {string} filename - 文件名（不含扩展名）
 */
export function downloadImportTemplate(filename = '核算佣金导入模板') {
  const template = generateImportTemplate()

  try {
    exportToExcel(template.data, template.headers, filename, '导入模板')
    return true
  } catch (error) {
    // 如果Excel导出失败，降级到CSV
    console.warn('Excel模板导出失败，使用CSV格式：', error.message)
    const csvContent = exportToCSV(template.data, template.headers)

    // 添加BOM以支持Excel正确显示中文
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return true
  }
}
