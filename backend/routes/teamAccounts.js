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

router.use(protect);

// 获取可用部门列表（需要放在 /:id 路由之前）
router.get('/available-departments', getAvailableDepartments);

router.route('/')
  .get(getTeamAccounts)  // 查看团队账户列表不需要特殊权限
  .post(authorize('finance:team_create'), createTeamAccount);  // 创建团队账户需要权限

// 充值路由（需要放在 /:id 路由之前）
router.post('/:id/recharge', authorize('finance:team_update'), rechargeTeamAccount);  // 充值需要权限

// 获取账户记录路由（需要放在 /:id 路由之前）- 不需要特殊权限
router.get('/:id/records', getTeamAccountRecords);

router.route('/:id')
  .get(getTeamAccount)  // 查看单个团队账户不需要特殊权限
  .put(authorize('finance:team_update'), updateTeamAccount)  // 更新团队账户需要权限
  .delete(authorize('finance:team_delete'), deleteTeamAccount);  // 删除团队账户需要权限

module.exports = router;