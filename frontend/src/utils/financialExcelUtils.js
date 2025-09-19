/**
 * 财务测算Excel处理工具
 * 基于通用Excel工具，专门用于财务测算数据的导入导出
 */

import {
  readExcelFile as baseReadExcelFile,
  exportToCSV as baseExportToCSV,
  exportToExcel,
  downloadImportTemplate
} from './excelUtils'

/**
 * 验证财务测算导入数据的字段映射
 * @param {Array} headers - 表头数组
 * @returns {Object} 字段映射结果
 */
export function validateFinancialImportHeaders(headers) {
  // 定义财务测算字段映射规则
  const fieldMappings = {
    '产品名称': 'productName',
    '名称': 'productName',
    'productName': 'productName',
    '店铺名称': 'shopName',
    '店铺': 'shopName',
    'shop': 'shopName',
    'shopName': 'shopName',
    '平台': 'platform',
    '平台名称': 'platform',
    'platform': 'platform',
    '售价': 'sellingPrice',
    '销售价格': 'sellingPrice',
    'sellingPrice': 'sellingPrice',
    'price': 'sellingPrice',
    '成本单价': 'unitCost',
    '成本': 'unitCost',
    'unitCost': 'unitCost',
    'cost': 'unitCost',
    '运费': 'shippingCost',
    '物流费': 'shippingCost',
    'shippingCost': 'shippingCost',
    'shipping': 'shippingCost',
    '平台费用': 'platformFee',
    '平台费': 'platformFee',
    'platformFee': 'platformFee',
    'platform': 'platformFee',
    '手续费': 'handlingFee',
    '处理费': 'handlingFee',
    'handlingFee': 'handlingFee',
    'handling': 'handlingFee',
    '备注': 'description',
    '描述': 'description',
    'description': 'description',
    'remark': 'description'
  }

  const mappedFields = {}
  const unmappedHeaders = []
  const requiredFields = ['productName', 'sellingPrice']
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
 * 转换财务测算导入数据为标准格式
 * @param {Array} data - 原始数据
 * @param {Object} fieldMapping - 字段映射
 * @returns {Array} 转换后的数据
 */
export function transformFinancialImportData(data, fieldMapping) {
  return data.map((row, index) => {
    const transformedRow = {
      _rowIndex: index + 1, // 添加行号用于错误提示
      productName: '',
      shopName: '',
      platform: '',
      sellingPrice: 0,
      unitCost: 0,
      shippingCost: 0,
      platformFee: 0,
      handlingFee: 0,
      description: ''
    }

    // 根据字段映射转换数据
    Object.entries(fieldMapping).forEach(([originalField, mappedField]) => {
      const value = row[originalField]
      
      if (value !== undefined && value !== null) {
        if (['sellingPrice', 'unitCost', 'shippingCost', 'platformFee', 'handlingFee'].includes(mappedField)) {
          // 数字字段处理，支持负数
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
 * 验证财务测算导入数据
 * @param {Array} data - 导入数据
 * @returns {Object} 验证结果
 */
export function validateFinancialImportData(data) {
  const errors = []
  const warnings = []
  const validRows = []

  data.forEach((row, index) => {
    const rowErrors = []
    const rowWarnings = []

    // 验证必填字段
    if (!row.productName || row.productName.trim() === '') {
      rowErrors.push('产品名称不能为空')
    }

    if (row.sellingPrice === null || row.sellingPrice === undefined) {
      rowErrors.push('售价不能为空')
    }

    // 验证数据范围（警告）
    if (Math.abs(row.sellingPrice) > 999999) {
      rowWarnings.push('售价超出合理范围')
    }

    if (Math.abs(row.unitCost) > 999999) {
      rowWarnings.push('成本单价超出合理范围')
    }

    if (Math.abs(row.shippingCost) > 999999) {
      rowWarnings.push('运费超出合理范围')
    }

    if (Math.abs(row.platformFee) > 999999) {
      rowWarnings.push('平台费用超出合理范围')
    }

    if (Math.abs(row.handlingFee) > 999999) {
      rowWarnings.push('手续费超出合理范围')
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
 * 生成财务测算导入模板数据
 * @returns {Object} 模板数据
 */
export function generateFinancialImportTemplate() {
  const headers = ['产品名称', '店铺名称', '平台', '售价', '成本单价', '运费', '平台费用', '手续费', '备注']
  const sampleData = [
    {
      '产品名称': 'iPhone 14',
      '店铺名称': '苹果官方旗舰店',
      '平台': '淘宝',
      '售价': '999.99',
      '成本单价': '600.00',
      '运费': '15.00',
      '平台费用': '50.00',
      '手续费': '10.00',
      '备注': '苹果手机财务测算'
    },
    {
      '产品名称': 'MacBook Pro',
      '店铺名称': '苹果专卖店',
      '平台': '京东',
      '售价': '1999.99',
      '成本单价': '1200.00',
      '运费': '0.00',
      '平台费用': '100.00',
      '手续费': '20.00',
      '备注': '苹果笔记本财务测算'
    }
  ]

  return {
    headers,
    data: sampleData
  }
}

/**
 * 读取财务测算Excel文件
 * @param {File} file - Excel文件
 * @returns {Promise<Object>} 解析结果
 */
export function readFinancialExcelFile(file) {
  return baseReadExcelFile(file)
}

/**
 * 导出财务测算数据为CSV格式
 * @param {Array} data - 数据数组
 * @param {Array} headers - 表头数组
 * @returns {string} CSV字符串
 */
export function exportFinancialToCSV(data, headers) {
  return baseExportToCSV(data, headers)
}

/**
 * 导出财务测算数据为Excel格式
 * @param {Array} data - 数据数组
 * @param {Array} headers - 表头数组
 * @param {string} filename - 文件名（不含扩展名）
 * @param {string} sheetName - 工作表名称
 */
export function exportFinancialToExcel(data, headers, filename = '财务测算数据', sheetName = '财务测算') {
  return exportToExcel(data, headers, filename, sheetName)
}

/**
 * 下载财务测算导入模板
 * @param {string} filename - 文件名（不含扩展名）
 */
export function downloadFinancialImportTemplate(filename = '财务测算导入模板') {
  const template = generateFinancialImportTemplate()

  try {
    exportToExcel(template.data, template.headers, filename, '财务测算模板')
    return true
  } catch (error) {
    // 如果Excel导出失败，降级到CSV
    console.warn('Excel模板导出失败，使用CSV格式：', error.message)
    const csvContent = baseExportToCSV(template.data, template.headers)

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
