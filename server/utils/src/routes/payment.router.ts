import { Router } from "express";
import { createRazorPayOrder, payWithStripe, verifyPayment, verifyStripePayment } from "../controller/payment.js";

const router = Router();

router.route('/create').post(createRazorPayOrder)
router.route('/verify').post(verifyPayment)

router.route('/stripe/create').post(payWithStripe)
router.route('/stripe/verify').post(verifyStripePayment)


export default router