const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/error');
const { precisionCalculate } = require('../utils/precision');

// 辅助函数：检查用户是否有权限访问产品记录
const checkProductAccess = async (productId, user) => {
  const product = await Product.findById(productId).populate('createdBy');

  if (!product) {
    return { hasAccess: false, product: null, error: '产品记录不存在' };
  }

  // 管理员可以访问所有记录
  if (user.isAdmin) {
    return { hasAccess: true, product, error: null };
  }

  // 检查创建者是否在用户的部门权限范围内
  const createdByUser = product.createdBy;
  if (!createdByUser) {
    return { hasAccess: false, product: null, error: '无法确定记录创建者' };
  }

  const userDepartmentPath = user.departmentPath || '';
  const createdByDepartmentPath = createdByUser.departmentPath || '';

  // 检查是否是同一部门或子部门
  if (createdByDepartmentPath === userDepartmentPath ||
      createdByDepartmentPath.startsWith(userDepartmentPath + '->')) {
    return { hasAccess: true, product, error: null };
  }

  return { hasAccess: false, product: null, error: '无权限访问此产品记录' };
};

// @desc    创建产品记录
// @route   POST /api/products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
  const {
    team,
    name,
    supplier,
    storeName,
    storeId,
    platform,
    dailyOrderCount,
    dailySalesVolume,
    dailyPaymentAmount,
    unitPrice,
    productCost,
    shippingCost,
    dailyConsumedAmount,
    handlingFee,
    afterSalesAmount,
    afterSalesCost
  } = req.body;

  // 计算产品成本
  // const productCost = precisionCalculate.multiply(
  //   dailySalesVolume || 0,
  //   unitPrice || 0
  // );

  // // 计算当天总盈亏
  // const dailyTotalProfit = precisionCalculate.subtract(
  //   dailyPaymentAmount || 0,
  //   productCost,
  //   shippingCost || 0,
  //   dailyConsumedAmount || 0,
  //   handlingFee || 0,
  //   afterSalesAmount || 0,
  //   afterSalesCost || 0
  // );

  const product = await Product.create({
    team,
    name,
    supplier,
    storeName,
    storeId: storeId || '',
    platform,
    dailyOrderCount: dailyOrderCount || 0,
    dailySalesVolume: dailySalesVolume || 0,
    dailyPaymentAmount: dailyPaymentAmount || 0,
    unitPrice: unitPrice || 0,
    productCost: productCost || 0,
    shippingCost: shippingCost || 0,
    dailyConsumedAmount: dailyConsumedAmount || 0,
    handlingFee: handlingFee || 0,
    afterSalesAmount: afterSalesAmount || 0,
    afterSalesCost: afterSalesCost || 0,
    dailyTotalProfit,
    createdBy: req.user.id
  });

  // 返回创建的产品记录，包含创建者信息
  const populatedProduct = await Product.findById(product._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(201).json({
    success: true,
    data: populatedProduct,
    message: '产品记录创建成功'
  });
});

// @desc    获取所有产品记录
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    team,
    platform,
    supplier,
    storeName,
    storeId,
    startDate,
    endDate,
    minProfit,
    maxProfit,
    search
  } = req.query;
  const user = req.user;

  // 构建查询条件
  const query = {};

  if (team) query.team = { $regex: team, $options: 'i' };
  if (platform) query.platform = { $regex: platform, $options: 'i' };
  if (supplier) query.supplier = { $regex: supplier, $options: 'i' };
  if (storeName) query.storeName = { $regex: storeName, $options: 'i' };
  if (storeId) query.storeId = { $regex: storeId, $options: 'i' };

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

    // 限制只查看有权限的用户创建的产品记录
    if (allowedUserIds.length > 0) {
      query.createdBy = { $in: allowedUserIds };
    } else {
      // 如果没有权限访问任何用户，返回空结果
      query.createdBy = { $in: [] };
    }
  }

  // 盈亏范围查询
  if (minProfit || maxProfit) {
    query.dailyTotalProfit = {};
    if (minProfit) query.dailyTotalProfit.$gte = Number(minProfit);
    if (maxProfit) query.dailyTotalProfit.$lte = Number(maxProfit);
  }

  // 日期范围查询
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // 搜索功能（按产品名称、团队、供货厂家、店铺名称搜索）
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { team: { $regex: search, $options: 'i' } },
      { supplier: { $regex: search, $options: 'i' } },
      { storeName: { $regex: search, $options: 'i' } },
      { storeId: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  const products = await Product.find(query)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);

  res.status(200).json({
    success: true,
    data: products,
    pagination: {
      current: Number(page),
      total: Math.ceil(total / limit),
      count: products.length,
      totalRecords: total
    }
  });
});

// @desc    获取单个产品记录
// @route   GET /api/products/:id
// @access  Private
const getProduct = asyncHandler(async (req, res) => {
  const { hasAccess, product, error } = await checkProductAccess(req.params.id, req.user);

  if (!hasAccess) {
    return res.status(product === null ? 404 : 403).json({
      success: false,
      message: error
    });
  }

  // 重新查询以获取完整的populate信息
  const fullProduct = await Product.findById(req.params.id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(200).json({
    success: true,
    data: fullProduct
  });
});

// @desc    更新产品记录
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  const { hasAccess, product, error } = await checkProductAccess(req.params.id, req.user);

  if (!hasAccess) {
    return res.status(product === null ? 404 : 403).json({
      success: false,
      message: error
    });
  }

  const updateData = {
    ...req.body,
    updatedBy: req.user.id,
    updatedAt: Date.now()
  };

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy', 'username loginAccount')
   .populate('updatedBy', 'username loginAccount');

  res.status(200).json({
    success: true,
    data: updatedProduct,
    message: '产品记录更新成功'
  });
});

