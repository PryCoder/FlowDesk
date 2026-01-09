import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
  Send as SendIcon
} from '@mui/icons-material';

const JoinRoom: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [room, setRoom] = useState<any>(null);
  const [invitationToken, setInvitationToken] = useState('');

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const CANVAS_API = `${API_BASE_URL}/api/canvas`;

  useEffect(() => {
    // Check for invitation token in URL
    const token = searchParams.get('token');
    if (token) {
      handleAcceptInvitation(token);
    } else if (roomCode) {
      fetchRoomDetails();
    }
  }, [roomCode, searchParams]);

  const fetchRoomDetails = async () => {
    if (!roomCode) return;

    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login with return URL
      navigate(`/login?return=/canvas/join/${roomCode}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${CANVAS_API}/join/${roomCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setRoom(data.room);
      } else if (res.status === 401) {
        navigate('/login');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Cannot join room');
      }
    } catch (error) {
      setError('Error fetching room details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (token: string) => {
    const userToken = localStorage.getItem('token');
    if (!userToken) {
      navigate(`/login?token=${token}`);
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`${CANVAS_API}/accept/${token}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        navigate(`/canvas/room/${data.room.id}`);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Invalid invitation');
      }
    } catch (error) {
      setError('Error accepting invitation');
      console.error(error);
    } finally {
      setJoining(false);
    }
  };

  const handleJoinRoom = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setJoining(true);
    try {
      const res = await fetch(`${CANVAS_API}/join/${roomCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        navigate(`/canvas/room/${data.room.id}`);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to join room');
      }
    } catch (error) {
      setError('Error joining room');
      console.error(error);
    } finally {
      setJoining(false);
    }
  };

  if (joining) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, margin: '0 auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/canvas')}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      <Paper sx={{ p: 4 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : room ? (
          <>
            <Typography variant="h4" gutterBottom>
              Join Canvas Room
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {room.title}
                </Typography>
                
                {room.description && (
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {room.description}
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LinkIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        Room Code: <strong>{room.room_code}</strong>
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => navigator.clipboard.writeText(room.room_code)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {room.is_public ? (
                        <>
                          <LockIcon fontSize="small" color="success" />
                          <Typography variant="body2">
                            <Chip label="Public" size="small" color="success" />
                          </Typography>
                        </>
                      ) : (
                        <>
                          <LockIcon fontSize="small" color="warning" />
                          <Typography variant="body2">
                            <Chip label="Private" size="small" color="warning" />
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        Expires: {new Date(room.expires_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Room Settings:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {room.settings.allowDrawing && (
                      <Chip label="Drawing" size="small" color="primary" variant="outlined" />
                    )}
                    {room.settings.allowShapes && (
                      <Chip label="Shapes" size="small" color="primary" variant="outlined" />
                    )}
                    {room.settings.allowText && (
                      <Chip label="Text" size="small" color="primary" variant="outlined" />
                    )}
                    {room.settings.allowStickyNotes && (
                      <Chip label="Sticky Notes" size="small" color="primary" variant="outlined" />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleJoinRoom}
                startIcon={<SendIcon />}
              >
                Join Room
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Typography variant="h4" gutterBottom>
              Join Canvas Room
            </Typography>
            
            <Typography variant="body1" paragraph>
              Enter the room code provided by the room creator:
            </Typography>

            <TextField
              fullWidth
              label="Room Code"
              value={roomCode || ''}
              InputProps={{ readOnly: true }}
              sx={{ mb: 3 }}
            />

            <Alert severity="info" sx={{ mb: 3 }}>
              You need to be logged in and have permission to join this room.
            </Alert>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => navigate('/login')}
            >
              Login to Join
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default JoinRoom;