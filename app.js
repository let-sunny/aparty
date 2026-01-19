// Aparty v0.3 - Hybrid ASCII/HTML UI

function formatClock(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function calculateUserMode(user, now) {
  if (!user.joinedAt) return { mode: 'FOCUS', elapsed: 0, overtime: 0 };
  
  const elapsedMs = now - new Date(user.joinedAt);
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const minFocus = user.minFocusMinutes;
  
  if (elapsedMinutes < minFocus) {
    return { mode: 'FOCUS', elapsed: elapsedMinutes, overtime: 0 };
  } else {
    const overtime = elapsedMinutes - minFocus;
    return { mode: 'EXTRA', elapsed: elapsedMinutes, overtime };
  }
}

function renderFrame(width, rightWidth) {
  const contentWidth = 90;
  const leftContentWidth = contentWidth - rightWidth - 1;
  const frameWidth = width;
  
  const top = "+" + "-".repeat(frameWidth - 2) + "+";
  const split = "+" + "-".repeat(leftContentWidth) + "+" + "-".repeat(rightWidth) + "+";
  const bottom = "+" + "-".repeat(frameWidth - 2) + "+";
  
  let frame = top + "\n";
  frame += "|" + " ".repeat(frameWidth - 2) + "|\n";
  frame += split + "\n";
  frame += "|" + " ".repeat(leftContentWidth) + "|" + " ".repeat(rightWidth) + "|\n";
  
  for (let i = 0; i < 18; i++) {
    frame += "|" + " ".repeat(leftContentWidth) + "|" + " ".repeat(rightWidth) + "|\n";
  }
  
  frame += split + "\n";
  frame += "|" + " ".repeat(frameWidth - 2) + "|\n";
  frame += bottom;
  
  return frame;
}

class DiggingRoom {
  constructor() {
    this.state = {
      sessionStartedAt: Date.now(),
      users: [],
      feed: [],
      me: {
        sessionId: null,
        nickname: null,
        totalTodos: 0,
        doneCount: 0,
        minFocusMinutes: 50,
        joinedAt: null
      },
      myTodos: [],
      connection: {
        status: 'disconnected',
        ws: null
      }
    };

    this.frameEl = document.getElementById("terminal-frame");
    this.overlayEl = document.getElementById("overlay");
    this.todoTextEl = document.getElementById("todoText");
    this.meSectionEl = document.getElementById("me-section");
    this.usersTitleEl = document.getElementById("users-title");
    this.usersSectionEl = document.getElementById("users-section");
    this.feedContentEl = document.getElementById("feed-content");
    this.userCountEl = document.getElementById("user-count");
    this.footerLeftEl = document.getElementById("footer-left");
    this.footerRightEl = document.getElementById("footer-right");

    this.init();
  }

  init() {
    this.overlayEl.style.display = "grid";

    if (this.todoTextEl) {
      this.todoTextEl.addEventListener("input", (e) => {
        const lines = e.target.value.split(/\r?\n/);
        if (lines.length > 4) {
          e.target.value = lines.slice(0, 4).join("\n");
        }
      });
      
      this.todoTextEl.addEventListener("paste", (e) => {
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

      this.todoTextEl.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          this.todoTextEl.blur();
        }
      });
    }

    const width = 92;
    const rightWidth = 50;
    this.frameEl.textContent = renderFrame(width, rightWidth);

    this.render();

    setInterval(() => {
      this.updateUptimeOnly();
    }, 1000);

    setInterval(() => {
      this.checkMinuteChange();
    }, 60000);

    window.addEventListener("keydown", (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === "l" || e.key === "L") {
        if (!this.state.me.sessionId) return;
        this.leave();
        return;
      }
      if (e.key === "j" || e.key === "J") {
        if (this.state.me.sessionId) return;
        if (this.overlayEl.style.display === "none") {
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
    const todoText = (this.todoTextEl?.value || "").trim();

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

    this.overlayEl.style.display = "none";
    this.connect();
  }

  connect() {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      this.state.connection.status = 'connected';
      this.state.connection.ws = ws;

      ws.send(JSON.stringify({
        type: 'JOIN',
        payload: {
          nickname: this.state.me.nickname,
          totalTodos: this.state.me.totalTodos,
          minFocusMinutes: this.state.me.minFocusMinutes
        }
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleEvent(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.state.connection.status = 'error';
    };

    ws.onclose = () => {
      this.state.connection.status = 'disconnected';
      this.state.connection.ws = null;

      setTimeout(() => {
        if (!this.state.connection.ws && this.state.me.sessionId) {
          this.connect();
        }
      }, 3000);
    };
  }

  handleEvent(event) {
    switch (event.type) {
      case 'ROOM_SNAPSHOT':
        this.state.users = event.payload.users;
        const me = this.state.users.find(u => u.nickname === this.state.me.nickname);
        if (me) {
          this.state.me.sessionId = me.sessionId;
          this.state.me.doneCount = me.doneCount;
          this.state.me.joinedAt = new Date(me.joinedAt);
        }
        break;

      case 'JOIN':
        const newUser = event.payload;
        if (!this.state.users.find(u => u.sessionId === newUser.sessionId)) {
          this.state.users.push(newUser);
        }
        if (newUser.nickname === this.state.me.nickname) {
          this.state.me.sessionId = newUser.sessionId;
          this.state.me.doneCount = newUser.doneCount;
          this.state.me.joinedAt = new Date(newUser.joinedAt);
          if (this.state.myTodos.length !== newUser.totalTodos) {
            this.state.myTodos = [];
            for (let i = 1; i <= newUser.totalTodos; i++) {
              this.state.myTodos.push({ text: `todo ${i}`, done: false });
            }
          }
        }
        this.addFeed(`> ${newUser.nickname} joined (min ${newUser.minFocusMinutes}m, ${newUser.totalTodos} todos)`);
        break;

      case 'LEAVE':
        const leftSessionId = event.payload.sessionId;
        this.state.users = this.state.users.filter(u => u.sessionId !== leftSessionId);
        this.addFeed(`> ${event.payload.nickname} left`);
        if (leftSessionId === this.state.me.sessionId) {
          this.state.me.sessionId = null;
          this.state.me.doneCount = 0;
          this.state.me.joinedAt = null;
        }
        break;

      case 'PROGRESS':
        const progressUser = this.state.users.find(u => u.sessionId === event.payload.sessionId);
        if (progressUser) {
          progressUser.doneCount = event.payload.doneCount;
        }
        const nickname = event.payload.nickname || (progressUser ? progressUser.nickname : 'unknown');
        const doneCount = event.payload.doneCount;
        const totalTodos = event.payload.totalTodos || (progressUser ? progressUser.totalTodos : 0);
        this.addFeed(`> ${nickname} progress: ${doneCount}/${totalTodos}`);
        if (event.payload.sessionId === this.state.me.sessionId) {
          this.state.me.doneCount = event.payload.doneCount;
        }
        break;

      case 'MIN_HIT':
        const hitUser = this.state.users.find(u => u.sessionId === event.payload.sessionId);
        if (hitUser) {
          hitUser.minHitEmitted = true;
        }
        this.addFeed(`> ${event.payload.nickname} hit min focus: ${event.payload.minFocusMinutes}m`);
        break;
    }

    this.render();
  }

  addFeed(line) {
    this.state.feed.push(line);
    if (this.state.feed.length > 200) {
      this.state.feed.splice(0, this.state.feed.length - 200);
    }
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

    if (this.state.connection.ws && this.state.connection.status === 'connected') {
      this.state.connection.ws.send(JSON.stringify({
        type: 'PROGRESS',
        payload: {
          sessionId: this.state.me.sessionId,
          doneCount: newDoneCount
        }
      }));
    }
    this.render();
  }

  leave() {
    if (this.state.connection.ws && this.state.connection.status === 'connected') {
      this.state.connection.ws.send(JSON.stringify({
        type: 'LEAVE',
        payload: {
          sessionId: this.state.me.sessionId
        }
      }));
      this.state.connection.ws.close();
    }

    this.state.users = [];
    this.state.feed = [];
    this.state.me.sessionId = null;
    this.state.me.doneCount = 0;
    this.state.me.joinedAt = null;
    this.state.myTodos = [];

    this.openJoinModal();
  }

  openJoinModal() {
    this.overlayEl.style.display = "grid";
  }

  updateUptimeOnly() {
    const now = Date.now();
    const conn = this.state.connection.status === 'connected' ? "CONNECTED" : "DISCONNECTED";
    const uptime = formatClock(Math.floor((now - this.state.sessionStartedAt) / 1000));
    const leftFooterText = `${conn}  UPTIME: ${uptime}`;
    this.footerLeftEl.textContent = leftFooterText.substring(0, 40);
    
    if (this.state.me.sessionId) {
      const meUser = this.state.users.find(u => u.sessionId === this.state.me.sessionId);
      if (meUser) {
        const status = calculateUserMode(meUser, now);
        const mode = status.mode === 'FOCUS' 
          ? `FOCUS ${status.elapsed}/${meUser.minFocusMinutes}m`
          : `EXTRA +${status.overtime}m`;
        const name = meUser.nickname.padEnd(10);
        const prog = `${meUser.doneCount}/${meUser.totalTodos}`.padStart(3);
        this.userCountEl.textContent = `${name} | ${prog} | ${mode}`;
      }
    }
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
      this.renderPeoplePanel();
    }
  }

  renderPeoplePanel() {
    const now = Date.now();
    
    const meHTML = [];
    if (this.state.me.sessionId) {
      meHTML.push('<div class="todo-line"><strong>TODOS</strong></div>');
      
      const todos = this.state.myTodos || [];
      for (let i = 0; i < todos.length; i++) {
        const mark = todos[i].done ? "x" : " ";
        const text = todos[i].text || `todo ${i + 1}`;
        meHTML.push(`<div class="todo-line">${i + 1} [${mark}] ${text}</div>`);
      }
      
      meHTML.push('<div class="todo-line">-</div>');
    }
    this.meSectionEl.innerHTML = meHTML.join('');

    const userCount = this.state.users.length;
    
    const usersTitleEl = document.getElementById('users-title');
    if (usersTitleEl) {
      usersTitleEl.innerHTML = `<strong>USERS</strong> ${userCount}`;
    }
    
    const usersListHTML = [];
    
    const others = this.state.users
      .slice()
      .filter(u => !this.state.me.sessionId || u.sessionId !== this.state.me.sessionId)
      .sort((a, b) => a.nickname.localeCompare(b.nickname));
    
    for (const u of others) {
      const status = calculateUserMode(u, now);
      const mode = status.mode === 'FOCUS' 
        ? `FOCUS ${status.elapsed}/${u.minFocusMinutes}m`
        : `EXTRA +${status.overtime}m`;
      const name = u.nickname.padEnd(10);
      const prog = `${u.doneCount}/${u.totalTodos}`.padStart(3);
      usersListHTML.push(`<div class="user-line"><span class="name">${name}</span> | <span class="progress">${prog}</span> | ${mode}</div>`);
      u.lastElapsedMinute = status.elapsed;
    }
    this.usersSectionEl.innerHTML = usersListHTML.join('');
  }

  render() {
    if (this.state.me.sessionId) {
      const meUser = this.state.users.find(u => u.sessionId === this.state.me.sessionId);
      if (meUser) {
        const now = Date.now();
        const status = calculateUserMode(meUser, now);
        const mode = status.mode === 'FOCUS' 
          ? `FOCUS ${status.elapsed}/${meUser.minFocusMinutes}m`
          : `EXTRA +${status.overtime}m`;
        const name = meUser.nickname.padEnd(10);
        const prog = `${meUser.doneCount}/${meUser.totalTodos}`.padStart(3);
        this.userCountEl.textContent = `${name} | ${prog} | ${mode}`;
      }
    } else {
      this.userCountEl.textContent = '';
    }

    this.renderPeoplePanel();

    const recentFeed = this.state.feed.slice(-18);
    const feedHTML = recentFeed.map(line => `<div class="feed-line">${line}</div>`);
    this.feedContentEl.innerHTML = feedHTML.join('');

    const now = Date.now();
    const conn = this.state.connection.status === 'connected' ? "CONNECTED" : "DISCONNECTED";
    const uptime = formatClock(Math.floor((now - this.state.sessionStartedAt) / 1000));
    
    const leftFooterText = `${conn}  UPTIME: ${uptime}`;
    this.footerLeftEl.textContent = leftFooterText.substring(0, 40);
    
    const rightFooterText = this.state.me.sessionId
      ? `[TOGGLE 1-4] [LEAVE(L)]`
      : `[JOIN(J)]`;
    this.footerRightEl.textContent = rightFooterText.substring(0, 50);

    this.feedContentEl.scrollTop = this.feedContentEl.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.diggingRoom = new DiggingRoom();
});
