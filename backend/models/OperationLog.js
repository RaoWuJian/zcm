const mongoose = require('mongoose');

const operationLogSchema = new mongoose.Schema({
  // 操作类型
  operationType: {
    type: String,
    required: [true, '操作类型不能为空'],
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT'],
    trim: true
  },

  // 操作的模块/资源
  module: {
    type: String,
    required: [true, '操作模块不能为空'],
    enum: [
      'USER',                 // 用户管理
      'DEPARTMENT',           // 部门管理
      'FINANCE',              // 财务记录
      'PRODUCT',              // 产品管理
      'ROLE',                 // 角色管理
      'TEAM_ACCOUNT',         // 团队账户
      'FILE',                 // 文件管理
      'COMMISSION',           // 佣金核算
      'BUDGET',               // 预算管理
      'DAILY_REPORT',         // 日报管理
      'INVENTORY',            // 库存管理
      'SHIPMENT',             // 发货记录
      'OPERATIONAL_PRODUCT',  // 运营产品
      'CAMPAIGN_CATEGORY',    // 活动分类
      'RECORD_TYPE'           // 记录类型
    ],
    trim: true
  },

  // 操作的具体资源ID
  resourceId: {
    type: String,
    trim: true
  },

  // 操作的资源名称/标识
  resourceName: {
    type: String,
    trim: true,
    maxlength: [100, '资源名称最多100个字符']
  },

  // 操作描述
  description: {
    type: String,
    required: [true, '操作描述不能为空'],
    trim: true,
    maxlength: [500, '操作描述最多500个字符']
  },

  // 操作前的数据（JSON格式）
  beforeData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // 操作后的数据（JSON格式）
  afterData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // 操作人信息
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '操作人不能为空']
  },

  operatorName: {
    type: String,
    required: [true, '操作人姓名不能为空'],
    trim: true
  },

  operatorAccount: {
    type: String,
    required: [true, '操作人账号不能为空'],
    trim: true
  },

  // 请求信息
  requestInfo: {
    method: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    ip: {
      type: String,
      trim: true
    }
  },

  // 操作结果
  result: {
    type: String,
    enum: ['SUCCESS', 'FAILED'],
    default: 'SUCCESS'
  },

  // 错误信息（如果操作失败）
  errorMessage: {
    type: String,
    trim: true
  },

  // 操作时间
  operatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// 创建索引以提高查询性能
operationLogSchema.index({ operatorId: 1, operatedAt: -1 });
operationLogSchema.index({ module: 1, operatedAt: -1 });
operationLogSchema.index({ operationType: 1, operatedAt: -1 });
operationLogSchema.index({ resourceId: 1, operatedAt: -1 });

// 静态方法：记录操作日志
operationLogSchema.statics.logOperation = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('记录操作日志失败:', error);
    // 不抛出错误，避免影响主业务流程
    return null;
  }
};

// 静态方法：获取用户操作统计
operationLogSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        operatorId: new mongoose.Types.ObjectId(userId),
        operatedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          operationType: '$operationType',
          module: '$module'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.operationType',
        modules: {
          $push: {
            module: '$_id.module',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' }
      }
    }
  ]);

  return stats;
};

// 静态方法：获取模块操作统计
operationLogSchema.statics.getModuleStats = async function(module, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        module: module,
        operatedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          operationType: '$operationType',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$operatedAt'
            }
          }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);

  return stats;
};

module.exports = mongoose.model('OperationLog', operationLogSchema);
