const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // 通知接收者
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 通知类型
  type: {
    type: String,
    required: true,
    enum: ['daily_report', 'system', 'announcement', 'reminder'],
    index: true
  },
  
  // 通知分类
  category: {
    type: String,
    required: true,
    default: 'general'
  },
  
  // 通知标题
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  // 通知消息内容
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // 通知相关数据
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // 是否已读
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // 是否已发送（WebSocket）
  isSent: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // 发送尝试次数
  sendAttempts: {
    type: Number,
    default: 0,
    max: 5
  },
  
  // 最后发送尝试时间
  lastSendAttempt: {
    type: Date
  },
  
  // 过期时间（可选）
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  
  // 优先级
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  
  // 创建者（可选）
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 相关资源ID（如日报ID）
  resourceId: {
    type: String,
    index: true
  },
  
  // 相关资源类型
  resourceType: {
    type: String,
    enum: ['daily_report', 'user', 'system']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ isSent: 1, sendAttempts: 1 });

// 虚拟字段：是否为新通知（24小时内）
notificationSchema.virtual('isNew').get(function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > oneDayAgo && !this.isRead;
});

// 静态方法：获取用户未读通知
notificationSchema.statics.getUnreadByUser = function(userId, limit = 50) {
  return this.find({
    recipient: userId,
    isRead: false
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('creator', 'username')
  .lean();
};

// 静态方法：获取用户所有通知
notificationSchema.statics.getByUser = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    isRead = null
  } = options;
  
  const query = { recipient: userId };
  
  if (type) query.type = type;
  if (isRead !== null) query.isRead = isRead;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('creator', 'username')
    .lean();
};

// 静态方法：标记通知为已读
notificationSchema.statics.markAsRead = function(notificationIds, userId) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId
    },
    {
      $set: { isRead: true }
    }
  );
};

// 静态方法：标记用户所有通知为已读
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false
    },
    {
      $set: { isRead: true }
    }
  );
};

// 静态方法：获取未发送的通知
notificationSchema.statics.getUnsent = function(limit = 100) {
  return this.find({
    isSent: false,
    sendAttempts: { $lt: 5 }
  })
  .sort({ priority: -1, createdAt: 1 })
  .limit(limit)
  .populate('recipient', 'username isActive')
  .lean();
};

// 静态方法：创建日报通知
notificationSchema.statics.createDailyReportNotification = async function(data) {
  const {
    recipients,
    reportId,
    submitterName,
    reportDate,
    groupName,
    productName,
    creator
  } = data;

  const notifications = recipients.map(recipientId => ({
    recipient: recipientId,
    type: 'daily_report',
    category: 'daily_report',
    title: '新的日报提交',
    message: `${submitterName}提交了${productName}的日报（${new Date(reportDate).toLocaleDateString('zh-CN')}），请查看`,
    data: {
      reportId,
      submitterName,
      reportDate,
      groupName,
      productName
    },
    creator,
    resourceId: reportId,
    resourceType: 'daily_report',
    priority: 'normal',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
    createdAt: new Date(), // 确保有createdAt字段
    isSent: false,
    sendAttempts: 0
  }));

  return await this.insertMany(notifications);
};

// 实例方法：标记为已发送
notificationSchema.methods.markAsSent = function() {
  this.isSent = true;
  this.lastSendAttempt = new Date();
  return this.save();
};

// 实例方法：增加发送尝试次数
notificationSchema.methods.incrementSendAttempts = function() {
  this.sendAttempts += 1;
  this.lastSendAttempt = new Date();
  return this.save();
};

// 中间件：删除过期通知
notificationSchema.pre('save', function(next) {
  // 如果没有设置过期时间，默认30天后过期
  if (!this.expiresAt && this.isNew) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
