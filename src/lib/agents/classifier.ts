import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export interface ClassifierResult {
  classification: string;
  threatLevel: 'info' | 'advisory' | 'warning' | 'critical';
  credibilityAdjustment: number;
  urgencyDecayMinutes: number;
  reasoning: string;
}

export async function classifyTip(
  description: string,
  category: string,
  location: [number, number],
): Promise<ClassifierResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-04-17',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
  });
  const prompt = `You are a community safety AI classifying a public safety tip.

TIP: "${description}"
CATEGORY: ${category}
LOCATION: [${location[1].toFixed(4)}, ${location[0].toFixed(4)}]

Classify this tip and return JSON:
{
  "classification": "string (e.g. 'active_shooter', 'flooding', 'road_hazard')",
  "threatLevel": "info" | "advisory" | "warning" | "critical",
  "credibilityAdjustment": number (-20 to +20, based on specificity and plausibility),
  "urgencyDecayMinutes": number (how many minutes until tip is stale: 15-240),
  "reasoning": "one sentence"
}`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()) as ClassifierResult;
}
