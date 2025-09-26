const mongoose = require('mongoose');
require('dotenv').config();

// 引入模型
const User = require('../models/User');
const Department = require('../models/Department');

// 数据库连接
const connectDB = async () => {
  try {
    const mongoUri = 'mongodb://localhost:27017/zcm_db';
    if (!mongoUri) {
      throw new Error('未找到 MongoDB 连接字符串，请检查 .env 文件中的 MONGODB_URI 或 MONGO_URI 配置');
    }
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB 连接成功');
  } catch (error) {
    console.error('✗ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

/**
 * 映射所有用户的 departmentPath 到 departmentIds
 * 这个脚本专门用于处理用户部门路径映射
 */
async function mapUserDepartmentPath() {
  console.log('🚀 开始映射所有用户的部门路径到部门IDs...\n');

  try {
    // 1. 获取所有部门数据，建立映射表
    const departments = await Department.find({}).lean();
    console.log(`✓ 加载了 ${departments.length} 个部门记录`);

    // 创建多种映射方式
    const deptMappings = {
      byName: new Map(),
      byCode: new Map(),
      byPartialName: new Map(),
      byId: new Map()
    };

    // 构建映射表
    departments.forEach(dept => {
      deptMappings.byName.set(dept.departmentName, dept);
      deptMappings.byId.set(dept._id.toString(), dept);

      if (dept.departmentCode) {
        deptMappings.byCode.set(dept.departmentCode, dept);
      }

      // 部分名称映射（用于模糊匹配）
      const nameParts = dept.departmentName.split(/[/\\-_\s]+/);
      nameParts.forEach(part => {
        if (part.length > 1) {
          if (!deptMappings.byPartialName.has(part)) {
            deptMappings.byPartialName.set(part, []);
          }
          deptMappings.byPartialName.get(part).push(dept);
        }
      });
    });

    // 2. 获取所有用户（包括已有和未有部门路径的）
    const allUsers = await User.find({}).lean();
    console.log(`✓ 找到 ${allUsers.length} 个用户记录\n`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    const results = {
      fullMatch: [],
      partialMatch: [],
      noMatch: [],
      alreadyMapped: [],
      errors: []
    };

    for (const user of allUsers) {
      processedCount++;
      console.log(`[${processedCount}/${allUsers.length}] 处理用户: ${user.username || user.loginAccount}`);

      try {
        // 检查用户是否已有部门路径
        if (!user.departmentPath) {
          if (user.departmentIds && user.departmentIds.length > 0) {
            results.alreadyMapped.push({
              userId: user._id,
              username: user.username || user.loginAccount,
              currentDepartmentIds: user.departmentIds
            });
            console.log(`  ℹ️  用户已有部门ID映射，跳过`);
          } else {
            console.log(`  ℹ️  用户没有部门路径信息，跳过`);
          }
          continue;
        }

        console.log(`  部门路径: "${user.departmentPath}"`);

        // 解析部门路径
        const departmentIds = [];
        const unmatchedParts = [];
        const matchDetails = [];

        // 支持多种分隔符
        const pathParts = user.departmentPath
          .split(/[/\\|,;，、]+/)
          .map(part => part.trim())
          .filter(part => part.length > 0);

        console.log(`  解析路径: [${pathParts.join(', ')}]`);

        // 对于层级路径（如 "新娱主公司->八部"），应该只匹配最后一个部门（最深层级的部门）
        const isHierarchicalPath = pathParts.length > 1 && user.departmentPath.includes('->');
        const targetParts = isHierarchicalPath ? [pathParts[pathParts.length - 1]] : pathParts;

        console.log(`  ${isHierarchicalPath ? '检测到层级路径，只匹配最后部门' : '处理所有路径部分'}: [${targetParts.join(', ')}]`);

        for (const pathPart of targetParts) {
          let matchedDept = null;
          let matchType = '';
          let allCandidates = [];

          // 1. 精确匹配部门名称
          if (deptMappings.byName.has(pathPart)) {
            allCandidates.push({
              dept: deptMappings.byName.get(pathPart),
              type: '精确匹配名称',
              priority: 100
            });
          }

          // 2. 精确匹配部门代码
          if (deptMappings.byCode.has(pathPart)) {
            allCandidates.push({
              dept: deptMappings.byCode.get(pathPart),
              type: '精确匹配代码',
              priority: 100
            });
          }

          // 3. ObjectId 匹配
          if (mongoose.Types.ObjectId.isValid(pathPart) && deptMappings.byId.has(pathPart)) {
            allCandidates.push({
              dept: deptMappings.byId.get(pathPart),
              type: '精确匹配ID',
              priority: 100
            });
          }

          // 4. 部分匹配
          if (deptMappings.byPartialName.has(pathPart)) {
            const candidates = deptMappings.byPartialName.get(pathPart);
            candidates.forEach(dept => {
              allCandidates.push({
                dept: dept,
                type: '部分匹配',
                priority: 80
              });
            });
          }

          // 5. 模糊匹配（包含关系）
          departments.forEach(dept => {
            if (dept.departmentName.includes(pathPart) || pathPart.includes(dept.departmentName)) {
              // 避免重复添加已经在候选列表中的部门
              if (!allCandidates.some(c => c.dept._id.toString() === dept._id.toString())) {
                allCandidates.push({
                  dept: dept,
                  type: '模糊匹配',
                  priority: 60
                });
              }
            }
          });

          // 如果有多个候选，选择最佳匹配
          if (allCandidates.length > 0) {
            // 首先按优先级排序，然后按层级深度排序（层级越深越优先）
            allCandidates.sort((a, b) => {
              if (a.priority !== b.priority) {
                return b.priority - a.priority; // 优先级高的在前
              }
              return b.dept.level - a.dept.level; // 层级深的在前
            });

            matchedDept = allCandidates[0].dept;
            matchType = allCandidates[0].type;

            // 如果有多个同优先级同层级的候选，记录警告
            if (allCandidates.length > 1 &&
                allCandidates[0].priority === allCandidates[1].priority &&
                allCandidates[0].dept.level === allCandidates[1].dept.level) {
              console.log(`    ⚠️  发现多个同等候选: ${allCandidates.slice(0, 3).map(c => c.dept.departmentName).join(', ')}`);
              matchType += '(多候选)';
            }
          }

          if (matchedDept) {
            // 避免重复添加
            if (!departmentIds.some(id => id.toString() === matchedDept._id.toString())) {
              departmentIds.push(matchedDept._id);
              matchDetails.push({
                pathPart,
                departmentName: matchedDept.departmentName,
                departmentId: matchedDept._id,
                matchType
              });
              console.log(`    ✓ ${matchType}: "${pathPart}" -> ${matchedDept.departmentName}`);
            }
          } else {
            unmatchedParts.push(pathPart);
            console.log(`    ✗ 未匹配: "${pathPart}"`);
          }
        }

        // 更新用户数据
        const updateData = {
          departmentIds: departmentIds,
          updatedAt: new Date()
        };

        await User.findByIdAndUpdate(user._id, updateData);
        updatedCount++;

        // 记录结果
        const userResult = {
          userId: user._id,
          username: user.username || user.loginAccount,
          originalPath: user.departmentPath,
          pathParts: pathParts,
          matchedDepartments: matchDetails,
          unmatchedParts: unmatchedParts,
          finalDepartmentIds: departmentIds
        };

        if (departmentIds.length > 0 && unmatchedParts.length === 0) {
          results.fullMatch.push(userResult);
          console.log(`  ✅ 完全匹配: ${departmentIds.length} 个部门`);
        } else if (departmentIds.length > 0 && unmatchedParts.length > 0) {
          results.partialMatch.push(userResult);
          console.log(`  ⚠️  部分匹配: ${departmentIds.length} 个部门, ${unmatchedParts.length} 个未匹配`);
        } else {
          results.noMatch.push(userResult);
          console.log(`  ❌ 完全失败: 无法匹配任何部门`);
        }

      } catch (error) {
        errorCount++;
        results.errors.push({
          userId: user._id,
          username: user.username || user.loginAccount,
          error: error.message
        });
        console.error(`  ❌ 处理用户失败: ${error.message}`);
      }

      console.log(''); // 空行分隔
    }

    // 生成详细报告
    console.log('📊 部门路径映射报告:');
    console.log(`   ✅ 完全匹配: ${results.fullMatch.length} 个用户`);
    console.log(`   ⚠️  部分匹配: ${results.partialMatch.length} 个用户`);
    console.log(`   ❌ 完全失败: ${results.noMatch.length} 个用户`);
    console.log(`   ℹ️  已有映射: ${results.alreadyMapped.length} 个用户`);
    console.log(`   🔄 总更新: ${updatedCount} 个用户`);
    console.log(`   ❗ 错误: ${errorCount} 个用户`);

    // 详细错误信息
    if (results.errors.length > 0) {
      console.log('\n❗ 错误详情:');
      results.errors.forEach(err => {
        console.log(`   - ${err.username}: ${err.error}`);
      });
    }

    // 需要手动处理的用户
    if (results.noMatch.length > 0) {
      console.log('\n❌ 需要手动处理的用户:');
      results.noMatch.forEach(user => {
        console.log(`   - ${user.username}: "${user.originalPath}"`);
      });
    }

    if (results.partialMatch.length > 0) {
      console.log('\n⚠️  部分匹配用户 (建议检查):');
      results.partialMatch.forEach(user => {
        console.log(`   - ${user.username}: "${user.originalPath}"`);
        console.log(`     未匹配部分: [${user.unmatchedParts.join(', ')}]`);
      });
    }

    console.log('\n🎉 用户部门路径映射完成！');

    return results;

  } catch (error) {
    console.error('❌ 映射过程中出现错误:', error);
    throw error;
  }
}

/**
 * 验证映射结果
 */
async function validateMapping() {
  console.log('🔍 验证部门映射结果...\n');

  try {
    const users = await User.find({})
      .populate('departmentIds', 'departmentName departmentCode')
      .lean();

    let validCount = 0;
    let invalidCount = 0;
    let emptyCount = 0;

    for (const user of users) {
      if (!user.departmentIds || user.departmentIds.length === 0) {
        emptyCount++;
        console.log(`❓ 用户 ${user.username} 没有部门分配`);
      } else {
        let hasInvalid = false;
        for (const dept of user.departmentIds) {
          if (!dept || !dept._id) {
            hasInvalid = true;
            break;
          }
        }

        if (hasInvalid) {
          invalidCount++;
          console.log(`❌ 用户 ${user.username} 有无效的部门引用`);
        } else {
          validCount++;
          console.log(`✓ 用户 ${user.username} 部门分配正常: ${user.departmentIds.map(d => d.departmentName).join(', ')}`);
        }
      }
    }

    console.log('\n📊 验证结果:');
    console.log(`   ✅ 有效映射: ${validCount} 个用户`);
    console.log(`   ❌ 无效映射: ${invalidCount} 个用户`);
    console.log(`   ❓ 无部门分配: ${emptyCount} 个用户`);

  } catch (error) {
    console.error('❌ 验证失败:', error);
  }
}

// 主执行函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'map';

  try {
    await connectDB();

    switch (command) {
      case 'map':
        await mapUserDepartmentPath();
        break;
      case 'validate':
        await validateMapping();
        break;
      default:
        console.log('用法:');
        console.log('  node mapUserDepartmentPath.js map      # 执行映射');
        console.log('  node mapUserDepartmentPath.js validate # 验证结果');
        break;
    }

    console.log('\n✅ 任务完成！');
    process.exit(0);

  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  mapUserDepartmentPath,
  validateMapping
};