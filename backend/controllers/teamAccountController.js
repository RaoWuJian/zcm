const TeamAccount = require('../models/TeamAccount');
const Department = require('../models/Department');
const Finance = require('../models/Finance');
const AccountRecord = require('../models/AccountRecord');
const { asyncHandler } = require('../middleware/error');
const { precisionCalculate } = require('../utils/precision');

// @desc    创建团队账户
// @route   POST /api/team-accounts
// @access  Private
const createTeamAccount = asyncHandler(async (req, res) => {
  const { name, amount, departmentId, description } = req.body;

  // 验证必填字段
  if (!name) {
    return res.status(400).json({
      success: false,
      message: '请输入团队账户名称'
    });
  }

  if (!departmentId) {
    return res.status(400).json({
      success: false,
      message: '请选择关联部门'
    });
  }

  if (amount === undefined || amount === null) {
    return res.status(400).json({
      success: false,
      message: '请输入初始金额'
    });
  }

  // 验证部门是否存在且启用
  const department = await Department.findById(departmentId);
  if (!department) {
    return res.status(400).json({
      success: false,
      message: '指定的部门不存在'
    });
  }

  if (!department.isActive) {
    return res.status(400).json({
      success: false,
      message: '指定的部门已禁用，无法创建团队账户'
    });
  }

  // 检查该部门是否已有团队账户（一个部门只能有一个团队账户）
  const existingAccount = await TeamAccount.findOne({ departmentId });
  if (existingAccount) {
    return res.status(400).json({
      success: false,
      message: '该部门已存在团队账户，一个部门只能有一个团队账户'
    });
  }

  const teamAccount = await TeamAccount.create({
    name,
    amount: Number(amount),
    departmentId,
    description: description || '',
    createdBy: req.user.id
  });

  // 如果初始金额大于0，创建初始化记录
  if (Number(amount) > 0) {
    // 创建初始化财务记录
    const initRecord = await Finance.create({
      teamId: teamAccount._id,
      name: `团队账户初始化 - ${teamAccount.name}`,
      type: 'income',
      amount: Number(amount),
      occurredAt: new Date(),
      paymentMethod: '初始化',
      paymentName: '系统初始化',
      description: description || `团队账户初始化金额 ${amount} 元`,
      approvalStatus: 'approved', // 初始化自动审批通过
      approvedBy: req.user.id,
      approvedAt: new Date(),
      createdBy: req.user.id
    });

    // 创建对应的账户记录
    await AccountRecord.create({
      teamAccountId: teamAccount._id,
      financeId: initRecord._id,
      type: 'income',
      amount: Number(amount),
      balanceBefore: 0,
      balanceAfter: Number(amount),
      description: `团队账户初始化: ${description || '账户初始化'}`,
      status: 'completed',
      occurredAt: new Date(),
      approvedAt: new Date(),
      approvedBy: req.user.id,
      createdBy: req.user.id,
      remarks: `初始化金额: ${amount}，创建人: ${req.user.username || req.user.loginAccount}`
    });
  }

  // 返回时包含部门信息
  const populatedAccount = await TeamAccount.findById(teamAccount._id)
    .populate('departmentId', 'departmentName departmentCode')
    .populate('createdBy', 'username loginAccount');

  res.status(201).json({
    success: true,
    message: '团队账户创建成功',
    data: populatedAccount
  });
});

