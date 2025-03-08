import jwt from "jsonwebtoken";
import User from "../models/user.model.js"
export const protectRoute = async(req,res,next) =>{
    try {
        const accessToken = req.cookies.accessToken
      
        if(!accessToken){
            return res.status(401).json({message:"UnAthorized no token provided"});

        }

        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const  user = await User.findById(decoded.userId).select("-password")

            if(!user){
                return res.status(401).json({message:"user not found"})
            }
            req.user = user;
            next();
        } catch (error) {
            if(error.name === "TokenExpiredError"){
                return res.status(401).json({message:"Unathorized - access token expired"})
            }
            throw error;
        }
    } catch (error) {
        console.log("error in protected route",error.message);
        return res.status(500).json({message:'Internal server error'})
    }
}

export const adminRoute = (req,res,next) => {
    if(req.user && req.user.role ==="admin"){
        next();
    }else{
        return res.status(403).json({message: "access denied -- Admin Only"})
    }
}