const { asyncHandler } = require('../middleware/error');
const ShipmentRecord = require('../models/ShipmentRecord');

// @desc    创建发货记录
// @route   POST /api/shipment-records
// @access  Private
const createShipmentRecord = asyncHandler(async (req, res) => {
  const {
    shipmentDate,
    productName,
    quantity,
    unitPrice,
    shippingFee = 0,
    remoteAreaFee = 0,
    receivableUnit,
    remark = ''
  } = req.body;

  // 验证必填字段
  if (!productName || !quantity || unitPrice === undefined || !receivableUnit) {
    return res.status(400).json({
      success: false,
      message: '请填写所有必填字段'
    });
  }

  // 验证发货数量
  const shipmentQuantity = Number(quantity);
  if (isNaN(shipmentQuantity) || shipmentQuantity <= 0) {
    return res.status(400).json({
      success: false,
      message: '发货数量必须是大于0的数字'
    });
  }

  // 验证单价
  const price = Number(unitPrice);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({
      success: false,
      message: '单价必须是非负数字'
    });
  }

  // 验证运费
  const shipping = Number(shippingFee);
  if (isNaN(shipping) || shipping < 0) {
    return res.status(400).json({
      success: false,
      message: '运费必须是非负数字'
    });
  }

  // 验证偏远地区加收运费
  const remoteFee = Number(remoteAreaFee);
  if (isNaN(remoteFee) || remoteFee < 0) {
    return res.status(400).json({
      success: false,
      message: '偏远地区加收运费必须是非负数字'
    });
  }

  // 创建发货记录
  const shipmentRecord = await ShipmentRecord.create({
    shipmentDate: shipmentDate || new Date(),
    productName: productName.trim(),
    quantity: shipmentQuantity,
    unitPrice: price,
    shippingFee: shipping,
    remoteAreaFee: remoteFee,
    receivableUnit: receivableUnit.trim(),
    remark: remark.trim(),
    createdBy: req.user.id
  });

  // 返回创建的发货记录，包含创建者信息
  const populatedRecord = await ShipmentRecord.findById(shipmentRecord._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('approvedBy', 'username loginAccount')
    .populate('approvalImages', 'filename originalName url mimeType size gridfsId');

  res.status(201).json({
    success: true,
    message: '发货记录创建成功',
    data: populatedRecord
  });
});

