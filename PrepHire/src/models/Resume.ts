import mongoose, { Schema, models } from 'mongoose';

const ResumeSchema = new Schema(
  {
    userId: { type: String, index: true }, // Optional if not logged in
    domain: { type: String, required: true },
    rawText: { type: String },
    chunks: { type: [String], default: [] },
    preGeneratedQuestions: {
      type: [{
        question: String,
        type: { type: String, enum: ['technical', 'behavioral', 'project'] },
        difficulty: String
      }],
      default: []
    }
  },
  { timestamps: true }
);

const Resume = models.Resume || mongoose.model('Resume', ResumeSchema);
export default Resume;
