const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const { asyncHandler } = require('../middleware/error');

// 生成JWT令牌
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};


// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { loginAccount, loginPassword } = req.body;
  console.log(loginAccount)
  // 验证输入
  if (!loginAccount || !loginPassword) {
    return res.status(400).json({
      success: false,
      message: '请输入登录账号名和密码'
    });
  }

  // 查找用户
  const user = await User.findOne({ loginAccount })
    .select('+loginPassword')
    .populate('rolePermission');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: '登录账号名或密码错误'
    });
  }

  // 检查账户状态
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: '账户已被禁用，请联系管理员'
    });
  }

  // 验证密码
  const isMatch = await user.matchPassword(loginPassword);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: '登录账号名或密码错误'
    });
  }

  // 生成token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: '登录成功',
    data: {
      token,
      userInfo: user.getPublicProfile()
    }
  });
});

// @desc    创建用户（管理员）
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { username, loginAccount, loginPassword, remark, rolePermission, departmentPath } = req.body;
  const user = req.user;
  // 检查必填字段
  if (!username || !loginAccount || !loginPassword) {
    return res.status(400).json({
      success: false,
      message: '请填写所有必填字段：用户名、登录账号、登录密码'
    });
  }

  console.log(user)
  // 检查用户名和登录账号是否已存在
  const existingUser = await User.findOne({ 
    $or: [
      { username },
      { loginAccount }
    ]
  });

  if (existingUser) {
    const field = existingUser.username === username ? '用户名' : '登录账号';
    return res.status(400).json({
      success: false,
      message: `${field}已存在，请使用其他${field}`
    });
  }

  // 验证角色是否存在（如果提供了角色ID）
  let roleId = null;
  if (rolePermission) {
    const role = await Role.findById(rolePermission);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: '指定的角色不存在'
      });
    }
    roleId = role._id;
  }

  try {
    // 创建用户
    const user = await User.create({
      username,
      loginAccount,
      loginPassword,
      remark: remark || '',
      rolePermission: roleId,
      departmentPath: departmentPath || '',
      isActive: true, // 新创建的用户默认为活跃状态
      isAdmin: false // 新创建的用户默认不是管理员
    });

    // 获取带有角色信息的用户数据
    const userWithRole = await User.findById(user._id);

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: userWithRole
    });

  } catch (error) {
    // 处理数据库验证错误
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors
      });
    }
    
    throw error;
  }
});

// @desc    获取所有用户（管理员）
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || '';
  const role = req.query.role || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const user = req.user;

  // 构建查询条件
  let query = {
    _id: { $ne: user.id },
    isAdmin: false
  };

  query.$or = [];
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { loginAccount: { $regex: search, $options: 'i' } },
      { remark: { $regex: search, $options: 'i' } },
      { departmentPath: { $regex: search, $options: 'i' } },

    ];
  }

  // 非管理员用户，只能查看后代部门的员工和无部门员工（不包括自己部门）
  if (!user.isAdmin) {
    const departmentPath = (user.departmentPath || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 构建部门权限查询条件
    const departmentConditions = [];

    if (departmentPath) {
      // 可以查看后代部门的员工
      departmentConditions.push({
        departmentPath: { $regex: `^${departmentPath}->` } // 匹配所有后代部门
      });
    }

    // 总是可以查看无部门的员工
    departmentConditions.push(
      { departmentPath: '' },
      { departmentPath: { $exists: false } }
    );

    // 如果已经有搜索条件，需要合并
    if (query.$or && query.$or.length > 0) {
      // 将部门权限条件与搜索条件结合
      query.$and = [
        { $or: query.$or }, // 搜索条件
        { $or: departmentConditions } // 部门权限条件
      ];
      delete query.$or;
    } else {
      // 没有搜索条件，直接使用部门权限条件
      query.$or = departmentConditions;
    }
  }
  if (role) {
    query.rolePermission = role;
  }

  const startIndex = (page - 1) * limit;
  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .populate('rolePermission')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(startIndex);

  // 分页信息
  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalUsers: total,
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };

  res.json({
    success: true,
    count: users.length,
    pagination,
    data: users
  });
});

// @desc    获取当前用户信息
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('rolePermission');

  res.json({
    success: true,
    data: user
  });
});

// @desc    更新当前用户信息
// @route   PUT /api/users/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    username: req.body.username,
    remark: req.body.remark,
    departmentPath: req.body.departmentPath
  };

  // 移除空值
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  );

  res.json({
    success: true,
    message: '信息更新成功',
    data: user
  });
});

