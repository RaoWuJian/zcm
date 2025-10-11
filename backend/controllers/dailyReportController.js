const DailyReport = require('../models/DailyReport');
const CampaignCategory = require('../models/CampaignCategory');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');
const mongoose = require('mongoose');

// 获取日报列表
const getDailyReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      groupName,
      submitter,
      reporter,
      productName,
      keyword,
      isMyReports,
      isReportsToMe,
      reportType,
      reportHour,
      countOnly
    } = req.query;

    // 构建查询条件
    let query = {};

    // 获取当前用户ID
    const currentUserId = req.user?._id || req.user?.id;

    // Tab过滤条件
    if (isMyReports === 'true' && currentUserId) {
      // 我创建的日报
      query.submitter = currentUserId;
    } else if (isReportsToMe === 'true' && currentUserId) {
      // 汇报给我的日报
      query.reporters = currentUserId;
    }

    // 报告类型过滤
    if (reportType && ['daily', 'hourly'].includes(reportType)) {
      query.reportType = reportType;
    }

    // 时段过滤（仅当报告类型为hourly时有效）
    if (reportHour && ['14:00', '19:00', '24:00'].includes(reportHour)) {
      query.reportHour = reportHour;
    }
    
    // 日期范围过滤
    if (startDate || endDate) {
      query.reportDate = {};
      if (startDate) query.reportDate.$gte = new Date(startDate);
      if (endDate) query.reportDate.$lte = new Date(endDate);
    }
    
    // 组别过滤
    if (groupName) {
      query.groupName = new RegExp(groupName, 'i');
    }
    
    // 提交人过滤
    if (submitter) {
      query.submitter = submitter;
    }
    
    // 汇报人过滤
    if (reporter) {
      query.reporters = reporter;
    }

    // 产品名称过滤
    if (productName) {
      query['products.productName'] = new RegExp(productName, 'i');
    }

    // 关键字搜索（备注字段）
    if (keyword) {
      query.remark = new RegExp(keyword, 'i');
    }

    // 如果只需要数量，直接返回
    if (countOnly === 'true') {
      const total = await DailyReport.countDocuments(query);
      return res.json({
        success: true,
        total,
        data: []
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 执行查询
    const [reports, total] = await Promise.all([
      DailyReport.find(query)
        .populate('products.campaignMainCategory', 'name')
        .populate('products.campaignSubCategory', 'name')
        .populate('reporters', 'username')
        .populate('submitter', 'username')
        .sort({ reportDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DailyReport.countDocuments(query)
    ]);

    // 转换为普通对象返回
    const reportsData = reports.map(report => report.toObject());

    res.json({
      success: true,
      data: reportsData,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('获取日报列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取日报列表失败'
    });
  }
};

// 获取单个日报详情
const getDailyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?._id || req.user?.id;

    const report = await DailyReport.findById(id)
      .populate('products.campaignMainCategory', 'name')
      .populate('products.campaignSubCategory', 'name')
      .populate('reporters', 'username')
      .populate('submitter', 'username');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: '日报不存在'
      });
    }

    // 准备返回数据
    const reportObj = report.toObject();

    res.json({
      success: true,
      data: reportObj
    });

  } catch (error) {
    console.error('获取日报详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取日报详情失败'
    });
  }
};

