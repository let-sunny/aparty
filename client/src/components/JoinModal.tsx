import { RefObject } from 'react';

interface JoinModalProps {
  show: boolean;
  todoTextRef: RefObject<HTMLTextAreaElement | null>;
  onTodoTextInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTodoTextPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onTodoTextKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function JoinModal({ show, todoTextRef, onTodoTextInput, onTodoTextPaste, onTodoTextKeyDown }: JoinModalProps) {
  return (
    <div 
      className="overlay" 
      id="overlay" 
      style={{ display: show ? 'grid' : 'none' }}
    >
      <div id="modal-ascii-title">
        ░▀▀█░█▀█░▀█▀░█▀█
        <br />
        ░░░█░█░█░░█░░█░█
        <br />
        ░▀▀░░▀▀▀░▀▀▀░▀░▀
      </div>
      <div className="modal-content">
        <div className="row">
          <label htmlFor="nick">nickname</label>
          <div className="input-wrapper">
            <input id="nick" maxLength={10} placeholder="sunny" />
            <div className="input-line"></div>
          </div>
        </div>

        <div className="row">
          <label htmlFor="min">min focus</label>
          <div className="input-wrapper">
            <select id="min" defaultValue="50">
              <option value="25">25m</option>
              <option value="50">50m</option>
              <option value="90">90m</option>
              <option value="120">120m</option>
            </select>
            <div className="input-line"></div>
          </div>
        </div>

        <div className="row" style={{ alignItems: 'flex-start' }}>
          <label>todo text</label>
          <div style={{ flex: 1 }}>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <textarea
                ref={todoTextRef}
                id="todoText"
                rows={4}
                placeholder="todo 1&#10;todo 2&#10;todo 3&#10;todo 4"
                onChange={onTodoTextInput}
                onPaste={onTodoTextPaste}
                onKeyDown={onTodoTextKeyDown}
              />
              <div className="input-line"></div>
            </div>
            <div className="tiny">Enter each todo on a new line. Only you can see these. Others see just 1/4 progress.</div>
          </div>
        </div>

        <div className="hint">Rules: No chat. No reactions. No shared todo text. Leave & rejoin to reset.</div>
        <div className="tiny">Press J to join. Keys: 1-4 = toggle done, L = leave</div>
      </div>
    </div>
  );
}
