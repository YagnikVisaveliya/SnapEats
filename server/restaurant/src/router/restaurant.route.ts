import { Router } from "express";
import { isAuth, isSeller } from "../middleware/isAuth.middleware.js";
import { addRestaurant, allRestaurants, getMyRestaurant, getnearbyRestaurants, getSingleRestaurant, getUnverifiedRestaurants, updateRestaurant, updateStatusRestaurant, verifyRestaurant } from "../controller/restaurant.controller.js";
import uploadFile from "../middleware/multer.js";

const router = Router();

router.route('/new').post(isAuth, isSeller, uploadFile, addRestaurant);
router.route('/my').get(isAuth,isSeller, getMyRestaurant);
router.route('/status').put(isAuth, isSeller, updateStatusRestaurant);
router.route('/edit').put(isAuth, isSeller, updateRestaurant);

router.route('/all').get(isAuth,getnearbyRestaurants);
// router.route('/reverse-geocode').get(reverseGeocode);
router.route('/all-restaurants').get(isAuth, allRestaurants);
router.route('/unverified').get(isAuth, getUnverifiedRestaurants);
router.route('/verify').put(isAuth, verifyRestaurant);
router.route('/:id').get(isAuth,getSingleRestaurant);

export default router;