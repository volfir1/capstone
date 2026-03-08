import admin from 'firebase-admin';
import User from '../models/user.js';

/**
 * Firebase authentication middleware
 * Verifies the Firebase ID token from the Authorization header
 * and attaches the MongoDB user record (with role) to req.user
 */
export const authenticateFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Also accept token from query string (for browser/Linking.openURL access to files)
    const idToken = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.split('Bearer ')[1]
      : req.query?.token || null;

    if (!idToken) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Look up the full user record so downstream handlers have the role
      const dbUser = await User.findOne({ firebaseUid: decodedToken.uid }).lean();

      // Attach user info to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        // Include MongoDB fields when available
        ...(dbUser && {
          _id: dbUser._id,
          role: dbUser.role,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          isVerified: dbUser.isVerified,
        }),
      };

      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Authentication failed' 
    });
  }
};

/**
 * Role-based authorization middleware factory.
 * Usage: requireRole('director', 'secretary')
 * Must be applied AFTER authenticateFirebaseToken.
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Role information not available',
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};
