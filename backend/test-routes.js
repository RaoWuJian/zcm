const express = require('express');
const app = express();

// 模拟中间件
const protect = (req, res, next) => {
  req.user = { _id: 'test-user-id' };
  next();
};

// 模拟控制器
const mockController = {
  addSubCategory: (req, res) => {
    console.log('addSubCategory called with params:', req.params);
    console.log('addSubCategory called with body:', req.body);
    res.json({
      success: true,
      message: '路由匹配成功',
      params: req.params,
      body: req.body
    });
  }
};

app.use(express.json());

// 测试路由
app.post('/api/campaign-categories/categories/:categoryId/subcategories', 
  protect, 
  mockController.addSubCategory
);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '路由未找到',
    path: req.originalUrl,
    method: req.method
  });
});

const port = 3001;
app.listen(port, () => {
  console.log(`测试服务器运行在端口 ${port}`);
  console.log('测试URL: POST http://localhost:3001/api/campaign-categories/categories/68d8e72f500f97a75a2d77f8/subcategories');
});






