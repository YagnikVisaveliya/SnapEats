import { Router } from "express";
import { isAuth } from "../middleware/isAuth.middleware.js";
import { toggleFavorite, getMyFavorites } from "../controller/favorite.controller.js";

const router = Router();

router.route('/toggle').post(isAuth, toggleFavorite);
router.route('/my').get(isAuth, getMyFavorites);

export default router;
