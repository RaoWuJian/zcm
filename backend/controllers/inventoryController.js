const { asyncHandler } = require('../middleware/error');
const Inventory = require('../models/Inventory');
const InventoryRecord = require('../models/InventoryRecord');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const FileInfo = require('../models/FileInfo');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// 字段显示名称映射
const getFieldDisplayName = (fieldName) => {
  const fieldMap = {
    'externalCode': '外部编码',
    'productionDate': '生产日期',
    'bulkDate': '批次日期',
    'specification': '规格',
    'manufacturer': '厂家',
    'productName': '产品名称',
    'remark': '备注',
    'images': '图片'
  };
  return fieldMap[fieldName] || fieldName;
};

// Multer配置 - 内存存储
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // 只允许图片文件
  const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只支持图片文件格式'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
  },
  fileFilter: fileFilter
});

// @desc    创建库存记录
// @route   POST /api/inventory
// @access  Private
const createInventory = asyncHandler(async (req, res) => {
  const {
    externalCode,
    productionDate,
    bulkDate,
    currentQuantity,
    specification,
    manufacturer,
    productName,
    remark,
    images
  } = req.body;

  // 验证必填字段
  if (currentQuantity === undefined || currentQuantity === null || currentQuantity === '') {
    return res.status(400).json({
      success: false,
      message: '当前库存数量不能为空'
    });
  }

  // 转换为数字并验证
  const quantity = Number(currentQuantity);
  if (isNaN(quantity)) {
    return res.status(400).json({
      success: false,
      message: '当前库存数量必须是有效数字'
    });
  }

  if (quantity < 0) {
    return res.status(400).json({
      success: false,
      message: '当前库存数量不能为负数'
    });
  }

  // 生成内部编码
  const internalCode = await Inventory.generateInternalCode();

  const inventory = await Inventory.create({
    externalCode,
    internalCode,
    productionDate,
    bulkDate,
    currentQuantity: quantity,
    specification,
    manufacturer,
    productName,
    remark: remark || '',
    images: images || [],
    createdBy: req.user.id
  });

  // 创建操作记录
  await InventoryRecord.create({
    inventoryId: inventory._id,
    operationType: 'create',
    quantity: quantity,
    quantityBefore: 0,
    quantityAfter: quantity,
    reason: '初始创建库存记录',
    externalCode,
    internalCode,
    productName,
    manufacturer,
    specification,
    operatedBy: req.user.id
  });

  // 返回创建的库存记录，包含创建者信息
  const populatedInventory = await Inventory.findById(inventory._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('images', 'filename originalName url mimeType size gridfsId');

  res.status(201).json({
    success: true,
    message: '库存记录创建成功',
    data: populatedInventory
  });
});

// @desc    获取所有库存记录
// @route   GET /api/inventory
// @access  Private
const getInventories = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    externalCode,
    internalCode,
    manufacturer,
    productName,
    specification,
    status,
    startDate,
    endDate,
    search
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

      const allowedUserIds = allowedUsers.map(u => u._id);

      // 限制只查看有权限的用户创建的库存记录
      if (allowedUserIds.length > 0) {
        query.createdBy = { $in: allowedUserIds };
      } else {
        // 如果没有权限访问任何用户，返回空结果
        query.createdBy = { $in: [] };
      }
    } else {
      // 如果用户没有部门信息，只能查看自己创建的记录
      query.createdBy = user.id;
    }
  }

  if (externalCode) query.externalCode = { $regex: externalCode, $options: 'i' };
  if (internalCode) query.internalCode = { $regex: internalCode, $options: 'i' };
  if (manufacturer) query.manufacturer = { $regex: manufacturer, $options: 'i' };
  if (productName) query.productName = { $regex: productName, $options: 'i' };
  if (specification) query.specification = { $regex: specification, $options: 'i' };
  if (status) query.status = status;

  // 日期范围查询
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
  }

  // 全文搜索
  if (search) {
    query.$or = [
      { externalCode: { $regex: search, $options: 'i' } },
      { internalCode: { $regex: search, $options: 'i' } },
      { manufacturer: { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
      { specification: { $regex: search, $options: 'i' } }
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // 获取总数
  const total = await Inventory.countDocuments(query);

  // 获取数据
  const inventories = await Inventory.find(query)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('images', 'filename originalName url mimeType size gridfsId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    data: inventories,
    pagination: {
      current: pageNum,
      total: Math.ceil(total / limitNum),
      count: inventories.length,
      totalRecords: total
    }
  });
});

// @desc    获取单个库存记录
// @route   GET /api/inventory/:id
// @access  Private
const getInventory = asyncHandler(async (req, res) => {
  const user = req.user;

  const inventory = await Inventory.findById(req.params.id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('images', 'filename originalName url mimeType size gridfsId');

  if (!inventory) {
    return res.status(404).json({
      success: false,
      message: '库存记录不存在'
    });
  }

  // 检查用户是否有权限查看此库存记录
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';
    const createdBy = inventory.createdBy;

    // 检查是否是用户自己创建的记录
    if (createdBy._id.toString() !== user.id) {
      // 如果不是自己创建的，检查是否是下属部门用户创建的
      if (userDepartmentPath && createdBy.departmentPath) {
        const isSubordinate = createdBy.departmentPath.startsWith(userDepartmentPath + '->');
        if (!isSubordinate) {
          return res.status(403).json({
            success: false,
            message: '没有权限查看此库存记录'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: '没有权限查看此库存记录'
        });
      }
    }
  }

  res.status(200).json({
    success: true,
    data: inventory
  });
});

// @desc    更新库存记录
// @route   PUT /api/inventory/:id
// @access  Private
const updateInventory = asyncHandler(async (req, res) => {
  const {
    externalCode,
    productionDate,
    bulkDate,
    specification,
    manufacturer,
    productName,
    remark,
    images
  } = req.body;

  const user = req.user;

  const inventory = await Inventory.findById(req.params.id)
    .populate('createdBy', 'username loginAccount departmentPath');

  if (!inventory) {
    return res.status(404).json({
      success: false,
      message: '库存记录不存在'
    });
  }

  // 检查用户是否有权限修改此库存记录
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';
    const createdBy = inventory.createdBy;

    // 检查是否是用户自己创建的记录
    if (createdBy._id.toString() !== user.id) {
      // 如果不是自己创建的，检查是否是下属部门用户创建的
      if (userDepartmentPath && createdBy.departmentPath) {
        const isSubordinate = createdBy.departmentPath.startsWith(userDepartmentPath + '->');
        if (!isSubordinate) {
          return res.status(403).json({
            success: false,
            message: '没有权限修改此库存记录'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: '没有权限修改此库存记录'
        });
      }
    }
  }

  // 记录更新前的信息
  const oldData = {
    externalCode: inventory.externalCode,
    productionDate: inventory.productionDate,
    bulkDate: inventory.bulkDate,
    specification: inventory.specification,
    manufacturer: inventory.manufacturer,
    productName: inventory.productName,
    remark: inventory.remark,
    images: inventory.images
  };

  // 处理图片更新和删除
  if (images !== undefined) {
    const oldImages = inventory.images || [];
    const newImages = images || [];

    // 找出被删除的图片
    const deletedImages = oldImages.filter(oldImageId =>
      !newImages.includes(oldImageId.toString())
    );

    // 删除被移除的图片文件
    if (deletedImages.length > 0) {
      const FileInfo = require('../models/FileInfo');
      const mongoose = require('mongoose');
      const { GridFSBucket } = require('mongodb');

      // 获取GridFS bucket
      const gfsBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });

      for (const imageId of deletedImages) {
        try {
          // 从FileInfo中获取文件信息
          const fileInfo = await FileInfo.findById(imageId);
          if (fileInfo && fileInfo.gridfsId) {
            // 从GridFS中删除文件
            await gfsBucket.delete(fileInfo.gridfsId);
          }
          // 删除FileInfo记录
          await FileInfo.findByIdAndDelete(imageId);
        } catch (fileError) {
          console.error(`删除库存记录图片文件失败 ${imageId}:`, fileError);
          // 继续删除其他文件，不中断整个更新过程
        }
      }
    }
  }

  // 更新库存记录
  inventory.externalCode = externalCode || inventory.externalCode;
  inventory.productionDate = productionDate || inventory.productionDate;
  inventory.bulkDate = bulkDate || inventory.bulkDate;
  inventory.specification = specification || inventory.specification;
  inventory.manufacturer = manufacturer || inventory.manufacturer;
  inventory.productName = productName || inventory.productName;
  inventory.remark = remark !== undefined ? remark : inventory.remark;
  inventory.images = images || inventory.images;
  inventory.updatedBy = req.user.id;

  await inventory.save();

  // 创建更新操作记录
  const changes = [];
  Object.keys(oldData).forEach(key => {
    if (oldData[key] !== inventory[key]) {
      let changeText = '';

      // 格式化不同类型的字段显示
      switch (key) {
        case 'productionDate':
        case 'bulkDate':
          const oldDate = oldData[key] ? new Date(oldData[key]).toLocaleDateString('zh-CN') : '未设置';
          const newDate = inventory[key] ? new Date(inventory[key]).toLocaleDateString('zh-CN') : '未设置';
          if (oldDate !== newDate) {
            changeText = `${getFieldDisplayName(key)}: ${oldDate} -> ${newDate}`;
          }
          break;
        case 'images':
          const oldImageCount = Array.isArray(oldData[key]) ? oldData[key].length : 0;
          const newImageCount = Array.isArray(inventory[key]) ? inventory[key].length : 0;
          if (oldImageCount !== newImageCount) {
            changeText = `${getFieldDisplayName(key)}: ${oldImageCount}张 -> ${newImageCount}张`;
          }
          break;
        default:
          const oldValue = oldData[key] || '未设置';
          const newValue = inventory[key] || '未设置';
          if (oldValue !== newValue) {
            changeText = `${getFieldDisplayName(key)}: ${oldValue} -> ${newValue}`;
          }
          break;
      }

      if (changeText) {
        changes.push(changeText);
      }
    }
  });

  if (changes.length > 0) {
    await InventoryRecord.create({
      inventoryId: inventory._id,
      operationType: 'update',
      quantity: 0,
      quantityBefore: inventory.currentQuantity,
      quantityAfter: inventory.currentQuantity,
      reason: `更新库存信息: ${changes.join(', ')}`,
      externalCode: inventory.externalCode,
      internalCode: inventory.internalCode,
      productName: inventory.productName,
      manufacturer: inventory.manufacturer,
      specification: inventory.specification,
      operatedBy: req.user.id
    });
  }

  // 返回更新后的库存记录
  const updatedInventory = await Inventory.findById(inventory._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('images', 'filename originalName url mimeType size gridfsId');

  res.status(200).json({
    success: true,
    message: '库存记录更新成功',
    data: updatedInventory
  });
});

// @desc    删除库存记录
// @route   DELETE /api/inventory/:id
// @access  Private
const deleteInventory = asyncHandler(async (req, res) => {
  const user = req.user;

  const inventory = await Inventory.findById(req.params.id)
    .populate('createdBy', 'username loginAccount departmentPath');

  if (!inventory) {
    return res.status(404).json({
      success: false,
      message: '库存记录不存在'
    });
  }

  // 检查用户是否有权限删除此库存记录
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';
    const createdBy = inventory.createdBy;

    // 检查是否是用户自己创建的记录
    if (createdBy._id.toString() !== user.id) {
      // 如果不是自己创建的，检查是否是下属部门用户创建的
      if (userDepartmentPath && createdBy.departmentPath) {
        const isSubordinate = createdBy.departmentPath.startsWith(userDepartmentPath + '->');
        if (!isSubordinate) {
          return res.status(403).json({
            success: false,
            message: '没有权限删除此库存记录'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: '没有权限删除此库存记录'
        });
      }
    }
  }

  // 检查是否还有库存
  if (inventory.currentQuantity > 0) {
    return res.status(400).json({
      success: false,
      message: '库存数量大于0，无法删除'
    });
  }

  try {
    // 1. 删除相关的图片文件
    if (inventory.images && inventory.images.length > 0) {


      // 获取GridFS bucket
      const gfsBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });

      for (const imageId of inventory.images) {
        try {
          // 从FileInfo中获取文件信息
          const fileInfo = await FileInfo.findById(imageId);
          if (fileInfo && fileInfo.gridfsId) {
            // 从GridFS中删除文件
            await gfsBucket.delete(fileInfo.gridfsId);
          }
          // 删除FileInfo记录
          await FileInfo.findByIdAndDelete(imageId);
        } catch (fileError) {
          console.error(`删除图片文件失败 ${imageId}:`, fileError);
          // 继续删除其他文件，不中断整个删除过程
        }
      }
    }

    // 2. 删除相关的操作记录
    await InventoryRecord.deleteMany({ inventoryId: req.params.id });

    // 3. 删除库存记录
    await Inventory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '库存记录及相关数据删除成功'
    });
  } catch (error) {
    console.error('删除库存记录时发生错误:', error);
    res.status(500).json({
      success: false,
      message: '删除库存记录时发生错误'
    });
  }
});

