const Room = require('./room/room');
const WebSocketServer = require('./websocket/server');
const MinFocusChecker = require('./events/minFocusChecker');

const room = new Room();
const wss = new WebSocketServer(room, 8080);
const minFocusChecker = new MinFocusChecker(room);

wss.start();
minFocusChecker.start();
