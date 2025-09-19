const FileInfo = require('../models/FileInfo');
const { asyncHandler } = require('../middleware/error');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const crypto = require('crypto');

// GridFS bucket
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

// 辅助函数：检查用户是否有权限访问文件
const checkFileAccess = async (fileId, user) => {
  const file = await FileInfo.findById(fileId).populate('createdBy');
  
  if (!file) {
    return { hasAccess: false, file: null, error: '文件不存在' };
  }

  // 公开文件任何人都可以访问
  if (file.isPublic) {
    return { hasAccess: true, file, error: null };
  }

  // 管理员可以访问所有文件
  if (user.isAdmin) {
    return { hasAccess: true, file, error: null };
  }

  // 检查创建者是否在用户的部门权限范围内
  const createdByUser = file.createdBy;
  if (!createdByUser) {
    return { hasAccess: false, file: null, error: '无法确定文件创建者' };
  }

  const userDepartmentPath = user.departmentPath || '';
  const createdByDepartmentPath = createdByUser.departmentPath || '';

  // 检查是否是同一部门或子部门
  if (createdByDepartmentPath === userDepartmentPath || 
      createdByDepartmentPath.startsWith(userDepartmentPath + '->')) {
    return { hasAccess: true, file, error: null };
  }

  return { hasAccess: false, file: null, error: '无权限访问此文件' };
};

// 生成唯一文件名
const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `${timestamp}_${random}${ext}`;
};

// 获取图片尺寸信息
const getImageDimensions = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch (error) {
    return null;
  }
};

// Multer配置 - 内存存储
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedTypes = /jpeg|jpg|png|gif|bmp|webp|svg|pdf|doc|docx|xls|xlsx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
  fileFilter: fileFilter
});

// @desc    上传文件
// @route   POST /api/files/upload
// @access  Private
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: '请选择要上传的文件'
    });
  }

  const { description, tags, isPublic } = req.body;
  const file = req.file;

  try {
    // 生成唯一文件名
    const uniqueFilename = generateUniqueFilename(file.originalname);
    const extension = path.extname(file.originalname).toLowerCase().substring(1);

    // 获取图片尺寸（如果是图片）
    let dimensions = null;
    if (file.mimetype.startsWith('image/')) {
      dimensions = await getImageDimensions(file.buffer);
    }

    // 创建GridFS上传流
    const uploadStream = gfsBucket.openUploadStream(uniqueFilename, {
      metadata: {
        originalName: file.originalname,
        uploadedBy: req.user ? req.user.id : null,
        uploadedAt: new Date()
      }
    });

    // 上传文件到GridFS
    const gridfsId = await new Promise((resolve, reject) => {
      uploadStream.end(file.buffer);
      
      uploadStream.on('finish', () => {
        resolve(uploadStream.id);
      });
      
      uploadStream.on('error', (error) => {
        reject(error);
      });
    });

    // 创建文件信息记录
    const fileInfo = await FileInfo.create({
      filename: uniqueFilename,
      originalName: file.originalname,
      description: description || '',
      mimeType: file.mimetype,
      extension: extension,
      size: file.size,
      gridfsId: gridfsId,
      dimensions: dimensions,
      url: `/api/files/${gridfsId}`,
      status: 'completed',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublic: isPublic === 'true',
      createdBy: req.user ? req.user.id : null
    });

    // 重新查询以获取完整的populate信息
    const fullFileInfo = await FileInfo.findById(fileInfo._id)
      .populate('createdBy', 'username loginAccount')
      .populate('updatedBy', 'username loginAccount');

    res.status(201).json({
      success: true,
      data: fullFileInfo,
      message: '文件上传成功'
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

// @desc    获取文件列表
// @route   GET /api/files
// @access  Private
const getFiles = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    filename,
    mimeType,
    status,
    isPublic,
    tags,
    startDate,
    endDate,
    search
  } = req.query;
  const user = req.user;

  // 构建查询条件
  const query = {};

  if (filename) query.filename = { $regex: filename, $options: 'i' };
  if (mimeType) query.mimeType = { $regex: mimeType, $options: 'i' };
  if (status) query.status = status;
  if (isPublic !== undefined) query.isPublic = isPublic === 'true';
  if (tags) query.tags = { $in: tags.split(',').map(tag => tag.trim()) };

  // 获取用户有权限访问的用户ID列表（基于部门权限）
  let allowedUserIds = [];
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';
    
    if (userDepartmentPath) {
      // 转义正则表达式特殊字符
      const escapedPath = userDepartmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // 获取当前部门及其子部门的用户
      const User = require('../models/User');
      const allowedUsers = await User.find({
        $or: [
          { departmentPath: userDepartmentPath }, // 当前部门用户
          { departmentPath: { $regex: `^${escapedPath}->` } }, // 子部门用户
        ]
      }).select('_id');
      
      allowedUserIds = allowedUsers.map(user => user._id);
    }
    
    // 限制只查看有权限的用户创建的文件或公开文件
    query.$or = [
      { isPublic: true }, // 公开文件
      { createdBy: { $in: allowedUserIds } } // 有权限的用户创建的文件
    ];
  }

  // 日期范围查询
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // 搜索功能
  if (search) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { filename: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ]
    });
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const files = await FileInfo.find(query)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await FileInfo.countDocuments(query);

  res.status(200).json({
    success: true,
    data: files,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
});

