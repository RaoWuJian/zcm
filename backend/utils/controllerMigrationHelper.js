/**
 * 控制器迁移辅助工具
 *
 * 帮助控制器从 departmentPath 迁移到新的多部门权限管理系统
 */

const DepartmentPermissionManager = require('./departmentPermission');

class ControllerMigrationHelper {
  /**
   * 创建新版本的权限检查函数
   * 替代基于 departmentPath 的老版本权限检查
   *
   * @param {string} recordName - 记录类型名称（用于错误消息）
   * @returns {Function} 权限检查函数
   */
  static createRecordAccessChecker(recordName = '记录') {
    return async (recordId, user, RecordModel) => {
      const record = await RecordModel.findById(recordId).populate('createdBy');

      if (!record) {
        return { hasAccess: false, record: null, error: `${recordName}不存在` };
      }

      const hasAccess = await DepartmentPermissionManager.hasAccessToRecord(user, record);

      if (hasAccess) {
        return { hasAccess: true, record, error: null };
      }

      return { hasAccess: false, record: null, error: `无权限访问此${recordName}` };
    };
  }

  /**
   * 为控制器的查询方法添加权限过滤
   *
   * @param {Object} query - MongoDB查询对象
   * @param {Object} user - 当前用户对象
   * @returns {Object} 添加了权限过滤的查询对象
   */
  static async addPermissionFilter(query, user) {
    const permissionQuery = await DepartmentPermissionManager.buildAccessibleUserQuery(user);
    return { ...query, ...permissionQuery };
  }

  /**
   * 生成权限相关的中间件
   * 用于自动检查请求参数中的记录权限
   *
   * @param {Function} RecordModel - Mongoose模型
   * @param {string} paramName - 请求参数名称（默认为 'id'）
   * @param {string} recordName - 记录类型名称
   * @returns {Function} Express中间件
   */
  static createPermissionMiddleware(RecordModel, paramName = 'id', recordName = '记录') {
    return async (req, res, next) => {
      try {
        const recordId = req.params[paramName];
        const user = req.user;

        const checkAccess = this.createRecordAccessChecker(recordName);
        const { hasAccess, record, error } = await checkAccess(recordId, user, RecordModel);

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: error
          });
        }

        // 将记录附加到请求对象上，避免重复查询
        req.record = record;
        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: '权限检查失败',
          error: error.message
        });
      }
    };
  }

  /**
   * 生成标准的权限查询条件构建函数
   * 用于替换控制器中的部门权限查询逻辑
   *
   * @param {Object} baseQuery - 基础查询条件
   * @param {Object} user - 当前用户
   * @returns {Object} 完整的查询条件
   */
  static async buildPermissionAwareQuery(baseQuery, user) {
    const permissionQuery = await DepartmentPermissionManager.buildAccessibleUserQuery(user);
    return { ...baseQuery, ...permissionQuery };
  }

  /**
   * 批量更新控制器文件的辅助函数
   * 生成需要替换的代码片段
   */
  static generateMigrationCode() {
    return {
      imports: `const DepartmentPermissionManager = require('../utils/departmentPermission');`,

      permissionCheck: `
// 使用新的权限管理器检查权限
const hasAccess = await DepartmentPermissionManager.hasAccessToRecord(user, record);

if (!hasAccess) {
  return res.status(403).json({
    success: false,
    message: '无权限访问此记录'
  });
}`,

      queryFilter: `
// 使用新的权限管理器构建查询条件
const permissionQuery = await DepartmentPermissionManager.buildAccessibleUserQuery(user);
Object.assign(query, permissionQuery);`,

      userListFilter: `
// 非管理员用户权限过滤
if (!user.isAdmin) {
  const permissionQuery = await DepartmentPermissionManager.buildAccessibleUserQuery(user);
  Object.assign(query, permissionQuery);
}`
    };
  }
}

module.exports = ControllerMigrationHelper;