// @desc    出库操作
// @route   POST /api/inventory/:id/out
// @access  Private
const inventoryOut = asyncHandler(async (req, res) => {
  const { quantity, reason } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: '出库数量必须大于0'
    });
  }

  if (!reason || reason.trim() === '') {
    return res.status(400).json({
      success: false,
      message: '出库原因不能为空'
    });
  }

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return res.status(404).json({
      success: false,
      message: '库存记录不存在'
    });
  }

  if (inventory.currentQuantity < quantity) {
    return res.status(400).json({
      success: false,
      message: `库存不足，当前库存：${inventory.currentQuantity}`
    });
  }

  const quantityBefore = inventory.currentQuantity;
  const quantityAfter = quantityBefore - quantity;

  // 更新库存数量
  inventory.currentQuantity = quantityAfter;
  inventory.updatedBy = req.user.id;

  // 如果库存为0，更新状态为已耗尽
  if (quantityAfter === 0) {
    inventory.status = 'depleted';
  }

  await inventory.save();

  // 创建出库记录
  await InventoryRecord.create({
    inventoryId: inventory._id,
    operationType: 'out',
    quantity: -quantity, // 负数表示出库
    quantityBefore,
    quantityAfter,
    reason: reason.trim(),
    externalCode: inventory.externalCode,
    internalCode: inventory.internalCode,
    productName: inventory.productName,
    manufacturer: inventory.manufacturer,
    specification: inventory.specification,
    operatedBy: req.user.id
  });

  // 返回更新后的库存记录
  const updatedInventory = await Inventory.findById(inventory._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('images', 'filename originalName url mimeType size gridfsId');

  res.status(200).json({
    success: true,
    message: '出库操作成功',
    data: updatedInventory
  });
});

