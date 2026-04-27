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

    // Session level
    // For session level, we can average the metrics or use all readings
    // Let's use all readings for a global session view
    const globalMetrics = computePerQuestionMetrics(readings);
    
    // Find dominant emotion across all readings
    const emotionCounts: Record<string, number> = {};
    readings.forEach(r => {
      emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
    });
    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b);

    const sessionSummary = classifySession({
      avgVariation: globalMetrics.avgVariation,
      confidenceScore: globalMetrics.confidenceScore,
      fearIncrease: globalMetrics.fearIncrease,
      dominantEmotion,
    });

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
