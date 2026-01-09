import WebSocket, { WebSocketServer } from 'ws';
// import { setupWSConnection } from 'y-websocket/bin/utils.js';
import * as Y from 'yjs';
import Redis  from 'redis';

export class RealtimeService {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> { users: Map, doc: Y.Doc }
    this.userRooms = new Map(); // userId -> Set of roomIds
    this.setupSocketHandlers();
    
    // Initialize Yjs WebSocket server
    this.setupYjsWebSocket();
    
    // Initialize Redis for persistence (optional)
    this.setupRedis();
  }

  setupRedis() {
    try {
      this.redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
      });
      
      this.redis.on('error', (err) => {
        console.error('Redis error:', err);
      });
      
      this.redis.connect().then(() => {
        console.log('✅ Redis connected for canvas persistence');
      });
    } catch (error) {
      console.log('⚠️  Redis not available, using in-memory storage only');
    }
  }

  setupYjsWebSocket() {
    // Create Yjs WebSocket server for CRDT synchronization
    const yjsPort = process.env.YJS_PORT || 1234;
    this.yjsServer = new WebSocketServer({
      port: yjsPort
    });
    
    console.log(`✅ Yjs WebSocket server running on port ${yjsPort}`);
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 New socket connection: ${socket.id}`);

      // Join canvas room
      socket.on('join-canvas-room', async (data) => {
        await this.handleJoinCanvasRoom(socket, data);
      });

      // Leave canvas room
      socket.on('leave-canvas-room', (data) => {
        this.handleLeaveCanvasRoom(socket, data);
      });

      // Canvas drawing events
      socket.on('canvas-draw', (data) => {
        this.handleCanvasDraw(socket, data);
      });

      socket.on('canvas-add-shape', (data) => {
        this.handleAddShape(socket, data);
      });

      socket.on('canvas-add-text', (data) => {
        this.handleAddText(socket, data);
      });

      socket.on('canvas-add-sticky', (data) => {
        this.handleAddStickyNote(socket, data);
      });

      socket.on('canvas-move-object', (data) => {
        this.handleMoveObject(socket, data);
      });

      socket.on('canvas-delete-object', (data) => {
        this.handleDeleteObject(socket, data);
      });

      socket.on('canvas-clear', (data) => {
        this.handleClearCanvas(socket, data);
      });

      // Cursor tracking
      socket.on('cursor-move', (data) => {
        this.handleCursorMove(socket, data);
      });

      // Chat messages
      socket.on('canvas-chat', (data) => {
        this.handleCanvasChat(socket, data);
      });

      // User activity
      socket.on('user-activity', (data) => {
        this.handleUserActivity(socket, data);
      });

      // Disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  async handleJoinCanvasRoom(socket, data) {
    const { roomId, userId, userName, userRole, permissions } = data;
    
    try {
      // Join Socket.IO room
      socket.join(roomId);
      
      // Initialize room if not exists
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, {
          users: new Map(),
          doc: new Y.Doc(),
          chatHistory: []
        });
      }

      const room = this.rooms.get(roomId);
      
      // Add user to room
      const userInfo = {
        id: userId,
        name: userName,
        role: userRole,
        socketId: socket.id,
        permissions: permissions || {},
        cursor: { x: 0, y: 0 },
        joinedAt: new Date(),
        lastActivity: new Date()
      };

      room.users.set(userId, userInfo);

      // Track user's rooms
      if (!this.userRooms.has(userId)) {
        this.userRooms.set(userId, new Set());
      }
      this.userRooms.get(userId).add(roomId);

      // Load canvas state from Redis if available
      if (this.redis) {
        try {
          const savedState = await this.redis.get(`canvas:${roomId}`);
          if (savedState) {
            Y.applyUpdate(room.doc, Buffer.from(savedState, 'base64'));
          }
        } catch (error) {
          console.error('Error loading canvas state from Redis:', error);
        }
      }

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        userId,
        userName,
        userRole,
        timestamp: new Date(),
        totalUsers: room.users.size
      });

      // Send current room state to joining user
      socket.emit('room-state', {
        roomId,
        users: Array.from(room.users.values()).map(u => ({
          id: u.id,
          name: u.name,
          role: u.role,
          cursor: u.cursor
        })),
        userCount: room.users.size,
        chatHistory: room.chatHistory.slice(-50) // Last 50 messages
      });

      console.log(`👤 User ${userName} (${userId}) joined canvas room ${roomId}`);
    } catch (error) {
      console.error('Error joining canvas room:', error);
      socket.emit('error', { message: 'Failed to join canvas room' });
    }
  }

  handleLeaveCanvasRoom(socket, data) {
    const { roomId, userId } = data;
    
    const room = this.rooms.get(roomId);
    if (room) {
      room.users.delete(userId);
      
      // Remove room from user's rooms
      const userRoomsSet = this.userRooms.get(userId);
      if (userRoomsSet) {
        userRoomsSet.delete(roomId);
        if (userRoomsSet.size === 0) {
          this.userRooms.delete(userId);
        }
      }

      // Clean up empty room
      if (room.users.size === 0) {
        // Save final state before cleaning up
        this.saveCanvasState(roomId, room.doc);
        this.rooms.delete(roomId);
      }

      // Notify others
      socket.to(roomId).emit('user-left', {
        userId,
        timestamp: new Date(),
        totalUsers: room.users.size
      });
    }

    socket.leave(roomId);
  }

  handleCanvasDraw(socket, data) {
    const { roomId, userId, strokes } = data;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const user = room.users.get(userId);
      if (user && user.permissions.canDraw) {
        // Broadcast to others in room
        socket.to(roomId).emit('canvas-draw-update', {
          userId,
          strokes,
          timestamp: new Date()
        });

        // Update Yjs document for CRDT sync
        const yArray = room.doc.getArray('drawings');
        yArray.push([{ userId, strokes, timestamp: Date.now() }]);
      }
    }
  }

  handleAddShape(socket, data) {
    const { roomId, userId, shape } = data;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const user = room.users.get(userId);
      if (user && user.permissions.canEdit) {
        socket.to(roomId).emit('shape-added', {
          userId,
          shape,
          timestamp: new Date()
        });

        const yArray = room.doc.getArray('shapes');
        yArray.push([{ userId, shape, timestamp: Date.now() }]);
      }
    }
  }

  handleAddText(socket, data) {
    const { roomId, userId, textObject } = data;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const user = room.users.get(userId);
      if (user && user.permissions.canEdit) {
        socket.to(roomId).emit('text-added', {
          userId,
          textObject,
          timestamp: new Date()
        });

        const yArray = room.doc.getArray('texts');
        yArray.push([{ userId, textObject, timestamp: Date.now() }]);
      }
    }
  }

  handleAddStickyNote(socket, data) {
    const { roomId, userId, stickyNote } = data;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const user = room.users.get(userId);
      if (user && user.permissions.canEdit) {
        socket.to(roomId).emit('sticky-added', {
          userId,
          stickyNote,
          timestamp: new Date()
        });

        const yArray = room.doc.getArray('stickies');
        yArray.push([{ userId, stickyNote, timestamp: Date.now() }]);
      }
    }
  }

  handleMoveObject(socket, data) {
    const { roomId, userId, objectId, newPosition } = data;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const user = room.users.get(userId);
      if (user && user.permissions.canEdit) {
        socket.to(roomId).emit('object-moved', {
          userId,
          objectId,
          newPosition,
          timestamp: new Date()
        });
      }
    }
  }

  handleDeleteObject(socket, data) {
    const { roomId, userId, objectId } = data;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const user = room.users.get(userId);
      if (user && user.permissions.canEdit) {
        socket.to(roomId).emit('object-deleted', {
          userId,
          objectId,
          timestamp: new Date()
        });
      }
    }
  }

  handleClearCanvas(socket, data) {
    const { roomId, userId } = data;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const user = room.users.get(userId);
      // Only moderators or creators can clear canvas
      if (user && (user.permissions.isModerator || user.role === 'admin')) {
        socket.to(roomId).emit('canvas-cleared', {
          userId,
          timestamp: new Date()
        });

        // Clear Yjs document
        const yDoc = room.doc;
        yDoc.transact(() => {
          yDoc.share.clear();
        });
      }
    }
  }

  handleCursorMove(socket, data) {
    const { roomId, userId, cursor } = data;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const user = room.users.get(userId);
      if (user) {
        user.cursor = cursor;
        user.lastActivity = new Date();
        
        // Broadcast cursor position to others
        socket.to(roomId).emit('cursor-update', {
          userId,
          userName: user.name,
          cursor,
          timestamp: new Date()
        });
      }
    }
  }

  handleCanvasChat(socket, data) {
    const { roomId, userId, message } = data;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const user = room.users.get(userId);
      if (user) {
        const chatMessage = {
          id: Date.now().toString(),
          userId,
          userName: user.name,
          message,
          timestamp: new Date()
        };

        // Store in chat history (limit to 100 messages)
        room.chatHistory.push(chatMessage);
        if (room.chatHistory.length > 100) {
          room.chatHistory = room.chatHistory.slice(-100);
        }

        // Broadcast to room
        this.io.to(roomId).emit('chat-message', chatMessage);
      }
    }
  }

  handleUserActivity(socket, data) {
    const { roomId, userId } = data;
    const room = this.rooms.get(roomId);
    
    if (room) {
      const user = room.users.get(userId);
      if (user) {
        user.lastActivity = new Date();
      }
    }
  }

  handleDisconnect(socket) {
    // Find all rooms this socket was in
    for (const [roomId, room] of this.rooms) {
      for (const [userId, user] of room.users) {
        if (user.socketId === socket.id) {
          this.handleLeaveCanvasRoom(socket, { roomId, userId });
          break;
        }
      }
    }
  }

  async saveCanvasState(roomId, yDoc) {
    if (this.redis) {
      try {
        const update = Y.encodeStateAsUpdate(yDoc);
        const base64Update = Buffer.from(update).toString('base64');
        await this.redis.setex(`canvas:${roomId}`, 86400, base64Update); // 24 hours TTL
      } catch (error) {
        console.error('Error saving canvas state to Redis:', error);
      }
    }
  }

  // Get room statistics
  getRoomStats(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      userCount: room.users.size,
      users: Array.from(room.users.values()).map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        lastActivity: u.lastActivity
      })),
      chatMessageCount: room.chatHistory.length
    };
  }

  // Get all active rooms
  getAllActiveRooms() {
    const stats = [];
    for (const [roomId, room] of this.rooms) {
      stats.push({
        roomId,
        userCount: room.users.size,
        users: Array.from(room.users.values()).map(u => u.name)
      });
    }
    return stats;
  }
}

export default RealtimeService;