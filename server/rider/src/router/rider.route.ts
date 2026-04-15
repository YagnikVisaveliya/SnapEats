import Router from "express";
import { acceptOrder, addRiderProfile, allriders, fetchMyCurrentOrders, getDeliveredOrdersAnalytics, getIncomingOrderPreview, getMyProfile, unverifiedriders, updateAvailability, updateOrderStatus, verifyRider} from "../controller/rider.js";
import { isAuth } from "../middleware/isAuth.middleware.js";
import uploadFile from "../middleware/multer.js";

const router = Router();

router.route('/add').post(isAuth, uploadFile, addRiderProfile);
router.route('/me').get(isAuth,getMyProfile);
router.route('/update-availability').patch(isAuth, updateAvailability)

router.route('/accept/:orderId').post(isAuth,acceptOrder);
router.route('/order/current').get(isAuth, fetchMyCurrentOrders);
router.route('/order/request/:orderId').get(isAuth, getIncomingOrderPreview);
router.route('/order/delivered').get(isAuth, getDeliveredOrdersAnalytics);
router.route('/order/update/:orderId').put(isAuth, updateOrderStatus);

router.route('/all').get(isAuth,allriders);
router.route('/unverified').get(isAuth,unverifiedriders);
router.route('/verify').post(isAuth,verifyRider);

export default router;