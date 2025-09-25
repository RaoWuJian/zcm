const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  // 日期
  date: {
    type: Date,
    required: [true, '日期不能为空'],
    index: true
  },

  // 组别
  group: {
    type: String,
    required: [true, '组别不能为空'],
    trim: true,
    maxlength: [50, '组别名称最多50个字符'],
    index: true
  },



  // 投放产品
  product: {
    type: String,
    required: [true, '投放产品不能为空'],
    trim: true,
    maxlength: [100, '产品名称最多100个字符'],
    index: true
  },

  // 推广费
  promotionCost: {
    type: Number,
    required: [true, '推广费不能为空'],
    min: [0, '推广费不能为负数'],
    default: 0
  },

  // 总销售额
  totalSalesAmount: {
    type: Number,
    required: [true, '总销售额不能为空'],
    min: [0, '总销售额不能为负数'],
    default: 0
  },

  // 总销售数
  totalSalesCount: {
    type: Number,
    required: [true, '总销售数不能为空'],
    min: [0, '总销售数不能为负数'],
    default: 0
  },

  // 投放ROI (自动计算)
  roi: {
    type: Number,
    default: 0,
    min: [0, 'ROI不能为负数']
  },

  // 创建者信息（数据录入人）
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 更新者信息
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 汇报人（可以审批和删除）
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '汇报人不能为空']
  },

  // 抄送人列表（只能查看）
  ccUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // 审批状态
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // 审批人
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 审批时间
  approvedAt: {
    type: Date
  },

  // 审批意见
  approvalComment: {
    type: String,
    trim: true,
    maxlength: [500, '审批意见最多500个字符'],
    default: ''
  },

  // 已读状态记录
  readStatus: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],

  // 备注
  remark: {
    type: String,
    trim: true,
    maxlength: [500, '备注最多500个字符'],
    default: ''
  }
}, {
  timestamps: true,
  versionKey: false
});

// 计算ROI的中间件
dailyReportSchema.pre('save', function(next) {
  // ROI = (总销售额 - 推广费) / 推广费 * 100
  if (this.promotionCost > 0) {
    this.roi = ((this.totalSalesAmount - this.promotionCost) / this.promotionCost * 100);
    // 保留两位小数
    this.roi = Math.round(this.roi * 100) / 100;
  } else {
    this.roi = 0;
  }
  next();
});

// 实例方法：标记为已读
dailyReportSchema.methods.markAsRead = function(userId) {
  // 检查用户是否已经标记为已读
  const existingRead = this.readStatus.find(status =>
    status.user.toString() === userId.toString()
  );

  if (!existingRead) {
    this.readStatus.push({
      user: userId,
      readAt: new Date()
    });
  }

  return this.save();
};

// 实例方法：检查用户是否已读
dailyReportSchema.methods.isReadBy = function(userId) {
  return this.readStatus.some(status =>
    status.user.toString() === userId.toString()
  );
};

// 实例方法：检查用户是否可以删除
dailyReportSchema.methods.canDeleteBy = function(userId) {
  // 汇报人可以删除
  if (this.reporter.toString() === userId.toString()) {
    return true;
  }

  // 如果未审批，创建者也可以删除
  if (this.approvalStatus === 'pending' && this.createdBy.toString() === userId.toString()) {
    return true;
  }

  return false;
};

// 实例方法：检查用户是否可以审批
dailyReportSchema.methods.canApproveBy = function(userId) {
  // 只有汇报人可以审批，且状态为待审批
  return this.reporter.toString() === userId.toString() && this.approvalStatus === 'pending';
};

// 实例方法：检查用户是否可以编辑
dailyReportSchema.methods.canEditBy = function(userId) {
  // 已审批的记录不能编辑
  if (this.approvalStatus === 'approved') {
    return false;
  }

  // 创建者和汇报人可以编辑
  return this.createdBy.toString() === userId.toString() ||
         this.reporter.toString() === userId.toString();
};

