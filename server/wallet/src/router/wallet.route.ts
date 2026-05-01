import { Router } from "express";
import {
	getBalance,
	getTransactions,
	internalDebit,
	internalRefund,
	internalLoyaltyBonus,
	internalFirstOrderCashback,
	internalTransactions,
	internalLoyaltySummary,
	internalReferralReward,
	internalReferralSummary,
	internalReferralPayoutSummary,
} from "../controller/wallet.controller.js";
import { isAuth } from "../middleware/isAuth.middleware.js";

const router = Router();

// Public/User Routes
router.get("/balance", isAuth, getBalance);
router.get("/transactions", isAuth, getTransactions);

// Internal Routes (Protected by internal key)
router.post("/internal/refund", internalRefund);
router.post("/internal/debit", internalDebit);
router.post("/internal/loyalty-bonus", internalLoyaltyBonus);
router.post("/internal/first-order-cashback", internalFirstOrderCashback);
router.post("/internal/referral-reward", internalReferralReward);
router.get("/internal/transactions", internalTransactions);
router.get("/internal/loyalty-summary", internalLoyaltySummary);
router.get("/internal/referral-summary", internalReferralSummary);
router.get("/internal/referral-payout-summary", internalReferralPayoutSummary);

export default router;
