# UNO Socket.IO Server

Real-time multiplayer UNO game server built with Express, Socket.IO, and TypeScript.

## Features

- Room-based multiplayer game sessions
- Real-time game state synchronization
- Server-authoritative game logic
- Automatic reconnection handling
- TypeScript for type safety

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   npm start
   ```

The server runs on port 3001 by default (configurable via `PORT` environment variable).

## Deployment to Render

### Prerequisites
- GitHub account
- Render account (free tier available)

### Steps

1. **Push to GitHub:**
   ```bash
   # Create a new repository on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/uno-server.git
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com) and sign in
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `uno-server` (or your preferred name)
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Free (or paid for production)
   - Add environment variable:
     - `CLIENT_URL`: Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)
   - Click "Create Web Service"

3. **Update Client:**
   After deployment, update your Next.js client's `.env.local`:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-render-app.onrender.com
   ```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `CLIENT_URL`: Frontend URL for CORS (default: `http://localhost:3000`)

## API Events

### Client → Server

- `join_game`: Join a game room
- `start_game`: Start the game (requires 2+ players)
- `game_action`: Send game action (play card, draw, call UNO, challenge)

### Server → Client

- `game_state`: Current game state
- `game_started`: Game has started
- `game_over`: Game finished with winner
- `player_joined`: Player joined the room
- `error`: Error message

## Tech Stack

- Express.js - Web server
- Socket.IO - WebSocket communication
- TypeScript - Type safety
- Node.js - Runtime environment
