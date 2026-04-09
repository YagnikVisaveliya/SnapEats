import express from "express";

const router = express.Router();
import { getPendingRestaurants, getPendingRiders, verifyRestaurant, verifyRider } from "../controller/admin.js";
import { isAdmin, IsAuth } from "../middleware/auth.middleware.js";

router.route('/restaurant/pending').get(IsAuth, isAdmin, getPendingRestaurants);
router.route('/rider/pending').get(IsAuth, isAdmin, getPendingRiders);
router.route('/restaurant/:id/verify').post(IsAuth, isAdmin, verifyRestaurant);
router.route('/rider/:id/verify').post(IsAuth, isAdmin, verifyRider);

export default router;