// @desc    批量创建发货记录
// @route   POST /api/shipment-records/batch
// @access  Private
const batchCreateShipmentRecord = asyncHandler(async (req, res) => {
  const { records } = req.body;

  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供有效的发货记录数据'
    });
  }

  if (records.length > 1000) {
    return res.status(400).json({
      success: false,
      message: '单次最多只能导入1000条记录'
    });
  }

  // 验证每条记录的必填字段
  const validationErrors = [];
  records.forEach((record, index) => {
    if (!record.shipmentDate) {
      validationErrors.push(`第${index + 1}条记录：发货日期不能为空`);
    }
    if (!record.productName || record.productName.trim() === '') {
      validationErrors.push(`第${index + 1}条记录：产品名称不能为空`);
    }
    if (record.quantity === undefined || record.quantity === null || record.quantity <= 0) {
      validationErrors.push(`第${index + 1}条记录：数量必须大于0`);
    }
    if (record.unitPrice === undefined || record.unitPrice === null || record.unitPrice < 0) {
      validationErrors.push(`第${index + 1}条记录：单价不能为负数`);
    }
    if (!record.receivableUnit || record.receivableUnit.trim() === '') {
      validationErrors.push(`第${index + 1}条记录：应收款单位不能为空`);
    }
    if (record.shippingFee !== undefined && record.shippingFee < 0) {
      validationErrors.push(`第${index + 1}条记录：运费不能为负数`);
    }
    if (record.remoteAreaFee !== undefined && record.remoteAreaFee < 0) {
      validationErrors.push(`第${index + 1}条记录：偏远地区加收运费不能为负数`);
    }
  });

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: validationErrors
    });
  }

  try {
    // 导入精度计算工具
    const { precisionCalculate } = require('../utils/precision');

    // 准备批量插入的数据，手动计算合计金额
    const baseTime = new Date();
    const recordsToInsert = records.map((record, index) => {
      const quantity = Number(record.quantity);
      const unitPrice = Number(record.unitPrice);
      const shippingFee = Number(record.shippingFee) || 0;
      const remoteAreaFee = Number(record.remoteAreaFee) || 0;

      // 手动计算合计金额
      const productAmount = precisionCalculate.multiply(quantity, unitPrice);
      const totalAmount = precisionCalculate.add(productAmount, shippingFee, remoteAreaFee);

      // 处理发货日期，确保有完整的时间信息用于排序
      // 使用递减的时间间隔，让最后导入的记录（数组后面的）有更新的时间，排在前面
      const reverseIndex = records.length - 1 - index;
      let shipmentDate;
      if (record.shipmentDate) {
        // 如果导入的日期只有年月日，添加时分秒确保排序一致性
        const dateStr = record.shipmentDate.toString();
        if (dateStr.length === 10 && dateStr.includes('-')) {
          // 格式如 "2024-01-01"，使用递减时间，最后的记录时间最新
          const baseDate = new Date(dateStr + 'T23:59:59.999Z');
          shipmentDate = new Date(baseDate.getTime() - reverseIndex * 1000); // 每条记录间隔1秒，递减
        } else {
          shipmentDate = new Date(record.shipmentDate);
        }
      } else {
        shipmentDate = new Date(baseTime.getTime() - reverseIndex * 1000);
      }

      // 创建时间也使用递减时间确保排序一致性，最后导入的记录时间最新
      const createdAt = new Date(baseTime.getTime() - reverseIndex * 100); // 每条记录间隔100毫秒，递减

      return {
        shipmentDate: shipmentDate,
        productName: record.productName.trim(),
        quantity: quantity,
        unitPrice: unitPrice,
        shippingFee: shippingFee,
        remoteAreaFee: remoteAreaFee,
        totalAmount: totalAmount,
        receivableUnit: record.receivableUnit.trim(),
        remark: record.remark ? record.remark.trim() : '',
        createdBy: req.user.id,
        createdAt: createdAt,
        updatedAt: createdAt
      };
    });

    // 批量插入
    const insertedRecords = await ShipmentRecord.insertMany(recordsToInsert);

    res.status(201).json({
      success: true,
      data: {
        insertedCount: insertedRecords.length,
        records: insertedRecords
      },
      message: `成功导入 ${insertedRecords.length} 条发货记录`
    });

  } catch (error) {
    console.error('批量创建发货记录失败:', error);
    res.status(500).json({
      success: false,
      message: '批量创建发货记录失败',
      error: error.message
    });
  }
});

// @desc    获取发货记录列表
// @route   GET /api/shipment-records
// @access  Private
const getShipmentRecords = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    productName,
    receivableUnit,
    startDate,
    endDate,
    search,
    approvalStatus
  } = req.query;

  const user = req.user;

  // 构建查询条件
  const query = {};

  // 根据用户部门权限过滤数据
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';

    if (userDepartmentPath) {
      // 转义正则表达式特殊字符
      const escapedPath = userDepartmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // 获取当前部门及其子部门的用户
      const User = require('../models/User');
      const allowedUsers = await User.find({
        $or: [
          { _id: user.id }, // 当前部门用户
          { departmentPath: { $regex: `^${escapedPath}->` } }, // 子部门用户
        ]
      }).select('_id');

      const allowedUserIds = allowedUsers.map(user => user._id);

      // 限制只查看有权限的用户创建的记录
      if (allowedUserIds.length > 0) {
        query.createdBy = { $in: allowedUserIds };
      } else {
        // 如果没有权限访问任何用户，返回空结果
        query.createdBy = { $in: [] };
      }
    } else {
      // 没有部门的用户只能查看自己创建的记录
      query.createdBy = user.id;
    }
  }

  if (productName) {
    query.productName = { $regex: productName, $options: 'i' };
  }

  if (receivableUnit) {
    query.receivableUnit = { $regex: receivableUnit, $options: 'i' };
  }

  // 审批状态查询
  if (approvalStatus) {
    query.approvalStatus = approvalStatus;
  }

  // 日期范围查询
  if (startDate || endDate) {
    query.shipmentDate = {};
    if (startDate) {
      query.shipmentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query.shipmentDate.$lte = endDateTime;
    }
  }

  // 全文搜索
  if (search) {
    query.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { receivableUnit: { $regex: search, $options: 'i' } },
      { remark: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // 获取总数
  const total = await ShipmentRecord.countDocuments(query);

  // 获取数据
  const records = await ShipmentRecord.find(query)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('approvedBy', 'username loginAccount')
    .populate('approvalImages', 'filename originalName url mimeType size gridfsId')
    .sort({ shipmentDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    data: records,
    pagination: {
      current: pageNum,
      total: Math.ceil(total / limitNum),
      count: records.length,
      totalRecords: total
    }
  });
});

