const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// 导入错误处理中间件
const { errorHandler, notFound } = require('./middleware/error');

// 导入模型以确保注册
require('./models/TeamAccount');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置：开发环境放开，生产环境严格白名单（支持逗号分隔、多域名）
const isProd = process.env.NODE_ENV === 'production';
const normalize = (s) => (typeof s === 'string' ? s.replace(/\/$/, '') : s);
const allowedOrigins = (process.env.CORS_ORIGIN || '')
	.split(',')
	.map(s => normalize(s.trim()))
	.filter(Boolean);

const corsOptions = {
	origin: function (origin, callback) {
		// 非浏览器请求或同源请求（无 Origin），直接放行
		if (!origin) return callback(null, true);

		const reqOrigin = normalize(origin);

		if (!isProd) {
			// 开发环境：反射请求源，避免 * 与 credentials 冲突
			return callback(null, reqOrigin);
		}

		// 生产环境：严格校验
		if (allowedOrigins.includes(reqOrigin)) {
			return callback(null, reqOrigin);
		}
		return callback(new Error(`CORS blocked for origin: ${origin}`), false);
	},
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
	credentials: true,
	optionsSuccessStatus: 200
};

// 本地
app.use(cors());
// 线上
// app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // 增加JSON解析限制
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 用于访问上传的图片
app.use('/uploads', express.static('uploads'));

// MongoDB连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zcm_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  // MongoDB 连接成功
});

mongoose.connection.on('error', (err) => {
  // MongoDB 连接错误
});

// 导入路由
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const financeRoutes = require('./routes/finance');
const teamAccountRoutes = require('./routes/teamAccounts');
const productRoutes = require('./routes/products');
const budgetRoutes = require('./routes/budget');
const commissionAccountingRoutes = require('./routes/commissionAccounting');
const operationalProductRoutes = require('./routes/operationalProduct');
const fileRoutes = require('./routes/files');
const roleRoutes = require('./routes/roles');
const operationLogRoutes = require('./routes/operationLogs');
const inventoryRoutes = require('./routes/inventory');
const inventoryRecordRoutes = require('./routes/inventoryRecords');
const recordTypeRoutes = require('./routes/recordType');

// 根路由
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '招财猫系统API服务运行中',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      users: '/api/users',
      departments: '/api/departments',
      finance: '/api/finance',
      teamAccounts: '/api/team-accounts',
      products: '/api/products',
      budget: '/api/budget',
      commissionAccounting: '/api/commission-accounting',
      operationalProducts: '/api/operational-products',
      files: '/api/files',
      roles: '/api/roles',
      operationLogs: '/api/operation-logs',
      inventory: '/api/inventory',
      inventoryRecords: '/api/inventory-records'
    }
  });
});

// API 路由
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/team-accounts', teamAccountRoutes);
app.use('/api/products', productRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/commission-accounting', commissionAccountingRoutes);
app.use('/api/operational-products', operationalProductRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/operation-logs', operationLogRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/inventory-records', inventoryRecordRoutes);
app.use('/api/record-types', recordTypeRoutes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 处理
app.use(notFound);


// 全局错误处理中间件 - 必须在最后
app.use(errorHandler);

app.listen(PORT, () => {
  // 服务器启动成功
});

module.exports = app;