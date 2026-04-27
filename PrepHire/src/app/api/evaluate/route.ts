import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { connectDB } from '@/lib/mongodb';
import { evaluateWithKeywords } from '@/lib/keywordEvaluator';
import mongoose from 'mongoose';
import Resume from '@/models/Resume';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface QAPair {
  question: string;
  answer: string;
  isMock?: boolean;
}

// Keyword-based fallback for mock questions
async function keywordFallbackEval(pairs: QAPair[], domain: string) {
  await connectDB();
  const col = mongoose.connection.collection('questions');

  const perQuestion = await Promise.all(pairs.map(async (pair) => {
    // Find matching question in DB by text similarity (exact or close match)
    const doc = await col.findOne({
      domain: domain.toLowerCase(),
      question: { $regex: (pair.question || "").slice(0, 30), $options: 'i' },
    });

    if (!doc) {
      // No keyword data — return neutral fallback
      return {
        score: 50,
        strength: 'Answer provided.',
        weakness: 'No keyword data available for this question.',
        suggestion: 'Be more specific and use domain terminology.',
      };
    }

    return evaluateWithKeywords(pair.answer, doc.keywords as any);
  }));

  const avgScore = Math.round(perQuestion.reduce((s, q) => s + q.score, 0) / perQuestion.length);
  const rec = avgScore >= 80 ? 'Strong Yes' : avgScore >= 65 ? 'Yes' : avgScore >= 45 ? 'Maybe' : 'No';

  return {
    perQuestion,
    overall: {
      score: avgScore,
      strengths: ['Completed the interview session'],
      improvements: ['Focus on covering core concepts explicitly'],
      recommendation: rec,
      summary: `Keyword-based evaluation. Overall score: ${avgScore}/100. ${rec === 'Strong Yes' || rec === 'Yes' ? 'Good coverage of key concepts.' : 'Review the core concepts for this domain.'}`,
    },
  };
}

export async function POST(req: NextRequest) {
  const { domain, difficulty, interviewType, pairs, resumeId } = await req.json();

  if (!domain || !difficulty || !pairs?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // --- CONTEXT RETRIEVAL (RAG-Lite Optimization) ---
  let contextChunks = "";
  if (resumeId) {
    try {
      await connectDB();
      const resume = await Resume.findById(resumeId);
      if (resume && resume.chunks?.length > 0) {
        // Pick representative chunks: 1st (Intro), Middle (Core Experience), Last (Summary/Skills)
        const selected = Array.from(new Set([
          resume.chunks[0], 
          resume.chunks[Math.floor(resume.chunks.length / 2)],
          resume.chunks[resume.chunks.length - 1]
        ])).filter(Boolean);
        
        contextChunks = `\n\nVerified Candidate Context (Excerpts):\n"""\n${selected.join('\n---\n')}\n"""`;
      }
    } catch (err) {
      console.error('Context retrieval failed:', err);
    }
  }

  // If ALL questions were mock (Gemini was down the whole session), use keyword eval
  const allMock = (pairs as QAPair[]).every((p) => p.isMock);
  if (allMock) {
    try {
      const result = await keywordFallbackEval(pairs, domain);
      return NextResponse.json(result);
    } catch (err) {
      console.error('Keyword eval error:', err);
    }
  }

  if (!process.env.GEMINI_API_KEY) {
    try {
      const result = await keywordFallbackEval(pairs, domain);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: 'No API key configured' }, { status: 500 });
    }
  }

  const type = interviewType === 'dsa' ? 'technical' : 'behavioral';

  const transcript = (pairs as QAPair[]).map((p, i) => {
    const ans = p.answer?.trim()
      ? p.answer.slice(0, 300) + (p.answer.length > 300 ? '...' : '')
      : '(skipped)';
    return `Q${i + 1}: ${p.question}\nA${i + 1}: ${ans}`;
  }).join('\n\n');

  const count = transcript.split('\n\n').length;

  const prompt = `Evaluate a ${difficulty} ${domain} ${type} interview session.${contextChunks}

TRANSCRIPT:
${transcript}

EVALUATION RULES:
1. Score each answer objectively based on domain relevance and context.
2. Provide concise, actionable feedback.
3. Return raw JSON ONLY.

JSON STRUCTURE:
{
  "perQuestion": [
    {"score": 0-100, "strength": "1 sentence", "weakness": "1 sentence", "suggestion": "1 sentence"}
  ],
  "overall": {
    "score": 0-100,
    "strengths": ["point", "point"],
    "improvements": ["point", "point"],
    "recommendation": "Strong Yes|Yes|Maybe|No",
    "summary": "2-3 sentences"
  }
}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON in response');

    const evaluation = JSON.parse(raw.slice(start, end + 1));

    // Ensure perQuestion array matches transcript length
    while (evaluation.perQuestion.length < count) {
      evaluation.perQuestion.push({
        score: 50,
        strength: 'Answer provided.',
        weakness: 'Could not evaluate this answer.',
        suggestion: 'Be more specific and use concrete examples.',
      });
    }

    return NextResponse.json(evaluation);
  } catch (err: any) {
    console.error('Gemini evaluation error:', err?.message ?? err);
    try {
      const result = await keywordFallbackEval(pairs, domain);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
    }
  }
}
