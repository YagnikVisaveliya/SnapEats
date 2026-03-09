import Router from "express";
import { acceptOrder, addRiderProfile, fetchMyCurrentOrders, getMyProfile, updateAvailability, updateOrderStatus} from "../controller/rider.js";
import { isAuth } from "../middleware/isAuth.middleware.js";
import uploadFile from "../middleware/multer.js";

const router = Router();

router.route('/add').post(isAuth, uploadFile, addRiderProfile);
router.route('/me').get(isAuth,getMyProfile);
router.route('/update-availability').patch(isAuth, updateAvailability)

router.route('/accept/:orderId').post(isAuth,acceptOrder);
router.route('/order/current').get(isAuth, fetchMyCurrentOrders);
router.route('/order/update/:orderId').put(isAuth, updateOrderStatus);

export default router;