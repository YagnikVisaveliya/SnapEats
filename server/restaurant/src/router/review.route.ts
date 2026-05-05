import { Router } from "express";
import { isAuth } from "../middleware/isAuth.middleware.js";
import { addReview, getRestaurantReviews } from "../controller/review.controller.js";

const router = Router();

router.route('/:restaurantId').post(isAuth, addReview);
router.route('/:restaurantId').get(isAuth, getRestaurantReviews);

export default router;
