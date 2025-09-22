const { authorize } = require('../middleware/auth');

// 模拟测试数据
const mockUser = {
  id: '507f1f77bcf86cd799439011',
  isAdmin: false,
  rolePermission: {
    permissions: ['product:create', 'product:update', 'finance:create']
  }
};

const mockAdminUser = {
  id: '507f1f77bcf86cd799439012',
  isAdmin: true,
  rolePermission: {
    permissions: []
  }
};

const mockUserWithoutRole = {
  id: '507f1f77bcf86cd799439013',
  isAdmin: false,
  rolePermission: null
};

// 模拟 Express 请求和响应对象
const createMockReq = (user) => ({
  user: user
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('优化后的 authorize 中间件测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('管理员应该拥有所有权限', async () => {
    const req = createMockReq(mockAdminUser);
    const res = createMockRes();
    const middleware = authorize('product:create', 'product:delete');

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('用户有权限时应该通过验证', async () => {
    const req = createMockReq(mockUser);
    const res = createMockRes();
    const middleware = authorize('product:create');

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('用户有任一权限时应该通过验证', async () => {
    const req = createMockReq(mockUser);
    const res = createMockRes();
    const middleware = authorize('product:delete', 'product:create');

    await middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('用户没有权限时应该被拒绝', async () => {
    const req = createMockReq(mockUser);
    const res = createMockRes();
    const middleware = authorize('product:delete');

    await middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: '权限不足，缺少必要权限'
    });
  });

  test('用户未分配角色时应该被拒绝', async () => {
    const req = createMockReq(mockUserWithoutRole);
    const res = createMockRes();
    const middleware = authorize('product:create');

    await middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: '用户角色权限不存在'
    });
  });

  test('只有管理员权限时，普通用户应该被拒绝', async () => {
    const req = createMockReq(mockUser);
    const res = createMockRes();
    const middleware = authorize('admin');

    await middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: '权限不足，需要管理员权限'
    });
  });

  test('未认证用户应该被拒绝', async () => {
    const req = createMockReq(null);
    const res = createMockRes();
    const middleware = authorize('product:create');

    await middleware(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: '用户未认证'
    });
  });
});

console.log('authorize 函数优化完成！');
console.log('使用方法：');
console.log('1. authorize("product:create") - 需要产品创建权限');
console.log('2. authorize("product:create", "product:update") - 需要任一权限');
console.log('3. authorize("admin") - 只允许管理员');
console.log('4. 管理员自动拥有所有权限');
