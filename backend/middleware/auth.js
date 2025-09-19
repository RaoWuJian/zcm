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

      // 获取用户信息并添加到请求对象
      req.user = await User.findById(decoded.id).select('-password');
      
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

// 验证管理员权限
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 检查是否为管理员
    if (roles.includes('admin') && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限'
      });
    }

    // 检查角色权限
    if (!roles.includes('admin') && !roles.includes(req.user.rolePermission)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
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