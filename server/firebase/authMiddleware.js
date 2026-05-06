import admin from 'firebase-admin';
import User from '../models/user.js';
import {
  ensureAccountForDecodedToken,
  getRequestedProfileId,
  resolveActiveProfileForAccount,
  serializeProfile,
} from '../utils/accountContext.js';
import {
  describeProfilePinState,
  getRequestedProfilePinToken,
} from '../utils/profilePin.js';

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
      const account = await ensureAccountForDecodedToken(decodedToken);

      // Keep Mongo verification state in sync with Firebase even when the ID
      // token claim is stale (common right after clicking the verification link).
      try {
        const tokenVerified = !!decodedToken.email_verified;
        if (!account.isVerified && !tokenVerified) {
          const firebaseUser = await admin.auth().getUser(decodedToken.uid);
          if (firebaseUser?.emailVerified) {
            account.isVerified = true;
            await account.save().catch(() => {});
            await User.updateMany({ accountId: account._id }, { $set: { isVerified: true } }).catch(() => {});
            console.log(`Synced Account.isVerified=true from Firebase for uid=${decodedToken.uid}`);
          }
        } else if (!account.isVerified && tokenVerified) {
          account.isVerified = true;
          await account.save().catch(() => {});
          await User.updateMany({ accountId: account._id }, { $set: { isVerified: true } }).catch(() => {});
          console.log(`Synced Account.isVerified=true from token for uid=${decodedToken.uid}`);
        }
      } catch (syncError) {
        console.warn('Could not sync Firebase emailVerified to Mongo:', syncError.message);
      }

      const requestedProfileId = getRequestedProfileId(req);
      const activeProfile = await resolveActiveProfileForAccount(
        account._id,
        requestedProfileId,
        { allowFallback: false }
      );
      const profilePin = activeProfile
        ? describeProfilePinState({
            accountId: account._id,
            profile: activeProfile,
            token: getRequestedProfilePinToken(req),
          })
        : {
            hasPin: false,
            verified: false,
            requiresSetup: false,
            requiresUnlock: false,
            pinResetRequired: false,
            lockedUntil: null,
            isLocked: false,
            remainingAttempts: 0,
            maxAttempts: 0,
            sessionExpiresAt: null,
          };

      // Attach user info to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        accountId: account._id,
        isVerified: account.isVerified,
        ...(activeProfile && {
          _id: activeProfile._id,
          role: activeProfile.role,
          firstName: activeProfile.firstName,
          lastName: activeProfile.lastName,
          disabled: activeProfile.disabled,
          profile: serializeProfile(activeProfile, account),
        }),
      };
      req.account = account;
      req.activeProfile = activeProfile || null;
      req.profilePin = profilePin;

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

export const requireProfilePin = (req, res, next) => {
  if (!req.activeProfile) {
    return res.status(409).json({
      success: false,
      code: 'profile-selection-required',
      message: 'Select a staff profile first.',
    });
  }

  if (req.activeProfile.disabled) {
    return res.status(403).json({
      success: false,
      code: 'profile-disabled',
      message: 'This staff profile is disabled.',
    });
  }

  const pinState = req.profilePin || {};

  if (pinState.requiresSetup) {
    return res.status(428).json({
      success: false,
      code: 'profile-pin-setup-required',
      message: 'Set a PIN for this profile before continuing.',
      data: pinState,
    });
  }

  if (pinState.isLocked) {
    return res.status(423).json({
      success: false,
      code: 'profile-pin-locked',
      message: 'This profile PIN is temporarily locked after too many failed attempts.',
      data: pinState,
    });
  }

  if (!pinState.verified) {
    return res.status(428).json({
      success: false,
      code: 'profile-pin-required',
      message: 'Enter the profile PIN before continuing.',
      data: pinState,
    });
  }

  next();
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
