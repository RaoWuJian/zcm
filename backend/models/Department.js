const mongoose = require('mongoose');

// 辅助函数：检查循环引用
async function checkCircularReference(parentId, childId, DepartmentModel) {
  if (!parentId || !childId) return false;

  let currentParent = parentId;
  const visited = new Set();

  while (currentParent) {
    const currentParentStr = currentParent.toString();
    if (currentParentStr === childId.toString()) {
      return true; // 找到循环引用
    }

    if (visited.has(currentParentStr)) {
      return false; // 避免无限循环
    }
    visited.add(currentParentStr);

    const parent = await DepartmentModel.findById(currentParent);
    if (!parent) break;
    currentParent = parent.parentId;
  }

  return false;
}

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
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ departmentCode: 1 }, { unique: true });

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
  
  // 处理部门层级
  try {
    if (this.parentId) {
      // 查找父部门
      const parent = await this.constructor.findById(this.parentId);
      if (!parent) {
        return next(new Error('父部门不存在'));
      }

      // 检查是否会造成循环引用
      if (this._id) {
        const isCircular = await checkCircularReference(this.parentId, this._id, this.constructor);
        if (isCircular) {
          return next(new Error('不能将部门设置为其子部门的子部门'));
        }
      }

      // 更新层级
      this.level = parent.level + 1;

      // 检查层级限制
      if (this.level > 10) {
        return next(new Error('部门层级不能超过10级'));
      }
    } else {
      // 根部门
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
departmentSchema.methods.getAllDescendants = async function() {
  const descendants = [];
  const toVisit = [this._id];
  const visited = new Set();

  while (toVisit.length > 0) {
    const currentId = toVisit.shift();
    if (visited.has(currentId.toString())) continue;
    visited.add(currentId.toString());

    const children = await this.constructor.find({ parentId: currentId });
    for (const child of children) {
      descendants.push(child);
      toVisit.push(child._id);
    }
  }

  return descendants;
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

// 静态方法：根据用户departmentIds获取用户有权限访问的部门树结构
departmentSchema.statics.getTreeByUserDepartments = async function(userDepartmentIds, options = {}) {
  const { includeChildren = true, includeEmployees = false, isActive } = options;

  if (!userDepartmentIds || userDepartmentIds.length === 0) {
    return [];
  }

  // 构建查询条件
  let query = {};
  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  // 获取用户部门及其所有下级部门
  let allowedDepartments = [];

  if (includeChildren) {
    // 获取用户部门信息
    const userDepartments = await this.find({
      _id: { $in: userDepartmentIds },
      ...query
    });

    // 为每个用户部门获取其所有下级部门（不包括用户部门本身）
    for (const userDept of userDepartments) {
      // 只获取下级部门，不包括用户部门本身
      const descendants = await userDept.getAllDescendants();
      allowedDepartments.push(...descendants.filter(dept =>
        isActive === undefined || dept.isActive === isActive
      ));
    }
  } else {
    // 不包含下级部门时，返回空数组（因为用户不应该看到自己的部门，只能看到下级部门）
    allowedDepartments = [];
  }

  // 去重并排序
  const uniqueDepartments = Array.from(
    new Map(allowedDepartments.map(dept => [dept._id.toString(), dept])).values()
  ).sort((a, b) => {
    if (a.level !== b.level) {
      return a.level - b.level; // 按层级排序
    }
    return a.departmentName.localeCompare(b.departmentName); // 同层级按名称排序
  });

  if (!includeEmployees) {
    return uniqueDepartments.map(dept => dept.toObject());
  }

  // 如果需要包含员工信息
  const User = require('./User');

  // 获取所有允许查看的部门ID（包括用户部门和下级部门）
  const allowedDepartmentIds = uniqueDepartments.map(dept => dept._id);

  // 构建员工查询条件
  const employeeQuery = {
    isActive: true,
    departmentIds: { $in: allowedDepartmentIds }
  };

  // 获取所有允许查看的员工
  const allowedUsers = await User.find(employeeQuery)
    .populate('rolePermission', 'roleName')
    .select('-loginPassword')
    .sort({ username: 1 });

  // 为每个部门添加员工信息
  return uniqueDepartments.map(dept => {
    const deptObj = dept.toObject();

    // 查找属于该部门的员工
    const employees = allowedUsers.filter(user => {
      if (user.departmentIds && user.departmentIds.length > 0) {
        return user.departmentIds.some(id => id.toString() === dept._id.toString());
      }
      return false;
    });

    return {
      ...deptObj,
      employees: employees.map(user => ({
        _id: user._id,
        username: user.username,
        loginAccount: user.loginAccount,
        departmentIds: user.departmentIds,
        rolePermission: user.rolePermission,
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        remark: user.remark,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      })),
      employeeCount: employees.length
    };
  });
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
    const employeeCount = await User.countDocuments({ departmentIds: dept._id });
    if (employeeCount > 0) {
      return next(new Error('部门下存在员工，不能删除'));
    }
  }
  
  next();
});

module.exports = mongoose.model('Department', departmentSchema);