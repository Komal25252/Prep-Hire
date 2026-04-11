import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_KEY as string;

if (!MONGO_URI) throw new Error("MONGO_KEY is not defined in .env");

// Cache connection across hot reloads in dev
let cached = (global as any).mongoose || { conn: null, promise: null };
(global as any).mongoose = cached;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, { dbName: "PrepHire" });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
