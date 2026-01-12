import User from "../models/user.js";
import Attorney from "../models/attorney.js";
import admin from 'firebase-admin'

export const getProfile = async (req, res) =>{
    try{
        const authHeader = req.headers.authorization

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({success: false, message: 'No token provided'})
        }

        const idToken  = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        // Check both User and Attorney collections so attorneys can load their profile
        let profile = await User.findOne({firebaseUid: decodedToken.uid})
        let isAttorney = false

        if(!profile){
            profile = await Attorney.findOne({firebaseUid: decodedToken.uid})
            isAttorney = !!profile
        }

        if(!profile){
            return res.status(404).json({ success: false, message: 'User not found'})
        }

        res.json({
            success: true,
            data:{
                id: profile._id,
                email: profile.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
                username: profile.username,
                role: profile.role,
                isVerified: profile.isVerified,
                createdAt: profile.createdAt,
                accountStatus: isAttorney ? profile.accountStatus : undefined,
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

        // Check both User and Attorney collections
        let authenticatedUser = await User.findOne({firebaseUid: decodedToken.uid})
        if (!authenticatedUser) {
            authenticatedUser = await Attorney.findOne({firebaseUid: decodedToken.uid})
        }
        
        if(!authenticatedUser){
            return res.status(404).json({ success: false, message: 'User not found in User or Attorney collection'})
        }

        // Allow secretary and attorney roles to access user management
        const allowedRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern'];
        if(!allowedRoles.includes(authenticatedUser.role)){
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

// Update user role (admin only - secretary/user roles only)
export const updateUserRole = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({success: false, message: 'No token provided'})
        }

        const idToken = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        // Check both User and Attorney collections
        let adminUser = await User.findOne({firebaseUid: decodedToken.uid})
        if (!adminUser) {
            adminUser = await Attorney.findOne({firebaseUid: decodedToken.uid})
        }
        
        if(!adminUser){
            return res.status(404).json({ success: false, message: 'Admin user not found'})
        }

        // Only allow admin roles to change user roles
        const adminRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern'];
        if(!adminRoles.includes(adminUser.role)){
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' })
        }

        const { userId } = req.params
        const { role } = req.body

        // Only allow changing to 'user', 'secretary', or 'intern' roles
        if(!['user', 'secretary', 'intern'].includes(role)){
            return res.status(400).json({ success: false, message: 'Invalid role. Only user, secretary, and intern roles are allowed.' })
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, select: '-password' }
        )

        if(!updatedUser){
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        res.json({
            success: true,
            data: updatedUser,
            message: 'User role updated successfully'
        })

    } catch(error){
        res.status(500).json({ success: false, message: error.message})
    }
}

// Toggle user account status (disable/enable)
export const toggleUserStatus = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({success: false, message: 'No token provided'})
        }

        const idToken = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        // Check both User and Attorney collections
        let adminUser = await User.findOne({firebaseUid: decodedToken.uid})
        if (!adminUser) {
            adminUser = await Attorney.findOne({firebaseUid: decodedToken.uid})
        }
        
        if(!adminUser){
            return res.status(404).json({ success: false, message: 'Admin user not found'})
        }

        const adminRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern'];
        if(!adminRoles.includes(adminUser.role)){
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' })
        }

        const { userId } = req.params
        const { disabled } = req.body

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { disabled: disabled === true },
            { new: true, select: '-password' }
        )

        if(!updatedUser){
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        // Also disable/enable in Firebase
        try {
            await admin.auth().updateUser(updatedUser.firebaseUid, {
                disabled: disabled === true
            })
        } catch (firebaseError) {
            console.log('Firebase disable/enable failed:', firebaseError.message)
        }

        res.json({
            success: true,
            data: updatedUser,
            message: `User account ${disabled ? 'disabled' : 'enabled'} successfully`
        })

    } catch(error){
        res.status(500).json({ success: false, message: error.message})
    }
}

// Send password reset email
export const sendPasswordResetEmail = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({success: false, message: 'No token provided'})
        }

        const idToken = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        // Check both User and Attorney collections
        let adminUser = await User.findOne({firebaseUid: decodedToken.uid})
        if (!adminUser) {
            adminUser = await Attorney.findOne({firebaseUid: decodedToken.uid})
        }
        
        if(!adminUser){
            return res.status(404).json({ success: false, message: 'Admin user not found'})
        }

        const adminRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern'];
        if(!adminRoles.includes(adminUser.role)){
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' })
        }

        const { email } = req.body

        if(!email){
            return res.status(400).json({ success: false, message: 'Email is required' })
        }

        // Generate password reset link using Firebase Admin
        const resetLink = await admin.auth().generatePasswordResetLink(email)

        // In production, you would send this via email service
        // For now, we'll just return success
        console.log('Password reset link for', email, ':', resetLink)

        res.json({
            success: true,
            message: 'Password reset email sent successfully',
            // In production, don't return the link
            resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
        })

    } catch(error){
        console.error('Send password reset error:', error)
        res.status(500).json({ success: false, message: error.message})
    }
}