// 创建日报
const createDailyReport = async (req, res) => {
  try {
    const {
      reportDate,
      groupName,
      products,
      reporters,
      remark,
      reportType = 'daily',
      reportHour
    } = req.body;

    // 验证报告类型
    if (!['daily', 'hourly'].includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: '报告类型必须是daily或hourly'
      });
    }

    // 验证时段报告必须有reportHour
    if (reportType === 'hourly') {
      if (!reportHour || !['14:00', '19:00', '24:00'].includes(reportHour)) {
        return res.status(400).json({
          success: false,
          message: '时段报告必须指定有效的报告时段（14:00、19:00或24:00）'
        });
      }
    }

    // 验证产品列表
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: '至少需要添加一个产品'
      });
    }

    // 验证每个产品的投放分类
    for (const product of products) {
      const mainCategory = await CampaignCategory.findById(product.campaignMainCategory);
      if (!mainCategory || !mainCategory.isActive) {
        return res.status(400).json({
          success: false,
          message: `产品"${product.productName}"的投放大类不存在或无效`
        });
      }

      // 如果选择了小类，验证小类是否属于该大类
      if (product.campaignSubCategory) {
        const subCategory = mainCategory.subCategories.id(product.campaignSubCategory);
        if (!subCategory || !subCategory.isActive) {
          return res.status(400).json({
            success: false,
            message: `产品"${product.productName}"的投放小类不存在或与大类不匹配`
          });
        }
      }
    }

    // 验证汇报人
    if (!reporters || !Array.isArray(reporters) || reporters.length === 0) {
      return res.status(400).json({
        success: false,
        message: '至少需要选择一个汇报人'
      });
    }

    // 验证汇报人是否存在
    const reporterUsers = await User.find({ _id: { $in: reporters }, isActive: true });
    if (reporterUsers.length !== reporters.length) {
      return res.status(400).json({
        success: false,
        message: '部分汇报人不存在或已禁用'
      });
    }

    // 处理产品数据
    const processedProducts = products.map(product => ({
      productName: product.productName,
      campaignMainCategory: product.campaignMainCategory,
      campaignSubCategory: product.campaignSubCategory || null,
      promotionCost: parseFloat(product.promotionCost),
      totalSalesAmount: parseFloat(product.totalSalesAmount),
      totalSalesQuantity: parseInt(product.totalSalesQuantity),
      roi: parseFloat(product.roi)
    }));

    // 创建日报
    const dailyReport = new DailyReport({
      reportDate: new Date(reportDate),
      groupName,
      reportType,
      reportHour: reportType === 'hourly' ? reportHour : null,
      products: processedProducts,
      reporters,
      submitter: req.user._id,
      remark: remark || '',
      status: 'submitted'
    });

    await dailyReport.save();

    // 初始化所有汇报人的已读状态为false
    await dailyReport.initializeReadStatus();

    // 填充关联数据
    await dailyReport.populate([
      { path: 'products.campaignMainCategory', select: 'name' },
      { path: 'products.campaignSubCategory', select: 'name' },
      { path: 'reporters', select: 'username' },
      { path: 'submitter', select: 'username' }
    ]);

    // 发送通知给汇报人
    const productNames = dailyReport.products.map(p => p.productName).join('、');
    const notificationData = {
      type: 'daily_report_submitted',
      title: '新的日报提交',
      message: `${req.user.username}提交了${productNames}的日报，请查看`,
      data: {
        reportId: dailyReport._id,
        submitterName: req.user.username,
        reportDate: dailyReport.reportDate,
        groupName: dailyReport.groupName,
        productNames: productNames
      },
      recipients: reporters,
      action: {
        type: 'view_daily_report',
        reportId: dailyReport._id
      }
    };

    // 创建持久化通知并通过WebSocket发送
    const Notification = require('../models/Notification');
    const websocketService = require('../services/websocketService');

    try {
      // 创建数据库通知记录
      const dbNotifications = await Notification.createDailyReportNotification({
        recipients: reporters,
        reportId: dailyReport._id,
        submitterName: req.user.username,
        reportDate: dailyReport.reportDate,
        groupName: dailyReport.groupName,
        productName: productNames,
        creator: req.user._id
      });

      // 通过WebSocket发送实时通知（使用数据库记录的ID）
      const notificationResults = { sent: 0, failed: 0, offline: [] };

      for (let i = 0; i < reporters.length; i++) {
        const reporterId = reporters[i];
        const dbNotification = dbNotifications[i];

        const success = await websocketService.sendNotificationToUser(reporterId, {
          id: dbNotification._id.toString(), // 使用数据库记录的ID
          type: 'daily_report',
          category: 'daily_report',
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          isRead: false,
          createdAt: (dbNotification.createdAt || new Date()).toISOString(),
          dbId: dbNotification._id // 传递数据库ID用于更新状态
        });

        if (success) {
          notificationResults.sent++;
        } else {
          notificationResults.failed++;
          notificationResults.offline.push(reporterId);
        }
      }
    } catch (error) {
      console.error('Error creating/sending notifications:', error);
    }

    res.status(201).json({
      success: true,
      message: '日报创建成功',
      data: dailyReport,
      notificationData
    });

  } catch (error) {
    console.error('创建日报失败:', error);
    res.status(500).json({
      success: false,
      message: '创建日报失败'
    });
  }
};

