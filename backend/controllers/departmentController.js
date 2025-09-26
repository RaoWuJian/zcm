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
    
    // 非管理员用户需要验证权限：只能在自己部门及其子部门下创建新部门
    if (!isAdmin) {
      const DepartmentPermissionManager = require('../utils/departmentPermission');

      // 使用新的部门权限管理器检查用户是否有权限在指定部门下创建子部门
      const hasPermission = await DepartmentPermissionManager.canCreateDepartmentUnder(user, parentDepartment._id);

      if (!hasPermission) {
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
      const userDepartmentIds = user.getDepartmentIds ? user.getDepartmentIds() : [];

      let userDepartment = null;

      if (userDepartmentIds.length > 0) {
        // 使用departmentIds，默认使用用户的第一个部门作为创建子部门的父部门
        userDepartment = await Department.findById(userDepartmentIds[0]);
      }

      if (!userDepartment) {
        return res.status(403).json({
          success: false,
          message: '权限不足，您没有部门归属，无法创建部门'
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
  const existingDept = await Department.findOne({
    departmentName,
    parentId: finalParentId
  });
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
  const includeChildren = req.query.includeChildren !== 'false'; // 默认包含下级部门
  const includeEmployees = req.query.includeEmployees !== 'false'; // 默认包含员工信息
  const user = req.user;
  const isAdmin = user.isAdmin;

  try {
    let departmentsWithEmployees = [];

    if (isAdmin) {
      // 管理员可以查看所有部门
      let query = {};
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const allDepartments = await Department.find(query)
        .sort({ level: 1, departmentName: 1 });

      if (includeEmployees) {
        // 获取所有员工
        const allUsers = await User.find({ isActive: true })
          .populate('rolePermission', 'roleName')
          .select('-loginPassword')
          .sort({ username: 1 });

        // 为每个部门添加员工信息
        departmentsWithEmployees = allDepartments.map(dept => {
          const deptObj = dept.toObject();

          // 查找属于该部门的员工
          const employees = allUsers.filter(user => {
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
      } else {
        departmentsWithEmployees = allDepartments.map(dept => dept.toObject());
      }
    } else {
      // 非管理员用户，基于departmentIds获取有权限的部门
      const userDepartmentIds = user.getDepartmentIds();

      if (userDepartmentIds.length === 0) {
        return res.json({
          success: true,
          message: '获取部门树形结构成功',
          data: []
        });
      }

      // 使用新的基于departmentIds的方法获取部门树
      departmentsWithEmployees = await Department.getTreeByUserDepartments(
        userDepartmentIds,
        {
          includeChildren,
          includeEmployees,
          isActive: isActive !== undefined ? isActive === 'true' : undefined
        }
      );
    }

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
      { description: { $regex: search, $options: 'i' } }
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
      // 非管理员用户，只能查看有权限的部门的员工
      const userDepartmentIds = user.getDepartmentIds ? user.getDepartmentIds() : [];

      if (userDepartmentIds.length > 0) {
        // 获取用户有权限查看的所有下级部门
        const allowedDepartmentIds = [];

        for (const deptId of userDepartmentIds) {
          const userDept = await Department.findById(deptId);
          if (userDept) {
            const descendants = await userDept.getAllDescendants();
            allowedDepartmentIds.push(...descendants.map(d => d._id));
          }
        }

        userQuery.departmentIds = { $in: allowedDepartmentIds };
      } else {
        // 如果用户没有部门权限，则不能查看任何员工
        userQuery.departmentIds = { $in: [] };
      }
    }
    // 管理员可以查看所有员工，不需要额外的查询条件
    
    // 获取符合权限的员工
    const allowedUsers = await User.find(userQuery)
      .populate('rolePermission', 'roleName')
      .select('-loginPassword')
      .sort({ username: 1 });
    
    // 为每个部门添加员工统计信息
    departmentsWithStats = [];
    for (const dept of departments) {
      const deptObj = dept.toObject();

      // 查找直属于该部门的员工
      const directEmployees = allowedUsers.filter(user => {
        if (user.departmentIds && user.departmentIds.length > 0) {
          return user.departmentIds.some(id => id.toString() === dept._id.toString());
        }
        return false;
      });

      // 查找包括子部门在内的所有员工（需要递归获取子部门）
      const allDeptIds = [dept._id];
      const children = await dept.getAllDescendants();
      allDeptIds.push(...children.map(child => child._id));

      const allEmployees = allowedUsers.filter(user => {
        if (user.departmentIds && user.departmentIds.length > 0) {
          return user.departmentIds.some(id =>
            allDeptIds.some(deptId => deptId.toString() === id.toString())
          );
        }
        return false;
      });

      departmentsWithStats.push({
        ...deptObj,
        directEmployeeCount: directEmployees.length,
        totalEmployeeCount: allEmployees.length,
        employees: directEmployees.map(user => ({
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
        }))
      });
    }
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
    // 非管理员用户，只能查看有权限的部门的员工
    const userDepartmentIds = user.getDepartmentIds ? user.getDepartmentIds() : [];

    if (userDepartmentIds.length > 0) {
      // 获取用户有权限查看的所有下级部门
      const allowedDepartmentIds = [];

      for (const deptId of userDepartmentIds) {
        const userDept = await Department.findById(deptId);
        if (userDept) {
          const descendants = await userDept.getAllDescendants();
          allowedDepartmentIds.push(...descendants.map(d => d._id));
        }
      }

      userQuery.departmentIds = { $in: allowedDepartmentIds };
    } else {
      // 如果用户没有部门权限，则不能查看任何员工
      userQuery.departmentIds = { $in: [] };
    }
  }
  // 管理员可以查看所有员工，不需要额外的查询条件
  
  // 获取符合权限的员工
  const allowedUsers = await User.find(userQuery)
    .populate('rolePermission', 'roleName')
    .select('-loginPassword')
    .sort({ username: 1 });
  
  // 查找直属于该部门的员工（不包括子部门）
  const directEmployees = allowedUsers.filter(user => {
    if (user.departmentIds && user.departmentIds.length > 0) {
      return user.departmentIds.some(id => id.toString() === department._id.toString());
    }
    return false;
  });

  // 查找包括子部门在内的所有员工（需要递归获取子部门）
  const allDeptIds = [department._id];
  const children = await department.getAllDescendants();
  allDeptIds.push(...children.map(child => child._id));

  const allEmployees = allowedUsers.filter(user => {
    if (user.departmentIds && user.departmentIds.length > 0) {
      return user.departmentIds.some(id =>
        allDeptIds.some(deptId => deptId.toString() === id.toString())
      );
    }
    return false;
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
          departmentIds: user.departmentIds,
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
          departmentIds: user.departmentIds,
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

    // 非管理员用户需要验证权限：只能在自己部门及其子部门范围内操作
    if (!isAdmin) {
      const DepartmentPermissionManager = require('../utils/departmentPermission');

      // 使用新的部门权限管理器检查用户是否有权限在指定部门下操作
      const hasPermission = await DepartmentPermissionManager.canCreateDepartmentUnder(user, parentDepartment._id);

      if (!hasPermission) {
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
      // 非管理员：在用户部门下创建
      const userDepartmentIds = user.getDepartmentIds ? user.getDepartmentIds() : [];

      if (userDepartmentIds.length === 0) {
        return res.status(403).json({
          success: false,
          message: '权限不足，您没有部门归属，无法修改部门'
        });
      }

      // 使用用户的第一个部门
      const userDepartment = await Department.findById(userDepartmentIds[0]);
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

      finalParentId = userDepartment._id;
      finalParentDept = userDepartment;
    }
  }

  // 检查是否会造成循环引用
  if (finalParentId) {
    const checkCircularReference = async (parentId, childId, DepartmentModel) => {
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
    };

    const isCircular = await checkCircularReference(finalParentId, department._id, Department);
    if (isCircular) {
      return res.status(400).json({
        success: false,
        message: '不能将部门设置为其子部门的子部门'
      });
    }
  }

  // 验证部门名称是否已存在（同级部门下不能有重名）
  const needsParentUpdate = (finalParentId !== department.parentId);
  const needsNameUpdate = (departmentName !== undefined && departmentName !== department.departmentName);

  if (needsParentUpdate || needsNameUpdate) {
    const newDeptName = departmentName || department.departmentName;

    // 查找是否已存在相同名称的部门在同级（排除当前部门）
    const existingDept = await Department.findOne({
      departmentName: newDeptName,
      parentId: finalParentId,
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

    if (needsParentUpdate) {
      // 更新父部门ID
      fieldsToUpdate.parentId = finalParentId;

      // 重新计算层级
      if (finalParentId && finalParentDept) {
        fieldsToUpdate.level = finalParentDept.level + 1;
      } else {
        // 根部门（一级部门）
        fieldsToUpdate.level = 1;
      }
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('parentId', 'departmentName departmentCode');

    // 如果父部门发生了变化，需要更新所有子部门的层级
    if (needsParentUpdate) {
      await updateChildrenLevels(updatedDepartment);
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

// 辅助函数：递归删除部门及其所有子孙部门和相关员工部门关联
const deleteDepartmentAndChildren = async (department) => {
  // 1. 查找所有子孙部门（包括当前部门）
  const departmentsToDelete = await getAllDescendantsIncludingSelf(department);

  // 2. 从员工的departmentIds中移除这些部门ID
  const departmentIds = departmentsToDelete.map(dept => dept._id);

  // 更新所有相关员工，从其departmentIds中移除被删除的部门ID
  await User.updateMany(
    { departmentIds: { $in: departmentIds } },
    { $pull: { departmentIds: { $in: departmentIds } } }
  );

  // 3. 批量删除所有部门
  await Department.deleteMany({ _id: { $in: departmentIds } });

  return {
    deletedDepartments: departmentsToDelete.length,
    updatedEmployees: await User.countDocuments({
      departmentIds: { $in: departmentIds }
    })
  };
};

// 辅助函数：获取部门及其所有子孙部门
const getAllDescendantsIncludingSelf = async (department) => {
  const result = [department];
  const descendants = await department.getAllDescendants();
  result.push(...descendants);
  return result;
};

// 辅助函数：更新子部门的层级
const updateChildrenLevels = async (department) => {
  const children = await department.getAllDescendants();

  if (children.length === 0) return;

  // 批量更新所有子部门的层级
  const bulkOps = [];

  // 创建一个递归函数来计算正确的层级
  const calculateLevel = async (dept) => {
    if (!dept.parentId) return 1;

    const parent = await Department.findById(dept.parentId);
    if (!parent) return 1;

    return parent.level + 1;
  };

  for (const child of children) {
    const newLevel = await calculateLevel(child);

    if (child.level !== newLevel) {
      bulkOps.push({
        updateOne: {
          filter: { _id: child._id },
          update: { level: newLevel }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await Department.bulkWrite(bulkOps);
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