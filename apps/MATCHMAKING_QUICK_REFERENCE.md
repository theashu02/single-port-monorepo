# Matchmaking Quick Reference

## 🎯 Implementation Status: ✅ COMPLETE

All features implemented with **memory-optimized architecture**.

---

## 🚀 How to Start

### Backend (WebSocket Service)
```bash
cd apps/websocket_service
bun run dev
# Listen on: ws://localhost:3001/ws
```

### Frontend (Web App)
```bash
cd apps/web_application
npm run dev
# Navigate to: http://localhost:3000/app/discover
```

### Redis (Required)
```bash
redis-server
# Default: localhost:6379
```

---

## 📡 WebSocket Messages

### Client → Server
```typescript
// Join matchmaking queue
{ type: "matchmake_join" }

// Leave matchmaking queue
{ type: "matchmake_leave" }

// Confirm match and subscribe to room
{ type: "matchmake_ready", channel: "room:abc-def" }
```

### Server → Client
```typescript
// User entered queue
{ type: "matchmake_queued", position: 3 }

// Match found!
{ 
  type: "matchmake_found", 
  peer: { id: "guest:xyz", name: "Alice" },
  channel: "room:abc-def" 
}

// Match cancelled
{ 
  type: "matchmake_cancelled", 
  reason: "user_left" | "user_disconnected" | "already_busy" 
}

// Room ready for messaging (sent after matchmake_ready)
{ type: "chat_ready", channel: "room:abc-def" }
```

---

## 🗄️ Redis Keys

| Key | Type | Purpose | TTL |
|-----|------|---------|-----|
| `matchmaking:queue` | List | FIFO queue of userIds | None |
| `matchmaking:waiting` | Hash | userId → timestamp | 24h |
| `matchmaking:poller-lock` | String | Distributed lock | 5s |

---

## 🔍 Quick Debug Commands

```bash
# Check queue state
redis-cli LLEN matchmaking:queue        # Queue length (may include stale)
redis-cli HLEN matchmaking:waiting      # Active users (accurate)

# View contents
redis-cli LRANGE matchmaking:queue 0 -1
redis-cli HGETALL matchmaking:waiting

# Monitor live
redis-cli MONITOR | grep matchmaking

# Reset (testing)
redis-cli DEL matchmaking:queue matchmaking:waiting matchmaking:poller-lock
```

---

## 📊 Key Metrics

| Metric | Target | Red Flag |
|--------|--------|----------|
| Match time | <1 second | >3 seconds |
| Queue length vs waiting count | ±10% | >50% difference |
| Stale entries cleaned | 0-5 per cycle | >10 per cycle |
| Pair failed rate | <5% | >20% |

---

## 🐛 Common Issues

### Users not matching
1. Check poller is running: `redis-cli GET matchmaking:poller-lock`
2. Verify both users in waiting: `redis-cli HGETALL matchmaking:waiting`
3. Check logs for `matchmaking.pair_failed`

### Memory leak suspected
1. Compare queue vs waiting: 
   ```bash
   redis-cli LLEN matchmaking:queue
   redis-cli HLEN matchmaking:waiting
   ```
2. Wait 30s for cleanup cycle
3. Check cleanup logs: `staleEntriesRemoved` should be low

### Match found but chat not opening
1. Check if `matchmake_ready` was sent from frontend
2. Verify socket subscribed to channel (backend logs)
3. Check `chat_ready` event received

---

## 🎨 UI States

| Phase | User Sees | Actions |
|-------|-----------|---------|
| `idle` | "Start Matching" button | Click to join queue |
| `searching` | Pulsing animation, timer, position | Click "Cancel" to leave |
| `found` | "Match Found!" celebration | Auto-opens ChatWindow |

---

## 🔧 Configuration

### Backend (`apps/websocket_service/src/features/matchmaking/handlers.ts`)
```typescript
const POLLER_INTERVAL_MS = 500;        // How often to check for pairs
const CLEANUP_INTERVAL_MS = 30000;     // How often to clean stale entries
```

### Redis (`apps/websocket_service/src/state/redis-realtime.ts`)
```typescript
const MATCHMAKING_LOCK_KEY TTL = 5;    // Distributed lock expiry
const MATCHMAKING_WAITING_KEY TTL = 24h; // Waiting hash expiry
```

---

## 📝 Log Events

| Event | Meaning | Expected Frequency |
|-------|---------|-------------------|
| `matchmaking.joined` | User entered queue | Per user join |
| `matchmaking.left` | User left queue | Per user leave |
| `matchmaking.paired` | Successful match | Every 1-2 seconds |
| `matchmaking.pair_failed` | Match attempt failed | <5% of attempts |
| `matchmaking.queue_cleanup` | Stale cleanup ran | Every 30 seconds |
| `matchmaking.poller_started` | Poller initialized | On service start |

---

## 🧪 Test Scenarios

### Basic Match
```
1. Open 2 tabs → both click "Start Matching"
2. Expected: Match within 1s, chat opens
```

### Cancel Flow
```
1. Tab A: "Start Matching" → "Cancel"
2. Tab B: "Start Matching" 
3. Expected: B stays in queue, A doesn't match
```

### Disconnect Cleanup
```
1. Tab A: "Start Matching" → close tab
2. Redis: HGETALL matchmaking:waiting
3. Expected: User A removed within 30s
```

---

## 🎯 Performance Targets

| Metric | Value | Notes |
|--------|-------|-------|
| Memory per user | ~90 bytes | userId + timestamp |
| Redis ops/sec | ~50 | At 100 users in queue |
| Match latency | <1s | Typical case |
| Max scale | 10,000 users | <1 MB Redis memory |

---

## 📚 Full Documentation

- **Memory Optimizations**: [apps/websocket_service/MATCHMAKING_MEMORY_OPTIMIZATIONS.md](websocket_service/MATCHMAKING_MEMORY_OPTIMIZATIONS.md)
- **Verification Checklist**: [apps/websocket_service/VERIFICATION_CHECKLIST.md](websocket_service/VERIFICATION_CHECKLIST.md)
- **Implementation Summary**: [MATCHMAKING_IMPLEMENTATION_SUMMARY.md](../MATCHMAKING_IMPLEMENTATION_SUMMARY.md)
- **Original Plan**: [implementation-plan.md](../implementation-plan.md)

---

## ✅ Status

**Implementation**: ✅ Complete  
**Memory Management**: ✅ Optimized  
**Production Ready**: ✅ Yes  

**Last Updated**: 2026-07-03
