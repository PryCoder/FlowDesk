import React, { useState, useEffect, useRef, useCallback } from 'react';
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

type ToolType = 'brush' | 'shape' | 'text' | 'sticky' | 'eraser';

interface BrushStrokePoint {
  x: number;
  y: number;
}

interface BrushStroke {
  id: string;
  userId: string;
  color: string;
  size: number;
  points: BrushStrokePoint[];
  isEraser?: boolean;
}

interface ShapeRect {
  id: string;
  userId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface CanvasText {
  id: string;
  userId: string;
  x: number;
  y: number;
  value: string;
  color: string;
}

interface StickyNote {
  id: string;
  userId: string;
  x: number;
  y: number;
  text: string;
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
  const [tool, setTool] = useState<ToolType>('brush');
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, value: '' });

  const [brushStrokes, setBrushStrokes] = useState<BrushStroke[]>([]);
  const [shapes, setShapes] = useState<ShapeRect[]>([]);
  const [texts, setTexts] = useState<CanvasText[]>([]);
  const [stickies, setStickies] = useState<StickyNote[]>([]);
  const currentStrokeRef = useRef<BrushStroke | null>(null);
  const tempShapeRef = useRef<ShapeRect | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const CANVAS_API = `${API_BASE_URL}/api/canvas`;
  const SOCKET_URL = API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
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

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    brushStrokes.forEach(stroke => {
      if (!stroke.points.length) return;
      ctx.strokeStyle = stroke.isEraser ? '#f8f9fa' : stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });

    shapes.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    });

    if (tempShapeRef.current) {
      const s = tempShapeRef.current;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(s.x, s.y, s.width, s.height);
      ctx.setLineDash([]);
    }

    stickies.forEach(sticky => {
      ctx.fillStyle = '#ffff88';
      ctx.strokeStyle = '#e0e000';
      ctx.fillRect(sticky.x, sticky.y, 140, 80);
      ctx.strokeRect(sticky.x, sticky.y, 140, 80);
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      const lines = sticky.text.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, sticky.x + 8, sticky.y + 20 + i * 14);
      });
    });

    texts.forEach(t => {
      ctx.fillStyle = t.color;
      ctx.font = '16px Arial';
      ctx.fillText(t.value, t.x, t.y);
    });
  }, [brushStrokes, shapes, texts, stickies]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    if (!roomId || !currentUser) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket']
    });

    const socket = socketRef.current;

    socket.emit('join-canvas-room', {
      roomId,
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      userRole: currentUser.role,
      permissions: {}
    });

    socket.on('room-state', (data) => {
      setParticipants(data.users || []);
      setChatMessages(data.chatHistory || []);
    });

    socket.on('canvas-draw-update', (stroke: BrushStroke) => {
      setBrushStrokes(prev => [...prev, stroke]);
    });

    socket.on('shape-added', (shape: ShapeRect) => {
      setShapes(prev => [...prev, shape]);
    });

    socket.on('text-added', (text: CanvasText) => {
      setTexts(prev => [...prev, text]);
    });

    socket.on('sticky-added', (sticky: StickyNote) => {
      setStickies(prev => [...prev, sticky]);
    });

    socket.on('canvas-cleared', () => {
      setBrushStrokes([]);
      setShapes([]);
      setTexts([]);
      setStickies([]);
    });

    return () => {
      if (socket) {
        socket.emit('leave-canvas-room', { roomId, userId: currentUser.id });
        socket.disconnect();
      }
    };
  }, [roomId, currentUser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !roomId || !currentUser) return;

    const getMousePos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseDown = (e: MouseEvent) => {
      const pos = getMousePos(e);
      setIsDrawing(true);
      setStartPos(pos);
      setCursorPosition(pos);

      if (tool === 'brush' || tool === 'eraser') {
        const stroke: BrushStroke = {
          id: `${Date.now()}-${Math.random()}`,
          userId: currentUser.id,
          color: tool === 'eraser' ? '#f8f9fa' : '#000000',
          size: tool === 'eraser' ? 12 : 3,
          points: [pos],
          isEraser: tool === 'eraser',
        };
        currentStrokeRef.current = stroke;
        setBrushStrokes(prev => [...prev, stroke]);
      } else if (tool === 'text') {
        setTextInput({ visible: true, x: pos.x, y: pos.y, value: '' });
      } else if (tool === 'sticky') {
        const sticky: StickyNote = {
          id: `${Date.now()}-${Math.random()}`,
          userId: currentUser.id,
          x: pos.x,
          y: pos.y,
          text: 'Sticky Note',
        };
        setStickies(prev => [...prev, sticky]);
        if (socketRef.current) {
          socketRef.current.emit('sticky-added', { roomId, sticky });
        }
      } else if (tool === 'shape') {
        tempShapeRef.current = {
          id: `${Date.now()}-${Math.random()}`,
          userId: currentUser.id,
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          color: '#000000',
        };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getMousePos(e);
      setCursorPosition(pos);

      if (isDrawing) {
        if (tool === 'brush' || tool === 'eraser') {
          if (currentStrokeRef.current) {
            const strokeId = currentStrokeRef.current.id;
            setBrushStrokes(prev =>
              prev.map(s =>
                s.id === strokeId
                  ? { ...s, points: [...s.points, pos] }
                  : s
              )
            );
          }
        } else if (tool === 'shape' && tempShapeRef.current) {
          const s = tempShapeRef.current;
          tempShapeRef.current = {
            ...s,
            width: pos.x - s.x,
            height: pos.y - s.y,
          };
          redrawCanvas();
        }
      }

      if (socketRef.current) {
        socketRef.current.emit('cursor-move', {
          roomId,
          userId: currentUser.id,
          cursor: pos,
        });
      }
    };

    const handleMouseUp = () => {
      if (isDrawing) {
        if ((tool === 'brush' || tool === 'eraser') && currentStrokeRef.current) {
          const finishedStroke = currentStrokeRef.current;
          currentStrokeRef.current = null;
          if (socketRef.current) {
            socketRef.current.emit('canvas-draw-update', {
              roomId,
              stroke: finishedStroke,
            });
          }
        } else if (tool === 'shape' && tempShapeRef.current) {
          const finalShape = tempShapeRef.current;
          tempShapeRef.current = null;
          setShapes(prev => [...prev, finalShape]);
          if (socketRef.current) {
            socketRef.current.emit('shape-added', {
              roomId,
              shape: finalShape,
            });
          }
        }
        setIsDrawing(false);
      }
    };

    const handleMouseLeave = () => {
      if (isDrawing) handleMouseUp();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [roomId, currentUser, tool, isDrawing, redrawCanvas]);

  const handleTextSubmit = () => {
    const { visible, x, y, value } = textInput;
    if (!visible || !value.trim() || !currentUser) {
      setTextInput({ visible: false, x: 0, y: 0, value: '' });
      return;
    }
    const text: CanvasText = {
      id: `${Date.now()}-${Math.random()}`,
      userId: currentUser.id,
      x,
      y,
      value: value.trim(),
      color: '#000000',
    };
    setTexts(prev => [...prev, text]);
    if (socketRef.current) {
      socketRef.current.emit('text-added', { roomId, text });
    }
    setTextInput({ visible: false, x: 0, y: 0, value: '' });
  };

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
    setBrushStrokes([]);
    setShapes([]);
    setTexts([]);
    setStickies([]);
    if (socketRef.current && currentUser) {
      socketRef.current.emit('canvas-clear', {
        roomId,
        userId: currentUser.id,
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
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid size={{ xs: 'auto' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/canvas')}
            >
              Back
            </Button>
          </Grid>
          <Grid size={{ xs: true }}>
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
          <Grid size={{ xs: 'auto' }}>
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

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Paper sx={{ width: 60, display: 'flex', flexDirection: 'column', p: 1 }}>
          <Tooltip title="Brush" placement="right">
            <IconButton
              color={tool === 'brush' ? 'primary' : 'default'}
              onClick={() => setTool('brush')}
            >
              <BrushIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eraser" placement="right">
            <IconButton
              color={tool === 'eraser' ? 'primary' : 'default'}
              onClick={() => setTool('eraser')}
            >
              <ClearIcon />
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

        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f8f9fa',
              cursor:
                tool === 'brush' || tool === 'eraser'
                  ? 'crosshair'
                  : tool === 'text'
                  ? 'text'
                  : 'pointer',
            }}
          />

          {textInput.visible && (
            <TextField
              size="small"
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
              onBlur={handleTextSubmit}
              autoFocus
              sx={{
                position: 'absolute',
                left: textInput.x,
                top: textInput.y,
                zIndex: 10,
              }}
            />
          )}

          {participants.filter(user => user && user.cursor).map((user) => (
            <Tooltip key={user.id} title={user.name} arrow>
              <Box
                sx={{
                  position: 'absolute',
                  left: user.cursor.x,
                  top: user.cursor.y,
                  pointerEvents: 'none',
                  color: 'primary.main',
                }}
              >
                <CursorIcon fontSize="small" />
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Box>

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
            {participants.filter(user => user && user.name).map((user) => (
              <ListItem key={user.id}>
                <ListItemAvatar>
                  <Avatar>
                    {user.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name}
                  secondary={user.role || 'Unknown'}
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