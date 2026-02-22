import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
})

import uploadRoutes from './routes/cloudinary.js';

app.use("/api", uploadRoutes);


app.listen(process.env.PORT, () => {
  console.log(`Utils service running on port ${process.env.PORT}`);
});

