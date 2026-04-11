import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Path to the venv python and the predict script
  const pythonPath = path.join(process.cwd(), '../ML/venv/bin/python3');
  const scriptPath = path.join(process.cwd(), '../ML/predict.py');

  return new Promise<NextResponse>((resolve) => {
    const py = spawn(pythonPath, [scriptPath]);

    let output = '';
    let errorOutput = '';

    py.stdout.on('data', (data) => { output += data.toString(); });
    py.stderr.on('data', (data) => { errorOutput += data.toString(); });

    py.on('close', (code) => {
      if (code !== 0) {
        console.error('Python error:', errorOutput);
        resolve(NextResponse.json({ error: 'Prediction failed', details: errorOutput }, { status: 500 }));
        return;
      }
      try {
        const result = JSON.parse(output.trim());
        resolve(NextResponse.json(result));
      } catch {
        resolve(NextResponse.json({ error: 'Invalid response from model' }, { status: 500 }));
      }
    });

    // Send PDF bytes to the Python script via stdin
    py.stdin.write(buffer);
    py.stdin.end();
  });
}
