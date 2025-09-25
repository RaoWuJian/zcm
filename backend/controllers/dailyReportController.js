const DailyReport = require('../models/DailyReport');
const { asyncHandler } = require('../middleware/error');

// 获取日数据报表列表
exports.getDailyReports = asyncHandler(async (req, res) => {
  const {
    page = 1,
    size = 20,
    date,
    startDate,
    endDate,
    group,
    product,
    approvalStatus,
    onlyUnread = false,
    sortBy = 'date',
    sortOrder = 'desc',
    tab = 'all' // 新增选项卡参数：all, created, reported, copied
  } = req.query;

  // 构建查询条件
  const filter = {};
  const userId = req.user._id;

  // 根据选项卡类型筛选
  switch (tab) {
    case 'created':
      // 我创建的
      filter.createdBy = userId;
      break;
    case 'reported':
      // 汇报给我的
      filter.reporter = userId;
      break;
    case 'copied':
      // 抄送给我的
      filter.ccUsers = userId;
      break;
    default:
      // 全部：自己创建的、汇报给自己的、抄送给自己的
      filter.$or = [
        { createdBy: userId },
        { reporter: userId },
        { ccUsers: userId }
      ];
  }

  // 日期筛选
  if (date) {
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    filter.date = { $gte: targetDate, $lt: nextDay };
  } else if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      filter.date.$lt = endDateTime;
    }
  }

  // 其他筛选条件
  if (group) filter.group = new RegExp(group, 'i');
  if (product) filter.product = new RegExp(product, 'i');
  if (approvalStatus) filter.approvalStatus = approvalStatus;
  if (onlyUnread === 'true') filter['readStatus.user'] = { $ne: userId };

  // 排序和分页
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  const skip = (parseInt(page) - 1) * parseInt(size);
  const limit = parseInt(size);

  // 查询数据
  const [reports, total] = await Promise.all([
    DailyReport.find(filter)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .populate('reporter', 'username')
      .populate('ccUsers', 'username')
      .populate('approvedBy', 'username')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    DailyReport.countDocuments(filter)
  ]);

  // 添加权限和状态信息
  const reportsWithStatus = reports.map(report => {
    const reportObj = report.toObject();
    reportObj.isRead = report.readStatus.some(status => 
      status.user.toString() === userId.toString()
    );
    reportObj.canEdit = (report.approvalStatus !== 'approved') && 
      (report.createdBy.toString() === userId.toString() || 
       report.reporter.toString() === userId.toString());
    reportObj.canDelete = report.reporter.toString() === userId.toString() ||
      (report.approvalStatus === 'pending' && report.createdBy.toString() === userId.toString());
    reportObj.canApprove = report.reporter.toString() === userId.toString() && 
      report.approvalStatus === 'pending';
    return reportObj;
  });

  res.json({
    success: true,
    data: {
      reports: reportsWithStatus,
      pagination: {
        page: parseInt(page),
        size: parseInt(size),
        total,
        pages: Math.ceil(total / parseInt(size))
      }
    }
  });
});

// 获取单个日数据报表
exports.getDailyReport = asyncHandler(async (req, res) => {
  const report = await DailyReport.findById(req.params.id)
    .populate('createdBy', 'username')
    .populate('updatedBy', 'username')
    .populate('reporter', 'username')
    .populate('ccUsers', 'username')
    .populate('approvedBy', 'username');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: '日数据报表不存在'
    });
  }

  res.json({
    success: true,
    data: report
  });
});

// 创建日数据报表
exports.createDailyReport = asyncHandler(async (req, res) => {
  const {
    date,
    group,
    product,
    promotionCost,
    totalSalesAmount,
    totalSalesCount,
    reporter,
    ccUsers = [],
    remark
  } = req.body;

  const report = new DailyReport({
    date: new Date(date),
    group,
    product,
    promotionCost,
    totalSalesAmount,
    totalSalesCount,
    reporter: reporter || req.user._id,
    ccUsers: ccUsers || [],
    remark,
    createdBy: req.user._id
  });

  await report.save();

  const populatedReport = await DailyReport.findById(report._id)
    .populate('createdBy', 'username')
    .populate('reporter', 'username')
    .populate('ccUsers', 'username');

  res.status(201).json({
    success: true,
    message: '日数据报表创建成功',
    data: populatedReport
  });
});

