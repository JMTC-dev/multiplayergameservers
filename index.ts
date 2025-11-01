import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import {
  initializeGame,
  playCard,
  drawCard,
  callUno,
  challengeUno,
} from './lib/games/uno/logic/gameEngine';
import { DEFAULT_GAME_CONFIG } from './lib/games/uno/types';
import type { GameState, Player } from './lib/games/uno/types';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Room state interface
interface RoomState {
  gameState: GameState | null;
  players: Array<{ id: string; name: string; connectionId: string }>;
  connections: Map<string, Socket>;
}

// Store game rooms in memory
const rooms = new Map<string, RoomState>();

// Helper function to get or create room
function getRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      gameState: null,
      players: [],
      connections: new Map(),
    });
  }
  return rooms.get(roomId)!;
}

// Helper to broadcast to room
function broadcastToRoom(roomId: string, event: string, data: any) {
  io.to(roomId).emit(event, data);
}

io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);

  // Join game room
  socket.on(
    'join_game',
    ({ roomId, playerName }: { roomId: string; playerName: string }) => {
      console.log(`${playerName} joining room ${roomId}`);

      const room = getRoom(roomId);
      socket.join(roomId);

      // Check if player already exists
      let player = room.players.find((p) => p.name === playerName);

      if (!player) {
        player = {
          id: socket.id,
          name: playerName,
          connectionId: socket.id,
        };
        room.players.push(player);
      } else {
        // Update connection ID for reconnecting player
        player.connectionId = socket.id;
        player.id = socket.id;
      }

      room.connections.set(socket.id, socket);

      // Send current game state
      if (room.gameState) {
        socket.emit('game_state', { state: room.gameState });
      }

      // Notify others
      broadcastToRoom(roomId, 'player_joined', { player });

      console.log(`Room ${roomId} now has ${room.players.length} players`);
    }
  );

  // Start game
  socket.on('start_game', ({ roomId }: { roomId: string }) => {
    console.log(`Starting game in room ${roomId}`);

    const room = getRoom(roomId);

    if (room.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    try {
      const playerData: Player[] = room.players.map((p) => ({
        id: p.id,
        name: p.name,
        hand: [],
        isConnected: true,
      }));

      room.gameState = initializeGame(playerData);

      broadcastToRoom(roomId, 'game_started', { state: room.gameState });
      console.log(`Game started in room ${roomId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Handle game actions
  socket.on('game_action', ({ roomId, action }: { roomId: string; action: any }) => {
    const room = getRoom(roomId);

    if (!room.gameState) {
      socket.emit('error', { message: 'Game not started' });
      return;
    }

    try {
      let result: { state: GameState; error?: string };

      switch (action.type) {
        case 'play_card':
          result = playCard(room.gameState, {
            type: 'play_card',
            playerId: action.playerId,
            card: action.card,
            chosenColor: action.chosenColor,
          });
          break;

        case 'draw_card':
          result = drawCard(room.gameState, action.playerId);
          break;

        case 'call_uno':
          result = callUno(room.gameState, action.playerId);
          break;

        case 'challenge_uno':
          result = challengeUno(
            room.gameState,
            action.challengerId,
            action.targetPlayerId
          );
          break;

        default:
          socket.emit('error', { message: 'Unknown action type' });
          return;
      }

      // Check if there was an error
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      room.gameState = result.state;

      // Check for winner
      const winner = result.state.players.find((p) => p.hand.length === 0);
      if (winner) {
        broadcastToRoom(roomId, 'game_over', {
          winnerId: winner.id,
          winnerName: winner.name,
        });
      } else {
        broadcastToRoom(roomId, 'game_state', { state: result.state });
      }
    } catch (error: any) {
      console.error('Error processing game action:', error);
      socket.emit('error', {
        message: error.message || 'Invalid move',
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Find and update player connection status
    rooms.forEach((room, roomId) => {
      const player = room.players.find((p) => p.connectionId === socket.id);
      if (player) {
        room.connections.delete(socket.id);
        console.log(`Player ${player.name} disconnected from room ${roomId}`);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
