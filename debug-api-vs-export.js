/**
 * 调试API统计数据与导出数据差异的脚本
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const AUTH_TOKEN = 'your-auth-token'; // 需要替换为实际的认证token

// 模拟API请求
async function testApiVsExport() {
  console.log('=== 调试API统计数据与导出数据差异 ===\n');

  try {
    // 1. 获取第一页数据（包含统计信息）
    console.log('1. 获取第一页数据（包含统计信息）...');
    const page1Response = await axios.get(`${BASE_URL}/commission-accounting`, {
      params: {
        page: 1,
        limit: 10,
        startDate: '2025-09-22',
        endDate: '2025-09-22'
      },
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    const page1Data = page1Response.data;
    console.log('第一页响应:');
    console.log(`  成功: ${page1Data.success}`);
    console.log(`  数据条数: ${page1Data.data.length}`);
    console.log(`  总记录数: ${page1Data.pagination.total}`);
    
    if (page1Data.stats) {
      console.log('  统计数据:');
      console.log(`    总净成交数据: ${page1Data.stats.totalNetTransactionData}`);
      console.log(`    总佣金利润: ${page1Data.stats.totalCommissionProfit}`);
      console.log(`    总净利润: ${page1Data.stats.totalNetProfit}`);
      console.log(`    总今日消耗: ${page1Data.stats.totalDailyConsumption}`);
      console.log(`    记录数量: ${page1Data.stats.recordCount}`);
    }
    console.log('');

    // 2. 获取所有数据（模拟导出）
    console.log('2. 获取所有数据（模拟导出）...');
    const allDataResponse = await axios.get(`${BASE_URL}/commission-accounting`, {
      params: {
        page: 1,
        limit: 999999, // 获取所有数据
        startDate: '2025-09-22',
        endDate: '2025-09-22'
      },
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    const allData = allDataResponse.data;
    console.log('所有数据响应:');
    console.log(`  成功: ${allData.success}`);
    console.log(`  数据条数: ${allData.data.length}`);
    console.log(`  总记录数: ${allData.pagination.total}`);
    console.log('');

    // 3. 手动计算导出数据的统计
    console.log('3. 手动计算导出数据的统计...');
    const exportStats = allData.data.reduce((acc, item) => {
      acc.totalNetTransactionData += item.netTransactionData || 0;
      acc.totalCommissionProfit += item.commissionProfit || 0;
      acc.totalNetProfit += item.netProfit || 0;
      acc.totalDailyConsumption += item.dailyConsumption || 0;
      acc.recordCount += 1;
      return acc;
    }, {
      totalNetTransactionData: 0,
      totalCommissionProfit: 0,
      totalNetProfit: 0,
      totalDailyConsumption: 0,
      recordCount: 0
    });

    console.log('导出数据手动统计:');
    console.log(`  总净成交数据: ${exportStats.totalNetTransactionData}`);
    console.log(`  总佣金利润: ${exportStats.totalCommissionProfit}`);
    console.log(`  总净利润: ${exportStats.totalNetProfit}`);
    console.log(`  总今日消耗: ${exportStats.totalDailyConsumption}`);
    console.log(`  记录数量: ${exportStats.recordCount}`);
    console.log('');

    // 4. 比较差异
    if (page1Data.stats) {
      console.log('4. 差异分析:');
      console.log(`  净成交数据差异: ${page1Data.stats.totalNetTransactionData - exportStats.totalNetTransactionData}`);
      console.log(`  佣金利润差异: ${page1Data.stats.totalCommissionProfit - exportStats.totalCommissionProfit}`);
      console.log(`  净利润差异: ${page1Data.stats.totalNetProfit - exportStats.totalNetProfit}`);
      console.log(`  今日消耗差异: ${page1Data.stats.totalDailyConsumption - exportStats.totalDailyConsumption}`);
      console.log(`  记录数量差异: ${page1Data.stats.recordCount - exportStats.recordCount}`);
      console.log('');

      // 5. 详细数据分析
      console.log('5. 详细数据分析:');
      console.log('前10条记录详情:');
      allData.data.slice(0, 10).forEach((item, index) => {
        console.log(`  记录 ${index + 1}:`);
        console.log(`    名称: ${item.name}`);
        console.log(`    净成交数据: ${item.netTransactionData}`);
        console.log(`    佣金利润: ${item.commissionProfit}`);
        console.log(`    净利润: ${item.netProfit}`);
        console.log(`    今日消耗: ${item.dailyConsumption}`);
        console.log(`    创建时间: ${item.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('请求失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testApiVsExport();
