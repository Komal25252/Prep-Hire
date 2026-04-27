import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Resume from '@/models/Resume';
import { chunkText, preGenerateQuestions } from '@/lib/gemini';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL || 'http://localhost:5000';

  try {
    const flaskForm = new FormData();
    flaskForm.append('file', file);

    const res = await fetch(`${flaskUrl}/predict`, {
      method: 'POST',
      body: flaskForm,
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Flask error: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const { domain, confidence, resumeText } = data;

    // --- RAG-Lite Optimization ---
    await connectDB();
    
    // Chunk for later evaluation retrieval
    const chunks = chunkText(resumeText, 500);
    
    // Pre-generate 10 pool questions to save 10 API calls during session
    const preQuestions = await preGenerateQuestions(domain, resumeText || "");

    const newResume = await Resume.create({
      userId: session?.user?.id || 'anonymous',
      domain,
      rawText: resumeText,
      chunks,
      preGeneratedQuestions: preQuestions,
    });

    return NextResponse.json({
      ...data,
      resumeId: newResume._id.toString()
    });

  } catch (err: any) {
    console.error('Resume processing error:', err);
    // Graceful degradation
    return NextResponse.json({ error: 'AI server unavailable', domain: null }, { status: 503 });
  }
}
