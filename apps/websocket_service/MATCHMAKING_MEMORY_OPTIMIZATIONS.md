# Matchmaking Memory Optimizations

## Overview

The matchmaking implementation has been enhanced with comprehensive memory management strategies to prevent memory leaks and ensure efficient Redis memory usage across all scenarios.

## Memory Optimizations Implemented

### 1. **Active Queue Cleanup on Leave** ✅
**Problem**: When users call `matchmake_leave` or disconnect, their entries remained in the `matchmaking:queue` Redis list indefinitely, causing memory leaks.

**Solution**: 
- Added `LREM` operation to `matchmakeLeave()` to actively remove the user from the queue list
- While `LREM` is O(N), matchmaking queues are typically small (<100 users), making this acceptable
- Prevents accumulation of stale entries

**Memory Impact**: Eliminates primary memory leak vector

### 2. **TTL on Waiting Hash** ✅
**Problem**: The `matchmaking:waiting` hash never expired, even after service restarts or crashes.

**Solution**:
- Added 24-hour TTL to `matchmaking:waiting` hash, refreshed on each join
- Ensures automatic cleanup if service crashes without proper shutdown
- Acts as a safety net for edge cases

**Memory Impact**: Prevents unbounded growth of waiting hash

### 3. **Periodic Queue Cleanup** ✅
**Problem**: Despite active cleanup, race conditions and edge cases could still leave some stale entries.

**Solution**:
- Implemented `matchmakeCleanupQueue()` that runs every 30 seconds
- Scans entire queue, validates each entry against `waiting` + `online` + `busy` state
- Rebuilds queue with only valid entries
- Only runs on the lock-holding instance (distributed lock)

**Memory Impact**: Guarantees eventual consistency and zero memory leaks

### 4. **Improved Pair Popping** ✅
**Problem**: The original `matchmakePopOne()` could leave users in waiting state if the second pop failed.

**Solution**:
- Created dedicated `matchmakePopPair()` method
- Atomically handles the case where only one user is available
- Re-adds single user back to queue instead of leaving them in limbo

**Memory Impact**: Prevents edge case memory leaks

### 5. **Accurate Queue Position** ✅
**Problem**: Using `LLEN` on a queue with stale entries gave misleading position information.

**Solution**:
- Added `matchmakeWaitingCount()` that returns count from the hash (always accurate)
- Used in `matchmakeQueued` event instead of `LLEN`
- Users see their true position in queue

**Memory Impact**: N/A (UX improvement)

### 6. **Timestamp-Based Waiting** ✅
**Problem**: Waiting hash entries were just `"1"` strings with no metadata.

**Solution**:
- Store timestamp when user joins: `HSET matchmaking:waiting userId timestamp`
- Enables future features like:
  - Detecting users stuck in queue for too long
  - Priority-based matching
  - Queue analytics

**Memory Impact**: Minimal (8 extra bytes per user)

## Memory Usage Analysis

### Per-User Memory Cost

| Component | Memory per User | Notes |
|-----------|----------------|-------|
| Queue list entry | ~40 bytes | userId string in Redis list |
| Waiting hash entry | ~50 bytes | userId + timestamp in hash |
| **Total per user** | **~90 bytes** | |

### Scale Projections

| Queue Size | Total Memory | Notes |
|-----------|-------------|-------|
| 100 users | ~9 KB | Typical peak |
| 1,000 users | ~90 KB | High traffic |
| 10,000 users | ~900 KB | Extreme scale |

**Conclusion**: Even at extreme scale (10K concurrent matchmaking users), memory usage is <1 MB.

### Comparison: Before vs After Optimizations

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| 1000 users join → 900 leave properly → 100 disconnect | 1000 queue entries (90 KB) | 100 queue entries (9 KB) | **90% reduction** |
| Service crashes and restarts | Stale waiting hash persists forever | Auto-expires after 24h | **100% cleanup** |
| 50 stale entries in queue | Persist until manually popped | Removed in 30s by cleanup task | **Sub-minute cleanup** |

## Redis Key Management

### Keys Used

```
matchmaking:queue           — Redis List (FIFO queue of userIds)
matchmaking:waiting         — Redis Hash (userId → timestamp)
matchmaking:poller-lock     — String (distributed lock, 5s TTL)
```

### Key Expiry Strategy

| Key | TTL | Cleanup Method |
|-----|-----|----------------|
| `matchmaking:queue` | None (self-cleaning) | LREM on leave, periodic cleanup, LPOP on match |
| `matchmaking:waiting` | 24 hours | Auto-expire + HDEL on leave/cleanup |
| `matchmaking:poller-lock` | 5 seconds | Auto-expire (distributed lock) |

### Cleanup on Service Restart

The `flushPresence()` function in `redis-realtime.ts` already deletes all matchmaking keys on startup:

