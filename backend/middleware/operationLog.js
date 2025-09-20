const OperationLog = require('../models/OperationLog');

// 获取客户端IP地址
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip;
};

// 操作日志记录中间件
const logOperation = (options = {}) => {
  return async (req, res, next) => {
    // 保存原始的 res.json 方法
    const originalJson = res.json;
    
    // 重写 res.json 方法以捕获响应数据
    res.json = function(data) {
      // 恢复原始方法
      res.json = originalJson;
      
      // 异步记录操作日志，不阻塞响应
      setImmediate(async () => {
        try {
          await recordOperationLog(req, res, data, options);
        } catch (error) {
          console.error('记录操作日志失败:', error);
        }
      });
      
      // 调用原始方法返回响应
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// 记录操作日志的核心函数
const recordOperationLog = async (req, res, responseData, options) => {
  // 检查是否需要记录日志
  if (!shouldLogOperation(req, res, responseData, options)) {
    return;
  }

  // 确保用户已认证
  if (!req.user) {
    return;
  }

  const {
    operationType,
    module,
    resourceIdField = 'id',
    getResourceName,
    getDescription,
    excludeFields = ['loginPassword', '__v', 'createdAt', 'updatedAt']
  } = options;

  try {
    // 获取资源ID
    let resourceId = req.params[resourceIdField] || req.params.id;
    if (!resourceId && responseData && responseData.data && responseData.data._id) {
      resourceId = responseData.data._id;
    }

    // 获取资源名称
    let resourceName = '';
    if (getResourceName && typeof getResourceName === 'function') {
      resourceName = getResourceName(req, responseData);
    } else if (responseData && responseData.data) {
      resourceName = responseData.data.name || 
                    responseData.data.username || 
                    responseData.data.departmentName || 
                    responseData.data.title || 
                    resourceId || '';
    }

    // 获取操作描述
    let description = '';
    if (getDescription && typeof getDescription === 'function') {
      description = getDescription(req, responseData, operationType);
    } else {
      description = generateDefaultDescription(operationType, module, resourceName);
    }

    // 处理操作前后数据
    let beforeData = null;
    let afterData = null;

    if (operationType === 'CREATE' && responseData && responseData.data) {
      afterData = cleanData(responseData.data, excludeFields);
    } else if (operationType === 'UPDATE') {
      if (req.originalData) {
        beforeData = cleanData(req.originalData, excludeFields);
      }
      if (responseData && responseData.data) {
        afterData = cleanData(responseData.data, excludeFields);
      }
    } else if (operationType === 'DELETE' && req.originalData) {
      beforeData = cleanData(req.originalData, excludeFields);
    }

    // 构建日志数据
    const logData = {
      operationType,
      module,
      resourceId: resourceId ? resourceId.toString() : null,
      resourceName,
      description,
      beforeData,
      afterData,
      operatorId: req.user.id || req.user._id,
      operatorName: req.user.username,
      operatorAccount: req.user.loginAccount,
      requestInfo: {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        ip: getClientIP(req)
      },
      result: responseData && responseData.success ? 'SUCCESS' : 'FAILED',
      errorMessage: responseData && !responseData.success ? responseData.message : null
    };

    // 记录日志
    await OperationLog.logOperation(logData);
  } catch (error) {
    console.error('记录操作日志时发生错误:', error);
  }
};

// 判断是否需要记录日志
const shouldLogOperation = (req, res, responseData, options) => {
  // 检查响应状态码
  if (res.statusCode >= 400) {
    return false;
  }

  // 检查响应数据
  if (!responseData || !responseData.success) {
    return false;
  }

  // 检查是否为需要记录的操作
  const { operationType } = options;
  if (!operationType) {
    return false;
  }

  return true;
};

// 清理数据，移除敏感字段
const cleanData = (data, excludeFields = []) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const cleaned = JSON.parse(JSON.stringify(data));
  
  excludeFields.forEach(field => {
    if (cleaned[field] !== undefined) {
      delete cleaned[field];
    }
  });

  return cleaned;
};

// 生成默认操作描述
const generateDefaultDescription = (operationType, module, resourceName) => {
  const moduleNames = {
    'USER': '用户',
    'DEPARTMENT': '部门',
    'FINANCE': '财务记录',
    'PRODUCT': '产品',
    'ROLE': '角色',
    'TEAM_ACCOUNT': '团队账户',
    'FILE': '文件',
    'COMMISSION': '佣金',
    'BUDGET': '预算'
  };

  const operationNames = {
    'CREATE': '创建',
    'UPDATE': '更新',
    'DELETE': '删除',
    'LOGIN': '登录',
    'LOGOUT': '登出',
    'APPROVE': '审批',
    'REJECT': '拒绝'
  };

  const moduleName = moduleNames[module] || module;
  const operationName = operationNames[operationType] || operationType;
  
  if (resourceName) {
    return `${operationName}${moduleName}: ${resourceName}`;
  } else {
    return `${operationName}${moduleName}`;
  }
};

// 预处理中间件，用于保存操作前的数据
const saveOriginalData = (Model, idField = 'id') => {
  return async (req, res, next) => {
    try {
      const id = req.params[idField] || req.params.id;
      if (id && Model) {
        const originalData = await Model.findById(id);
        if (originalData) {
          req.originalData = originalData.toObject();
        }
      }
    } catch (error) {
      console.error('保存原始数据失败:', error);
    }
    next();
  };
};

module.exports = {
  logOperation,
  saveOriginalData,
  recordOperationLog
};
