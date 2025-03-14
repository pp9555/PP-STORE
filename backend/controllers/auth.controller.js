import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js"



const generateTokens = (userId) => {
   const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"});
   const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET,{expiresIn:"7d"});
    return {accessToken,refreshToken}
}

const storeRefeshToken= async (userId,refreshToken) => {
    await redis.set(`refreshToken:${userId}`,refreshToken,"Ex",60*60*24*7)//7 days
}

const setCookies = (res,accessToken,refreshToken) => {
    res.cookie("accessToken",accessToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:"strict",
        maxAge:15*60*1000,
    })

    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:"strict",
        maxAge:7*24*60*60*1000,
    })
}

export const login = async (req,res) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(user && (await user.comparePassword(password))){
            const {accessToken,refreshToken}= generateTokens(user._id);
            await storeRefeshToken(user._id,refreshToken);
            setCookies(res,accessToken,refreshToken);

            res.json({
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
                message:"User logged in successfully"
            })
        }else{
            res.status(401).json({message:"Invalid credentials"})
        }
    } catch (error) {
        console.log("error in login controller",error.message)
        res.status(500).json({message:"server error",error:error.message})
    }
};

export const signup = async (req,res) => {
    const{ name, email, password }= req.body;
   
    try {
        const userExists = await User.findOne({email});
        if(userExists){
           return res.status(400).json({message:"User already exists"})
        }
        const user= await User.create({name,email,password});

        // authenticate

        const {accessToken,refreshToken}= generateTokens(user._id);
        await storeRefeshToken(user._id,refreshToken);

        setCookies(res,accessToken,refreshToken)
    
        res.status(201).json({
            _id:user._id,
            name:user.name,
            email:user.email,
            role:user.role,
        message:"User created successfully"})
    } catch (error) {
        res.status(500).json({message: error.message})
    }
  
};

// export const logout = async (req,res) => {
//     try {
//         const refreshToken = req.cookies.refreshToken;
//         if(refreshToken){
//             const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
//             await redis.del(`refreshToken:${decoded.userId}`);
//         }
//         res.clearCookie("accessToken");
//         res.clearCookie("refreshToken");
//         res.status(200).json({message:"User logged out successfully"})
//     } catch (error) {
//         res.status(500).json({message:"server error",error:error.message})
//     }
// };

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            try {
                const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                await redis.del(`refreshToken:${decoded.userId}`);
                console.log("Refresh token deleted from Redis");
            } catch (error) {
                console.log("Error verifying refresh token during logout:", error.message);
            }
        }

        // Clear cookies with the same options as set
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const refreshToken = async (req,res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(401).json({message: "no refresh token is provided"})
        }

        const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
        const storedToken = await redis.get(`refreshToken:${decoded.userId}`);

        if(storedToken !== refreshToken){
            return res.status(401).json({message:"Invalid refreshToken"})
        }

        const accessToken = jwt.sign({ userId:decoded.userId},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"});
        res.cookie("accessToken",accessToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV ==="production",
            sameSite:"strict",
            maxAge:15*60*1000,
        })

        res.json({message:"token refreshed successfully"});
    } catch (error) {
        console.log("error in refreshToken controller",error.message);
        res.status(500).json({message:"internal server error",error:error.message})
    }
}

export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};