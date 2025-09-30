const mongoose = require('mongoose');

// 小类子文档模式
const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '小类名称不能为空'],
    trim: true,
    maxlength: [100, '小类名称最多100个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, '描述最多200个字符']
  },
  sortOrder: {
    type: Number,
    default: 0,
    min: [0, '排序值不能小于0']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 投放分类模式（大类）
const campaignCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '分类名称不能为空'],
    trim: true,
    maxlength: [100, '分类名称最多100个字符'],
    unique: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [200, '描述最多200个字符'],
    default: ''
  },
  
  // 排序顺序
  sortOrder: {
    type: Number,
    default: 0,
    min: [0, '排序值不能小于0'],
    index: true
  },
  
  // 是否启用
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // 小类数组
  subCategories: [subCategorySchema],
  
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
campaignCategorySchema.index({ sortOrder: 1 });
campaignCategorySchema.index({ isActive: 1 });
campaignCategorySchema.index({ createdBy: 1 });

// 虚拟字段：活跃的小类数量
campaignCategorySchema.virtual('activeSubCategoriesCount').get(function() {
  return this.subCategories && Array.isArray(this.subCategories) 
    ? this.subCategories.filter(sub => sub.isActive).length 
    : 0;
});

// 虚拟字段：children（为了兼容前端现有代码）
campaignCategorySchema.virtual('children').get(function() {
  return this.subCategories && Array.isArray(this.subCategories)
    ? this.subCategories.filter(sub => sub.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
});

// 实例方法：添加小类
campaignCategorySchema.methods.addSubCategory = function(subCategoryData, userId) {
  // 确保 subCategories 数组存在
  if (!this.subCategories) {
    this.subCategories = [];
  }
  
  this.subCategories.push({
    ...subCategoryData,
    _id: new mongoose.Types.ObjectId()
  });
  this.updatedBy = userId;
  return this.save();
};

// 实例方法：更新小类
campaignCategorySchema.methods.updateSubCategory = function(subCategoryId, updateData, userId) {
  if (!this.subCategories || !Array.isArray(this.subCategories)) {
    throw new Error('小类不存在');
  }
  
  const subCategory = this.subCategories.id(subCategoryId);
  if (!subCategory) {
    throw new Error('小类不存在');
  }
  
  Object.assign(subCategory, updateData);
  this.updatedBy = userId;
  return this.save();
};

// 实例方法：删除小类
campaignCategorySchema.methods.removeSubCategory = function(subCategoryId, userId) {
  if (!this.subCategories || !Array.isArray(this.subCategories)) {
    throw new Error('小类不存在');
  }
  
  this.subCategories.pull(subCategoryId);
  this.updatedBy = userId;
  return this.save();
};

// 静态方法：获取所有大类及其子类
campaignCategorySchema.statics.getMainCategoriesWithChildren = function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');
};

// 静态方法：获取指定大类的子类
campaignCategorySchema.statics.getSubCategories = function(mainCategoryId) {
  return this.findById(mainCategoryId)
    .select('subCategories')
    .then(category => {
      if (!category) {
        throw new Error('大类不存在');
      }
      return category.subCategories && Array.isArray(category.subCategories)
        ? category.subCategories.filter(sub => sub.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
        : [];
    });
};

// 静态方法：获取所有大类
campaignCategorySchema.statics.getMainCategories = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
};

// 静态方法：获取所有活跃的投放分类
campaignCategorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');
};

// 实例方法：获取完整路径名称（兼容方法）
campaignCategorySchema.methods.getFullPath = function(subCategoryId = null) {
  if (subCategoryId) {
    const subCategory = this.subCategories.id(subCategoryId);
    return subCategory ? `${this.name} > ${subCategory.name}` : this.name;
  }
  return this.name;
};

// 实例方法：检查是否可以删除
campaignCategorySchema.methods.canDelete = async function() {
  // 检查是否被日报使用
  const DailyReport = mongoose.model('DailyReport');
  
  // 检查大类是否被使用
  const mainCategoryUsage = await DailyReport.countDocuments({
    campaignMainCategory: this._id
  });
  
  if (mainCategoryUsage > 0) {
    return { canDelete: false, reason: '该大类已被日报使用' };
  }
  
  // 检查小类是否被使用
  if (this.subCategories && Array.isArray(this.subCategories) && this.subCategories.length > 0) {
    const subCategoryIds = this.subCategories.map(sub => sub._id);
    const subCategoryUsage = await DailyReport.countDocuments({
      campaignSubCategory: { $in: subCategoryIds }
    });
    
    if (subCategoryUsage > 0) {
      return { canDelete: false, reason: '该大类下的小类已被日报使用' };
    }
  }
  
  return { canDelete: true };
};

// 实例方法：检查小类是否可以删除
campaignCategorySchema.methods.canDeleteSubCategory = async function(subCategoryId) {
  const DailyReport = mongoose.model('DailyReport');
  const reportCount = await DailyReport.countDocuments({
    campaignSubCategory: subCategoryId
  });
  
  if (reportCount > 0) {
    return { canDelete: false, reason: '该小类已被日报使用' };
  }
  
  return { canDelete: true };
};

// 中间件：保存前验证
campaignCategorySchema.pre('save', function(next) {
  // 确保小类名称在同一大类中唯一
  if (this.subCategories && Array.isArray(this.subCategories)) {
    const subCategoryNames = this.subCategories
      .filter(sub => sub.isActive)
      .map(sub => sub.name.toLowerCase());
    
    const uniqueNames = [...new Set(subCategoryNames)];
    if (subCategoryNames.length !== uniqueNames.length) {
      return next(new Error('同一大类下的小类名称不能重复'));
    }
  }
  
  next();
});

// 中间件：删除前检查是否被使用
campaignCategorySchema.pre('remove', async function(next) {
  try {
    const deleteCheck = await this.canDelete();
    if (!deleteCheck.canDelete) {
      return next(new Error(deleteCheck.reason));
    }
    next();
  } catch (error) {
    next(error);
  }
});

// 中间件：删除前检查是否被使用（支持 deleteOne）
campaignCategorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    const deleteCheck = await this.canDelete();
    if (!deleteCheck.canDelete) {
      return next(new Error(deleteCheck.reason));
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('CampaignCategory', campaignCategorySchema);