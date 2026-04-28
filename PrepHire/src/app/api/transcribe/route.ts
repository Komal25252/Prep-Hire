import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log(">>> Transcription Proxy: Request received");
    const formData = await req.formData();
    const file = formData.get('file');
    console.log(">>> Transcription Proxy: File type:", (file as any)?.type, "Size:", (file as any)?.size);

    const flaskUrl = process.env.NEXT_PUBLIC_FLASK_URL || "http://localhost:5000";
    console.log(">>> Transcription Proxy: Forwarding to:", `${flaskUrl}/transcribe`);

    const flaskRes = await fetch(`${flaskUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!flaskRes.ok) {
      const errorText = await flaskRes.text();
      console.error(">>> Transcription Proxy: Flask error:", flaskRes.status, errorText);
      return NextResponse.json({ error: "Flask error" }, { status: flaskRes.status });
    }

    const data = await flaskRes.json();
    console.log(">>> Transcription Proxy: Success");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(">>> Transcription Proxy: Exception:", error);
    return NextResponse.json({ error: "Transcription proxy error" }, { status: 500 });
  }
}
