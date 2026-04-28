import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import EmotionReading from "@/models/EmotionReading";
import { 
  computePerQuestionMetrics, 
  classifySession, 
  EmotionReadingDoc 
} from "@/lib/emotionAnalysis";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    await connectDB();
    const readings = (await EmotionReading.find({ sessionId }).sort({ createdAt: 1 })) as any as EmotionReadingDoc[];

    if (readings.length === 0) {
      return NextResponse.json({ perQuestion: [], session: null });
    }

    // Group by questionIndex
    const groups: Record<number, EmotionReadingDoc[]> = {};
    readings.forEach((r) => {
      if (!groups[r.questionIndex]) groups[r.questionIndex] = [];
      groups[r.questionIndex].push(r);
    });

    const perQuestion = Object.keys(groups)
      .map(Number)
      .sort((a, b) => a - b)
      .map((idx) => computePerQuestionMetrics(groups[idx]));

    // Session level - Advanced Temporal Behavioral Analysis
    const sessionSummary = classifySession(readings);

    const timeline = readings.map(r => ({
      timestamp: r.timestamp,
      fear: r.scores.fear,
      happy: r.scores.happy,
      neutral: r.scores.neutral,
      surprise: r.scores.surprise,
      anger: r.scores.anger,
      disgust: r.scores.disgust,
      sadness: r.scores.sadness,
    }));

    return NextResponse.json({
      perQuestion,
      session: sessionSummary,
      timeline,
    });
  } catch (error: any) {
    console.error("Error analyzing emotions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze emotions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { frame } = await req.json();
    const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL || "http://localhost:5000";
    
    const flaskRes = await fetch(`${flaskUrl}/analyze-emotion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frame }),
    });

    const data = await flaskRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Emotion proxy error:", error);
    return NextResponse.json({ error: "Flask server unreachable" }, { status: 500 });
  }
}
