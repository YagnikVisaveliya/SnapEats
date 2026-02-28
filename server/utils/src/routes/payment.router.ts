import { Router } from "express";
import { createRazorPayOrder, verifyPayment } from "../controller/payment.js";

const router = Router();

router.route('/create').post(createRazorPayOrder)
router.route('/verify').post(verifyPayment)

export default router