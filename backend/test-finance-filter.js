const axios = require('axios');

async function testFinanceFilter() {
  try {
    console.log('🚀 开始测试财务记录筛选功能...');
    
    // 1. 先登录获取token
    console.log('\n1️⃣ 登录七部财务用户...');
    const loginResponse = await axios.post('http://localhost:3000/api/users/login', {
      loginAccount: 'xinyu008',
      loginPassword: '123456'
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ 登录失败:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ 登录成功');
    
    // 2. 获取团队账户列表
    console.log('\n2️⃣ 获取团队账户列表...');
    const teamAccountsResponse = await axios.get('http://localhost:3000/api/team-accounts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!teamAccountsResponse.data.success) {
      console.error('❌ 获取团队账户失败:', teamAccountsResponse.data.message);
      return;
    }
    
    const teamAccounts = teamAccountsResponse.data.data;
    console.log('✅ 获取到团队账户数量:', teamAccounts.length);
    teamAccounts.forEach(account => {
      console.log(`  - ${account.name} (ID: ${account._id})`);
    });
    
    // 3. 测试不带筛选的财务记录查询
    console.log('\n3️⃣ 测试不带筛选的财务记录查询...');
    const allFinancesResponse = await axios.get('http://localhost:3000/api/finance', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (allFinancesResponse.data.success) {
      console.log('✅ 获取到财务记录数量:', allFinancesResponse.data.data.length);
      console.log('📊 分页信息:', allFinancesResponse.data.pagination);
    } else {
      console.error('❌ 获取财务记录失败:', allFinancesResponse.data.message);
    }
    
    // 4. 测试带团队筛选的财务记录查询
    if (teamAccounts.length > 0) {
      const testTeamId = teamAccounts[0]._id;
      console.log(`\n4️⃣ 测试按团队筛选 (团队ID: ${testTeamId})...`);
      
      const filteredFinancesResponse = await axios.get(`http://localhost:3000/api/finance?teamId=${testTeamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (filteredFinancesResponse.data.success) {
        console.log('✅ 筛选后的财务记录数量:', filteredFinancesResponse.data.data.length);
        console.log('📊 分页信息:', filteredFinancesResponse.data.pagination);
        
        // 验证所有记录都属于指定团队
        const records = filteredFinancesResponse.data.data;
        const wrongTeamRecords = records.filter(record => record.teamId._id !== testTeamId);
        
        if (wrongTeamRecords.length === 0) {
          console.log('✅ 筛选正确：所有记录都属于指定团队');
        } else {
          console.error('❌ 筛选错误：发现不属于指定团队的记录数量:', wrongTeamRecords.length);
          wrongTeamRecords.forEach(record => {
            console.error(`  - 记录ID: ${record._id}, 团队: ${record.teamId.name} (${record.teamId._id})`);
          });
        }
      } else {
        console.error('❌ 按团队筛选失败:', filteredFinancesResponse.data.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('HTTP状态码:', error.response.status);
    }
  }
}

// 检查是否安装了axios
try {
  require('axios');
  testFinanceFilter();
} catch (e) {
  console.log('请先安装axios: npm install axios');
  console.log('或者使用curl命令测试API');
}
