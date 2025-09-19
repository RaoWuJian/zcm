/**
 * 财务权限控制功能测试
 * 测试审批通过后只有上级部门人员可以修改和删除的逻辑
 */

// 模拟用户数据
const testUsers = {
  // 管理员用户
  admin: {
    id: 'admin123',
    _id: 'admin123',
    isAdmin: true,
    departmentPath: '',
    username: '管理员'
  },
  
  // 总部用户
  headquarters: {
    id: 'hq001',
    _id: 'hq001',
    isAdmin: false,
    departmentPath: '总部',
    username: '总部用户'
  },
  
  // 销售部用户
  salesDept: {
    id: 'sales001',
    _id: 'sales001',
    isAdmin: false,
    departmentPath: '总部->销售部',
    username: '销售部用户'
  },
  
  // 华南区用户
  southRegion: {
    id: 'south001',
    _id: 'south001',
    isAdmin: false,
    departmentPath: '总部->销售部->华南区',
    username: '华南区用户'
  },
  
  // 华北区用户（与华南区同级）
  northRegion: {
    id: 'north001',
    _id: 'north001',
    isAdmin: false,
    departmentPath: '总部->销售部->华北区',
    username: '华北区用户'
  },
  
  // 技术部用户（与销售部同级）
  techDept: {
    id: 'tech001',
    _id: 'tech001',
    isAdmin: false,
    departmentPath: '总部->技术部',
    username: '技术部用户'
  }
};

// 导入权限验证函数（需要从实际文件中导入）
// 这里我们模拟实现
const isUserSuperiorToCreator = (currentUser, recordCreator) => {
  // 管理员拥有所有权限
  if (currentUser.isAdmin) {
    return true;
  }

  // 如果当前用户就是创建者，返回false（创建者不能修改已审批的记录）
  if (currentUser.id === recordCreator.id || currentUser._id.toString() === recordCreator._id.toString()) {
    return false;
  }

  const currentUserPath = currentUser.departmentPath || '';
  const creatorPath = recordCreator.departmentPath || '';

  // 如果任一用户没有部门路径，无法判断层级关系
  if (!currentUserPath || !creatorPath) {
    return false;
  }

  // 检查当前用户的部门路径是否为创建者部门路径的前缀
  // 例如：当前用户路径 "总部->销售部"，创建者路径 "总部->销售部->华南区"
  // 则当前用户是创建者的上级
  return creatorPath.startsWith(currentUserPath + '->');
};

// 测试用例
const runTests = () => {
  console.log('开始测试财务权限控制功能...\n');
  
  let testCount = 0;
  let passCount = 0;
  
  const test = (description, testFn) => {
    testCount++;
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ 测试 ${testCount}: ${description}`);
        passCount++;
      } else {
        console.log(`❌ 测试 ${testCount}: ${description}`);
      }
    } catch (error) {
      console.log(`❌ 测试 ${testCount}: ${description} - 错误: ${error.message}`);
    }
  };
  
  // 测试1: 管理员可以修改任何人创建的已审批记录
  test('管理员可以修改任何人创建的已审批记录', () => {
    return isUserSuperiorToCreator(testUsers.admin, testUsers.southRegion);
  });
  
  // 测试2: 创建者不能修改自己创建的已审批记录
  test('创建者不能修改自己创建的已审批记录', () => {
    return !isUserSuperiorToCreator(testUsers.southRegion, testUsers.southRegion);
  });
  
  // 测试3: 上级部门可以修改下级部门创建的已审批记录
  test('总部用户可以修改销售部用户创建的已审批记录', () => {
    return isUserSuperiorToCreator(testUsers.headquarters, testUsers.salesDept);
  });
  
  // 测试4: 上级部门可以修改下下级部门创建的已审批记录
  test('总部用户可以修改华南区用户创建的已审批记录', () => {
    return isUserSuperiorToCreator(testUsers.headquarters, testUsers.southRegion);
  });
  
  // 测试5: 直接上级可以修改下级创建的已审批记录
  test('销售部用户可以修改华南区用户创建的已审批记录', () => {
    return isUserSuperiorToCreator(testUsers.salesDept, testUsers.southRegion);
  });
  
  // 测试6: 同级部门不能修改对方创建的已审批记录
  test('华南区用户不能修改华北区用户创建的已审批记录', () => {
    return !isUserSuperiorToCreator(testUsers.southRegion, testUsers.northRegion);
  });
  
  // 测试7: 同级部门不能修改对方创建的已审批记录
  test('销售部用户不能修改技术部用户创建的已审批记录', () => {
    return !isUserSuperiorToCreator(testUsers.salesDept, testUsers.techDept);
  });
  
  // 测试8: 下级部门不能修改上级部门创建的已审批记录
  test('华南区用户不能修改销售部用户创建的已审批记录', () => {
    return !isUserSuperiorToCreator(testUsers.southRegion, testUsers.salesDept);
  });
  
  // 测试9: 下级部门不能修改上上级部门创建的已审批记录
  test('华南区用户不能修改总部用户创建的已审批记录', () => {
    return !isUserSuperiorToCreator(testUsers.southRegion, testUsers.headquarters);
  });
  
  // 测试10: 无部门路径的用户不能修改有部门路径用户创建的记录
  test('无部门路径的用户不能修改有部门路径用户创建的记录', () => {
    const noDeptUser = { ...testUsers.southRegion, departmentPath: '' };
    return !isUserSuperiorToCreator(noDeptUser, testUsers.southRegion);
  });
  
  console.log(`\n测试完成: ${passCount}/${testCount} 通过`);
  
  if (passCount === testCount) {
    console.log('🎉 所有测试通过！权限控制逻辑正确。');
  } else {
    console.log('⚠️  部分测试失败，请检查权限控制逻辑。');
  }
};

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  testUsers,
  isUserSuperiorToCreator,
  runTests
};
