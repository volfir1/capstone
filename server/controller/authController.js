import User from "../models/user.js";
import Attorney from "../models/attorney.js";
import Account from "../models/account.js";
import admin from "firebase-admin";
import {
  createStaffProfileForAccount,
  ensureAccountForDecodedToken,
  getRequestedProfileId,
  listProfilesForAccount,
  resolveActiveProfileForAccount,
  serializeAccount,
  serializeProfile,
  updateLastSelectedProfile,
} from "../utils/accountContext.js";

import { safeErrorMessage } from '../utils/errorResponse.js';
const getFirebaseUserWithRetry = async (
  email,
  maxRetries = 3,
  delayMs = 1000
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} to fetch Firebase user for ${email}`);
      const firebaseUser = await admin.auth().getUserByEmail(email);
      console.log("Firebase UID fetched:", firebaseUser.uid);
      return firebaseUser;
    } catch (error) {
      if (i === maxRetries - 1) {
        // Last attempt failed
        throw error;
      }
      console.log(`Firebase user not found, retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
};

export const register = async (req, res) => {
  try {
    const { idToken, firstName, lastName, username, email, role } = req.body;
    let decodedToken;

    if (idToken) {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } else {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required when no idToken is provided",
        });
      }

      try {
        const firebaseUser = await getFirebaseUserWithRetry(email);
        decodedToken = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          email_verified: firebaseUser.emailVerified || false,
          name: firebaseUser.displayName || "",
        };
      } catch (error) {
        console.error("Firebase lookup error after retries:", error);
        return res.status(400).json({
          success: false,
          message:
            "Firebase user not found. Please ensure Firebase account is created first.",
        });
      }
    }
    console.log("🔥 before ensureAccount");
const account = await ensureAccountForDecodedToken(decodedToken);
console.log("✅ after ensureAccount:", account._id);


    let createdProfile = null;
    if (firstName && lastName && role) {
      createdProfile = await createStaffProfileForAccount(account, {
        firstName,
        lastName,
        role,
        username,
      });
      await updateLastSelectedProfile(account._id, createdProfile._id);
    }

    res.status(201).json({
      success: true,
      data: {
        account: serializeAccount(account),
        profile: createdProfile ? serializeProfile(createdProfile, account) : null,
      },
      message: createdProfile
        ? "Account and staff profile created successfully"
        : "Account registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error)});
  }
};

// Check if email already exists
export const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const existingUser = await Account.findOne({ email: String(email).trim().toLowerCase() });

    res.status(200).json({
      success: true,
      exists: !!existingUser,
    });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error)});
  }
};

// Verify user email status
export const verifyUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const account = await ensureAccountForDecodedToken(decodedToken);
    const firebaseVerified = !!decodedToken.email_verified;

    await User.updateMany(
      { accountId: account._id },
      {
        $set: {
          isVerified: firebaseVerified,
          email: account.email,
          firebaseUid: account.firebaseUid,
        },
      }
    );

    res.json({
      success: true,
      message: `Verification status updated to ${firebaseVerified}`,
      data: {
        isVerified: firebaseVerified,
      },
    });
  } catch (error) {
    console.error("Verify user error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error)});
  }
};

