const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const { asyncHandler } = require('../middleware/error');
const DepartmentPermissionManager = require('../utils/departmentPermission');

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

  if (!loginAccount || !loginPassword) {
    let message = '请输入登录账号名和密码';
    if (!loginAccount && !loginPassword) {
      message = '请输入登录账号名和密码';
    } else if (!loginAccount) {
      message = '请输入登录账号名';
    } else if (!loginPassword) {
      message = '请输入登录密码';
    }

    return res.status(400).json({
      success: false,
      message: message
    });
  }

  if (loginAccount.length < 3) {
    return res.status(400).json({
      success: false,
      message: '登录账号名至少3个字符'
    });
  }

  if (loginAccount.length > 30) {
    return res.status(400).json({
      success: false,
      message: '登录账号名最多30个字符'
    });
  }

  if (loginPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: '密码至少6个字符'
    });
  }

  const user = await User.findOne({ loginAccount })
    .select('+loginPassword')
    .populate('rolePermission')
    .populate('departmentIds');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: '登录账号名或密码错误'
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: '账户已被禁用，请联系管理员'
    });
  }

  const isMatch = await user.matchPassword(loginPassword);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: '登录账号名或密码错误'
    });
  }

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

// @desc    创建用户
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { username, loginAccount, loginPassword, remark, rolePermission, departmentIds = [] } = req.body;

  const missingFields = [];
  if (!username) missingFields.push('员工姓名');
  if (!loginAccount) missingFields.push('登录账号');
  if (!loginPassword) missingFields.push('登录密码');
  if (!rolePermission) missingFields.push('员工角色');
  if (!departmentIds.length) missingFields.push('所属部门');

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `请填写以下必填字段：${missingFields.join('、')}`
    });
  }

  // 验证字段格式
  if (username.length < 2 || username.length > 50) {
    return res.status(400).json({
      success: false,
      message: '员工姓名长度应在2-50个字符之间'
    });
  }

  if (loginAccount.length < 3 || loginAccount.length > 30) {
    return res.status(400).json({
      success: false,
      message: '登录账号长度应在3-30个字符之间'
    });
  }

  if (loginPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: '登录密码至少6个字符'
    });
  }

  if (remark && remark.length > 200) {
    return res.status(400).json({
      success: false,
      message: '备注最多200个字符'
    });
  }

  // 检查用户名和登录账号是否已存在
  const existingUser = await User.findOne({
    $or: [{ username }, { loginAccount }]
  });

  if (existingUser) {
    const field = existingUser.username === username ? '用户名' : '登录账号';
    return res.status(400).json({
      success: false,
      message: `${field}已存在，请使用其他${field}`
    });
  }

  // 验证角色是否存在
  const role = await Role.findById(rolePermission);
  if (!role) {
    return res.status(400).json({
      success: false,
      message: '指定的角色不存在'
    });
  }

  // 验证部门ID是否存在
  const validDepartmentIds = [];
  for (const departmentId of departmentIds) {
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: `部门ID ${departmentId} 不存在`
      });
    }
    validDepartmentIds.push(departmentId);
  }

  try {
    const user = await User.create({
      username,
      loginAccount,
      loginPassword,
      remark: remark || '',
      rolePermission,
      departmentIds: validDepartmentIds,
      isActive: true,
      isAdmin: false
    });

    const userWithDetails = await User.findById(user._id)
      .populate('rolePermission')
      .populate('departmentIds');

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: userWithDetails
    });

  } catch (error) {
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

// @desc    获取所有用户
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || '';
  const departmentId = req.query.departmentId || '';
  const role = req.query.role || '';
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const user = req.user;

  let query = {
    _id: { $ne: user.id },
    isAdmin: false
  };

  // 按部门筛选
  if (departmentId) {
    query.departmentIds = departmentId;
  }

  const searchConditions = [];
  if (search) {
    searchConditions.push(
      { username: { $regex: search, $options: 'i' } },
      { loginAccount: { $regex: search, $options: 'i' } },
      { remark: { $regex: search, $options: 'i' } }
    );
  }

  if (searchConditions.length > 0) {
    query.$or = searchConditions;
  }

  // 非管理员用户权限过滤
  if (!user.isAdmin) {
    const accessibleUserIds = await DepartmentPermissionManager.getAccessibleUserIds(user);
    query._id = { $in: accessibleUserIds, $ne: user._id };
  }

  if (role) {
    query.rolePermission = role;
  }

  const startIndex = (page - 1) * limit;
  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .populate('rolePermission')
    .populate('departmentIds')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(startIndex);

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
  const user = await User.findById(req.user.id)
    .populate('rolePermission')
    .populate('departmentIds');

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
    remark: req.body.remark
  };

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
  ).populate('rolePermission')
   .populate('departmentIds');

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

  const user = await User.findById(req.user.id).select('+loginPassword');

  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: '当前密码错误'
    });
  }

  user.loginPassword = newPassword;
  await user.save();

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
  const user = await User.findById(req.params.id)
    .populate('rolePermission')
    .populate('departmentIds');

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

