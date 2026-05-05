import mongoose from "mongoose";
import admin from "firebase-admin";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import User from "../models/user.js";
import Account from "../models/account.js";
import {
  STAFF_ROLES,
  assertUniqueStaffProfile,
  createStaffProfileForAccount,
  listProfilesForAccount,
  normalizeOptionalDate,
  serializeProfile,
  updateLastSelectedProfile,
} from "../utils/accountContext.js";
import {
  PROFILE_PIN_LOCK_MINUTES,
  PROFILE_PIN_MAX_ATTEMPTS,
  createProfilePinSessionToken,
  describeProfilePinState,
  getRequestedProfilePinToken,
  hashProfilePin,
  validateProfilePin,
  verifyProfilePinHash,
} from "../utils/profilePin.js";
import { safeErrorMessage } from "../utils/errorResponse.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __userCtrlFilename = fileURLToPath(import.meta.url);
const __userCtrlDirname = path.dirname(__userCtrlFilename);

const profileImagesDir = path.join(__userCtrlDirname, "../uploads/profile-images/");
if (!fs.existsSync(profileImagesDir)) {
  fs.mkdirSync(profileImagesDir, { recursive: true });
}

const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileImagesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const profileKey = req.activeProfile?._id?.toString?.() || req.user?._id?.toString?.() || req.user?.uid || Date.now();
    cb(null, `${profileKey}${ext}`);
  },
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WebP, and GIF images are allowed"), false);
  },
});

const ADMIN_ROLES = new Set(STAFF_ROLES);
const PROFILE_MANAGER_ROLES = new Set(["secretary", "director"]);

const requireAccount = (req, res) => {
  if (req.account) {
    return req.account;
  }

  res.status(401).json({ success: false, message: "Unauthorized" });
  return null;
};

const requireActiveProfile = (req, res, { allowDisabled = false } = {}) => {
  if (!req.activeProfile) {
    res.status(409).json({
      success: false,
      code: "profile-selection-required",
      message: "Select or create a staff profile first.",
    });
    return null;
  }

  if (!allowDisabled && req.activeProfile.disabled) {
    res.status(403).json({
      success: false,
      message: "This staff profile is disabled.",
    });
    return null;
  }

  return req.activeProfile;
};

const requireAdminProfile = (req, res) => {
  const profile = requireActiveProfile(req, res);
  if (!profile) {
    return null;
  }

  if (!ADMIN_ROLES.has(profile.role)) {
    res.status(403).json({
      success: false,
      message: "Forbidden: You do not have permission to perform this action",
    });
    return null;
  }

  return profile;
};

const requireProfileManager = (req, res) => {
  const profile = requireActiveProfile(req, res);
  if (!profile) {
    return null;
  }

  if (!PROFILE_MANAGER_ROLES.has(profile.role)) {
    res.status(403).json({
      success: false,
      message: "Only secretaries and directors can manage profiles.",
    });
    return null;
  }

  return profile;
};

const MANAGED_PROFILE_FIELDS =
  "accountId email firstName lastName username role isVerified createdAt startDate endDate archivedAt archivedByProfileId restoredAt restoredByProfileId profileImage signatureUrl disabled";
const PIN_PROFILE_FIELDS =
  `${MANAGED_PROFILE_FIELDS} pinEnabled pinResetRequired pinFailedAttempts pinLockedUntil pinLastChangedAt`;

const findProfileInAccount = async (accountId, profileId, select = MANAGED_PROFILE_FIELDS) => {
  if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
    return null;
  }

  return User.findOne({ _id: profileId, accountId }).select(select);
};

const normalizeProfileText = (value) => String(value || "").trim();
const hasBodyField = (body, field) => Object.prototype.hasOwnProperty.call(body || {}, field);
const describeCurrentProfilePinState = (accountId, profile, req) =>
  describeProfilePinState({
    accountId,
    profile,
    token: getRequestedProfilePinToken(req),
  });

