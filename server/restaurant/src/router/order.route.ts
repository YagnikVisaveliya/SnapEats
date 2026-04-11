import { Router } from "express";
import { assignRiderToOrder, createOrder, fetchOrderForPayment, fetchRestaurantOrders, getCurrentOrdersForRider, getDeliveredOrdersForRider, getMyOrders, getOrderPreviewForRider, getSingleOrder, updateOrderStatus, updateOrderStatusByRider } from "../controller/order.controller.js";
import { isAuth, isSeller } from "../middleware/isAuth.middleware.js";
import { updateStatusRestaurant } from "../controller/restaurant.controller.js";


const router = Router();

router.route('/new').post(isAuth,createOrder);
router.route('/payment/:id').get(fetchOrderForPayment)
router.route('/my').get(isAuth,getMyOrders)
router.route('/restaurant/:restaurantId').get(isAuth,isSeller,fetchRestaurantOrders)
router.route('/:orderId').put(isAuth,isSeller,updateOrderStatus)
router.route('/:id').get(isAuth,getSingleOrder)

router.route('/assign/rider').put(assignRiderToOrder);
router.route('/current/rider').get(getCurrentOrdersForRider);
router.route('/rider/request/:orderId').get(getOrderPreviewForRider);
router.route('/rider/delivered').get(getDeliveredOrdersForRider);
router.route('/update-status/rider').put(updateOrderStatusByRider);




export default router   