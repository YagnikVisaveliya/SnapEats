import { Router } from "express";
import { addToCart, clearCart, decrementCartItem, fetchCart, incrementCartItem } from "../controller/cart.controller.js";
import { isAuth } from "../middleware/isAuth.middleware.js";

const router = Router();

router.route("/add").post(isAuth,addToCart);
router.route("/myCart").get(isAuth,fetchCart);
router.route('/inc').post(isAuth, incrementCartItem);
router.route('/dec').post(isAuth, decrementCartItem);
router.route('/clear').delete(isAuth, clearCart);

export default router;