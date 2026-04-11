import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MOCK_QUESTIONS: Record<string, string[]> = {
  // default: [
  //   "Tell me about yourself and your background.",
  //   "What is your greatest technical strength?",
  //   "Describe a challenging project you worked on.",
  //   "How do you handle tight deadlines?",
  //   "Where do you see yourself in 5 years?",
  // ],
};

export async function POST(req: NextRequest) {
  const { domain, difficulty, count = 5, interviewType } = await req.json();

  if (!domain || !difficulty) {
    return NextResponse.json({ error: 'Missing domain or difficulty' }, { status: 400 });
  }

  // Use mock questions if no API key or in dev without quota
  if (process.env.USE_MOCK_QUESTIONS === 'true') {
    const base = MOCK_QUESTIONS[domain] ?? MOCK_QUESTIONS.default;
    const questions = Array.from({ length: count }, (_, i) => base[i % base.length]);
    return NextResponse.json({ questions });
  }

  if (!process.env.GEMINI_API_KEY) {
    const questions = MOCK_QUESTIONS[domain] ?? MOCK_QUESTIONS.default;
    return NextResponse.json({ questions });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const typeContext = interviewType === 'dsa'
      ? 'Focus on data structures, algorithms, time/space complexity, and coding problem-solving.'
      : 'Focus on behavioral, situational, and communication-based questions using the STAR method.';

    const prompt = `Generate exactly ${count} interview questions for a ${difficulty} level ${domain} role.
${typeContext}
Return ONLY a JSON array of ${count} strings, no explanation, no numbering, no markdown. Example format:
["Question 1?","Question 2?","Question 3?","Question 4?","Question 5?"]`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    // Extract JSON array robustly — find first [ and last ]
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No JSON array found in response');
    const cleaned = raw
      .slice(start, end + 1)
      .replace(/[\u2018\u2019]/g, "'")   // smart single quotes → straight
      .replace(/[\u201C\u201D]/g, '"');  // smart double quotes → straight

    const questions: string[] = JSON.parse(cleaned);
    return NextResponse.json({ questions });
  } catch (err: any) {
    // Fall back to mock questions on quota errors
    if (err?.message?.includes('429')) {
      console.warn('Gemini quota exceeded, falling back to mock questions');
      const base = MOCK_QUESTIONS[domain] ?? MOCK_QUESTIONS.default;
      const questions = Array.from({ length: count }, (_, i) => base[i % base.length]);
      return NextResponse.json({ questions });
    }
    console.error('Gemini error:', err);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}
