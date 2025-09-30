const CampaignCategory = require('../models/CampaignCategory');
const { asyncHandler } = require('../middleware/error');

// 获取所有大类及其子类
const getCategoriesWithChildren = asyncHandler(async (req, res) => {
  const categories = await CampaignCategory.getMainCategoriesWithChildren();
  
  res.json({
    success: true,
    data: categories
  });
});

// 获取所有大类
const getMainCategories = asyncHandler(async (req, res) => {
  const categories = await CampaignCategory.getMainCategories();
  
  res.json({
    success: true,
    data: categories
  });
});

// 获取指定大类的子类
const getSubCategories = asyncHandler(async (req, res) => {
  const { mainCategoryId } = req.params;

  if (!mainCategoryId) {
    return res.status(400).json({
      success: false,
      message: '大类ID不能为空'
    });
  }

  try {
    const subCategories = await CampaignCategory.getSubCategories(mainCategoryId);
    
    res.json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// 获取分类列表（分页）
const getCategories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    keyword
  } = req.query;

  // 构建查询条件
  let query = { isActive: true };
  
  if (keyword) {
    query.$or = [
      { name: new RegExp(keyword, 'i') },
      { description: new RegExp(keyword, 'i') }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // 执行查询
  const [categories, total] = await Promise.all([
    CampaignCategory.find(query)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    CampaignCategory.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: categories,
    pagination: {
      current: parseInt(page),
      pageSize: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// 获取单个分类详情
const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await CampaignCategory.findById(id)
    .populate('createdBy', 'username')
    .populate('updatedBy', 'username');

  if (!category) {
    return res.status(404).json({
      success: false,
      message: '分类不存在'
    });
  }

  res.json({
    success: true,
    data: category
  });
});

// 创建大类
const createCategory = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    sortOrder
  } = req.body;

  // 检查名称是否已存在
  const existingCategory = await CampaignCategory.findOne({ 
    name, 
    isActive: true 
  });
  
  if (existingCategory) {
    return res.status(400).json({
      success: false,
      message: '已存在同名大类'
    });
  }

  // 创建大类
  const category = new CampaignCategory({
    name,
    description: description || '',
    sortOrder: sortOrder || 0,
    createdBy: req.user._id
  });

  await category.save();

  // 填充关联数据
  await category.populate([
    { path: 'createdBy', select: 'username' }
  ]);

  res.status(201).json({
    success: true,
    message: '大类创建成功',
    data: category
  });
});

// 更新大类
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await CampaignCategory.findById(id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: '分类不存在'
    });
  }

  const {
    name,
    description,
    sortOrder,
    isActive
  } = req.body;

  // 如果更新名称，检查是否重复
  if (name && name !== category.name) {
    const existingCategory = await CampaignCategory.findOne({
      name, 
      isActive: true, 
      _id: { $ne: id } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: '已存在同名大类'
      });
    }
  }

  // 更新字段
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (sortOrder !== undefined) category.sortOrder = sortOrder;
  if (isActive !== undefined) category.isActive = isActive;
  category.updatedBy = req.user._id;

  await category.save();

  await category.populate([
    { path: 'createdBy', select: 'username' },
    { path: 'updatedBy', select: 'username' }
  ]);

  res.json({
    success: true,
    message: '大类更新成功',
    data: category
  });
});

// 删除大类
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await CampaignCategory.findById(id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: '分类不存在'
    });
  }

  // 检查是否可以删除
  const canDeleteResult = await category.canDelete();
  if (!canDeleteResult.canDelete) {
    return res.status(400).json({
      success: false,
      message: canDeleteResult.reason
    });
  }

  await category.deleteOne();

  res.json({
    success: true,
    message: '大类删除成功'
  });
});

// 添加小类
const addSubCategory = asyncHandler(async (req, res) => {
  console.log('addSubCategory');
  const { categoryId } = req.params;
  const { name, description, sortOrder } = req.body;

  const category = await CampaignCategory.findById(categoryId);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: '大类不存在'
    });
  }

  // 检查小类名称是否重复
  const existingSubCategory = category.subCategories.find(
    sub => sub.name === name && sub.isActive
  );
  
  if (existingSubCategory) {
    return res.status(400).json({
      success: false,
      message: '该大类下已存在同名小类'
    });
  }

  // 添加小类
  await category.addSubCategory({
    name,
    description: description || '',
    sortOrder: sortOrder || 0
  }, req.user._id);

  await category.populate([
    { path: 'createdBy', select: 'username' },
    { path: 'updatedBy', select: 'username' }
  ]);

  res.status(201).json({
    success: true,
    message: '小类添加成功',
    data: category
  });
});

// 更新小类
const updateSubCategory = asyncHandler(async (req, res) => {
  const { categoryId, subCategoryId } = req.params;
  const { name, description, sortOrder, isActive } = req.body;

  const category = await CampaignCategory.findById(categoryId);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: '大类不存在'
    });
  }

  const subCategory = category.subCategories.id(subCategoryId);
  if (!subCategory) {
    return res.status(404).json({
      success: false,
      message: '小类不存在'
    });
  }

  // 如果更新名称，检查是否重复
  if (name && name !== subCategory.name) {
    const existingSubCategory = category.subCategories.find(
      sub => sub.name === name && sub.isActive && sub._id.toString() !== subCategoryId
    );
    
    if (existingSubCategory) {
      return res.status(400).json({
        success: false,
        message: '该大类下已存在同名小类'
      });
    }
  }

  // 更新小类
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (isActive !== undefined) updateData.isActive = isActive;

  await category.updateSubCategory(subCategoryId, updateData, req.user._id);

  await category.populate([
    { path: 'createdBy', select: 'username' },
    { path: 'updatedBy', select: 'username' }
  ]);

  res.json({
    success: true,
    message: '小类更新成功',
    data: category
  });
});

// 删除小类
const deleteSubCategory = asyncHandler(async (req, res) => {
  const { categoryId, subCategoryId } = req.params;

  const category = await CampaignCategory.findById(categoryId);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: '大类不存在'
    });
  }

  const subCategory = category.subCategories.id(subCategoryId);
  if (!subCategory) {
    return res.status(404).json({
      success: false,
      message: '小类不存在'
    });
  }

  // 检查小类是否可以删除
  const canDeleteResult = await category.canDeleteSubCategory(subCategoryId);
  if (!canDeleteResult.canDelete) {
    return res.status(400).json({
      success: false,
      message: canDeleteResult.reason
    });
  }

  // 删除小类
  await category.removeSubCategory(subCategoryId, req.user._id);

  await category.populate([
    { path: 'createdBy', select: 'username' },
    { path: 'updatedBy', select: 'username' }
  ]);

  res.json({
    success: true,
    message: '小类删除成功',
    data: category
  });
});

// 批量更新排序
const updateCategoriesOrder = asyncHandler(async (req, res) => {
  const { categories } = req.body;

  if (!Array.isArray(categories)) {
    return res.status(400).json({
      success: false,
      message: '分类数据格式错误'
    });
  }

  // 批量更新排序
  const updatePromises = categories.map(({ id, sortOrder }) =>
    CampaignCategory.findByIdAndUpdate(id, { 
      sortOrder,
      updatedBy: req.user._id
    })
  );

  await Promise.all(updatePromises);

  res.json({
    success: true,
    message: '排序更新成功'
  });
});

module.exports = {
  getCategoriesWithChildren,
  getMainCategories,
  getSubCategories,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  updateCategoriesOrder
};