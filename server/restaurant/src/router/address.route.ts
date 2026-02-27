import { Router } from "express";
import { addAddress, deleteAddress, getAddresses } from "../controller/adress.controller.js";
import { isAuth } from "../middleware/isAuth.middleware.js";

const router = Router();

router.route('/new').post(isAuth, addAddress);
router.route('/:id').delete(isAuth, deleteAddress);
router.route('/all').get(isAuth, getAddresses);

export default router;