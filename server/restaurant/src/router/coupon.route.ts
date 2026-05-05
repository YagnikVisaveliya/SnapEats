import { Router } from "express";
import { applyCoupon, getAvailableCoupons, adminCreateCoupon, adminGetCoupons, adminUpdateCoupon } from "../controller/coupon.controller.js";
import { isAuth } from "../middleware/isAuth.middleware.js";

const router = Router();

router.post("/apply", isAuth, applyCoupon);
router.get("/available", isAuth, getAvailableCoupons);

// Admin / Internal Endpoints
router.post("/internal/create", adminCreateCoupon);
router.get("/internal/all", adminGetCoupons);
router.put("/internal/:id", adminUpdateCoupon);

export default router;
