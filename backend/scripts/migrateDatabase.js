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

  }
}

async function exportDatabase() {

  
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

}

async function importDatabase() {

  
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

  }
  
  await runCommand('mongorestore', args);

}

async function cleanupBackup() {
  if (hasFlag('cleanup')) {

    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });

  }
}

async function verifyMigration() {

  
  try {
    // 连接目标数据库验证
    const targetUri = `mongodb://${TARGET_HOST}/${DATABASE_NAME}`;
    await mongoose.connect(targetUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const collections = await mongoose.connection.db.listCollections().toArray();


    
    await mongoose.connection.close();

  } catch (err) {

  }
}

function printUsage() {
  
}

async function main() {
  if (hasFlag('help')) {
    printUsage();
    return;
  }
  




  
  try {
    await createBackupDir();
    await exportDatabase();
    await importDatabase();
    
    if (hasFlag('verify')) {
      await verifyMigration();
    }
    
    await cleanupBackup();
    

  } catch (err) {

    process.exit(1);
  }
}