// @desc    入库操作
// @route   POST /api/inventory/:id/in
// @access  Private
const inventoryIn = asyncHandler(async (req, res) => {
  const { quantity, reason } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: '入库数量必须大于0'
    });
  }

  if (!reason || reason.trim() === '') {
    return res.status(400).json({
      success: false,
      message: '入库原因不能为空'
    });
  }

  const inventory = await Inventory.findById(req.params.id);

  if (!inventory) {
    return res.status(404).json({
      success: false,
      message: '库存记录不存在'
    });
  }

  const quantityBefore = inventory.currentQuantity;
  const quantityAfter = quantityBefore + quantity;

  // 更新库存数量
  inventory.currentQuantity = quantityAfter;
  inventory.updatedBy = req.user.id;

  // 如果之前是已耗尽状态，更新为活跃状态
  if (inventory.status === 'depleted') {
    inventory.status = 'active';
  }

  await inventory.save();

  // 创建入库记录
  await InventoryRecord.create({
    inventoryId: inventory._id,
    operationType: 'in',
    quantity: quantity, // 正数表示入库
    quantityBefore,
    quantityAfter,
    reason: reason.trim(),
    externalCode: inventory.externalCode,
    internalCode: inventory.internalCode,
    productName: inventory.productName,
    manufacturer: inventory.manufacturer,
    specification: inventory.specification,
    operatedBy: req.user.id
  });

  // 返回更新后的库存记录
  const updatedInventory = await Inventory.findById(inventory._id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('images', 'filename originalName url mimeType size gridfsId');

  res.status(200).json({
    success: true,
    message: '入库操作成功',
    data: updatedInventory
  });
});

module.exports = {
  createInventory: [upload.single('image'), createInventory],
  getInventories,
  getInventory,
  updateInventory: [upload.single('image'), updateInventory],
  deleteInventory,
  inventoryOut,
  inventoryIn,
  upload
};
