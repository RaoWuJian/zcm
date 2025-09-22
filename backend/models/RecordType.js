const mongoose = require('mongoose');

// 小类子文档模式
const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '小类名称不能为空'],
    trim: true,
    maxlength: [50, '小类名称不能超过50个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, '描述不能超过200个字符']
  },
  sort: {
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

// 记录类型模式（大类）
const recordTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '大类名称不能为空'],
    trim: true,
    maxlength: [50, '大类名称不能超过50个字符'],
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, '描述不能超过200个字符']
  },
  sort: {
    type: Number,
    default: 0,
    min: [0, '排序值不能小于0']
  },
  isActive: {
    type: Boolean,
    default: true
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
  timestamps: true
});

// 索引
// name字段已通过unique: true自动创建索引，不需要重复创建
recordTypeSchema.index({ sort: 1 });
recordTypeSchema.index({ isActive: 1 });
recordTypeSchema.index({ createdBy: 1 });

// 虚拟字段：活跃的小类数量
recordTypeSchema.virtual('activeSubCategoriesCount').get(function() {
  return this.subCategories.filter(sub => sub.isActive).length;
});

// 实例方法：添加小类
recordTypeSchema.methods.addSubCategory = function(subCategoryData, userId) {
  this.subCategories.push({
    ...subCategoryData,
    _id: new mongoose.Types.ObjectId()
  });
  this.updatedBy = userId;
  return this.save();
};

// 实例方法：更新小类
recordTypeSchema.methods.updateSubCategory = function(subCategoryId, updateData, userId) {
  const subCategory = this.subCategories.id(subCategoryId);
  if (!subCategory) {
    throw new Error('小类不存在');
  }
  
  Object.assign(subCategory, updateData);
  this.updatedBy = userId;
  return this.save();
};

// 实例方法：删除小类
recordTypeSchema.methods.removeSubCategory = function(subCategoryId, userId) {
  this.subCategories.pull(subCategoryId);
  this.updatedBy = userId;
  return this.save();
};

// 静态方法：获取所有活跃的记录类型
recordTypeSchema.statics.getActiveTypes = function() {
  return this.find({ isActive: true })
    .sort({ sort: 1, createdAt: 1 })
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');
};

// 静态方法：根据大类ID获取小类
recordTypeSchema.statics.getSubCategories = function(categoryId) {
  return this.findById(categoryId)
    .select('subCategories')
    .then(category => {
      if (!category) {
        throw new Error('大类不存在');
      }
      return category.subCategories.filter(sub => sub.isActive);
    });
};

// 中间件：保存前验证
recordTypeSchema.pre('save', function(next) {
  // 确保小类名称在同一大类中唯一
  const subCategoryNames = this.subCategories
    .filter(sub => sub.isActive)
    .map(sub => sub.name.toLowerCase());
  
  const uniqueNames = [...new Set(subCategoryNames)];
  if (subCategoryNames.length !== uniqueNames.length) {
    return next(new Error('同一大类下的小类名称不能重复'));
  }
  
  next();
});

// 中间件：删除前检查是否被使用
recordTypeSchema.pre('remove', async function(next) {
  try {
    const Finance = mongoose.model('Finance');
    
    // 检查是否有财务记录使用了这个类型
    const usedCount = await Finance.countDocuments({
      $or: [
        { 'recordType.categoryId': this._id },
        { 'recordType.subCategoryId': { $in: this.subCategories.map(sub => sub._id) } }
      ]
    });
    
    if (usedCount > 0) {
      return next(new Error(`该类型已被 ${usedCount} 条财务记录使用，无法删除`));
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// 导出模型
module.exports = mongoose.model('RecordType', recordTypeSchema);
