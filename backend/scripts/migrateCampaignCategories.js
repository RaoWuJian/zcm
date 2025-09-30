const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB连接成功');
  } catch (error) {
    console.error('MongoDB连接失败:', error);
    process.exit(1);
  }
};

// 旧的模式结构（用于查询现有数据）
const oldCampaignCategorySchema = new mongoose.Schema({
  name: String,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CampaignCategory' },
  level: Number,
  sortOrder: Number,
  isActive: Boolean,
  description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
});

const OldCampaignCategory = mongoose.model('OldCampaignCategory', oldCampaignCategorySchema, 'campaigncategories');

// 新的模型
const CampaignCategory = require('../models/CampaignCategory');

const migrateData = async () => {
  try {
    console.log('开始迁移投放分类数据...');
    
    // 1. 获取所有现有的大类（level = 1 或 parentId = null）
    const oldMainCategories = await OldCampaignCategory.find({
      $or: [
        { level: 1 },
        { parentId: null },
        { parentId: { $exists: false } }
      ]
    }).sort({ sortOrder: 1 });

    console.log(`找到 ${oldMainCategories.length} 个大类`);

    // 2. 清空新集合（谨慎操作）
    await CampaignCategory.deleteMany({});
    console.log('已清空新的分类集合');

    // 3. 为每个大类创建新的文档结构
    for (const oldMainCategory of oldMainCategories) {
      // 获取该大类下的所有小类
      const oldSubCategories = await OldCampaignCategory.find({
        parentId: oldMainCategory._id,
        level: 2
      }).sort({ sortOrder: 1 });

      console.log(`大类 "${oldMainCategory.name}" 有 ${oldSubCategories.length} 个小类`);

      // 构建子分类数组
      const subCategories = oldSubCategories.map(oldSub => ({
        _id: new mongoose.Types.ObjectId(),
        name: oldSub.name,
        description: oldSub.description || '',
        sortOrder: oldSub.sortOrder || 0,
        isActive: oldSub.isActive !== false,
        createdAt: oldSub.createdAt || new Date(),
        updatedAt: oldSub.updatedAt || new Date()
      }));

      // 创建新的大类文档
      const newMainCategory = new CampaignCategory({
        name: oldMainCategory.name,
        description: oldMainCategory.description || '',
        sortOrder: oldMainCategory.sortOrder || 0,
        isActive: oldMainCategory.isActive !== false,
        subCategories: subCategories,
        createdBy: oldMainCategory.createdBy,
        createdAt: oldMainCategory.createdAt || new Date(),
        updatedAt: oldMainCategory.updatedAt || new Date()
      });

      await newMainCategory.save();
      console.log(`✓ 已迁移大类: ${oldMainCategory.name}`);
    }

    console.log('\n迁移完成！');
    
    // 4. 验证迁移结果
    const newMainCategories = await CampaignCategory.find({});
    const totalSubCategories = newMainCategories.reduce((sum, cat) => sum + cat.subCategories.length, 0);
    
    console.log(`\n迁移结果验证:`);
    console.log(`- 大类数量: ${newMainCategories.length}`);
    console.log(`- 小类总数: ${totalSubCategories}`);
    
    // 5. 显示详细信息
    console.log(`\n详细信息:`);
    for (const category of newMainCategories) {
      console.log(`- ${category.name} (${category.subCategories.length} 个小类)`);
      category.subCategories.forEach(sub => {
        console.log(`  └─ ${sub.name}`);
      });
    }

  } catch (error) {
    console.error('迁移失败:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await migrateData();
    console.log('\n数据迁移完成！');
  } catch (error) {
    console.error('迁移过程出错:', error);
  } finally {
    await mongoose.connection.close();
    console.log('数据库连接已关闭');
    process.exit(0);
  }
};

// 运行迁移
main();