// @desc    获取所有团队账户
// @route   GET /api/team-accounts
// @access  Private
const getTeamAccounts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    isActive
  } = req.query;
  const user = req.user;

  // 构建基础查询条件
  let query = {};
  
  if (typeof isActive === 'string') {
    query.isActive = isActive === 'true';
  }

  // 搜索功能（按名称、描述、部门名称搜索）
  let searchConditions = [];
  if (search) {
    searchConditions = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // 获取用户有权限访问的部门ID列表
  let allowedDepartmentIds = [];
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';
    
    if (userDepartmentPath) {
      // 转义正则表达式特殊字符
      const escapedPath = userDepartmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // 查找当前部门及其子部门
      const Department = require('../models/Department');
      const allowedDepartments = await Department.find({
        $or: [
          { departmentPath: userDepartmentPath }, // 当前部门
          { departmentPath: { $regex: `^${escapedPath}->` } }, // 子部门
        ]
      }).select('_id departmentName departmentCode');
      
      allowedDepartmentIds = allowedDepartments.map(dept => dept._id);

      // 如果有搜索条件，也支持按部门名称搜索
      if (search) {
        const matchingDepts = allowedDepartments.filter(dept => 
          dept.departmentName?.toLowerCase().includes(search.toLowerCase()) ||
          dept.departmentCode?.toLowerCase().includes(search.toLowerCase())
        );
        
        if (matchingDepts.length > 0) {
          searchConditions.push({
            departmentId: { $in: matchingDepts.map(dept => dept._id) }
          });
        }
      }
    } else {
      // 如果用户没有部门信息，只能查看没有部门关联的团队账户
      allowedDepartmentIds = []; // 空数组表示只查看无部门关联的账户
    }
  }

  // 构建最终查询条件
  let finalQuery = { ...query };

  // 添加部门权限限制
  if (!user.isAdmin) {
    if (allowedDepartmentIds.length > 0) {
      finalQuery.departmentId = { $in: allowedDepartmentIds };
    } else {
      finalQuery.$or = [
        { departmentId: { $exists: false } },
        { departmentId: null }
      ];
    }
  }

  // 添加搜索条件
  if (searchConditions.length > 0) {
    if (finalQuery.$or) {
      // 如果已有$or条件（无部门限制），需要合并
      finalQuery.$and = [
        { $or: finalQuery.$or },
        { $or: searchConditions }
      ];
      delete finalQuery.$or;
    } else {
      finalQuery.$or = searchConditions;
    }
  }

  const skip = (page - 1) * limit;

  const teamAccounts = await TeamAccount.find(finalQuery)
    .populate('departmentId', 'departmentName departmentCode departmentPath level')
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await TeamAccount.countDocuments(finalQuery);

  // 计算每个账户的本月收支统计
  const accountsWithStats = await Promise.all(
    teamAccounts.map(async (account) => {
      const accountObj = account.toObject();
      
      // 获取本月开始和结束时间
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      try {
        // 统计本月收支
        const monthlyStats = await AccountRecord.aggregate([
          {
            $match: {
              teamAccountId: account._id,
              status: 'completed',
              occurredAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
              }
            }
          },
          {
            $group: {
              _id: '$type',
              totalAmount: { $sum: '$amount' }
            }
          }
        ]);

        // 初始化统计值
        let monthlyIncome = 0;
        let monthlyExpense = 0;

        // 处理统计结果
        monthlyStats.forEach(stat => {
          if (stat._id === 'income' || stat._id === 'recharge') {
            monthlyIncome = precisionCalculate.add(monthlyIncome, Math.abs(stat.totalAmount));
          } else if (stat._id === 'expense') {
            monthlyExpense = precisionCalculate.add(monthlyExpense, Math.abs(stat.totalAmount));
          }
        });

        // 添加统计数据到账户对象
        accountObj.monthlyIncome = monthlyIncome;
        accountObj.monthlyExpense = monthlyExpense;
        
      } catch (error) {
        
        accountObj.monthlyIncome = 0;
        accountObj.monthlyExpense = 0;
      }
      
      return accountObj;
    })
  );

  res.status(200).json({
    success: true,
    data: accountsWithStats,
    count: accountsWithStats.length,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalAccounts: total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
});

