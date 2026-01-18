# Open World Implementation for Bunk

This directory contains the implementation of the open game world feature where users can meet and interact in real-time.

## 📁 Directory Structure

```
world/
├── components/          # React Native UI components
│   ├── GameWorld.tsx   # Main world container
│   ├── Avatar.tsx      # Player avatar component
│   ├── Joystick.tsx    # Movement controls
│   ├── Map.tsx         # World map/background
│   └── ChatBubble.tsx  # In-world chat
├── services/           # External services
│   ├── socket.service.ts    # WebSocket connection
│   └── position.service.ts  # Position tracking
├── hooks/              # React hooks
│   ├── useWorldState.ts     # World state management
│   └── usePlayerMovement.ts # Player movement logic
├── types/              # TypeScript definitions
│   └── world.types.ts  # Type definitions
├── utils/              # Utility functions
│   ├── collision.ts    # Collision detection
│   └── interpolation.ts # Smooth movement
└── README.md          # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install socket.io-client
```

### 2. Set Up Backend Server

You need a server to handle real-time communication. See the main guide for server setup options.

**Quick server with Socket.io:**

```javascript
// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const worlds = new Map();

io.on('connection', (socket) => {
  const { userId, worldId } = socket.handshake.auth;
  
  if (!worlds.has(worldId)) {
    worlds.set(worldId, new Map());
  }
  
  const world = worlds.get(worldId);
  socket.join(worldId);
  
  // Send current players
  socket.emit('world:state', Array.from(world.values()));
  
  // Add new player
  const player = {
    id: userId,
    username: 'User' + userId.slice(0, 4),
    position: { x: 500, y: 500 },
    direction: 'down',
    isMoving: false
  };
  world.set(userId, player);
  socket.to(worldId).emit('player:joined', player);
  
  // Handle movement
  socket.on('player:move', (update) => {
    const player = world.get(userId);
    if (player) {
      Object.assign(player, update);
      socket.to(worldId).emit('player:moved', update);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    world.delete(userId);
    socket.to(worldId).emit('player:left', userId);
  });
});

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
```

Run with: `node server.js`

### 3. Add to Your App

```tsx
import { WorldScreen } from './screens/WorldScreen';

// In your navigation
<Stack.Screen name="World" component={WorldScreen} />

// Navigate to world
navigation.navigate('World');
```

## 🎮 Basic Usage

### Simple Implementation

```tsx
import React from 'react';
import { View } from 'react-native';
import { GameWorld } from './world/components/GameWorld';

export const WorldScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <GameWorld
        userId="user-123"
        username="Alice"
        worldId="main-world"
      />
    </View>
  );
};
```

## 🔧 Configuration

### Update Server URL

In `world/services/socket.service.ts`, update the server URL:

```typescript
private serverUrl = 'http://your-server.com:3001';
// For local testing: 'http://localhost:3001'
// For production: 'https://api.yourdomain.com'
```

### Customize World Size

In `world/components/GameWorld.tsx`:

```typescript
const WORLD_WIDTH = 2000;  // World width in pixels
const WORLD_HEIGHT = 2000; // World height in pixels
```

### Adjust Movement Speed

In `world/hooks/usePlayerMovement.ts`:

```typescript
speed = 5  // Pixels per frame (default is 5)
```

## 🎨 Customization

### Change Avatar Appearance

Edit `world/components/Avatar.tsx`:

```tsx
// Use images instead of emojis
<Image
  source={require('../assets/avatars/player.png')}
  style={{ width: 40, height: 40 }}
/>

// Or use different emojis
const getAvatarEmoji = () => {
  return player.avatar || '🧑';
};
```

### Custom Map/Background

Edit `world/components/GameWorld.tsx`:

```tsx
// Instead of solid color
<View style={styles.background} />

// Use image
<Image
  source={require('../assets/maps/grass-world.png')}
  style={styles.background}
/>

// Or use SVG
<Svg width={WORLD_WIDTH} height={WORLD_HEIGHT}>
  {/* Your SVG elements */}
</Svg>
```

### Add Collision Detection

```typescript
// world/utils/collision.ts
export function checkCollision(
  position: Position,
  obstacles: Rectangle[]
): boolean {
  return obstacles.some(obstacle => 
    position.x >= obstacle.x &&
    position.x <= obstacle.x + obstacle.width &&
    position.y >= obstacle.y &&
    position.y <= obstacle.y + obstacle.height
  );
}

// Use in movement hook
if (!checkCollision(newPos, obstacles)) {
  setPosition(newPos);
}
```

## 📡 Network Events

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `player:move` | `{ playerId, position, direction, isMoving }` | Player moved |
| `chat:message` | `{ message, timestamp }` | Send chat message |
| `player:interact` | `{ targetId }` | Interact with player |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `world:state` | `Player[]` | Initial world state |
| `player:joined` | `Player` | New player joined |
| `player:moved` | `MovementUpdate` | Player moved |
| `player:left` | `string` | Player disconnected |
| `chat:message` | `{ playerId, message }` | Chat message received |

## 🐛 Debugging

### Check Connection Status

```tsx
const { isConnected } = useWorldState(userId, worldId);

console.log('Connected:', isConnected);
```

### Monitor Network Traffic

```typescript
// In socket.service.ts
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

### Test Locally

1. Run server: `node server.js`
2. Connect web client: `npm run web`
3. Open in browser: `http://localhost:19006`
4. Open multiple tabs to simulate multiple users

## 🚀 Performance Optimization

### 1. Throttle Position Updates

