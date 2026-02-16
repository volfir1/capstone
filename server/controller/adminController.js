import User from '../models/user.js';
import Attorney from '../models/attorney.js';
import admin from 'firebase-admin';

// Update admin profile (name, etc.)
export const updateAdminProfile = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const idToken = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Only allow admin roles
    let adminUser = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!adminUser) {
      adminUser = await Attorney.findOne({ firebaseUid: decodedToken.uid });
    }
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Admin user not found' });
    }
    // You can add more role checks here if needed

    const { firstName, lastName, username } = req.body;
    if (!firstName && !lastName && !username) {
      return res.status(400).json({ success: false, message: 'No profile fields provided' });
    }

    // Update fields if provided
    if (firstName) adminUser.firstName = firstName;
    if (lastName) adminUser.lastName = lastName;
    if (username) adminUser.username = username;
    await adminUser.save();

    res.json({
      success: true,
      data: {
        id: adminUser._id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        username: adminUser.username,
        role: adminUser.role,
        profileImage: adminUser.profileImage || '',
      },
      message: 'Admin profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
