const mongoose = require('mongoose');

const designRequestSchema = new mongoose.Schema({
  // 需求描述
  requirement: {
    type: String,
    required: [true, '请输入需求描述'],
    trim: true,
    maxlength: [1000, '需求描述最多1000个字符']
  },

  // 提交部门（管理员可以为空）
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },

  // 图片列表（美工上传的图片，最多9张）
  images: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileInfo'
  }],

  // 分配的美工用户
  assignedDesigner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // 预计完成时间
  expectedCompletionDate: {
    type: Date,
    default: null
  },

  // 贴图文件（美工上传的文件）
  attachmentFiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileInfo'
  }],

  // 已完成时间（完成后自动记录）
  completedAt: {
    type: Date,
    default: null
  },

  // 备注
  remark: {
    type: String,
    trim: true,
    maxlength: [500, '备注最多500个字符'],
    default: ''
  },

  // 状态
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },

  // 创建者
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // 更新者
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 创建索引
designRequestSchema.index({ createdAt: -1 });
designRequestSchema.index({ department: 1, createdAt: -1 });
designRequestSchema.index({ assignedDesigner: 1, createdAt: -1 });
designRequestSchema.index({ status: 1, createdAt: -1 });
designRequestSchema.index({ createdBy: 1, createdAt: -1 });

// 虚拟字段：图片数量
designRequestSchema.virtual('imageCount').get(function() {
  return this.images ? this.images.length : 0;
});

// 虚拟字段：附件数量
designRequestSchema.virtual('attachmentCount').get(function() {
  return this.attachmentFiles ? this.attachmentFiles.length : 0;
});

// 中间件：更新时间
designRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 中间件：验证图片数量
designRequestSchema.pre('save', function(next) {
  if (this.images && this.images.length > 9) {
    const error = new Error('最多只能上传9张图片');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// 中间件：状态变更为completed时自动记录完成时间
designRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// 实例方法：检查是否可以编辑
designRequestSchema.methods.canEdit = function(userId) {
  return this.createdBy.toString() === userId.toString();
};

// 实例方法：检查是否可以分配美工
designRequestSchema.methods.canAssign = function(user) {
  // 管理员或美工部门的用户可以分配
  return user.isAdmin;
};

// 静态方法：获取日期范围内的需求
designRequestSchema.statics.getRequestsByDateRange = function(startDate, endDate, options = {}) {
  const query = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };

  if (options.department) {
    query.department = options.department;
  }

  if (options.status) {
    query.status = options.status;
  }

  if (options.assignedDesigner) {
    query.assignedDesigner = options.assignedDesigner;
  }

  return this.find(query)
    .populate('department', 'departmentName')
    .populate('assignedDesigner', 'username')
    .populate('createdBy', 'username')
    .populate('updatedBy', 'username')
    .populate('images')
    .populate('attachmentFiles')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('DesignRequest', designRequestSchema);

