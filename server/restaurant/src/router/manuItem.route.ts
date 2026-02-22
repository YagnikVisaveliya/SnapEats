import { Router } from "express";
import { addManuItem, deleteManuItem, getAllItems, toggleManuItemAvailability } from "../controller/manuItems.controller.js";
import { isAuth, isSeller } from "../middleware/isAuth.middleware.js";
import uploadFile from "../middleware/multer.js";

const router = Router();

router.route('/new').post(isAuth,isSeller,uploadFile,addManuItem);
router.route('/all/:id').get(isAuth,getAllItems);
router.route('/delete/:id').delete(isAuth,isSeller,deleteManuItem);
router.route('/status/:id').put(isAuth,isSeller,toggleManuItemAvailability);

export default router;