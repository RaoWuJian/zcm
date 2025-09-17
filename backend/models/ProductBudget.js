const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    // 名称
    productName: {
        type: String,
        required: true,
        trim: true
    },

    // 售价
    sellingPrice: {
        type: Number,
        default: 0,
        min: 0
    },

    // 成本单价
    unitCost: {
        type: Number,
        default: 0,
        min: 0
    },

    // 产品运费
    shippingCost: {
        type: Number,
        default: 0,
        min: 0
    },

    // 平台费用
    platformFee: {
        type: Number,
        default: 0,
        min: 0
    },

    // 手续费
    handlingFee: {
        type: Number,
        default: 0,
        min: 0
    },

    // 毛利（自动计算）
    grossMargin: {
        type: Number,
        default: 0
    },

    // 实际佣金（自动计算，存储百分比）
    actualCommission: {
        type: Number,
        default: 0
    },

    // 备注
    description: {
        type: String,
        trim: true,
        maxlength: [200, '备注最多200个字符']
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

// 在保存前自动计算毛利和实际佣金
budgetSchema.pre('save', function(next) {
    // 毛利 = 售价 - 成本单价 - 产品运费 - 平台费用
    this.grossMargin = (this.sellingPrice || 0) -
        (this.unitCost || 0) -
        (this.shippingCost || 0) -
        (this.platformFee || 0);

    // 实际佣金 = 毛利/售价 (以百分比形式存储)
    if ((this.sellingPrice || 0) > 0) {
        this.actualCommission = (this.grossMargin / (this.sellingPrice || 0)) * 100;
    } else {
        this.actualCommission = 0;
    }

    next();
});

module.exports = mongoose.model('ProductBudget', budgetSchema);