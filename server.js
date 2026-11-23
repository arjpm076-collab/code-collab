#!/usr/bin/env node

/**
 * CodeCollab WebSocket Server
 * Real-time collaborative coding server
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8765;

// Track connected users
const connectedUsers = new Map();
const userCursors = new Map();

// Create HTTP server for health check
const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', users: connectedUsers.size }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server: httpServer });

// Broadcast to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Broadcast to all except sender
function broadcastExcept(sender, message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'init',
    message: 'Welcome to CodeCollab server',
    timestamp: Date.now(),
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'join':
          const userId = data.userId;
          const userName = data.userName || `User ${userId.substring(0, 8)}`;

          connectedUsers.set(userId, {
            id: userId,
            name: userName,
            joinedAt: Date.now(),
            ws: ws,
          });

          console.log(`User joined: ${userName} (${userId})`);

          // Notify about new user
          broadcast({
            type: 'join',
            userId,
            userName,
            timestamp: Date.now(),
          });

          // Send user list to everyone
          broadcast({
            type: 'users',
            users: Array.from(connectedUsers.values()).map((u) => ({
              id: u.id,
              name: u.name,
              joinedAt: u.joinedAt,
            })),
          });
          break;

        case 'cursor':
          if (data.position) {
            userCursors.set(data.userId, {
              position: data.position,
              userName: data.userName,
              timestamp: Date.now(),
            });

            // Broadcast cursor to others
            broadcastExcept(ws, {
              type: 'cursor',
              userId: data.userId,
              userName: data.userName,
              position: data.position,
            });
          }
          break;

        case 'selection':
          if (data.selection) {
            broadcastExcept(ws, {
              type: 'selection',
              userId: data.userId,
              userName: data.userName,
              selection: data.selection,
            });
          }
          break;

        case 'code':
          if (data.content) {
            // Broadcast code change to all others
            broadcastExcept(ws, {
              type: 'code',
              userId: data.userId,
              userName: data.userName,
              content: data.content,
              timestamp: Date.now(),
            });
          }
          break;

        case 'leave':
          const user = connectedUsers.get(data.userId);
          if (user) {
            connectedUsers.delete(data.userId);
            userCursors.delete(data.userId);

            console.log(`User left: ${user.name}`);

            // Notify others
            broadcast({
              type: 'leave',
              userId: data.userId,
              userName: user.name,
              timestamp: Date.now(),
            });

            // Update user list
            broadcast({
              type: 'users',
              users: Array.from(connectedUsers.values()).map((u) => ({
                id: u.id,
                name: u.name,
                joinedAt: u.joinedAt,
              })),
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

    // Find and remove the user
    for (const [userId, user] of connectedUsers.entries()) {
      if (user.ws === ws) {
        connectedUsers.delete(userId);
        userCursors.delete(userId);

        console.log(`User disconnected: ${user.name}`);

        // Notify others
        broadcast({
          type: 'leave',
          userId,
          userName: user.name,
          timestamp: Date.now(),
        });

        // Update user list
        broadcast({
          type: 'users',
          users: Array.from(connectedUsers.values()).map((u) => ({
            id: u.id,
            name: u.name,
            joinedAt: u.joinedAt,
          })),
        });
        break;
      }
    }
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`CodeCollab WebSocket server running on ws://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});