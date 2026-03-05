import { Router } from "express";
import { createOrder, fetchOrderForPayment, fetchRestaurantOrders, getMyOrders, getSingleOrder, updateOrderStatus } from "../controller/order.controller.js";
import { isAuth, isSeller } from "../middleware/isAuth.middleware.js";


const router = Router();

router.route('/new').post(isAuth,createOrder);
router.route('/payment/:id').get(fetchOrderForPayment)
router.route('/my').get(isAuth,getMyOrders)
router.route('/:restaurantId').get(isAuth,isSeller,fetchRestaurantOrders)
router.route('/:orderId').put(isAuth,isSeller,updateOrderStatus)
router.route('/:id').get(isAuth,getSingleOrder)


export default router   