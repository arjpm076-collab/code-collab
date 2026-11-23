# CodeCollab - Real-Time Collaborative Coding Platform

A real-time collaborative coding platform built with React, Monaco Editor, and WebSocket.

## Features

- **Real-time Code Collaboration**: Multiple developers can edit code simultaneously
- **Live Cursor Tracking**: See where other collaborators are typing
- **Selection Highlighting**: View other users' text selections
- **Multiple Language Support**: JavaScript, TypeScript, Python, Java, C
- **VS Code-like Editor**: Monaco Editor provides a familiar coding experience
- **User Presence Indicators**: Colored indicators showing each user's cursor location
- **Persistent User Names**: Names saved to localStorage for easy joining

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Editor**: Monaco Editor (VS Code's browser-based editor)
- **Real-time**: WebSocket server with Node.js
- **Styling**: CSS variables with light/dark theme support

## Getting Started

### Prerequisites

- Node.js 18+ or io.js
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd codecollab

# Install dependencies
npm install
```

### Development

Start the development server:

```bash
# Start both servers (client and WebSocket)
npm run dev:all

# Or start them separately:
# Terminal 1: WebSocket server
npm run server
# Terminal 2: Vite dev server
npm run dev
```

The application will be available at:
- Client: http://localhost:5173
- WebSocket Server: ws://localhost:8765

### Building for Production

```bash
npm run build
npm run preview
```

## Architecture

### Frontend (Client)

The React client handles:
- Monaco Editor initialization and configuration
- WebSocket connection management
- Cursor position broadcasting
- Selection highlighting
- User presence management

### Backend (Server)

The Node.js WebSocket server handles:
- User connection management
- Message broadcasting to all connected clients
- Presence notifications
- Code synchronization

## WebSocket Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `join` | Client → Server | Register user with name |
| `leave` | Client → Server | Unregister user |
| `cursor` | Client → Server/Broadcast | Cursor position update |
| `selection` | Client → Server/Broadcast | Text selection range |
| `code` | Client → Server/Broadcast | Full file content |
| `init` | Server → Client | Initialization message |
| `users` | Server → Client | Current users list |

## Project Structure

```
codecollab/
├── src/
│   ├── App.tsx          # Main application
│   ├── main.tsx         # React entry point
│   ├── App.css          # Styling
│   └── types.d.ts       # TypeScript declarations
├── public/              # Static assets
├── server.js            # WebSocket server
└── package.json
```

## Collaboration Flow

1. User joins with a name
2. Client connects to WebSocket server
3. Server registers the user and notifies others
4. As users type, code changes are broadcast
5. Cursor positions are continuously updated
6. When someone leaves, the server notifies others

## Customization

- **Theme**: Monaco supports multiple themes (vs-dark, vs, min-dark, min-light)
- **Languages**: Add more languages by extending the language detection
- **Features**: Add file trees, project management, or syntax highlighting options

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

CodeCollab - Code together, in real-time.