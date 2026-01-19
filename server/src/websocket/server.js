const WebSocket = require('ws');
const http = require('http');
const EventHandler = require('../events/eventHandler');

class WebSocketServer {
  constructor(room, port = 8080) {
    this.room = room;
    this.port = port;
    this.server = null;
    this.wss = null;
    this.eventHandler = new EventHandler(room);
  }

  start() {
    this.server = http.createServer();
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    this.server.listen(this.port, () => {
      console.log(`Aparty server listening on ws://localhost:${this.port}`);
    });
  }

  handleConnection(ws) {
    let sessionId = null;
    
    ws.on('message', (message) => {
      try {
        const event = JSON.parse(message.toString());
        
        switch (event.type) {
          case 'JOIN':
            sessionId = this.eventHandler.handleJoin(event, ws);
            break;
            
          case 'LEAVE':
            this.eventHandler.handleLeave(event);
            break;
            
          case 'PROGRESS':
            this.eventHandler.handleProgress(event);
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    ws.on('close', () => {
      if (sessionId) {
        this.eventHandler.handleConnectionClose(sessionId);
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = WebSocketServer;
