import { NextRequest } from 'next/server';
import { runAgents } from '@/lib/agents';
import { TownModel, AgentOutput } from '@/types';

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const townModel: TownModel = body.townModel;
  const efScale: number = body.efScale ?? 3;
  const windDirection: string = body.windDirection ?? 'SW';

  if (!townModel) {
    return new Response('Missing townModel', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: AgentOutput) => {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        await runAgents(townModel, efScale, windDirection, send);
        // Signal completion
        controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
      } catch (err) {
        console.error('Simulation error:', err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
