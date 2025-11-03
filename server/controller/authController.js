import User from "../models/user.js";
import admin from "firebase-admin";

export const register = async (req, res) => {
  try {
    const { idToken, firstName, lastName, username, email, isVerified, role } = req.body;
    
    // Log what server receives
    console.log('Server received:', { firstName, lastName, username });
    
    let userEmail, firebaseUid;
    let userVerified = false;
    
    // verify firebase token
    if (idToken) {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      userEmail = decodedToken.email;
      firebaseUid = decodedToken.uid;
      userVerified = decodedToken.email_verified || false;
    } else {
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required when no idToken Provided",
        });
      }
      userEmail = email;
      firebaseUid = "test-uid-" + Date.now();
      userVerified = isVerified || false;
    }

    // DON'T use defaults - use the actual passed values
    let finalFirstName = firstName;     // ✅ No fallback to "Google"
    let finalLastName = lastName;       // ✅ No fallback to "User"
    let finalUsername = username || userEmail;

    // Validate required fields
    if (!userEmail || !finalFirstName || !finalLastName || !finalUsername) {
      return res.status(400).json({
        success: false, 
        message: "Missing required fields: firstName, lastName, username"
      });
    }

    let userRole = "user";
    if (role) {
      const validRoles = ["user", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "invalid role. must be user or admin only",
        });
      }
      userRole = role;
    }

    const existingUser = await User.findOne({
      $or: [{ email: userEmail }, { username: finalUsername }],
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "User already exist" 
      });
    }

    const user = await User.create({
      email: userEmail,
      firstName: finalFirstName,   // Will be "Lester" not "Google"
      lastName: finalLastName,     // Will be "Sible" not "User"
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
        createdAt: user.createdAt
      },
      message: "User registered successfully"
    });
    
  } catch (error) {
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
                message: 'Email is required'
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(200).json({
                success: true,
                exists: true,
                message: 'Email is already registered'
            });
        }

        res.status(200).json({
            success: true,
            exists: false,
            message: 'Email is available'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// server/controller/userController.js
export const verifyUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({success: false, message: 'No token provided'})
        }

        const idToken = authHeader.split(' ')[1]
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        const firebaseVerified = decodedToken.email_verified || false

        const user = await User.findOneAndUpdate(
            { firebaseUid: decodedToken.uid },
            { isVerified: firebaseVerified },
            { new: true }
        )

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found'})
        }

        res.json({
            success: true,
            message: `Verification status updated to ${firebaseVerified}`,
            data: {
                isVerified: user.isVerified
            }
        })

    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}