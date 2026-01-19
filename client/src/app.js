import { createInitialState } from './state/state.js';
import { renderFrame } from './utils/frameRenderer.js';
import { WebSocketConnection } from './websocket/connection.js';
import { EventHandler } from './events/eventHandler.js';
import { Renderer } from './renderer/renderer.js';

export class DiggingRoom {
  constructor() {
    this.state = createInitialState();

    this.dom = {
      frameEl: document.getElementById("terminal-frame"),
      overlayEl: document.getElementById("overlay"),
      todoTextEl: document.getElementById("todoText"),
      meSectionEl: document.getElementById("me-section"),
      usersTitleEl: document.getElementById("users-title"),
      usersSectionEl: document.getElementById("users-section"),
      feedContentEl: document.getElementById("feed-content"),
      userCountEl: document.getElementById("user-count"),
      footerLeftEl: document.getElementById("footer-left"),
      footerRightEl: document.getElementById("footer-right")
    };

    this.renderer = new Renderer(this.state, this.dom);
    this.eventHandler = new EventHandler(this.state, this.renderer);
    this.connection = new WebSocketConnection(this.state, this.eventHandler);

    this.init();
  }

  init() {
    this.dom.overlayEl.style.display = "grid";

    this.setupTodoTextHandlers();
    this.setupFrame();
    this.setupIntervals();
    this.setupKeyboardHandlers();

    this.renderer.render();
  }

  setupTodoTextHandlers() {
    if (this.dom.todoTextEl) {
      this.dom.todoTextEl.addEventListener("input", (e) => {
        const lines = e.target.value.split(/\r?\n/);
        if (lines.length > 4) {
          e.target.value = lines.slice(0, 4).join("\n");
        }
      });
      
      this.dom.todoTextEl.addEventListener("paste", (e) => {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData("text");
        const currentLines = e.target.value.split(/\r?\n/);
        const pastedLines = pastedText.split(/\r?\n/);
        const remainingSlots = 4 - currentLines.length;
        
        if (remainingSlots > 0) {
          const linesToAdd = pastedLines.slice(0, remainingSlots);
          const newValue = currentLines.concat(linesToAdd).join("\n");
          e.target.value = newValue;
        }
      });

      this.dom.todoTextEl.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          this.dom.todoTextEl.blur();
        }
      });
    }
  }

  setupFrame() {
    const width = 92;
    const rightWidth = 50;
    this.dom.frameEl.textContent = renderFrame(width, rightWidth);
  }

  setupIntervals() {
    setInterval(() => {
      this.renderer.updateUptimeOnly();
    }, 1000);

    setInterval(() => {
      this.checkMinuteChange();
    }, 60000);
  }

  setupKeyboardHandlers() {
    window.addEventListener("keydown", (e) => {
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'SELECT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === "l" || e.key === "L") {
        if (!this.state.me.sessionId) return;
        this.leave();
        return;
      }
      if (e.key === "j" || e.key === "J") {
        if (this.state.me.sessionId) return;
        if (this.dom.overlayEl.style.display === "none") {
          this.openJoinModal();
        } else {
          this.handleJoin();
        }
        return;
      }

      if (this.state.me.sessionId && ["1","2","3","4"].includes(e.key)) {
        this.toggleMyTodo(Number(e.key));
      }
    });
  }

  handleJoin() {
    const name = (document.getElementById("nick").value || "anon").trim().slice(0, 10);
    const min = Number(document.getElementById("min").value);
    const todoText = (this.dom.todoTextEl?.value || "").trim();

    const todoLines = todoText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    const total = Math.max(1, Math.min(4, todoLines.length));
    
    const myTodos = [];
    for (let i = 0; i < total; i++) {
      myTodos.push({ text: todoLines[i] || `todo ${i + 1}`, done: false });
    }

    if (this.state.me.sessionId) {
      this.leave();
    }

    this.state.me.nickname = name;
    this.state.me.totalTodos = total;
    this.state.me.minFocusMinutes = min;
    this.state.me.doneCount = 0;
    this.state.me.joinedAt = null;
    this.state.myTodos = myTodos;
    this.state.sessionStartedAt = Date.now();

    this.dom.overlayEl.style.display = "none";
    this.connection.connect();
  }

  toggleMyTodo(idx1based) {
    if (!this.state.me.sessionId) return;
    const idx = idx1based - 1;
    if (idx < 0 || idx >= this.state.myTodos.length) return;

    const item = this.state.myTodos[idx];
    const meUser = this.state.users.find(u => u.sessionId === this.state.me.sessionId);
    if (!meUser) return;
    
    item.done = !item.done;
    const newDoneCount = this.state.myTodos.filter(t => t.done).length;
    meUser.doneCount = newDoneCount;
    this.state.me.doneCount = newDoneCount;

    this.connection.send({
      type: 'PROGRESS',
      payload: {
        sessionId: this.state.me.sessionId,
        doneCount: newDoneCount
      }
    });
    this.renderer.render();
  }

  leave() {
    this.connection.send({
      type: 'LEAVE',
      payload: {
        sessionId: this.state.me.sessionId
      }
    });
    this.connection.close();

    this.state.users = [];
    this.state.feed = [];
    this.state.me.sessionId = null;
    this.state.me.doneCount = 0;
    this.state.me.joinedAt = null;
    this.state.myTodos = [];

    this.openJoinModal();
  }

  openJoinModal() {
    this.dom.overlayEl.style.display = "grid";
  }

  checkMinuteChange() {
    const now = Date.now();
    let needsUpdate = false;
    
    for (const u of this.state.users) {
      if (!u.joinedAt) continue;
      const elapsedMs = now - new Date(u.joinedAt);
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      
      if (elapsedMinutes > 0 && elapsedMinutes !== (u.lastElapsedMinute || 0)) {
        u.lastElapsedMinute = elapsedMinutes;
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      this.renderer.renderPeoplePanel();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.diggingRoom = new DiggingRoom();
});
