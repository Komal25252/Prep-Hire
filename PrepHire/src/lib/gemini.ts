import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function chunkText(text: string, wordsPerChunk: number = 500): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  return chunks;
}

export async function preGenerateQuestions(domain: string, resumeText: string) {
  if (!process.env.GEMINI_API_KEY) return [];
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `
    You are an expert technical interviewer. Based on the following candidate information and resume excerpt, generate exactly 10 high-quality interview questions.
    
    Candidate Domain: ${domain}

    Resume Content:
    """
    ${resumeText.slice(0, 4000)}
    """

    Instructions:
    1. Provide a mix of technical, project-specific, and behavioral questions.
    2. Vary the difficulty level (easy, moderate, hard).
    3. Ensure the questions probe deeply into the specific technologies and responsibilities mentioned in the resume.
    4. Format the output as a valid JSON array of objects. 
    
    Example format:
    [
      { "question": "Question text here", "type": "technical", "difficulty": "moderate" }
    ]

    Return ONLY the valid JSON array. No preamble or markdown blocks.
  `;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Safety: remove markdown json blocks if Gemini adds them
    text = text.replace(/```json\s?|```/g, '').trim();
    
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Pre-generation error:', err);
    return [];
  }
}
