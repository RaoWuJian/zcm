const mongoose = require('mongoose');

const inventoryRecordSchema = new mongoose.Schema({
    // 关联的库存记录
    inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: [true, '库存记录ID不能为空']
    },

    // 操作类型
    operationType: {
        type: String,
        enum: ['in', 'out', 'adjust', 'create', 'update'],
        required: [true, '操作类型不能为空']
    },

    // 操作数量（正数为入库，负数为出库）
    quantity: {
        type: Number,
        required: [true, '操作数量不能为空']
    },

    // 操作前数量
    quantityBefore: {
        type: Number,
        required: [true, '操作前数量不能为空'],
        min: 0
    },

    // 操作后数量
    quantityAfter: {
        type: Number,
        required: [true, '操作后数量不能为空'],
        min: 0
    },

    // 操作原因/备注
    reason: {
        type: String,
        required: [true, '操作原因不能为空'],
        trim: true,
        maxlength: [500, '操作原因最多500个字符']
    },

    // 外部编码（冗余存储，便于查询）
    externalCode: {
        type: String,
        required: true,
        trim: true
    },

    // 内部编码（冗余存储，便于查询）
    internalCode: {
        type: String,
        required: true,
        trim: true
    },

    // 货号名称（冗余存储，便于查询）
    productName: {
        type: String,
        required: true,
        trim: true
    },

    // 厂家（冗余存储，便于查询）
    manufacturer: {
        type: String,
        required: true,
        trim: true
    },

    // 规格（冗余存储，便于查询）
    specification: {
        type: String,
        required: true,
        trim: true
    },

    // 操作人员
    operatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // 操作时间
    operatedAt: {
        type: Date,
        default: Date.now
    },

    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 操作类型的中文映射
inventoryRecordSchema.statics.getOperationTypeText = function(type) {
    const typeMap = {
        'in': '入库',
        'out': '出库',
        'adjust': '调整',
        'create': '创建',
        'update': '更新'
    };
    return typeMap[type] || type;
};

// 索引
inventoryRecordSchema.index({ inventoryId: 1 });
inventoryRecordSchema.index({ operationType: 1 });
inventoryRecordSchema.index({ externalCode: 1 });
inventoryRecordSchema.index({ internalCode: 1 });
inventoryRecordSchema.index({ productName: 1 });
inventoryRecordSchema.index({ manufacturer: 1 });
inventoryRecordSchema.index({ operatedBy: 1 });
inventoryRecordSchema.index({ operatedAt: -1 });
inventoryRecordSchema.index({ createdAt: -1 });

// 复合索引
inventoryRecordSchema.index({ inventoryId: 1, operatedAt: -1 });
inventoryRecordSchema.index({ operationType: 1, operatedAt: -1 });

module.exports = mongoose.model('InventoryRecord', inventoryRecordSchema);
