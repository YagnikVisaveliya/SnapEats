import { Router } from "express";
import { createOrder, fetchOrderForPayment } from "../controller/order.controller.js";
import { isAuth } from "../middleware/isAuth.middleware.js";


const router = Router();

router.route('/new').post(isAuth,createOrder);
router.route('/payment/:id').get(fetchOrderForPayment)


export default router   