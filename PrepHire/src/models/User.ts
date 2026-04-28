import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // optional — Google users won't have one
    image: { type: String },
    provider: { type: String, default: "credentials" }, // "google" | "credentials"
    // Profile Fields
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    targetRole: { type: String, default: "" },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
      resourceSharing: { type: Boolean, default: true },
    }
  },
  { timestamps: true }
);

const User = models.User || mongoose.model("User", UserSchema);
export default User;
