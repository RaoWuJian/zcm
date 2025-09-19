const CommissionAccounting = require('../models/CommissionAccounting');
const { asyncHandler } = require('../middleware/error');
const { precisionCalculate } = require('../utils/precision');

// 辅助函数：检查用户是否有权限访问核算佣金记录
const checkCommissionAccountingAccess = async (recordId, user) => {
  const record = await CommissionAccounting.findById(recordId).populate('createdBy');
  
  if (!record) {
    return { hasAccess: false, record: null, error: '核算佣金记录不存在' };
  }

  // 管理员可以访问所有记录
  if (user.isAdmin) {
    return { hasAccess: true, record, error: null };
  }

  // 检查创建者是否在用户的部门权限范围内
  const createdByUser = record.createdBy;
  if (!createdByUser) {
    return { hasAccess: false, record: null, error: '无法确定记录创建者' };
  }

  const userDepartmentPath = user.departmentPath || '';
  const createdByDepartmentPath = createdByUser.departmentPath || '';

  // 检查是否是同一部门或子部门
  if (createdByDepartmentPath === userDepartmentPath || 
      createdByDepartmentPath.startsWith(userDepartmentPath + '->')) {
    return { hasAccess: true, record, error: null };
  }

  return { hasAccess: false, record: null, error: '无权限访问此核算佣金记录' };
};

// @desc    创建核算佣金记录
// @route   POST /api/commission-accounting
// @access  Private
const createCommissionAccounting = asyncHandler(async (req, res) => {
  const {
    name,
    shopName,
    platform,
    netTransactionData,
    commission,
    dailyConsumption,
    description
  } = req.body;

  const record = await CommissionAccounting.create({
    name,
    shopName,
    platform,
    netTransactionData,
    commission,
    dailyConsumption,
    description,
    createdBy: req.user.id
  });

  // 重新查询以获取完整的populate信息
  const fullRecord = await CommissionAccounting.findById(record._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(201).json({
    success: true,
    data: fullRecord,
    message: '核算佣金记录创建成功'
  });
});

// @desc    批量创建核算佣金记录
// @route   POST /api/commission-accounting/batch
// @access  Private
const batchCreateCommissionAccounting = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供要创建的记录数组'
    });
  }

  // 验证每条记录的必填字段
  const validationErrors = [];
  records.forEach((record, index) => {
    if (!record.name || record.name.trim() === '') {
      validationErrors.push(`第${index + 1}条记录：产品名称不能为空`);
    }
    if (record.netTransactionData === undefined || record.netTransactionData === null) {
      validationErrors.push(`第${index + 1}条记录：净成交数据不能为空`);
    }
    if (record.commission === undefined || record.commission === null) {
      validationErrors.push(`第${index + 1}条记录：佣金不能为空`);
    }
    if (record.netTransactionData < 0) {
      validationErrors.push(`第${index + 1}条记录：净成交数据不能小于0`);
    }
    if (record.commission < 0 || record.commission > 100) {
      validationErrors.push(`第${index + 1}条记录：佣金范围应在0-100之间`);
    }
    if (record.dailyConsumption && record.dailyConsumption < 0) {
      validationErrors.push(`第${index + 1}条记录：今日消耗不能小于0`);
    }
  });

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: validationErrors
    });
  }

  try {
    // 为每条记录添加创建者信息并计算佣金利润和净利润
    const recordsToCreate = records.map((record, index) => {
      const netTransactionData = Number(record.netTransactionData) || 0;
      const commission = Number(record.commission) || 0;
      const dailyConsumption = Number(record.dailyConsumption) || 0;

      // 佣金利润 = 净成交数据 × 佣金%
      const commissionProfit = precisionCalculate.multiply(
        netTransactionData,
        precisionCalculate.divide(commission, 100)
      );

      // 净利润 = 佣金利润 - 今日消耗
      const netProfit = precisionCalculate.subtract(commissionProfit, dailyConsumption);

      return {
        ...record,
        createdBy: req.user.id,
        dailyConsumption,
        commissionProfit,
        netProfit
      };
    });

    // 批量创建记录
    const createdRecords = await CommissionAccounting.insertMany(recordsToCreate);

    // 重新查询以获取完整的populate信息
    const fullRecords = await CommissionAccounting.find({
      _id: { $in: createdRecords.map(record => record._id) }
    })
      .populate('createdBy', 'username loginAccount')
      .populate('updatedBy', 'username loginAccount')
      .sort({ createdAt: -1 });

    res.status(201).json({
      success: true,
      data: fullRecords,
      message: `成功创建 ${createdRecords.length} 条核算佣金记录`
    });

  } catch (error) {
    // 处理重复数据或其他数据库错误
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '存在重复的记录，请检查数据'
      });
    }

    throw error;
  }
});