// @desc    更新用户
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { departmentIds = [], loginPassword } = req.body;

  // 如果需要更新密码，使用 save() 方法以触发密码加密中间件
  if (loginPassword) {
    // 验证密码长度
    if (loginPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '登录密码至少6个字符'
      });
    }

    // 查找用户
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户未找到'
      });
    }

    // 更新用户信息
    if (req.body.username !== undefined) user.username = req.body.username;
    if (req.body.loginAccount !== undefined) user.loginAccount = req.body.loginAccount;
    if (req.body.remark !== undefined) user.remark = req.body.remark;
    if (req.body.rolePermission !== undefined) {
      // 验证角色是否存在
      const role = await Role.findById(req.body.rolePermission);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: '指定的角色不存在'
        });
      }
      user.rolePermission = req.body.rolePermission;
    }
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
    if (req.body.isAdmin !== undefined) user.isAdmin = req.body.isAdmin;

    // 验证并更新部门ID
    if (departmentIds.length > 0) {
      for (const departmentId of departmentIds) {
        const department = await Department.findById(departmentId);
        if (!department) {
          return res.status(400).json({
            success: false,
            message: `部门ID ${departmentId} 不存在`
          });
        }
      }
      user.departmentIds = departmentIds;
    }

    // 更新密码
    user.loginPassword = loginPassword;

    // 保存用户（会触发密码加密中间件）
    await user.save();

    // 重新查询以获取populated数据
    const updatedUser = await User.findById(user._id)
      .populate('rolePermission')
      .populate('departmentIds');

    return res.json({
      success: true,
      message: '用户信息更新成功',
      data: updatedUser
    });
  }

  // 如果不更新密码，使用 findByIdAndUpdate
  const fieldsToUpdate = {
    username: req.body.username,
    loginAccount: req.body.loginAccount,
    remark: req.body.remark,
    rolePermission: req.body.rolePermission,
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

  // 验证部门ID是否存在
  if (departmentIds.length > 0) {
    for (const departmentId of departmentIds) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: `部门ID ${departmentId} 不存在`
        });
      }
    }
    fieldsToUpdate.departmentIds = departmentIds;
  }

  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  ).populate('rolePermission')
   .populate('departmentIds');

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

// @desc    删除用户
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: '无效的用户ID格式'
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户未找到'
    });
  }

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