```typescript
// Send updates max 20 times per second
const UPDATE_INTERVAL = 50; // ms

if (Date.now() - lastUpdate > UPDATE_INTERVAL) {
  socketService.sendMovement(update);
  lastUpdate = Date.now();
}
```

### 2. Area of Interest (Only Render Nearby Players)

```typescript
const RENDER_DISTANCE = 800; // pixels

const nearbyPlayers = Array.from(players.values()).filter(player => {
  const dx = player.position.x - currentPlayer.position.x;
  const dy = player.position.y - currentPlayer.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= RENDER_DISTANCE;
});
```

### 3. Use React.memo for Avatars

```tsx
export const Avatar = React.memo<AvatarProps>(({ player }) => {
  // Component code
}, (prev, next) => {
  return (
    prev.player.position.x === next.player.position.x &&
    prev.player.position.y === next.player.position.y &&
    prev.player.isMoving === next.player.isMoving
  );
});
```

## 📱 Platform-Specific Notes

### iOS
- WebSockets work out of the box
- Test with physical device for best performance
- May need to allow local network access

### Android
- Add `android:usesCleartextTraffic="true"` to AndroidManifest.xml for HTTP connections
- Use HTTPS in production
- Test with USB debugging enabled

### Web
- Works in all modern browsers
- Use browser DevTools for debugging
- Test in multiple browsers

## 🔐 Security Considerations

### Validate on Server

```javascript
// Don't trust client positions
socket.on('player:move', (update) => {
  const player = world.get(userId);
  if (!player) return;
  
  // Validate movement distance
  const dx = update.position.x - player.position.x;
  const dy = update.position.y - player.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const MAX_SPEED = 10; // pixels per update
  if (distance > MAX_SPEED) {
    console.warn('Suspicious movement detected:', userId);
    return; // Reject update
  }
  
  // Update player
  Object.assign(player, update);
  socket.to(worldId).emit('player:moved', update);
});
```

### Rate Limiting

```javascript
const rateLimit = new Map();

socket.on('player:move', (update) => {
  const now = Date.now();
  const lastUpdate = rateLimit.get(userId) || 0;
  
  if (now - lastUpdate < 50) { // Min 50ms between updates
    return; // Ignore
  }
  
  rateLimit.set(userId, now);
  // Process update...
});
```

## 📊 Scaling

### Single Server
- Good for: 50-100 concurrent users
- Setup: Simple Node.js + Socket.io
- Cost: Low

### Multiple Servers with Redis
- Good for: 100-1000 concurrent users
- Setup: Load balancer + Redis Pub/Sub
- Cost: Medium

```javascript
const Redis = require('ioredis');
const redis = new Redis();
const redisSub = new Redis();

// Subscribe to position updates
redisSub.subscribe('world:updates');
redisSub.on('message', (channel, message) => {
  const update = JSON.parse(message);
  io.to(update.worldId).emit('player:moved', update);
});

// Publish position updates
socket.on('player:move', (update) => {
  redis.publish('world:updates', JSON.stringify({
    worldId,
    ...update
  }));
});
```

### Dedicated Game Server (Colyseus/Photon)
- Good for: 1000+ concurrent users
- Setup: Managed service or self-hosted Colyseus
- Cost: Higher but more reliable

## 🎯 Next Features to Add

### Phase 2 (After Basic World Works)
- [ ] Chat system with speech bubbles
- [ ] Emotes and reactions
- [ ] Profile cards on tap
- [ ] Friend system integration
- [ ] Proximity voice chat

### Phase 3 (Advanced)
- [ ] Multiple themed worlds
- [ ] Mini-games within world
- [ ] Virtual items and customization
- [ ] Events and gatherings
- [ ] Pathfinding (click to move)

### Phase 4 (Long-term)
- [ ] 3D world option
- [ ] Custom avatars
- [ ] World editor
- [ ] Achievements
- [ ] Leaderboards

## 📚 Additional Resources

- **Full Guide**: See `OPEN-WORLD-GUIDE.md` in project root
- **Socket.io Docs**: https://socket.io/docs/
- **Colyseus Docs**: https://docs.colyseus.io/
- **React Native Skia**: https://shopify.github.io/react-native-skia/

## 🆘 Troubleshooting

### "Cannot connect to server"
- Check server is running: `curl http://localhost:3001`
- Verify server URL in `socket.service.ts`
- Check CORS settings on server
- For Android: Enable cleartext traffic

### "Players not appearing"
- Check browser console for errors
- Verify Socket.io events are firing
- Use `socket.onAny()` to debug all events
- Check that worldId matches on client and server

### "Movement is laggy"
- Reduce update frequency (increase throttle)
- Enable interpolation
- Check network latency
- Implement client-side prediction

### "High CPU usage"
- Use React.memo on components
- Implement Area of Interest
- Reduce animation complexity
- Profile with React DevTools

## 💡 Tips

1. **Start simple** - Get basic movement working first
2. **Test early** - Run with 2-3 devices immediately
3. **Iterate quickly** - Add features one at a time
4. **Monitor performance** - Profile on real devices
5. **Plan for scale** - Design architecture for growth

## 🤝 Contributing

When adding features:
1. Keep components small and focused
2. Add TypeScript types for new data structures
3. Document complex logic
4. Test on multiple devices
5. Consider performance impact

## 📄 License

Same as main Bunk project.

---

**Ready to build your world? Start with the Quick Start section above! 🌍**

For detailed implementation, see the main guide: `OPEN-WORLD-GUIDE.md`
