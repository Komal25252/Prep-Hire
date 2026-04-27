import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import EmotionReading from "@/models/EmotionReading";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, questionIndex, timestamp, emotion, scores } = body;

    // Validate required fields
    if (!sessionId || questionIndex === undefined || !timestamp || !emotion || !scores) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, questionIndex, timestamp, emotion, and scores are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const newReading = await EmotionReading.create(body);

    return NextResponse.json(newReading, { status: 201 });
  } catch (error: any) {
    console.error("Error storing emotion reading:", error);
    return NextResponse.json(
      { error: error.message || "Failed to store emotion reading" },
      { status: 500 }
    );
  }
}
