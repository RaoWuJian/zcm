const Finance = require('../models/Finance');
const TeamAccount = require('../models/TeamAccount');
const User = require('../models/User');
const AccountRecord = require('../models/AccountRecord');
const { asyncHandler } = require('../middleware/error');

// @desc    创建财务记录
// @route   POST /api/finance
// @access  Private
const createFinance = asyncHandler(async (req, res) => {
  const {
    teamId,
    name,
    type,
    amount,
    occurredAt,
    paymentMethod,
    paymentName,
    account,
    description
  } = req.body;

  // 验证团队账户是否存在且激活
  const teamAccount = await TeamAccount.findById(teamId);
  if (!teamAccount) {
    return res.status(404).json({
      success: false,
      message: '团队账户不存在'
    });
  }

  if (!teamAccount.isActive) {
    return res.status(400).json({
      success: false,
      message: '团队账户已被禁用'
    });
  }

  // 支出时检查余额是否足够
  if (type === 'expense' && teamAccount.amount < amount) {
    return res.status(400).json({
      success: false,
      message: `余额不足，当前余额：${teamAccount.amount}，需要支出：${amount}`
    });
  }

  try {
    // 创建财务记录
    const finance = await Finance.create({
      teamId,
      name,
      type,
      amount,
      occurredAt,
      paymentMethod,
      paymentName,
      account,
      description,
      createdBy: req.user.id
    });

    // 返回创建的财务记录
    const populatedFinance = await Finance.findById(finance._id)
      .populate('teamId', 'name amount')
      .populate('createdBy', 'username loginAccount')
      .populate('updatedBy', 'username loginAccount')
      .populate('approvedBy', 'username loginAccount');

    res.status(201).json({
      success: true,
      data: populatedFinance,
      message: '财务记录创建成功，等待审批后生效'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建财务记录失败: ' + error.message
    });
  }
});

// @desc    获取所有财务记录
// @route   GET /api/finance
// @access  Private
const getFinances = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    teamId,
    type,
    approvalStatus,
    startDate,
    endDate,
    paymentMethod,
    search,
    name
  } = req.query;
  const user = req.user;

  // 构建查询条件
  const query = {};

  if (type) query.type = type;
  if (approvalStatus) query.approvalStatus = approvalStatus;
  if (paymentMethod) query.paymentMethod = paymentMethod;

  // 获取用户有权限查看的财务记录（基于创建者权限）
  if (!user.isAdmin) {
    const userDepartmentPath = user.departmentPath || '';

    if (userDepartmentPath) {
      // 转义正则表达式特殊字符
      const escapedPath = userDepartmentPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // 查找下属子部门用户
      const allowedUsers = await User.find({
        $or: [
          { _id: user.id }, // 用户自己
          { departmentPath: { $regex: `^${escapedPath}->` } } // 下属子部门用户
        ]
      }).select('_id');

      const allowedUserIds = allowedUsers.map(u => u._id);

      // 限制只查看这些用户创建的财务记录
      query.createdBy = { $in: allowedUserIds };
    } else {
      // 如果用户没有部门信息，只能查看自己创建的记录
      query.createdBy = user.id;
    }

    // 如果用户指定了特定的teamId，保持这个过滤条件
    if (teamId) {
      query.teamId = teamId;
    }
  } else {
    // 管理员用户，如果指定了teamId则使用
    if (teamId) query.teamId = teamId;
  }

  // 日期范围查询
  if (startDate || endDate) {
    query.occurredAt = {};
    if (startDate) query.occurredAt.$gte = new Date(startDate);
    if (endDate) query.occurredAt.$lte = new Date(endDate);
  }
  // 添加名称模糊查询
  if (name) {
    query.name = { $regex: name, $options: 'i' };
  }

  // 搜索功能（按名称、描述、收款/付款名搜索）
  if (search) {
    query.$or = [
      // { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      // { paymentName: { $regex: search, $options: 'i' } }
    ];
  }


  const skip = (page - 1) * limit;

  const finances = await Finance.find(query)
    .populate('teamId', 'name')
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('approvedBy', 'username loginAccount')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  const total = await Finance.countDocuments(query);

  res.status(200).json({
    success: true,
    data: finances,
    pagination: {
      current: Number(page),
      total: Math.ceil(total / limit),
      count: finances.length,
      totalRecords: total
    }
  });
});

