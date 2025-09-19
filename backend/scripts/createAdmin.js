#!/usr/bin/env node
'use strict';

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
if (!process.env.MONGODB_URI) dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const User = require('../models/User');
const DEFAULT_URI = 'mongodb://localhost:27017/zcm_db';

function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
function requireArg(name, hint) {
  const v = getArg(name);
  if (!v) {

    process.exit(1);
  }
  return v;
}

async function main() {
  const username = requireArg('username', '显示姓名');
  const loginAccount = requireArg('account', '登录账号');
  const loginPassword = requireArg('password', '初始密码');
  const remark = getArg('remark') || '';

  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    let user = await User.findOne({ loginAccount });
    if (user) {
      user.isAdmin = true;
      if (remark) user.remark = remark;
      await user.save();

    } else {
      user = await User.create({
        username,
        loginAccount,
        loginPassword, // 将通过 User 的 pre-save 钩子进行哈希
        remark,
        isActive: true,
        isAdmin: true,
        departmentPath: ''
      });

    }
  } catch (err) {


    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((e) => {

  process.exit(1);
});

