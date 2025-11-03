import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // uid: { type: String, required: true, unique: true }, 
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  isVerified: {type: Boolean,  default: false},
  role: {type: String,
    enum: ["user", "admin"],
    default: "user"},
  username: { type: String, required: true, unique: true },
  firebaseUid: {type: String, required: true, unique: true},
  createdAt: { type: Date, default: Date.now },

});

const User = mongoose.model("User", userSchema);

export default User;
