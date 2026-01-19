import { formatClock } from '../utils/formatClock.js';
import { calculateUserMode } from '../utils/userMode.js';

export class Renderer {
  constructor(state, domElements) {
    this.state = state;
    this.dom = domElements;
  }

  render() {
    this.renderUserCount();
    this.renderPeoplePanel();
    this.renderFeed();
    this.renderFooter();
  }

  renderUserCount() {
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
        this.dom.userCountEl.textContent = `${name} | ${prog} | ${mode}`;
      }
    } else {
      this.dom.userCountEl.textContent = '';
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
    this.dom.meSectionEl.innerHTML = meHTML.join('');

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
    this.dom.usersSectionEl.innerHTML = usersListHTML.join('');
  }

  renderFeed() {
    const recentFeed = this.state.feed.slice(-18);
    const feedHTML = recentFeed.map(line => `<div class="feed-line">${line}</div>`);
    this.dom.feedContentEl.innerHTML = feedHTML.join('');
    this.dom.feedContentEl.scrollTop = this.dom.feedContentEl.scrollHeight;
  }

  renderFooter() {
    const now = Date.now();
    const conn = this.state.connection.status === 'connected' ? "CONNECTED" : "DISCONNECTED";
    const uptime = formatClock(Math.floor((now - this.state.sessionStartedAt) / 1000));
    
    const leftFooterText = `${conn}  UPTIME: ${uptime}`;
    this.dom.footerLeftEl.textContent = leftFooterText.substring(0, 40);
    
    const rightFooterText = this.state.me.sessionId
      ? `[TOGGLE 1-4] [LEAVE(L)]`
      : `[JOIN(J)]`;
    this.dom.footerRightEl.textContent = rightFooterText.substring(0, 50);
  }

  updateUptimeOnly() {
    const now = Date.now();
    const conn = this.state.connection.status === 'connected' ? "CONNECTED" : "DISCONNECTED";
    const uptime = formatClock(Math.floor((now - this.state.sessionStartedAt) / 1000));
    const leftFooterText = `${conn}  UPTIME: ${uptime}`;
    this.dom.footerLeftEl.textContent = leftFooterText.substring(0, 40);
    
    if (this.state.me.sessionId) {
      const meUser = this.state.users.find(u => u.sessionId === this.state.me.sessionId);
      if (meUser) {
        const status = calculateUserMode(meUser, now);
        const mode = status.mode === 'FOCUS' 
          ? `FOCUS ${status.elapsed}/${meUser.minFocusMinutes}m`
          : `EXTRA +${status.overtime}m`;
        const name = meUser.nickname.padEnd(10);
        const prog = `${meUser.doneCount}/${meUser.totalTodos}`.padStart(3);
        this.dom.userCountEl.textContent = `${name} | ${prog} | ${mode}`;
      }
    }
  }
}
