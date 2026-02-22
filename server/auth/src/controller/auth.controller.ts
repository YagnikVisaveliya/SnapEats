import { Request, Response} from 'express';
import User from "./../model/User.model.js";
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import { oauth2client } from "../config/googleApi.js";
import axios from 'axios';

export const loginUser = async (req:Request, res:Response) => {

    try{
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "Authorization code is required" });
        }

        const googleRes = await oauth2client.getToken(code as string);
        oauth2client.setCredentials(googleRes.tokens);

        const userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);

        const {email,name,picture} = userRes.data;

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({ email, name, image: picture });
        }

        const token = jwt.sign({user}, process.env.JWT_SECRET as string, { expiresIn: '15d' });

        res.status(200).json({ message: "logged in successfully", user, token });



    }catch(error){
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const allowedRoles = ["customer", "rider", "seller"];
type Role = typeof allowedRoles[number];

export const addUserRole = async (req:AuthenticatedRequest, res:Response) => {
    try {
        if(!req.user?._id) {
            return res.status(401).json({ message: "Unauthorized - User not found in request" });        
        }

        const { role } = req.body as { role: Role };

        if(!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role provided" });
        }

        const user = await User.findByIdAndUpdate(req.user._id, { role }, { new: true });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const token = jwt.sign({ user }, process.env.JWT_SECRET as string, { expiresIn: '15d' });
        res.status(200).json({ message: "Role added successfully", user, token });

    } catch (error) {
        console.error("Error adding role to user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const profile = async (req:AuthenticatedRequest, res:Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized - User not found in request" });
    }
    res.status(200).json({ user });
    
}