const applyTenureDateUpdates = (profile, body) => {
  if (hasBodyField(body, "startDate")) {
    profile.startDate = normalizeOptionalDate(body.startDate, "Start Date");
  }

  if (hasBodyField(body, "endDate")) {
    profile.endDate = normalizeOptionalDate(body.endDate, "End Date");
  }

  if (
    profile.startDate &&
    profile.endDate &&
    profile.startDate.getTime() > profile.endDate.getTime()
  ) {
    throw new Error("Start Date cannot be after End Date");
  }
};

const findPinProfileInAccount = async (accountId, profileId) => {
  if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
    return null;
  }

  return User.findOne({ _id: profileId, accountId }).select(`+pinHash ${PIN_PROFILE_FIELDS}`);
};

export const profileImageMiddleware = profileImageUpload.single("image");

export const getProfiles = async (req, res) => {
  try {
    const account = requireAccount(req, res);
    if (!account) return;

    const profiles = await listProfilesForAccount(account._id, {
      includeDisabled: true,
      includeArchived: false,
    });
    res.json({
      success: true,
      data: profiles.map((profile) => serializeProfile(profile, account)),
    });
  } catch (error) {
    console.error("Get profiles error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const createProfile = async (req, res) => {
  try {
    const managerProfile = requireProfileManager(req, res);
    if (!managerProfile) return;

    const account = requireAccount(req, res);
    if (!account) return;

    const profile = await createStaffProfileForAccount(account, req.body || {});

    res.status(201).json({
      success: true,
      data: serializeProfile(profile, account),
      message: "Staff profile created successfully",
    });
  } catch (error) {
    console.error("Create profile error:", error);
    const errorMessage = String(error.message || "");
    const status =
      errorMessage.includes("required") ||
      errorMessage.includes("Role must") ||
      errorMessage.includes("already exists") ||
      errorMessage.includes("Date")
        ? 400
        : 500;
    res.status(status).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const getProfilePinStatus = async (req, res) => {
  try {
    const account = requireAccount(req, res);
    if (!account) return;

    const profile = requireActiveProfile(req, res);
    if (!profile) return;

    const currentState = describeCurrentProfilePinState(account._id, profile, req);

    res.json({
      success: true,
      data: {
        profileId: profile._id.toString(),
        ...currentState,
      },
    });
  } catch (error) {
    console.error("Get profile PIN status error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const setupProfilePin = async (req, res) => {
  try {
    const account = requireAccount(req, res);
    if (!account) return;

    const activeProfile = requireActiveProfile(req, res);
    if (!activeProfile) return;

    const profile = await findPinProfileInAccount(account._id, activeProfile._id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    if (profile.disabled) {
      return res.status(403).json({ success: false, message: "This staff profile is disabled." });
    }

    if (profile.pinEnabled && !profile.pinResetRequired) {
      return res.status(400).json({
        success: false,
        code: "profile-pin-already-set",
        message: "This profile already has a PIN.",
      });
    }

    const normalizedPin = validateProfilePin(req.body?.pin);
    profile.pinHash = hashProfilePin(normalizedPin);
    profile.pinEnabled = true;
    profile.pinResetRequired = false;
    profile.pinFailedAttempts = 0;
    profile.pinLockedUntil = null;
    profile.pinLastChangedAt = new Date();
    await profile.save();

    await updateLastSelectedProfile(account._id, profile._id);

    const pinToken = createProfilePinSessionToken({ accountId: account._id, profile });
    const pinState = describeProfilePinState({
      accountId: account._id,
      profile,
      token: pinToken,
    });

    res.json({
      success: true,
      data: {
        profile: serializeProfile(profile, account),
        pinToken,
        ...pinState,
      },
      message: "Profile PIN created successfully",
    });
  } catch (error) {
    console.error("Setup profile PIN error:", error);
    const status = String(error.message || "").includes("PIN must be") ? 400 : 500;
    res.status(status).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const verifyProfilePin = async (req, res) => {
  try {
    const account = requireAccount(req, res);
    if (!account) return;

    const activeProfile = requireActiveProfile(req, res);
    if (!activeProfile) return;

    const profile = await findPinProfileInAccount(account._id, activeProfile._id);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    if (profile.disabled) {
      return res.status(403).json({ success: false, message: "This staff profile is disabled." });
    }

    if (!profile.pinEnabled || !profile.pinLastChangedAt || !profile.pinHash) {
      return res.status(428).json({
        success: false,
        code: "profile-pin-setup-required",
        message: "Set a PIN for this profile first.",
        data: {
          profileId: profile._id.toString(),
          ...describeProfilePinState({ accountId: account._id, profile, token: "" }),
        },
      });
    }

    const normalizedPin = validateProfilePin(req.body?.pin);
    const now = Date.now();

    if (profile.pinLockedUntil && new Date(profile.pinLockedUntil).getTime() > now) {
      return res.status(423).json({
        success: false,
        code: "profile-pin-locked",
        message: "This profile PIN is temporarily locked after too many failed attempts.",
        data: {
          profileId: profile._id.toString(),
          ...describeProfilePinState({ accountId: account._id, profile, token: "" }),
        },
      });
    }

    if (profile.pinLockedUntil && new Date(profile.pinLockedUntil).getTime() <= now) {
      profile.pinFailedAttempts = 0;
      profile.pinLockedUntil = null;
    }

    if (!verifyProfilePinHash(normalizedPin, profile.pinHash)) {
      const failedAttempts = Number(profile.pinFailedAttempts || 0) + 1;
      profile.pinFailedAttempts = failedAttempts;

      if (failedAttempts >= PROFILE_PIN_MAX_ATTEMPTS) {
        profile.pinLockedUntil = new Date(now + PROFILE_PIN_LOCK_MINUTES * 60 * 1000);
      }

      await profile.save();

      const pinState = describeProfilePinState({ accountId: account._id, profile, token: "" });
      return res.status(pinState.isLocked ? 423 : 401).json({
        success: false,
        code: pinState.isLocked ? "profile-pin-locked" : "invalid-profile-pin",
        message: pinState.isLocked
          ? "Too many incorrect PIN attempts. This profile is temporarily locked."
          : "Incorrect PIN. Please try again.",
        data: {
          profileId: profile._id.toString(),
          ...pinState,
        },
      });
    }

    profile.pinFailedAttempts = 0;
    profile.pinLockedUntil = null;
    await profile.save();

    await updateLastSelectedProfile(account._id, profile._id);

    const pinToken = createProfilePinSessionToken({ accountId: account._id, profile });
    const pinState = describeProfilePinState({
      accountId: account._id,
      profile,
      token: pinToken,
    });

    res.json({
      success: true,
      data: {
        profile: serializeProfile(profile, account),
        pinToken,
        ...pinState,
      },
      message: "Profile PIN verified successfully",
    });
  } catch (error) {
    console.error("Verify profile PIN error:", error);
    const status = String(error.message || "").includes("PIN must be") ? 400 : 500;
    res.status(status).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const getProfile = async (req, res) => {
  try {
    const account = requireAccount(req, res);
    if (!account) return;

    const profile = requireActiveProfile(req, res);
    if (!profile) return;

    await updateLastSelectedProfile(account._id, profile._id);

    res.json({
      success: true,
      data: serializeProfile(profile, account),
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const account = requireAccount(req, res);
    if (!account) return;

    const profile = requireActiveProfile(req, res);
    if (!profile) return;

    const allowedFields = ["firstName", "lastName"];
    for (const field of allowedFields) {
      if (req.body?.[field] !== undefined) {
        profile[field] = String(req.body[field] || "").trim();
      }
    }

    await profile.save();

    res.json({
      success: true,
      data: serializeProfile(profile, account),
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const fetchUsers = async (req, res) => {
  try {
    const adminProfile = requireAdminProfile(req, res);
    if (!adminProfile) return;

    const account = requireAccount(req, res);
    if (!account) return;

    const users = await User.find(
      { accountId: account._id, role: { $in: STAFF_ROLES }, archivedAt: null },
      MANAGED_PROFILE_FIELDS
    )
      .sort({ role: 1, firstName: 1, lastName: 1 })
      .lean();

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const updateManagedProfile = async (req, res) => {
  try {
    const managerProfile = requireProfileManager(req, res);
    if (!managerProfile) return;

    const account = requireAccount(req, res);
    if (!account) return;

    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid profile id" });
    }

    const managedProfile = await findProfileInAccount(account._id, userId);

    if (!managedProfile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const firstName = normalizeProfileText(req.body?.firstName ?? managedProfile.firstName);
    const lastName = normalizeProfileText(req.body?.lastName ?? managedProfile.lastName);
    const role = normalizeProfileText(req.body?.role ?? managedProfile.role).toLowerCase();

    if (!firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: "firstName, lastName, and role are required",
      });
    }

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${STAFF_ROLES.join(", ")}.`,
      });
    }

    await assertUniqueStaffProfile(
      account._id,
      { firstName, lastName, role },
      managedProfile._id
    );

    managedProfile.firstName = firstName;
    managedProfile.lastName = lastName;
    managedProfile.role = role;
    applyTenureDateUpdates(managedProfile, req.body || {});
    await managedProfile.save();

    const refreshedProfile = await findProfileInAccount(account._id, managedProfile._id);

    res.json({
      success: true,
      data: refreshedProfile,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update managed profile error:", error);
    const status =
      String(error.message || "").includes("already exists") ||
      String(error.message || "").includes("required") ||
      String(error.message || "").includes("Invalid role") ||
      String(error.message || "").includes("Date")
        ? 400
        : 500;
    res.status(status).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const managerProfile = requireProfileManager(req, res);
    if (!managerProfile) return;

    const account = requireAccount(req, res);
    if (!account) return;

    const { userId } = req.params;
    const { role } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid profile id" });
    }

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${STAFF_ROLES.join(", ")}.`,
      });
    }

    const targetProfile = await findProfileInAccount(account._id, userId);
    if (!targetProfile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    await assertUniqueStaffProfile(
      account._id,
      {
        firstName: targetProfile.firstName,
        lastName: targetProfile.lastName,
        role,
      },
      targetProfile._id
    );

    targetProfile.role = role;
    await targetProfile.save();

    const updatedUser = await findProfileInAccount(account._id, targetProfile._id);

    res.json({
      success: true,
      data: updatedUser,
      message: "Profile role updated successfully",
    });
  } catch (error) {
    console.error("Update user role error:", error);
    const status = String(error.message || "").includes("already exists") ? 400 : 500;
    res.status(status).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const managerProfile = requireProfileManager(req, res);
    if (!managerProfile) return;

    const account = requireAccount(req, res);
    if (!account) return;

    const { userId } = req.params;
    const { disabled } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid profile id" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, accountId: account._id },
      { disabled: disabled === true },
      {
        new: true,
        select: MANAGED_PROFILE_FIELDS,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.json({
      success: true,
      data: updatedUser,
      message: `Profile ${disabled ? "disabled" : "enabled"} successfully`,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const resetManagedProfilePin = async (req, res) => {
  try {
    const managerProfile = requireProfileManager(req, res);
    if (!managerProfile) return;

    const account = requireAccount(req, res);
    if (!account) return;

    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid profile id" });
    }

    const targetProfile = await findPinProfileInAccount(account._id, userId);
    if (!targetProfile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    targetProfile.pinEnabled = false;
    targetProfile.pinHash = "";
    targetProfile.pinResetRequired = true;
    targetProfile.pinFailedAttempts = 0;
    targetProfile.pinLockedUntil = null;
    targetProfile.pinLastChangedAt = null;
    await targetProfile.save();

    res.json({
      success: true,
      data: serializeProfile(targetProfile, account),
      message: "Profile PIN reset successfully",
    });
  } catch (error) {
    console.error("Reset managed profile PIN error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const getProfileHistory = async (req, res) => {
  try {
    const adminProfile = requireAdminProfile(req, res);
    if (!adminProfile) return;

    const account = requireAccount(req, res);
    if (!account) return;

    const roleFilter = PROFILE_MANAGER_ROLES.has(adminProfile.role)
      ? { $in: STAFF_ROLES }
      : adminProfile.role;

    const profiles = await User.find(
      { accountId: account._id, role: roleFilter },
      MANAGED_PROFILE_FIELDS
    )
      .sort({ role: 1, archivedAt: 1, startDate: 1, firstName: 1, lastName: 1 })
      .lean();

    res.json({
      success: true,
      count: profiles.length,
      data: profiles.map((profile) => serializeProfile(profile, account)),
    });
  } catch (error) {
    console.error("Get profile history error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const deleteManagedProfile = async (req, res) => {
  try {
    const managerProfile = requireProfileManager(req, res);
    if (!managerProfile) return;

    const account = requireAccount(req, res);
    if (!account) return;

    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid profile id" });
    }

    const profileToArchive = await User.findOne({
      _id: userId,
      accountId: account._id,
      role: { $in: STAFF_ROLES },
      archivedAt: null,
    }).select(MANAGED_PROFILE_FIELDS);

    if (!profileToArchive) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const fallbackEndDate = profileToArchive.endDate || new Date();
    const archivedEndDate = normalizeOptionalDate(
      req.body?.endDate ?? fallbackEndDate,
      "End Date"
    );

    if (!archivedEndDate) {
      return res.status(400).json({
        success: false,
        message: "End Date is required before archiving a profile",
      });
    }

    if (
      profileToArchive.startDate &&
      profileToArchive.startDate.getTime() > archivedEndDate.getTime()
    ) {
      return res.status(400).json({
        success: false,
        message: "End Date cannot be before Start Date",
      });
    }

    profileToArchive.endDate = archivedEndDate;
    profileToArchive.archivedAt = new Date();
    profileToArchive.archivedByProfileId = managerProfile._id;
    profileToArchive.disabled = true;
    await profileToArchive.save();

    if (account.lastSelectedProfileId?.toString?.() === profileToArchive._id.toString()) {
      await Account.findByIdAndUpdate(account._id, {
        lastSelectedProfileId: null,
      });
    }

    res.json({
      success: true,
      data: serializeProfile(profileToArchive, account),
      message: "Profile archived successfully",
    });
  } catch (error) {
    console.error("Archive managed profile error:", error);
    const status = String(error.message || "").includes("Date") ? 400 : 500;
    res.status(status).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const restoreManagedProfile = async (req, res) => {
  try {
    const managerProfile = requireProfileManager(req, res);
    if (!managerProfile) return;

    const account = requireAccount(req, res);
    if (!account) return;

    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid profile id" });
    }

    const archivedProfile = await User.findOne({
      _id: userId,
      accountId: account._id,
      role: { $in: STAFF_ROLES },
      archivedAt: { $ne: null },
    }).select(MANAGED_PROFILE_FIELDS);

    if (!archivedProfile) {
      return res.status(404).json({ success: false, message: "Archived profile not found" });
    }

    await assertUniqueStaffProfile(
      account._id,
      {
        firstName: archivedProfile.firstName,
        lastName: archivedProfile.lastName,
        role: archivedProfile.role,
      },
      archivedProfile._id
    );

    archivedProfile.archivedAt = null;
    archivedProfile.archivedByProfileId = null;
    archivedProfile.restoredAt = new Date();
    archivedProfile.restoredByProfileId = managerProfile._id;
    archivedProfile.endDate = null;
    archivedProfile.disabled = false;
    await archivedProfile.save();

    res.json({
      success: true,
      data: serializeProfile(archivedProfile, account),
      message: "Profile restored successfully",
    });
  } catch (error) {
    console.error("Restore managed profile error:", error);
    const status = String(error.message || "").includes("already exists") ? 400 : 500;
    res.status(status).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const sendPasswordResetEmail = async (req, res) => {
  try {
    const managerProfile = requireProfileManager(req, res);
    if (!managerProfile) return;

    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    await admin.auth().generatePasswordResetLink(email);

    try {
      const firebaseApiKey = process.env.FIREBASE_WEB_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
      if (firebaseApiKey) {
        await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
        });
      }
    } catch (emailErr) {
      console.warn("REST password reset email fallback failed:", emailErr.message);
    }

    res.json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Send password reset error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    const profile = requireActiveProfile(req, res);
    if (!profile) return;

    const { profileImage } = req.body || {};
    if (!profileImage || typeof profileImage !== "string") {
      return res.status(400).json({ success: false, message: "profileImage URL is required" });
    }

    profile.profileImage = profileImage;
    await profile.save();

    res.json({
      success: true,
      data: { profileImage: profile.profileImage },
      message: "Profile image updated successfully",
    });
  } catch (error) {
    console.error("Update profile image error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const uploadProfileImageFile = async (req, res) => {
  try {
    const profile = requireActiveProfile(req, res);
    if (!profile) return;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const encodedFilename = encodeURIComponent(req.file.filename);
    const imageUrl = `/uploads/profile-images/${encodedFilename}`;

    profile.profileImage = imageUrl;
    await profile.save();

    res.json({
      success: true,
      data: { profileImage: imageUrl },
      message: "Profile image uploaded successfully",
    });
  } catch (error) {
    console.error("Upload profile image file error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const updateSignature = async (req, res) => {
  try {
    const profile = requireActiveProfile(req, res);
    if (!profile) return;

    const { signatureUrl } = req.body || {};
    if (!signatureUrl || typeof signatureUrl !== "string") {
      return res.status(400).json({ success: false, message: "signatureUrl is required" });
    }

    profile.signatureUrl = signatureUrl;
    await profile.save();

    res.json({
      success: true,
      data: { signatureUrl: profile.signatureUrl },
      message: "Signature updated successfully",
    });
  } catch (error) {
    console.error("Update signature error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const uploadSignature = async (req, res) => {
  try {
    const account = requireAccount(req, res);
    if (!account) return;

    const profile = requireActiveProfile(req, res);
    if (!profile) return;

    const { dataUrl } = req.body || {};
    if (!dataUrl || typeof dataUrl !== "string") {
      return res.status(400).json({ success: false, message: "dataUrl (base64) is required" });
    }

    const folder = `signatures/${account._id.toString()}/${profile._id.toString()}`;
    const uploadResult = await cloudinary.uploader.upload(dataUrl, {
      folder,
      public_id: "signature",
      overwrite: true,
      resource_type: "image",
      format: "png",
    });

    profile.signatureUrl = uploadResult.secure_url;
    await profile.save();

    res.json({
      success: true,
      data: { signatureUrl: profile.signatureUrl },
      message: "Signature uploaded and saved.",
    });
  } catch (error) {
    console.error("Upload signature error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const getUserById = async (req, res) => {
  try {
    const account = requireAccount(req, res);
    if (!account) return;

    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const user = await User.findOne({ _id: userId, accountId: account._id }).lean();
    if (!user) {
      return res.json({ success: true, data: null });
    }

    const userAccount = user.accountId ? await Account.findById(user.accountId).lean() : null;

    res.json({
      success: true,
      data: serializeProfile(user, userAccount),
    });
  } catch (error) {
    console.error("Get user by id error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const registerPushToken = async (req, res) => {
  try {
    const account = requireAccount(req, res);
    if (!account) return;

    const token = String(req.body?.token || "").trim();
    if (!token) {
      return res.status(400).json({ success: false, message: "Push token is required" });
    }

    await Account.updateOne({ _id: account._id }, { $addToSet: { pushTokens: token } });

    res.json({ success: true, message: "Push token registered" });
  } catch (error) {
    console.error("Register push token error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};

export const unregisterPushToken = async (req, res) => {
  try {
    const account = requireAccount(req, res);
    if (!account) return;

    const token = String(req.body?.token || req.query?.token || req.get("x-push-token") || "").trim();
    if (!token) {
      return res.json({ success: true, message: "No push token provided; nothing to remove" });
    }

    await Account.updateOne({ _id: account._id }, { $pull: { pushTokens: token } });

    res.json({ success: true, message: "Push token removed" });
  } catch (error) {
    console.error("Unregister push token error:", error);
    res.status(500).json({ success: false, message: safeErrorMessage(error) });
  }
};