// 更新日报
const updateDailyReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await DailyReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '日报不存在'
      });
    }

    // 检查权限：只有提交人可以编辑
    if (!report.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: '无权编辑此日报'
      });
    }

    const {
      reportDate,
      groupName,
      products,
      reporters,
      remark,
      reportType,
      reportHour
    } = req.body;

    // 验证报告类型
    if (reportType && !['daily', 'hourly'].includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: '报告类型必须是daily或hourly'
      });
    }

    // 验证时段报告必须有reportHour
    if (reportType === 'hourly') {
      if (!reportHour || !['14:00', '19:00', '24:00'].includes(reportHour)) {
        return res.status(400).json({
          success: false,
          message: '时段报告必须指定有效的报告时段（14:00、19:00或24:00）'
        });
      }
    }

    // 验证产品列表
    if (products) {
      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: '至少需要添加一个产品'
        });
      }

      // 验证每个产品的投放分类
      for (const product of products) {
        const mainCategory = await CampaignCategory.findById(product.campaignMainCategory);
        if (!mainCategory || !mainCategory.isActive) {
          return res.status(400).json({
            success: false,
            message: `产品"${product.productName}"的投放大类不存在或无效`
          });
        }

        // 如果选择了小类，验证小类是否属于该大类
        if (product.campaignSubCategory) {
          const subCategory = mainCategory.subCategories.id(product.campaignSubCategory);
          if (!subCategory || !subCategory.isActive) {
            return res.status(400).json({
              success: false,
              message: `产品"${product.productName}"的投放小类不存在或与大类不匹配`
            });
          }
        }
      }
    }

    // 验证汇报人
    if (reporters) {
      if (!Array.isArray(reporters) || reporters.length === 0) {
        return res.status(400).json({
          success: false,
          message: '至少需要选择一个汇报人'
        });
      }

      const reporterUsers = await User.find({ _id: { $in: reporters }, isActive: true });
      if (reporterUsers.length !== reporters.length) {
        return res.status(400).json({
          success: false,
          message: '部分汇报人不存在或已禁用'
        });
      }
    }

    // 更新字段
    const updateData = {};
    if (reportDate) updateData.reportDate = new Date(reportDate);
    if (groupName) updateData.groupName = groupName;
    if (reporters) updateData.reporters = reporters;
    if (remark !== undefined) updateData.remark = remark;
    if (reportType) updateData.reportType = reportType;
    if (reportType === 'hourly' && reportHour) {
      updateData.reportHour = reportHour;
    } else if (reportType === 'daily') {
      updateData.reportHour = null;
    }

    // 处理产品数据
    if (products) {
      updateData.products = products.map(product => ({
        productName: product.productName,
        campaignMainCategory: product.campaignMainCategory,
        campaignSubCategory: product.campaignSubCategory || null,
        promotionCost: parseFloat(product.promotionCost),
        totalSalesAmount: parseFloat(product.totalSalesAmount),
        totalSalesQuantity: parseInt(product.totalSalesQuantity),
        roi: parseFloat(product.roi)
      }));
    }

    const updatedReport = await DailyReport.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'products.campaignMainCategory', select: 'name' },
      { path: 'products.campaignSubCategory', select: 'name' },
      { path: 'reporters', select: 'username' },
      { path: 'submitter', select: 'username' }
    ]);

    res.json({
      success: true,
      message: '日报更新成功',
      data: updatedReport
    });

  } catch (error) {
    console.error('更新日报失败:', error);
    res.status(500).json({
      success: false,
      message: '更新日报失败'
    });
  }
};