// @desc    获取单个团队账户
// @route   GET /api/team-accounts/:id
// @access  Private
const getTeamAccount = asyncHandler(async (req, res) => {
  const user = req.user;
  
  const teamAccount = await TeamAccount.findById(req.params.id)
    .populate('departmentId', 'departmentName departmentCode departmentPath level')
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount');

  if (!teamAccount) {
    return res.status(404).json({
      success: false,
      message: '团队账户不存在'
    });
  }

  // 非管理员用户权限检查
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';
    const teamDepartmentPath = teamAccount.departmentId?.departmentPath || '';
    
    // 检查是否有权限查看此团队账户
    const hasPermission = !teamDepartmentPath || // 没有部门关联的账户
      teamDepartmentPath === userDepartmentPath || // 同一部门
      teamDepartmentPath.startsWith(userDepartmentPath + '->'); // 子部门
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '无权限查看此团队账户'
      });
    }
  }

  // 计算本月收支统计
  const accountObj = teamAccount.toObject();
  
  // 获取本月开始和结束时间
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  try {
    // 统计本月收支
    const monthlyStats = await AccountRecord.aggregate([
      {
        $match: {
          teamAccountId: teamAccount._id,
          status: 'completed',
          occurredAt: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // 初始化统计值
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    // 处理统计结果
    monthlyStats.forEach(stat => {
      if (stat._id === 'income' || stat._id === 'recharge') {
        monthlyIncome = precisionCalculate.add(monthlyIncome, Math.abs(stat.totalAmount));
      } else if (stat._id === 'expense') {
        monthlyExpense = precisionCalculate.add(monthlyExpense, Math.abs(stat.totalAmount));
      }
    });

    // 添加统计数据到账户对象
    accountObj.monthlyIncome = monthlyIncome;
    accountObj.monthlyExpense = monthlyExpense;
    
  } catch (error) {
    
    accountObj.monthlyIncome = 0;
    accountObj.monthlyExpense = 0;
  }

  res.status(200).json({
    success: true,
    data: accountObj
  });
});

// @desc    更新团队账户
// @route   PUT /api/team-accounts/:id
// @access  Private
const updateTeamAccount = asyncHandler(async (req, res) => {
  let teamAccount = await TeamAccount.findById(req.params.id);

  if (!teamAccount) {
    return res.status(404).json({
      success: false,
      message: '团队账户不存在'
    });
  }

  const { departmentId } = req.body;

  // 如果要更新部门关联，需要验证
  if (departmentId && departmentId !== teamAccount.departmentId.toString()) {
    // 验证新部门是否存在且启用
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: '指定的部门不存在'
      });
    }

    if (!department.isActive) {
      return res.status(400).json({
        success: false,
        message: '指定的部门已禁用，无法关联'
      });
    }

    // 检查新部门是否已有其他团队账户
    const existingAccount = await TeamAccount.findOne({ 
      departmentId,
      _id: { $ne: req.params.id } 
    });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: '该部门已存在其他团队账户，一个部门只能有一个团队账户'
      });
    }
  }

  const updateData = { ...req.body };
  updateData.updatedBy = req.user.id;
  updateData.updatedAt = Date.now();

  // 禁止直接修改账户余额，余额只能通过充值、财务记录审批等方式修改
  if (updateData.amount !== undefined) {
    delete updateData.amount
    // return res.status(400).json({
    //   success: false,
    //   message: '不能直接修改账户余额，请使用充值功能或财务记录审批来修改余额'
    // });
  }

  teamAccount = await TeamAccount.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate('departmentId', 'departmentName departmentCode departmentPath level')
   .populate('createdBy', 'username loginAccount')
   .populate('updatedBy', 'username loginAccount');

  res.status(200).json({
    success: true,
    message: '团队账户更新成功',
    data: teamAccount
  });
});

