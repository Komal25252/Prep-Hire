import mongoose, { Schema, models } from "mongoose";

const EmotionReadingSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    questionIndex: { type: Number, required: true },
    timestamp: { type: String, required: true },
    emotion: { type: String, required: true },
    scores: {
      anger: { type: Number, min: 0, max: 100 },
      disgust: { type: Number, min: 0, max: 100 },
      fear: { type: Number, min: 0, max: 100 },
      happy: { type: Number, min: 0, max: 100 },
      neutral: { type: Number, min: 0, max: 100 },
      sadness: { type: Number, min: 0, max: 100 },
      surprise: { type: Number, min: 0, max: 100 },
    },
  },
  { timestamps: true }
);

const EmotionReading = models.EmotionReading || mongoose.model("EmotionReading", EmotionReadingSchema);
export default EmotionReading;
