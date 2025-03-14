import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js"
import productRoutes from "./routes/product.route.js"
import cartRoutes from "./routes/cart.route.js"
import couponRoutes from "./routes/coupon.route.js"
import paymentRoutes from "./routes/payment.route.js"
import { connectDB } from "./lib/db.js";
dotenv.config();

const Port = process.env.PORT || 5000;
const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use("/api/auth" , authRoutes);
app.use("/api/products",productRoutes);
app.use("/api/cart",cartRoutes);
app.use("/api/coupons",couponRoutes);
app.use("/api/payments",paymentRoutes);

app.listen(Port,() =>{
    console.log("server is running in port " + Port);
    connectDB();
})