const mongoose = require('mongoose');

const fileInfoSchema = new mongoose.Schema({
    // 唯一ID（MongoDB自动生成的_id）
    
    // 文件名称
    filename: {
        type: String,
        required: true,
        trim: true
    },

    // 原始文件名
    originalName: {
        type: String,
        required: true,
        trim: true
    },

    // 描述
    description: {
        type: String,
        trim: true,
        maxlength: [500, '描述最多500个字符']
    },

    // 文件格式/MIME类型
    mimeType: {
        type: String,
        required: true
    },

    // 文件扩展名
    extension: {
        type: String,
        required: true
    },

    // 文件大小（字节）
    size: {
        type: Number,
        required: true,
        min: 0
    },

    // GridFS文件ID
    gridfsId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    // 图片尺寸信息
    dimensions: {
        width: {
            type: Number,
            min: 0
        },
        height: {
            type: Number,
            min: 0
        }
    },

    // 文件路径（如果使用本地存储）
    path: {
        type: String
    },

    // 文件URL（用于访问）
    url: {
        type: String
    },

    // 文件状态
    status: {
        type: String,
        enum: ['uploading', 'completed', 'failed', 'deleted'],
        default: 'uploading'
    },

    // 文件标签
    tags: [{
        type: String,
        trim: true
    }],

    // 是否为公开文件
    isPublic: {
        type: Boolean,
        default: false
    },

    // 访问次数
    accessCount: {
        type: Number,
        default: 0
    },

    // 最后访问时间
    lastAccessedAt: {
        type: Date
    },

    // 创建者和更新者信息
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 创建索引
fileInfoSchema.index({ filename: 1 });
fileInfoSchema.index({ mimeType: 1 });
fileInfoSchema.index({ createdBy: 1 });
fileInfoSchema.index({ status: 1 });
fileInfoSchema.index({ tags: 1 });
fileInfoSchema.index({ createdAt: -1 });

// 虚拟字段：文件大小的可读格式
fileInfoSchema.virtual('readableSize').get(function() {
    const bytes = this.size;
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// 虚拟字段：是否为图片
fileInfoSchema.virtual('isImage').get(function() {
    return this.mimeType && this.mimeType.startsWith('image/');
});

// 更新访问统计
fileInfoSchema.methods.updateAccessStats = function() {
    this.accessCount += 1;
    this.lastAccessedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('FileInfo', fileInfoSchema);
