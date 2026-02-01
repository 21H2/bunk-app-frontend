/**
 * Simple Socket.io Server for Open Game World
 *
 * This is a minimal server to get you started with the open world feature.
 * For production, consider using Colyseus or adding Redis for scaling.
 *
 * Installation:
 *   npm install express socket.io cors
 *
 * Run:
 *   node world/example-server.js
 *
 * Test:
 *   Open http://localhost:3001 in browser
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { setInterval } = require('timers');

// Configuration
const PORT = process.env.PORT || 3001;
const MAX_PLAYERS_PER_WORLD = 50;
const UPDATE_RATE_LIMIT = 50; // Minimum ms between updates

// Initialize Express and Socket.io
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Change to your domain in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Data structures
const worlds = new Map(); // worldId -> Map(userId -> player)
const userSockets = new Map(); // userId -> socketId
const rateLimits = new Map(); // socketId -> lastUpdateTime

// Helper: Get or create world
function getWorld(worldId) {
  if (!worlds.has(worldId)) {
    worlds.set(worldId, new Map());
    console.log(`📍 Created new world: ${worldId}`);
  }
  return worlds.get(worldId);
}

// Helper: Validate movement (anti-cheat)
function validateMovement(oldPos, newPos, maxSpeed = 15) {
  if (!oldPos) return true;

  const dx = newPos.x - oldPos.x;
  const dy = newPos.y - oldPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= maxSpeed;
}

// Helper: Check rate limit
function checkRateLimit(socketId) {
  const now = Date.now();
  const lastUpdate = rateLimits.get(socketId) || 0;

  if (now - lastUpdate < UPDATE_RATE_LIMIT) {
    return false;
  }

  rateLimits.set(socketId, now);
  return true;
}

// REST API endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Open World Server',
    worlds: Array.from(worlds.keys()),
    totalPlayers: Array.from(worlds.values()).reduce(
      (sum, world) => sum + world.size,
      0
    ),
  });
});

app.get('/stats', (req, res) => {
  const stats = {};

  worlds.forEach((world, worldId) => {
    stats[worldId] = {
      players: world.size,
      playerList: Array.from(world.values()).map(p => ({
        id: p.id,
        username: p.username,
        position: p.position,
      })),
    };
  });

  res.json(stats);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);

  const { userId, worldId, username } = socket.handshake.auth;

  if (!userId || !worldId) {
    console.error('❌ Missing auth data:', { userId, worldId });
    socket.disconnect();
    return;
  }

  const world = getWorld(worldId);

  // Check world capacity
  if (world.size >= MAX_PLAYERS_PER_WORLD) {
    socket.emit('error', { message: 'World is full' });
    socket.disconnect();
    return;
  }

  // Join world room
  socket.join(worldId);
  userSockets.set(userId, socket.id);

  console.log(`👤 Player ${username || userId} joined world: ${worldId}`);

  // Send current world state to new player
  const currentPlayers = Array.from(world.values());
  socket.emit('world:state', currentPlayers);

  // Create player object
  const player = {
    id: userId,
    username: username || `User${userId.substring(0, 4)}`,
    position: { x: 500, y: 500 }, // Spawn position
    direction: 'down',
    isMoving: false,
    avatar: '🧍',
    timestamp: Date.now(),
  };

  // Add player to world
  world.set(userId, player);

  // Notify other players
  socket.to(worldId).emit('player:joined', player);

  console.log(`✅ ${player.username} spawned at (${player.position.x}, ${player.position.y})`);

  // Handle player movement
  socket.on('player:move', (update) => {
    // Rate limiting
    if (!checkRateLimit(socket.id)) {
      return;
    }

    const player = world.get(userId);
    if (!player) {
      console.error('❌ Player not found:', userId);
      return;
    }

    // Validate movement (anti-cheat)
    if (!validateMovement(player.position, update.position)) {
      console.warn('⚠️ Suspicious movement detected:', {
        userId,
        old: player.position,
        new: update.position,
      });
      // Reset player to last known position
      socket.emit('player:position_reset', { position: player.position });
      return;
    }

    // Update player state
    player.position = update.position;
    player.direction = update.direction;
    player.isMoving = update.isMoving;
    player.timestamp = Date.now();

    // Broadcast to other players in world
    socket.to(worldId).emit('player:moved', {
      playerId: userId,
      position: update.position,
      direction: update.direction,
      isMoving: update.isMoving,
      timestamp: player.timestamp,
    });
  });

  // Handle chat messages
  socket.on('chat:message', (data) => {
    const player = world.get(userId);
    if (!player) return;

    const message = {
      playerId: userId,
      username: player.username,
      message: data.message,
      timestamp: Date.now(),
    };

    console.log(`💬 ${player.username}: ${data.message}`);

    // Broadcast to all players in world (including sender)
    io.to(worldId).emit('chat:message', message);
  });

  // Handle player interactions
  socket.on('player:interact', (data) => {
    const player = world.get(userId);
    const targetPlayer = world.get(data.targetId);

    if (!player || !targetPlayer) return;

    console.log(`🤝 ${player.username} interacted with ${targetPlayer.username}`);

    // Notify both players
    socket.emit('interaction:initiated', {
      targetId: data.targetId,
      targetUsername: targetPlayer.username,
    });

    const targetSocketId = userSockets.get(data.targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('interaction:received', {
        fromId: userId,
        fromUsername: player.username,
      });
    }
  });

  // Handle emotes/reactions
  socket.on('player:emote', (data) => {
    const player = world.get(userId);
    if (!player) return;

    socket.to(worldId).emit('player:emoted', {
      playerId: userId,
      emote: data.emote,
      timestamp: Date.now(),
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Player disconnected: ${userId} (${reason})`);

    // Remove player from world
    world.delete(userId);
    userSockets.delete(userId);
    rateLimits.delete(socket.id);

    // Notify other players
    socket.to(worldId).emit('player:left', userId);

    // Clean up empty worlds
    if (world.size === 0) {
      worlds.delete(worldId);
      console.log(`📍 Deleted empty world: ${worldId}`);
    }

    console.log(`👋 ${username || userId} left. ${world.size} players remaining.`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🌍 Open World Server Started       ║
╚═══════════════════════════════════════╝

📡 Server URL: http://localhost:${PORT}
🌐 WebSocket: ws://localhost:${PORT}
📊 Stats: http://localhost:${PORT}/stats
⚙️  Max players per world: ${MAX_PLAYERS_PER_WORLD}

Ready for connections! 🚀
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');

  // Notify all players
  io.emit('server:shutdown', {
    message: 'Server is shutting down. Please reconnect in a moment.',
  });

  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Periodic cleanup (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  worlds.forEach((world, worldId) => {
    // Remove stale players (no update in 5 minutes)
    world.forEach((player, userId) => {
      if (now - player.timestamp > 300000) {
        world.delete(userId);
        cleanedCount++;
      }
    });

    // Remove empty worlds
    if (world.size === 0) {
      worlds.delete(worldId);
    }
  });

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} stale players`);
  }
}, 300000);

module.exports = { server, io };
