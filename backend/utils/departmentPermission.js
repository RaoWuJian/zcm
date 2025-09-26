/**
 * 多部门权限管理工具
 *
 * 从单一 departmentPath 迁移到多部门 departmentIds 的权限管理工具
 * 提供统一的权限检查和用户查询功能
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');

class DepartmentPermissionManager {
  /**
   * 获取用户有权限访问的所有用户ID列表
   * @param {Object} currentUser - 当前用户对象
   * @returns {Array} 用户ID列表
   */
  static async getAccessibleUserIds(currentUser) {
    // 管理员可以访问所有用户
    if (currentUser.isAdmin) {
      const allUsers = await User.find({}, '_id');
      return allUsers.map(user => user._id);
    }

    // 获取用户的部门ID列表
    const userDepartmentIds = this.getUserDepartmentIds(currentUser);

    if (userDepartmentIds.length === 0) {
      // 用户没有任何部门，只能访问自己
      return [currentUser._id];
    }

    // 获取用户及其下属部门的所有部门ID
    const accessibleDepartmentIds = await this.getSubordinateDepartmentIds(userDepartmentIds);

    // 查找属于这些部门的所有用户
    const accessibleUsers = await User.find({
      $or: [
        { _id: currentUser._id }, // 用户自己
        { departmentIds: { $in: accessibleDepartmentIds } }, // 新版本字段
      ]
    }, '_id');

    return accessibleUsers.map(user => user._id);
  }

  /**
   * 构建MongoDB查询条件，用于权限过滤
   * @param {Object} currentUser - 当前用户对象
   * @returns {Object} MongoDB查询条件对象
   */
  static async buildAccessibleUserQuery(currentUser) {
    // 管理员可以访问所有数据
    if (currentUser.isAdmin) {
      return {}; // 空查询条件 = 所有数据
    }

    const accessibleUserIds = await this.getAccessibleUserIds(currentUser);

    return {
      createdBy: { $in: accessibleUserIds }
    };
  }

  /**
   * 获取用户的部门ID列表（兼容新旧版本）
   * @param {Object} user - 用户对象
   * @returns {Array} 部门ID列表
   */
  static getUserDepartmentIds(user) {
    // 新版本：直接返回 departmentIds
    if (user.departmentIds && user.departmentIds.length > 0) {
      return user.departmentIds;
    }

    // 兼容旧版本：从 departmentPath 推导部门ID
    if (user.departmentPath) {
      // 这里可能需要根据 departmentPath 查询对应的部门ID
      // 为了性能考虑，建议在数据迁移时处理这个转换
      return [];
    }

    return [];
  }

  /**
   * 获取指定部门的所有下属部门的ID列表（不包括指定部门本身）
   * @param {Array} departmentIds - 部门ID列表
   * @returns {Array} 只包含下属部门的ID列表（不包括传入的部门）
   */
  static async getSubordinateDepartmentIds(departmentIds) {
    if (departmentIds.length === 0) {
      return [];
    }

    const allSubordinateDepts = new Set(); // 不包含用户自己的部门

    // 递归查找所有下属部门
    const findSubordinates = async (parentIds) => {
      const children = await Department.find({
        parentId: { $in: parentIds }
      }, '_id');

      if (children.length > 0) {
        const childIds = children.map(dept => dept._id);
        childIds.forEach(id => allSubordinateDepts.add(id));

        // 递归查找子部门的子部门
        await findSubordinates(childIds);
      }
    };

    await findSubordinates(departmentIds);
    return Array.from(allSubordinateDepts);
  }

  /**
   * 检查用户是否有权限访问指定的数据记录
   * @param {Object} currentUser - 当前用户
   * @param {Object} record - 要检查的记录（包含 createdBy 字段）
   * @returns {Boolean} 是否有权限
   */
  static async hasAccessToRecord(currentUser, record) {
    if (currentUser.isAdmin) {
      return true;
    }

    if (!record.createdBy) {
      return false;
    }

    const accessibleUserIds = await this.getAccessibleUserIds(currentUser);
    return accessibleUserIds.some(id => id.equals(record.createdBy._id || record.createdBy));
  }

  /**
   * 兼容性方法：获取用户可访问的下属部门路径（用于旧版本兼容）
   * @param {Object} currentUser - 当前用户
   * @returns {Array} 下属部门路径列表（不包括用户自己的部门）
   */
  static async getAccessibleDepartmentPaths(currentUser) {
    if (currentUser.isAdmin) {
      const allDepts = await Department.find({}, 'departmentPath');
      return allDepts.map(dept => dept.departmentPath).filter(Boolean);
    }

    if (!currentUser.departmentPath) {
      return [];
    }

    // 转义正则表达式特殊字符
    const escapedPath = currentUser.departmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 只查找子部门，不包括当前部门
    const subordinateDepts = await Department.find({
      departmentPath: { $regex: `^${escapedPath}->` } // 只匹配子部门
    }, 'departmentPath');

    return subordinateDepts.map(dept => dept.departmentPath).filter(Boolean);
  }

  /**
   * 批量检查用户权限
   * @param {Object} currentUser - 当前用户
   * @param {Array} records - 记录列表
   * @returns {Array} 过滤后的记录列表
   */
  static async filterAccessibleRecords(currentUser, records) {
    if (currentUser.isAdmin) {
      return records;
    }

    const accessibleUserIds = await this.getAccessibleUserIds(currentUser);
    const accessibleUserIdStrings = accessibleUserIds.map(id => id.toString());

    return records.filter(record => {
      const createdById = (record.createdBy?._id || record.createdBy)?.toString();
      return accessibleUserIdStrings.includes(createdById);
    });
  }

  /**
   * 获取用户有权限访问的部门ID列表（包括用户部门和子部门）
   * @param {Object} currentUser - 当前用户对象
   * @returns {Array} 部门ID列表
   */
  static async getAccessibleDepartmentIds(currentUser) {
    // 管理员可以访问所有部门
    if (currentUser.isAdmin) {
      const allDepts = await Department.find({}, '_id');
      return allDepts.map(dept => dept._id);
    }

    // 获取用户的部门ID列表
    const userDepartmentIds = this.getUserDepartmentIds(currentUser);

    if (userDepartmentIds.length === 0) {
      // 用户没有任何部门，返回空数组
      return [];
    }

    // 获取用户所有下属部门ID
    const subordinateDepartmentIds = await this.getSubordinateDepartmentIds(userDepartmentIds);

    // 返回用户部门和下属部门的合并列表
    return [...userDepartmentIds, ...subordinateDepartmentIds];
  }

  /**
   * 检查用户是否有权限访问指定的团队账户
   * @param {Object} currentUser - 当前用户
   * @param {Object} teamAccount - 团队账户对象（包含 departmentId 字段）
   * @returns {Boolean} 是否有权限
   */
  static async hasAccessToTeamAccount(currentUser, teamAccount) {
    if (currentUser.isAdmin) {
      return true;
    }

    if (!teamAccount.departmentId) {
      // 没有部门关联的团队账户，非管理员用户无法访问
      return false;
    }

    const accessibleDepartmentIds = await this.getAccessibleDepartmentIds(currentUser);
    return accessibleDepartmentIds.some(id =>
      id.equals ? id.equals(teamAccount.departmentId._id || teamAccount.departmentId) :
      id.toString() === (teamAccount.departmentId._id || teamAccount.departmentId).toString()
    );
  }

  /**
   * 检查用户是否有权限在指定部门下创建子部门
   * @param {Object} currentUser - 当前用户
   * @param {String|ObjectId} parentDepartmentId - 父部门ID
   * @returns {Boolean} 是否有权限
   */
  static async canCreateDepartmentUnder(currentUser, parentDepartmentId) {
    if (currentUser.isAdmin) {
      return true;
    }

    // 获取用户可访问的部门ID列表
    const accessibleDepartmentIds = await this.getAccessibleDepartmentIds(currentUser);

    // 检查父部门是否在用户的可访问部门列表中
    return accessibleDepartmentIds.some(id =>
      id.equals ? id.equals(parentDepartmentId) :
      id.toString() === parentDepartmentId.toString()
    );
  }

  /**
   * 验证部门ID列表的有效性
   * @param {Array} departmentIds - 部门ID列表
   * @returns {Object} 验证结果 { isValid: boolean, validIds: Array, invalidIds: Array }
   */
  static async validateDepartmentIds(departmentIds) {
    if (!Array.isArray(departmentIds)) {
      return { isValid: false, validIds: [], invalidIds: departmentIds };
    }

    const validObjectIds = departmentIds.filter(id =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validObjectIds.length === 0) {
      return { isValid: false, validIds: [], invalidIds: departmentIds };
    }

    const existingDepts = await Department.find({
      _id: { $in: validObjectIds }
    }, '_id');

    const existingIds = existingDepts.map(dept => dept._id.toString());
    const validIds = validObjectIds.filter(id => existingIds.includes(id.toString()));
    const invalidIds = departmentIds.filter(id => !validIds.includes(id));

    return {
      isValid: validIds.length === departmentIds.length,
      validIds,
      invalidIds
    };
  }
}

module.exports = DepartmentPermissionManager;