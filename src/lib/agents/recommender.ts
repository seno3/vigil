import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export interface RecommenderResult {
  evacuationDirection: string;
  shelterAdvice: string;
  areasToAvoid: string[];
  immediateActions: string[];
}

export async function recommendActions(
  synthesis: string,
  severity: string,
  location: [number, number],
): Promise<RecommenderResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-04-17',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
  });
  const prompt = `You are a community safety AI recommending immediate actions based on a verified threat.

SITUATION: ${synthesis}
SEVERITY: ${severity}
LOCATION: [${location[1].toFixed(4)}, ${location[0].toFixed(4)}]

Return JSON:
{
  "evacuationDirection": "brief directional guidance or empty string if shelter-in-place",
  "shelterAdvice": "where to go or stay",
  "areasToAvoid": ["list of area descriptions to avoid"],
  "immediateActions": ["list of 2-3 immediate action items"]
}`;
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()) as RecommenderResult;
}
