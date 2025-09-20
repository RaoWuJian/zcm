// 使用内置的fetch API (Node.js 18+)

const BASE_URL = 'http://localhost:3000/api';

// 测试登录并获取token
async function testLogin() {
  try {
    const response = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        loginAccount: 'admin',
        loginPassword: 'admin123'
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('登录成功');
      return data.data.token;
    } else {
      console.log('登录失败:', data.message);
      return null;
    }
  } catch (error) {
    console.error('登录请求失败:', error.message);
    return null;
  }
}

// 测试获取操作日志
async function testGetLogs(token) {
  try {
    const url = new URL(`${BASE_URL}/operation-logs`);
    url.searchParams.append('page', '1');
    url.searchParams.append('limit', '10');

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      console.log('获取操作日志成功:');
      console.log('总数:', data.pagination.totalLogs);
      console.log('日志列表:', data.data.map(log => ({
        id: log._id,
        type: log.operationType,
        module: log.module,
        description: log.description,
        operator: log.operatorName,
        time: log.operatedAt
      })));
    } else {
      console.log('获取操作日志失败:', data.message);
    }
  } catch (error) {
    console.error('获取操作日志请求失败:', error.message);
  }
}

// 测试获取统计信息
async function testGetStats(token) {
  try {
    const url = new URL(`${BASE_URL}/operation-logs/stats`);
    url.searchParams.append('days', '30');

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
  } catch (error) {
    console.error('获取统计信息请求失败:', error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('开始测试操作日志API...\n');
  
  // 1. 测试登录
  console.log('1. 测试登录...');
  const token = await testLogin();
  if (!token) {
    console.log('登录失败，无法继续测试');
    return;
  }
  console.log('');
  
  // 2. 测试获取操作日志
  console.log('2. 测试获取操作日志...');
  await testGetLogs(token);
  console.log('');
  
  // 3. 测试获取统计信息
  console.log('3. 测试获取统计信息...');
  await testGetStats(token);
  console.log('');
  
  console.log('测试完成！');
}

runTests();
