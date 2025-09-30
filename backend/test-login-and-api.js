const axios = require('axios');

async function testLoginAndAPI() {
  try {
    console.log('🚀 开始测试登录和API...');
    
    // 1. 先登录获取token
    console.log('\n1️⃣ 登录七部财务用户...');
    const loginResponse = await axios.post('http://localhost:3000/api/users/login', {
      loginAccount: 'xinyu008',
      loginPassword: '123456' // 请确认密码
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功，获取到token:', token.substring(0, 50) + '...');
    
    // 2. 使用token调用getSuperiorUsers API
    console.log('\n2️⃣ 调用getSuperiorUsers API...');
    const apiResponse = await axios.get('http://localhost:3000/api/users/superiors', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API调用成功');
    console.log('📊 响应数据:', JSON.stringify(apiResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('HTTP状态码:', error.response.status);
      console.error('响应头:', error.response.headers);
    }
  }
}

testLoginAndAPI();