// @desc    获取核算佣金记录列表
// @route   GET /api/commission-accounting
// @access  Private
const getCommissionAccountings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    name,
    shopName,
    platform,
    startDate,
    endDate,
    minProfit,
    maxProfit,
    search
  } = req.query;
  const user = req.user;

  // 构建查询条件
  const query = {};

  if (name) query.name = { $regex: name, $options: 'i' };
  if (shopName) query.shopName = { $regex: shopName, $options: 'i' };
  if (platform) query.platform = { $regex: platform, $options: 'i' };

  // 获取用户有权限访问的用户ID列表（基于部门权限）
  let allowedUserIds = [];
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';
    
    if (userDepartmentPath) {
      // 转义正则表达式特殊字符
      const escapedPath = userDepartmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // 获取当前部门及其子部门的用户
      const User = require('../models/User');
      const allowedUsers = await User.find({
        $or: [
          { departmentPath: userDepartmentPath }, // 当前部门用户
          { departmentPath: { $regex: `^${escapedPath}->` } }, // 子部门用户
        ]
      }).select('_id');
      
      allowedUserIds = allowedUsers.map(user => user._id);
    }
    
    // 限制只查看有权限的用户创建的记录
    if (allowedUserIds.length > 0) {
      query.createdBy = { $in: allowedUserIds };
    } else {
      // 如果没有权限访问任何用户，返回空结果
      query.createdBy = { $in: [] };
    }
  }

  // 净利润范围查询
  if (minProfit || maxProfit) {
    query.netProfit = {};
    if (minProfit) query.netProfit.$gte = Number(minProfit);
    if (maxProfit) query.netProfit.$lte = Number(maxProfit);
  }

  // 日期范围查询
  if (startDate || endDate) {
    query.createdAt = {};

    if (startDate) {
      // 开始日期设置为当天的 00:00:00
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.createdAt.$gte = start;
    }

    if (endDate) {
      // 结束日期设置为当天的 23:59:59.999
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  // 搜索功能（按名称搜索）
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const records = await CommissionAccounting.find(query)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await CommissionAccounting.countDocuments(query);

  res.status(200).json({
    success: true,
    data: records,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// @desc    获取单个核算佣金记录
// @route   GET /api/commission-accounting/:id
// @access  Private
const getCommissionAccounting = asyncHandler(async (req, res) => {
  const { hasAccess, record, error } = await checkCommissionAccountingAccess(req.params.id, req.user);

  if (!hasAccess) {
    return res.status(record === null ? 404 : 403).json({
      success: false,
      message: error
    });
  }

  // 重新查询以获取完整的populate信息
  const fullRecord = await CommissionAccounting.findById(req.params.id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(200).json({
    success: true,
    data: fullRecord
  });
});

// @desc    更新核算佣金记录
// @route   PUT /api/commission-accounting/:id
// @access  Private
const updateCommissionAccounting = asyncHandler(async (req, res) => {
  const { hasAccess, record, error } = await checkCommissionAccountingAccess(req.params.id, req.user);

  if (!hasAccess) {
    return res.status(record === null ? 404 : 403).json({
      success: false,
      message: error
    });
  }

  // 手动更新字段并保存，以触发 pre('save') 钩子进行自动计算
  Object.assign(record, req.body);
  record.updatedBy = req.user.id;
  record.updatedAt = Date.now();

  await record.save();

  // 重新查询以获取完整的populate信息
  const updatedRecord = await CommissionAccounting.findById(req.params.id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(200).json({
    success: true,
    data: updatedRecord,
    message: '核算佣金记录更新成功'
  });
});

// @desc    删除核算佣金记录
// @route   DELETE /api/commission-accounting/:id
// @access  Private
const deleteCommissionAccounting = asyncHandler(async (req, res) => {
  const { hasAccess, record, error } = await checkCommissionAccountingAccess(req.params.id, req.user);

  if (!hasAccess) {
    return res.status(record === null ? 404 : 403).json({
      success: false,
      message: error
    });
  }

  await CommissionAccounting.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: '核算佣金记录删除成功'
  });
});

// @desc    批量删除核算佣金记录
// @route   DELETE /api/commission-accounting/batch
// @access  Private
const batchDeleteCommissionAccounting = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供要删除的记录ID数组'
    });
  }

  // 检查用户对每个记录的权限
  const accessChecks = await Promise.all(
    ids.map(id => checkCommissionAccountingAccess(id, req.user))
  );

  // 过滤出有权限删除的记录ID
  const allowedIds = [];
  const deniedCount = accessChecks.filter(check => !check.hasAccess).length;

  accessChecks.forEach((check, index) => {
    if (check.hasAccess) {
      allowedIds.push(ids[index]);
    }
  });

  if (allowedIds.length === 0) {
    return res.status(403).json({
      success: false,
      message: '没有权限删除任何选中的记录'
    });
  }

  const result = await CommissionAccounting.deleteMany({
    _id: { $in: allowedIds }
  });

  let message = `成功删除 ${result.deletedCount} 条核算佣金记录`;
  if (deniedCount > 0) {
    message += `，${deniedCount} 条记录因权限不足被跳过`;
  }

  res.status(200).json({
    success: true,
    message
  });
});