export const getAccountContext = async (req, res) => {
  try {
    // Token already verified by authenticateFirebaseToken middleware
    const account = req.account;
    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const profiles = await listProfilesForAccount(account._id, { includeDisabled: true });
    const requestedProfileId = getRequestedProfileId(req);
    const activeProfile = await resolveActiveProfileForAccount(
      account._id,
      requestedProfileId,
      { allowFallback: false, includeDisabled: true }
    );

    if (activeProfile) {
      await updateLastSelectedProfile(account._id, activeProfile._id);
    }

    res.json({
      success: true,
      data: {
        account: serializeAccount(account),
        profiles: profiles.map((profile) => serializeProfile(profile, account)),
        activeProfileId: activeProfile?._id?.toString?.() || "",
      },
    });
  } catch (error) {
    console.error("Get account context error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

// Register Attorney
export const registerAttorney = async (req, res) => {
  try {
    const {
      email,
      username,
      firstName,
      middleName,
      lastName,
      suffix,
      role,
      prcLicenseNumber,
      ibrNumber,
      barAdmissionDate,
      phoneNumber,
      officeAddress,
      lawFirm,
      isPAOLawyer,
      paoOffice,
      specializations,
      languages,
      consultationMode,
      biography,
      education,
    } = req.body;

    // Validate required fields
    if (!email || !username || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: email, username, firstName, lastName",
      });
    }

    if (!prcLicenseNumber || !ibrNumber || !barAdmissionDate || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Missing required professional fields: prcLicenseNumber, ibrNumber, barAdmissionDate, phoneNumber",
      });
    }

    if (!officeAddress?.city || !officeAddress?.province || !officeAddress?.region) {
      return res.status(400).json({
        success: false,
        message: "Missing required office address fields: city, province, region",
      });
    }

    // Get Firebase UID
    let firebaseUid;
    try {
      const firebaseUser = await getFirebaseUserWithRetry(email);
      firebaseUid = firebaseUser.uid;
    } catch (error) {
      console.error("Firebase lookup error:", error);
      return res.status(400).json({
        success: false,
        message: "Firebase user not found. Please ensure Firebase account is created first.",
      });
    }

    // Check if attorney already exists
    const existingAttorney = await Attorney.findOne({
      $or: [
        { email },
        { username },
        { firebaseUid },
        { prcLicenseNumber },
        { ibrNumber },
      ],
    });

    if (existingAttorney) {
      let conflictField = "email";
      if (existingAttorney.username === username) conflictField = "username";
      if (existingAttorney.prcLicenseNumber === prcLicenseNumber) conflictField = "PRC License Number";
      if (existingAttorney.ibrNumber === ibrNumber) conflictField = "IBR Number";
      
      return res.status(400).json({
        success: false,
        message: `Attorney with this ${conflictField} already exists`,
      });
    }

    // Create attorney record
    const attorney = await Attorney.create({
      email,
      username,
      firstName,
      middleName: middleName || "",
      lastName,
      suffix: suffix || "",
      firebaseUid,
      role: role || "attorney",
      prcLicenseNumber,
      ibrNumber,
      barAdmissionDate: new Date(barAdmissionDate),
      isVerified: false,
      isBarMemberActive: true,
      phoneNumber,
      officeAddress: {
        street: officeAddress.street || "",
        barangay: officeAddress.barangay || "",
        city: officeAddress.city,
        province: officeAddress.province,
        region: officeAddress.region,
        zipCode: officeAddress.zipCode || "",
      },
      lawFirm: lawFirm || "",
      isPAOLawyer: isPAOLawyer || false,
      paoOffice: paoOffice || "",
      specializations: specializations || [],
      languages: languages || [],
      consultationMode: consultationMode || [],
      isAvailable: true,
      biography: biography || "",
      education: education || [],
      accountStatus: "pending",
    });

    res.status(201).json({
      success: true,
      data: {
        id: attorney._id,
        email: attorney.email,
        username: attorney.username,
        firstName: attorney.firstName,
        lastName: attorney.lastName,
        role: attorney.role,
        accountStatus: attorney.accountStatus,
        isVerified: attorney.isVerified,
        createdAt: attorney.createdAt,
      },
      message: "Attorney registered successfully. Your account is pending approval.",
    });
  } catch (error) {
    console.error("Attorney registration error:", error);
    res.status(500).json({ 
      success: false, 
      message: safeErrorMessage(error, "Failed to register attorney") 
    });
  }
};

// Get all attorneys (Admin)
export const getAllAttorneys = async (req, res) => {
  try {
    const attorneys = await Attorney.find()
      .select('-__v -firebaseUid')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: attorneys,
      message: "Attorneys retrieved successfully",
    });
  } catch (error) {
    console.error("Get all attorneys error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to retrieve attorneys"),
    });
  }
};

// Activate attorney account (Admin)
export const activateAttorney = async (req, res) => {
  try {
    const { attorneyId } = req.params;

    const attorney = await Attorney.findById(attorneyId);
    
    if (!attorney) {
      return res.status(404).json({
        success: false,
        message: "Attorney not found",
      });
    }

    if (attorney.accountStatus === 'active') {
      return res.status(400).json({
        success: false,
        message: "Attorney account is already active",
      });
    }

    attorney.accountStatus = 'active';
    attorney.isVerified = true;
    await attorney.save();

    res.status(200).json({
      success: true,
      data: {
        id: attorney._id,
        email: attorney.email,
        firstName: attorney.firstName,
        lastName: attorney.lastName,
        username: attorney.username,
        role: attorney.role,
        accountStatus: attorney.accountStatus,
        isVerified: attorney.isVerified,
      },
      message: "Attorney account activated successfully",
    });
  } catch (error) {
    console.error("Activate attorney error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to activate attorney account"),
    });
  }
};

