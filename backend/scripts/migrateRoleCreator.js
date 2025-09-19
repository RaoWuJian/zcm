const mongoose = require('mongoose');
const Role = require('../models/Role');
const User = require('../models/User');
require('dotenv').config();

/**
 * 为现有角色添加创建人信息的迁移脚本
 * 将现有角色的创建人设置为管理员用户
 */

const migrateRoleCreator = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zcm_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 查找管理员用户
    const adminUser = await User.findOne({ isAdmin: true });
    
    if (!adminUser) {
      throw new Error('未找到管理员用户，请先创建管理员账户');
    }

    // 查找所有没有创建人信息的角色
    const rolesWithoutCreator = await Role.find({
      $or: [
        { createdBy: { $exists: false } },
        { createdBy: null }
      ]
    });

    if (rolesWithoutCreator.length === 0) {
      return;
    }

    // 批量更新角色，设置创建人为管理员
    const updateResult = await Role.updateMany(
      {
        $or: [
          { createdBy: { $exists: false } },
          { createdBy: null }
        ]
      },
      {
        $set: {
          createdBy: adminUser._id,
          createdByDepartmentPath: adminUser.departmentPath || ''
        }
      }
    );

    // 验证更新结果
    const updatedRoles = await Role.find({ createdBy: adminUser._id });

  } catch (error) {
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    process.exit(0);
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  migrateRoleCreator();
}

module.exports = migrateRoleCreator;
