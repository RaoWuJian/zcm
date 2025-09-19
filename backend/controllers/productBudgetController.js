const ProductBudget = require('../models/ProductBudget');
const { asyncHandler } = require('../middleware/error');
// 引入精确计算工具
const { precisionCalculate } = require('../utils/precision');

// 辅助函数：检查用户是否有权限访问预算记录
const checkBudgetAccess = async (budgetId, user) => {
  const budget = await ProductBudget.findById(budgetId).populate('createdBy');

  if (!budget) {
    return { hasAccess: false, budget: null, error: '产品预算记录不存在' };
  }

  // 管理员可以访问所有记录
  if (user.isAdmin) {
    return { hasAccess: true, budget, error: null };
  }

  // 检查创建者是否在用户的部门权限范围内
  const createdByUser = budget.createdBy;
  if (!createdByUser) {
    return { hasAccess: false, budget: null, error: '无法确定记录创建者' };
  }

  const userDepartmentPath = user.departmentPath || '';
  const createdByDepartmentPath = createdByUser.departmentPath || '';

  // 检查是否是同一部门或子部门
  if (createdByDepartmentPath === userDepartmentPath ||
      createdByDepartmentPath.startsWith(userDepartmentPath + '->')) {
    return { hasAccess: true, budget, error: null };
  }

  return { hasAccess: false, budget: null, error: '无权限访问此预算记录' };
};

// @desc    创建商品预算
// @route   POST /api/budget
// @access  Private
const createProductBudget = asyncHandler(async (req, res) => {
  const {
    productName,
    shopName,
    platform,
    sellingPrice,
    unitCost,
    shippingCost,
    platformFee,
    handlingFee,
    description
  } = req.body;

  const budget = await ProductBudget.create({
    productName,
    shopName,
    platform,
    sellingPrice,
    unitCost,
    shippingCost,
    platformFee,
    handlingFee,
    description,
    createdBy: req.user.id
  });

  // 返回创建的预算记录，包含创建者信息
  const populatedBudget = await ProductBudget.findById(budget._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(201).json({
    success: true,
    data: populatedBudget,
    message: '产品预算创建成功'
  });
});

// @desc    批量创建商品预算
// @route   POST /api/budget/batch
// @access  Private
const batchCreateProductBudget = asyncHandler(async (req, res) => {
  const budgets = req.body;

  // 验证输入数据
  if (!Array.isArray(budgets) || budgets.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供有效的预算数据数组'
    });
  }

  // 为每条记录添加创建者信息并计算毛利和实际佣金
  const budgetsToCreate = budgets.map((budget, index) => {
    const sellingPrice = Number(budget.sellingPrice) || 0;
    const unitCost = Number(budget.unitCost) || 0;
    const shippingCost = Number(budget.shippingCost) || 0;
    const platformFee = Number(budget.platformFee) || 0;
    const handlingFee = Number(budget.handlingFee) || 0;

    // 毛利 = 售价 - 成本单价 - 运费 - 平台费用 - 手续费
    const grossMargin = precisionCalculate.subtract(
      sellingPrice,
      unitCost,
      shippingCost,
      platformFee,
      handlingFee
    );

    // 实际佣金 = (毛利 ÷ 售价) × 100%
    const actualCommission = precisionCalculate.percentage(
      grossMargin,
      sellingPrice || 0
    );

    return {
      ...budget,
      createdBy: req.user.id,
      grossMargin,
      actualCommission
    };
  });

  try {
    // 批量创建记录
    const createdBudgets = await ProductBudget.insertMany(budgetsToCreate);

    // 验证创建结果
    createdBudgets.forEach((budget, index) => {
      console.log(`记录 ${index + 1} (${budget.productName}): 毛利=${budget.grossMargin}, 实际佣金=${budget.actualCommission}%`);
    });

    res.status(201).json({
      success: true,
      message: `成功创建 ${createdBudgets.length} 条产品预算记录`,
      data: createdBudgets
    });
  } catch (error) {
    console.error('批量创建产品预算失败:', error);
    res.status(500).json({
      success: false,
      message: '批量创建产品预算失败'
    });
  }
});

// @desc    获取所有产品预算记录
// @route   GET /api/budget
// @access  Private
const getProductBudgets = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    productName,
    shopName,
    startDate,
    endDate,
    minGrossMargin,
    maxGrossMargin,
    search
  } = req.query;
  const user = req.user;

  // 构建查询条件
  const query = {};

  if (productName) query.productName = { $regex: productName, $options: 'i' };
  if (shopName) query.shopName = { $regex: shopName, $options: 'i' };

  // 获取用户有权限访问的用户ID列表（基于部门权限）
  let allowedUserIds = [];
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';

    if (userDepartmentPath) {
      // 转义正则表达式特殊字符
      const escapedPath = userDepartmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // 获取当前用户自己和下属子部门的用户
      const User = require('../models/User');
      const allowedUsers = await User.find({
        $or: [
          { _id: user.id }, // 当前用户自己
          { departmentPath: { $regex: `^${escapedPath}->` } }, // 子部门用户
        ]
      }).select('_id');

      allowedUserIds = allowedUsers.map(user => user._id);
    }

    // 限制只查看有权限的用户创建的预算记录
    if (allowedUserIds.length > 0) {
      query.createdBy = { $in: allowedUserIds };
    } else {
      // 如果没有权限访问任何用户，返回空结果
      query.createdBy = { $in: [] };
    }
  }

  // 毛利范围查询
  if (minGrossMargin || maxGrossMargin) {
    query.grossMargin = {};
    if (minGrossMargin) query.grossMargin.$gte = Number(minGrossMargin);
    if (maxGrossMargin) query.grossMargin.$lte = Number(maxGrossMargin);
  }

  // 日期范围查询
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // 搜索功能（按产品名称、描述搜索）
  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const budgets = await ProductBudget.find(query)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await ProductBudget.countDocuments(query);

  res.status(200).json({
    success: true,
    data: budgets,
    pagination: {
      current: Number(page),
      total: Math.ceil(total / limit),
      count: budgets.length,
      totalRecords: total
    }
  });
});

