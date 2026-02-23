import { Router } from "express";
import { isAuth, isSeller } from "../middleware/isAuth.middleware.js";
import { addRestaurant, getMyRestaurant, getnearbyRestaurants, getSingleRestaurant, updateRestaurant, updateStatusRestaurant } from "../controller/restaurant.controller.js";
import uploadFile from "../middleware/multer.js";

const router = Router();

router.route('/new').post(isAuth, isSeller, uploadFile, addRestaurant);
router.route('/my').get(isAuth,isSeller, getMyRestaurant);
router.route('/status').put(isAuth, isSeller, updateStatusRestaurant);
router.route('/edit').put(isAuth, isSeller, updateRestaurant);

router.route('/all').get(isAuth,getnearbyRestaurants);
// router.route('/reverse-geocode').get(reverseGeocode);
router.route('/:id').get(isAuth,getSingleRestaurant);

export default router;