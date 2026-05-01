import { Router } from "express";
import { assignRiderToOrder, createOrder, fetchOrderForPayment, fetchRestaurantOrders, getCurrentOrdersForRider, getDeliveredOrdersForRider, getMyOrders, getOrderPreviewForRider, getSingleOrder, updateOrderStatus, updateOrderStatusByRider, getRestaurantSalesAnalytics, cancelOrder, allOrders, internalUserOrderCount } from "../controller/order.controller.js";
import { isAuth, isSeller } from "../middleware/isAuth.middleware.js";
import { updateStatusRestaurant } from "../controller/restaurant.controller.js";


const router = Router();

router.route('/new').post(isAuth,createOrder);
router.route('/payment/:id').get(fetchOrderForPayment)
router.route('/my').get(isAuth,getMyOrders)
router.route('/restaurant/:restaurantId').get(isAuth,isSeller,fetchRestaurantOrders)
router.route('/restaurant/:restaurantId/sales').get(isAuth,isSeller,getRestaurantSalesAnalytics)
router.route('/assign/rider').put(assignRiderToOrder);
router.route('/current/rider').get(getCurrentOrdersForRider);
router.route('/rider/request/:orderId').get(getOrderPreviewForRider);
router.route('/rider/delivered').get(getDeliveredOrdersForRider);
router.route('/update-status/rider').put(updateOrderStatusByRider);

router.route('/all').get(allOrders);
router.route('/internal/user-order-count/:userId').get(internalUserOrderCount);
// Specific routes before generic :orderId routes
router.route('/:orderId/cancel').put(isAuth, cancelOrder);
router.route('/:orderId').put(isAuth,isSeller,updateOrderStatus)
router.route('/:id').get(isAuth,getSingleOrder)




export default router   