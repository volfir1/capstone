import User from "../models/user.js";
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
