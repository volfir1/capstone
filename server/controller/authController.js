import User from "../models/user.js";
import Attorney from "../models/attorney.js";
import admin from "firebase-admin";

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
    const { idToken, firstName, lastName, username, email, isVerified, role } =
      req.body;

    console.log("Server received:", { firstName, lastName, username, email });

    let userEmail, firebaseUid;
    let userVerified = false;
    let isGoogleSignIn = false;

    // verify firebase token
    if (idToken) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      userEmail = decodedToken.email;
      firebaseUid = decodedToken.uid;
   
      const firebaseUser = await admin.auth().getUser(firebaseUid);
      isGoogleSignIn = firebaseUser.providerData.some(
        (provider) => provider.providerId === "google.com"
      );

      if (isGoogleSignIn) {
        userVerified = decodedToken.email_verified || false;
      } else {
      
        userVerified = decodedToken.email_verified || false;
      }
    } else {
   
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required when no idToken provided",
        });
      }
      userEmail = email;

    
      try {
        const firebaseUser = await getFirebaseUserWithRetry(email);
        firebaseUid = firebaseUser.uid;
      
        userVerified = false;
      } catch (error) {
        console.error("Firebase lookup error after retries:", error);
        return res.status(400).json({
          success: false,
          message:
            "Firebase user not found. Please ensure Firebase account is created first.",
        });
      }
    }

    // Use the actual passed values
    let finalFirstName = firstName;
    let finalLastName = lastName;
    let finalUsername = username || userEmail;

    // Validate required fields
    if (!userEmail || !finalFirstName || !finalLastName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName, email",
      });
    }

    let userRole = "user";
    if (role) {
      const validRoles = ["user", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be 'user' or 'admin' only",
        });
      }
      userRole = role;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: userEmail }, { firebaseUid }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Check if username is taken (only if it's different from email)
    if (finalUsername !== userEmail) {
      const usernameExists = await User.findOne({ username: finalUsername });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
    }

    const user = await User.create({
      email: userEmail,
      firstName: finalFirstName,
      lastName: finalLastName,
      username: finalUsername,
      firebaseUid,
      isVerified: userVerified,
      role: userRole,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: error.message });
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

    const existingUser = await User.findOne({ email });

    res.status(200).json({
      success: true,
      exists: !!existingUser,
      message: existingUser
        ? "Email is already registered"
        : "Email is available",
    });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ success: false, message: error.message });
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

    const firebaseVerified = decodedToken.email_verified || false;

    const user = await User.findOneAndUpdate(
      { firebaseUid: decodedToken.uid },
      { isVerified: firebaseVerified },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: `Verification status updated to ${firebaseVerified}`,
      data: {
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Verify user error:", error);
    res.status(500).json({ success: false, message: error.message });
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

    console.log("Attorney registration received:", { email, username, firstName, lastName });

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
      message: error.message || "Failed to register attorney" 
    });
  }
};

// Get all attorneys (Admin)
export const getAllAttorneys = async (req, res) => {
  try {
    const attorneys = await Attorney.find()
      .select('-__v')
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
      message: error.message || "Failed to retrieve attorneys",
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
      data: attorney,
      message: "Attorney account activated successfully",
    });
  } catch (error) {
    console.error("Activate attorney error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to activate attorney account",
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
      message: error.message || "Failed to verify attorney" 
    });
  }
};