// @desc    获取店铺名称建议列表
// @route   GET /api/commission-accounting/suggestions/shop-names
// @access  Private
const getShopNameSuggestions = asyncHandler(async (req, res) => {
  const user = req.user;

  // 构建查询条件（基于用户权限）
  let query = {};
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';

    if (userDepartmentPath) {
      // 转义正则表达式特殊字符
      const escapedPath = userDepartmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // 获取当前部门及其子部门的用户
      const User = require('../models/User');
      const allowedUsers = await User.find({
        $or: [
          { departmentPath: userDepartmentPath }, // 当前部门用户
          { departmentPath: { $regex: `^${escapedPath}->` } }, // 子部门用户
        ]
      }).select('_id');

      const allowedUserIds = allowedUsers.map(user => user._id);

      // 限制只查看有权限的用户创建的记录
      if (allowedUserIds.length > 0) {
        query.createdBy = { $in: allowedUserIds };
      } else {
        // 如果没有权限访问任何用户，返回空结果
        query.createdBy = { $in: [] };
      }
    }
  }

  // 获取所有非空的店铺名称
  query.shopName = { $ne: null, $ne: '' };

  const shopNames = await CommissionAccounting.distinct('shopName', query);

  res.status(200).json({
    success: true,
    data: shopNames.filter(name => name && name.trim()).sort()
  });
});

// @desc    获取平台建议列表
// @route   GET /api/commission-accounting/suggestions/platforms
// @access  Private
const getPlatformSuggestions = asyncHandler(async (req, res) => {
  const user = req.user;

  // 构建查询条件（基于用户权限）
  let query = {};
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';

    if (userDepartmentPath) {
      // 转义正则表达式特殊字符
      const escapedPath = userDepartmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // 获取当前部门及其子部门的用户
      const User = require('../models/User');
      const allowedUsers = await User.find({
        $or: [
          { departmentPath: userDepartmentPath }, // 当前部门用户
          { departmentPath: { $regex: `^${escapedPath}->` } }, // 子部门用户
        ]
      }).select('_id');

      const allowedUserIds = allowedUsers.map(user => user._id);

      // 限制只查看有权限的用户创建的记录
      if (allowedUserIds.length > 0) {
        query.createdBy = { $in: allowedUserIds };
      } else {
        // 如果没有权限访问任何用户，返回空结果
        query.createdBy = { $in: [] };
      }
    }
  }

  // 获取所有非空的平台名称
  query.platform = { $ne: null, $ne: '' };

  const platforms = await CommissionAccounting.distinct('platform', query);

  res.status(200).json({
    success: true,
    data: platforms.filter(name => name && name.trim()).sort()
  });
});

// @desc    获取产品名称建议列表
// @route   GET /api/commission-accounting/suggestions/product-names
// @access  Private
const getProductNameSuggestions = asyncHandler(async (req, res) => {
  const user = req.user;

  // 构建查询条件（基于用户权限）
  let query = {};
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';

    if (userDepartmentPath) {
      // 转义正则表达式特殊字符
      const escapedPath = userDepartmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // 获取当前部门及其子部门的用户
      const User = require('../models/User');
      const allowedUsers = await User.find({
        $or: [
          { departmentPath: userDepartmentPath }, // 当前部门用户
          { departmentPath: { $regex: `^${escapedPath}->` } }, // 子部门用户
        ]
      }).select('_id');

      const allowedUserIds = allowedUsers.map(user => user._id);

      // 限制只查看有权限的用户创建的记录
      if (allowedUserIds.length > 0) {
        query.createdBy = { $in: allowedUserIds };
      } else {
        // 如果没有权限访问任何用户，返回空结果
        query.createdBy = { $in: [] };
      }
    }
  }

  // 获取所有非空的产品名称
  query.name = { $ne: null, $ne: '' };

  const productNames = await CommissionAccounting.distinct('name', query);

  res.status(200).json({
    success: true,
    data: productNames.filter(name => name && name.trim()).sort()
  });
});

module.exports = {
  createCommissionAccounting,
  batchCreateCommissionAccounting,
  getCommissionAccountings,
  getCommissionAccounting,
  updateCommissionAccounting,
  deleteCommissionAccounting,
  batchDeleteCommissionAccounting,
  getShopNameSuggestions,
  getPlatformSuggestions,
  getProductNameSuggestions
};
