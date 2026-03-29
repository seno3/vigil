import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3001;
const wss  = new WebSocketServer({ port: PORT });

console.log(`[ws] Simulation server listening on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('[ws] Client connected');

  ws.on('message', async (raw) => {
    const { townModel, efScale, windDirection, sessionId } = JSON.parse(raw.toString());

    console.log(`[ws] Starting simulation session=${sessionId} ef=${efScale}`);

    try {
      const { runAgents } = await import('../lib/agents');
      await runAgents({
        townModel,
        efScale,
        windDirection,
        sessionId,
        onUpdate: (agent, status) => {
          ws.send(JSON.stringify({ type: 'agent_update', agent, status }));
        },
        onFinal: (agent, data) => {
          ws.send(JSON.stringify({ type: 'agent_final', agent, data }));
        },
        onDone: () => {
          console.log(`[ws] Simulation complete session=${sessionId}`);
          ws.send(JSON.stringify({ type: 'done' }));
        },
        onError: (message) => {
          console.error(`[ws] Agent error session=${sessionId}:`, message);
          ws.send(JSON.stringify({ type: 'error', message }));
        },
      });
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', message: String(err) }));
    }
  });

  ws.on('close', () => console.log('[ws] Client disconnected'));
  ws.on('error', (err) => console.error('[ws] Socket error:', err));
});
