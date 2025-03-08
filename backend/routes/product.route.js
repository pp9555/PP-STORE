import express from "express";
import { createProduct, deleteProduct, getAllProducts, getFeaturedProducts, getProductsByCategory, getRecomendedProducts, toggleFeaturedProduct } from "../controllers/product.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.get("/",protectRoute ,adminRoute ,getAllProducts)
router.get("/featured",getFeaturedProducts)
router.get("/recomended",getRecomendedProducts)
router.get('/category/:category',getProductsByCategory)
router.post("/",protectRoute ,adminRoute ,createProduct)
router.patch("/:id",protectRoute ,adminRoute ,toggleFeaturedProduct)
router.delete("/:id",protectRoute ,adminRoute ,deleteProduct)

export default router;