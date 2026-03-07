import Router from "express";
import { addRiderProfile, getMyProfile, updateAvailability} from "../controller/rider.js";
import { isAuth } from "../middleware/isAuth.middleware.js";
import uploadFile from "../middleware/multer.js";

const router = Router();

router.route('/add').post(isAuth, uploadFile, addRiderProfile);
router.route('/me').get(isAuth,getMyProfile);
router.route('/update-availability').patch(isAuth, updateAvailability)

export default router;