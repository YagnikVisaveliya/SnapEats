import { Router } from "express";
import { getallOrders, getAllRestaurants, getAllriders, getTopRestaurants, getTotalRevenue, getunverifiedRestaurants, getunverifiedRiders, verifyRestaurant, verifyRider } from "../controller/admin.js";
import { isAdmin, IsAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.route('/restaurants').get(IsAuth,isAdmin,getAllRestaurants);
router.route('/restaurants/unverified').get(IsAuth,isAdmin,getunverifiedRestaurants);
router.route('/restaurant/:id/verify').put(IsAuth,isAdmin,verifyRestaurant);

router.route('/riders').get(IsAuth,isAdmin,getAllriders);
router.route('/riders/unverified').get(IsAuth,isAdmin,getunverifiedRiders);
router.route('/rider/:id/verify').post(IsAuth,isAdmin,verifyRider);

router.route('/all-orders').get(IsAuth,isAdmin,getallOrders);
router.route('/revenue').get(IsAuth,isAdmin,getTotalRevenue);
router.route('/top-restaurants').get(IsAuth,isAdmin,getTopRestaurants);


export default router;