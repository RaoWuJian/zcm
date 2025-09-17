const Role = require('../models/Role');
const { asyncHandler } = require('../middleware/error');

// @desc    创建角色
// @route   POST /api/roles
// @access  Private/Admin
const createRole = asyncHandler(async (req, res) => {
  const { roleName, permissions, description } = req.body;

  // 检查必填字段
  if (!roleName) {
    return res.status(400).json({
      success: false,
      message: '请填写角色名称'
    });
  }

  // 检查角色是否已存在
  const existingRole = await Role.findOne({ roleName });

  if (existingRole) {
    return res.status(400).json({
      success: false,
      message: '角色名称已存在'
    });
  }

  // 生成8位唯一编码
  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  let code;
  let isCodeUnique = false;
  while (!isCodeUnique) {
    code = generateCode();
    const existingCode = await Role.findOne({ code });
    if (!existingCode) {
      isCodeUnique = true;
    }
  }

  // 创建角色
  const role = await Role.create({
    roleName,
    code,
    permissions: permissions || [],
    description: description || ''
  });

  res.status(201).json({
    success: true,
    message: '角色创建成功',
    data: role
  });
});

// @desc    获取所有角色
// @route   GET /api/roles
// @access  Private/Admin
const getRoles = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || parseInt(req.query.size, 10) || 10;
  const search = req.query.search || req.query.name || '';
  const isActive = req.query.isActive;
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  // 构建查询条件
  let query = {};

  if (search) {
    query.$or = [
      { code: { $regex: search, $options: 'i' } },
      { roleName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const startIndex = (page - 1) * limit;
  const total = await Role.countDocuments(query);

  const roles = await Role.find(query)
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(startIndex);

  // 分页信息
  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalRoles: total,
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };

  res.json({
    success: true,
    count: roles.length,
    total: total,
    pagination,
    data: roles
  });
});

// @desc    获取单个角色
// @route   GET /api/roles/:id
// @access  Private/Admin
const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({
      success: false,
      message: '角色未找到'
    });
  }

  res.json({
    success: true,
    data: role
  });
});

// @desc    更新角色
// @route   PUT /api/roles/:id
// @access  Private/Admin
const updateRole = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    roleName: req.body.roleName,
    permissions: req.body.permissions,
    description: req.body.description
  };

  // 移除空值
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const role = await Role.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  if (!role) {
    return res.status(404).json({
      success: false,
      message: '角色未找到'
    });
  }

  res.json({
    success: true,
    message: '角色信息更新成功',
    data: role
  });
});

// @desc    删除角色
// @route   DELETE /api/roles/:id
// @access  Private/Admin
const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);

  if (!role) {
    return res.status(404).json({
      success: false,
      message: '角色未找到'
    });
  }

  // 检查是否有用户正在使用该角色
  const User = require('../models/User');
  const usersWithRole = await User.countDocuments({ rolePermission: req.params.id });

  if (usersWithRole > 0) {
    return res.status(400).json({
      success: false,
      message: `无法删除角色，还有 ${usersWithRole} 个用户正在使用此角色`
    });
  }

  await Role.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: '角色删除成功'
  });
});

