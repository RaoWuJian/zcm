/**
 * 输入验证工具函数
 * 用于处理各种输入框的验证和格式化
 */

/**
 * 数字输入验证函数
 * 只允许输入数字，自动过滤其他字符
 * @param {string} value - 输入的值
 * @param {Object} options - 配置选项
 * @param {boolean} options.allowDecimal - 是否允许小数点，默认true
 * @param {boolean} options.allowNegative - 是否允许负数，默认false
 * @param {number} options.decimalPlaces - 小数位数限制，默认2
 * @param {number} options.maxValue - 最大值限制
 * @param {number} options.minValue - 最小值限制
 * @returns {string} 过滤后的数字字符串
 */
export function validateNumberInput(value, options = {}) {
  const {
    allowDecimal = true,
    allowNegative = false,
    decimalPlaces = 2,
    maxValue = null,
    minValue = null
  } = options;

  // 如果输入为空或null，返回空字符串
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // 转换为字符串
  let str = String(value);

  // 1. 基础字符过滤：只保留数字、小数点、负号
  let allowedChars = '0123456789';
  if (allowDecimal) allowedChars += '.';
  if (allowNegative) allowedChars += '-';

  // 过滤掉不允许的字符
  str = str.split('').filter(char => allowedChars.includes(char)).join('');

  // 2. 负号处理：负号只能在开头，且只能有一个
  if (allowNegative) {
    const negativeCount = (str.match(/-/g) || []).length;
    if (negativeCount > 1) {
      // 移除多余的负号，只保留第一个
      str = str.replace(/-/g, '');
      if (str.length > 0) {
        str = '-' + str;
      }
    } else if (str.includes('-') && !str.startsWith('-')) {
      // 负号不在开头，移动到开头
      str = '-' + str.replace('-', '');
    }
  } else {
    // 不允许负数，移除所有负号
    str = str.replace(/-/g, '');
  }

  // 3. 小数点处理
  if (allowDecimal) {
    const decimalCount = (str.match(/\./g) || []).length;
    if (decimalCount > 1) {
      // 只保留第一个小数点
      const firstDotIndex = str.indexOf('.');
      str = str.substring(0, firstDotIndex + 1) + str.substring(firstDotIndex + 1).replace(/\./g, '');
    }

    // 限制小数位数
    if (str.includes('.')) {
      const parts = str.split('.');
      if (parts[1] && parts[1].length > decimalPlaces) {
        parts[1] = parts[1].substring(0, decimalPlaces);
        str = parts.join('.');
      }
    }
  } else {
    // 不允许小数，移除小数点
    str = str.replace(/\./g, '');
  }

  // 4. 处理开头的多个零
  if (str.length > 1 && str.startsWith('0') && !str.startsWith('0.')) {
    str = str.replace(/^0+/, '0');
    if (str !== '0' && !str.startsWith('0.')) {
      str = str.substring(1);
    }
  }

  // 5. 处理负号开头的多个零
  if (allowNegative && str.startsWith('-0') && str.length > 2 && !str.startsWith('-0.')) {
    str = '-' + str.substring(2).replace(/^0+/, '0');
    if (str === '-0') {
      str = '0';
    }
  }

  // 6. 数值范围验证
  if (str !== '' && str !== '-' && str !== '.') {
    const numValue = parseFloat(str);
    if (!isNaN(numValue)) {
      if (maxValue !== null && numValue > maxValue) {
        str = String(maxValue);
      }
      if (minValue !== null && numValue < minValue) {
        str = String(minValue);
      }
    }
  }

  return str;
}

/**
 * 整数输入验证函数
 * 只允许输入整数
 * @param {string} value - 输入的值
 * @param {Object} options - 配置选项
 * @returns {string} 过滤后的整数字符串
 */
export function validateIntegerInput(value, options = {}) {
  return validateNumberInput(value, {
    ...options,
    allowDecimal: false
  });
}

/**
 * 正数输入验证函数
 * 只允许输入正数（包括0）
 * @param {string} value - 输入的值
 * @param {Object} options - 配置选项
 * @returns {string} 过滤后的正数字符串
 */
