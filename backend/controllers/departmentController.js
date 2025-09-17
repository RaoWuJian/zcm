const Department = require('../models/Department');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');

// @desc    创建部门
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = asyncHandler(async (req, res) => {
  const { departmentName, description, parentId } = req.body;

  // 验证必填字段
  if (!departmentName) {
    return res.status(400).json({
      success: false,
      message: '请填写部门名称'
    });
  }

  const user = req.user;

  // 获取当前用户信息
  const isAdmin = user.isAdmin;

  // 确定父部门ID和路径构建逻辑
  let finalParentId = null;
  
  /**
   *  如果选择了父部门 新建的部门就必须要拼接在传过来的路径上，如创建部门C，传过来的路径是A->B, 拼接起来是A->B->C
   *  如果没有选择父部门，则需要根据当前用户的路径来，获取当前的用户部门路径是A->B， 拼接起来是A->B->C
   *  如果是Admin账号，并且没有传选父部门，则默认创建一级部门
  */
  
  if (parentId) {
    // 用户指定了父部门，验证父部门是否存在且有效
    const parentDepartment = await Department.findById(parentId);
    if (!parentDepartment) {
      return res.status(400).json({
        success: false,
        message: '指定的上级部门不存在'
      });
    }
    
    if (!parentDepartment.isActive) {
      return res.status(400).json({
        success: false,
        message: '指定的上级部门已禁用，不能在其下创建子部门'
      });
    }
    
    // 非管理员用户需要验证权限：只能在自己部门路径下创建子部门
    if (!isAdmin) {
      const userDepartmentPath = user.departmentPath || '';
      if (!userDepartmentPath) {
        return res.status(403).json({
          success: false,
          message: '权限不足，您没有部门归属，无法创建部门'
        });
      }
      
      // 检查指定的父部门是否在用户的部门路径范围内
      if (!parentDepartment.departmentPath.startsWith(userDepartmentPath)) {
        return res.status(403).json({
          success: false,
          message: '权限不足，您只能在自己部门及其子部门下创建新部门'
        });
      }
    }
    
    finalParentId = parentDepartment._id;
    
  } else {
    // 用户未指定父部门的情况
    if (isAdmin) {
      // 管理员没有指定父部门，创建一级部门（根部门）
      finalParentId = null;
    } else {
      // 非管理员用户，需要在其当前部门下创建子部门
      const userDepartmentPath = user.departmentPath || '';
      if (!userDepartmentPath) {
        return res.status(403).json({
          success: false,
          message: '权限不足，您没有部门归属，无法创建部门'
        });
      }
      
      // 查找用户当前的部门
      const userDepartment = await Department.findOne({ departmentPath: userDepartmentPath });
      if (!userDepartment) {
        return res.status(400).json({
          success: false,
          message: '您的部门信息有误，请联系管理员'
        });
      }
      
      if (!userDepartment.isActive) {
        return res.status(400).json({
          success: false,
          message: '您所在的部门已禁用，无法创建子部门'
        });
      }
      
      finalParentId = userDepartment._id;
    }
  }

  // 检查部门名称是否已存在（同级部门下不能有重名）
  // 构建预期的部门路径来检查重名
  let expectedPath;
  if (finalParentId) {
    const parentDept = await Department.findById(finalParentId);
    if (!parentDept) {
      return res.status(400).json({
        success: false,
        message: '父部门不存在'
      });
    }
    expectedPath = `${parentDept.departmentPath}->${departmentName}`;
  } else {
    expectedPath = departmentName;
  }

  // 查找是否已存在相同路径的部门
  const existingDept = await Department.findOne({ departmentPath: expectedPath });
  if (existingDept) {
    return res.status(400).json({
      success: false,
      message: '同级部门下已存在相同名称的部门'
    });
  }

  try {
    // 创建部门
    const department = await Department.create({
      departmentName,
      description: description || '',
      parentId: finalParentId,
      isActive: true
    });

    // 获取完整的部门信息
    const fullDepartment = await Department.findById(department._id)
      .populate('parentId', 'departmentName departmentCode');

    res.status(201).json({
      success: true,
      message: '部门创建成功',
      data: fullDepartment
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

// @desc    获取部门树形结构
// @route   GET /api/departments/tree
// @access  Private
const getDepartmentTree = asyncHandler(async (req, res) => {
  const isActive = req.query.isActive;
  const sortBy = req.query.sortBy || 'createdAt'; // 排序字段: level, createdAt, updatedAt, name
  const sortOrder = req.query.sortOrder || 'asc'; // 排序方向: asc, desc
  const user = req.user;
  const isAdmin = user.isAdmin;
  
  // 构建查询条件
  let query = {};
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  try {
    if (!isAdmin) {
      const path = (user.departmentPath || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (path) {
        query.$or = [
          { 
            departmentPath: { 
              $regex: `^${path}->` // 精确匹配直接子部门
            } 
          },
        ];
      }
    }

    // 构建排序条件
    let sortCondition = {};
    const order = sortOrder === 'desc' ? -1 : 1;

    switch (sortBy) {
      case 'createdAt':
        sortCondition.createdAt = order;
        break;
      case 'updatedAt':
        sortCondition.updatedAt = order;
        break;
      case 'name':
        sortCondition.departmentName = order;
        break;
      case 'level':
      default:
        sortCondition.level = order;
        sortCondition.departmentName = 1; // 二级排序按名称
        break;
    }

    // 获取所有部门
    const allDepartments = await Department.find(query)
      .sort(sortCondition);
    // 根据用户权限构建员工查询条件
    let userQuery = { isActive: true };
    
    
    
    if (!isAdmin) {
      // 非管理员用户，只能查看后代部门的员工和无部门员工（不包括自己部门）
      const departmentPath = (user.departmentPath || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

      userQuery.$or = departmentConditions;
    }
    // 获取符合权限的员工
    const allowedUsers = await User.find(userQuery)
      .populate('rolePermission', 'roleName')
      .select('-loginPassword');

    // 为每个部门添加关联的员工信息
    const departmentsWithEmployees = allDepartments.map(dept => {
      const deptObj = dept.toObject();
      
      // 查找属于该部门的员工（通过departmentPath匹配）
      const employees = allowedUsers.filter(user => {
        if (!user.departmentPath) return false;
        // 精确匹配部门路径或者是该部门的子部门员工
        return user.departmentPath === dept.departmentPath || 
               user.departmentPath.startsWith(dept.departmentPath + '->');
      });

      return {
        ...deptObj,
        employees: employees.map(user => ({
          _id: user._id,
          username: user.username,
          loginAccount: user.loginAccount,
          departmentPath: user.departmentPath,
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
    res.json({
      success: true,
      message: '获取部门树形结构成功',
      data: departmentsWithEmployees
    });

  } catch (error) {
    throw error;
  }
});

// @desc    获取所有部门列表（分页）
// @route   GET /api/departments
// @access  Private
const getDepartments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const search = req.query.search || '';
  const parentId = req.query.parentId || '';
  const isActive = req.query.isActive;
  const level = req.query.level;
  const includeEmployees = req.query.includeEmployees === 'true';
  const sortBy = req.query.sortBy || 'createdAt'; // 排序字段: level, createdAt, updatedAt, name
  const sortOrder = req.query.sortOrder || 'asc'; // 排序方向: asc, desc
  const user = req.user;

  // 构建查询条件
  let query = {};

  if (search) {
    query.$or = [
      { departmentName: { $regex: search, $options: 'i' } },
      { departmentCode: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { departmentPath: { $regex: search, $options: 'i' } }
    ];
  }

  if (parentId) {
    query.parentId = parentId === 'null' ? null : parentId;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (level) {
    query.level = parseInt(level);
  }

  const startIndex = (page - 1) * limit;
  const total = await Department.countDocuments(query);

  // 构建排序条件
  let sortCondition = {};
  const order = sortOrder === 'desc' ? -1 : 1;

  switch (sortBy) {
    case 'createdAt':
      sortCondition.createdAt = order;
      break;
    case 'updatedAt':
      sortCondition.updatedAt = order;
      break;
    case 'name':
      sortCondition.departmentName = order;
      break;
    case 'level':
    default:
      sortCondition.level = order;
      sortCondition.departmentName = 1; // 二级排序按名称
      break;
  }

  const departments = await Department.find(query)
    .populate('parentId', 'departmentName departmentCode')
    .sort(sortCondition)
    .limit(limit)
    .skip(startIndex);

  let departmentsWithStats = departments;

  // 如果需要包含员工信息
  if (includeEmployees) {
    
    // 根据用户权限构建员工查询条件
    let userQuery = { isActive: true };
    const isAdmin = user.isAdmin;
    
    if (!isAdmin) {
      // 非管理员用户，只能查看后代部门的员工和无部门员工（不包括自己部门）
      const departmentPath = (user.departmentPath || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

      userQuery.$or = departmentConditions;
    }
    // 管理员可以查看所有员工，不需要额外的查询条件
    
    // 获取符合权限的员工
    const allowedUsers = await User.find(userQuery)
      .populate('rolePermission', 'roleName')
      .select('-loginPassword')
      .sort({ username: 1 });
    
    // 为每个部门添加员工统计信息
    departmentsWithStats = departments.map((dept) => {
      const deptObj = dept.toObject();
      
      // 查找直属于该部门的员工
      const directEmployees = allowedUsers.filter(user => 
        user.departmentPath === dept.departmentPath
      );
      
      // 查找包括子部门在内的所有员工
      const allEmployees = allowedUsers.filter(user => {
        if (!user.departmentPath) return false;
        return user.departmentPath === dept.departmentPath || 
               user.departmentPath.startsWith(dept.departmentPath + '->');
      });
      
      return {
        ...deptObj,
        directEmployeeCount: directEmployees.length,
        totalEmployeeCount: allEmployees.length,
        employees: directEmployees.map(user => ({
          _id: user._id,
          username: user.username,
          loginAccount: user.loginAccount,
          departmentPath: user.departmentPath,
          rolePermission: user.rolePermission,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          remark: user.remark,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }))
      };
    });
  }

  // 分页信息
  const pagination = {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalDepartments: total,
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };

  res.json({
    success: true,
    count: departmentsWithStats.length,
    pagination,
    data: departmentsWithStats
  });
});

// @desc    获取单个部门详情
// @route   GET /api/departments/:id
// @access  Private
const getDepartment = asyncHandler(async (req, res) => {
  const user = req.user;
  const department = await Department.findById(req.params.id)
    .populate('parentId', 'departmentName departmentCode');

  if (!department) {
    return res.status(404).json({
      success: false,
      message: '部门不存在'
    });
  }

  // 获取子部门数量
  const childrenCount = await Department.countDocuments({ parentId: department._id });
  
  // 根据用户权限构建员工查询条件
  let userQuery = { isActive: true };
  const isAdmin = user.isAdmin;
  
  if (!isAdmin) {
    // 非管理员用户，只能查看后代部门的员工和无部门员工（不包括自己部门）
    const departmentPath = (user.departmentPath || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

    userQuery.$or = departmentConditions;
  }
  // 管理员可以查看所有员工，不需要额外的查询条件
  
  // 获取符合权限的员工
  const allowedUsers = await User.find(userQuery)
    .populate('rolePermission', 'roleName')
    .select('-loginPassword')
    .sort({ username: 1 });
  
  // 查找直属于该部门的员工（不包括子部门）
  const directEmployees = allowedUsers.filter(user => 
    user.departmentPath === department.departmentPath
  );
  
  // 查找包括子部门在内的所有员工
  const allEmployees = allowedUsers.filter(user => {
    if (!user.departmentPath) return false;
    return user.departmentPath === department.departmentPath || 
           user.departmentPath.startsWith(department.departmentPath + '->');
  });

  res.json({
    success: true,
    data: {
      ...department.toObject(),
      childrenCount,
      employeeCount: allEmployees.length,
      directEmployeeCount: directEmployees.length,
      employees: {
        direct: directEmployees.map(user => ({
          _id: user._id,
          username: user.username,
          loginAccount: user.loginAccount,
          departmentPath: user.departmentPath,
          rolePermission: user.rolePermission,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          remark: user.remark,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        })),
        all: allEmployees.map(user => ({
          _id: user._id,
          username: user.username,
          loginAccount: user.loginAccount,
          departmentPath: user.departmentPath,
          rolePermission: user.rolePermission,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          remark: user.remark,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }))
      }
    }
  });
});

// @desc    更新部门
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = asyncHandler(async (req, res) => {
  const { departmentName, description, parentId, isActive } = req.body;
  const user = req.user;

  const department = await Department.findById(req.params.id);
  if (!department) {
    return res.status(404).json({
      success: false,
      message: '部门不存在'
    });
  }

  // 获取当前用户信息
  const isAdmin = user.isAdmin;

  // 确定父部门ID和路径构建逻辑（与新增部门逻辑保持一致）
  let finalParentId = null;
  let finalParentDept = null;

  /**
   *  如果选择了父部门 更新的部门就必须要拼接在传过来的路径上，如更新部门C，传过来的路径是A->B, 拼接起来是A->B->C
   *  如果没有选择父部门，则需要根据当前用户的路径来，获取当前的用户部门路径是A->B， 拼接起来是A->B->C
   *  如果是Admin账号，并且没有传选父部门，则默认创建一级部门
  */
  if (parentId) {
    // 用户指定了父部门，验证父部门是否存在且有效
    const parentDepartment = await Department.findById(parentId);
    if (!parentDepartment) {
      return res.status(400).json({
        success: false,
        message: '指定的上级部门不存在'
      });
    }

    if (!parentDepartment.isActive) {
      return res.status(400).json({
        success: false,
        message: '指定的上级部门已禁用，不能作为上级部门'
      });
    }

    // 非管理员用户需要验证权限：只能在自己部门路径下操作
    if (!isAdmin) {
      const userDepartmentPath = user.departmentPath || '';
      if (!userDepartmentPath) {
        return res.status(403).json({
          success: false,
          message: '权限不足，您没有部门归属，无法修改部门'
        });
      }

      // 检查指定的父部门是否在用户的部门路径范围内
      if (!parentDepartment.departmentPath.startsWith(userDepartmentPath)) {
        return res.status(403).json({
          success: false,
          message: '权限不足，您只能在自己部门及其子部门范围内操作'
        });
      }
    }

    finalParentId = parentDepartment._id;
    finalParentDept = parentDepartment;

  } else {
    // parentId === null，没有传上级部门的情况
    if (isAdmin) {
      // 管理员：创建一级部门
      finalParentId = null;
      finalParentDept = null;
    } else {
      // 非管理员：拼接在当前用户部门路径后面
      const userDepartmentPath = user.departmentPath || '';
      if (!userDepartmentPath) {
        return res.status(403).json({
          success: false,
          message: '权限不足，您没有部门归属，无法修改部门'
        });
      }
      // 查找用户当前的部门
      const userDepartment = await Department.findOne({ departmentPath: userDepartmentPath });
      if (!userDepartment) {
        return res.status(400).json({
          success: false,
          message: '您的部门信息有误，请联系管理员'
        });
      }

      if (!userDepartment.isActive) {
        return res.status(400).json({
          success: false,
          message: '您所在的部门已禁用，无法在其下修改部门'
        });
      }

      console.log('非管理员将部门设置在用户部门下:', userDepartmentPath);
      finalParentId = userDepartment._id;
      finalParentDept = userDepartment;
    }
  }
  console.log(finalParentId)
  // 检查是否会造成循环引用
  if (finalParentId && finalParentDept) {
    if (finalParentDept.departmentPath.includes(department._id.toString())) {
      return res.status(400).json({
        success: false,
        message: '不能将部门设置为其子部门的子部门'
      });
    }
  }

  // 验证部门名称是否已存在（同级部门下不能有重名）
  // 检查是否需要更新父部门和路径
  const needsParentUpdate = (finalParentId !== department.parentId);
  const needsNameUpdate = (departmentName !== undefined && departmentName !== department.departmentName);

  if (needsParentUpdate || needsNameUpdate) {
    // 构建预期的部门路径来检查重名
    let expectedPath;
    const newDeptName = departmentName || department.departmentName;

    if (finalParentId) {
      if (!finalParentDept) {
        finalParentDept = await Department.findById(finalParentId);
        if (!finalParentDept) {
          return res.status(400).json({
            success: false,
            message: '父部门不存在'
          });
        }
      }
      expectedPath = `${finalParentDept.departmentPath}->${newDeptName}`;
    } else {
      expectedPath = newDeptName;
    }

    // 查找是否已存在相同路径的部门（排除当前部门）
    const existingDept = await Department.findOne({
      departmentPath: expectedPath,
      _id: { $ne: department._id }
    });

    if (existingDept) {
      return res.status(400).json({
        success: false,
        message: '同级部门下已存在相同名称的部门'
      });
    }
  }

  try {
    // 更新部门信息
    const fieldsToUpdate = {};
    if (departmentName !== undefined) fieldsToUpdate.departmentName = departmentName;
    if (description !== undefined) fieldsToUpdate.description = description;
    if (isActive !== undefined) fieldsToUpdate.isActive = isActive;

    if (needsParentUpdate || needsNameUpdate) {
      // 更新父部门ID
      fieldsToUpdate.parentId = finalParentId;

      // 重新构建部门路径
      const newDeptName = departmentName || department.departmentName;
      if (finalParentId && finalParentDept) {
        fieldsToUpdate.departmentPath = `${finalParentDept.departmentPath}->${newDeptName}`;
        fieldsToUpdate.level = finalParentDept.level + 1;
        console.log('设置为子部门，新路径:', fieldsToUpdate.departmentPath);
      } else {
        // 根部门（一级部门）
        fieldsToUpdate.departmentPath = newDeptName;
        fieldsToUpdate.level = 1;
        console.log('设置为一级部门，新路径:', fieldsToUpdate.departmentPath);
      }
    }

    const oldPath = department.departmentPath;
    
    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: false // 关闭验证器，因为我们手动处理路径
      }
    )
    .populate('parentId', 'departmentName departmentCode');

    // 如果路径发生了变化，需要更新所有子孙部门的路径
    if ((needsParentUpdate || needsNameUpdate) && oldPath !== updatedDepartment.departmentPath) {
      console.log('部门路径发生变化，更新子部门路径');
      console.log('旧路径:', oldPath);
      console.log('新路径:', updatedDepartment.departmentPath);
      await updateChildrenPaths(updatedDepartment, oldPath);
    }

    res.json({
      success: true,
      message: '部门更新成功',
      data: updatedDepartment
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

// @desc    删除部门
// @route   DELETE /api/departments/:id
// @access  Private/Admin
const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return res.status(404).json({
      success: false,
      message: '部门不存在'
    });
  }

  try {
    // 递归删除部门及其所有子孙部门
    await deleteDepartmentAndChildren(department);

    res.json({
      success: true,
      message: '部门及其子部门删除成功'
    });

  } catch (error) {
    throw error;
  }
});

// 辅助函数：递归删除部门及其所有子孙部门和相关员工部门路径
const deleteDepartmentAndChildren = async (department) => {
  // 1. 查找所有子孙部门（包括当前部门）
  const escapedPath = department.departmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const departmentsToDelete = await Department.find({
    $or: [
      { _id: department._id }, // 当前部门
      { departmentPath: { $regex: `^${escapedPath}->` } } // 所有子孙部门
    ]
  });

  // 2. 更新所有相关员工的departmentPath为空字符串
  // 查找所有属于这些部门的员工
  const departmentPaths = departmentsToDelete.map(dept => dept.departmentPath);
  await User.updateMany(
    { departmentPath: { $in: departmentPaths } },
    { $set: { departmentPath: '' } }
  );

  // 3. 批量删除所有部门
  const departmentIds = departmentsToDelete.map(dept => dept._id);
  await Department.deleteMany({ _id: { $in: departmentIds } });
  
  return {
    deletedDepartments: departmentsToDelete.length,
    updatedEmployees: await User.countDocuments({ departmentPath: '' })
  };
};

// 辅助函数：更新子部门的路径和员工的部门路径
const updateChildrenPaths = async (department, oldPath) => {

  // 查找所有以老路径开头的子孙部门
  const escapedOldPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const childrenPattern = new RegExp(`^${escapedOldPath}->`);

  const allChildren = await Department.find({
    departmentPath: { $regex: childrenPattern }
  });

  // 批量更新所有子孙部门的路径
  const bulkOps = allChildren.map(child => {
    // 替换路径中的老部分
    const newPath = child.departmentPath.replace(oldPath, department.departmentPath);
    // 计算新的层级
    const newLevel = (newPath.match(/->/g) || []).length + 1;

    return {
      updateOne: {
        filter: { _id: child._id },
        update: {
          departmentPath: newPath,
          level: newLevel
        }
      }
    };
  });

  if (bulkOps.length > 0) {
    await Department.bulkWrite(bulkOps);
  }

  // 更新当前部门及其所有子部门下的员工的部门路径
  // 1. 更新当前部门的员工
  await User.updateMany(
    { departmentPath: oldPath },
    { departmentPath: department.departmentPath }
  );

  // 2. 更新所有子部门的员工
  const allAffectedUsers = await User.find({
    departmentPath: { $regex: childrenPattern }
  });

  const userBulkOps = allAffectedUsers.map(user => {
    const newUserPath = user.departmentPath.replace(oldPath, department.departmentPath);

    return {
      updateOne: {
        filter: { _id: user._id },
        update: {
          departmentPath: newUserPath
        }
      }
    };
  });

  if (userBulkOps.length > 0) {
    await User.bulkWrite(userBulkOps);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentTree,
  getDepartment,
  updateDepartment,
  deleteDepartment
};