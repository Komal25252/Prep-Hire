const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_KEY;

async function check() {
  await mongoose.connect(MONGO_URI, { dbName: "PrepHire" });
  const db = mongoose.connection.db;
  if (!db) {
      console.log("No db connection");
      return;
  }
  const collections = await db.collections();
  for (const c of collections) {
    if (c.collectionName === 'emotionreadings') {
        const docs = await c.find({}).toArray();
        const ids = [...new Set(docs.map(d => d.sessionId))];
        console.log(`Unique session IDs in emotionreadings: ${ids}`);
        await c.deleteMany({ sessionId: "test-session-123" });
    }
  }
  process.exit();
}
check();
