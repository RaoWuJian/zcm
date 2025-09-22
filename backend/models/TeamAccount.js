const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, '团队名称最多100个字符']
    },

    // 账户金额
    amount: {
        type: Number,
        required: true
    },

     // 每一个账号绑定一个部门（唯一）
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, '请选择关联部门']
    },

    description: {
        type: String,
        trim: true,
        maxlength: [500, '团队描述最多500个字符']
    },

    // 账户状态
    isActive: {
        type: Boolean,
        default: true
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

module.exports = mongoose.model('TeamAccount', teamSchema);