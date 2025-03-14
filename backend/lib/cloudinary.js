import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();



    // Configuration
    cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME , 
        api_key: process.env.CLOUDINARY_ACCESS_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET_KEY // Click 'View API Keys' above to copy your API secret
    });

    export default cloudinary;
    