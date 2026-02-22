import { Router } from "express";
import { isAuth, isSeller } from "../middleware/isAuth.middleware.js";
import { addRestaurant, getMyRestaurant, updateRestaurant, updateStatusRestaurant } from "../controller/restaurant.controller.js";
import uploadFile from "../middleware/multer.js";

const router = Router();

router.route('/new').post(isAuth, isSeller, uploadFile, addRestaurant);
router.route('/my').get(isAuth,isSeller, getMyRestaurant);
router.route('/status').put(isAuth, isSeller, updateStatusRestaurant);
router.route('/edit').put(isAuth, isSeller, updateRestaurant);

export default router;