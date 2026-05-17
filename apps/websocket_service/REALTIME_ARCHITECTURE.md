# Realtime Presence And Chat Architecture

This document explains the current websocket + Redis design used by `websocket_service` and the `online-people` frontend.

## High-Level Design

The app still uses one WebSocket connection per online browser user.

That single WebSocket is used for all realtime actions for that user:

- presence snapshot
- online count updates
- user joined and user left events
- busy/available status updates
- chat request
- accept/reject chat
- chat ready
- chat messages
- typing status
- end chat

Redis does not replace WebSockets. Redis is the shared state and cross-instance event bus behind the WebSocket servers.

The current design is:

```text
Browser client
  |
  | one WebSocket per online user
  v
websocket_service instance A/B/C/...
  |
  | shared state + pub/sub
  v
Redis
```

This lets the app scale beyond one server process. If user A is connected to websocket instance 1 and user B is connected to websocket instance 2, Redis lets both instances agree on presence, busy state, room membership, and event delivery.

## Why Redis Was Added

Before Redis, presence and chat state were held in memory inside one `websocket_service` process. That created two main problems:

- A new user could receive a full online users list, which becomes too heavy at 100k users.
- Multiple websocket server instances could not share online state or route messages to users connected to other instances.

Now Redis stores global realtime state, and the client receives only a bounded sample of visible users plus global counts.

## Redis Data Model

The Redis keys are defined in `src/state/redis-realtime.ts`.

### `presence:users`

Type: Redis hash

Stores user profile data by user id.

```text
field: userId
value: {"id":"guest:abc","name":"Ashu"}
```

Used for:

- checking if a target user is online
- building visible presence samples
- sending chat invite sender details

### `presence:online`

Type: Redis sorted set

Stores online user ids scored by join/update timestamp.

```text
member: userId
score: Date.now()
```

Used for:

- `ZCARD` online count
- recent online user sample with `ZREVRANGE`

The client does not receive all members from this set. It receives only `PRESENCE_SAMPLE_SIZE`, currently defaulting to `100`.

### `presence:busy`

Type: Redis hash

Stores which users are currently locked in a pending or active chat.

```text
field: userId
value: room:guest%3Aa|guest%3Ab
```

Used for:

- rejecting chat requests when caller or target is already busy
- showing busy/available status
- releasing both users when a chat ends

### `presence:channels`

Type: Redis hash

Stores room membership.

```text
field: roomId
value: ["guest:a","guest:b"]
```

Used for:

- validating `accept_chat`
- releasing both users on reject, timeout, disconnect, or end chat

### `presence:channel-state:{roomId}`

Type: Redis string with TTL

Stores whether a room is pending or open.

```text
pending -> invite has been sent but not accepted
open    -> both users accepted and chat is active
```

Pending room TTL is currently `60` seconds at the Redis layer. The app-level invite timeout is controlled by `INVITE_TIMEOUT_MS`.

### `presence:connection:{userId}`

Type: Redis string with TTL

Stores the currently active connection token for a user.

```text
value: random UUID connection token
```

Used to stop stale sockets from deleting newer presence records. For example, if the same user opens a new tab or reconnects, the old socket close event should not remove the new active connection from Redis.

### `realtime-bus`

Type: Redis pub/sub channel

Used to fan out websocket events between websocket service instances.

Each published message looks like:

```json
{
  "source": "websocket-service-instance-id",
  "topic": "online-users",
  "data": "{\"type\":\"presence_counts\",\"online\":1000,\"busy\":25}"
}
```

Each instance ignores messages from its own `source`, then publishes remote messages to its local WebSocket subscribers.

## WebSocket Topics

The service uses WebSocket pub/sub topics internally.

### `online-users`

All connected clients subscribe to this topic.

Carries:

- `online_users_snapshot`
- `presence_counts`
- `user_joined`
- `user_left`
- `user_status_changed`

### `user:{userId}`

Each user subscribes to their own direct topic.

Carries direct events:

- `chat_invite`
- `chat_rejected`

### `room:{sortedUserIds}`

The room topic is deterministic from both user ids.

Carries room events:

- `chat_ready`
- `chat_message`
- `chat_typing`

## Client State Model

The frontend `OnlinePresenceProvider` opens one WebSocket after it resolves the current identity.

Identity source:

- signed-in user session, or
- guest session

Incoming WebSocket events are parsed and dispatched into Redux.

The Redux presence slice stores:

- `ids` and `entities`: only the loaded visible sample
- `totalOnline`: total online count from Redis
- `totalBusy`: total busy count from Redis
- `sampleSize`: max number of visible users loaded from server
- `currentUserId`
- connection status and error

This is important: `totalOnline` can be 100k, but `ids.length` should stay around the configured sample size.

## New User Join Flow

When a user opens the app:

1. The frontend resolves identity.
   - Auth user becomes `user:{sessionUserId}`.
   - Guest user becomes `guest:{guestId}`.

2. `OnlinePresenceProvider` opens one WebSocket:

   ```text
   ws://localhost:3001/ws?userId=guest:abc&name=Ashu
   ```

3. `websocket_service` validates `userId` and `name`.

4. The service creates a new random connection token.

5. Local in-memory connection tracking is updated.
   - `connectionIdentity`: raw socket -> user
   - `connectionTokens`: raw socket -> connection token
   - `activeConnections`: user id -> active raw socket

   This local memory is only for sockets connected to this one service instance.

6. Redis is updated:

   ```text
   HSET presence:users userId {"id":"...","name":"..."}
   ZADD presence:online Date.now() userId
   SET presence:connection:{userId} connectionToken EX 86400
   ```

7. If the same user already had another active socket on the same service instance, the previous socket is closed with `SOCKET_REPLACED_CODE`.

8. The socket subscribes to:

   ```text
   online-users
   user:{userId}
   ```

9. The new socket receives an `online_users_snapshot`.

   Example:

   ```json
   {
     "type": "online_users_snapshot",
     "users": [{ "id": "guest:a", "name": "A", "isBusy": false }],
     "totalOnline": 100000,
     "totalBusy": 2450,
     "sampleSize": 100
   }
   ```

   The `users` array is capped. The totals are global.

10. Existing clients receive:

   ```json
   { "type": "user_joined", "user": { "id": "...", "name": "...", "isBusy": false } }
   ```

   and:

   ```json
   { "type": "presence_counts", "online": 100000, "busy": 2450 }
   ```

11. The frontend updates Redux:

   - adds the joined user to the visible sample
   - trims the visible list back to `sampleSize`
   - updates global online and busy counts

## User Left Flow

When the browser closes, reloads, loses connection, or the provider unmounts:

1. The socket close handler reads the local socket identity and connection token.

2. The service checks Redis:

   ```text
   GET presence:connection:{userId}
   ```

3. If the token does not match, this close event is stale and is ignored.

4. If the user was in a chat, the service:

   - reads their busy channel from `presence:busy`
   - releases the channel
   - removes both users from `presence:busy`
   - removes room membership from `presence:channels`
   - sends `chat_rejected` to the other user so their chat closes

5. Redis presence is removed:

   ```text
   HDEL presence:users userId
   ZREM presence:online userId
   HDEL presence:busy userId
   DEL presence:connection:{userId}
   ```

6. All clients receive:

   ```json
   { "type": "presence_counts", "online": 99999, "busy": 2449 }
   ```

   and:

   ```json
   { "type": "user_left", "userId": "guest:abc" }
   ```

7. The frontend removes that user from the loaded visible list if present and updates counts.

## Chat Request Flow

User A clicks Message on User B.

1. Browser A sends this through its existing WebSocket:

   ```json
   { "type": "chat_request", "targetId": "guest:b" }
   ```

2. The server validates A's socket:

   - local identity exists
   - connection token still matches Redis
   - socket is the active connection for user A

3. Redis checks target state:

   ```text
   HEXISTS presence:users guest:b
   HGET presence:busy guest:a
   HGET presence:busy guest:b
   ```

4. If target is offline:

   ```json
   { "type": "chat_rejected", "byId": "guest:b" }
   ```

5. If caller or target is busy:

   ```json
   { "type": "chat_busy", "byId": "guest:b" }
   ```

6. If both are available, the server creates deterministic room id:

   ```text
   room:{sorted encoded user ids}
   ```

7. Redis marks both users busy:

   ```text
   HSET presence:busy guest:a room:...
   HSET presence:busy guest:b room:...
   HSET presence:channels room:... ["guest:a","guest:b"]
   SET presence:channel-state:{roomId} pending EX 60
   ```

8. All clients receive busy status deltas:

   ```json
   { "type": "user_status_changed", "userId": "guest:a", "isBusy": true }
   { "type": "user_status_changed", "userId": "guest:b", "isBusy": true }
   ```

9. All clients receive updated counts:

   ```json
   { "type": "presence_counts", "online": 100000, "busy": 2452 }
   ```

10. Caller A subscribes to the room topic.

11. Target B receives direct invite on `user:guest:b`:

   ```json
   {
     "type": "chat_invite",
     "from": { "id": "guest:a", "name": "A" },
     "channel": "room:..."
   }
   ```

The invite delivery may cross instances through Redis pub/sub. If B is connected to another websocket instance, Redis `realtime-bus` carries the event to that instance.

## Chat Accept Flow

User B accepts the invite.

1. Browser B sends through its existing WebSocket:

   ```json
   { "type": "accept_chat", "targetId": "guest:a" }
   ```

2. Server rebuilds the deterministic room id.

3. Server checks Redis room membership:

   ```text
   HGET presence:channels room:...
   ```