// @desc    获取单个产品预算记录
// @route   GET /api/budget/:id
// @access  Private
const getProductBudget = asyncHandler(async (req, res) => {
  const { hasAccess, budget, error } = await checkBudgetAccess(req.params.id, req.user);

  if (!hasAccess) {
    return res.status(budget === null ? 404 : 403).json({
      success: false,
      message: error
    });
  }

  // 重新查询以获取完整的populate信息
  const fullBudget = await ProductBudget.findById(req.params.id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(200).json({
    success: true,
    data: fullBudget
  });
});

// @desc    更新产品预算记录
// @route   PUT /api/budget/:id
// @access  Private
const updateProductBudget = asyncHandler(async (req, res) => {
  const { hasAccess, budget, error } = await checkBudgetAccess(req.params.id, req.user);

  if (!hasAccess) {
    return res.status(budget === null ? 404 : 403).json({
      success: false,
      message: error
    });
  }

  // 手动更新字段并保存，以触发 pre('save') 钩子进行自动计算
  Object.assign(budget, req.body);
  budget.updatedBy = req.user.id;
  budget.updatedAt = Date.now();

  await budget.save();

  // 重新查询以获取完整的populate信息
  const updatedBudget = await ProductBudget.findById(req.params.id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(200).json({
    success: true,
    data: updatedBudget,
    message: '产品预算记录更新成功'
  });
});

// @desc    删除产品预算记录
// @route   DELETE /api/budget/:id
// @access  Private
const deleteProductBudget = asyncHandler(async (req, res) => {
  const { hasAccess, budget, error } = await checkBudgetAccess(req.params.id, req.user);

  if (!hasAccess) {
    return res.status(budget === null ? 404 : 403).json({
      success: false,
      message: error
    });
  }

  await ProductBudget.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: '产品预算记录删除成功'
  });
});



// @desc    批量删除产品预算记录
// @route   DELETE /api/budget/batch
// @access  Private
const batchDeleteProductBudget = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供要删除的记录ID数组'
    });
  }

  // 检查用户对每个记录的权限
  const accessChecks = await Promise.all(
    ids.map(id => checkBudgetAccess(id, req.user))
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

  const result = await ProductBudget.deleteMany({
    _id: { $in: allowedIds }
  });

  let message = `成功删除 ${result.deletedCount} 条产品预算记录`;
  if (deniedCount > 0) {
    message += `，${deniedCount} 条记录因权限不足被跳过`;
  }

  res.status(200).json({
    success: true,
    message
  });
});

// @desc    获取产品名称建议
// @route   GET /api/budget/suggestions/product-names
// @access  Private
const getProductNameSuggestions = asyncHandler(async (req, res) => {
  try {
    const productNames = await ProductBudget.distinct('productName', {
      createdBy: req.user.id,
      productName: { $ne: null, $ne: '' }
    });

    res.json({
      success: true,
      data: productNames.slice(0, 20) // 限制返回20个建议
    });
  } catch (error) {
    console.error('获取产品名称建议失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品名称建议失败'
    });
  }
});

// @desc    获取店铺名称建议
// @route   GET /api/budget/suggestions/shop-names
// @access  Private
const getShopNameSuggestions = asyncHandler(async (req, res) => {
  try {
    const shopNames = await ProductBudget.distinct('shopName', {
      createdBy: req.user.id,
      shopName: { $ne: null, $ne: '' }
    });

    res.json({
      success: true,
      data: shopNames.slice(0, 20)
    });
  } catch (error) {
    console.error('获取店铺名称建议失败:', error);
    res.status(500).json({
      success: false,
      message: '获取店铺名称建议失败'
    });
  }
});

// @desc    获取平台建议
// @route   GET /api/budget/suggestions/platforms
// @access  Private
const getPlatformSuggestions = asyncHandler(async (req, res) => {
  try {
    const platforms = await ProductBudget.distinct('platform', {
      createdBy: req.user.id,
      platform: { $ne: null, $ne: '' }
    });

    res.json({
      success: true,
      data: platforms.slice(0, 20)
    });
  } catch (error) {
    console.error('获取平台建议失败:', error);
    res.status(500).json({
      success: false,
      message: '获取平台建议失败'
    });
  }
});

module.exports = {
  createProductBudget,
  batchCreateProductBudget,
  getProductBudgets,
  getProductBudget,
  updateProductBudget,
  deleteProductBudget,
  batchDeleteProductBudget,
  getProductNameSuggestions,
  getShopNameSuggestions,
  getPlatformSuggestions
};