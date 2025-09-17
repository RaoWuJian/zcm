const express = require('express');
const router = express.Router();
const {
  createTeamAccount,
  getTeamAccounts,
  getTeamAccount,
  updateTeamAccount,
  deleteTeamAccount,
  rechargeTeamAccount,
  getTeamAccountRecords
} = require('../controllers/teamAccountController');

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getTeamAccounts)
  .post(createTeamAccount);

// 充值路由（需要放在 /:id 路由之前）
router.post('/:id/recharge', rechargeTeamAccount);

// 获取账户记录路由（需要放在 /:id 路由之前）
router.get('/:id/records', getTeamAccountRecords);

router.route('/:id')
  .get(getTeamAccount)
  .put(updateTeamAccount)
  .delete(deleteTeamAccount);

module.exports = router;