// @desc    获取角色统计信息
// @route   GET /api/roles/stats
// @access  Private/Admin
const getRoleStats = asyncHandler(async (req, res) => {
  const totalRoles = await Role.countDocuments();

  // 最近30天创建的角色
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentRoles = await Role.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  // 统计每个角色的用户数量
  const User = require('../models/User');
  const roleUsageStats = await User.aggregate([
    {
      $group: {
        _id: '$rolePermission',
        userCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'roles',
        localField: '_id',
        foreignField: '_id',
        as: 'roleInfo'
      }
    },
    {
      $unwind: {
        path: '$roleInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        userCount: 1,
        roleName: '$roleInfo.roleName',
        code: '$roleInfo.code'
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalRoles,
      recentRoles,
      roleUsageStats
    }
  });
});

// @desc    获取可用权限列表
// @route   GET /api/roles/permissions
// @access  Private/Admin
const getAvailablePermissions = asyncHandler(async (req, res) => {
  // 从Role模型的schema中获取权限枚举
  const permissionEnums = [
    // 用户管理权限
    'user:read',            // 查看员工信息
    'user:create',          // 创建员工账号
    'user:update',          // 编辑员工信息
    'user:delete',          // 删除员工账号
    'user:manage',          // 管理员工

    // 部门管理权限
    'department:read',          // 查看部门信息
    'department:create',        // 创建部门
    'department:update',        // 编辑部门信息
    'department:delete',        // 删除部门
    'department:manage',        // 管理部门

    // 角色权限管理
    'role:read',           // 查看角色信息
    'role:create',         // 创建角色
    'role:update',         // 编辑角色权限
    'role:delete',         // 删除角色
    'role:manage',         // 角色管理

    // 商品管理权限
    'product:read',        // 查看商品信息
    'product:create',      // 创建商品信息
    'product:update',      // 编辑商品信息
    'product:delete',      // 删除商品信息
    'product:manage',      // 管理商品

    // 财务管理权限
    'finance:read',         // 查看财务信息
    'finance:create',       // 创建收支记录
    'finance:update',       // 编辑收支记录
    'finance:delete',       // 删除收支记录
    'finance:approve',      // 收支记录审批
    'finance:manage',       // 收支管理

    // 团队财务账户权限
    'finance:team_read',    // 查看团队账户
    'finance:team_manage',  // 团队财务管理
  ];

  // 权限分类和标签映射
  const permissionMap = {
    // 用户管理权限
    'user:read': { label: '查看用户', category: '用户管理' },
    'user:create': { label: '创建用户', category: '用户管理' },
    'user:update': { label: '编辑用户', category: '用户管理' },
    'user:delete': { label: '删除用户', category: '用户管理' },
    'user:manage': { label: '管理用户', category: '用户管理' },

    // 部门管理权限
    'department:read': { label: '查看部门', category: '部门管理' },
    'department:create': { label: '创建部门', category: '部门管理' },
    'department:update': { label: '编辑部门', category: '部门管理' },
    'department:delete': { label: '删除部门', category: '部门管理' },
    'department:manage': { label: '管理部门', category: '部门管理' },

    // 角色权限管理
    'role:read': { label: '查看角色', category: '角色管理' },
    'role:create': { label: '创建角色', category: '角色管理' },
    'role:update': { label: '编辑角色', category: '角色管理' },
    'role:delete': { label: '删除角色', category: '角色管理' },
    'role:manage': { label: '管理角色', category: '角色管理' },

    // 商品管理权限
    'product:read': { label: '查看商品', category: '商品管理' },
    'product:create': { label: '创建商品', category: '商品管理' },
    'product:update': { label: '编辑商品', category: '商品管理' },
    'product:delete': { label: '删除商品', category: '商品管理' },
    'product:manage': { label: '管理商品', category: '商品管理' },

    // 财务管理权限
    'finance:read': { label: '查看财务', category: '财务管理' },
    'finance:create': { label: '创建财务记录', category: '财务管理' },
    'finance:update': { label: '编辑财务记录', category: '财务管理' },
    'finance:delete': { label: '删除财务记录', category: '财务管理' },
    'finance:approve': { label: '审批财务记录', category: '财务管理' },
    'finance:manage': { label: '管理财务', category: '财务管理' },
    'finance:team_read': { label: '查看团队账户', category: '财务管理' },
    'finance:team_manage': { label: '管理团队账户', category: '财务管理' }
  };

  const permissions = permissionEnums.map(key => ({
    key,
    label: permissionMap[key]?.label || key,
    category: permissionMap[key]?.category || '其他'
  }));

  const categories = [...new Set(permissions.map(p => p.category))];

  res.json({
    success: true,
    data: {
      permissions,
      categories
    }
  });
});

module.exports = {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
  getRoleStats,
  getAvailablePermissions
};