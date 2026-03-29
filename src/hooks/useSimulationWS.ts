'use client';

import { useRef, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { AgentOutput, AgentStatus, TownModel, AgentData } from '@/types';

const AGENTS: AgentOutput['agent'][] = ['path', 'structural', 'evacuation', 'response'];

const INITIAL_AGENT_STATUSES: Record<AgentOutput['agent'], AgentStatus> = {
  path:        'idle',
  structural:  'idle',
  evacuation:  'idle',
  response:    'idle',
};

const INITIAL_AGENT_OUTPUTS: Record<AgentOutput['agent'], AgentOutput | null> = {
  path:        null,
  structural:  null,
  evacuation:  null,
  response:    null,
};

interface WSState {
  agentStatuses: Record<AgentOutput['agent'], AgentStatus>;
  agentOutputs:  Record<AgentOutput['agent'], AgentOutput | null>;
  simStatus:     'idle' | 'simulating' | 'complete' | 'error';
  errorMsg:      string | undefined;
}

const INITIAL_WS_STATE: WSState = {
  agentStatuses: INITIAL_AGENT_STATUSES,
  agentOutputs:  INITIAL_AGENT_OUTPUTS,
  simStatus:     'idle',
  errorMsg:      undefined,
};

export function useSimulationWS() {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<WSState>(INITIAL_WS_STATE);

  const startSimulation = useCallback(
    (townModel: TownModel, efScale: number, windDirection: string) => {
      // Close any previous connection
      wsRef.current?.close();

      setState({
        ...INITIAL_WS_STATE,
        simStatus: 'simulating',
      });

      const ws = new WebSocket('ws://localhost:3001');
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({ townModel, efScale, windDirection, sessionId: uuid() })
        );
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data as string);

        if (msg.type === 'done') {
          setState((s) => ({ ...s, simStatus: 'complete' }));
          return;
        }

        if (msg.type === 'error') {
          setState((s) => ({ ...s, simStatus: 'error', errorMsg: msg.message as string }));
          return;
        }

        if (msg.type === 'agent_update') {
          const agent = msg.agent as AgentOutput['agent'];
          setState((s) => ({
            ...s,
            agentStatuses: { ...s.agentStatuses, [agent]: 'running' as AgentStatus },
          }));
          return;
        }

        if (msg.type === 'agent_final') {
          const agent  = msg.agent as AgentOutput['agent'];
          const output: AgentOutput = {
            agent,
            timestamp: Date.now(),
            type:      'final',
            data:      msg.data as AgentData,
          };
          setState((s) => ({
            ...s,
            agentStatuses: { ...s.agentStatuses, [agent]: 'complete' as AgentStatus },
            agentOutputs:  { ...s.agentOutputs,  [agent]: output },
          }));
        }
      };

      ws.onerror = () => {
        setState((s) => ({
          ...s,
          simStatus: 'error',
          errorMsg:  'WebSocket connection failed. Is the simulation server running on port 3001?',
        }));
      };

      ws.onclose = () => {
        setState((s) => {
          if (s.simStatus === 'simulating') {
            return {
              ...s,
              simStatus: 'error',
              errorMsg:  'Connection lost during simulation.',
            };
          }
          return s;
        });
      };
    },
    []
  );

  const reset = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setState(INITIAL_WS_STATE);
  }, []);

  // Unused import guard — AGENTS used only for type inference
  void AGENTS;

  return {
    startSimulation,
    agentStatuses: state.agentStatuses,
    agentOutputs:  state.agentOutputs,
    simStatus:     state.simStatus,
    errorMsg:      state.errorMsg,
    reset,
  };
}