4. If both users are members, server:

   - clears the local invite timer on that instance if present
   - sets Redis room state to open:

     ```text
     SET presence:channel-state:{roomId} open EX 86400
     ```

   - subscribes B's socket to the room

5. Server sends `chat_ready` to B directly and publishes `chat_ready` to the room:

   ```json
   { "type": "chat_ready", "channel": "room:..." }
   ```

6. Both clients transition chat UI to open.

## Chat Reject Flow

User B rejects the invite.

1. Browser B sends:

   ```json
   { "type": "reject_chat", "fromId": "guest:a" }
   ```

2. Server confirms B is busy in that room using Redis.

3. Server releases the room:

   ```text
   HDEL presence:busy guest:a guest:b
   HDEL presence:channels room:...
   DEL presence:channel-state:{roomId}
   ```

4. A receives:

   ```json
   { "type": "chat_rejected", "byId": "guest:b" }
   ```

5. All clients receive busy status and count updates.

## Chat Timeout Flow

When A sends a chat request, the service starts a local invite timer.

If the invite expires:

1. Server checks Redis room state:

   ```text
   GET presence:channel-state:{roomId}
   ```

2. If the state is still `pending`, the server releases the room.

3. Caller A receives:

   ```json
   { "type": "chat_expired", "byId": "guest:b" }
   ```

4. All clients receive busy status and count updates.

If B already accepted, Redis state is `open`, so the timeout does nothing.

## Chat Message Flow

When chat is open and A sends a message:

1. Browser A sends through its existing WebSocket:

   ```json
   { "type": "chat_message", "channel": "room:...", "text": "hello" }
   ```

2. Server checks:

   ```text
   HGET presence:busy guest:a
   ```

   The value must match the requested room.

3. Server publishes to the room:

   ```json
   {
     "type": "chat_message",
     "channel": "room:...",
     "fromId": "guest:a",
     "text": "hello"
   }
   ```

4. If the other user is on another websocket instance, Redis `realtime-bus` forwards the room event to that instance.

5. Both clients receive the message through their existing WebSocket connection.

## Typing Flow

Typing uses the same room topic.

Client sends:

```json
{ "type": "chat_typing", "channel": "room:...", "isTyping": true }
```

Server verifies the sender is in the room, then publishes:

```json
{
  "type": "chat_typing",
  "channel": "room:...",
  "fromId": "guest:a",
  "isTyping": true
}
```

## End Chat Flow

When a user closes the chat window:

1. Browser sends:

   ```json
   { "type": "end_chat", "channel": "room:..." }
   ```

2. Server verifies sender is in the room.

3. Server releases Redis room and busy state.

4. Other user receives:

   ```json
   { "type": "chat_rejected", "byId": "guest:a" }
   ```

   The current client code treats this as conversation ended.

5. All clients receive user busy status updates and new counts.

## Cross-Instance Delivery

Every websocket instance has two layers of publish:

1. Local publish to clients connected to the same process.
2. Redis publish to `realtime-bus`.

When another websocket instance receives the Redis bus message, it publishes the event to its own local subscribers.

This is how direct user events and room events work even when users are connected to different websocket service instances.

Example:

```text
User A socket -> instance 1
User B socket -> instance 2

A sends chat_request
instance 1 publishes chat_invite to Redis realtime-bus
instance 2 receives bus event
instance 2 publishes to local topic user:guest:b
B receives chat_invite over B's one WebSocket
```

## What The Browser Receives

The browser receives all realtime events on the same WebSocket.

Server-to-client events:

```text
online_users_snapshot
presence_counts
user_joined
user_left
user_status_changed
chat_invite
chat_ready
chat_rejected
chat_busy
chat_expired
chat_message
chat_typing
```

Client-to-server messages:

```text
chat_request
accept_chat
reject_chat
chat_message
chat_typing
end_chat
```

## Scaling Behavior At 100k Users

At 100k online users:

- Redis stores all online users in `presence:users` and `presence:online`.
- Each new user receives only a capped snapshot, default `100`.
- Counts still show the true total online and busy users.
- Joins and leaves are small delta events, not full snapshots.
- Chat messages only publish to the two-user room, not to all online users.
- Busy status changes are small per-user deltas.

This avoids sending 100k user records to every new client.

## Current Limits And Notes

- The current visible online list is a sample, not a full searchable directory of all 100k users.
- The current sample is based on recent online users from `presence:online`.
- `PRESENCE_SAMPLE_SIZE` defaults to `100` and is capped at `500` in the Redis store code.
- Local memory still tracks raw socket objects because Redis cannot store actual WebSocket connections.
- Redis stores shared state, but the WebSocket server still owns actual network connections.
- The current room is one-to-one chat.
- Chat messages are realtime only; they are not persisted as chat history in Redis or a database.