// @desc    获取单个发货记录
// @route   GET /api/shipment-records/:id
// @access  Private
const getShipmentRecord = asyncHandler(async (req, res) => {
  const record = await ShipmentRecord.findById(req.params.id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('approvedBy', 'username loginAccount')
    .populate('approvalImages', 'filename originalName url mimeType size gridfsId');

  if (!record) {
    return res.status(404).json({
      success: false,
      message: '发货记录不存在'
    });
  }

  res.status(200).json({
    success: true,
    data: record
  });
});

// @desc    更新发货记录
// @route   PUT /api/shipment-records/:id
// @access  Private
const updateShipmentRecord = asyncHandler(async (req, res) => {
  const {
    shipmentDate,
    productName,
    quantity,
    unitPrice,
    shippingFee,
    remoteAreaFee,
    receivableUnit,
    remark
  } = req.body;

  // 查找发货记录
  const record = await ShipmentRecord.findById(req.params.id);
  if (!record) {
    return res.status(404).json({
      success: false,
      message: '发货记录不存在'
    });
  }

  // 更新其他字段
  if (shipmentDate !== undefined) {
    record.shipmentDate = shipmentDate;
  }

  if (productName !== undefined) {
    if (!productName.trim()) {
      return res.status(400).json({
        success: false,
        message: '产品名称不能为空'
      });
    }
    record.productName = productName.trim();
  }

  if (quantity !== undefined) {
    const shipmentQuantity = Number(quantity);
    if (isNaN(shipmentQuantity) || shipmentQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '发货数量必须是大于0的数字'
      });
    }
    record.quantity = shipmentQuantity;
  }

  if (unitPrice !== undefined) {
    const price = Number(unitPrice);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: '单价必须是非负数字'
      });
    }
    record.unitPrice = price;
  }

  if (shippingFee !== undefined) {
    const shipping = Number(shippingFee);
    if (isNaN(shipping) || shipping < 0) {
      return res.status(400).json({
        success: false,
        message: '运费必须是非负数字'
      });
    }
    record.shippingFee = shipping;
  }

  if (remoteAreaFee !== undefined) {
    const remoteFee = Number(remoteAreaFee);
    if (isNaN(remoteFee) || remoteFee < 0) {
      return res.status(400).json({
        success: false,
        message: '偏远地区加收运费必须是非负数字'
      });
    }
    record.remoteAreaFee = remoteFee;
  }

  if (receivableUnit !== undefined) {
    if (!receivableUnit.trim()) {
      return res.status(400).json({
        success: false,
        message: '应收款单位不能为空'
      });
    }
    record.receivableUnit = receivableUnit.trim();
  }

  if (remark !== undefined) {
    record.remark = remark.trim();
  }

  record.updatedBy = req.user.id;

  // 保存更新
  await record.save();

  // 返回更新后的记录
  const populatedRecord = await ShipmentRecord.findById(record._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('approvedBy', 'username loginAccount')
    .populate('approvalImages', 'filename originalName url mimeType size gridfsId');

  res.status(200).json({
    success: true,
    message: '发货记录更新成功',
    data: populatedRecord
  });
});