// 删除日报
const deleteDailyReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await DailyReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '日报不存在'
      });
    }

    // 检查权限：只有提交人或管理员可以删除
    if (report.submitter.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '无权删除此日报'
      });
    }

    await DailyReport.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '日报删除成功'
    });

  } catch (error) {
    console.error('删除日报失败:', error);
    res.status(500).json({
      success: false,
      message: '删除日报失败'
    });
  }
};

// @desc    获取产品名称建议
// @route   GET /api/daily-reports/suggestions/product-names
// @access  Private
const getProductNameSuggestions = async (req, res) => {
  try {
    const user = req.user;

    // 构建查询条件（根据用户权限过滤）
    let query = {};
    if (!user.isAdmin) {
      // 使用新的部门权限管理器获取用户可访问的部门ID列表
      const DepartmentPermissionManager = require('../utils/departmentPermission');
      const allowedDepartmentIds = await DepartmentPermissionManager.getAccessibleDepartmentIds(user);

      if (allowedDepartmentIds && allowedDepartmentIds.length > 0) {
        // 获取这些部门的用户
        const User = require('../models/User');
        const allowedUsers = await User.find({
          departmentIds: { $in: allowedDepartmentIds }
        }).select('_id');

        const allowedUserIds = allowedUsers.map(u => u._id);
        allowedUserIds.push(user._id); // 包括当前用户

        // 限制只查看有权限的用户创建的日报记录
        query.submitter = { $in: allowedUserIds };
      } else {
        // 没有部门权限的用户只能查看自己创建的记录
        query.submitter = user._id;
      }
    }

    // 获取所有非空的产品名称
    query.productName = { $ne: null, $ne: '' };

    const productNames = await DailyReport.distinct('productName', query);

    res.status(200).json({
      success: true,
      data: productNames.filter(name => name && name.trim()).sort()
    });
  } catch (error) {
    console.error('获取产品名称建议失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品名称建议失败'
    });
  }
};

// 获取用户未读通知
const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const Notification = require('../models/Notification');

    const unreadNotifications = await Notification.find({
      recipient: userId,
      isRead: false
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

    res.json({
      success: true,
      data: unreadNotifications.map(notification => ({
        id: notification._id.toString(),
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      }))
    });

  } catch (error) {
    console.error('获取未读通知失败:', error);
    res.status(500).json({
      success: false,
      message: '获取未读通知失败'
    });
  }
};

// 标记日报为已读
const markDailyReportAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const report = await DailyReport.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '日报不存在'
      });
    }

    // 检查用户是否是汇报人
    const isReporter = report.reporters.some(reporterId =>
      reporterId.toString() === userId.toString()
    );

    if (!isReporter) {
      return res.status(403).json({
        success: false,
        message: '您不是此日报的汇报人，无法标记为已读'
      });
    }

    // 标记为已读
    await report.markAsRead(userId);

    res.json({
      success: true,
      message: '已标记为已读',
      data: {
        reportId: id,
        userId: userId,
        readAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error marking daily report as read:', error);
    res.status(500).json({
      success: false,
      message: '标记已读失败'
    });
  }
};

// 获取日报的已读状态
const getDailyReportReadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    const report = await DailyReport.findById(id)
      .populate('readStatus.user', 'username')
      .populate('reporters', 'username');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: '日报不存在'
      });
    }

    // 检查权限：只有创建者和汇报人可以查看已读状态
    const isCreator = report.submitter.toString() === userId.toString();
    const isReporter = report.reporters.some(reporterId =>
      reporterId.toString() === userId.toString()
    );

    if (!isCreator && !isReporter) {
      return res.status(403).json({
        success: false,
        message: '无权查看此日报的已读状态'
      });
    }

    // 获取已读状态统计
    const readStats = {
      totalReporters: report.reporters.length,
      readCount: report.readStatus ? report.readStatus.filter(rs => rs.isRead).length : 0,
      unreadCount: report.reporters.length - (report.readStatus ? report.readStatus.filter(rs => rs.isRead).length : 0)
    };

    const detailedStatus = isCreator ? report.readStatus : null;

    res.json({
      success: true,
      data: {
        reportId: id,
        readStats,
        detailedStatus,
        currentUserRead: report.isReadByUser(userId)
      }
    });
  } catch (error) {
    console.error('Error getting daily report read status:', error);
    res.status(500).json({
      success: false,
      message: '获取已读状态失败'
    });
  }
};

