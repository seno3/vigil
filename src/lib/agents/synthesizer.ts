import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export interface SynthesizerResult {
  summary: string;
  affectedArea: string;
  estimatedSeverity: string;
  confidence: number;
}

export async function synthesizeTips(
  tips: Array<{ description: string; category: string; credibilityScore: number }>,
  location: [number, number],
): Promise<SynthesizerResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-04-17',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
  });
  const prompt = `You are a safety AI synthesizing multiple corroborated community tips into a unified situation report.

LOCATION: [${location[1].toFixed(4)}, ${location[0].toFixed(4)}]
TIPS (${tips.length} total):
${tips.map(t => `- [credibility:${t.credibilityScore}] "${t.description}"`).join('\n')}

Return JSON:
{
  "summary": "2-3 sentence unified situation report",
  "affectedArea": "brief description of affected area",
  "estimatedSeverity": "low|medium|high|critical",
  "confidence": number (0-100)
}`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()) as SynthesizerResult;
}
