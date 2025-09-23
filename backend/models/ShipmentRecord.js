const mongoose = require('mongoose');
const { precisionCalculate } = require('../utils/precision');

const shipmentRecordSchema = new mongoose.Schema({
    // 发货日期
    shipmentDate: {
        type: Date,
        required: [true, '发货日期不能为空'],
        default: Date.now
    },

    // 产品名称
    productName: {
        type: String,
        required: [true, '产品名称不能为空'],
        trim: true,
        maxlength: [200, '产品名称最多200个字符']
    },

    // 发货数量
    quantity: {
        type: Number,
        required: [true, '发货数量不能为空'],
        min: [0.01, '发货数量必须大于0']
    },

    // 单价
    unitPrice: {
        type: Number,
        required: [true, '单价不能为空'],
        min: [0, '单价不能为负数']
    },

    // 运费
    shippingFee: {
        type: Number,
        required: [true, '运费不能为空'],
        min: [0, '运费不能为负数'],
        default: 0
    },

    // 偏远地区加收运费
    remoteAreaFee: {
        type: Number,
        required: [true, '偏远地区加收运费不能为空'],
        min: [0, '偏远地区加收运费不能为负数'],
        default: 0
    },

    // 合计金额（自动计算：数量*单价 + 运费 + 偏远地区加收运费）
    totalAmount: {
        type: Number,
        default: 0
    },

    // 应收款单位
    receivableUnit: {
        type: String,
        required: [true, '应收款单位不能为空'],
        trim: true,
        maxlength: [200, '应收款单位最多200个字符']
    },

    // 备注
    remark: {
        type: String,
        trim: true,
        maxlength: [500, '备注最多500个字符'],
        default: ''
    },

    // 审批状态
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    // 审批人
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // 审批时间
    approvedAt: {
        type: Date
    },

    // 审批意见
    approvalComment: {
        type: String,
        trim: true,
        maxlength: [500, '审批意见最多500个字符'],
        default: ''
    },

    // 审批图片
    approvalImages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FileInfo'
    }],

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

// 更新时间中间件
shipmentRecordSchema.pre('save', function(next) {
    this.updatedAt = Date.now();

    // 自动计算合计金额，注意精度问题
    const productAmount = precisionCalculate.multiply(this.quantity || 0, this.unitPrice || 0);
    this.totalAmount = precisionCalculate.add(productAmount, this.shippingFee, this.remoteAreaFee);

    next();
});

// 索引
shipmentRecordSchema.index({ shipmentDate: -1 });
shipmentRecordSchema.index({ productName: 1 });
shipmentRecordSchema.index({ receivableUnit: 1 });
shipmentRecordSchema.index({ createdBy: 1 });
shipmentRecordSchema.index({ createdAt: -1 });

// 复合索引
shipmentRecordSchema.index({ shipmentDate: -1, receivableUnit: 1 });

module.exports = mongoose.model('ShipmentRecord', shipmentRecordSchema);