export function validatePositiveNumberInput(value, options = {}) {
  return validateNumberInput(value, {
    ...options,
    allowNegative: false,
    minValue: 0
  });
}

/**
 * 支持负数的数字输入验证函数
 * 允许输入正数和负数
 * @param {string} value - 输入的值
 * @param {Object} options - 配置选项
 * @returns {string} 过滤后的数字字符串
 */
export function validateSignedNumberInput(value, options = {}) {
  return validateNumberInput(value, {
    ...options,
    allowNegative: true,
    allowDecimal: true
  });
}

/**
 * 百分比输入验证函数
 * 限制在0-100之间的数字
 * @param {string} value - 输入的值
 * @param {Object} options - 配置选项
 * @returns {string} 过滤后的百分比字符串
 */
export function validatePercentageInput(value, options = {}) {
  return validateNumberInput(value, {
    ...options,
    allowNegative: false,
    minValue: 0,
    maxValue: 100,
    decimalPlaces: 2
  });
}

/**
 * 金额输入验证函数
 * 专门用于金额输入，保留2位小数
 * @param {string} value - 输入的值
 * @param {Object} options - 配置选项
 * @returns {string} 过滤后的金额字符串
 */
export function validateAmountInput(value, options = {}) {
  return validateNumberInput(value, {
    ...options,
    allowDecimal: true,
    allowNegative: false,
    decimalPlaces: 2,
    minValue: 0
  });
}

/**
 * 创建输入事件处理器
 * 用于在输入框的input事件中使用
 * @param {Function} validationFn - 验证函数
 * @param {Function} callback - 回调函数，接收过滤后的值
 * @param {Object} options - 验证选项
 * @returns {Function} 事件处理器函数
 */
export function createInputHandler(validationFn, callback, options = {}) {
  return (event) => {
    const inputValue = event.target.value;
    const validatedValue = validationFn(inputValue, options);
    
    // 如果值发生了变化，更新输入框
    if (validatedValue !== inputValue) {
      event.target.value = validatedValue;
      // 触发input事件，确保Vue能检测到变化
      event.target.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // 调用回调函数
    if (callback) {
      callback(validatedValue);
    }
  };
}

/**
 * Vue组合式API的输入验证hook
 * @param {Function} validationFn - 验证函数
 * @param {Object} options - 验证选项
 * @returns {Object} 包含处理器函数的对象
 */
export function useInputValidation(validationFn, options = {}) {
  const handleInput = (value, callback) => {
    const validatedValue = validationFn(value, options);
    if (callback) {
      callback(validatedValue);
    }
    return validatedValue;
  };

  const createHandler = (callback) => {
    return createInputHandler(validationFn, callback, options);
  };

  return {
    handleInput,
    createHandler
  };
}

// 导出常用的预配置验证器
export const numberValidators = {
  // 通用数字验证器（支持小数和负数）
  number: (value) => validateNumberInput(value, { allowDecimal: true, allowNegative: true }),

  // 整数验证器（不支持小数，支持负数）
  integer: (value) => validateIntegerInput(value, { allowNegative: true }),

  // 正整数验证器（不支持小数和负数）
  positiveInteger: (value) => validateIntegerInput(value, { allowNegative: false }),

  // 正数验证器（支持小数，不支持负数）
  positiveNumber: (value) => validatePositiveNumberInput(value),

  // 有符号数字验证器（支持小数和负数）
  signedNumber: (value) => validateSignedNumberInput(value),

  // 百分比验证器（支持小数，不支持负数，0-100范围）
  percentage: (value) => validatePercentageInput(value),

  // 金额验证器（支持小数，不支持负数）
  amount: (value) => validateAmountInput(value),

  // 有符号金额验证器（支持小数和负数，用于利润等可能为负的金额）
  signedAmount: (value) => validateNumberInput(value, {
    allowDecimal: true,
    allowNegative: true,
    decimalPlaces: 2
  }),

  // 自定义验证器工厂
  custom: (options) => (value) => validateNumberInput(value, options)
};