// 复合索引，提高查询性能
dailyReportSchema.index({ date: -1, group: 1 });
dailyReportSchema.index({ date: -1, name: 1 });
dailyReportSchema.index({ date: -1, product: 1 });
dailyReportSchema.index({ createdBy: 1, date: -1 });
dailyReportSchema.index({ reporter: 1, date: -1 });
dailyReportSchema.index({ ccUsers: 1, date: -1 });
dailyReportSchema.index({ approvalStatus: 1, date: -1 });

// 静态方法：获取统计数据
dailyReportSchema.statics.getStatistics = async function(filter = {}) {
  const pipeline = [
    { $match: filter },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalPromotionCost: { $sum: '$promotionCost' },
        totalSalesAmount: { $sum: '$totalSalesAmount' },
        totalSalesCount: { $sum: '$totalSalesCount' },
        avgROI: { $avg: '$roi' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalRecords: 0,
    totalPromotionCost: 0,
    totalSalesAmount: 0,
    totalSalesCount: 0,
    avgROI: 0
  };
};

// 静态方法：按组别统计
dailyReportSchema.statics.getGroupStatistics = async function(filter = {}) {
  const pipeline = [
    { $match: filter },
    {
      $group: {
        _id: '$group',
        totalRecords: { $sum: 1 },
        totalPromotionCost: { $sum: '$promotionCost' },
        totalSalesAmount: { $sum: '$totalSalesAmount' },
        totalSalesCount: { $sum: '$totalSalesCount' },
        avgROI: { $avg: '$roi' }
      }
    },
    { $sort: { totalSalesAmount: -1 } }
  ];

  return await this.aggregate(pipeline);
};

// 静态方法：按日期统计
dailyReportSchema.statics.getDateStatistics = async function(filter = {}) {
  const pipeline = [
    { $match: filter },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        },
        totalRecords: { $sum: 1 },
        totalPromotionCost: { $sum: '$promotionCost' },
        totalSalesAmount: { $sum: '$totalSalesAmount' },
        totalSalesCount: { $sum: '$totalSalesCount' },
        avgROI: { $avg: '$roi' }
      }
    },
    { $sort: { _id: -1 } }
  ];

  return await this.aggregate(pipeline);
};

// 静态方法：获取总体统计
dailyReportSchema.statics.getStatistics = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        totalPromotionCost: { $sum: '$promotionCost' },
        totalSalesAmount: { $sum: '$totalSalesAmount' },
        totalSalesCount: { $sum: '$totalSalesCount' },
        averageROI: { $avg: '$roi' }
      }
    }
  ]).then(results => results[0] || {
    totalReports: 0,
    totalPromotionCost: 0,
    totalSalesAmount: 0,
    totalSalesCount: 0,
    averageROI: 0
  });
};

// 静态方法：按组别统计
dailyReportSchema.statics.getGroupStatistics = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$group',
        totalReports: { $sum: 1 },
        totalPromotionCost: { $sum: '$promotionCost' },
        totalSalesAmount: { $sum: '$totalSalesAmount' },
        totalSalesCount: { $sum: '$totalSalesCount' },
        averageROI: { $avg: '$roi' }
      }
    },
    {
      $project: {
        _id: 0,
        group: '$_id',
        totalReports: 1,
        totalPromotionCost: 1,
        totalSalesAmount: 1,
        totalSalesCount: 1,
        averageROI: 1
      }
    },
    { $sort: { totalSalesAmount: -1 } }
  ]);
};

// 静态方法：按日期统计
dailyReportSchema.statics.getDateStatistics = function(filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' }
        },
        totalReports: { $sum: 1 },
        totalPromotionCost: { $sum: '$promotionCost' },
        totalSalesAmount: { $sum: '$totalSalesAmount' },
        totalSalesCount: { $sum: '$totalSalesCount' },
        averageROI: { $avg: '$roi' }
      }
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        totalReports: 1,
        totalPromotionCost: 1,
        totalSalesAmount: 1,
        totalSalesCount: 1,
        averageROI: 1
      }
    },
    { $sort: { date: -1 } }
  ]);
};

module.exports = mongoose.model('DailyReport', dailyReportSchema);
