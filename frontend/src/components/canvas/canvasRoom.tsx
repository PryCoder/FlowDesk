import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Send as SendIcon,
  Brush as BrushIcon,
  ShapeLine as ShapeIcon,
  TextFields as TextIcon,
  StickyNote2 as StickyNoteIcon,
  Mouse as CursorIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import io, { Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

interface CanvasUser {
  id: string;
  name: string;
  role: string;
  cursor: { x: number; y: number };
}

const CanvasRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [room, setRoom] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [participants, setParticipants] = useState<CanvasUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [usersDrawerOpen, setUsersDrawerOpen] = useState(false);
  const [tool, setTool] = useState<'brush' | 'shape' | 'text' | 'sticky'>('brush');
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const CANVAS_API = `${API_BASE_URL}/api/canvas`;
  const SOCKET_URL = API_BASE_URL;

  // Fetch room details and current user
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Get current user
        const userRes = await fetch(`${API_BASE_URL}/api/auth/current-user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData.user || userData);
        }

        // Get room details
        const roomRes = await fetch(`${CANVAS_API}/${roomId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (roomRes.ok) {
          const roomData = await roomRes.json();
          setRoom(roomData.room);
          setParticipants(roomData.room.participants || []);
        } else {
          const errorData = await roomRes.json();
          setError(errorData.error || 'Failed to load room');
        }
      } catch (error) {
        setError('Error loading room');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roomId, navigate]);

  // Connect to WebSocket
  useEffect(() => {
    if (!roomId || !currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket']
    });

    const socket = socketRef.current;

    // Join canvas room
    socket.emit('join-canvas-room', {
      roomId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      permissions: {} // Add permissions from room data
    });

    // Listen for room state
    socket.on('room-state', (data) => {
      setParticipants(data.users || []);
      setChatMessages(data.chatHistory || []);
    });

    // Listen for user join/leave
    socket.on('user-joined', (data) => {
      setParticipants(prev => [...prev, {
        id: data.userId,
        name: data.userName,
        role: data.userRole,
        cursor: { x: 0, y: 0 }
      }]);
      showSnackbar(`${data.userName} joined the room`);
    });

    socket.on('user-left', (data) => {
      setParticipants(prev => prev.filter(user => user.id !== data.userId));
      showSnackbar('A user left the room');
    });

    // Listen for cursor updates
    socket.on('cursor-update', (data) => {
      setParticipants(prev => prev.map(user =>
        user.id === data.userId
          ? { ...user, cursor: data.cursor }
          : user
      ));
    });

    // Listen for chat messages
    socket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Listen for canvas updates
    socket.on('canvas-draw-update', (data) => {
      // Handle drawing updates
      console.log('Drawing update:', data);
    });

    socket.on('shape-added', (data) => {
      // Handle shape addition
      console.log('Shape added:', data);
    });

    socket.on('text-added', (data) => {
      // Handle text addition
      console.log('Text added:', data);
    });

    socket.on('sticky-added', (data) => {
      // Handle sticky note addition
      console.log('Sticky added:', data);
    });

    return () => {
      if (socket) {
        socket.emit('leave-canvas-room', { roomId, userId: currentUser.id });
        socket.disconnect();
      }
    };
  }, [roomId, currentUser]);

  // Handle canvas interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setCursorPosition({ x, y });
      
      // Send cursor position to server
      if (socketRef.current) {
        socketRef.current.emit('cursor-move', {
          roomId,
          userId: currentUser?.id,
          cursor: { x, y }
        });
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [roomId, currentUser]);

  const showSnackbar = (message: string) => {
    setSnackbar({ open: true, message });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socketRef.current || !currentUser) return;

    socketRef.current.emit('canvas-chat', {
      roomId,
      userId: currentUser.id,
      message: newMessage.trim()
    });

    setNewMessage('');
  };

  const handleSaveCanvas = async () => {
    const token = localStorage.getItem('token');
    if (!token || !roomId) return;

    try {
      // Get canvas data
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dataUrl = canvas.toDataURL('image/png');
      
      const res = await fetch(`${CANVAS_API}/${roomId}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snapshot: dataUrl,
          version: Date.now()
        })
      });

      if (res.ok) {
        showSnackbar('Canvas saved successfully');
      }
    } catch (error) {
      console.error('Error saving canvas:', error);
      showSnackbar('Error saving canvas');
    }
  };

  const handleLeaveRoom = async () => {
    const token = localStorage.getItem('token');
    if (!token || !roomId) return;

    try {
      const res = await fetch(`${CANVAS_API}/${roomId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        navigate('/canvas');
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const handleClearCanvas = () => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit('canvas-clear', {
        roomId,
        userId: currentUser.id
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/canvas')}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/canvas')}
            >
              Back
            </Button>
          </Grid>
          <Grid item xs>
            <Typography variant="h6">
              {room?.title}
              <Chip
                label={room?.room_code}
                size="small"
                sx={{ ml: 1 }}
                color="primary"
              />
              {room?.is_public && (
                <Chip
                  label="Public"
                  size="small"
                  sx={{ ml: 1 }}
                  color="success"
                  variant="outlined"
                />
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {room?.description}
            </Typography>
          </Grid>
          <Grid item>
            <Box display="flex" gap={1}>
              <Tooltip title={`${participants.length} Participants`}>
                <IconButton onClick={() => setUsersDrawerOpen(true)}>
                  <Badge badgeContent={participants.length} color="primary">
                    <PeopleIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip title="Chat">
                <IconButton onClick={() => setChatDrawerOpen(true)}>
                  <Badge badgeContent={chatMessages.length} color="primary">
                    <ChatIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveCanvas}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ExitToAppIcon />}
                onClick={handleLeaveRoom}
              >
                Leave
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Toolbar */}
        <Paper sx={{ width: 60, display: 'flex', flexDirection: 'column', p: 1 }}>
          <Tooltip title="Brush" placement="right">
            <IconButton
              color={tool === 'brush' ? 'primary' : 'default'}
              onClick={() => setTool('brush')}
            >
              <BrushIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Shapes" placement="right">
            <IconButton
              color={tool === 'shape' ? 'primary' : 'default'}
              onClick={() => setTool('shape')}
            >
              <ShapeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Text" placement="right">
            <IconButton
              color={tool === 'text' ? 'primary' : 'default'}
              onClick={() => setTool('text')}
            >
              <TextIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sticky Notes" placement="right">
            <IconButton
              color={tool === 'sticky' ? 'primary' : 'default'}
              onClick={() => setTool('sticky')}
            >
              <StickyNoteIcon />
            </IconButton>
          </Tooltip>
          <Divider sx={{ my: 1 }} />
          <Tooltip title="Clear Canvas" placement="right">
            <IconButton color="error" onClick={handleClearCanvas}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
        </Paper>

        {/* Canvas */}
        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f8f9fa',
              cursor: 'crosshair'
            }}
          />
          
          {/* Cursor positions */}
          {participants.map((user) => (
            <Tooltip key={user.id} title={user.name} arrow>
              <Box
                sx={{
                  position: 'absolute',
                  left: user.cursor.x,
                  top: user.cursor.y,
                  pointerEvents: 'none',
                  color: 'primary.main'
                }}
              >
                <CursorIcon fontSize="small" />
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Participants Drawer */}
      <Drawer
        anchor="right"
        open={usersDrawerOpen}
        onClose={() => setUsersDrawerOpen(false)}
        PaperProps={{ sx: { width: 300 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Participants ({participants.length})
          </Typography>
          <List>
            {participants.map((user) => (
              <ListItem key={user.id}>
                <ListItemAvatar>
                  <Avatar>
                    {user.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={user.role}
                />
                <Chip
                  label="Online"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        PaperProps={{ sx: { width: 350, display: 'flex', flexDirection: 'column' } }}
      >
        <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            <ChatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Chat
          </Typography>
          
          {/* Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
            {chatMessages.map((msg) => (
              <Paper
                key={msg.id}
                sx={{
                  p: 1.5,
                  mb: 1,
                  backgroundColor: msg.userId === currentUser?.id ? 'primary.light' : 'grey.100'
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  {msg.userName}
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Typography>
                </Typography>
                <Typography variant="body2">{msg.message}</Typography>
              </Paper>
            ))}
          </Box>

          {/* Message Input */}
          <Box>
            <TextField
              fullWidth
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              size="small"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </Box>
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default CanvasRoom;