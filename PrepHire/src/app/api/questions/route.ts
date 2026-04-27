import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Resume from '@/models/Resume';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Domain ID → MongoDB domain field mapping
const DOMAIN_ID_MAP: Record<string, string> = {
  'frontend':    'frontend',
  'backend':     'backend',
  'fullstack':   'fullstack',
  'data_science':'data_science',
  'devops':      'devops',
  'product':     'product',
  'design':      'design',
  'qa':          'qa',
};

async function getRandomMockQuestion(domain: string): Promise<string> {
  try {
    await connectDB();
    const col = mongoose.connection.collection('questions');
    const dbDomain = DOMAIN_ID_MAP[domain] ?? domain;

    // Get a random question for this domain
    const docs = await col.find({ domain: dbDomain }).toArray();
    if (docs.length > 0) {
      const random = docs[Math.floor(Math.random() * docs.length)];
      return random.question as string;
    }
  } catch (err) {
    console.warn('MongoDB fallback failed, using generic question:', err);
  }
  // Last resort generic fallback
  return 'Tell me about yourself and your experience in this field.';
}

interface HistoryEntry {
  question: string;
  answer: string;
}

export async function POST(req: NextRequest) {
  const { domain, difficulty, interviewType, history = [], questionNumber = 1, resumeText, resumeId } = await req.json();

  if (!domain || !difficulty) {
    return NextResponse.json({ error: 'Missing domain or difficulty' }, { status: 400 });
  }

  // --- PRE-GENERATED POOL LOGIC (Optimization) ---
  if (resumeId) {
    try {
      await connectDB();
      const resume = await Resume.findById(resumeId);
      if (resume && resume.preGeneratedQuestions?.length > 0) {
        // Use questionNumber (1-indexed) to pick from the pool
        const poolIndex = (questionNumber - 1) % resume.preGeneratedQuestions.length;
        const selected = resume.preGeneratedQuestions[poolIndex];
        return NextResponse.json({ 
          question: selected.question, 
          isMock: false,
          isPreGenerated: true,
          type: selected.type
        });
      }
    } catch (err) {
      console.error('Failed to fetch pre-generated question:', err);
    }
  }

  // No API key — use MongoDB questions directly
  if (process.env.USE_MOCK_QUESTIONS === 'true' || !process.env.GEMINI_API_KEY) {
    const q = await getRandomMockQuestion(domain);
    return NextResponse.json({ question: q, isMock: true });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const typeContext = interviewType === 'dsa'
      ? 'Technical interview: DSA, algorithms, system design.'
      : 'Behavioral interview: STAR method, situational judgment.';

    const isFirstQuestion = (history as HistoryEntry[]).length === 0;
    const lastExchange = !isFirstQuestion
      ? (history as HistoryEntry[])[(history as HistoryEntry[]).length - 1]
      : null;

    const resumeContext = resumeText
      ? `\n\nCandidate's resume excerpt:\n"""\n${resumeText.slice(0, 2000)}\n"""\nPersonalize your questions based on the specific skills, projects, and experience mentioned.`
      : '';

    const prompt = isFirstQuestion
      ? `You are interviewing a candidate for a ${difficulty}-level ${domain} role. ${typeContext}${resumeContext}
Ask the opening interview question. Return ONLY the question, nothing else.`
      : `You are interviewing a candidate for a ${difficulty}-level ${domain} role. ${typeContext}${resumeContext}

Last exchange:
Q: ${lastExchange!.question}
A: ${lastExchange!.answer || '(no answer)'}

Ask question ${questionNumber} as a follow-up. Pick one specific thing from their answer and probe deeper. If they skipped, ask a fresh relevant question based on their resume.
Return ONLY the question, nothing else.`;

    const result = await model.generateContent(prompt);
    const question = result.response.text()
      .trim()
      .replace(/^(Question\s*\d*[:.]?\s*|Interviewer:\s*|Q:\s*)/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();
    return NextResponse.json({ question, isMock: false });
  } catch (err: any) {
    const status = String(err?.status ?? err?.message ?? '');
    if (status.includes('429') || status.includes('503') || status.includes('404')) {
      console.warn('Gemini unavailable, falling back to MongoDB question');
      const q = await getRandomMockQuestion(domain);
      return NextResponse.json({ question: q, isMock: true });
    }
    console.error('Gemini error:', err);
    return NextResponse.json({ error: 'Failed to generate question' }, { status: 500 });
  }
}
