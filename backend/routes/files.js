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

// 所有路由都需要身份验证
router.use(protect);

// 文件上传
router.post('/upload', uploadFile);

// 文件列表
router.get('/', getFiles);

// 批量删除文件
router.delete('/batch', batchDeleteFiles);

// 文件信息路由
router.route('/info/:id')
  .get(getFileInfo)      // 获取文件信息
  .put(updateFileInfo);  // 更新文件信息

// 文件下载/查看和删除
router.route('/:id')
  .get(downloadFile)     // 下载/查看文件
  .delete(deleteFile);   // 删除文件

module.exports = router;
