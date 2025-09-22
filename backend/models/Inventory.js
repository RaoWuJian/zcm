const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    // 外部编码（手动填写）
    externalCode: {
        type: String,
        required: [true, '外部编码不能为空'],
        trim: true,
        maxlength: [50, '外部编码最多50个字符']
    },

    // 内部编码（按日期序号自动生成）
    internalCode: {
        type: String,
        required: [true, '内部编码不能为空'],
        unique: true,
        trim: true
    },

    // 生产日期
    productionDate: {
        type: Date,
        required: [true, '生产日期不能为空']
    },

    // 大货日期
    bulkDate: {
        type: Date,
        required: [true, '大货日期不能为空']
    },

    // 当前库存数量
    currentQuantity: {
        type: Number,
        required: [true, '数量不能为空'],
        min: [0, '数量不能为负数'],
        default: 0
    },



    // 规格
    specification: {
        type: String,
        required: [true, '规格不能为空'],
        trim: true,
        maxlength: [100, '规格最多100个字符']
    },

    // 厂家
    manufacturer: {
        type: String,
        required: [true, '厂家不能为空'],
        trim: true,
        maxlength: [100, '厂家最多100个字符']
    },

    // 货号名称
    productName: {
        type: String,
        required: [true, '货号名称不能为空'],
        trim: true,
        maxlength: [200, '货号名称最多200个字符']
    },

    // 备注
    remark: {
        type: String,
        trim: true,
        maxlength: [500, '备注最多500个字符'],
        default: ''
    },

    // 关联的图片文件
    images: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FileInfo'
    }],

    // 库存状态
    status: {
        type: String,
        enum: ['active', 'warning'],
        default: 'active'
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

// 更新时间和状态中间件
inventorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();

    // 自动更新状态：库存低于1000时设为预警，否则为活跃
    if (this.currentQuantity < 1000) {
        this.status = 'warning';
    } else {
        this.status = 'active';
    }

    next();
});

// 生成内部编码的静态方法
inventorySchema.statics.generateInternalCode = async function() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD格式
    
    // 查找今天已有的记录数量
    const count = await this.countDocuments({
        internalCode: { $regex: `^${dateStr}` }
    });
    
    // 生成序号（从001开始）
    const sequence = String(count + 1).padStart(3, '0');
    
    return `${dateStr}${sequence}`;
};

// 索引
inventorySchema.index({ externalCode: 1 });
// internalCode 已经通过 unique: true 自动创建索引，不需要重复创建
inventorySchema.index({ manufacturer: 1 });
inventorySchema.index({ productName: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Inventory', inventorySchema);
