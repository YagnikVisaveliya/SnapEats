import express from 'express';
import { addUserRole, loginUser, profile } from "./../controller/auth.controller.js";
import { IsAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route('/login').post(loginUser);
router.route('/add-role').put(IsAuth, addUserRole);
router.route('/me').get(IsAuth, profile);

export default router;