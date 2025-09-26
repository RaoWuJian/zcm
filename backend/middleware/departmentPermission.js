/**
 * 部门权限中间件
 *
 * 提供统一的部门权限检查中间件
 * 支持多部门权限模型
 */

const DepartmentPermissionManager = require('../utils/departmentPermission');
const { asyncHandler } = require('./error');

/**
 * 创建记录权限检查中间件
 *
 * @param {Function} ModelClass - Mongoose 模型类
 * @param {Object} options - 配置选项
 * @param {string} options.paramName - 参数名称，默认 'id'
 * @param {string} options.recordName - 记录类型名称，用于错误消息
 * @param {string} options.populateCreatedBy - 是否填充创建者信息，默认 true
 * @returns {Function} Express 中间件
 */
const requireRecordAccess = (ModelClass, options = {}) => {
  const {
    paramName = 'id',
    recordName = '记录',
    populateCreatedBy = true
  } = options;

  return asyncHandler(async (req, res, next) => {
    const recordId = req.params[paramName];
    const user = req.user;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        message: `缺少${recordName}ID参数`
      });
    }

    // 查询记录
    let query = ModelClass.findById(recordId);
    if (populateCreatedBy) {
      query = query.populate('createdBy', 'username departmentIds departmentPath');
    }

    const record = await query;

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `${recordName}不存在`
      });
    }

    // 权限检查
    const hasAccess = await DepartmentPermissionManager.hasAccessToRecord(user, record);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `无权限访问此${recordName}`
      });
    }

    // 将记录附加到请求对象
    req.record = record;
    req[`${recordName.toLowerCase()}Record`] = record;

    next();
  });
};

/**
 * 创建批量记录权限检查中间件
 *
 * @param {Function} ModelClass - Mongoose 模型类
 * @param {Object} options - 配置选项
 * @returns {Function} Express 中间件
 */
const requireBatchRecordAccess = (ModelClass, options = {}) => {
  const { recordName = '记录' } = options;

  return asyncHandler(async (req, res, next) => {
    const { ids } = req.body;
    const user = req.user;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: `请提供要操作的${recordName}ID列表`
      });
    }

    // 查询所有记录
    const records = await ModelClass.find({ _id: { $in: ids } })
      .populate('createdBy', 'username departmentIds departmentPath');

    if (records.length !== ids.length) {
      return res.status(404).json({
        success: false,
        message: `部分${recordName}不存在`
      });
    }

    // 批量权限检查
    const accessibleRecords = await DepartmentPermissionManager.filterAccessibleRecords(user, records);

    if (accessibleRecords.length !== records.length) {
      const inaccessibleCount = records.length - accessibleRecords.length;
      return res.status(403).json({
        success: false,
        message: `有 ${inaccessibleCount} 个${recordName}无权限访问`
      });
    }

    // 将记录附加到请求对象
    req.records = accessibleRecords;

    next();
  });
};

/**
 * 查询权限过滤中间件
 * 自动为查询添加权限过滤条件
 */
const applyQueryPermissionFilter = asyncHandler(async (req, res, next) => {
  const user = req.user;

  // 构建权限查询条件
  const permissionQuery = await DepartmentPermissionManager.buildAccessibleUserQuery(user);

  // 将权限过滤条件附加到请求对象
  req.permissionFilter = permissionQuery;

  next();
});

/**
 * 部门管理权限检查中间件
 * 检查用户是否有权限管理指定部门
 */
const requireDepartmentManageAccess = asyncHandler(async (req, res, next) => {
  const { departmentId } = req.params;
  const user = req.user;

  // 管理员可以管理所有部门
  if (user.isAdmin) {
    return next();
  }

  // 检查用户是否属于该部门或其父部门
  const userDepartmentIds = DepartmentPermissionManager.getUserDepartmentIds(user);

  if (userDepartmentIds.length === 0) {
    return res.status(403).json({
      success: false,
      message: '您没有部门管理权限'
    });
  }

  // 获取用户的所有可管理部门（包括下属部门）
  const managableDepartmentIds = await DepartmentPermissionManager.getSubordinateDepartmentIds(userDepartmentIds);

  if (!managableDepartmentIds.some(id => id.toString() === departmentId)) {
    return res.status(403).json({
      success: false,
      message: '您没有权限管理此部门'
    });
  }

  next();
});

/**
 * 用户管理权限检查中间件
 * 检查是否有权限管理指定用户
 */
const requireUserManageAccess = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const currentUser = req.user;

  // 管理员可以管理所有用户
  if (currentUser.isAdmin) {
    return next();
  }

  // 用户可以管理自己
  if (currentUser._id.toString() === userId) {
    return next();
  }

  // 检查目标用户
  const targetUser = await require('../models/User')
    .findById(userId)
    .select('departmentIds departmentPath');

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: '目标用户不存在'
    });
  }

  // 检查权限
  const hasAccess = await DepartmentPermissionManager.hasAccessToRecord(
    currentUser,
    { createdBy: targetUser }
  );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: '您没有权限管理此用户'
    });
  }

  next();
});

/**
 * 条件权限检查中间件
 * 根据条件动态应用权限检查
 */
const conditionalPermissionCheck = (condition) => {
  return asyncHandler(async (req, res, next) => {
    const shouldCheck = typeof condition === 'function'
      ? await condition(req, res)
      : condition;

    if (shouldCheck) {
      return applyQueryPermissionFilter(req, res, next);
    }

    next();
  });
};

/**
 * 数据所有者或上级权限中间件
 * 检查用户是否为数据创建者或其上级
 */
const requireOwnerOrSuperiorAccess = (ModelClass, options = {}) => {
  const { paramName = 'id', recordName = '记录' } = options;

  return asyncHandler(async (req, res, next) => {
    const recordId = req.params[paramName];
    const user = req.user;

    // 管理员直接通过
    if (user.isAdmin) {
      return next();
    }

    const record = await ModelClass.findById(recordId)
      .populate('createdBy', 'departmentIds departmentPath');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: `${recordName}不存在`
      });
    }

    const createdBy = record.createdBy;

    // 如果是创建者本人
    if (createdBy && createdBy._id.toString() === user._id.toString()) {
      req.isOwner = true;
      req.record = record;
      return next();
    }

    // 检查是否为上级
    const hasAccess = await DepartmentPermissionManager.hasAccessToRecord(user, record);

    if (hasAccess) {
      req.isOwner = false;
      req.isSuperior = true;
      req.record = record;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `您只能操作自己创建的${recordName}或下属创建的${recordName}`
    });
  });
};

module.exports = {
  requireRecordAccess,
  requireBatchRecordAccess,
  applyQueryPermissionFilter,
  requireDepartmentManageAccess,
  requireUserManageAccess,
  conditionalPermissionCheck,
  requireOwnerOrSuperiorAccess
};