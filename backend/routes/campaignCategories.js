const express = require('express');
const router = express.Router();
const campaignCategoryController = require('../controllers/campaignCategoryController');
const { protect } = require('../middleware/auth');

// 获取所有大类及其子类（用于下拉选择）
router.get('/tree', 
  protect, 
  campaignCategoryController.getCategoriesWithChildren
);

// 获取所有大类
router.get('/main', 
  protect, 
  campaignCategoryController.getMainCategories
);

// 获取指定大类的子类
router.get('/main/:mainCategoryId/sub', 
  protect, 
  campaignCategoryController.getSubCategories
);

// 获取分类列表（分页管理）
router.get('/', 
  protect, 
  campaignCategoryController.getCategories
);

// 批量更新排序
router.put('/batch/order', 
  protect, 
  campaignCategoryController.updateCategoriesOrder
);

// 大类相关操作 - 使用明确的路径前缀
router.post('/categories', 
  protect, 
  campaignCategoryController.createCategory
);

router.get('/categories/:id', 
  protect, 
  campaignCategoryController.getCategory
);

router.put('/categories/:id', 
  protect, 
  campaignCategoryController.updateCategory
);

router.delete('/categories/:id', 
  protect, 
  campaignCategoryController.deleteCategory
);

// 小类相关操作 - 使用明确的路径前缀
router.post('/categories/:categoryId/subcategories', 
  protect, 
  campaignCategoryController.addSubCategory
);

router.put('/categories/:categoryId/subcategories/:subCategoryId', 
  protect, 
  campaignCategoryController.updateSubCategory
);

router.delete('/categories/:categoryId/subcategories/:subCategoryId', 
  protect, 
  campaignCategoryController.deleteSubCategory
);

// 测试路由 - 无认证
router.get('/test', (req, res) => {
  res.json({ success: true, message: '路由工作正常', timestamp: new Date().toISOString() });
});

// 测试子类路由 - 无认证
router.post('/test-subcategories/:categoryId', (req, res) => {
  res.json({ 
    success: true, 
    message: '子类路由工作正常', 
    categoryId: req.params.categoryId,
    body: req.body,
    timestamp: new Date().toISOString() 
  });
});

// 路由配置完成 - 更新时间: 2025-09-28
module.exports = router;