import express from 'express';
import CanvasService from '../services/canvasServices.js';
import AuthService from '../services/authService.js';

const router = express.Router();

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const user = await AuthService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

// Create new canvas room (Admin only)
router.post('/create', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const roomData = req.body;

    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can create canvas rooms'
      });
    }

    const result = await CanvasService.createRoom(userId, role, roomData);
    
    res.json(result);
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Join canvas room
router.post('/join/:roomCode', authenticate, async (req, res) => {
  try {
    const { userId, role, firstName, lastName, email } = req.user;
    const { roomCode } = req.params;

    const result = await CanvasService.joinRoom(
      roomCode,
      userId,
      role,
      `${firstName} ${lastName}`,
      email
    );

    res.json(result);
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Accept invitation
router.post('/accept/:token', authenticate, async (req, res) => {
  try {
    const { userId, role, firstName, lastName, email } = req.user;
    const { token } = req.params;

    const result = await CanvasService.acceptInvitation(
      token,
      userId,
      role,
      `${firstName} ${lastName}`,
      email
    );

    res.json(result);
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Invite user to room
router.post('/:roomId/invite', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { roomId } = req.params;
    const invitationData = req.body;

    const result = await CanvasService.inviteToRoom(
      roomId,
      userId,
      role,
      invitationData
    );

    res.json(result);
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get room details
router.get('/:roomId', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { roomId } = req.params;

    const result = await CanvasService.getRoomDetails(roomId, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Get room details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's canvas rooms
router.get('/user/rooms', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;

    const result = await CanvasService.getUserCanvasRooms(userId, role);
    
    res.json(result);
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get company canvas rooms (Admin only)
router.get('/company/rooms', authenticate, async (req, res) => {
  try {
    const { role, companyId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only admins can view company rooms'
      });
    }

    const result = await CanvasService.getCompanyCanvasRooms(companyId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get company rooms error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update room settings
router.patch('/:roomId/settings', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { roomId } = req.params;
    const settings = req.body;

    const result = await CanvasService.updateRoomSettings(
      roomId,
      userId,
      role,
      settings
    );

    res.json(result);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Close room
router.post('/:roomId/close', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { roomId } = req.params;

    const result = await CanvasService.closeRoom(roomId, userId, role);

    res.json(result);
  } catch (error) {
    console.error('Close room error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Leave room
router.post('/:roomId/leave', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { roomId } = req.params;

    const result = await CanvasService.leaveRoom(roomId, userId);

    res.json(result);
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save canvas snapshot
router.post('/:roomId/save', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    const { roomId } = req.params;
    const snapshotData = req.body;

    const result = await CanvasService.saveCanvasSnapshot(
      roomId,
      userId,
      snapshotData
    );

    res.json(result);
  } catch (error) {
    console.error('Save snapshot error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get room snapshots
router.get('/:roomId/snapshots', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 10 } = req.query;

    const snapshots = await CanvasModel.getRoomSnapshots(
      roomId,
      parseInt(limit)
    );

    res.json({
      success: true,
      snapshots,
      total: snapshots.length
    });
  } catch (error) {
    console.error('Get snapshots error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Canvas API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;