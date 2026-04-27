import mongoose, { Schema, models } from 'mongoose';

const KeywordsSchema = new Schema(
  {
    must:     { type: [String], default: [] },
    optional: { type: [String], default: [] },
    synonyms: { type: Map, of: [String], default: {} },
  },
  { _id: false }
);

const QuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    domain:   { type: String, required: true, index: true },
    answer:   { type: String, required: true },
    keywords: { type: KeywordsSchema, required: true },
  },
  { timestamps: false }
);

const Question = models.Question || mongoose.model('Question', QuestionSchema);
export default Question;