// @desc    获取单个财务记录
// @route   GET /api/finance/:id
// @access  Private
const getFinance = asyncHandler(async (req, res) => {
  const finance = await Finance.findById(req.params.id)
    .populate('teamId', 'name')
    .populate('createdBy', 'username loginAccount')
    .populate('updatedBy', 'username loginAccount')
    .populate('approvedBy', 'username loginAccount');

  if (!finance) {
    return res.status(404).json({
      success: false,
      message: '财务记录不存在'
    });
  }

  res.status(200).json({
    success: true,
    data: finance
  });
});

// @desc    更新财务记录
// @route   PUT /api/finance/:id
// @access  Private
const updateFinance = asyncHandler(async (req, res) => {
  let finance = await Finance.findById(req.params.id).populate('teamId');

  if (!finance) {
    return res.status(404).json({
      success: false,
      message: '财务记录不存在'
    });
  }

  // 如果已审批，则不允许修改
  if (finance.approvalStatus === 'approved') {
    return res.status(400).json({
      success: false,
      message: '已审批的记录不允许修改'
    });
  }

  const { type: newType, amount: newAmount } = req.body;
  const oldType = finance.type;
  const oldAmount = finance.amount;

  try {
    // 更新财务记录
    const updateData = { ...req.body };
    updateData.updatedBy = req.user.id;
    updateData.updatedAt = Date.now();

    // 如果修改了团队账户，需要验证余额
    if (req.body.teamId && req.body.teamId !== finance.teamId._id.toString()) {
      const newTeamAccount = await TeamAccount.findById(req.body.teamId);
      if (!newTeamAccount) {
        throw new Error('新的团队账户不存在');
      }
      if (!newTeamAccount.isActive) {
        throw new Error('新的团队账户已被禁用');
      }
      // 如果是支出且新账户余额不足
      if ((newType || oldType) === 'expense' && newTeamAccount.amount < (newAmount || oldAmount)) {
        throw new Error(`新团队账户余额不足，当前余额：${newTeamAccount.amount}，需要支出：${newAmount || oldAmount}`);
      }
    }

    finance = await Finance.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('teamId', 'name amount')
     .populate('createdBy', 'username loginAccount')
     .populate('updatedBy', 'username loginAccount')
     .populate('approvedBy', 'username loginAccount');

    // 更新对应的账户记录
    const accountRecord = await AccountRecord.findOne({ 
      financeId: req.params.id 
    });

    if (accountRecord) {
      // 如果类型或金额发生变化，更新账户记录
      if (newType && newType !== oldType) {
        accountRecord.type = newType;
        accountRecord.amount = newType === 'income' ? (newAmount || oldAmount) : -(newAmount || oldAmount);
      } else if (newAmount && newAmount !== oldAmount) {
        accountRecord.amount = oldType === 'income' ? newAmount : -newAmount;
      }

      // 更新描述和团队账户关联
      if (req.body.name || req.body.description) {
        accountRecord.description = `${req.body.name || finance.name} - ${req.body.description || finance.description || ''}`;
      }
      
      if (req.body.teamId) {
        accountRecord.teamAccountId = req.body.teamId;
      }

      accountRecord.updatedBy = req.user.id;
      await accountRecord.save();
    }

    res.status(200).json({
      success: true,
      data: finance,
      message: '财务记录更新成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    删除财务记录
// @route   DELETE /api/finance/:id
// @access  Private
const deleteFinance = asyncHandler(async (req, res) => {
  const finance = await Finance.findById(req.params.id).populate('teamId');

  if (!finance) {
    return res.status(404).json({
      success: false,
      message: '财务记录不存在'
    });
  }

  try {
    // 如果已审批，需要恢复团队账户余额
    if (finance.approvalStatus === 'approved') {
      const teamAccount = finance.teamId;
      
      if (teamAccount && teamAccount.isActive) {
        // 恢复余额：收入记录删除时减少余额，支出记录删除时增加余额
        const balanceChange = finance.type === 'income' ? -finance.amount : finance.amount;
        const updatedAccount = await TeamAccount.findByIdAndUpdate(
          teamAccount._id,
          { 
            $inc: { amount: balanceChange },
            updatedBy: req.user.id,
            updatedAt: Date.now()
          },
          { new: true }
        );

        // 创建反向账户记录来记录删除操作
        const originalRecord = await AccountRecord.findOne({ 
          financeId: req.params.id 
        });

        if (originalRecord) {
          await AccountRecord.create({
            teamAccountId: teamAccount._id,
            financeId: req.params.id,
            type: finance.type,
            amount: -originalRecord.amount, // 反向金额
            balanceBefore: originalRecord.balanceAfter,
            balanceAfter: updatedAccount.amount,
            description: `删除财务记录: ${finance.name}`,
            status: 'completed',
            occurredAt: new Date(),
            approvedAt: new Date(),
            approvedBy: req.user.id,
            createdBy: req.user.id,
            isReversed: true,
            originalRecordId: originalRecord._id,
            remarks: '删除已审批的财务记录，恢复账户余额'
          });

          // 将原记录标记为已反转
          await AccountRecord.findByIdAndUpdate(
            originalRecord._id,
            { 
              status: 'reversed',
              updatedBy: req.user.id,
              remarks: '财务记录已删除，此记录已反转'
            }
          );
        }
      }
    }
    // 如果未审批，不需要处理账户记录（因为未审批的记录没有创建账户记录）

    // 删除财务记录
    await Finance.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: '财务记录删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除过程中发生错误: ' + error.message
    });
  }
});

// @desc    审批财务记录
// @route   PUT /api/finance/:id/approve
// @access  Private (需要审批权限)
const approveFinance = asyncHandler(async (req, res) => {
  const { approvalStatus, approvalComment } = req.body;

  if (!['approved', 'rejected'].includes(approvalStatus)) {
    return res.status(400).json({
      success: false,
      message: '审批状态只能是approved或rejected'
    });
  }

  let finance = await Finance.findById(req.params.id).populate('teamId');

  if (!finance) {
    return res.status(404).json({
      success: false,
      message: '财务记录不存在'
    });
  }

  if (finance.approvalStatus !== 'pending') {
    return res.status(400).json({
      success: false,
      message: '该记录已经处理过审批'
    });
  }

  try {
    // 如果是审批通过，需要更新团队账户余额并创建账户记录
    if (approvalStatus === 'approved') {
      const teamAccount = finance.teamId;

      if (!teamAccount) {
        return res.status(404).json({
          success: false,
          message: '关联的团队账户不存在'
        });
      }

      if (!teamAccount.isActive) {
        return res.status(400).json({
          success: false,
          message: '团队账户已被禁用，无法审批'
        });
      }

      // 支出时再次检查余额是否足够
      if (finance.type === 'expense' && teamAccount.amount < finance.amount) {
        return res.status(400).json({
          success: false,
          message: `余额不足，无法审批。当前余额：${teamAccount.amount}，需要支出：${finance.amount}`
        });
      }

      // 更新团队账户余额
      const balanceChange = finance.type === 'income' ? finance.amount : -finance.amount;
      const balanceBefore = teamAccount.amount;
      const updatedAccount = await TeamAccount.findByIdAndUpdate(
        teamAccount._id,
        {
          $inc: { amount: balanceChange },
          updatedBy: req.user.id,
          updatedAt: Date.now()
        },
        { new: true }
      );

      // 创建账户记录（只有审批通过时才创建）
      const recordAmount = finance.type === 'income' ? finance.amount : -finance.amount;
      await AccountRecord.create({
        teamAccountId: teamAccount._id,
        financeId: finance._id,
        type: finance.type,
        amount: recordAmount,
        balanceBefore: balanceBefore,
        balanceAfter: updatedAccount.amount,
        description: `${finance.name} - ${finance.description || ''}`,
        status: 'completed',
        occurredAt: finance.occurredAt,
        approvedAt: Date.now(),
        approvedBy: req.user.id,
        createdBy: req.user.id,
        remarks: `财务记录审批通过，记录ID: ${finance._id}`
      });
    }
    // 如果是拒绝，不需要创建任何账户记录
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: '审批过程中发生错误: ' + error.message
    });
  }

  finance = await Finance.findByIdAndUpdate(
    req.params.id,
    {
      approvalStatus,
      approvalComment,
      approvedBy: req.user.id,
      approvedAt: Date.now(),
      updatedBy: req.user.id,
      updatedAt: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('teamId', 'name amount')
   .populate('createdBy', 'username loginAccount')
   .populate('updatedBy', 'username loginAccount')
   .populate('approvedBy', 'username loginAccount');

  res.status(200).json({
    success: true,
    data: finance
  });
});

// @desc    获取财务统计数据
// @route   GET /api/finance/stats
// @access  Private
const getFinanceStats = asyncHandler(async (req, res) => {
  const { teamId, startDate, endDate } = req.query;

  // 构建查询条件
  const query = { approvalStatus: 'approved' };
  if (teamId) query.teamId = teamId;

  // 日期范围查询
  if (startDate || endDate) {
    query.occurredAt = {};
    if (startDate) query.occurredAt.$gte = new Date(startDate);
    if (endDate) query.occurredAt.$lte = new Date(endDate);
  }

  const stats = await Finance.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // 计算总收入、总支出和净利润
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  stats.forEach(stat => {
    if (stat._id === 'income') {
      totalIncome = stat.total;
      incomeCount = stat.count;
    } else if (stat._id === 'expense') {
      totalExpense = stat.total;
      expenseCount = stat.count;
    }
  });

  const netProfit = totalIncome - totalExpense;

  // 获取待审批记录数量
  const pendingQuery = { ...query, approvalStatus: 'pending' };
  const pendingCount = await Finance.countDocuments(pendingQuery);

  res.status(200).json({
    success: true,
    data: {
      totalIncome,
      totalExpense,
      netProfit,
      incomeCount,
      expenseCount,
      totalCount: incomeCount + expenseCount,
      pendingCount
    }
  });
});

// @desc    批量删除财务记录
// @route   DELETE /api/finance/batch
// @access  Private
const batchDeleteFinance = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供要删除的记录ID数组'
    });
  }

  // 获取所有要删除的记录，包含团队账户信息
  const recordsToDelete = await Finance.find({
    _id: { $in: ids }
  }).populate('teamId');

  // 处理已审批记录的余额恢复
  const approvedRecords = recordsToDelete.filter(record => record.approvalStatus === 'approved');

  for (const record of approvedRecords) {
    const teamAccount = record.teamId;

    if (teamAccount && teamAccount.isActive) {
      // 恢复余额：收入记录删除时减少余额，支出记录删除时增加余额
      const balanceChange = record.type === 'income' ? -record.amount : record.amount;
      const updatedAccount = await TeamAccount.findByIdAndUpdate(
        teamAccount._id,
        {
          $inc: { amount: balanceChange },
          updatedBy: req.user.id,
          updatedAt: Date.now()
        },
        { new: true }
      );

      // 查找原始账户记录
      const originalRecord = await AccountRecord.findOne({
        financeId: record._id
      });

      if (originalRecord) {
        // 创建反向账户记录来记录批量删除操作
        await AccountRecord.create({
          teamAccountId: teamAccount._id,
          financeId: record._id,
          type: record.type,
          amount: -originalRecord.amount, // 反向金额
          balanceBefore: originalRecord.balanceAfter,
          balanceAfter: updatedAccount.amount,
          description: `批量删除财务记录: ${record.name}`,
          status: 'completed',
          occurredAt: new Date(),
          approvedAt: new Date(),
          approvedBy: req.user.id,
          createdBy: req.user.id,
          isReversed: true,
          originalRecordId: originalRecord._id,
          remarks: '批量删除已审批的财务记录，恢复账户余额'
        });

        // 将原记录标记为已反转
        await AccountRecord.findByIdAndUpdate(
          originalRecord._id,
          {
            status: 'reversed',
            updatedBy: req.user.id,
            remarks: '财务记录已被批量删除，此记录已反转'
          }
        );
      }
    }
  }

  const result = await Finance.deleteMany({
    _id: { $in: ids }
  });

  res.status(200).json({
    success: true,
    message: `成功删除 ${result.deletedCount} 条记录${approvedRecords.length > 0 ? `，其中 ${approvedRecords.length} 条已审批记录已恢复账户余额` : ''}`
  });
});

module.exports = {
  createFinance,
  getFinances,
  getFinance,
  updateFinance,
  deleteFinance,
  approveFinance,
  getFinanceStats,
  batchDeleteFinance
};