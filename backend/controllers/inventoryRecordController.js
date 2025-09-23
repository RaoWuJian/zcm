const { asyncHandler } = require('../middleware/error');
const InventoryRecord = require('../models/InventoryRecord');
const Inventory = require('../models/Inventory');

// @desc    获取库存操作记录
// @route   GET /api/inventory-records
// @access  Private
const getInventoryRecords = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    inventoryId,
    operationType,
    externalCode,
    internalCode,
    manufacturer,
    productName,
    operatedBy,
    startDate,
    endDate,
    search
  } = req.query;

  const user = req.user;

  // 构建查询条件
  const query = {};

  // 根据用户部门权限过滤数据
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

      // 限制只查看有权限的用户操作的记录
      if (allowedUserIds.length > 0) {
        query.operatedBy = { $in: allowedUserIds };
      } else {
        // 如果没有权限访问任何用户，返回空结果
        query.operatedBy = { $in: [] };
      }
    } else {
      // 没有部门的用户只能查看自己操作的记录
      query.operatedBy = user.id;
    }
  }

  if (inventoryId) query.inventoryId = inventoryId;
  if (operationType) query.operationType = operationType;
  if (externalCode) query.externalCode = { $regex: externalCode, $options: 'i' };
  if (internalCode) query.internalCode = { $regex: internalCode, $options: 'i' };
  if (manufacturer) query.manufacturer = { $regex: manufacturer, $options: 'i' };
  if (productName) query.productName = { $regex: productName, $options: 'i' };
  if (operatedBy) query.operatedBy = operatedBy;

  // 日期范围查询
  if (startDate || endDate) {
    query.operatedAt = {};
    if (startDate) query.operatedAt.$gte = new Date(startDate);
    if (endDate) query.operatedAt.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  // 全文搜索
  if (search) {
    query.$or = [
      { externalCode: { $regex: search, $options: 'i' } },
      { internalCode: { $regex: search, $options: 'i' } },
      { manufacturer: { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
      { reason: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // 获取总数
  const total = await InventoryRecord.countDocuments(query);

  // 获取数据
  const records = await InventoryRecord.find(query)
    .populate('inventoryId', 'externalCode internalCode productName manufacturer specification')
    .populate('operatedBy', 'username loginAccount')
    .sort({ operatedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // 添加操作类型的中文描述
  const recordsWithText = records.map(record => ({
    ...record.toObject(),
    operationTypeText: InventoryRecord.getOperationTypeText(record.operationType)
  }));

  res.status(200).json({
    success: true,
    data: recordsWithText,
    pagination: {
      current: pageNum,
      total: Math.ceil(total / limitNum),
      count: records.length,
      totalRecords: total
    }
  });
});

// @desc    获取特定库存的操作记录
// @route   GET /api/inventory/:id/records
// @access  Private
const getInventoryRecordsByInventoryId = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    operationType,
    reason,
    operatedBy,
    startDate,
    endDate
  } = req.query;

  const inventoryId = req.params.id;
  const user = req.user;

  // 检查库存记录是否存在
  const inventory = await Inventory.findById(inventoryId)
    .populate('createdBy', 'username loginAccount departmentPath');

  if (!inventory) {
    return res.status(404).json({
      success: false,
      message: '库存记录不存在'
    });
  }

  // 检查用户是否有权限查看此库存记录
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';
    const createdBy = inventory.createdBy;

    // 检查是否是用户自己创建的记录
    if (createdBy._id.toString() !== user.id) {
      // 如果不是自己创建的，检查是否是下属部门用户创建的
      if (userDepartmentPath && createdBy.departmentPath) {
        const isSubordinate = createdBy.departmentPath.startsWith(userDepartmentPath + '->');
        if (!isSubordinate) {
          return res.status(403).json({
            success: false,
            message: '没有权限查看此库存记录的操作记录'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: '没有权限查看此库存记录的操作记录'
        });
      }
    }
  }

  // 构建查询条件
  const query = { inventoryId };

  // 操作类型筛选
  if (operationType) query.operationType = operationType;

  // 操作原因搜索
  if (reason) {
    query.reason = { $regex: reason, $options: 'i' };
  }

  // 操作人搜索
  if (operatedBy) {
    const User = require('../models/User');
    const users = await User.find({
      $or: [
        { username: { $regex: operatedBy, $options: 'i' } },
        { loginAccount: { $regex: operatedBy, $options: 'i' } }
      ]
    }).select('_id');

    const userIds = users.map(u => u._id);
    if (userIds.length > 0) {
      query.operatedBy = { $in: userIds };
    } else {
      // 如果没有找到匹配的用户，返回空结果
      query.operatedBy = { $in: [] };
    }
  }

  // 日期范围查询
  if (startDate || endDate) {
    query.operatedAt = {};
    if (startDate) query.operatedAt.$gte = new Date(startDate);
    if (endDate) query.operatedAt.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // 获取总数
  const total = await InventoryRecord.countDocuments(query);

  // 获取数据
  const records = await InventoryRecord.find(query)
    .populate('operatedBy', 'username loginAccount')
    .sort({ operatedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // 添加操作类型的中文描述
  const recordsWithText = records.map(record => ({
    ...record.toObject(),
    operationTypeText: InventoryRecord.getOperationTypeText(record.operationType)
  }));

  res.status(200).json({
    success: true,
    data: recordsWithText,
    pagination: {
      current: pageNum,
      total: Math.ceil(total / limitNum),
      count: records.length,
      totalRecords: total
    }
  });
});

// @desc    获取库存统计信息
// @route   GET /api/inventory/stats
// @access  Private
const getInventoryStats = asyncHandler(async (req, res) => {
  const {
    search,
    manufacturer,
    status,
    startDate,
    endDate
  } = req.query;

  const user = req.user;

  // 构建查询条件
  const query = {};

  // 根据用户部门权限过滤数据
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

      const allowedUserIds = allowedUsers.map(u => u._id);

      // 限制只查看有权限的用户创建的库存记录
      if (allowedUserIds.length > 0) {
        query.createdBy = { $in: allowedUserIds };
      } else {
        // 如果没有权限访问任何用户，返回空结果
        query.createdBy = { $in: [] };
      }
    } else {
      // 如果用户没有部门信息，只能查看自己创建的记录
      query.createdBy = user.id;
    }
  }

  // 关键词搜索
  if (search) {
    query.$or = [
      { externalCode: { $regex: search, $options: 'i' } },
      { internalCode: { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
      { manufacturer: { $regex: search, $options: 'i' } },
      { specification: { $regex: search, $options: 'i' } }
    ];
  }

  // 厂家筛选
  if (manufacturer) {
    query.manufacturer = { $regex: manufacturer, $options: 'i' };
  }

  // 状态筛选
  if (status) {
    query.status = status;
  }

  // 日期范围筛选
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  // 库存总数统计
  const totalInventories = await Inventory.countDocuments(query);
  const activeInventories = await Inventory.countDocuments({ ...query, status: 'active' });
  const warningInventories = await Inventory.countDocuments({ ...query, status: 'warning' });

  // 库存数量统计
  const inventoryQuantityStats = await Inventory.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$currentQuantity' },
        avgQuantity: { $avg: '$currentQuantity' }
      }
    }
  ]);

  // 操作记录统计
  const recordDateQuery = {};
  if (startDate || endDate) {
    recordDateQuery.operatedAt = {};
    if (startDate) recordDateQuery.operatedAt.$gte = new Date(startDate);
    if (endDate) recordDateQuery.operatedAt.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  const operationStats = await InventoryRecord.aggregate([
    { $match: recordDateQuery },
    {
      $group: {
        _id: '$operationType',
        count: { $sum: 1 },
        totalQuantity: { $sum: { $abs: '$quantity' } }
      }
    }
  ]);

  // 厂家统计
  const manufacturerStats = await Inventory.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$manufacturer',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$currentQuantity' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const stats = {
    inventory: {
      total: totalInventories,
      active: activeInventories,
      warning: warningInventories
    },
    quantity: inventoryQuantityStats[0] || {
      totalQuantity: 0,
      avgQuantity: 0
    },
    operations: operationStats.map(stat => ({
      type: stat._id,
      typeText: InventoryRecord.getOperationTypeText(stat._id),
      count: stat.count,
      totalQuantity: stat.totalQuantity
    })),
    manufacturers: manufacturerStats
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = {
  getInventoryRecords,
  getInventoryRecordsByInventoryId,
  getInventoryStats
};
