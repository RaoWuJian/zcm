const RecordType = require('../models/RecordType');
const { asyncHandler } = require('../middleware/error');

// @desc    获取所有记录类型
// @route   GET /api/record-types
// @access  Private
const getRecordTypes = asyncHandler(async (req, res) => {
  const recordTypes = await RecordType.getActiveTypes();

  res.json({
    success: true,
    data: recordTypes,
    message: '获取记录类型成功'
  });
});

// @desc    创建记录类型
// @route   POST /api/record-types
// @access  Private
const createRecordType = asyncHandler(async (req, res) => {
  const { name, description, sort } = req.body;
  const userId = req.user.id;

  const recordType = new RecordType({
    name,
    description,
    sort,
    createdBy: userId,
    updatedBy: userId
  });

  await recordType.save();

  // 重新查询以获取完整的populate信息
  const populatedRecordType = await RecordType.findById(recordType._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(201).json({
    success: true,
    data: populatedRecordType,
    message: '创建记录类型成功'
  });
});

// @desc    更新记录类型
// @route   PUT /api/record-types/:id
// @access  Private
const updateRecordType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, sort, isActive } = req.body;
  const userId = req.user.id;

  const recordType = await RecordType.findById(id);
  if (!recordType) {
    res.status(404);
    throw new Error('记录类型不存在');
  }

  recordType.name = name;
  recordType.description = description;
  recordType.sort = sort;
  if (isActive !== undefined) {
    recordType.isActive = isActive;
  }
  recordType.updatedBy = userId;

  await recordType.save();

  // 重新查询以获取完整的populate信息
  const populatedRecordType = await RecordType.findById(recordType._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.json({
    success: true,
    data: populatedRecordType,
    message: '更新记录类型成功'
  });
});

// @desc    删除记录类型
// @route   DELETE /api/record-types/:id
// @access  Private
const deleteRecordType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const recordType = await RecordType.findById(id);
  if (!recordType) {
    res.status(404);
    throw new Error('记录类型不存在');
  }

  await recordType.remove();

  res.json({
    success: true,
    message: '删除记录类型成功'
  });
});

// @desc    添加小类
// @route   POST /api/record-types/:id/subcategories
// @access  Private
const addSubCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, sort } = req.body;
  const userId = req.user.id;

  const recordType = await RecordType.findById(id);
  if (!recordType) {
    res.status(404);
    throw new Error('记录类型不存在');
  }

  await recordType.addSubCategory({ name, description, sort }, userId);

  // 重新查询以获取完整的populate信息
  const populatedRecordType = await RecordType.findById(recordType._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(201).json({
    success: true,
    data: populatedRecordType,
    message: '添加小类成功'
  });
});

// @desc    更新小类
// @route   PUT /api/record-types/:id/subcategories/:subId
// @access  Private
const updateSubCategory = asyncHandler(async (req, res) => {
  const { id, subId } = req.params;
  const { name, description, sort, isActive } = req.body;
  const userId = req.user.id;

  const recordType = await RecordType.findById(id);
  if (!recordType) {
    res.status(404);
    throw new Error('记录类型不存在');
  }

  await recordType.updateSubCategory(subId, { name, description, sort, isActive }, userId);

  // 重新查询以获取完整的populate信息
  const populatedRecordType = await RecordType.findById(recordType._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.json({
    success: true,
    data: populatedRecordType,
    message: '更新小类成功'
  });
});

// @desc    删除小类
// @route   DELETE /api/record-types/:id/subcategories/:subId
// @access  Private
const deleteSubCategory = asyncHandler(async (req, res) => {
  const { id, subId } = req.params;
  const userId = req.user.id;

  const recordType = await RecordType.findById(id);
  if (!recordType) {
    res.status(404);
    throw new Error('记录类型不存在');
  }

  await recordType.removeSubCategory(subId, userId);

  // 重新查询以获取完整的populate信息
  const populatedRecordType = await RecordType.findById(recordType._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.json({
    success: true,
    data: populatedRecordType,
    message: '删除小类成功'
  });
});

// @desc    获取指定大类的小类
// @route   GET /api/record-types/:id/subcategories
// @access  Private
const getSubCategories = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subCategories = await RecordType.getSubCategories(id);

  res.json({
    success: true,
    data: subCategories,
    message: '获取小类成功'
  });
});

module.exports = {
  getRecordTypes,
  createRecordType,
  updateRecordType,
  deleteRecordType,
  addSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getSubCategories
};
