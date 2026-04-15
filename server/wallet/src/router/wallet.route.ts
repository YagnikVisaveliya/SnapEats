import { Router } from "express";
import {
	getBalance,
	getTransactions,
	internalRefund,
	internalLoyaltyBonus,
	internalTransactions,
	internalLoyaltySummary,
} from "../controller/wallet.controller.js";
import { isAuth } from "../middleware/isAuth.middleware.js";

const router = Router();

// Public/User Routes
router.get("/balance", isAuth, getBalance);
router.get("/transactions", isAuth, getTransactions);

// Internal Routes (Protected by internal key)
router.post("/internal/refund", internalRefund);
router.post("/internal/loyalty-bonus", internalLoyaltyBonus);
router.get("/internal/transactions", internalTransactions);
router.get("/internal/loyalty-summary", internalLoyaltySummary);

export default router;