// @desc    删除产品记录
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const { hasAccess, product, error } = await checkProductAccess(req.params.id, req.user);

  if (!hasAccess) {
    return res.status(product === null ? 404 : 403).json({
      success: false,
      message: error
    });
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: '产品记录删除成功'
  });
});

// @desc    获取产品统计数据
// @route   GET /api/products/stats
// @access  Private
const getProductStats = asyncHandler(async (req, res) => {
  const { team, platform, supplier, startDate, endDate } = req.query;
  const user = req.user;

  // 构建查询条件
  const query = {};
  if (team) query.team = { $regex: team, $options: 'i' };
  if (platform) query.platform = { $regex: platform, $options: 'i' };
  if (supplier) query.supplier = { $regex: supplier, $options: 'i' };

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

    // 限制只查看有权限的用户创建的产品记录
    if (allowedUserIds.length > 0) {
      query.createdBy = { $in: allowedUserIds };
    } else {
      // 如果没有权限访问任何用户，返回空结果
      query.createdBy = { $in: [] };
    }
  }

  // 日期范围查询
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const stats = await Product.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalOrderCount: { $sum: '$dailyOrderCount' },
        totalSalesVolume: { $sum: '$dailySalesVolume' },
        totalPaymentAmount: { $sum: '$dailyPaymentAmount' },
        totalConsumedAmount: { $sum: '$dailyConsumedAmount' },
        totalHandlingFee: { $sum: '$handlingFee' },
        totalAfterSalesAmount: { $sum: '$afterSalesAmount' },
        totalAfterSalesCost: { $sum: '$afterSalesCost' },
        totalProfit: { $sum: '$dailyTotalProfit' },
        avgUnitPrice: { $avg: '$unitPrice' },
        avgProductCost: { $avg: '$productCost' },
        avgShippingCost: { $avg: '$shippingCost' }
      }
    }
  ]);

  // 按团队统计
  const teamStats = await Product.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$team',
        productCount: { $sum: 1 },
        totalProfit: { $sum: '$dailyTotalProfit' },
        totalOrderCount: { $sum: '$dailyOrderCount' },
        totalSalesVolume: { $sum: '$dailySalesVolume' }
      }
    },
    { $sort: { totalProfit: -1 } }
  ]);

  // 按平台统计
  const platformStats = await Product.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$platform',
        productCount: { $sum: 1 },
        totalProfit: { $sum: '$dailyTotalProfit' },
        totalOrderCount: { $sum: '$dailyOrderCount' },
        totalSalesVolume: { $sum: '$dailySalesVolume' }
      }
    },
    { $sort: { totalProfit: -1 } }
  ]);

  const result = stats.length > 0 ? stats[0] : {
    totalProducts: 0,
    totalOrderCount: 0,
    totalSalesVolume: 0,
    totalPaymentAmount: 0,
    totalConsumedAmount: 0,
    totalHandlingFee: 0,
    totalAfterSalesAmount: 0,
    totalAfterSalesCost: 0,
    totalProfit: 0,
    avgUnitPrice: 0,
    avgProductCost: 0,
    avgShippingCost: 0
  };

  res.status(200).json({
    success: true,
    data: {
      overview: result,
      teamStats,
      platformStats
    }
  });
});

// @desc    批量删除产品记录
// @route   DELETE /api/products/batch
// @access  Private
const batchDeleteProduct = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供要删除的记录ID数组'
    });
  }

  // 检查用户对每个记录的权限
  const accessChecks = await Promise.all(
    ids.map(id => checkProductAccess(id, req.user))
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

  const result = await Product.deleteMany({
    _id: { $in: allowedIds }
  });

  let message = `成功删除 ${result.deletedCount} 条产品记录`;
  if (deniedCount > 0) {
    message += `，${deniedCount} 条记录因权限不足被跳过`;
  }

  res.status(200).json({
    success: true,
    message
  });
});

// @desc    获取商品建议数据（用于自动补全）
// @route   GET /api/products/suggestions
// @access  Private
const getProductSuggestions = asyncHandler(async (req, res) => {
  const user = req.user;

  // 构建查询条件（根据用户权限过滤）
  let query = {};
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

      const allowedUserIds = allowedUsers.map(user => user._id);

      // 限制只查看有权限的用户创建的产品记录
      if (allowedUserIds.length > 0) {
        query.createdBy = { $in: allowedUserIds };
      } else {
        // 如果没有权限访问任何用户，返回空结果
        query.createdBy = { $in: [] };
      }
    }
  }

  try {
    // 获取所有唯一的团队、供应商、店铺名、平台
    const suggestions = await Product.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          teams: { $addToSet: '$team' },
          suppliers: { $addToSet: '$supplier' },
          storeNames: { $addToSet: '$storeName' },
          platforms: { $addToSet: '$platform' }
        }
      }
    ]);

    const result = suggestions.length > 0 ? suggestions[0] : {
      teams: [],
      suppliers: [],
      storeNames: [],
      platforms: []
    };

    // 过滤掉空值并排序
    result.teams = result.teams.filter(item => item && item.trim()).sort();
    result.suppliers = result.suppliers.filter(item => item && item.trim()).sort();
    result.storeNames = result.storeNames.filter(item => item && item.trim()).sort();
    result.platforms = result.platforms.filter(item => item && item.trim()).sort();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '获取建议数据失败'
    });
  }
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  batchDeleteProduct,
  getProductSuggestions
};