// Verify Attorney Login (checks MongoDB verification)
export const verifyAttorney = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find attorney in MongoDB
    const attorney = await Attorney.findOne({ email });

    if (!attorney) {
      return res.status(404).json({
        success: false,
        message: "Attorney account not found",
      });
    }

    // Return attorney data (including verification status)
    res.status(200).json({
      success: true,
      data: {
        id: attorney._id,
        email: attorney.email,
        username: attorney.username,
        firstName: attorney.firstName,
        middleName: attorney.middleName,
        lastName: attorney.lastName,
        suffix: attorney.suffix,
        role: attorney.role,
        isVerified: attorney.isVerified,
        accountStatus: attorney.accountStatus,
        prcLicenseNumber: attorney.prcLicenseNumber,
        ibrNumber: attorney.ibrNumber,
        phoneNumber: attorney.phoneNumber,
        lawFirm: attorney.lawFirm,
        isPAOLawyer: attorney.isPAOLawyer,
        specializations: attorney.specializations,
        languages: attorney.languages,
        isAvailable: attorney.isAvailable,
        createdAt: attorney.createdAt,
      },
      message: "Attorney verified successfully",
    });
  } catch (error) {
    console.error("Verify attorney error:", error);
    res.status(500).json({ 
      success: false, 
      message: safeErrorMessage(error, "Failed to verify attorney") 
    });
  }
};

// Get email from username (for login purposes)
export const getEmailFromUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    // Check if it's already an email format
    if (username.includes('@')) {
      return res.status(200).json({
        success: true,
        email: username,
        isEmail: true,
      });
    }

    // Try to find user by username
    const user = await User.findOne({ username });
    if (user) {
      return res.status(200).json({
        success: true,
        email: user.email,
        isEmail: false,
      });
    }

    const account = await Account.findOne({ email: username.toLowerCase() });
    if (account) {
      return res.status(200).json({
        success: true,
        email: account.email,
        isEmail: false,
      });
    }

    return res.status(404).json({
      success: false,
      message: "Username not found",
    });
  } catch (error) {
    console.error("Get email from username error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to get email from username"),
    });
  }
};

// Create client account for finalized case (Admin only)
export const createClientAccount = async (req, res) => {
  try {
    const { finalizeId, username, password, email } = req.body;

    // Validate required fields
    if (!finalizeId || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: finalizeId, username, password",
      });
    }

    // Import Finalize model
    const Finalize = (await import("../models/finalize.js")).default;
    
    // Get finalized case
    const finalizedCase = await Finalize.findById(finalizeId);
    if (!finalizedCase) {
      return res.status(404).json({
        success: false,
        message: "Finalized case not found",
      });
    }

    // Check if this case is already linked to a user
    if (finalizedCase.linkedCaseId) {
      const Case = (await import("../models/case.js")).default;
      const linkedCase = await Case.findById(finalizedCase.linkedCaseId).populate('userId');
      if (linkedCase && linkedCase.userId) {
        return res.status(400).json({
          success: false,
          message: "This case is already linked to a user account",
        });
      }
    }

    // Check if account was already created for this finalized case
    if (finalizedCase.clientAccountCreated) {
      return res.status(400).json({
        success: false,
        message: "Client account has already been created for this case",
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Generate email if not provided
    const clientEmail = email || `${username}@finalizedcase.local`;
    
    // Check if email already exists
    const existingEmailUser = await User.findOne({ email: clientEmail });
    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Extract client name from finalized case
    const firstName = finalizedCase.content?.interviewInfo?.clientName?.split(' ')[0] || finalizedCase.clientName?.split(' ')[0] || 'Client';
    const lastName = finalizedCase.content?.interviewInfo?.clientName?.split(' ').slice(1).join(' ') || finalizedCase.clientName?.split(' ').slice(1).join(' ') || 'User';

    // Create Firebase account
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: clientEmail,
        password: password,
        displayName: `${firstName} ${lastName}`,
        emailVerified: true, // Admin-created accounts are pre-verified
      });
    } catch (firebaseError) {
      console.error("Firebase user creation error:", firebaseError);
      return res.status(500).json({
        success: false,
        message: safeErrorMessage(firebaseError, "Failed to create Firebase account"),
      });
    }

    // Create MongoDB user
    const user = await User.create({
      email: clientEmail,
      firstName: firstName,
      lastName: lastName,
      username: username,
      firebaseUid: firebaseUser.uid,
      isVerified: true, // Admin-created accounts are pre-verified
      role: "user",
      disabled: false,
    });

    // Update finalized case to mark that client account was created
    finalizedCase.clientAccountCreated = true;
    finalizedCase.clientUserId = user._id;
    await finalizedCase.save();

    res.status(201).json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        finalizeId: finalizedCase._id,
        caseId: finalizedCase.caseId,
      },
      message: "Client account created successfully",
    });
  } catch (error) {
    console.error("Create client account error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to create client account"),
    });
  }
};

// Fix verification status for client accounts (temporary endpoint)
export const verifyClientAccount = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update Firebase
    await admin.auth().updateUser(user.firebaseUid, {
      emailVerified: true,
    });

    // Update MongoDB
    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Client account verified successfully",
      data: {
        username: user.username,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Verify client account error:", error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, "Failed to verify client account"),
    });
  }
};