// 获取日报统计数据
const getDailyReportStatistics = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      startDate,
      endDate,
      groupBy = 'group', // group, reporter, category, time
      timeUnit = 'day', // day, week, month
      groupName,
      reporters,
      categoryId,
      productName,
      reportType,
      reportHour,
      page = 1,
      limit = 20
    } = req.query;

    // 构建查询条件
    const matchConditions = {
      reporters: userId // 只查询汇报给当前用户的日报
    };

    // 报告类型过滤
    if (reportType && ['daily', 'hourly'].includes(reportType)) {
      matchConditions.reportType = reportType;
    }

    // 时段过滤
    if (reportHour && ['14:00', '19:00', '24:00'].includes(reportHour)) {
      matchConditions.reportHour = reportHour;
    }

    // 时间范围筛选
    if (startDate || endDate) {
      matchConditions.reportDate = {};
      if (startDate) {
        matchConditions.reportDate.$gte = new Date(startDate);
      }
      if (endDate) {
        matchConditions.reportDate.$lte = new Date(endDate);
      }
    }

    // 其他筛选条件
    if (groupName) {
      matchConditions.groupName = new RegExp(groupName, 'i');
    }
    if (categoryId) {
      matchConditions['products.campaignMainCategory'] = new mongoose.Types.ObjectId(categoryId);
    }
    if (productName) {
      matchConditions['products.productName'] = new RegExp(productName, 'i');
    }

    let pipeline = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'submitter',
          foreignField: '_id',
          as: 'submitterInfo'
        }
      },
      {
        $lookup: {
          from: 'campaigncategories',
          localField: 'campaignMainCategory',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: { path: '$submitterInfo', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } }
    ];

    // 根据groupBy参数构建不同的聚合管道
    switch (groupBy) {
      case 'group':
        pipeline.push({
          $group: {
            _id: '$groupName',
            count: { $sum: 1 },
            totalPromotionCost: { $sum: '$promotionCost' },
            totalConversions: { $sum: '$conversions' },
            avgPromotionCost: { $avg: '$promotionCost' },
            avgConversions: { $avg: '$conversions' },
            reporters: { $addToSet: '$submitterInfo.username' }
          }
        });
        break;

      case 'reporter':
        pipeline.push({
          $group: {
            _id: {
              reporterId: '$submitter',
              reporterName: '$submitterInfo.username'
            },
            count: { $sum: 1 },
            totalPromotionCost: { $sum: '$promotionCost' },
            totalConversions: { $sum: '$conversions' },
            avgPromotionCost: { $avg: '$promotionCost' },
            avgConversions: { $avg: '$conversions' },
            groups: { $addToSet: '$groupName' }
          }
        });
        break;

      case 'category':
        pipeline.push({
          $group: {
            _id: {
              categoryId: '$campaignMainCategory',
              categoryName: '$categoryInfo.name'
            },
            count: { $sum: 1 },
            totalPromotionCost: { $sum: '$promotionCost' },
            totalConversions: { $sum: '$conversions' },
            avgPromotionCost: { $avg: '$promotionCost' },
            avgConversions: { $avg: '$conversions' },
            reporters: { $addToSet: '$submitterInfo.username' }
          }
        });
        break;

      case 'time':
        let dateFormat;
        switch (timeUnit) {
          case 'week':
            dateFormat = { $dateToString: { format: "%Y-W%U", date: "$reportDate" } };
            break;
          case 'month':
            dateFormat = { $dateToString: { format: "%Y-%m", date: "$reportDate" } };
            break;
          default: // day
            dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$reportDate" } };
        }

        pipeline.push({
          $group: {
            _id: dateFormat,
            count: { $sum: 1 },
            totalPromotionCost: { $sum: '$promotionCost' },
            totalConversions: { $sum: '$conversions' },
            avgPromotionCost: { $avg: '$promotionCost' },
            avgConversions: { $avg: '$conversions' },
            reporters: { $addToSet: '$submitterInfo.username' }
          }
        });
        break;
    }

    pipeline.push({ $sort: { count: -1 } });

    // 获取总数（用于分页）
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await DailyReport.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;

    // 添加分页
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limitNum });

    const statistics = await DailyReport.aggregate(pipeline);

    // 获取总体统计
    const totalStats = await DailyReport.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          totalPromotionCost: { $sum: '$promotionCost' },
          totalConversions: { $sum: '$conversions' },
          uniqueReporters: { $addToSet: '$submitter' },
          uniqueGroups: { $addToSet: '$groupName' }
        }
      }
    ]);

    // 获取按报告类型的统计
    const reportTypeStats = await DailyReport.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = totalStats[0] || {
      totalReports: 0,
      totalPromotionCost: 0,
      totalConversions: 0,
      uniqueReporters: [],
      uniqueGroups: []
    };

    // 添加报告类型统计
    const dailyReportsCount = reportTypeStats.find(s => s._id === 'daily')?.count || 0;
    const hourlyReportsCount = reportTypeStats.find(s => s._id === 'hourly')?.count || 0;

    res.json({
      success: true,
      data: {
        statistics,
        summary: {
          ...summary,
          uniqueReportersCount: summary.uniqueReporters.length,
          uniqueGroupsCount: summary.uniqueGroups.length,
          dailyReportsCount,
          hourlyReportsCount
        },
        total: totalCount,
        page: pageNum,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('获取日报统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计数据失败'
    });
  }
};

