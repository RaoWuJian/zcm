#!/usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置信息
const SOURCE_HOST = '113.44.144.112:27017';
const TARGET_HOST = 'kanglianxing.com:27017';
const DATABASE_NAME = 'zcm_db';
const BACKUP_DIR = './database_backup';

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`执行命令: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令执行失败，退出码: ${code}`));
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function createBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`创建备份目录: ${BACKUP_DIR}`);
  }
}

async function exportDatabase() {
  console.log('\n=== 开始导出源数据库 ===');
  
  const args = [
    '--host', SOURCE_HOST,
    '--db', DATABASE_NAME,
    '--out', BACKUP_DIR
  ];
  
  // 如果提供了源数据库认证信息
  const sourceUser = getArg('source-user');
  const sourcePass = getArg('source-pass');
  const sourceAuthDb = getArg('source-auth-db') || 'admin';
  
  if (sourceUser && sourcePass) {
    args.push('--username', sourceUser);
    args.push('--password', sourcePass);
    args.push('--authenticationDatabase', sourceAuthDb);
  }
  
  await runCommand('mongodump', args);
  console.log('数据库导出完成');
}

async function importDatabase() {
  console.log('\n=== 开始导入到目标数据库 ===');
  
  const backupPath = path.join(BACKUP_DIR, DATABASE_NAME);
  if (!fs.existsSync(backupPath)) {
    throw new Error(`备份文件不存在: ${backupPath}`);
  }
  
  const args = [
    '--host', TARGET_HOST,
    '--db', DATABASE_NAME,
    backupPath
  ];
  
  // 如果提供了目标数据库认证信息
  const targetUser = getArg('target-user');
  const targetPass = getArg('target-pass');
  const targetAuthDb = getArg('target-auth-db') || 'admin';
  
  if (targetUser && targetPass) {
    args.push('--username', targetUser);
    args.push('--password', targetPass);
    args.push('--authenticationDatabase', targetAuthDb);
  }
  
  // 如果指定了覆盖模式
  if (hasFlag('drop')) {
    args.push('--drop');
    console.log('警告: 将删除目标数据库中的现有数据');
  }
  
  await runCommand('mongorestore', args);
  console.log('数据库导入完成');
}

async function cleanupBackup() {
  if (hasFlag('cleanup')) {
    console.log('\n=== 清理备份文件 ===');
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    console.log('备份文件已清理');
  }
}

async function verifyMigration() {
  console.log('\n=== 验证迁移结果 ===');
  
  try {
    // 连接目标数据库验证
    const targetUri = `mongodb://${TARGET_HOST}/${DATABASE_NAME}`;
    await mongoose.connect(targetUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`目标数据库包含 ${collections.length} 个集合:`);
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    await mongoose.connection.close();
    console.log('迁移验证完成');
  } catch (err) {
    console.error('验证失败:', err.message);
  }
}

function printUsage() {
  console.log(`
MongoDB 数据库迁移工具

用法:
  node migrateDatabase.js [选项]

选项:
  --source-user <用户名>     源数据库用户名
  --source-pass <密码>       源数据库密码
  --source-auth-db <数据库>  源数据库认证数据库 (默认: admin)
  
  --target-user <用户名>     目标数据库用户名
  --target-pass <密码>       目标数据库密码
  --target-auth-db <数据库>  目标数据库认证数据库 (默认: admin)
  
  --drop                     导入前删除目标数据库现有数据
  --cleanup                  完成后清理备份文件
  --verify                   验证迁移结果
  --help                     显示此帮助信息

示例:
  # 简单迁移（无认证）
  node migrateDatabase.js --drop --cleanup --verify
  
  # 带认证的迁移
  node migrateDatabase.js --source-user admin --source-pass password123 --target-user admin --target-pass newpassword --drop --cleanup --verify
`);
}

async function main() {
  if (hasFlag('help')) {
    printUsage();
    return;
  }
  
  console.log('MongoDB 数据库迁移工具');
  console.log(`源服务器: ${SOURCE_HOST}`);
  console.log(`目标服务器: ${TARGET_HOST}`);
  console.log(`数据库: ${DATABASE_NAME}`);
  
  try {
    await createBackupDir();
    await exportDatabase();
    await importDatabase();
    
    if (hasFlag('verify')) {
      await verifyMigration();
    }
    
    await cleanupBackup();
    
    console.log('\n✅ 数据库迁移完成！');
  } catch (err) {
    console.error('\n❌ 迁移失败:', err.message);
    process.exit(1);
  }
}

main().catch(console.error);
