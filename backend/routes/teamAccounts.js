const express = require('express');
const router = express.Router();
const {
  createTeamAccount,
  getTeamAccounts,
  getTeamAccount,
  updateTeamAccount,
  deleteTeamAccount,
  rechargeTeamAccount,
  getTeamAccountRecords,
  getAvailableDepartments
} = require('../controllers/teamAccountController');

const { protect, authorize } = require('../middleware/auth');
const { logOperation, saveOriginalData } = require('../middleware/operationLog');
const TeamAccount = require('../models/TeamAccount');

router.use(protect);

// 获取可用部门列表（需要放在 /:id 路由之前）
router.get('/available-departments', getAvailableDepartments);

router.route('/')
  .get(getTeamAccounts)  // 查看团队账户列表不需要特殊权限
  .post(
    authorize('finance:team_create'),
    logOperation({
      operationType: 'CREATE',
      module: 'TEAM_ACCOUNT',
      getResourceName: (req, res) => res.data?.name || req.body.name,
      getDescription: (req, res) => `创建团队账户: ${res.data?.name || req.body.name}`
    }),
    createTeamAccount
  );

// 充值路由（需要放在 /:id 路由之前）
router.post('/:id/recharge',
  authorize('finance:team_update'),
  saveOriginalData(TeamAccount),
  logOperation({
    operationType: 'UPDATE',
    module: 'TEAM_ACCOUNT',
    getResourceName: (req, res) => req.originalData?.name,
    getDescription: (req, res) => `团队账户充值: ${req.originalData?.name} - 金额: ${req.body.amount}`
  }),
  rechargeTeamAccount
);

// 获取账户记录路由（需要放在 /:id 路由之前）- 不需要特殊权限
router.get('/:id/records', getTeamAccountRecords);

router.route('/:id')
  .get(getTeamAccount)  // 查看单个团队账户不需要特殊权限
  .put(
    authorize('finance:team_update'),
    saveOriginalData(TeamAccount),
    logOperation({
      operationType: 'UPDATE',
      module: 'TEAM_ACCOUNT',
      getResourceName: (req, res) => res.data?.name || req.originalData?.name,
      getDescription: (req, res) => `更新团队账户: ${res.data?.name || req.originalData?.name}`
    }),
    updateTeamAccount
  )
  .delete(
    authorize('finance:team_delete'),
    saveOriginalData(TeamAccount),
    logOperation({
      operationType: 'DELETE',
      module: 'TEAM_ACCOUNT',
      getResourceName: (req, res) => req.originalData?.name,
      getDescription: (req, res) => `删除团队账户: ${req.originalData?.name}`
    }),
    deleteTeamAccount
  );

module.exports = router;