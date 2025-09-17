const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  // 部门名称
  departmentName: {
    type: String,
    required: [true, '请输入部门名称'],
    trim: true,
    maxLength: [50, '部门名称不能超过50个字符']
  },
  
  // 部门编码（系统自动生成）
  departmentCode: {
    type: String,
    unique: true,
    trim: true
  },
  
  // 部门描述
  description: {
    type: String,
    trim: true,
    maxLength: [200, '部门描述不能超过200个字符']
  },
  
  // 父部门ID
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  
  // 部门路径（如：A->B->C->D）
  departmentPath: {
    type: String,
    trim: true
  },
  
  // 部门层级（用于快速查询）
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  // 是否启用
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// 创建索引
departmentSchema.index({ parentId: 1 });
departmentSchema.index({ departmentPath: 1 });
departmentSchema.index({ isActive: 1 });

// 生成部门编码的中间件（首先执行）
departmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.departmentCode) {
    try {
      // 生成唯一的8字符部门编码，格式：DMxxxxxx（DM + 6位随机字符）
      const generateUniqueCode = async () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let code;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
          // 生成6位随机字符
          let randomPart = '';
          for (let i = 0; i < 6; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          code = `DM${randomPart}`;
          attempts++;
          
          // 检查是否已存在
          const existingDept = await this.constructor.findOne({ departmentCode: code });
          if (!existingDept) {
            return code;
          }
          
          if (attempts >= maxAttempts) {
            throw new Error('生成唯一部门编码失败，请重试');
          }
        } while (true);
      };
      
      this.departmentCode = await generateUniqueCode();
      
    } catch (error) {
      return next(error);
    }
  }
  
  // 处理部门路径和层级
  try {
    if (this.parentId) {
      // 查找父部门
      const parent = await this.constructor.findById(this.parentId);
      if (!parent) {
        return next(new Error('父部门不存在'));
      }
      
      // 检查是否会造成循环引用
      if (this._id && parent.departmentPath.includes(this._id.toString())) {
        return next(new Error('不能将部门设置为其子部门的子部门'));
      }
      
      // 更新部门路径和层级
      this.departmentPath = `${parent.departmentPath}->${this.departmentName}`;
      this.level = parent.level + 1;
      
      // 检查层级限制
      if (this.level > 10) {
        return next(new Error('部门层级不能超过10级'));
      }
    } else {
      // 根部门
      this.departmentPath = this.departmentName;
      this.level = 1;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// 实例方法：获取所有子部门
departmentSchema.methods.getChildren = function() {
  return this.constructor.find({ parentId: this._id });
};

// 实例方法：获取所有下级部门（包括孙子部门）
departmentSchema.methods.getAllDescendants = function() {
  const pathPattern = new RegExp(`^${this.departmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}->`);
  return this.constructor.find({ departmentPath: pathPattern });
};

// 静态方法：获取部门树结构
departmentSchema.statics.getTree = async function(parentId = null) {
  const departments = await this.find({ parentId }).sort({ departmentName: 1 });
  
  const tree = [];
  for (const dept of departments) {
    const children = await this.getTree(dept._id);
    tree.push({
      ...dept.toObject(),
      children: children.length > 0 ? children : undefined
    });
  }
  
  return tree;
};

// 静态方法：根据路径查找部门
departmentSchema.statics.findByPath = function(path) {
  return this.findOne({ departmentPath: path });
};

// 删除前检查是否有子部门和员工
departmentSchema.pre('findOneAndDelete', async function(next) {
  const dept = await this.model.findOne(this.getFilter());
  
  if (dept) {
    // 检查是否有子部门
    const childrenCount = await this.model.countDocuments({ parentId: dept._id });
    if (childrenCount > 0) {
      return next(new Error('存在子部门，不能删除'));
    }
    
    // 检查是否有员工
    const User = mongoose.model('User');
    const employeeCount = await User.countDocuments({ departmentPath: { $regex: dept.departmentPath } });
    if (employeeCount > 0) {
      return next(new Error('部门下存在员工，不能删除'));
    }
  }
  
  next();
});

module.exports = mongoose.model('Department', departmentSchema);