// @desc    修改密码
// @route   PUT /api/users/password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: '请提供当前密码和新密码'
    });
  }

  // 获取用户（包含密码字段）
  const user = await User.findById(req.user.id).select('+loginPassword');

  // 验证当前密码
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: '当前密码错误'
    });
  }

  // 更新密码
  user.loginPassword = newPassword;
  await user.save();

  // 生成新token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: '密码修改成功',
    token
  });
});

// @desc    获取单个用户
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('rolePermission');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户未找到'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    更新用户（管理员）
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    username: req.body.username,
    loginAccount: req.body.loginAccount,
    remark: req.body.remark,
    rolePermission: req.body.rolePermission,
    departmentPath: req.body.departmentPath,
    isActive: req.body.isActive,
    isAdmin: req.body.isAdmin
  };

  // 验证角色是否存在
  if (fieldsToUpdate.rolePermission) {
    const role = await Role.findById(fieldsToUpdate.rolePermission);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: '指定的角色不存在'
      });
    }
  }

  // 移除空值
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });
  fieldsToUpdate.departmentPath = req.body.departmentPath || '';

  const user = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  ).populate('rolePermission');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户未找到'
    });
  }

  res.json({
    success: true,
    message: '用户信息更新成功',
    data: user
  });
});

// @desc    删除用户（管理员）
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // 验证 ObjectId 格式
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: '无效的用户ID格式'
    });
  }
  
  const user = await User.findById(id);
  console.log(user)
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户未找到'
    });
  }

  // 防止删除管理员账户
  if (user.isAdmin && req.user.id === user.id) {
    return res.status(400).json({
      success: false,
      message: '不能删除自己的管理员账户'
    });
  }

  await User.findByIdAndDelete(id);

  res.json({
    success: true,
    message: '用户删除成功'
  });
});

// @desc    获取用户统计信息（管理员）
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const adminUsers = await User.countDocuments({ isAdmin: true });
  const regularUsers = await User.countDocuments({ isAdmin: false });

  // 最近30天注册用户
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  // 按角色权限统计
  const roleStats = await User.aggregate([
    {
      $lookup: {
        from: 'roles',
        localField: 'rolePermission',
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
      $group: {
        _id: '$rolePermission',
        count: { $sum: 1 },
        roleName: { $first: '$roleInfo.roleName' },
        roleId: { $first: '$roleInfo.roleId' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminUsers,
      regularUsers,
      recentUsers,
      roleStats
    }
  });
});

// @desc    批量添加用户到部门
// @route   PUT /api/users/add-to-department
// @access  Private/Admin
const addUserToDepartment = asyncHandler(async (req, res) => {
  const { userIds, departmentPath } = req.body;
  const currentUser = req.user;
  console.log(departmentPath)

  // 验证输入
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供有效的用户ID数组'
    });
  }

  if (!departmentPath || typeof departmentPath !== 'string') {
    return res.status(400).json({
      success: false,
      message: '请提供有效的部门路径'
    });
  }

  // 验证部门路径格式（根据规范要求A->B->C格式）
  if (departmentPath.trim() === '') {
    return res.status(400).json({
      success: false,
      message: '部门路径不能为空'
    });
  }

  try {
    // 验证所有用户ID是否存在
    const existingUsers = await User.find({ _id: { $in: userIds } });
    
    if (existingUsers.length !== userIds.length) {
      const foundIds = existingUsers.map(user => user._id.toString());
      const missingIds = userIds.filter(id => !foundIds.includes(id));
      
      return res.status(400).json({
        success: false,
        message: '以下用户ID不存在',
        missingIds
      });
    }

    // 批量更新用户的部门路径
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { 
        $set: { 
          departmentPath: departmentPath.trim(),
          updatedAt: new Date()
        } 
      }
    );

    // 获取更新后的用户信息
    const updatedUsers = await User.find({ _id: { $in: userIds } })
      .populate('rolePermission');

    res.json({
      success: true,
      message: `成功将 ${result.modifiedCount} 个用户添加到部门：${departmentPath}`,
      data: {
        modifiedCount: result.modifiedCount,
        departmentPath,
        users: updatedUsers
      }
    });

  } catch (error) {
    // 处理数据库验证错误
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors
      });
    }
    
    throw error;
  }
});


// @desc    获取没有部门的用户
// @route   PUT /api/users/getNoDepartmentUser
// @access 
const getNoDepartmentUser = asyncHandler(async (req, res) => {
  try {
    // 验证所有用户ID是否存在
    const userList  = await User.find({ departmentPath: '' });
   
    res.json({
      success: true,
      message: `获取成功`,
      data: {
        userList
      }
    });

  } catch (error) {
    // 处理数据库验证错误
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors
      });
    }
    throw error;
  }
});

module.exports = {
  login,
  getMe,
  updateMe,
  updatePassword,
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
  addUserToDepartment,
  getNoDepartmentUser
};