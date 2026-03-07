import User from "../models/user.js";
import Attorney from "../models/attorney.js";
import admin from 'firebase-admin'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary via env (expects CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

import { safeErrorMessage } from '../utils/errorResponse.js';
export const getProfile = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' })
        }

        const idToken = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        // Check both User and Attorney collections so attorneys can load their profile
        let profile = await User.findOne({ firebaseUid: decodedToken.uid })
        let isAttorney = false

        if (!profile) {
            profile = await Attorney.findOne({ firebaseUid: decodedToken.uid })
            isAttorney = !!profile
        }

        if (!profile) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        res.json({
            success: true,
            data: {
                id: profile._id,
                email: profile.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
                username: profile.username,
                role: profile.role,
                isVerified: profile.isVerified,
                createdAt: profile.createdAt,
                accountStatus: isAttorney ? profile.accountStatus : undefined,
                profileImage: profile.profileImage || '',
                signatureUrl: profile.signatureUrl || '',
                google: profile.google ? { connected: !!profile.google.connected } : { connected: false },
            }
        })

    } catch (error) {
        res.status(500).json({ success: false, message: safeErrorMessage(error)})
    }
}

export const fetchUsers = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' })
        }

        const idToken = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        // Check both User and Attorney collections
        let authenticatedUser = await User.findOne({ firebaseUid: decodedToken.uid })
        if (!authenticatedUser) {
            authenticatedUser = await Attorney.findOne({ firebaseUid: decodedToken.uid })
        }

        if (!authenticatedUser) {
            return res.status(404).json({ success: false, message: 'User not found in User or Attorney collection' })
        }

        // Allow secretary and attorney roles to access user management
        const allowedRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern', 'director', 'supervising_lawyer'];
        if (!allowedRoles.includes(authenticatedUser.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' })
        }

        const users = await User.find({}, 'email firstName lastName username role isVerified createdAt profileImage disabled')

        res.json({
            success: true,
            count: users.length,
            data: users
        })

    } catch (error) {
        res.status(500).json({ success: false, message: safeErrorMessage(error)})
    }

}

// Update user role (admin only - secretary/user roles only)
export const updateUserRole = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' })
        }

        const idToken = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        // Check both User and Attorney collections
        let adminUser = await User.findOne({ firebaseUid: decodedToken.uid })
        if (!adminUser) {
            adminUser = await Attorney.findOne({ firebaseUid: decodedToken.uid })
        }

        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'Admin user not found' })
        }

        // Only allow admin roles to change user roles
        const adminRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern', 'director', 'supervising_lawyer'];
        if (!adminRoles.includes(adminUser.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' })
        }

        const { userId } = req.params
        const { role } = req.body

        // Only allow changing to valid roles
        if (!['user', 'secretary', 'intern', 'director', 'supervising_lawyer'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role. Allowed roles: user, secretary, intern, director, supervising_lawyer.' })
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, select: 'email firstName lastName username role isVerified createdAt profileImage disabled' }
        )

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        res.json({
            success: true,
            data: updatedUser,
            message: 'User role updated successfully'
        })

    } catch (error) {
        res.status(500).json({ success: false, message: safeErrorMessage(error)})
    }
}

// Toggle user account status (disable/enable)
export const toggleUserStatus = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' })
        }

        const idToken = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        // Check both User and Attorney collections
        let adminUser = await User.findOne({ firebaseUid: decodedToken.uid })
        if (!adminUser) {
            adminUser = await Attorney.findOne({ firebaseUid: decodedToken.uid })
        }

        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'Admin user not found' })
        }

        const adminRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern', 'director', 'supervising_lawyer'];
        if (!adminRoles.includes(adminUser.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' })
        }

        const { userId } = req.params
        const { disabled } = req.body

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { disabled: disabled === true },
            { new: true, select: 'email firstName lastName username role isVerified createdAt profileImage disabled' }
        )

        if (!updatedUser) {
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

    } catch (error) {
        res.status(500).json({ success: false, message: safeErrorMessage(error)})
    }
}

// Send password reset email
export const sendPasswordResetEmail = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' })
        }

        const idToken = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        // Check both User and Attorney collections
        let adminUser = await User.findOne({ firebaseUid: decodedToken.uid })
        if (!adminUser) {
            adminUser = await Attorney.findOne({ firebaseUid: decodedToken.uid })
        }

        if (!adminUser) {
            return res.status(404).json({ success: false, message: 'Admin user not found' })
        }

        const adminRoles = ['secretary', 'attorney', 'pao_lawyer', 'legal_volunteer', 'intern', 'director', 'supervising_lawyer'];
        if (!adminRoles.includes(adminUser.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to perform this action' })
        }

        const { email } = req.body

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' })
        }

        // Generate password reset link using Firebase Admin
        const resetLink = await admin.auth().generatePasswordResetLink(email)

        // In production, you would send this via email service

        res.json({
            success: true,
            message: 'Password reset email sent successfully',
            // In production, don't return the link
            resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
        })

    } catch (error) {
        console.error('Send password reset error:', error)
        res.status(500).json({ success: false, message: safeErrorMessage(error)})
    }
}

