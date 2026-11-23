// Simple HTTP + WebSocket Server for CodeCollab
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 8765;

// Create HTTP server
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;

  if (filePath === './' || filePath === './index.html') {
    filePath = './index-simple.html';
  }

  if (filePath === './favicon.svg') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    fs.readFile(filePath, (err, data) => {
      if (err) throw err;
      res.end(data);
    });
    return;
  }

  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css'
  };

  res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/html' });
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + filePath);
      return;
    }
    res.end(data);
  });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

const connectedUsers = new Map();
const userCursors = new Map();

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'join':
          const userId = data.userId;
          const userName = data.userName || 'User ' + userId.substring(0, 8);
          connectedUsers.set(userId, {
            id: userId,
            name: userName,
            joinedAt: Date.now()
          });

          // Notify about new user
          broadcast({ type: 'join', userId, userName });
          break;

        case 'leave':
          const user = connectedUsers.get(data.userId);
          if (user) {
            connectedUsers.delete(data.userId);
            userCursors.delete(data.userId);
            broadcast({ type: 'leave', userId: data.userId, userName: user.name });
          }
          break;

        case 'code':
          if (data.content) {
            broadcastExcept(ws, {
              type: 'code',
              userId: data.userId,
              userName: data.userName,
              content: data.content
            });
          }
          break;

        case 'cursor':
          if (data.position) {
            userCursors.set(data.userId, data.position);
            broadcastExcept(ws, {
              type: 'cursor',
              userId: data.userId,
              userName: data.userName,
              position: data.position
            });
          }
          break;
      }
    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Handle client disconnect
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastExcept(sender, data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

server.listen(PORT, () => {
  console.log('CodeCollab server running at http://localhost:' + PORT);
  console.log('Open index-simple.html in your browser');
});