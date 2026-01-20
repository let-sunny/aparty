import { useEffect, useRef, useCallback } from 'react';
import { AppState, Event, EVENT_TYPES } from '../types';

interface UseWebSocketOptions {
  state: AppState;
  onEvent: (event: Event) => void;
  onConnectionChange: (status: 'connected' | 'disconnected' | 'error', ws: WebSocket | null) => void;
  url?: string;
}

export function useWebSocket({ state, onEvent, onConnectionChange, url = 'ws://localhost:8080' }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const send = useCallback((event: Event) => {
    if (wsRef.current && state.connection.status === 'connected') {
      wsRef.current.send(JSON.stringify(event));
    }
  }, [state.connection.status]);

  const connect = useCallback((joinData?: { nickname: string; totalTodos: number; minFocusMinutes: number }) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      onConnectionChange('connected', ws);
      
      const joinPayload = joinData || {
        nickname: state.me.nickname || '',
        totalTodos: state.me.totalTodos,
        minFocusMinutes: state.me.minFocusMinutes
      };
      
      ws.send(JSON.stringify({
        type: EVENT_TYPES.JOIN,
        payload: joinPayload
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Event;
        onEvent(data);
      } catch (error) {
        // Error parsing WebSocket message
      }
    };

    ws.onerror = () => {
      onConnectionChange('error', ws);
    };

    ws.onclose = () => {
      onConnectionChange('disconnected', null);
      wsRef.current = null;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!wsRef.current && state.me.sessionId) {
          connect();
        }
      }, 3000);
    };
  }, [url, state.me.nickname, state.me.totalTodos, state.me.minFocusMinutes, state.me.sessionId, onEvent, onConnectionChange, state]);

  const close = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { connect, send, close };
}