// @desc    删除团队账户
// @route   DELETE /api/team-accounts/:id
// @access  Private
const deleteTeamAccount = asyncHandler(async (req, res) => {
  const teamAccount = await TeamAccount.findById(req.params.id);

  if (!teamAccount) {
    return res.status(404).json({
      success: false,
      message: '团队账户不存在'
    });
  }

  try {
    // 1. 删除相关的账户记录
    const AccountRecord = require('../models/AccountRecord');
    await AccountRecord.deleteMany({ teamAccountId: req.params.id });

    // 2. 查找并删除相关的财务记录及其图片
    const Finance = require('../models/Finance');
    const relatedFinanceRecords = await Finance.find({ teamId: req.params.id });

    if (relatedFinanceRecords.length > 0) {
      const FileInfo = require('../models/FileInfo');
      const mongoose = require('mongoose');
      const { GridFSBucket } = require('mongodb');

      // 获取GridFS bucket
      const gfsBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });

      // 删除财务记录的图片文件
      for (const financeRecord of relatedFinanceRecords) {
        if (financeRecord.images && financeRecord.images.length > 0) {
          for (const imageId of financeRecord.images) {
            try {
              // 从FileInfo中获取文件信息
              const fileInfo = await FileInfo.findById(imageId);
              if (fileInfo && fileInfo.gridfsId) {
                // 从GridFS中删除文件
                await gfsBucket.delete(fileInfo.gridfsId);
              }
              // 删除FileInfo记录
              await FileInfo.findByIdAndDelete(imageId);
            } catch (fileError) {
              console.error(`删除团队账户相关财务记录图片文件失败 ${imageId}:`, fileError);
              // 继续删除其他文件，不中断整个删除过程
            }
          }
        }
      }

      // 删除财务记录
      await Finance.deleteMany({ teamId: req.params.id });
    }

    // 3. 删除团队账户
    await TeamAccount.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `团队账户及相关数据删除成功${relatedFinanceRecords.length > 0 ? `（包含 ${relatedFinanceRecords.length} 条财务记录）` : ''}`
    });
  } catch (error) {
    console.error('删除团队账户时发生错误:', error);
    res.status(500).json({
      success: false,
      message: '删除团队账户时发生错误'
    });
  }
});

// @desc    团队账户充值
// @route   POST /api/team-accounts/:id/recharge
// @access  Private
const rechargeTeamAccount = asyncHandler(async (req, res) => {
  const { amount, description, paymentMethod } = req.body;
  const user = req.user;

  // 验证充值金额
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: '请输入有效的充值金额'
    });
  }

  if (amount > 99999999) {
    return res.status(400).json({
      success: false,
      message: '单次充值金额不能超过99999999'
    });
  }

  // 查找团队账户
  const teamAccount = await TeamAccount.findById(req.params.id)
    .populate('departmentId', 'departmentName departmentCode departmentPath level');

  if (!teamAccount) {
    return res.status(404).json({
      success: false,
      message: '团队账户不存在'
    });
  }

  if (!teamAccount.isActive) {
    return res.status(400).json({
      success: false,
      message: '团队账户已被禁用，无法充值'
    });
  }

  // 非管理员用户权限检查
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';
    const teamDepartmentPath = teamAccount.departmentId?.departmentPath || '';
    
    // 检查是否有权限为此团队账户充值
    const hasPermission = !teamDepartmentPath || // 没有部门关联的账户
      teamDepartmentPath === userDepartmentPath || // 同一部门
      teamDepartmentPath.startsWith(userDepartmentPath + '->'); // 子部门
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '无权限为此团队账户充值'
      });
    }
  }

  // 更新账户余额
  const updatedAccount = await TeamAccount.findByIdAndUpdate(
    req.params.id,
    {
      $inc: { amount: Number(amount) },
      updatedBy: req.user.id,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('departmentId', 'departmentName departmentCode')
   .populate('updatedBy', 'username loginAccount');

  // 创建充值记录到财务记录中
  
  const chargeRecord = await Finance.create({
    teamId: teamAccount._id,
    name: `团队账户充值 - ${teamAccount.name}`,
    type: 'income',
    amount: Number(amount),
    occurredAt: new Date(),
    paymentMethod: paymentMethod || '充值',
    paymentName: '系统充值',
    description: description || `团队账户充值 ${amount} 元`,
    approvalStatus: 'approved', // 充值自动审批通过
    approvedBy: req.user.id,
    approvedAt: new Date(),
    createdBy: req.user.id
  });

  // 创建对应的账户记录
  await AccountRecord.create({
    teamAccountId: teamAccount._id,
    financeId: chargeRecord._id,
    type: 'recharge',
    amount: Number(amount),
    balanceBefore: teamAccount.amount,
    balanceAfter: updatedAccount.amount,
    description: `团队账户充值: ${description || '账户充值'}`,
    status: 'completed',
    occurredAt: new Date(),
    approvedAt: new Date(),
    approvedBy: req.user.id,
    createdBy: req.user.id,
    remarks: `充值金额: ${amount}，支付方式: ${paymentMethod || '充值'}`
  });

  res.status(200).json({
    success: true,
    message: `充值成功，账户余额已更新`,
    data: {
      teamAccount: updatedAccount,
      rechargeRecord: {
        id: chargeRecord._id,
        amount: chargeRecord.amount,
        description: chargeRecord.description,
        chargedAt: chargeRecord.createdAt
      },
      balanceChange: {
        previousBalance: teamAccount.amount,
        currentBalance: updatedAccount.amount,
        chargedAmount: amount
      }
    }
  });
});

