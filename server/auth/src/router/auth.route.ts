import express from 'express';
import { 
  addUserRole, loginUser, profile, 
  applyReferralCode, getReferralInfo, 
  getInternalUser, getInternalUserByCode 
} from "./../controller/auth.controller.js";
import { IsAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route('/login').post(loginUser);
router.route('/add-role').put(IsAuth, addUserRole);
router.route('/me').get(IsAuth, profile);

router.route('/apply-referral').put(IsAuth, applyReferralCode);
router.route('/referral-info').get(IsAuth, getReferralInfo);

// Internal routes (for Wallet service to fetch referral maps)
router.route('/internal/user/:id').get(getInternalUser);
router.route('/internal/user-by-code/:code').get(getInternalUserByCode);

export default router;