// 导出日报详细数据
const exportDailyReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      groupName,
      submitterId,
      reporter,
      reportType,
      reportHour,
      productName,
      mainCategory,
      keyword,
      isMyReports,
      isReportsToMe,
      format = 'excel'
    } = req.query;

    // 获取当前用户ID
    const currentUserId = req.user?._id || req.user?.id;

    // 构建查询条件（与列表查询保持一致）
    let query = {};

    // Tab过滤条件
    if (isMyReports === 'true' && currentUserId) {
      query.submitter = currentUserId;
    } else if (isReportsToMe === 'true' && currentUserId) {
      query.reporters = currentUserId;
    }

    // 报告类型过滤
    if (reportType && ['daily', 'hourly'].includes(reportType)) {
      query.reportType = reportType;
    }

    // 时段过滤
    if (reportHour && ['14:00', '19:00', '24:00'].includes(reportHour)) {
      query.reportHour = reportHour;
    }

    // 日期范围过滤
    if (startDate || endDate) {
      query.reportDate = {};
      if (startDate) {
        query.reportDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.reportDate.$lte = new Date(endDate);
      }
    }

    // 组别过滤
    if (groupName) {
      query.groupName = new RegExp(groupName, 'i');
    }

    // 提交人过滤
    if (submitterId) {
      try {
        query.submitter = new mongoose.Types.ObjectId(submitterId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '无效的提交人ID'
        });
      }
    }

    // 汇报对象过滤
    if (reporter) {
      try {
        query.reporters = new mongoose.Types.ObjectId(reporter);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '无效的汇报对象ID'
        });
      }
    }

    // 产品名称过滤
    if (productName) {
      query['products.productName'] = new RegExp(productName, 'i');
    }

    // 投放大类过滤
    if (mainCategory) {
      try {
        query['products.campaignMainCategory'] = new mongoose.Types.ObjectId(mainCategory);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: '无效的投放类别ID'
        });
      }
    }

    // 关键字搜索
    if (keyword) {
      query.remark = new RegExp(keyword, 'i');
    }
    // 查询报告数据
    const reports = await DailyReport.find(query)
      .populate('submitter', 'username')
      .populate('reporters', 'username')
      .populate('products.campaignMainCategory', 'name')
      .populate('products.campaignSubCategory', 'name')
      .sort({ reportDate: -1, createdAt: -1 });

    // 格式化导出数据 - 每个产品一行
    const exportData = [];
    reports.forEach(report => {
      // 安全处理日期
      let reportDateStr = '-';
      if (report.reportDate) {
        try {
          reportDateStr = new Date(report.reportDate).toLocaleDateString('zh-CN');
        } catch (error) {
          console.error('日期格式化失败:', error);
          reportDateStr = String(report.reportDate);
        }
      }

      const baseInfo = {
        '汇报日期': reportDateStr,
        '报告类型': report.reportType === 'daily' ? '日报' : '时段报告',
        '时段': report.reportType === 'hourly' ? (report.reportHour || '-') : '-',
        '提交人': report.submitter?.username || '未知',
        '汇报对象': report.reporters?.map(r => r.username).join(', ') || '未知',
        '组别': report.groupName || '-'
      };

      // 如果有产品数据，每个产品一行
      if (report.products && report.products.length > 0) {
        report.products.forEach(product => {
          // 安全处理创建时间
          let createdAtStr = '-';
          if (report.createdAt) {
            try {
              createdAtStr = new Date(report.createdAt).toLocaleString('zh-CN');
            } catch (error) {
              console.error('创建时间格式化失败:', error);
              createdAtStr = String(report.createdAt);
            }
          }

          exportData.push({
            ...baseInfo,
            '产品名称': product.productName || '-',
            '投放大类': product.campaignMainCategory?.name || '未分类',
            '投放子类': product.campaignSubCategory?.name || '无',
            '推广费用': product.promotionCost || 0,
            '总销售额': product.totalSalesAmount || 0,
            '总销售数': product.totalSalesQuantity || 0,
            'ROI': product.roi || 0,
            '备注': report.remark || '',
            '创建时间': createdAtStr
          });
        });
      } else {
        // 如果没有产品数据，也要导出基本信息
        let createdAtStr = '-';
        if (report.createdAt) {
          try {
            createdAtStr = new Date(report.createdAt).toLocaleString('zh-CN');
          } catch (error) {
            console.error('创建时间格式化失败:', error);
            createdAtStr = String(report.createdAt);
          }
        }

        exportData.push({
          ...baseInfo,
          '产品名称': '-',
          '投放大类': '-',
          '投放子类': '-',
          '推广费用': 0,
          '总销售额': 0,
          '总销售数': 0,
          'ROI': 0,
          '备注': report.remark || '',
          '创建时间': createdAtStr
        });
      }
    });

    res.json({
      success: true,
      data: exportData,
      filename: `日报详细数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`
    });

  } catch (error) {
    console.error('导出日报数据失败:', error);
    res.status(500).json({
      success: false,
      message: '导出数据失败'
    });
  }
};

module.exports = {
  getDailyReports,
  getDailyReport,
  createDailyReport,
  updateDailyReport,
  deleteDailyReport,
  getProductNameSuggestions,
  getUnreadNotifications,
  markDailyReportAsRead,
  getDailyReportReadStatus,
  getDailyReportStatistics,
  exportDailyReports
};
