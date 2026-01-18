# Open Game World Integration Guide for Bunk

This comprehensive guide will help you integrate an open game world where people can meet, interact, and connect in real-time.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Options](#architecture-options)
3. [Technology Stack](#technology-stack)
4. [Implementation Approaches](#implementation-approaches)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Code Examples](#code-examples)
7. [Backend Requirements](#backend-requirements)
8. [Scaling Considerations](#scaling-considerations)
9. [Best Practices](#best-practices)

---

## Overview

An open game world allows users to:
- Navigate a shared virtual space in real-time
- See other users' avatars moving around
- Interact with other users (chat, react, etc.)
- Have synchronized experiences across all clients

### Key Challenges:
- **Real-time synchronization** - Keep all clients in sync
- **Performance** - Handle many users simultaneously
- **Network efficiency** - Minimize bandwidth usage
- **State management** - Track positions, interactions, etc.
- **Collision detection** - Prevent users from walking through objects
- **Scalability** - Support growing number of users

---

## Architecture Options

### Option 1: Simple 2D World (Recommended for Starting)
**Complexity:** Low  
**Best for:** MVP, small user base (< 1000 concurrent users per world)

```
┌─────────────┐      WebSocket      ┌──────────────┐
│   Client    │ ◄─────────────────► │    Server    │
│ (React      │                     │  (Node.js +  │
│  Native)    │                     │   Socket.io) │
└─────────────┘                     └──────────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │   Database   │
                                    │  (Position   │
                                    │   Storage)   │
                                    └──────────────┘
```

**Pros:**
- Easy to implement
- Works on all platforms (iOS, Android, Web)
- Low bandwidth usage
- Simple coordinate system (x, y)

**Cons:**
- Limited visual appeal
- Simpler interactions

---

### Option 2: 2D World with Advanced Features
**Complexity:** Medium  
**Best for:** Production app with moderate user base

```
┌─────────────┐                    ┌──────────────┐
│   Client    │◄───────────────────►│   Gateway    │
│             │     WebSocket       │    Server    │
└─────────────┘                    └──────┬───────┘
                                          │
                         ┌────────────────┼────────────────┐
                         ▼                ▼                ▼
                  ┌────────────┐   ┌────────────┐  ┌────────────┐
                  │World Server│   │World Server│  │World Server│
                  │   Room 1   │   │   Room 2   │  │   Room 3   │
                  └────────────┘   └────────────┘  └────────────┘
                         │                │                │
                         └────────────────┴────────────────┘
                                          ▼
                                   ┌──────────────┐
                                   │    Redis     │
                                   │ (State Sync) │
                                   └──────────────┘
```

**Features:**
- Multiple rooms/zones
- Advanced pathfinding
- Proximity-based interactions
- Chat system
- Animations and emotes

---

### Option 3: 3D World (Advanced)
**Complexity:** High  
**Best for:** Long-term vision, dedicated resources

Uses: Three.js / Babylon.js / Unity WebGL

**Cons:**
- Requires more development time
- Higher bandwidth and processing power
- Complex to maintain
- Harder to debug

---

## Technology Stack

### Frontend (React Native)

#### Core Libraries:

```json
{
  "react-native-svg": "15.11.2",           // Already installed ✓
  "react-native-gesture-handler": "~2.24.0", // Already installed ✓
  "socket.io-client": "^4.7.0",           // For real-time communication
  "react-native-canvas": "^0.1.38",       // For 2D rendering (optional)
  "@shopify/react-native-skia": "^2.2.10" // Already installed ✓ (High-performance 2D)
}
```

#### Optional Enhancements:
```json
{
  "react-native-game-engine": "^2.0.0",   // Game loop and entity management
  "matter-js": "^0.19.0",                 // Physics engine
  "astar-typescript": "^1.3.0"            // Pathfinding algorithm
}
```

### Backend

#### Recommended Stack:

**Option A: Node.js + Socket.io (Easiest)**
```json
{
  "socket.io": "^4.7.0",
  "express": "^4.18.0",
  "redis": "^4.6.0",
  "ioredis": "^5.3.0"
}
```

**Option B: Colyseus (Game Server Framework)**
```json
{
  "@colyseus/core": "^0.15.0",
  "@colyseus/ws-transport": "^0.15.0"
}
```

**Option C: Cloud Gaming Services**
- **Photon** (photonengine.com) - Managed real-time multiplayer
- **PlayFab** (playfab.com) - Microsoft's gaming backend
- **Agones** (agones.dev) - Kubernetes-based game server hosting

---

## Implementation Approaches

### Approach 1: Top-Down 2D World (Simplest)

Think: Classic Pokémon or early Zelda games

**Visual Style:**
```
╔════════════════════════════╗
║ 🌳      🧑 Alice          ║
║                            ║
║      🧑 Bob                ║
║                    🌳      ║
║  🏠                        ║
║           🧑 Charlie       ║
╚════════════════════════════╝
```

**Coordinates:** Simple (x, y) grid
**Movement:** 8-directional or free movement
**Rendering:** SVG or Canvas

---

### Approach 2: Isometric 2D World (Medium)

Think: Habbo Hotel, Club Penguin

**Visual Style:**
```
       /\
      /  \
     /🧑  \    ← More depth perception
    /______\
   /\  🏠  /\
  /  \    /  \
 /    \  /    \
/______\/______\
```

**Coordinates:** (x, y) mapped to isometric projection
**Movement:** 8-directional, appears 3D
**Rendering:** SVG with transforms or Canvas

---

### Approach 3: Side-Scrolling World

Think: Platformer games, Side-scrolling MMO

**Visual Style:**
```
🌤️
        🧑 ─────  🧑
═══════════════════════  ← Ground
```

**Coordinates:** (x, y) with gravity
**Movement:** Left, right, jump
**Rendering:** Canvas or Skia

---

## Step-by-Step Implementation

### Phase 1: Basic Setup (Week 1)

#### 1.1 Install Dependencies

```bash
npm install socket.io-client
npm install @shopify/react-native-skia  # Already installed
npm install react-native-svg            # Already installed
```

#### 1.2 Project Structure

```
bunk-app-frontend/
├── world/
│   ├── components/
│   │   ├── GameWorld.tsx          # Main world component
│   │   ├── Avatar.tsx             # User avatar component
│   │   ├── Map.tsx                # World map/background
│   │   └── Joystick.tsx           # Movement controller
│   ├── services/
│   │   ├── socket.service.ts      # WebSocket connection
│   │   └── position.service.ts    # Position tracking
│   ├── hooks/
│   │   ├── useWorldState.ts       # World state management
│   │   └── usePlayerMovement.ts   # Player movement logic
│   ├── types/
│   │   └── world.types.ts         # TypeScript definitions
│   └── utils/
│       ├── collision.ts           # Collision detection
│       └── interpolation.ts       # Smooth movement
└── screens/
    └── WorldScreen.tsx            # Main screen for world
```

---

### Phase 2: Core Implementation

#### 2.1 Type Definitions

**File:** `world/types/world.types.ts`

```typescript
export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  username: string;
  position: Position;
  avatar: string;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  timestamp: number;
}

export interface WorldState {
  players: Map<string, Player>;
  worldId: string;
  maxPlayers: number;
}

export interface MovementUpdate {
  playerId: string;
  position: Position;
  direction: string;
  isMoving: boolean;
  timestamp: number;
}

export interface WorldConfig {
  width: number;
  height: number;
  tileSize: number;
  maxPlayers: number;
}
```

---

#### 2.2 Socket Service

**File:** `world/services/socket.service.ts`

```typescript
import io, { Socket } from 'socket.io-client';
import { MovementUpdate, Player, Position } from '../types/world.types';

class SocketService {
  private socket: Socket | null = null;
  private serverUrl = 'http://your-server.com'; // Replace with your server
  
  connect(userId: string, worldId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        auth: {
          userId,
          worldId,
        },
      });

      this.socket.on('connect', () => {
        console.log('Connected to world server');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Send position update
  sendMovement(update: MovementUpdate): void {
    if (this.socket?.connected) {
      this.socket.emit('player:move', update);
    }
  }

  // Listen for other players' movements
  onPlayerMove(callback: (update: MovementUpdate) => void): void {
    this.socket?.on('player:moved', callback);
  }

  // Listen for player joins
  onPlayerJoin(callback: (player: Player) => void): void {
    this.socket?.on('player:joined', callback);
  }

  // Listen for player leaves
  onPlayerLeave(callback: (playerId: string) => void): void {
    this.socket?.on('player:left', callback);
  }

  // Get current players in world
  onWorldState(callback: (players: Player[]) => void): void {
    this.socket?.on('world:state', callback);
  }

  // Send chat message
  sendMessage(message: string): void {
    this.socket?.emit('chat:message', { message, timestamp: Date.now() });
  }

  // Listen for chat messages
  onMessage(callback: (data: { playerId: string; message: string }) => void): void {
    this.socket?.on('chat:message', callback);
  }
}

export default new SocketService();
```

---

#### 2.3 World State Hook

**File:** `world/hooks/useWorldState.ts`

```typescript
import { useEffect, useState } from 'react';
import { Player } from '../types/world.types';
import socketService from '../services/socket.service';

export const useWorldState = (userId: string, worldId: string) => {
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to server
    socketService.connect(userId, worldId)
      .then(() => setIsConnected(true))
      .catch((error) => console.error('Failed to connect:', error));

    // Listen for initial world state
    socketService.onWorldState((playerList) => {
      const playersMap = new Map<string, Player>();
      playerList.forEach((player) => {
        playersMap.set(player.id, player);
      });
      setPlayers(playersMap);
    });

    // Listen for player movements
    socketService.onPlayerMove((update) => {
      setPlayers((prev) => {
        const newPlayers = new Map(prev);
        const player = newPlayers.get(update.playerId);
        if (player) {
          player.position = update.position;
          player.direction = update.direction as any;
          player.isMoving = update.isMoving;
          player.timestamp = update.timestamp;
        }
        return newPlayers;
      });
    });

    // Listen for new players
    socketService.onPlayerJoin((player) => {
      setPlayers((prev) => {
        const newPlayers = new Map(prev);
        newPlayers.set(player.id, player);
        return newPlayers;
      });
    });

    // Listen for players leaving
    socketService.onPlayerLeave((playerId) => {
      setPlayers((prev) => {
        const newPlayers = new Map(prev);
        newPlayers.delete(playerId);
        return newPlayers;
      });
    });

    // Cleanup
    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, [userId, worldId]);

  return { players, isConnected };
};
```

---

#### 2.4 Player Movement Hook

**File:** `world/hooks/usePlayerMovement.ts`

```typescript
import { useEffect, useState, useRef } from 'react';
import { Position } from '../types/world.types';
import socketService from '../services/socket.service';

interface UsePlayerMovementProps {
  playerId: string;
  initialPosition: Position;
  speed?: number;
}

export const usePlayerMovement = ({
  playerId,
  initialPosition,
  speed = 5,
}: UsePlayerMovementProps) => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [isMoving, setIsMoving] = useState(false);
  
  const movementInterval = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(Date.now());

  // Send position updates (throttled)
  useEffect(() => {
    const now = Date.now();
    // Only send updates every 50ms to reduce network traffic
    if (now - lastUpdateTime.current > 50) {
      socketService.sendMovement({
        playerId,
        position,
        direction,
        isMoving,
        timestamp: now,
      });
      lastUpdateTime.current = now;
    }
  }, [position, direction, isMoving, playerId]);

  const movePlayer = (newDirection: 'up' | 'down' | 'left' | 'right') => {
    setDirection(newDirection);
    setIsMoving(true);

    // Clear existing interval
    if (movementInterval.current) {
      clearInterval(movementInterval.current);
    }

    // Start movement loop
    movementInterval.current = setInterval(() => {
      setPosition((prev) => {
        const newPos = { ...prev };
        
        switch (newDirection) {
          case 'up':
            newPos.y = Math.max(0, prev.y - speed);
            break;
          case 'down':
            newPos.y = Math.min(1000, prev.y + speed); // Max world height
            break;
          case 'left':
            newPos.x = Math.max(0, prev.x - speed);
            break;
          case 'right':
            newPos.x = Math.min(1000, prev.x + speed); // Max world width
            break;
        }
        
        return newPos;
      });
    }, 16); // ~60 FPS
  };

  const stopMoving = () => {
    setIsMoving(false);
    if (movementInterval.current) {
      clearInterval(movementInterval.current);
      movementInterval.current = null;
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (movementInterval.current) {
        clearInterval(movementInterval.current);
      }
    };
  }, []);

  return {
    position,
    direction,
    isMoving,
    movePlayer,
    stopMoving,
    setPosition,
  };
};
```

---

#### 2.5 Avatar Component

**File:** `world/components/Avatar.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Player } from '../types/world.types';

interface AvatarProps {
  player: Player;
  isCurrentUser?: boolean;
  scale?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  player, 
  isCurrentUser = false,
  scale = 1 
}) => {
  // Simple emoji-based avatar (you can replace with images)
  const getAvatarEmoji = () => {
    switch (player.direction) {
      case 'up': return '🧑';
      case 'down': return '🧍';
      case 'left': return '🚶';
      case 'right': return '🚶';
      default: return '🧍';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          left: player.position.x,
          top: player.position.y,
          transform: [
            { scale },
            { 
              scaleX: player.direction === 'left' ? -1 : 1 // Flip for left direction
            }
          ],
        },
      ]}
    >
      <Text style={styles.avatar}>{getAvatarEmoji()}</Text>
      <View style={[styles.nameTag, isCurrentUser && styles.currentUserTag]}>
        <Text style={styles.nameText}>{player.username}</Text>
      </View>
      {player.isMoving && (
        <View style={styles.movingIndicator} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 1,
  },
  avatar: {
    fontSize: 40,
  },
  nameTag: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  currentUserTag: {
    backgroundColor: 'rgba(108, 92, 231, 0.9)',
  },
  nameText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  movingIndicator: {
    position: 'absolute',
    bottom: -5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ECDC4',
  },
});
```

---

#### 2.6 Joystick Component

**File:** `world/components/Joystick.tsx`

```typescript
import React, { useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';

interface JoystickProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right' | null) => void;
  size?: number;
}

export const Joystick: React.FC<JoystickProps> = ({ 
  onMove, 
  size = 120 
}) => {
  const [knobPosition, setKnobPosition] = React.useState({ x: 0, y: 0 });
  const centerX = size / 2;
  const centerY = size / 2;
  const maxDistance = size / 3;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        
        // Calculate distance from center
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Limit knob to maxDistance
        let x = dx;
        let y = dy;
        
        if (distance > maxDistance) {
          const angle = Math.atan2(dy, dx);
          x = Math.cos(angle) * maxDistance;
          y = Math.sin(angle) * maxDistance;
        }
        
        setKnobPosition({ x, y });
        
        // Determine direction
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        let direction: 'up' | 'down' | 'left' | 'right' | null = null;
        
        if (distance > 10) { // Dead zone
          if (angle >= -45 && angle < 45) {
            direction = 'right';
          } else if (angle >= 45 && angle < 135) {
            direction = 'down';
          } else if (angle >= -135 && angle < -45) {
            direction = 'up';
          } else {
            direction = 'left';
          }
        }
        
        onMove(direction);
      },
      onPanResponderRelease: () => {
        setKnobPosition({ x: 0, y: 0 });
        onMove(null);
      },
    })
  ).current;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.base} />
      <View
        style={[
          styles.knob,
          {
            transform: [
              { translateX: knobPosition.x },
              { translateY: knobPosition.y },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  base: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    position: 'absolute',
  },
  knob: {
    width: '40%',
    height: '40%',
    borderRadius: 1000,
    backgroundColor: 'rgba(108, 92, 231, 0.8)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
```

---

#### 2.7 Game World Component

**File:** `world/components/GameWorld.tsx`

```typescript
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Avatar } from './Avatar';
import { Joystick } from './Joystick';
import { useWorldState } from '../hooks/useWorldState';
import { usePlayerMovement } from '../hooks/usePlayerMovement';

interface GameWorldProps {
  userId: string;
  username: string;
  worldId: string;
}

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export const GameWorld: React.FC<GameWorldProps> = ({
  userId,
  username,
  worldId,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // World state (all players)
  const { players, isConnected } = useWorldState(userId, worldId);
  
  // Current player movement
  const {
    position,
    direction,
    isMoving,
    movePlayer,
    stopMoving,
  } = usePlayerMovement({
    playerId: userId,
    initialPosition: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 },
    speed: 5,
  });

  // Camera follow (center on player)
  useEffect(() => {
    if (scrollViewRef.current) {
      const scrollX = Math.max(0, position.x - SCREEN_WIDTH / 2);
      const scrollY = Math.max(0, position.y - SCREEN_HEIGHT / 2);
      
      scrollViewRef.current.scrollTo({
        x: scrollX,
        y: scrollY,
        animated: false,
      });
    }
  }, [position]);

  const handleJoystickMove = (
    dir: 'up' | 'down' | 'left' | 'right' | null
  ) => {
    if (dir) {
      movePlayer(dir);
    } else {
      stopMoving();
    }
  };

  return (
    <View style={styles.container}>
      {!isConnected && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Connecting to world...</Text>
        </View>
      )}
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <ScrollView
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View
            style={[
              styles.world,
              { width: WORLD_WIDTH, height: WORLD_HEIGHT },
            ]}
          >
            {/* Render background/map here */}
            <View style={styles.background} />
            
            {/* Render all players */}
            {Array.from(players.values()).map((player) => (
              <Avatar
                key={player.id}
                player={player}
                isCurrentUser={player.id === userId}
              />
            ))}
            
            {/* Current player (always rendered on top) */}
            <Avatar
              player={{
                id: userId,
                username,
                position,
                direction,
                isMoving,
                avatar: '🧍',
                timestamp: Date.now(),
              }}
              isCurrentUser
            />
          </View>
        </ScrollView>
      </ScrollView>

      {/* Controls */}
      <View style={styles.controls}>
        <Joystick onMove={handleJoystickMove} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // Sky blue
  },
  scrollView: {
    flex: 1,
  },
  world: {
    position: 'relative',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#90EE90', // Grass green
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    right: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

---

#### 2.8 World Screen (Integration)

**File:** `screens/WorldScreen.tsx`

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GameWorld } from '../world/components/GameWorld';
import { useSignedInUser } from '../util/util'; // Your existing hook

export const WorldScreen = () => {
  const signedInUser = useSignedInUser();
  
  if (!signedInUser) {
    return null; // Or redirect to login
  }

  return (
    <View style={styles.container}>
      <GameWorld
        userId={signedInUser.personUuid}
        username={signedInUser.name || 'Anonymous'}
        worldId="main-world" // Can be dynamic based on clubs, etc.
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

---

## Backend Requirements

### Option 1: Node.js + Socket.io Server

**File:** `server/index.js`

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Configure properly for production
    methods: ['GET', 'POST'],
  },
});

const redis = new Redis(); // For scaling across multiple servers

// In-memory store for single-server setup
const worlds = new Map();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  const { userId, worldId } = socket.handshake.auth;
  
  if (!worlds.has(worldId)) {
    worlds.set(worldId, new Map());
  }
  
  const world = worlds.get(worldId);
  
  // Join world room
  socket.join(worldId);
  
  // Send current world state to new player
  const players = Array.from(world.values());
  socket.emit('world:state', players);
  
  // Add player to world
  const player = {
    id: userId,
    username: userId, // Replace with actual username
    position: { x: 500, y: 500 },
    direction: 'down',
    isMoving: false,
    timestamp: Date.now(),
  };
  
  world.set(userId, player);
  
  // Notify others about new player
  socket.to(worldId).emit('player:joined', player);
  
  // Handle player movement
  socket.on('player:move', (update) => {
    const player = world.get(userId);
    if (player) {
      player.position = update.position;
      player.direction = update.direction;
      player.isMoving = update.isMoving;
      player.timestamp = update.timestamp;
      
      // Broadcast to others in the world
      socket.to(worldId).emit('player:moved', update);
    }
  });
  
  // Handle chat messages
  socket.on('chat:message', (data) => {
    io.to(worldId).emit('chat:message', {
      playerId: userId,
      message: data.message,
      timestamp: Date.now(),
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    world.delete(userId);
    socket.to(worldId).emit('player:left', userId);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`World server running on port ${PORT}`);
});
```

---

### Option 2: Colyseus Server (Recommended for Production)

**Installation:**
```bash
npm install colyseus @colyseus/ws-transport
```

**File:** `server/rooms/WorldRoom.ts`

```typescript
import { Room, Client } from 'colyseus';

interface Player {
  x: number;
  y: number;
  username: string;
  direction: string;
  isMoving: boolean;
}

export class WorldRoom extends Room {
  maxClients = 50;

  onCreate(options: any) {
    console.log('World room created!', options);
    
    // Set state
    this.setState({
      players: {},
    });

    // Handle player movement
    this.onMessage('move', (client, data) => {
      const player = this.state.players[client.sessionId];
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.direction = data.direction;
        player.isMoving = data.isMoving;
      }
    });

    // Update loop (optional, for server-side physics)
    this.setSimulationInterval((deltaTime) => {
      // Server-side logic here
    }, 16); // ~60 FPS
  }

  onJoin(client: Client, options: any) {
    console.log('Player joined:', client.sessionId);
    
    // Create player
    this.state.players[client.sessionId] = {
      x: 500,
      y: 500,
      username: options.username,
      direction: 'down',
      isMoving: false,
    };
  }

  onLeave(client: Client, consented: boolean) {
    console.log('Player left:', client.sessionId);
    delete this.state.players[client.sessionId];
  }

  onDispose() {
    console.log('Room disposed');
  }
}
```

---

## Scaling Considerations

### 1. Spatial Partitioning (Area of Interest)

Only send updates about players within visible range:

```typescript
const VISIBILITY_RANGE = 500; // pixels

function getPlayersInRange(position: Position, allPlayers: Map<string, Player>) {
  return Array.from(allPlayers.values()).filter((player) => {
    const distance = Math.sqrt(
      Math.pow(player.position.x - position.x, 2) +
      Math.pow(player.position.y - position.y, 2)
    );
    return distance <= VISIBILITY_RANGE;
  });
}
```

### 2. State Interpolation

Smooth movement between position updates:

```typescript
function interpolatePosition(
  current: Position,
  target: Position,
  alpha: number
): Position {
  return {
    x: current.x + (target.x - current.x) * alpha,
    y: current.y + (target.y - current.y) * alpha,
  };
}
```

### 3. Update Throttling

Limit network updates:

```typescript
const UPDATE_RATE = 20; // Updates per second
const UPDATE_INTERVAL = 1000 / UPDATE_RATE;

let lastUpdate = 0;

function shouldSendUpdate() {
  const now = Date.now();
  if (now - lastUpdate >= UPDATE_INTERVAL) {
    lastUpdate = now;
    return true;
  }
  return false;
}
```

### 4. Multiple World Instances

Distribute players across multiple servers:

```
World 1 (0-49 players)    → Server 1
World 2 (50-99 players)   → Server 2
World 3 (100-149 players) → Server 3
```

---

## Best Practices

### 1. **Start Simple**
- Begin with a small world (1000x1000 pixels)
- Support 10-20 concurrent users first
- Use simple sprite avatars or emojis
- Top-down 2D view

### 2. **Optimize Network Traffic**
- Only send position changes, not full state
- Throttle updates (20-30 per second max)
- Use binary protocols for production (MessagePack, Protocol Buffers)
- Implement Area of Interest (only send nearby players)

### 3. **Handle Edge Cases**
- Network disconnections
- Player teleportation (when position jumps too far)
- Collision detection
- Boundary checks

### 4. **User Experience**
- Smooth interpolation between positions
- Loading states
- Error messages
- Reconnection logic

### 5. **Security**
- Validate all position updates on server
- Rate limit movement updates
- Prevent cheating (teleportation, speed hacks)
- Sanitize chat messages

---

## Integration with Existing Bunk App

### Add to Navigation

```typescript
// In your navigation config
<Stack.Screen 
  name="World" 
  component={WorldScreen}
  options={{ headerShown: false }}
/>
```

### Add World Button to Profile/Home

```typescript
<Button
  title="Enter World 🌍"
  onPress={() => navigation.navigate('World')}
/>
```

### Use Existing User Data

```typescript
const signedInUser = useSignedInUser();

<GameWorld
  userId={signedInUser.personUuid}
  username={signedInUser.name}
  worldId={signedInUser.pendingClub || 'lobby'}
/>
```

---

## Next Steps

### Immediate (Week 1-2):
1. ✅ Set up Socket.io server
2. ✅ Implement basic player movement
3. ✅ Add joystick controls
4. ✅ Test with 2-3 devices

### Short-term (Week 3-4):
1. Add chat system
2. Implement proximity-based interactions
3. Add emotes/reactions
4. Create multiple worlds/rooms

### Medium-term (Month 2-3):
1. Add mini-games within world
2. Implement pathfinding
3. Add collision detection
4. Create diverse environments

### Long-term:
1. 3D world option
2. Voice chat integration
3. In-world events
4. Virtual items/customization

---

## Resources

### Documentation:
- **Socket.io**: https://socket.io/docs/
- **Colyseus**: https://docs.colyseus.io/
- **React Native Skia**: https://shopify.github.io/react-native-skia/

### Tutorials:
- **Multiplayer Game Tutorial**: https://www.youtube.com/watch?v=PfSwUOBL1YQ
- **Real-time Apps with Socket.io**: https://socket.io/get-started/chat

### Similar Apps:
- **Gather.town** - Video chat in virtual spaces
- **Spatial.io** - VR/AR collaboration
- **Mozilla Hubs** - 3D social spaces

---

## Support

For questions or issues:
1. Check Socket.io documentation
2. Test with simple examples first
3. Use browser developer tools for debugging
4. Monitor network traffic

**Good luck building your open world! Start simple and iterate. 🚀**