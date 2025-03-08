import  express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

import dotenv from "dotenv";
import { checkoutSuccess, createCheckoutSession } from "../controllers/payment.controller.js";
dotenv.config();

const router = express.Router();


router.get("/create-checkout-session", protectRoute, createCheckoutSession);
router.get("/checkout-success", protectRoute, checkoutSuccess)



export default router;