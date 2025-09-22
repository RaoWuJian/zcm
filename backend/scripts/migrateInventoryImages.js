const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 迁移函数
const migrateInventoryImages = async () => {
  try {
    console.log('开始迁移库存图片数据...');
    
    // 查找所有有 imagePath 但 images 为空的记录
    const inventories = await Inventory.find({
      imagePath: { $exists: true, $ne: null },
      $or: [
        { images: { $exists: false } },
        { images: { $size: 0 } }
      ]
    });
    
    console.log(`找到 ${inventories.length} 条需要迁移的记录`);
    
    let migratedCount = 0;
    
    for (const inventory of inventories) {
      try {
        // 将 imagePath 添加到 images 数组中
        if (inventory.imagePath) {
          inventory.images = [inventory.imagePath];
          
          // 保存更新
          await inventory.save();
          
          console.log(`迁移记录: ${inventory.internalCode} (${inventory.productName})`);
          migratedCount++;
        }
      } catch (error) {
        console.error(`迁移记录 ${inventory.internalCode} 失败:`, error.message);
      }
    }
    
    console.log(`迁移完成！成功迁移 ${migratedCount} 条记录`);
    
    // 可选：删除旧的 imagePath 字段
    console.log('开始清理旧的 imagePath 字段...');
    const result = await Inventory.updateMany(
      { imagePath: { $exists: true } },
      { $unset: { imagePath: 1 } }
    );
    
    console.log(`清理完成！清理了 ${result.modifiedCount} 条记录的 imagePath 字段`);
    
  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  }
};

// 主函数
const main = async () => {
  await connectDB();
  await migrateInventoryImages();
  
  console.log('迁移脚本执行完成');
  process.exit(0);
};

// 运行脚本
if (require.main === module) {
  main().catch(error => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = { migrateInventoryImages };
