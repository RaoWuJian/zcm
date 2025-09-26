const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, '用户名不能为空'],
    trim: true,
    maxlength: [50, '用户名最多50个字符']
  },
  loginAccount: {
    type: String,
    required: [true, '登录账号名不能为空'],
    unique: true,
    trim: true,
    minlength: [3, '登录账号名至少3个字符'],
    maxlength: [30, '登录账号名最多30个字符']
  },
  loginPassword: {
    type: String,
    required: [true, '登录密码不能为空'],
    minlength: [6, '密码至少6个字符'],
    select: false // 默认查询时不返回密码字段
  },
  remark: {
    type: String,
    trim: true,
    maxlength: [200, '备注最多200个字符'],
    default: ''
  },
  rolePermission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
  },
  // 多部门支持
  departmentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
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

// 密码加密中间件
userSchema.pre('save', async function(next) {
  // 如果密码没有被修改，则继续
  if (!this.isModified('loginPassword')) {
    return next();
  }

  try {
    // 生成盐并加密密码
    const salt = await bcrypt.genSalt(12);
    this.loginPassword = await bcrypt.hash(this.loginPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 更新时间中间件
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});


// 密码验证方法
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.loginPassword);
};

// 获取用户公开信息
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.loginPassword;
  return userObject;
};

// 获取用户的部门ID列表
userSchema.methods.getDepartmentIds = function() {
  if (this.departmentIds && this.departmentIds.length > 0) {
    return this.departmentIds;
  }
  return [];
};

// 检查用户是否属于指定部门
userSchema.methods.belongsToDepartment = function(departmentId) {
  if (this.departmentIds && this.departmentIds.length > 0) {
    return this.departmentIds.some(id => id.toString() === departmentId.toString());
  }
  return false;
};

// 添加部门到用户
userSchema.methods.addDepartment = function(departmentId) {
  if (!this.belongsToDepartment(departmentId)) {
    this.departmentIds = this.departmentIds || [];
    this.departmentIds.push(departmentId);
  }
};

// 从用户中移除部门
userSchema.methods.removeDepartment = function(departmentId) {
  if (this.departmentIds) {
    this.departmentIds = this.departmentIds.filter(id =>
      id.toString() !== departmentId.toString()
    );
  }
};

module.exports = mongoose.model('User', userSchema);