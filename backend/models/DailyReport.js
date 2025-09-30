const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  // 基本信息
  reportDate: {
    type: Date,
    required: [true, '日期不能为空'],
    index: true
  },
  groupName: {
    type: String,
    required: [true, '组别不能为空'],
    trim: true,
    maxlength: [100, '组别名称最多100个字符']
  },

  // 产品名称
  productName: {
    type: String,
    required: [true, '产品名称不能为空'],
    trim: true,
    maxlength: [200, '产品名称最多200个字符'],
    index: true
  },

  // 投放分类
  campaignMainCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampaignCategory',
    required: [true, '投放大类不能为空']
  },
  campaignSubCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CampaignCategory',
    required: function() {
      // 如果有子类可选，则必须选择
      return this.campaignMainCategory && this.campaignSubCategory !== null;
    }
  },
  
  // 推广数据
  promotionCost: {
    type: Number,
    required: [true, '推广费不能为空'],
    min: [0, '推广费不能为负数'],
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v >= 0;
      },
      message: '推广费必须是有效的正数'
    }
  },
  totalSalesAmount: {
    type: Number,
    required: [true, '总销售额不能为空'],
    min: [0, '总销售额不能为负数'],
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v >= 0;
      },
      message: '总销售额必须是有效的正数'
    }
  },
  totalSalesQuantity: {
    type: Number,
    required: [true, '总销售数不能为空'],
    min: [0, '总销售数不能为负数'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 0;
      },
      message: '总销售数必须是非负整数'
    }
  },
  roi: {
    type: Number,
    required: [true, '投放ROI不能为空'],
    min: [0, 'ROI不能为负数'],
    validate: {
      validator: function(v) {
        return Number.isFinite(v) && v >= 0;
      },
      message: 'ROI必须是有效的正数'
    }
  },
  
  // 汇报人（多选）
  reporters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],


  
  // 提交人
  submitter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 状态
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed'],
    default: 'submitted'
  },
  
  // 备注
  remark: {
    type: String,
    trim: true,
    maxlength: [500, '备注最多500个字符'],
    default: ''
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  // 已读状态管理 - 记录每个汇报人的已读状态
  readStatus: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
dailyReportSchema.index({ reportDate: -1, createdAt: -1 });
dailyReportSchema.index({ submitter: 1, reportDate: -1 });
dailyReportSchema.index({ reporters: 1, reportDate: -1 });
dailyReportSchema.index({ groupName: 1, reportDate: -1 });

// 虚拟字段：计算平均订单价值
dailyReportSchema.virtual('avgOrderValue').get(function() {
  if (this.totalSalesQuantity > 0) {
    return (this.totalSalesAmount / this.totalSalesQuantity).toFixed(2);
  }
  return 0;
});

// 虚拟字段：计算单位获客成本
dailyReportSchema.virtual('costPerAcquisition').get(function() {
  if (this.totalSalesQuantity > 0) {
    return (this.promotionCost / this.totalSalesQuantity).toFixed(2);
  }
  return 0;
});

// 中间件：更新时间
dailyReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 中间件：验证汇报人不能为空
dailyReportSchema.pre('save', function(next) {
  if (!this.reporters || this.reporters.length === 0) {
    const error = new Error('至少需要选择一个汇报人');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// 中间件：初始化阅读状态
dailyReportSchema.pre('save', function(next) {
  // 如果是新文档且有汇报人，初始化阅读状态
  if (this.isNew && this.reporters && this.reporters.length > 0) {
    this.readStatus = this.reporters.map(reporterId => ({
      user: reporterId,
      isRead: false,
      readAt: null
    }));
  }

  // 如果汇报人列表发生变化，更新阅读状态
  if (this.isModified('reporters') && !this.isNew) {
    const currentReporters = this.reporters.map(id => id.toString());
    const existingStatuses = this.readStatus || [];

    // 移除不再是汇报人的用户状态
    this.readStatus = existingStatuses.filter(status =>
      currentReporters.includes(status.user.toString())
    );

    // 为新增的汇报人添加未读状态
    currentReporters.forEach(reporterId => {
      const hasStatus = this.readStatus.some(status =>
        status.user.toString() === reporterId
      );
      if (!hasStatus) {
        this.readStatus.push({
          user: reporterId,
          isRead: false,
          readAt: null
        });
      }
    });
  }

  next();
});

// 静态方法：获取日期范围内的报告
dailyReportSchema.statics.getReportsByDateRange = function(startDate, endDate, options = {}) {
  const query = {
    reportDate: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (options.submitter) {
    query.submitter = options.submitter;
  }
  
  if (options.groupName) {
    query.groupName = new RegExp(options.groupName, 'i');
  }
  
  return this.find(query)
    .populate('campaignMainCategory', 'name')
    .populate('campaignSubCategory', 'name')
    .populate('reporters', 'username')
    .populate('submitter', 'username')
    .sort({ reportDate: -1, createdAt: -1 });
};



// 实例方法：检查是否可以编辑
dailyReportSchema.methods.canEdit = function(userId) {
  return this.submitter.toString() === userId.toString() && this.status === 'submitted';
};

// 实例方法：标记用户已读
dailyReportSchema.methods.markAsRead = function(userId) {
  const userIdStr = userId.toString();
  const existingStatus = this.readStatus.find(status =>
    status.user.toString() === userIdStr
  );

  if (existingStatus) {
    existingStatus.isRead = true;
    existingStatus.readAt = new Date();
  } else {
    this.readStatus.push({
      user: userId,
      isRead: true,
      readAt: new Date()
    });
  }

  return this.save();
};

// 实例方法：检查用户是否已读
dailyReportSchema.methods.isReadByUser = function(userId) {
  const userIdStr = userId.toString();
  const status = this.readStatus.find(status =>
    status.user.toString() === userIdStr
  );
  return status ? status.isRead : false;
};

// 实例方法：获取已读统计
dailyReportSchema.methods.getReadStats = function() {
  const totalReporters = this.reporters.length;
  const readCount = this.readStatus.filter(status => status.isRead).length;
  return {
    totalReporters,
    readCount,
    unreadCount: totalReporters - readCount,
    readPercentage: totalReporters > 0 ? Math.round((readCount / totalReporters) * 100) : 0
  };
};

// 实例方法：获取详细的已读状态
dailyReportSchema.methods.getDetailedReadStatus = function() {
  return this.reporters.map(reporterId => {
    const reporterIdStr = reporterId.toString();
    const status = this.readStatus.find(status =>
      status.user.toString() === reporterIdStr
    );

    return {
      user: reporterId,
      isRead: status ? status.isRead : false,
      readAt: status ? status.readAt : null
    };
  });
};

// 实例方法：初始化所有汇报人的已读状态
dailyReportSchema.methods.initializeReadStatus = function() {
  this.readStatus = this.reporters.map(reporterId => ({
    user: reporterId,
    isRead: false,
    readAt: null
  }));
  return this.save();
};

// 实例方法：发送通知给汇报人
dailyReportSchema.methods.sendNotificationToReporters = function() {
  // 这个方法将在控制器中调用通知系统
  return {
    type: 'daily_report',
    reportId: this._id,
    submitterName: this.submitter.username,
    reportDate: this.reportDate,
    groupName: this.groupName,
    reporters: this.reporters
  };
};

module.exports = mongoose.model('DailyReport', dailyReportSchema);









