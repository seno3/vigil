import { NextRequest } from 'next/server';
import { runAgents } from '@/lib/agents';
import { TownModel, AgentOutput, AgentData } from '@/types';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const townModel: TownModel = body.townModel;
  const efScale: number      = body.efScale ?? 3;
  const windDirection: string = body.windDirection ?? 'SW';

  if (!townModel) {
    return new Response('Missing townModel', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      await runAgents({
        townModel,
        efScale,
        windDirection,
        sessionId: `sse-${Date.now()}`,
        onUpdate: (agent: AgentOutput['agent'], status: string) => {
          send({ agent, timestamp: Date.now(), type: 'update', data: { confidence: 0, reasoning: status } });
        },
        onFinal: (agent: AgentOutput['agent'], data: AgentData) => {
          send({ agent, timestamp: Date.now(), type: 'final', data });
        },
        onDone: () => {
          send({ type: 'done' });
        },
        onError: (message: string) => {
          send({ type: 'error', message });
        },
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      Connection:          'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
