import User from "../models/user.js";
import admin from 'firebase-admin'

export const getProfile = async (req, res) =>{
    try{
        const authHeader = req.headers.authorization

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({success: false, message: 'No token provided'})
        }

        const idToken  = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        const user = await User.findOne({firebaseUid: decodedToken.uid})

        if(!user){
            return res.status(404).json({ success: false, message: 'User not found'})
        }

        res.json({
            success: true,
            data:{
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                role: user.role,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        })

    }catch (error){
        res.status(500).json({success: false, message: error.message})
    }
}

export const fetchUsers = async (req, res) =>{
    try{
         const authHeader = req.headers.authorization

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({success: false, message: 'No token provided'})
        }

        const idToken  = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        const user = await User.findOne({firebaseUid: decodedToken.uid})
        
        if(!user){
            return res.status(404).json({ success: false, message: 'User not found'})
        }

        if(user.role !== 'admin'){
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' })
        }

        const users = await User.find({}, '-password')
        
        res.json({
            success: true,
            count: users.length,
            data: users
        })
    
    }catch(error){
        res.status(500).json({ success: false, message: error.message})
    }

}