// @desc    获取团队账户的交易记录
// @route   GET /api/team-accounts/:id/records
// @access  Private
const getTeamAccountRecords = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    startDate,
    endDate,
    keyword
  } = req.query;
  const user = req.user;
  const teamAccountId = req.params.id;

  // 验证团队账户是否存在
  const teamAccount = await TeamAccount.findById(teamAccountId)
    .populate('departmentId', 'departmentName departmentCode departmentPath level');

  if (!teamAccount) {
    return res.status(404).json({
      success: false,
      message: '团队账户不存在'
    });
  }

  // 非管理员用户权限检查
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';
    const teamDepartmentPath = teamAccount.departmentId?.departmentPath || '';
    
    // 检查是否有权限查看此团队账户的记录
    const hasPermission = !teamDepartmentPath || // 没有部门关联的账户
      teamDepartmentPath === userDepartmentPath || // 同一部门
      teamDepartmentPath.startsWith(userDepartmentPath + '->'); // 子部门
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '无权限查看此团队账户的交易记录'
      });
    }
  }

  // 构建查询条件
  let query = { teamAccountId, status: 'completed' };

  // 类型筛选
  if (type && ['income', 'expense', 'recharge'].includes(type)) {
    query.type = type;
  }

  // 日期筛选
  if (startDate || endDate) {
    query.occurredAt = {};
    if (startDate) query.occurredAt.$gte = new Date(startDate);
    if (endDate) query.occurredAt.$lte = new Date(endDate);
  }

  // 关键词搜索
  if (keyword) {
    query.$or = [
      { description: { $regex: keyword, $options: 'i' } },
      { remarks: { $regex: keyword, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;

  try {
    const records = await AccountRecord.find(query)
      .populate('createdBy', 'username loginAccount')
      .populate('approvedBy', 'username loginAccount')
      .populate('financeId', 'name paymentMethod paymentName')
      .sort({ occurredAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AccountRecord.countDocuments(query);

    // 格式化记录数据
    const formattedRecords = records.map(record => ({
      _id: record._id,
      type: record.type,
      amount: record.amount,
      balanceBefore: record.balanceBefore,
      balanceAfter: record.balanceAfter,
      description: record.description,
      status: record.status,
      occurredAt: record.occurredAt,
      approvedAt: record.approvedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      remarks: record.remarks,
      isReversed: record.isReversed,
      createdBy: record.createdBy,
      approvedBy: record.approvedBy,
      financeInfo: record.financeId // 关联的财务记录信息
    }));

    res.status(200).json({
      success: true,
      data: {
        records: formattedRecords,
        teamAccount: {
          _id: teamAccount._id,
          name: teamAccount.name,
          amount: teamAccount.amount,
          departmentName: teamAccount.departmentId?.departmentName
        },
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: '获取交易记录失败'
    });
  }
});

module.exports = {
  createTeamAccount,
  getTeamAccounts,
  getTeamAccount,
  updateTeamAccount,
  deleteTeamAccount,
  rechargeTeamAccount,
  getTeamAccountRecords
};