// Update profile image (saves a Cloudinary URL)
export const updateProfileImage = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const idToken = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        const { profileImage } = req.body;

        if (!profileImage || typeof profileImage !== 'string') {
            return res.status(400).json({ success: false, message: 'profileImage URL is required' });
        }

        // Try User collection first, then Attorney
        let profile = await User.findOneAndUpdate(
            { firebaseUid: decodedToken.uid },
            { profileImage },
            { new: true }
        );

        if (!profile) {
            profile = await Attorney.findOneAndUpdate(
                { firebaseUid: decodedToken.uid },
                { profileImage },
                { new: true }
            );
        }

        if (!profile) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: { profileImage: profile.profileImage },
            message: 'Profile image updated successfully',
        });
    } catch (error) {
        console.error('Update profile image error:', error);
        res.status(500).json({ success: false, message: safeErrorMessage(error)});
    }
};

// Update signature URL (saves Cloudinary URL)
export const updateSignature = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const idToken = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        const { signatureUrl } = req.body;

        if (!signatureUrl || typeof signatureUrl !== 'string') {
            return res.status(400).json({ success: false, message: 'signatureUrl is required' });
        }

        // Try User collection first, then Attorney
        let profile = await User.findOneAndUpdate(
            { firebaseUid: decodedToken.uid },
            { signatureUrl },
            { new: true }
        );

        if (!profile) {
            profile = await Attorney.findOneAndUpdate(
                { firebaseUid: decodedToken.uid },
                { signatureUrl },
                { new: true }
            );
        }

        if (!profile) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: { signatureUrl: profile.signatureUrl },
            message: 'Signature updated successfully',
        });
    } catch (error) {
        console.error('Update signature error:', error);
        res.status(500).json({ success: false, message: safeErrorMessage(error)});
    }
};

// Server-side upload of signature (accepts a data URL in `dataUrl`)
export const uploadSignature = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const idToken = authHeader.split(' ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        const { dataUrl } = req.body;
        if (!dataUrl || typeof dataUrl !== 'string') {
            return res.status(400).json({ success: false, message: 'dataUrl (base64) is required' });
        }

        // Upload to Cloudinary under a user-specific folder
        // Use a stable public_id per user so uploads overwrite previous signature
        const publicId = `signature`;
        const folder = `signatures/${decodedToken.uid}`;

        const uploadResult = await cloudinary.uploader.upload(dataUrl, {
            folder,
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
            format: 'png',
        });

        const signatureUrl = uploadResult.secure_url;

        // Persist signatureUrl to User or Attorney record
        let profile = await User.findOneAndUpdate(
            { firebaseUid: decodedToken.uid },
            { signatureUrl },
            { new: true }
        );

        if (!profile) {
            profile = await Attorney.findOneAndUpdate(
                { firebaseUid: decodedToken.uid },
                { signatureUrl },
                { new: true }
            );
        }

        if (!profile) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: { signatureUrl }, message: 'Signature uploaded and saved.' });
    } catch (error) {
        console.error('uploadSignature error:', error);
        res.status(500).json({ success: false, message: safeErrorMessage(error)});
    }
}

// Get user by id (returns null data when not found to avoid noisy 404s)
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params

        // Validate ObjectId-ish string (best-effort)
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid user id' })
        }

        let user = null

        // Try User collection first
        try {
            user = await User.findById(userId).select('-password')
        } catch (e) {
            // ignore cast errors
            user = null
        }

        // If not found in User, check Attorney
        if (!user) {
            try {
                user = await Attorney.findById(userId).select('-password')
            } catch (e) {
                user = null
            }
        }

        // Return success with null when missing to match frontend expectations and avoid 404 spam
        if (!user) {
            return res.json({ success: true, data: null })
        }

        // Normalize returned payload
        const payload = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            role: user.role,
            profileImage: user.profileImage || '',
            signatureUrl: user.signatureUrl || '',
            createdAt: user.createdAt,
        }

        res.json({ success: true, data: payload })
    } catch (error) {
        res.status(500).json({ success: false, message: safeErrorMessage(error)})
    }
}

// ── Push notification token management ──

export const registerPushToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const decodedToken = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);

        const { token } = req.body;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ success: false, message: 'Push token is required' });
        }

        // Add token only if not already present
        await User.updateOne(
            { firebaseUid: decodedToken.uid },
            { $addToSet: { pushTokens: token } }
        );

        res.json({ success: true, message: 'Push token registered' });
    } catch (error) {
        console.error('registerPushToken error:', error);
        res.status(500).json({ success: false, message: safeErrorMessage(error) });
    }
};

export const unregisterPushToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const decodedToken = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);

        const { token } = req.body;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ success: false, message: 'Push token is required' });
        }

        await User.updateOne(
            { firebaseUid: decodedToken.uid },
            { $pull: { pushTokens: token } }
        );

        res.json({ success: true, message: 'Push token removed' });
    } catch (error) {
        console.error('unregisterPushToken error:', error);
        res.status(500).json({ success: false, message: safeErrorMessage(error) });
    }
};