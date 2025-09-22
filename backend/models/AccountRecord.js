const mongoose = require('mongoose');
const { precisionCalculate } = require('../utils/precision');

const accountRecordSchema = new mongoose.Schema({
  // 关联团队账户
  teamAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamAccount',
    required: true,
    index: true
  },

  // 关联财务记录
  financeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Finance',
    required: true
  },

  // 记录类型
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'recharge'], // 收入、支出、充值
    index: true
  },

  // 交易金额（正数表示收入，负数表示支出）
  amount: {
    type: Number,
    required: true
  },

  // 交易前余额
  balanceBefore: {
    type: Number,
    required: true
  },

  // 交易后余额
  balanceAfter: {
    type: Number,
    required: true
  },

  // 描述说明
  description: {
    type: String,
    required: true,
    trim: true
  },

  // 交易状态
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'reversed'], 
    default: 'pending',
    index: true
  },

  // 发生时间（业务时间）
  occurredAt: {
    type: Date,
    required: true,
    index: true
  },

  // 审批时间
  approvedAt: {
    type: Date
  },

  // 审批人
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 操作人
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 更新人
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 备注信息
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, '备注最多500个字符']
  },

  // 是否为反向交易（用于修正错误记录）
  isReversed: {
    type: Boolean,
    default: false
  },

  // 原交易记录ID（反向交易时引用）
  originalRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountRecord'
  },

  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 复合索引
accountRecordSchema.index({ teamAccountId: 1, createdAt: -1 });
accountRecordSchema.index({ financeId: 1 });
accountRecordSchema.index({ type: 1, status: 1 });
accountRecordSchema.index({ occurredAt: -1 });

// 中间件：更新时自动设置 updatedAt
accountRecordSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// 实例方法：获取交易摘要
accountRecordSchema.methods.getSummary = function() {
  const typeText = {
    'income': '收入',
    'expense': '支出', 
    'recharge': '充值'
  };

  return {
    id: this._id,
    type: this.type,
    typeText: typeText[this.type],
    amount: this.amount,
    balanceBefore: this.balanceBefore,
    balanceAfter: this.balanceAfter,
    description: this.description,
    status: this.status,
    occurredAt: this.occurredAt,
    createdAt: this.createdAt
  };
};

// 静态方法：获取账户余额变动历史
accountRecordSchema.statics.getBalanceHistory = function(teamAccountId, startDate, endDate) {
  const query = { teamAccountId, status: 'completed' };
  
  if (startDate || endDate) {
    query.occurredAt = {};
    if (startDate) query.occurredAt.$gte = new Date(startDate);
    if (endDate) query.occurredAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .populate('createdBy', 'username')
    .populate('approvedBy', 'username')
    .sort({ occurredAt: -1, createdAt: -1 })
    .lean();
};

// 静态方法：计算账户当前余额（基于记录）
accountRecordSchema.statics.calculateBalance = function(teamAccountId) {
  return this.aggregate([
    {
      $match: {
        teamAccountId: new mongoose.Types.ObjectId(teamAccountId),
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        recordCount: { $sum: 1 },
        lastRecord: { $last: '$$ROOT' }
      }
    }
  ]);
};

// 静态方法：验证余额一致性
accountRecordSchema.statics.verifyBalance = async function(teamAccountId) {
  const TeamAccount = require('./TeamAccount');
  
  const [balanceResult, teamAccount] = await Promise.all([
    this.calculateBalance(teamAccountId),
    TeamAccount.findById(teamAccountId)
  ]);

  if (!teamAccount) {
    throw new Error('团队账户不存在');
  }

  const recordedBalance = balanceResult.length > 0 ? 
    balanceResult[0].lastRecord?.balanceAfter || 0 : 0;
    
  const actualBalance = teamAccount.amount;

  return {
    teamAccountId,
    recordedBalance,
    actualBalance,
    isConsistent: Math.abs(precisionCalculate.subtract(recordedBalance, actualBalance)) < 0.01, // 允许小数点误差
    difference: precisionCalculate.subtract(actualBalance, recordedBalance)
  };
};

module.exports = mongoose.model('AccountRecord', accountRecordSchema);