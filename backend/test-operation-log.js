const mongoose = require('mongoose');
const OperationLog = require('./models/OperationLog');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 测试创建操作日志
async function testCreateLog() {
  try {
    const logData = {
      operationType: 'CREATE',
      module: 'USER',
      resourceId: '507f1f77bcf86cd799439011',
      resourceName: '测试用户',
      description: '创建用户: 测试用户',
      operatorId: '507f1f77bcf86cd799439011',
      operatorName: '管理员',
      operatorAccount: 'admin',
      requestInfo: {
        method: 'POST',
        url: '/api/users',
        userAgent: 'Test Agent',
        ip: '127.0.0.1'
      },
      result: 'SUCCESS'
    };

    const log = await OperationLog.logOperation(logData);

    // 查询日志
    const logs = await OperationLog.find().limit(5);

    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testCreateLog();
