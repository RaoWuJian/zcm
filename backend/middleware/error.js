// 异步错误处理包装器
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 错误日志记录

  // Mongoose 错误处理
  if (err.name === 'CastError') {
    const message = '资源未找到';
    error = {
      message,
      statusCode: 404
    };
  }

  // Mongoose 重复字段错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    let message = `${field} 已存在`;

    // 提供更具体的错误信息
    if (field === 'loginAccount') {
      message = `登录账号 "${value}" 已存在，请使用其他账号`;
    } else if (field === 'username') {
      message = `用户名 "${value}" 已存在，请使用其他用户名`;
    } else if (field === 'departmentName') {
      message = `部门名称 "${value}" 已存在，请使用其他名称`;
    }

    error = {
      message,
      statusCode: 400
    };
  }

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    // 提取所有验证错误信息
    const errors = Object.values(err.errors).map(val => val.message);

    // 如果只有一个错误，直接显示
    if (errors.length === 1) {
      error = {
        message: errors[0],
        statusCode: 400
      };
    } else {
      // 多个错误时，显示第一个错误并提示还有其他错误
      error = {
        message: `${errors[0]}（还有${errors.length - 1}个其他验证错误）`,
        statusCode: 400,
        details: errors // 可选：提供所有错误详情
      };
    }
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token无效';
    error = {
      message,
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token已过期';
    error = {
      message,
      statusCode: 401
    };
  }

  // 确保错误信息是中文且具体
  let finalMessage = error.message || err.message || '操作失败，请稍后重试';

  // 如果是通用的服务器错误，提供更友好的提示
  if (!error.message && !err.message) {
    if (err.stack) {
      console.error('未处理的错误:', err.stack);
    }
    finalMessage = '操作失败，请检查输入信息或联系管理员';
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: finalMessage
  });
};

// 404 处理中间件
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  asyncHandler,
  errorHandler,
  notFound
};