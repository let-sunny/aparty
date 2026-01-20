import { useEffect, useRef, useCallback } from 'react';
import { createSocket } from 'purrcat';
import { createBus } from 'purrtabby';
import { AppState, Event, EVENT_TYPES } from '../types';

interface UseWebSocketOptions {
  state: AppState;
  onEvent: (event: Event) => void;
  onConnectionChange: (status: 'connected' | 'disconnected' | 'error', ws: WebSocket | null) => void;
  url?: string;
}

export function useWebSocket({ state, onEvent, onConnectionChange, url = 'ws://localhost:8080' }: UseWebSocketOptions) {
  const socketRef = useRef<ReturnType<typeof createSocket<Event, Event>> | null>(null);
  const busRef = useRef<ReturnType<typeof createBus<Event>> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const joinDataRef = useRef<{ nickname: string; totalTodos: number; minFocusMinutes: number } | undefined>(undefined);

  // 탭 간 통신 버스 초기화 및 제너레이터로 메시지 수신
  useEffect(() => {
    const bus = createBus<Event>({
      channel: 'aparty-sync',
    });
    busRef.current = bus;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 제너레이터로 다른 탭에서 온 이벤트 수신
    (async () => {
      try {
        for await (const message of bus.stream({ signal: abortController.signal })) {
          if (message.payload) {
            onEvent(message.payload);
          }
        }
      } catch (error) {
        // AbortError는 정상적인 종료이므로 무시
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Tab bus stream error:', error);
        }
      }
    })();

    return () => {
      abortController.abort();
      bus.close();
    };
  }, [onEvent]);

  const send = useCallback((event: Event) => {
    if (socketRef.current) {
      socketRef.current.send(event);
      
      // 다른 탭에도 동기화
      if (busRef.current) {
        busRef.current.publish('sync', event);
      }
    }
  }, []);

  const connect = useCallback((joinData?: { nickname: string; totalTodos: number; minFocusMinutes: number }) => {
    // 기존 소켓 정리
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    // JOIN 데이터 저장
    joinDataRef.current = joinData;

    // purrcat으로 WebSocket 클라이언트 생성 (자동 연결)
    const socket = createSocket<Event, Event>({
      url,
      reconnect: {
        enabled: true,
        attempts: Infinity,
        interval: 1000,
        backoff: 'exponential',
        maxInterval: 30000,
      },
      buffer: {
        receive: {
          size: 100,
          overflow: 'oldest',
        },
        send: {
          size: 100,
          overflow: 'oldest',
        },
      },
    });
    socketRef.current = socket;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 제너레이터로 메시지 수신
    (async () => {
      try {
        for await (const data of socket.messages({ signal: abortController.signal })) {
          onEvent(data);
          
          // 다른 탭에도 동기화 (소켓에서 받은 메시지만 탭 버스로 전달)
          // 탭 버스에서 받은 메시지는 다시 publish하지 않음 (무한 루프 방지)
          if (busRef.current) {
            busRef.current.publish('sync', data);
          }
        }
      } catch (error) {
        // AbortError는 정상적인 종료이므로 무시
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Socket messages stream error:', error);
        }
      }
    })();

    // 제너레이터로 연결 상태 이벤트 수신
    (async () => {
      try {
        for await (const event of socket.events({ signal: abortController.signal })) {
          switch (event.type) {
            case 'open':
              onConnectionChange('connected', null);
              
              // JOIN 이벤트 전송
              const joinPayload = joinDataRef.current || {
                nickname: state.me.nickname || '',
                totalTodos: state.me.totalTodos,
                minFocusMinutes: state.me.minFocusMinutes
              };
              
              socket.send({
                type: EVENT_TYPES.JOIN,
                payload: joinPayload
              });
              break;
            case 'close':
              onConnectionChange('disconnected', null);
              break;
            case 'error':
              onConnectionChange('error', null);
              break;
            case 'reconnect':
              // 재연결 시도 중
              break;
          }
        }
      } catch (error) {
        // AbortError는 정상적인 종료이므로 무시
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Socket events stream error:', error);
        }
      }
    })();
  }, [url, state.me.nickname, state.me.totalTodos, state.me.minFocusMinutes, onEvent, onConnectionChange]);

  const close = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      close();
      if (busRef.current) {
        busRef.current.close();
      }
    };
  }, [close]);

  return { connect, send, close };
}