// @desc    获取用户统计信息
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const adminUsers = await User.countDocuments({ isAdmin: true });
  const regularUsers = await User.countDocuments({ isAdmin: false });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

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
  const { userIds, departmentId } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供有效的用户ID数组'
    });
  }

  if (!departmentId) {
    return res.status(400).json({
      success: false,
      message: '请提供有效的部门ID'
    });
  }

  // 验证部门是否存在
  const department = await Department.findById(departmentId);
  if (!department) {
    return res.status(400).json({
      success: false,
      message: '部门不存在'
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

    // 批量更新用户的部门
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      {
        $addToSet: { departmentIds: departmentId },
        $set: { updatedAt: new Date() }
      }
    );

    // 获取更新后的用户信息
    const updatedUsers = await User.find({ _id: { $in: userIds } })
      .populate('rolePermission')
      .populate('departmentIds');

    res.json({
      success: true,
      message: `成功将 ${result.modifiedCount} 个用户添加到部门：${department.departmentName}`,
      data: {
        modifiedCount: result.modifiedCount,
        department,
        users: updatedUsers
      }
    });

  } catch (error) {
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
// @route   GET /api/users/getNoDepartmentUser
// @access  Private
const getNoDepartmentUser = asyncHandler(async (req, res) => {
  try {
    const userList = await User.find({
      $or: [
        { departmentIds: { $exists: false } },
        { departmentIds: { $size: 0 } }
      ]
    }).populate('rolePermission');

    res.json({
      success: true,
      message: '获取成功',
      data: {
        userList
      }
    });

  } catch (error) {
    throw error;
  }
});

// @desc    获取所有用户用于汇报人和抄送人选择
// @route   GET /api/users/for-report
// @access  Private
const getUsersForReport = asyncHandler(async (req, res) => {
  const { search = '', limit = 50 } = req.query;
  const currentUserId = req.user._id;

  try {
    let query = {
      _id: { $ne: currentUserId },
      isActive: true
    };

    if (!req.user.isAdmin) {
      const accessibleUserIds = await DepartmentPermissionManager.getAccessibleUserIds(req.user);
      query._id = { $in: accessibleUserIds.filter(id => !id.equals(currentUserId)) };
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { loginAccount: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('username loginAccount departmentIds')
      .populate('departmentIds', 'departmentName')
      .sort({ username: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// @desc    获取上级部门人员
// @route   GET /api/users/superiors
// @access  Private
const getSuperiorUsers = asyncHandler(async (req, res) => {
  try {
    console.log('获取上级用户推荐 - 用户ID:', req.user._id);
    const currentUser = await User.findById(req.user._id).populate('departmentIds');
    console.log('当前用户:', currentUser?.username, '部门数量:', currentUser?.departmentIds?.length);

    const superiorUsers = [];

    // 1. 首先添加所有管理员用户（管理员可以作为任何人的汇报人）
    const adminUsers = await User.find({
      isAdmin: true,
      isActive: true,
      _id: { $ne: currentUser._id } // 排除当前用户自己
    }).select('username loginAccount');

    superiorUsers.push(...adminUsers.map(user => ({
      _id: user._id,
      username: user.username,
      loginAccount: user.loginAccount,
      relation: '管理员',
      departmentName: '系统管理员'
    })));

    // 2. 如果用户有部门信息，继续查找部门上级
    if (currentUser && currentUser.departmentIds && currentUser.departmentIds.length > 0) {
      // 获取当前用户所在的部门
      for (const department of currentUser.departmentIds) {

        // 获取直属上级部门的人员
        if (department.parentId) {
          try {
            const parentDept = await Department.findById(department.parentId);

            if (parentDept) {
              const parentUsers = await User.find({
                departmentIds: parentDept._id,
                isActive: true,
                _id: { $ne: currentUser._id } // 排除当前用户自己
              }).select('username loginAccount departmentIds');

              superiorUsers.push(...parentUsers.map(user => ({
                _id: user._id,
                username: user.username,
                loginAccount: user.loginAccount,
                relation: '上级部门',
                departmentName: parentDept.departmentName
              })));

              // 获取上上级部门的人员
              if (parentDept.parentId) {
                try {
                  const grandParentDept = await Department.findById(parentDept.parentId);

                  if (grandParentDept) {
                    const grandParentUsers = await User.find({
                      departmentIds: grandParentDept._id,
                      isActive: true,
                      _id: { $ne: currentUser._id } // 排除当前用户自己
                    }).select('username loginAccount departmentIds');

                    superiorUsers.push(...grandParentUsers.map(user => ({
                      _id: user._id,
                      username: user.username,
                      loginAccount: user.loginAccount,
                      relation: '上上级部门',
                      departmentName: grandParentDept.departmentName
                    })));
                  }
                } catch (grandParentError) {
                  console.error('获取上上级部门失败:', grandParentError);
                  // 继续处理，不中断整个流程
                }
              }
            }
          } catch (parentError) {
            console.error('获取上级部门失败:', parentError);
            // 继续处理，不中断整个流程
          }
        } else {
          console.log('部门没有上级部门');
        }
      }
    } else {
      console.log('用户没有部门信息，只返回管理员用户');
    }

    // 去重并按部门分组
    const uniqueUsers = [];
    const userMap = new Map();

    superiorUsers.forEach(user => {
      const key = user._id.toString();
      if (!userMap.has(key)) {
        userMap.set(key, user);
        uniqueUsers.push(user);
      }
    });

    res.json({
      success: true,
      data: uniqueUsers
    });

  } catch (error) {
    console.error('获取上级人员失败:', error);
    res.status(500).json({
      success: false,
      message: '获取上级人员失败'
    });
  }
});

// @desc    用户登出
// @route   POST /api/users/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

// @desc    获取所有用户用于日报汇报人选择（支持远程搜索）
// @route   GET /api/users/reporters
// @access  Private
const getReporters = asyncHandler(async (req, res) => {
  const {
    search = '',
    limit = 50,
    isActive = 'true'
  } = req.query;
  const user = req.user;
  // 构建查询条件
  let query = {
     _id: { $ne: user.id },
  };

  // 只获取活跃用户
  if (isActive === 'true') {
    query.isActive = true;
  }

  // 搜索条件
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { loginAccount: { $regex: search, $options: 'i' } },
      { remark: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    // 获取用户列表，只返回必要字段
    const users = await User.find(query)
      .select('_id username loginAccount remark departmentIds isActive')
      .populate('departmentIds', 'departmentName')
      .sort({ username: 1 })
      .limit(parseInt(limit));

    // 格式化返回数据
    const formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      loginAccount: user.loginAccount,
      remark: user.remark,
      departmentNames: user.departmentIds?.map(dept => dept.departmentName).join(', ') || '',
      isActive: user.isActive
    }));

    res.json({
      success: true,
      data: formattedUsers,
      count: formattedUsers.length,
      message: search ? `搜索到 ${formattedUsers.length} 个用户` : `获取到 ${formattedUsers.length} 个用户`
    });
  } catch (error) {
    console.error('获取汇报人列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取汇报人列表失败',
      error: error.message
    });
  }
});

module.exports = {
  login,
  logout,
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
  getNoDepartmentUser,
  getUsersForReport,
  getSuperiorUsers,
  getReporters
};