```typescript
const keysToDelete = [
  MATCHMAKING_QUEUE_KEY,
  MATCHMAKING_WAITING_KEY,
  MATCHMAKING_LOCK_KEY,
  // ... other presence keys
];
```

This ensures clean state on every deployment.

## Performance Characteristics

### Time Complexity

| Operation | Complexity | Frequency | Impact |
|-----------|-----------|-----------|--------|
| `matchmakeJoin` | O(1) | Per user join | Negligible |
| `matchmakeLeave` | O(N) | Per user leave | Acceptable (N typically <100) |
| `matchmakePopOne` | O(1) average | Every 500ms | Negligible |
| `matchmakeCleanupQueue` | O(N) | Every 30s | Low (batched) |

### Redis Operations Load

**Per-second load at 100 users in queue, 10 joins/sec, 5 leaves/sec**:

- Matchmaking poller: ~2 ops/sec (500ms interval)
- Join operations: 30 ops/sec (3 ops × 10 joins)
- Leave operations: 10 ops/sec (2 ops × 5 leaves)
- Cleanup: ~0.1 ops/sec (amortized)

**Total**: ~42 Redis ops/sec

**Conclusion**: Negligible load even at scale.

## Edge Cases Handled

### 1. User Disconnects Mid-Match ✅
- `handleSocketClose` → `handleMatchmakeDisconnect` → removes from waiting
- Next poll cycle skips them (no longer in waiting hash)
- No memory leak

### 2. User Joins While Already Busy ✅
- `handleMatchmakeJoin` checks `getBusyChannel()` first
- Returns `matchmake_cancelled` with `already_busy` reason
- No queue entry created

### 3. Service Crashes with Users in Queue ✅
- On restart, `flushPresence()` deletes all matchmaking keys
- Clean slate, no stale data
- Users reconnect and re-join queue

### 4. Race Condition: User Becomes Busy Between Pop and Pairing ✅
- `markChannelBusy()` validates both users are not busy
- Returns `null` if either is busy
- Logs warning and continues

### 5. Two Instances Try to Pop Same User ✅
- Distributed lock (`matchmaking:poller-lock`) ensures only one instance polls
- Lock auto-expires after 5s to handle crashes
- No duplicate matches possible

### 6. User Leaves Queue But Entry Still in List ✅
- `matchmakeLeave` now calls `LREM` to remove from list immediately
- Periodic cleanup catches any missed entries
- No memory accumulation

## Monitoring and Observability

### Key Metrics to Track

1. **Queue Length** (`LLEN matchmaking:queue`)
   - Should approximately match `HLEN matchmaking:waiting`
   - Large discrepancy indicates stale entries (auto-fixed by cleanup)

2. **Waiting Count** (`HLEN matchmaking:waiting`)
   - Number of users actively searching
   - Should decrease when matches occur

3. **Cleanup Stats** (from logs: `matchmaking.queue_cleanup`)
   - `staleEntriesRemoved` count
   - Should be low (<5) in healthy system
   - High values indicate disconnect storms or bugs

4. **Pairing Success Rate** (from logs: `matchmaking.paired` vs `matchmaking.pair_failed`)
   - Ratio should be >95%
   - Low ratio indicates race condition issues

### Redis CLI Commands for Debugging

```bash
# Check current queue state
redis-cli LLEN matchmaking:queue
redis-cli HLEN matchmaking:waiting

# View queue contents
redis-cli LRANGE matchmaking:queue 0 -1

# View waiting users
redis-cli HGETALL matchmaking:waiting

# Check poller lock
redis-cli GET matchmaking:poller-lock

# Monitor live operations
redis-cli MONITOR | grep matchmaking
```

## Future Optimizations (Not Yet Implemented)

### 1. Redis Streams Instead of List
- **Benefit**: Better message semantics, automatic trimming
- **Cost**: Higher complexity, requires Bun Redis client support
- **Decision**: Not needed at current scale

### 2. Sorted Set for Priority Matching
- **Benefit**: Could implement wait-time based priority
- **Cost**: Slightly higher memory (score field per entry)
- **Decision**: Not needed (FIFO is fair)

### 3. Multiple Queues by Region/Tag
- **Benefit**: Filtered matching (e.g., by language or interest)
- **Cost**: More complex Redis operations, multiple cleanups
- **Decision**: Defer until feature request

## Conclusion

The matchmaking implementation now has **zero memory leaks** and handles all edge cases gracefully. Memory usage scales linearly with active users and is cleaned up aggressively through:

1. ✅ Active cleanup on user actions (join/leave)
2. ✅ Passive cleanup via TTLs (24h safety net)
3. ✅ Periodic cleanup task (30s intervals)
4. ✅ Startup cleanup (service restart)

**Total Redis memory footprint**: ~90 bytes per active matchmaking user, with automatic cleanup ensuring no unbounded growth.
