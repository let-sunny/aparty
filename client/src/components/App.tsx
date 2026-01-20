import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useWebSocket } from '../hooks/useWebSocket';
import { TerminalFrame } from './TerminalFrame';
import { JoinModal } from './JoinModal';
import { renderFrame } from '../utils/frameRenderer';
import { EVENT_TYPES } from '../types';

export function App() {
  const { state, handleEvent, updateConnectionStatus, setMe, setMyTodos, toggleTodo, resetOnLeave, setSessionStartedAt } = useAppState();
  const { connect, send, close } = useWebSocket({
    state,
    onEvent: handleEvent,
    onConnectionChange: updateConnectionStatus,
  });

  const [showModal, setShowModal] = useState(true);
  const frameElRef = useRef<HTMLDivElement>(null);
  const todoTextRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (frameElRef.current) {
      const width = 92;
      const rightWidth = 50;
      frameElRef.current.textContent = renderFrame(width, rightWidth);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Uptime updates handled by components
    }, 1000);

    const minuteInterval = setInterval(() => {
      // Minute change checks handled by components
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(minuteInterval);
    };
  }, []);

  const handleLeave = useCallback(() => {
    if (state.me.sessionId) {
      send({
        type: EVENT_TYPES.LEAVE,
        payload: {
          sessionId: state.me.sessionId
        }
      });
    }
    close();
    resetOnLeave();
    setShowModal(true);
  }, [state.me.sessionId, send, close, resetOnLeave]);

  const handleJoin = useCallback(() => {
    const nickInput = document.getElementById('nick') as HTMLInputElement;
    const minInput = document.getElementById('min') as HTMLSelectElement;
    const todoText = todoTextRef.current?.value || '';

    const name = (nickInput?.value || 'anon').trim().slice(0, 10);
    const min = Number(minInput?.value || 50);
    const todoLines = todoText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    const total = Math.max(1, Math.min(4, todoLines.length));

    const myTodos = [];
    for (let i = 0; i < total; i++) {
      myTodos.push({ text: todoLines[i] || `todo ${i + 1}`, done: false });
    }

    if (state.me.sessionId) {
      handleLeave();
      return;
    }

    setMe({
      nickname: name,
      totalTodos: total,
      minFocusMinutes: min,
      doneCount: 0,
      joinedAt: null
    });
    setMyTodos(myTodos);
    
    // 새로운 세션 시작 시간 설정
    setSessionStartedAt(Date.now());
    
    setShowModal(false);
    connect({ nickname: name, totalTodos: total, minFocusMinutes: min });
  }, [state.me.sessionId, connect, setMe, setMyTodos, handleLeave, setSessionStartedAt]);

  const handleToggleTodo = useCallback((idx1based: number) => {
    if (!state.me.sessionId) return;
    const idx = idx1based - 1;
    if (idx < 0 || idx >= state.myTodos.length) return;

    // 새로운 상태 계산
    const newTodos = [...state.myTodos];
    newTodos[idx].done = !newTodos[idx].done;
    const newDoneCount = newTodos.filter(t => t.done).length;
    
    // 로컬 상태 업데이트
    setMyTodos(newTodos);
    setMe({ doneCount: newDoneCount });
    
    // 서버에 전송
    send({
      type: EVENT_TYPES.PROGRESS,
      payload: {
        sessionId: state.me.sessionId!,
        doneCount: newDoneCount
      }
    });
  }, [state.me.sessionId, state.myTodos, setMyTodos, setMe, send]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'SELECT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'l' || e.key === 'L') {
        if (!state.me.sessionId) return;
        handleLeave();
        return;
      }
      
      if (e.key === 'j' || e.key === 'J') {
        if (state.me.sessionId) return;
        if (!showModal) {
          setShowModal(true);
        } else {
          handleJoin();
        }
        return;
      }

      if (state.me.sessionId && ['1', '2', '3', '4'].includes(e.key)) {
        handleToggleTodo(Number(e.key));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.me.sessionId, showModal, handleJoin, handleLeave, handleToggleTodo]);


  const handleTodoTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split(/\r?\n/);
    if (lines.length > 4) {
      e.target.value = lines.slice(0, 4).join('\n');
    }
  };

  const handleTodoTextPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const currentLines = (e.currentTarget.value || '').split(/\r?\n/);
    const pastedLines = pastedText.split(/\r?\n/);
    const remainingSlots = 4 - currentLines.length;
    
    if (remainingSlots > 0) {
      const linesToAdd = pastedLines.slice(0, remainingSlots);
      const newValue = currentLines.concat(linesToAdd).join('\n');
      e.currentTarget.value = newValue;
    }
  };

  const handleTodoTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <>
      <div id="ascii-title">
        ░█▀█░█▀█░█▀█░█▀▄░▀█▀░░░░░░█▀█░░░█▀█░█▀█░█▀▄░▀█▀░█░█░░░
        <br />
        ░█▀█░█▀▀░█▀█░█▀▄░░█░░░░░░░█▀█░░░█▀▀░█▀█░█▀▄░░█░░░█░░░░
        <br />
        ░▀░▀░▀░░░▀░▀░▀░▀░░▀░░▀░░░░▀░▀░░░▀░░░▀░▀░▀░▀░░▀░░░▀░░▀░
      </div>
      <div id="terminal-container">
        <div id="terminal-frame" ref={frameElRef}></div>
        <TerminalFrame state={state} />
      </div>
      <JoinModal
        show={showModal}
        todoTextRef={todoTextRef}
        onTodoTextInput={handleTodoTextInput}
        onTodoTextPaste={handleTodoTextPaste}
        onTodoTextKeyDown={handleTodoTextKeyDown}
      />
    </>
  );
}
