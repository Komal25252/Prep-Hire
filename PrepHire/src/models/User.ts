import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // optional — Google users won't have one
    image: { type: String },
    provider: { type: String, default: "credentials" }, // "google" | "credentials"
  },
  { timestamps: true }
);

const User = models.User || mongoose.model("User", UserSchema);
export default User;
