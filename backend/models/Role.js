const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: [true, '角色名称不能为空'],
    trim: true,
    maxlength: [50, '角色名称最多50个字符']
  },

  code: { // 制动生成8位唯一编码
    type: String,
    required: true,
  },

  permissions: [{
    type: String,
    enum: [
      // 用户管理权限
      // 'user:read',            // 查看员工信息
      'user:create',          // 创建员工账号
      'user:update',          // 编辑员工信息
      'user:delete',          // 删除员工账号

      // 部门管理权限
      'department:create',        // 创建部门
      'department:update',        // 编辑部门信息
      'department:delete',        // 删除部门
      'department:manageEmployee',   // 管理部门员工

      // 角色权限管理
      // 'role:read',           // 查看角色信息
      'role:create',         // 创建角色
      'role:update',         // 编辑角色权限
      'role:delete',         // 删除角色

      // 商品列表权限
      // 'product:read',        // 查看商品信息
      'product:create',      // 创建商品信息
      'product:update',      // 编辑商品信息
      'product:delete',      // 删除商品信息

      // 财务测算
      // 'product:budget',      // 财务测算
      'productBudget:create',      // 新增财务测算
      'productBudget:update',      // 编辑财务测算
      'productBudget:delete',      // 删除财务测算

      // 产品佣金
      // 'product:commission',  // 产品佣金
      'productCommission:create',  // 新增产品佣金
      'productCommission:update',  // 编辑产品佣金
      'productCommission:delete',  // 删除产品佣金

      // 商品运营
      // 'product:operation',   // 商品运营
      'productOperation:create',   // 新增商品运营
      'productOperation:update',   // 编辑商品运营
      'productOperation:delete',   // 删除商品运营

      // 库存管理权限
      'inventory:create',     // 添加库存
      'inventory:update',     // 编辑库存
      'inventory:in',         // 入库操作
      'inventory:out',        // 出库操作
      'inventory:delete',     // 删除库存

      // 发货记录权限
      'shipment:create',      // 创建发货记录
      'shipment:update',      // 编辑发货记录
      'shipment:delete',      // 删除发货记录
      'shipment:approve',     // 审批发货记录

      // 财务管理权限
      'finance:create',       // 创建收支记录
      'finance:update',       // 编辑收支记录
      'finance:delete',       // 删除收支记录
      'finance:approve',      // 收支记录审批
      'finance:typeSetting',  // 收支类型设置
      
      // 团队财务账户权限
      // 'finance:team_read',    // 查看团队账户
      'finance:team_create',    // 创建团队账户
      'finance:team_update',    // 编辑团队账户
      'finance:team_delete',    // 删除团队账户

      // 日数据报表权限
      'dailyDataReport:create',   // 创建日数据报表
      'dailyDataReport:update',   // 编辑日数据报表
      'dailyDataReport:delete',   // 删除日数据报表
      'dailyDataReport:statistic',// 统计日数据报表
      'dailyDataReport:typeSetting',//日数据报表投放分类设置
    ]
  }],

  description: {
    type: String,
    trim: true,
    maxlength: [200, '角色描述最多200个字符'],
    default: ''
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '创建人不能为空']
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

// 更新时间中间件
roleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 添加索引以提高查询性能
roleSchema.index({ roleName: 1 });

module.exports = mongoose.model('Role', roleSchema);