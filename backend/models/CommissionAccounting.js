const mongoose = require('mongoose');

const commissionAccountingSchema = new mongoose.Schema({
    // 名字
    name: {
        type: String,
        required: true,
        trim: true
    },

    // 净成交数据
    netTransactionData: {
        type: Number,
        default: 0,
        min: 0
    },

    // 佣金（百分比）
    commission: {
        type: Number,
        default: 0,
        min: 0
    },

    // 佣金利润（自动计算）
    commissionProfit: {
        type: Number,
        default: 0
    },

    // 今日消耗
    dailyConsumption: {
        type: Number,
        default: 0,
        min: 0
    },

    // 净利润（自动计算）
    netProfit: {
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

// 在保存前自动计算佣金利润和净利润
commissionAccountingSchema.pre('save', function(next) {
    // 佣金利润 = 净成交数据 * 佣金
    this.commissionProfit = (this.netTransactionData || 0) * (this.commission || 0) / 100;
    
    // 净利润 = 佣金利润 - 今日消耗
    this.netProfit = this.commissionProfit - (this.dailyConsumption || 0);
    
    next();
});

module.exports = mongoose.model('CommissionAccounting', commissionAccountingSchema);
