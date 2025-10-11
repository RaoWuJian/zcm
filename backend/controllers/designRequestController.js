const DesignRequest = require('../models/DesignRequest');
const User = require('../models/User');
const Department = require('../models/Department');
const { asyncHandler } = require('../middleware/error');
const { DepartmentPermissionManager } = require('../utils/departmentPermission');

// @desc    获取美工需求列表
// @route   GET /api/design-requests
// @access  Private
const getDesignRequests = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    department,
    assignedDesigner,
    startDate,
    endDate,
    keyword
  } = req.query;

  // 构建查询条件
  let query = {};

  // 权限过滤：管理员可以看所有，普通用户只能看自己部门的
  if (!req.user.isAdmin) {
    const userDepartmentIds = req.user.getDepartmentIds();
    if (userDepartmentIds.length > 0) {
      query.department = { $in: userDepartmentIds };
    } else {
      // 用户没有部门，只能看自己创建的
      query.createdBy = req.user._id;
    }
  }

  // 状态过滤
  if (status) {
    query.status = status;
  }

  // 部门过滤
  if (department) {
    query.department = department;
  }

  // 分配美工过滤
  if (assignedDesigner) {
    query.assignedDesigner = assignedDesigner;
  }

  // 日期范围过滤
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // 关键字搜索
  if (keyword) {
    query.$or = [
      { requirement: new RegExp(keyword, 'i') },
      { remark: new RegExp(keyword, 'i') }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // 执行查询
  const [requests, total] = await Promise.all([
    DesignRequest.find(query)
      .populate('department', 'departmentName')
      .populate('assignedDesigner', 'username')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .populate('images')
      .populate('attachmentFiles')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    DesignRequest.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: requests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// @desc    获取单个美工需求详情
// @route   GET /api/design-requests/:id
// @access  Private
const getDesignRequest = asyncHandler(async (req, res) => {
  const request = await DesignRequest.findById(req.params.id)
    .populate('department', 'departmentName')
    .populate('assignedDesigner', 'username')
    .populate('createdBy', 'username')
    .populate('updatedBy', 'username')
    .populate('images')
    .populate('attachmentFiles');

  if (!request) {
    res.status(404);
    throw new Error('美工需求不存在');
  }

  res.json({
    success: true,
    data: request
  });
});

// @desc    创建美工需求
// @route   POST /api/design-requests
// @access  Private
const createDesignRequest = asyncHandler(async (req, res) => {
  const { requirement, images, remark } = req.body;

  // 验证必填字段
  if (!requirement) {
    res.status(400);
    throw new Error('请输入需求描述');
  }

  // 获取用户的第一个部门作为提交部门
  const userDepartmentIds = req.user.getDepartmentIds();

  // 管理员可以不需要部门，普通用户必须有部门
  if (!req.user.isAdmin && userDepartmentIds.length === 0) {
    res.status(400);
    throw new Error('您还未分配部门，无法提交美工需求');
  }

  // 验证图片数量
  if (images && images.length > 9) {
    res.status(400);
    throw new Error('最多只能上传9张图片');
  }

  // 创建美工需求
  const designRequest = await DesignRequest.create({
    requirement,
    department: userDepartmentIds.length > 0 ? userDepartmentIds[0] : null, // 管理员可以没有部门
    images: images || [],
    remark: remark || '',
    status: 'pending',
    createdBy: req.user._id
  });

  // 重新查询以获取完整的populate信息
  const fullRequest = await DesignRequest.findById(designRequest._id)
    .populate('department', 'departmentName')
    .populate('assignedDesigner', 'username')
    .populate('createdBy', 'username')
    .populate('images')
    .populate('attachmentFiles');

  res.status(201).json({
    success: true,
    data: fullRequest,
    message: '美工需求创建成功'
  });
});

// @desc    更新美工需求
// @route   PUT /api/design-requests/:id
// @access  Private
const updateDesignRequest = asyncHandler(async (req, res) => {
  const request = await DesignRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('美工需求不存在');
  }

  const {
    requirement,
    images,
    assignedDesigner,
    expectedCompletionDate,
    attachmentFiles,
    status,
    remark
  } = req.body;

  // 权限检查：只有创建者或管理员可以编辑
  const isCreator = request.createdBy.toString() === req.user._id.toString();
  if (!req.user.isAdmin && !isCreator) {
    res.status(403);
    throw new Error('您没有权限修改此美工需求');
  }

  // 验证图片数量
  if (images && images.length > 9) {
    res.status(400);
    throw new Error('最多只能上传9张图片');
  }

  // 更新字段
  if (requirement !== undefined) request.requirement = requirement;
  if (images !== undefined) request.images = images;
  if (assignedDesigner !== undefined) request.assignedDesigner = assignedDesigner;
  if (expectedCompletionDate !== undefined) request.expectedCompletionDate = expectedCompletionDate;
  if (attachmentFiles !== undefined) request.attachmentFiles = attachmentFiles;
  if (status !== undefined) request.status = status;
  if (remark !== undefined) request.remark = remark;
  
  request.updatedBy = req.user._id;

  await request.save();

  // 重新查询以获取完整的populate信息
  const updatedRequest = await DesignRequest.findById(request._id)
    .populate('department', 'departmentName')
    .populate('assignedDesigner', 'username')
    .populate('createdBy', 'username')
    .populate('updatedBy', 'username')
    .populate('images')
    .populate('attachmentFiles');

  res.json({
    success: true,
    data: updatedRequest,
    message: '美工需求更新成功'
  });
});

// @desc    删除美工需求
// @route   DELETE /api/design-requests/:id
// @access  Private
const deleteDesignRequest = asyncHandler(async (req, res) => {
  const request = await DesignRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('美工需求不存在');
  }

  // 权限检查：只有创建者或管理员可以删除
  const isCreator = request.createdBy.toString() === req.user._id.toString();
  if (!req.user.isAdmin && !isCreator) {
    res.status(403);
    throw new Error('您没有权限删除此美工需求');
  }

  await DesignRequest.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: '美工需求删除成功'
  });
});

// @desc    批量删除美工需求
// @route   DELETE /api/design-requests/batch
// @access  Private
const batchDeleteDesignRequests = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('请提供要删除的美工需求ID列表');
  }

  // 查找所有要删除的需求
  const requests = await DesignRequest.find({ _id: { $in: ids } });

  if (requests.length === 0) {
    res.status(404);
    throw new Error('未找到要删除的美工需求');
  }

  // 权限检查：只能删除自己创建的或管理员可以删除所有
  if (!req.user.isAdmin) {
    const unauthorizedRequests = requests.filter(
      request => request.createdBy.toString() !== req.user._id.toString()
    );
    if (unauthorizedRequests.length > 0) {
      res.status(403);
      throw new Error('您没有权限删除部分美工需求');
    }
  }

  const result = await DesignRequest.deleteMany({ _id: { $in: ids } });

  res.json({
    success: true,
    message: `成功删除 ${result.deletedCount} 个美工需求`
  });
});

module.exports = {
  getDesignRequests,
  getDesignRequest,
  createDesignRequest,
  updateDesignRequest,
  deleteDesignRequest,
  batchDeleteDesignRequests
};

