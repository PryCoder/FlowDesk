// src/routes/workspace.js
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import authService from '../services/authService.js';

const router = express.Router();

// Enhanced authentication middleware
const authenticate = async (req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n=== WORKSPACE AUTHENTICATE MIDDLEWARE [${requestId}] ===`);
    
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      console.log(`❌ [${requestId}] No token provided`);
      return res.status(401).json({ 
        success: false,
        error: 'No token provided',
        requestId 
      });
    }
    
    const decoded = await authService.verifyToken(token);
    
    console.log(`✅ [${requestId}] Workspace Authentication SUCCESS:`, {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      responseTime: `${Date.now() - startTime}ms`
    });
    
    req.user = decoded;
    next();
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 [${requestId}] Workspace Authentication FAILED:`, error.message);
    
    res.status(401).json({ 
      success: false,
      error: error.message,
      requestId
    });
  }
};

// In-memory storage (replace with database in production)
const workspaces = new Map();
const meetingRequests = new Map();
const canvasStates = new Map();
const activeVideoCalls = new Map();
const userEditingStates = new Map(); // Track who's editing what

// Enhanced Meeting Request with Real-time Features
router.post('/meeting-request', authenticate, async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n📨 [${requestId}] MEETING REQUEST CREATION`);
    
    const { employeeIds, title, description, scheduledTime, duration, agenda } = req.body;
    const adminId = req.user.userId;
    const companyId = req.user.companyId;

    // Validate input
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid employee IDs array is required'
      });
    }

    // Create meeting request
    const meetingRequestId = uuidv4();
    const meetingRequest = {
      id: meetingRequestId,
      adminId,
      companyId,
      employeeIds,
      title,
      description: description || '',
      scheduledTime: new Date(scheduledTime),
      duration: duration || 60,
      agenda: agenda || [],
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create enhanced workspace with real-time features
    const workspaceId = uuidv4();
    const workspace = {
      id: workspaceId,
      meetingRequestId,
      companyId,
      title: `Workspace: ${title}`,
      canvasData: {
        elements: [],
        background: '#ffffff',
        zoom: 1,
        viewport: { x: 0, y: 0 },
        version: 1,
        lastModified: new Date(),
        lastModifiedBy: null
      },
      participants: [adminId, ...employeeIds],
      activeUsers: new Map(),
      editingUsers: new Map(), // Track currently editing users
      videoCall: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store data
    meetingRequests.set(meetingRequestId, meetingRequest);
    workspaces.set(workspaceId, workspace);

    // Notify employees via WebSocket
    const io = req.app.get('io');
    employeeIds.forEach(employeeId => {
      io.to(`user_${employeeId}`).emit('meeting_invitation', {
        meetingRequest,
        workspaceId,
        admin: {
          id: adminId,
          name: req.user.firstName + ' ' + req.user.lastName,
          email: req.user.email
        },
        features: ['real-time-canvas', 'video-calls', 'live-editing']
      });
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] MEETING REQUEST CREATED:`, {
      meetingRequestId,
      workspaceId,
      employeeCount: employeeIds.length,
      responseTime: `${responseTime}ms`
    });

    res.status(201).json({
      success: true,
      message: 'Meeting request sent successfully',
      meetingRequest: {
        ...meetingRequest,
        workspaceId
      },
      workspace: {
        id: workspaceId,
        joinUrl: `/workspace/${workspaceId}`,
        features: ['real-time-canvas', 'video-calls', 'live-editing']
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 [${requestId}] MEETING REQUEST FAILED:`, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to create meeting request',
      requestId
    });
  }
});

// Enhanced Real-time Canvas with Eraser.io-like Features
router.post('/:id/canvas', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { elements, background, zoom, viewport, operations, version } = req.body;
    const workspace = workspaces.get(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    if (!workspace.participants.includes(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this workspace'
      });
    }

    // Handle incremental updates (like eraser.io)
    if (operations && Array.isArray(operations)) {
      // Apply operations to existing elements
      operations.forEach(operation => {
        switch (operation.type) {
          case 'add':
            workspace.canvasData.elements.push(operation.element);
            break;
          case 'update':
            const elementIndex = workspace.canvasData.elements.findIndex(el => el.id === operation.elementId);
            if (elementIndex !== -1) {
              workspace.canvasData.elements[elementIndex] = {
                ...workspace.canvasData.elements[elementIndex],
                ...operation.updates
              };
            }
            break;
          case 'delete':
            workspace.canvasData.elements = workspace.canvasData.elements.filter(el => el.id !== operation.elementId);
            break;
          case 'clear':
            workspace.canvasData.elements = [];
            break;
        }
      });
    } else {
      // Full canvas update
      workspace.canvasData = {
        elements: elements || workspace.canvasData.elements,
        background: background || workspace.canvasData.background,
        zoom: zoom || workspace.canvasData.zoom,
        viewport: viewport || workspace.canvasData.viewport,
        version: workspace.canvasData.version + 1,
        lastModified: new Date(),
        lastModifiedBy: req.user.userId
      };
    }

    workspace.updatedAt = new Date();

    // Broadcast update to all connected users in this workspace
    const io = req.app.get('io');
    io.to(`workspace_${id}`).emit('canvas_updated', {
      workspaceId: id,
      canvasData: workspace.canvasData,
      operations: operations || null,
      updatedBy: {
        id: req.user.userId,
        name: req.user.firstName + ' ' + req.user.lastName
      },
      timestamp: new Date(),
      version: workspace.canvasData.version
    });

    res.json({
      success: true,
      message: 'Canvas saved successfully',
      canvasData: workspace.canvasData,
      version: workspace.canvasData.version
    });

  } catch (error) {
    console.error('Save canvas error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save canvas'
    });
  }
});

// Track User Editing Activity
router.post('/:id/track-editing', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { elementId, action, elementType, position } = req.body;
    const workspace = workspaces.get(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Update user's editing state
    const userEditingState = {
      userId: req.user.userId,
      userName: req.user.firstName + ' ' + req.user.lastName,
      elementId,
      action, // 'editing', 'selecting', 'moving', 'drawing'
      elementType, // 'text', 'shape', 'line', 'image'
      position,
      lastActivity: new Date(),
      color: getRandomUserColor(req.user.userId) // Consistent color for user
    };

    workspace.editingUsers.set(req.user.userId, userEditingState);

    // Broadcast editing activity to all users
    const io = req.app.get('io');
    io.to(`workspace_${id}`).emit('user_editing', {
      workspaceId: id,
      user: userEditingState,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Editing activity tracked'
    });

  } catch (error) {
    console.error('Track editing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track editing activity'
    });
  }
});

// Stop Tracking User Editing
router.post('/:id/stop-editing', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = workspaces.get(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Remove user from editing tracking
    workspace.editingUsers.delete(req.user.userId);

    // Broadcast that user stopped editing
    const io = req.app.get('io');
    io.to(`workspace_${id}`).emit('user_stopped_editing', {
      workspaceId: id,
      userId: req.user.userId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Editing stopped'
    });

  } catch (error) {
    console.error('Stop editing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop editing tracking'
    });
  }
});

// Get Active Editors
router.get('/:id/active-editors', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = workspaces.get(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    const activeEditors = Array.from(workspace.editingUsers.values());

    res.json({
      success: true,
      activeEditors,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Get active editors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active editors'
    });
  }
});

// Enhanced Video Call with WebRTC Integration
router.post('/:id/video-call/start', authenticate, async (req, res) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n🎥 [${requestId}] START VIDEO CALL`);
    
    const { id } = req.params;
    const { type = 'webrtc', maxParticipants = 10 } = req.body;
    const workspace = workspaces.get(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    const callId = uuidv4();
    
    // Initialize video call with WebRTC support
    if (!activeVideoCalls.has(id)) {
      activeVideoCalls.set(id, new Map());
    }
    
    const workspaceCalls = activeVideoCalls.get(id);
    workspaceCalls.set(callId, {
      callId,
      workspaceId: id,
      startedBy: req.user.userId,
      startedByName: req.user.firstName + ' ' + req.user.lastName,
      type, // 'webrtc' for peer-to-peer
      maxParticipants,
      participants: new Map(),
      startTime: new Date(),
      isActive: true,
      webrtcConfig: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    // Add the caller as first participant
    const call = workspaceCalls.get(callId);
    call.participants.set(req.user.userId, {
      userId: req.user.userId,
      userName: req.user.firstName + ' ' + req.user.lastName,
      joinedAt: new Date(),
      isVideoOn: true,
      isAudioOn: true,
      streamId: null, // Will be set when user connects
      role: 'host'
    });

    // Update workspace video call reference
    workspace.videoCall = {
      callId,
      isActive: true,
      startedAt: new Date()
    };

    // Notify all participants via WebSocket
    const io = req.app.get('io');
    io.to(`workspace_${id}`).emit('video_call_started', {
      callId,
      workspaceId: id,
      startedBy: {
        id: req.user.userId,
        name: req.user.firstName + ' ' + req.user.lastName
      },
      type,
      webrtcConfig: call.webrtcConfig,
      timestamp: new Date()
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] VIDEO CALL STARTED:`, {
      workspaceId: id,
      callId,
      type,
      startedBy: req.user.userId,
      responseTime: `${responseTime}ms`
    });

    res.json({
      success: true,
      message: 'Video call started successfully',
      callId,
      workspaceId: id,
      type,
      webrtcConfig: call.webrtcConfig,
      joinUrl: `/workspace/${id}/video-call/${callId}`
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`💥 [${requestId}] VIDEO CALL START FAILED:`, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to start video call',
      requestId
    });
  }
});

// Get WebRTC Configuration
router.get('/:id/video-call/webrtc-config', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = workspaces.get(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    const webrtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers if needed for production
        // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
      ],
      sdpSemantics: 'unified-plan'
    };

    res.json({
      success: true,
      webrtcConfig,
      workspaceId: id
    });

  } catch (error) {
    console.error('Get WebRTC config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WebRTC configuration'
    });
  }
});

// Enhanced Workspace Details with Real-time Status
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = workspaces.get(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    if (!workspace.participants.includes(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this workspace'
      });
    }

    const workspaceCalls = activeVideoCalls.get(id);
    const activeCall = workspaceCalls ? Array.from(workspaceCalls.values()).find(call => call.isActive) : null;

    res.json({
      success: true,
      workspace: {
        ...workspace,
        activeUsers: Array.from(workspace.activeUsers.values()),
        editingUsers: Array.from(workspace.editingUsers.values()),
        activeVideoCall: activeCall ? {
          callId: activeCall.callId,
          startedBy: activeCall.startedBy,
          participantCount: activeCall.participants.size,
          startTime: activeCall.startTime
        } : null,
        realTimeFeatures: {
          canvas: true,
          videoCalls: true,
          liveEditing: true,
          cursorTracking: true,
          versionControl: true
        }
      }
    });

  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace'
    });
  }
});

// Export Workspace with Version History
router.post('/:id/export', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'png', includeHistory = false } = req.body;
    const workspace = workspaces.get(id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    const exportData = {
      workspace: {
        id: workspace.id,
        title: workspace.title,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        version: workspace.canvasData.version
      },
      canvas: workspace.canvasData,
      participants: workspace.participants,
      activeEditors: Array.from(workspace.editingUsers.values()),
      format,
      exportedAt: new Date(),
      exportedBy: {
        id: req.user.userId,
        name: req.user.firstName + ' ' + req.user.lastName
      },
      realTimeFeatures: {
        liveEditing: true,
        versionControl: true,
        collaboration: true
      }
    };

    if (includeHistory) {
      // Add editing history if requested
      exportData.editingHistory = Array.from(workspace.editingUsers.values());
    }

    res.json({
      success: true,
      message: `Workspace exported as ${format.toUpperCase()}`,
      exportData,
      downloadUrl: `/api/workspace/${id}/download/${format}`
    });

  } catch (error) {
    console.error('Export workspace error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export workspace'
    });
  }
});

// Helper function to generate consistent user colors
function getRandomUserColor(userId) {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  
  // Use userId to get consistent color for each user
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

export default router;