// @desc    获取单个文件信息
// @route   GET /api/files/info/:id
// @access  Private
const getFileInfo = asyncHandler(async (req, res) => {
  const { hasAccess, file, error } = await checkFileAccess(req.params.id, req.user);

  if (!hasAccess) {
    return res.status(file === null ? 404 : 403).json({
      success: false,
      message: error
    });
  }

  // 重新查询以获取完整的populate信息
  const fullFileInfo = await FileInfo.findById(req.params.id)
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  res.status(200).json({
    success: true,
    data: fullFileInfo
  });
});

// @desc    下载/查看文件
// @route   GET /api/files/:id
// @access  Private
const downloadFile = asyncHandler(async (req, res) => {
  try {
    const file = await FileInfo.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 更新访问统计
    await file.updateAccessStats();

    // 创建GridFS下载流
    const downloadStream = gfsBucket.openDownloadStream(file.gridfsId);

    // 设置响应头
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
      'Cache-Control': 'public, max-age=31536000' // 缓存1年
    });

    // 流式传输文件
    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      
      if (!res.headersSent) {
        res.status(404).json({
          success: false,
          message: '文件不存在或已损坏'
        });
      }
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '文件访问失败'
    });
  }
});

// @desc    更新文件信息
// @route   PUT /api/files/info/:id
// @access  Private
const updateFileInfo = asyncHandler(async (req, res) => {
  try {
    const file = await FileInfo.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    const { description, tags, isPublic } = req.body;

    const updateData = {
      updatedBy: req.user ? req.user.id : null,
      updatedAt: Date.now()
    };

    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags.split(',').map(tag => tag.trim());
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const updatedFile = await FileInfo.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'username loginAccount')
     .populate('updatedBy', 'username loginAccount');

    res.status(200).json({
      success: true,
      data: updatedFile,
      message: '文件信息更新成功'
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '更新文件信息失败'
    });
  }
});

// @desc    删除文件
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = asyncHandler(async (req, res) => {
  try {
    const file = await FileInfo.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 从GridFS删除文件
    if (file.gridfsId) {
      await gfsBucket.delete(file.gridfsId);
    }

    // 删除文件信息记录
    await FileInfo.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '文件删除成功'
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '文件删除失败'
    });
  }
});

// @desc    批量删除文件
// @route   DELETE /api/files/batch
// @access  Private
const batchDeleteFiles = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供要删除的文件ID数组'
    });
  }

  try {
    // 查找所有要删除的文件
    const files = await FileInfo.find({
      _id: { $in: ids }
    });

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到要删除的文件'
      });
    }

    // 从GridFS删除文件
    await Promise.all(
      files.map(file => {
        if (file.gridfsId) {
          return gfsBucket.delete(file.gridfsId);
        }
        return Promise.resolve();
      })
    );

    // 删除文件信息记录
    const result = await FileInfo.deleteMany({
      _id: { $in: ids }
    });

    res.status(200).json({
      success: true,
      message: `成功删除 ${result.deletedCount} 个文件`
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '批量删除文件失败'
    });
  }
});

module.exports = {
  uploadFile: [upload.single('file'), uploadFile],
  getFiles,
  getFileInfo,
  downloadFile,
  updateFileInfo,
  deleteFile,
  batchDeleteFiles,
  checkFileAccess
};
