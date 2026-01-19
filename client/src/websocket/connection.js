export class WebSocketConnection {
  constructor(state, eventHandler) {
    this.state = state;
    this.eventHandler = eventHandler;
    this.ws = null;
  }

  connect(url = 'ws://localhost:8080') {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.state.connection.status = 'connected';
      this.state.connection.ws = this.ws;

      this.ws.send(JSON.stringify({
        type: 'JOIN',
        payload: {
          nickname: this.state.me.nickname,
          totalTodos: this.state.me.totalTodos,
          minFocusMinutes: this.state.me.minFocusMinutes
        }
      }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.eventHandler.handleEvent(data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.state.connection.status = 'error';
    };

    this.ws.onclose = () => {
      this.state.connection.status = 'disconnected';
      this.state.connection.ws = null;

      setTimeout(() => {
        if (!this.state.connection.ws && this.state.me.sessionId) {
          this.connect(url);
        }
      }, 3000);
    };
  }

  send(event) {
    if (this.ws && this.state.connection.status === 'connected') {
      this.ws.send(JSON.stringify(event));
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
