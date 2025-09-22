const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证JWT令牌
const protect = async (req, res, next) => {
  let token;
  // 检查请求头中的token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 获取token
      token = req.headers.authorization.split(' ')[1];

      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 获取用户信息并添加到请求对象，同时预加载角色权限信息
      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('rolePermission', 'permissions roleName');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '用户不存在'
        });
      }

      if (req.user.isAdmin) {
        return next();
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: '账户已被禁用'
        });
      }

      if (!req.user.departmentPath) {
        return res.status(401).json({
          success: false,
          message: '请先加入部门'
        });
      }
      next();
    } catch (error) {
      // Token验证失败
      return res.status(401).json({
        success: false,
        message: 'Token无效，请重新登录'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供访问令牌'
    });
  }
};

// 验证权限 - 传入权限数组，有任意一个权限或者管理员即可通过
const authorize = (...permissions) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 管理员拥有所有权限
    if (req.user.isAdmin) {
      return next();
    }

    // 如果传入的是 'admin'，则只允许管理员访问
    if (permissions.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限'
      });
    }

    // 检查用户角色权限信息
    const userRole = req.user.rolePermission;
    if (!userRole || !userRole.permissions) {
      return res.status(403).json({
        success: false,
        message: '用户角色权限不存在'
      });
    }

    // 检查是否有任一所需权限
    const hasRequiredPermission = permissions.some(permission =>
      userRole.permissions.includes(permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        success: false,
        message: '权限不足，缺少必要权限'
      });
    }

    next();
  };
};

// 验证用户身份或管理员权限
const protectOwnerOrAdmin = async (req, res, next) => {
  const { id } = req.params;

  // 检查是否为管理员
  if (req.user.isAdmin) {
    return next();
  }

  // 检查是否为资源所有者
  if (req.user.id === id) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '只能访问自己的资源'
  });
};

module.exports = {
  protect,
  authorize,
  protectOwnerOrAdmin
};