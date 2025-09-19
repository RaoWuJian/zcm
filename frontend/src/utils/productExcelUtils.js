/**
 * 商品Excel处理工具
 * 基于通用Excel工具，专门用于商品数据的导入导出
 */

import {
  readExcelFile as baseReadExcelFile,
  exportToCSV as baseExportToCSV,
  exportToExcel,
  downloadImportTemplate
} from './excelUtils'

/**
 * 验证商品导入数据的字段映射
 * @param {Array} headers - 表头数组
 * @returns {Object} 字段映射结果
 */
export function validateProductImportHeaders(headers) {
  // 定义商品字段映射规则
  const fieldMappings = {
    // 基本信息
    '商品名称': 'name',
    '产品名称': 'name',
    '名称': 'name',
    'name': 'name',
    '团队': 'team',
    'team': 'team',
    '供应商': 'supplier',
    '供应商名称': 'supplier',
    '供货厂家': 'supplier',
    'supplier': 'supplier',
    '店铺名称': 'storeName',
    '店铺': 'storeName',
    'storeName': 'storeName',
    'shop': 'storeName',
    '商品ID': 'storeId',
    '店铺ID': 'storeId',
    'storeId': 'storeId',
    'id': 'storeId',
    '平台': 'platform',
    '平台名称': 'platform',
    'platform': 'platform',

    // 销售数据
    '订单数': 'dailyOrderCount',
    '日订单数': 'dailyOrderCount',
    '当天销售订单数': 'dailyOrderCount',
    '销售订单数': 'dailyOrderCount',
    '当天订单数': 'dailyOrderCount',
    'dailyOrderCount': 'dailyOrderCount',
    'orders': 'dailyOrderCount',
    'orderCount': 'dailyOrderCount',
    '销量': 'dailySalesVolume',
    '日销量': 'dailySalesVolume',
    '当天销售盒数': 'dailySalesVolume',
    '销售盒数': 'dailySalesVolume',
    '当天销量': 'dailySalesVolume',
    '盒数': 'dailySalesVolume',
    'dailySalesVolume': 'dailySalesVolume',
    'sales': 'dailySalesVolume',
    'salesVolume': 'dailySalesVolume',
    'volume': 'dailySalesVolume',

    // 财务数据
    '单价': 'unitPrice',
    '价格': 'unitPrice',
    '产品单价': 'unitPrice',
    '商品单价': 'unitPrice',
    '售价': 'unitPrice',
    'unitPrice': 'unitPrice',
    'price': 'unitPrice',
    '付款金额': 'dailyPaymentAmount',
    '当天付款金额': 'dailyPaymentAmount',
    '日付款金额': 'dailyPaymentAmount',
    '收款金额': 'dailyPaymentAmount',
    '当天收款': 'dailyPaymentAmount',
    '销售金额': 'dailyPaymentAmount',
    '当天销售金额': 'dailyPaymentAmount',
    'dailyPaymentAmount': 'dailyPaymentAmount',
    'payment': 'dailyPaymentAmount',
    'paymentAmount': 'dailyPaymentAmount',
    '运费': 'shippingCost',
    '产品运费': 'shippingCost',
    '物流费': 'shippingCost',
    'shippingCost': 'shippingCost',
    'shipping': 'shippingCost',
    '消耗金额': 'dailyConsumedAmount',
    '当天消耗金额': 'dailyConsumedAmount',
    '日消耗金额': 'dailyConsumedAmount',
    '消耗费用': 'dailyConsumedAmount',
    '当天消耗': 'dailyConsumedAmount',
    '推广费用': 'dailyConsumedAmount',
    'dailyConsumedAmount': 'dailyConsumedAmount',
    'consumed': 'dailyConsumedAmount',
    'consumedAmount': 'dailyConsumedAmount',
    '手续费': 'handlingFee',
    '平台手续费': 'handlingFee',
    '交易手续费': 'handlingFee',
    '当天手续费': 'handlingFee',
    '服务费': 'handlingFee',
    'handlingFee': 'handlingFee',
    'fee': 'handlingFee',
    'serviceFee': 'handlingFee',
    '售后金额': 'afterSalesAmount',
    '售后费用': 'afterSalesAmount',
    '售后退款': 'afterSalesAmount',
    '当天售后金额': 'afterSalesAmount',
    '退款金额': 'afterSalesAmount',
    'afterSalesAmount': 'afterSalesAmount',
    'afterSales': 'afterSalesAmount',
    'refundAmount': 'afterSalesAmount',
    '售后成本': 'afterSalesCost',
    '售后费用成本': 'afterSalesCost',
    '售后处理成本': 'afterSalesCost',
    '当天售后成本': 'afterSalesCost',
    'afterSalesCost': 'afterSalesCost',
    'afterCost': 'afterSalesCost',
    'serviceCost': 'afterSalesCost',

    // 其他
    '备注': 'description',
    '描述': 'description',
    'description': 'description',
    'remark': 'description'
  }

  const mappedFields = {}
  const unmappedHeaders = []
  const requiredFields = ['name']
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
 * 转换商品导入数据为标准格式
 * @param {Array} data - 原始数据
 * @param {Object} fieldMapping - 字段映射
 * @returns {Array} 转换后的数据
 */
export function transformProductImportData(data, fieldMapping) {
  return data.map((row, index) => {
    const transformedRow = {
      _rowIndex: index + 1, // 添加行号用于错误提示
      // 基本信息
      name: '',
      team: '',
      supplier: '',
      storeName: '',
      storeId: '',
      platform: '',
      // 销售数据
      dailyOrderCount: 0,
      dailySalesVolume: 0,
      // 财务数据
      unitPrice: 0,
      dailyPaymentAmount: 0,
      shippingCost: 0,
      dailyConsumedAmount: 0,
      handlingFee: 0,
      afterSalesAmount: 0,
      afterSalesCost: 0,
      // 其他
      description: ''
    }

    // 定义数字字段
    const numericFields = [
      'dailyOrderCount', 'dailySalesVolume', 'unitPrice',
      'dailyPaymentAmount', 'shippingCost', 'dailyConsumedAmount',
      'handlingFee', 'afterSalesAmount', 'afterSalesCost'
    ]

    // 根据字段映射转换数据
    Object.entries(fieldMapping).forEach(([originalField, mappedField]) => {
      const value = row[originalField]

      if (value !== undefined && value !== null) {
        if (numericFields.includes(mappedField)) {
          // 数字字段处理，支持小数
          const numValue = parseFloat(String(value).replace(/[^\d.-]/g, ''))
          transformedRow[mappedField] = isNaN(numValue) ? 0 : Math.max(0, numValue) // 确保非负数
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
 * 验证商品导入数据
 * @param {Array} data - 导入数据
 * @returns {Object} 验证结果
 */
export function validateProductImportData(data) {
  const errors = []
  const warnings = []
  const validRows = []

  data.forEach((row, index) => {
    const rowErrors = []
    const rowWarnings = []

    // 验证必填字段
    if (!row.name || row.name.trim() === '') {
      rowErrors.push('商品名称不能为空')
    }

    // 验证数据范围（警告）
    if (row.dailyOrderCount > 10000) {
      rowWarnings.push('订单数超出合理范围')
    }

    if (row.dailySalesVolume > 100000) {
      rowWarnings.push('销量超出合理范围')
    }

    if (row.unitPrice > 999999) {
      rowWarnings.push('单价超出合理范围')
    }

    if (row.dailyPaymentAmount > 9999999) {
      rowWarnings.push('付款金额超出合理范围')
    }

    if (row.shippingCost > 99999) {
      rowWarnings.push('运费超出合理范围')
    }

    if (row.dailyConsumedAmount > 9999999) {
      rowWarnings.push('消耗金额超出合理范围')
    }

    if (row.handlingFee > 99999) {
      rowWarnings.push('手续费超出合理范围')
    }

    if (row.afterSalesAmount > 99999) {
      rowWarnings.push('售后金额超出合理范围')
    }

    if (row.afterSalesCost > 99999) {
      rowWarnings.push('售后成本超出合理范围')
    }

    // 验证平台是否在预定义列表中
    const validPlatforms = ['淘宝', '天猫', '京东', '拼多多', '抖音', '快手', '小红书', '微信小程序', '其他']
    if (row.platform && !validPlatforms.includes(row.platform)) {
      rowWarnings.push(`平台"${row.platform}"不在预定义列表中`)
    }

    // 验证团队是否在预定义列表中
    const validTeams = ['团队A', '团队B', '团队C', '团队D', '团队E']
    if (row.team && !validTeams.includes(row.team)) {
      rowWarnings.push(`团队"${row.team}"不在预定义列表中`)
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
 * 生成商品导入模板数据
 * @returns {Object} 模板数据
 */
export function generateProductImportTemplate() {
  const headers = [
    '商品名称', '团队', '供应商', '店铺名称', '商品ID', '平台',
    '当天销售订单数', '当天销售盒数', '产品单价', '当天付款金额',
    '产品运费', '当天消耗金额', '手续费', '售后金额', '售后成本', '备注'
  ]
  const sampleData = [
    {
      '商品名称': 'iPhone 14',
      '团队': '团队A',
      '供应商': '苹果供应商',
      '店铺名称': '苹果官方旗舰店',
      '商品ID': 'IPHONE14001',
      '平台': '淘宝',
      '当天销售订单数': '150',
      '当天销售盒数': '300',
      '产品单价': '999.99',
      '当天付款金额': '299997',
      '产品运费': '4500',
      '当天消耗金额': '5000',
      '手续费': '1500',
      '售后金额': '2000',
      '售后成本': '1000',
      '备注': '苹果手机热销产品'
    },
    {
      '商品名称': 'MacBook Pro',
      '团队': '团队B',
      '供应商': '苹果供应商',
      '店铺名称': '苹果专卖店',
      '商品ID': 'MACBOOK001',
      '平台': '京东',
      '当天销售订单数': '80',
      '当天销售盒数': '120',
      '产品单价': '1999.99',
      '当天付款金额': '239998.8',
      '产品运费': '0',
      '当天消耗金额': '3000',
      '手续费': '1200',
      '售后金额': '1500',
      '售后成本': '800',
      '备注': '苹果笔记本电脑'
    },
    {
      '商品名称': 'iPad Air',
      '团队': '团队A',
      '供应商': '苹果供应商',
      '店铺名称': '苹果授权店',
      '商品ID': 'IPAD001',
      '平台': '天猫',
      '当天销售订单数': '200',
      '当天销售盒数': '350',
      '产品单价': '599.99',
      '当天付款金额': '209996.5',
      '产品运费': '3500',
      '当天消耗金额': '4000',
      '手续费': '1050',
      '售后金额': '1800',
      '售后成本': '900',
      '备注': '苹果平板电脑'
    }
  ]

  return {
    headers,
    data: sampleData
  }
}

/**
 * 读取商品Excel文件
 * @param {File} file - Excel文件
 * @returns {Promise<Object>} 解析结果
 */
export function readProductExcelFile(file) {
  return baseReadExcelFile(file)
}

/**
 * 导出商品数据为CSV格式
 * @param {Array} data - 数据数组
 * @param {Array} headers - 表头数组
 * @returns {string} CSV字符串
 */
export function exportProductToCSV(data, headers) {
  return baseExportToCSV(data, headers)
}

/**
 * 导出商品数据为Excel格式
 * @param {Array} data - 数据数组
 * @param {Array} headers - 表头数组
 * @param {string} filename - 文件名（不含扩展名）
 * @param {string} sheetName - 工作表名称
 */
export function exportProductToExcel(data, headers, filename = '商品数据', sheetName = '商品列表') {
  return exportToExcel(data, headers, filename, sheetName)
}

/**
 * 下载商品导入模板
 * @param {string} filename - 文件名（不含扩展名）
 */
export function downloadProductImportTemplate(filename = '商品导入模板') {
  const template = generateProductImportTemplate()

  try {
    exportToExcel(template.data, template.headers, filename, '商品导入模板')
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
