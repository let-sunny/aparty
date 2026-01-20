import { useEffect, useRef, useState } from 'react';
import { AppState } from '../types';
import { formatClock } from '../utils/formatClock';
import { calculateUserMode } from '../utils/userMode';

interface TerminalFrameProps {
  state: AppState;
}

export function TerminalFrame({ state }: TerminalFrameProps) {
  const feedContentRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (feedContentRef.current) {
      // DOM이 업데이트된 후 스크롤
      setTimeout(() => {
        if (feedContentRef.current) {
          feedContentRef.current.scrollTop = feedContentRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [state.feed]);

  const meUser = state.users.find(u => u.sessionId === state.me.sessionId);
  const userCount = state.users.length;
  const conn = state.connection.status === 'connected' ? 'CONNECTED' : 'DISCONNECTED';
  const uptimeSeconds = Math.max(0, Math.floor((now - state.sessionStartedAt) / 1000));
  const uptime = formatClock(uptimeSeconds);

  const others = state.users
    .slice()
    .filter(u => !state.me.sessionId || u.sessionId !== state.me.sessionId)
    .sort((a, b) => a.nickname.localeCompare(b.nickname));

  return (
    <div id="terminal-content">
      <div id="header">
        <span id="title"></span>
        <span id="user-count">
          {meUser && meUser.nickname ? (() => {
            const status = calculateUserMode(meUser, now);
            const mode = status.mode === 'FOCUS' 
              ? `FOCUS ${status.elapsed}/${meUser.minFocusMinutes}m`
              : `EXTRA +${status.overtime}m`;
            const name = meUser.nickname.padEnd(10);
            const prog = `${meUser.doneCount}/${meUser.totalTodos}`.padStart(3);
            return `${name} | ${prog} | ${mode}`;
          })() : 'USERS: 0'}
        </span>
      </div>
      <div id="panels">
        <div id="feed-panel">
          <div className="panel-title"><strong>FEED</strong></div>
          <div id="feed-content" ref={feedContentRef}>
            {state.feed.length === 0 ? (
              <div className="feed-line" style={{ opacity: 0.5 }}>No events yet...</div>
            ) : (
              state.feed.slice(-18).map((line, idx) => {
                const uniqueKey = `feed-${state.feed.length}-${idx}-${line.substring(0, 20).replace(/\s/g, '_')}`;
                return <div key={uniqueKey} className="feed-line">{line}</div>;
              })
            )}
          </div>
        </div>
        <div id="people-panel">
          <div id="me-section">
            {state.me.sessionId && (
              <>
                <div className="todo-line"><strong>TODOS</strong></div>
                {state.myTodos.map((todo, i) => {
                  const mark = todo.done ? 'x' : ' ';
                  const text = todo.text || `todo ${i + 1}`;
                  return (
                    <div key={i} className="todo-line">
                      {i + 1} [{mark}] {text}
                    </div>
                  );
                })}
                <div className="todo-line">-</div>
              </>
            )}
          </div>
          <div id="users-title" className="panel-title">
            <strong>USERS</strong> {userCount}
          </div>
          <div id="users-section">
            {others.map((u) => {
              if (!u.nickname) return null;
              const status = calculateUserMode(u, now);
              const mode = status.mode === 'FOCUS' 
                ? `FOCUS ${status.elapsed}/${u.minFocusMinutes}m`
                : `EXTRA +${status.overtime}m`;
              const name = u.nickname.padEnd(10);
              const prog = `${u.doneCount}/${u.totalTodos}`.padStart(3);
              return (
                <div key={u.sessionId} className="user-line">
                  <span className="name">{name}</span> | <span className="progress">{prog}</span> | {mode}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div id="footer">
        <div id="footer-left">
          {`${conn}  UPTIME: ${uptime}`.substring(0, 40)}
        </div>
        <div id="footer-right">
          {state.me.sessionId
            ? '[TOGGLE 1-4] [LEAVE(L)]'.substring(0, 50)
            : '[JOIN(J)]'}
        </div>
      </div>
    </div>
  );
}
