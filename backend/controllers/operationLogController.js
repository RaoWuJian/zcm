const { asyncHandler } = require('../middleware/error');
const OperationLog = require('../models/OperationLog');

// @desc    获取操作日志列表
// @route   GET /api/operation-logs
// @access  Private
const getOperationLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    operationType,
    module,
    operatorId,
    resourceId,
    startDate,
    endDate,
    keyword,
    sortBy = 'operatedAt',
    sortOrder = 'desc'
  } = req.query;

  // 构建查询条件
  const query = {};

  // 操作类型筛选
  if (operationType) {
    query.operationType = operationType;
  }

  // 模块筛选
  if (module) {
    query.module = module;
  }

  // 操作人筛选
  if (operatorId) {
    query.operatorId = operatorId;
  }

  // 资源ID筛选
  if (resourceId) {
    query.resourceId = resourceId;
  }

  // 时间范围筛选
  if (startDate || endDate) {
    query.operatedAt = {};
    if (startDate) {
      query.operatedAt.$gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query.operatedAt.$lte = endDateTime;
    }
  }

  // 关键词搜索
  if (keyword) {
    query.$or = [
      { description: { $regex: keyword, $options: 'i' } },
      { resourceName: { $regex: keyword, $options: 'i' } },
      { operatorName: { $regex: keyword, $options: 'i' } },
      { operatorAccount: { $regex: keyword, $options: 'i' } }
    ];
  }

  // 排序设置
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // 分页设置
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  try {
    // 获取总数
    const total = await OperationLog.countDocuments(query);

    // 获取日志列表
    const logs = await OperationLog.find(query)
      .populate('operatorId', 'username loginAccount')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 分页信息
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limitNum),
      totalLogs: total,
      hasNext: parseInt(page) < Math.ceil(total / limitNum),
      hasPrev: parseInt(page) > 1
    };

    res.json({
      success: true,
      count: logs.length,
      pagination,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取操作日志失败: ' + error.message
    });
  }
});

// @desc    获取单个操作日志详情
// @route   GET /api/operation-logs/:id
// @access  Private
const getOperationLog = asyncHandler(async (req, res) => {
  try {
    const log = await OperationLog.findById(req.params.id)
      .populate('operatorId', 'username loginAccount');

    if (!log) {
      return res.status(404).json({
        success: false,
        message: '操作日志不存在'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取操作日志详情失败: ' + error.message
    });
  }
});

// @desc    获取操作统计信息
// @route   GET /api/operation-logs/stats
// @access  Private
const getOperationStats = asyncHandler(async (req, res) => {
  const { days = 30, module, operatorId } = req.query;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // 构建基础查询条件
    const baseQuery = {
      operatedAt: { $gte: startDate }
    };

    if (module) {
      baseQuery.module = module;
    }

    if (operatorId) {
      baseQuery.operatorId = operatorId;
    }

    // 按操作类型统计
    const operationTypeStats = await OperationLog.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$operationType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 按模块统计
    const moduleStats = await OperationLog.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 按日期统计（最近7天）
    const recentDays = 7;
    const recentStartDate = new Date();
    recentStartDate.setDate(recentStartDate.getDate() - recentDays);

    const dailyStats = await OperationLog.aggregate([
      {
        $match: {
          ...baseQuery,
          operatedAt: { $gte: recentStartDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$operatedAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // 活跃用户统计
    const activeUsers = await OperationLog.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$operatorId',
          operatorName: { $first: '$operatorName' },
          operatorAccount: { $first: '$operatorAccount' },
          count: { $sum: 1 },
          lastOperation: { $max: '$operatedAt' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        operationTypeStats,
        moduleStats,
        dailyStats,
        activeUsers,
        period: {
          days: parseInt(days),
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取操作统计失败: ' + error.message
    });
  }
});

// @desc    获取用户操作历史
// @route   GET /api/operation-logs/user/:userId
// @access  Private
const getUserOperationHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, days = 30 } = req.query;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const query = {
      operatorId: userId,
      operatedAt: { $gte: startDate }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const total = await OperationLog.countDocuments(query);
    const logs = await OperationLog.find(query)
      .sort({ operatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 获取用户统计
    const userStats = await OperationLog.getUserStats(userId, parseInt(days));

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limitNum),
      totalLogs: total,
      hasNext: parseInt(page) < Math.ceil(total / limitNum),
      hasPrev: parseInt(page) > 1
    };

    res.json({
      success: true,
      data: {
        logs,
        stats: userStats,
        pagination
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户操作历史失败: ' + error.message
    });
  }
});

// @desc    删除操作日志（批量）
// @route   DELETE /api/operation-logs
// @access  Private (Admin only)
const deleteOperationLogs = asyncHandler(async (req, res) => {
  const { ids, beforeDate } = req.body;

  try {
    let deleteQuery = {};

    if (ids && Array.isArray(ids) && ids.length > 0) {
      // 按ID删除
      deleteQuery._id = { $in: ids };
    } else if (beforeDate) {
      // 按日期删除
      deleteQuery.operatedAt = { $lt: new Date(beforeDate) };
    } else {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的日志ID或日期'
      });
    }

    const result = await OperationLog.deleteMany(deleteQuery);

    res.json({
      success: true,
      message: `成功删除 ${result.deletedCount} 条操作日志`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除操作日志失败: ' + error.message
    });
  }
});

module.exports = {
  getOperationLogs,
  getOperationLog,
  getOperationStats,
  getUserOperationHistory,
  deleteOperationLogs
};
