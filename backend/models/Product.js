const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // 团队
    team: {
        type: String,
        required: true,
        trim: true
    },

    // 商品名称
    name: {
        type: String,
        required: true,
        trim: true
    },

    // 供货厂家
    supplier: {
        type: String,
        required: true,
        trim: true
    },

    // 店铺名称
    storeName: {
        type: String,
        required: true,
        trim: true
    },

    // 店铺id
    storeId: {
        type: String,
        trim: true
    },

    // 平台
    platform: {
        type: String,
        required: true,
        trim: true
    },

    // 当天销售订单数
    dailyOrderCount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // 当天销售盒数
    dailySalesVolume: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // 当天付款金额
    dailyPaymentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // 产品单价
    unitPrice: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // 产品成本
    productCost: {
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
    
    // 当天消耗金额
    dailyConsumedAmount: {
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
    
    // 售后金额
    afterSalesAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // 售后成本
    afterSalesCost: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // 当天总盈亏 (自动计算)
    dailyTotalProfit: {
        type: Number,
        default: 0
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

// 在保存前自动计算当天总盈亏
productSchema.pre('save', function(next) {
    // 当天总盈亏 = 当天付款金额 - (当天销售盒数 * 产品单价) - 产品运费 - 当天消耗金额 - 手续费
    this.dailyTotalProfit = (this.dailyPaymentAmount || 0) -
        ((this.dailySalesVolume || 0) * (this.unitPrice || 0)) -
        (this.shippingCost || 0) - 
        (this.dailyConsumedAmount || 0) -
        (this.handlingFee || 0);
    next();
});

// 在更新前自动计算当天总盈亏
// productSchema.pre('findOneAndUpdate', function(next) {
//     const update = this.getUpdate();
//     if (update.$set) {
//         const data = update.$set;
//         if (data.dailyPaymentAmount !== undefined || 
//             data.dailyConsumedAmount !== undefined || 
//             data.handlingFee !== undefined || 
//             data.afterSalesAmount !== undefined || 
//             data.afterSalesCost !== undefined) {
            
//             // 需要先获取原始数据来计算
//             this.model.findOne(this.getQuery()).then(doc => {
//                 if (doc) {
//                     data.dailyTotalProfit = (data.dailyPaymentAmount !== undefined ? data.dailyPaymentAmount : doc.dailyPaymentAmount || 0) - 
//                         (data.dailyConsumedAmount !== undefined ? data.dailyConsumedAmount : doc.dailyConsumedAmount || 0) - 
//                         (data.handlingFee !== undefined ? data.handlingFee : doc.handlingFee || 0) - 
//                         (data.afterSalesAmount !== undefined ? data.afterSalesAmount : doc.afterSalesAmount || 0) - 
//                         (data.afterSalesCost !== undefined ? data.afterSalesCost : doc.afterSalesCost || 0);
//                 }
//                 next();
//             }).catch(next);
//         } else {
//             next();
//         }
//     } else {
//         next();
//     }
// });

module.exports = mongoose.model('Product', productSchema);