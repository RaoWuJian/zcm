/**
 * 输入验证函数测试
 */

import {
  validateNumberInput,
  validateIntegerInput,
  validatePositiveNumberInput,
  validateSignedNumberInput,
  validatePercentageInput,
  validateAmountInput,
  numberValidators
} from '../inputValidation.js'

describe('输入验证函数测试', () => {
  
  describe('validateNumberInput 基础验证', () => {
    test('应该过滤掉非数字字符', () => {
      expect(validateNumberInput('123abc456')).toBe('123456')
      expect(validateNumberInput('abc123def')).toBe('123')
      expect(validateNumberInput('12.34abc')).toBe('12.34')
    })

    test('应该处理空值', () => {
      expect(validateNumberInput('')).toBe('')
      expect(validateNumberInput(null)).toBe('')
      expect(validateNumberInput(undefined)).toBe('')
    })

    test('应该处理小数点', () => {
      expect(validateNumberInput('12.34.56')).toBe('12.34')
      expect(validateNumberInput('12.')).toBe('12.')
      expect(validateNumberInput('.123')).toBe('.123')
    })

    test('应该处理负号', () => {
      expect(validateNumberInput('-123', { allowNegative: true })).toBe('-123')
      expect(validateNumberInput('-123', { allowNegative: false })).toBe('123')
      expect(validateNumberInput('12-34', { allowNegative: true })).toBe('-1234')
    })

    test('应该限制小数位数', () => {
      expect(validateNumberInput('123.456789', { decimalPlaces: 2 })).toBe('123.45')
      expect(validateNumberInput('123.456789', { decimalPlaces: 0 })).toBe('123')
    })

    test('应该处理数值范围', () => {
      expect(validateNumberInput('150', { maxValue: 100 })).toBe('100')
      expect(validateNumberInput('-50', { minValue: 0 })).toBe('0')
    })

    test('应该处理前导零', () => {
      expect(validateNumberInput('00123')).toBe('123')
      expect(validateNumberInput('0.123')).toBe('0.123')
      expect(validateNumberInput('-00123', { allowNegative: true })).toBe('-123')
    })
  })

  describe('validateIntegerInput 整数验证', () => {
    test('应该移除小数点', () => {
      expect(validateIntegerInput('123.45')).toBe('123')
      expect(validateIntegerInput('123.99')).toBe('123')
    })

    test('应该保持整数不变', () => {
      expect(validateIntegerInput('123')).toBe('123')
      expect(validateIntegerInput('-123', { allowNegative: true })).toBe('-123')
    })
  })

  describe('validatePositiveNumberInput 正数验证', () => {
    test('应该移除负号', () => {
      expect(validatePositiveNumberInput('-123.45')).toBe('123.45')
      expect(validatePositiveNumberInput('-0')).toBe('0')
    })

    test('应该保持正数不变', () => {
      expect(validatePositiveNumberInput('123.45')).toBe('123.45')
      expect(validatePositiveNumberInput('0')).toBe('0')
    })
  })

  describe('validateSignedNumberInput 有符号数字验证', () => {
    test('应该保持负数', () => {
      expect(validateSignedNumberInput('-123.45')).toBe('-123.45')
      expect(validateSignedNumberInput('-0')).toBe('-0')
    })

    test('应该保持正数不变', () => {
      expect(validateSignedNumberInput('123.45')).toBe('123.45')
      expect(validateSignedNumberInput('0')).toBe('0')
    })

    test('应该支持小数', () => {
      expect(validateSignedNumberInput('-123.456')).toBe('-123.45')
      expect(validateSignedNumberInput('123.456')).toBe('123.45')
    })

    test('应该过滤非数字字符', () => {
      expect(validateSignedNumberInput('-123abc.45def')).toBe('-123.45')
      expect(validateSignedNumberInput('abc-123.45')).toBe('-123.45')
    })
  })

  describe('validatePercentageInput 百分比验证', () => {
    test('应该限制在0-100范围内', () => {
      expect(validatePercentageInput('50.5')).toBe('50.5')
      expect(validatePercentageInput('150')).toBe('100')
      expect(validatePercentageInput('-10')).toBe('0')
    })

    test('应该保留小数', () => {
      expect(validatePercentageInput('99.99')).toBe('99.99')
      expect(validatePercentageInput('0.01')).toBe('0.01')
    })
  })

  describe('validateAmountInput 金额验证', () => {
    test('应该限制小数位数为2位', () => {
      expect(validateAmountInput('123.456')).toBe('123.45')
      expect(validateAmountInput('123.999')).toBe('123.99')
    })

    test('应该移除负号', () => {
      expect(validateAmountInput('-123.45')).toBe('123.45')
    })

    test('应该处理大金额', () => {
      expect(validateAmountInput('1234567.89')).toBe('1234567.89')
    })
  })

  describe('numberValidators 预配置验证器', () => {
    test('number 验证器（支持小数和负数）', () => {
      expect(numberValidators.number('123.45')).toBe('123.45')
      expect(numberValidators.number('-123.45')).toBe('-123.45')
      expect(numberValidators.number('abc-123.45def')).toBe('-123.45')
    })

    test('positiveNumber 验证器', () => {
      expect(numberValidators.positiveNumber('123.45')).toBe('123.45')
      expect(numberValidators.positiveNumber('-123.45')).toBe('123.45')
      expect(numberValidators.positiveNumber('abc123')).toBe('123')
    })

    test('signedNumber 验证器', () => {
      expect(numberValidators.signedNumber('123.45')).toBe('123.45')
      expect(numberValidators.signedNumber('-123.45')).toBe('-123.45')
      expect(numberValidators.signedNumber('abc-123.45def')).toBe('-123.45')
    })

    test('integer 验证器（支持负数）', () => {
      expect(numberValidators.integer('123.45')).toBe('123')
      expect(numberValidators.integer('-123.45')).toBe('-123')
      expect(numberValidators.integer('abc-123')).toBe('-123')
    })

    test('positiveInteger 验证器', () => {
      expect(numberValidators.positiveInteger('123.45')).toBe('123')
      expect(numberValidators.positiveInteger('-123.45')).toBe('123')
    })

    test('percentage 验证器', () => {
      expect(numberValidators.percentage('50')).toBe('50')
      expect(numberValidators.percentage('150')).toBe('100')
      expect(numberValidators.percentage('-10')).toBe('0')
    })

    test('amount 验证器', () => {
      expect(numberValidators.amount('123.456')).toBe('123.45')
      expect(numberValidators.amount('-100')).toBe('100')
    })

    test('signedAmount 验证器（支持负数金额）', () => {
      expect(numberValidators.signedAmount('123.456')).toBe('123.45')
      expect(numberValidators.signedAmount('-100.789')).toBe('-100.78')
      expect(numberValidators.signedAmount('abc-50.25def')).toBe('-50.25')
    })
  })

  describe('边界情况测试', () => {
    test('只有特殊字符', () => {
      expect(validateNumberInput('.')).toBe('.')
      expect(validateNumberInput('-', { allowNegative: true })).toBe('')
      expect(validateNumberInput('abc')).toBe('')
    })

    test('混合特殊字符', () => {
      expect(validateNumberInput('1.2.3.4')).toBe('1.23')
      expect(validateNumberInput('--123', { allowNegative: true })).toBe('-123')
      expect(validateNumberInput('1-2-3', { allowNegative: true })).toBe('-123')
    })

    test('极值测试', () => {
      expect(validateNumberInput('0')).toBe('0')
      expect(validateNumberInput('0.0')).toBe('0.0')
      expect(validateNumberInput('0.00')).toBe('0.00')
    })
  })

  describe('性能测试', () => {
    test('大量数据处理', () => {
      const largeInput = '1'.repeat(1000) + 'abc' + '2'.repeat(1000)
      const result = validateNumberInput(largeInput)
      expect(result).toBe('1'.repeat(1000) + '2'.repeat(1000))
    })

    test('复杂字符串处理', () => {
      const complexInput = '1a2b3c4d5e6f7g8h9i0j.1k2l3m4n5o'
      const result = validateNumberInput(complexInput)
      expect(result).toBe('1234567890.12345')
    })
  })
})

// 如果在浏览器环境中运行，可以手动执行测试
if (typeof window !== 'undefined') {
  console.log('开始输入验证函数测试...')
  
  // 基础测试
  console.log('基础测试:')
  console.log('123abc456 ->', validateNumberInput('123abc456'))
  console.log('-123.45 (正数) ->', validatePositiveNumberInput('-123.45'))
  console.log('150 (百分比) ->', validatePercentageInput('150'))
  console.log('123.456 (金额) ->', validateAmountInput('123.456'))
  
  // 预配置验证器测试
  console.log('\n预配置验证器测试:')
  console.log('positiveNumber: abc123 ->', numberValidators.positiveNumber('abc123'))
  console.log('percentage: 150 ->', numberValidators.percentage('150'))
  console.log('amount: -123.456 ->', numberValidators.amount('-123.456'))
  console.log('integer: 123.45 ->', numberValidators.integer('123.45'))
  
  console.log('\n所有测试完成！')
}