// @desc    删除发货记录
// @route   DELETE /api/shipment-records/:id
// @access  Private
const deleteShipmentRecord = asyncHandler(async (req, res) => {
  const record = await ShipmentRecord.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: '发货记录不存在'
    });
  }

  await ShipmentRecord.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: '发货记录删除成功'
  });
});

// @desc    获取发货记录统计信息
// @route   GET /api/shipment-records/stats
// @access  Private
const getShipmentStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // 构建日期查询条件
  const dateQuery = {};
  if (startDate || endDate) {
    dateQuery.shipmentDate = {};
    if (startDate) {
      dateQuery.shipmentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      dateQuery.shipmentDate.$lte = endDateTime;
    }
  }

  // 总记录数和总金额
  const totalStats = await ShipmentRecord.aggregate([
    { $match: dateQuery },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  // 按应收款单位统计
  const unitStats = await ShipmentRecord.aggregate([
    { $match: dateQuery },
    {
      $group: {
        _id: '$receivableUnit',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalQuantity: { $sum: '$quantity' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 }
  ]);

  // 按产品统计
  const productStats = await ShipmentRecord.aggregate([
    { $match: dateQuery },
    {
      $group: {
        _id: {
          productName: '$productName',
          manufacturer: '$manufacturer'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        totalQuantity: { $sum: '$quantity' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 }
  ]);

  const stats = {
    total: totalStats[0] || {
      totalRecords: 0,
      totalAmount: 0,
      totalQuantity: 0
    },
    byUnit: unitStats,
    byProduct: productStats
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    审批发货记录
// @route   PUT /api/shipment-records/:id/approve
// @access  Private
const approveShipmentRecord = asyncHandler(async (req, res) => {
  const { approvalStatus, approvalComment, approvalImageIds } = req.body;

  // 验证审批状态
  if (!['approved', 'rejected'].includes(approvalStatus)) {
    return res.status(400).json({
      success: false,
      message: '审批状态必须是 approved 或 rejected'
    });
  }

  // 查找发货记录
  const shipmentRecord = await ShipmentRecord.findById(req.params.id);

  if (!shipmentRecord) {
    return res.status(404).json({
      success: false,
      message: '发货记录不存在'
    });
  }

  // 检查是否已经审批过
  if (shipmentRecord.approvalStatus !== 'pending') {
    return res.status(400).json({
      success: false,
      message: '该发货记录已经审批过，无法重复审批'
    });
  }

  // 更新审批信息
  shipmentRecord.approvalStatus = approvalStatus;
  shipmentRecord.approvalComment = approvalComment || '';
  shipmentRecord.approvedBy = req.user.id;
  shipmentRecord.approvedAt = new Date();
  shipmentRecord.updatedBy = req.user.id;

  // 如果有审批图片，添加到记录中
  if (approvalImageIds && Array.isArray(approvalImageIds) && approvalImageIds.length > 0) {
    shipmentRecord.approvalImages = approvalImageIds;
  }

  await shipmentRecord.save();

  // 重新查询以获取完整的populate信息
  const updatedRecord = await ShipmentRecord.findById(shipmentRecord._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('approvedBy', 'username loginAccount')
    .populate('approvalImages', 'filename originalName url mimeType size gridfsId');

  res.status(200).json({
    success: true,
    data: updatedRecord,
    message: `发货记录${approvalStatus === 'approved' ? '审批通过' : '审批拒绝'}`
  });
});

module.exports = {
  createShipmentRecord,
  batchCreateShipmentRecord,
  getShipmentRecords,
  getShipmentRecord,
  updateShipmentRecord,
  deleteShipmentRecord,
  getShipmentStats,
  approveShipmentRecord
};
