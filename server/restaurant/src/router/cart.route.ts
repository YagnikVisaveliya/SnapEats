import { Router } from "express";
import { addToCart, fetchCart } from "../controller/cart.controller.js";
import { isAuth } from "../middleware/isAuth.middleware.js";

const router = Router();

router.route("/add").post(isAuth,addToCart);
router.route("/myCart").get(isAuth,fetchCart);

export default router;