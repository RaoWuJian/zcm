const express = require('express');
const {
  uploadFile,
  getFiles,
  getFileInfo,
  downloadFile,
  updateFileInfo,
  deleteFile,
  batchDeleteFiles
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 文件下载/查看不需要身份验证（用于图片显示）
router.get('/:id', downloadFile);

// 需要身份验证的路由
router.use(protect);

// 文件上传（包含 multer 错误处理）
router.post('/upload', uploadFile, (error, req, res, next) => {
  // 处理 multer 错误
  if (error) {
    console.error('文件上传错误:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || '文件上传失败'
    });
  }
  next();
});

// 文件列表
router.get('/', getFiles);

// 批量删除文件
router.delete('/batch', batchDeleteFiles);

// 文件信息路由
router.route('/info/:id')
  .get(getFileInfo)      // 获取文件信息
  .put(updateFileInfo);  // 更新文件信息

// 删除文件
router.delete('/:id', deleteFile);

module.exports = router;
