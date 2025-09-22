const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  // 关联团队账户
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamAccount',
    required: true
  },

  name: { // 记录名称/标题
    type: String,
    required: true,
    trim: true
  },

  // 收支类型
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense'], // 收入/支出
    trim: true
  },

  // 金额
  amount: {
    type: Number,
    required: true,
    min: 0
  },

  // 发生时间
  occurredAt: {
    type: Date,
    required: true
  },

  // 公司账户ID（仅标签作用，不影响余额）
  companyAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TeamAccount'
  },

  // 收款/付款名
  paymentName: {
    type: String,
    trim: true,
    maxlength: [20, '收款/付款名最多20个字符']
  },

  // 收款/付款账号
  account: {
    type: String,
    trim: true,
    maxlength: [20, '收款/付款账号最多20个字符']
  },

  // 说明/备注
  description: {
    type: String,
    trim: true,
    maxlength: [200, '说明最多200个字符']
  },

  // 记录类型信息
  recordType: {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecordType'
    },
    categoryName: {
      type: String,
      trim: true
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId
    },
    subCategoryName: {
      type: String,
      trim: true
    }
  },

  // 关联的图片文件
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileInfo'
  }],

  // 审批状态
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  // 审批时间
  approvedAt: {
    type: Date
  },

  // 审批意见
  approvalComment: {
    type: String,
    trim: true
  },

  // 审批人
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // 创建者和更新者信息
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Finance', financeSchema);

