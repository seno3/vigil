import Redis from 'ioredis';
import type { AgentData } from '@/types';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});

redis.on('error', () => {
  // Redis unavailable — context sharing disabled, simulation continues without it
});

export async function publishAgentResult(
  sessionId: string,
  agent: string,
  data: AgentData
): Promise<void> {
  try {
    await redis.set(`vortex:${sessionId}:${agent}`, JSON.stringify(data), 'EX', 300);
  } catch {
    // Non-fatal — continue without Redis
  }
}

export async function getAgentResult(
  sessionId: string,
  agent: string
): Promise<AgentData | null> {
  try {
    const raw = await redis.get(`vortex:${sessionId}:${agent}`);
    return raw ? (JSON.parse(raw) as AgentData) : null;
  } catch {
    return null;
  }
}
