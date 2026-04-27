// test_mongo.ts
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_KEY as string;

async function check() {
  await mongoose.connect(MONGO_URI, { dbName: "PrepHire" });
  const db = mongoose.connection.db;
  if (!db) {
      console.log("No db connection");
      return;
  }
  const collections = await db.collections();
  let found = false;
  for (const c of collections) {
    if (c.collectionName === 'emotionreadings') {
        const count = await c.countDocuments();
        console.log(`emotionreadings count: ${count}`);
        found = true;
    }
  }
  if (!found) {
      console.log("Collection emotionreadings not found");
  }
  process.exit();
}
check();