// 更新日数据报表
exports.updateDailyReport = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const report = await DailyReport.findById(req.params.id);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: '日数据报表不存在'
    });
  }

  // 检查编辑权限
  const canEdit = (report.approvalStatus !== 'approved') && 
    (report.createdBy.toString() === userId.toString() || 
     report.reporter.toString() === userId.toString());

  if (!canEdit) {
    return res.status(403).json({
      success: false,
      message: '无权限编辑此报表'
    });
  }

  const {
    date,
    group,
    product,
    promotionCost,
    totalSalesAmount,
    totalSalesCount,
    remark
  } = req.body;

  // 更新字段
  if (date !== undefined) report.date = new Date(date);
  if (group !== undefined) report.group = group;
  if (product !== undefined) report.product = product;
  if (promotionCost !== undefined) report.promotionCost = promotionCost;
  if (totalSalesAmount !== undefined) report.totalSalesAmount = totalSalesAmount;
  if (totalSalesCount !== undefined) report.totalSalesCount = totalSalesCount;
  if (remark !== undefined) report.remark = remark;
  
  report.updatedBy = userId;
  await report.save();

  const populatedReport = await DailyReport.findById(report._id)
    .populate('createdBy', 'username')
    .populate('updatedBy', 'username')
    .populate('reporter', 'username')
    .populate('ccUsers', 'username');

  res.json({
    success: true,
    message: '日数据报表更新成功',
    data: populatedReport
  });
});

// 删除日数据报表
exports.deleteDailyReport = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const report = await DailyReport.findById(req.params.id);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: '日数据报表不存在'
    });
  }

  // 检查删除权限
  const canDelete = report.reporter.toString() === userId.toString() ||
    (report.approvalStatus === 'pending' && report.createdBy.toString() === userId.toString());

  if (!canDelete) {
    return res.status(403).json({
      success: false,
      message: '无权限删除此报表'
    });
  }

  await DailyReport.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: '日数据报表删除成功'
  });
});

// 批量删除日数据报表
exports.batchDeleteDailyReports = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供要删除的记录ID列表'
    });
  }

  const result = await DailyReport.deleteMany({
    _id: { $in: ids }
  });

  res.json({
    success: true,
    message: `成功删除 ${result.deletedCount} 条记录`
  });
});

// 标记为已读
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const report = await DailyReport.findById(id);
  if (!report) {
    return res.status(404).json({
      success: false,
      message: '日数据报表不存在'
    });
  }

  // 检查用户是否有权限查看
  const canView = report.createdBy.toString() === userId.toString() ||
                 report.reporter.toString() === userId.toString() ||
                 report.ccUsers.some(ccUser => ccUser.toString() === userId.toString());

  if (!canView) {
    return res.status(403).json({
      success: false,
      message: '无权限查看此报表'
    });
  }

  // 检查是否已经标记为已读
  const existingRead = report.readStatus.find(status => 
    status.user.toString() === userId.toString()
  );
  
  if (!existingRead) {
    report.readStatus.push({
      user: userId,
      readAt: new Date()
    });
    await report.save();
  }

  res.json({
    success: true,
    message: '已标记为已读'
  });
});

// 审批日数据报表
exports.approveDailyReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, comment = '' } = req.body;
  const userId = req.user._id;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: '审批状态无效'
    });
  }

  const report = await DailyReport.findById(id);
  if (!report) {
    return res.status(404).json({
      success: false,
      message: '日数据报表不存在'
    });
  }

  // 检查是否有审批权限
  if (report.reporter.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: '只有汇报人可以审批'
    });
  }

  if (report.approvalStatus !== 'pending') {
    return res.status(400).json({
      success: false,
      message: '该报表已经审批过了'
    });
  }

  // 更新审批状态
  report.approvalStatus = status;
  report.approvedBy = userId;
  report.approvedAt = new Date();
  report.approvalComment = comment;

  await report.save();

  const populatedReport = await DailyReport.findById(report._id)
    .populate('createdBy', 'username')
    .populate('reporter', 'username')
    .populate('ccUsers', 'username')
    .populate('approvedBy', 'username');

  res.json({
    success: true,
    message: `报表${status === 'approved' ? '审批通过' : '审批拒绝'}`,
    data: populatedReport
  });
});

// 获取统计数据
exports.getStatistics = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    group,
    product
  } = req.query;

  // 构建筛选条件
  const filter = {};

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      filter.date.$lt = endDateTime;
    }
  }

  if (group) filter.group = new RegExp(group, 'i');
  if (product) filter.product = new RegExp(product, 'i');

  // 获取统计数据
  const [overallStats, groupStats, dateStats] = await Promise.all([
    DailyReport.getStatistics(filter),
    DailyReport.getGroupStatistics(filter),
    DailyReport.getDateStatistics(filter)
  ]);

  res.json({
    success: true,
    data: {
      overall: overallStats,
      byGroup: groupStats,
      byDate: dateStats
    }
  });
});
