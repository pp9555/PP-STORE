import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";
import express from "express"

export const getAllProducts = async (req,res) => {
    try {
        const products = await Product.find({});
        res.json({products})
    } catch (error) {
        console.log("Error in getAllProduct controller",error.message);
        res.status(500).json({message:"Internal server error", error:error.message})
    }
}

export const getFeaturedProducts = async (req,res) => {
    try {
        let featuredProduct = await redis.get("featuredProducts"); 
        if(featuredProduct){
            return res.json(JSON.parse(featuredProduct));
        }

        // if not in redis database, get from mongodb database
        featuredProduct= await Product.find({isFeatured:true}).lean();

        if(!featuredProduct){
            return res.status(404).json({message:"No featured product found"})
        }

        // store in redis database

        await redis.set("featuredProducts",JSON.stringify(featuredProduct));
        res.json(featuredProduct)
    } catch (error) {
        console.log("Error in getFeaturedProduct controller",error.message);
        res.status(500).json({message:"Internal server error", error:error.message})
    }
}

export const createProduct =async (req,res) => {
    
    try {
        const {name,description,price,category,image} = req.body;

        let cloudinaryResponse = null;

        if(image){
            cloudinaryResponse = await cloudinary.uploader.upload(image,{folder:"products"});
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            image:cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
        });

        res.status(201).json(product);

    } catch (error) {
        console.log("Error in createProduct controller",error.message);
        res.status(500).json({message:"Internal server error", error:error.message})
    }
}

export const deleteProduct = async (req,res) =>{
    try {
        const product = await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({message:"Product not found"})
        }
        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0]
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`)
                console.log("Image deleted from cloudinary")
            } catch (error) {
                console.log("Error deleting image from cloudinary",error.message)
            }
        }

        await Product.findByIdAndDelete(req.params.id);
        res.json({message:"Product deleted successfully"})
    } catch (error) {
        console.log("Error in deleteProduct controller",error.message);
        res.status(500).json({message:"Internal server error", error:error.message})
    }
}

export const getRecommendedProducts = async (req,res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample:{size:5}
            },
            {
                $project:{
                    _id:1,
                    name:1,
                    description:1,
                    image:1,
                    price:1,
                }
            }
        ])

        res.json(products)
    } catch (error) {
        console.log("Error in getRecomendedProduct controller",error.message);
        res.status(500).json({message:"Internal server error", error:error.message})
    }
}

export const getProductsByCategory = async (req,res) => {
    const {category} = req.params;
    try {
        const products = await Product.find({category})
        res.json({products})
    } catch (error) {
        console.log("Error in getProductsByCategory controller",error.message);
        res.status(500).json({message:"Internal server error", error:error.message})
    }
}

export const toggleFeaturedProduct = async (req,res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(product){
            product.isFeatured = !product.isFeatured;
            const updateProduct = await product.save();
            await updateFeaturedProductsCache()
            res.json(updateProduct);
            }else{
                res.status(404).json({message:"Product not found"})
            }
    } catch (error) {
        console.log("Error in toggleFeaturedProduct controller",error.message);
        res.status(500).json({message:"Internal server error", error:error.message})
    }
}

async function updateFeaturedProductsCache(){
    try {
        const featuredProduct = await Product.find({isFeatured:true}).lean();
        await redis.set("featuredProducts",JSON.stringify(featuredProduct));
    } catch (error) {
        console.log("Error in updateFeaturedProductsCache",error.message);
        res.status(500).json({message:"Internal server error", error:error.message})
    }
}