import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  Public as PublicIcon,
  Lock as LockIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import CreateRoomDialog from './createRoomDialog';
import InviteDrawer from './inviteDrawer';

interface CanvasRoom {
  id: string;
  title: string;
  description?: string;
  room_code: string;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  participantCount: number;
  created_by: string;
}

const CanvasDashboard: React.FC = () => {
  const [rooms, setRooms] = useState<CanvasRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const CANVAS_API = `${API_BASE_URL}/api/canvas`;
  const USERS_API = `${API_BASE_URL}/api/auth`;

  // Get current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`${USERS_API}/current-user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user || data);
          setUserRole(data.role || data.user?.role || 'employee');
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  // Fetch user's canvas rooms
  const fetchUserRooms = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${CANVAS_API}/user/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      } else {
        setError('Failed to load canvas rooms');
      }
    } catch (error) {
      setError('Error loading canvas rooms');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch company rooms (admin only)
  const fetchCompanyRooms = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${CANVAS_API}/company/rooms?page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      } else if (res.status === 403) {
        // If not admin, fall back to user rooms
        await fetchUserRooms();
      } else {
        setError('Failed to load canvas rooms');
      }
    } catch (error) {
      setError('Error loading canvas rooms');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'admin') {
      fetchCompanyRooms();
    } else {
      fetchUserRooms();
    }
  }, [userRole]);

  // Handle room menu
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, roomId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRoom(roomId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRoom(null);
  };

  // Copy room link
  const handleCopyLink = async () => {
    const room = rooms.find(r => r.id === selectedRoom);
    if (room) {
      const link = `${window.location.origin}/canvas/join/${room.room_code}`;
      await navigator.clipboard.writeText(link);
      alert('Room link copied to clipboard!');
      handleMenuClose();
    }
  };

  // Leave room
  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${CANVAS_API}/${selectedRoom}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        fetchUserRooms();
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    } finally {
      handleMenuClose();
    }
  };

  // Open invite drawer
  const handleOpenInviteDrawer = (roomId: string) => {
    setSelectedRoom(roomId);
    setInviteDrawerOpen(true);
    handleMenuClose();
  };

  // Join room
  const handleJoinRoom = async (roomCode: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

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
        alert(errorData.error || 'Failed to join room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Error joining room');
    }
  };

  // Filter rooms by search
  const filteredRooms = rooms.filter(room =>
    room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.room_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Collaborative Canvas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {userRole === 'admin' ? 'Manage and join canvas rooms' : 'Join available canvas rooms'}
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <TextField
            placeholder="Search rooms..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
            }}
          />
          {userRole === 'admin' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Room
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={userRole === 'admin' ? fetchCompanyRooms : fetchUserRooms}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Rooms Grid */}
      <Grid container spacing={3}>
        {filteredRooms.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No canvas rooms found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {userRole === 'admin' 
                  ? 'Create your first canvas room to start collaborating'
                  : 'You haven\'t joined any canvas rooms yet'
                }
              </Typography>
              {userRole === 'admin' && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Your First Room
                </Button>
              )}
            </Paper>
          </Grid>
        ) : (
          filteredRooms.map((room) => (
            <Grid item xs={12} md={6} lg={4} key={room.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {room.title}
                        <Chip
                          label={room.is_public ? 'Public' : 'Private'}
                          size="small"
                          icon={room.is_public ? <PublicIcon /> : <LockIcon />}
                          sx={{ ml: 1 }}
                          color={room.is_public ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Typography>
                      {room.description && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {room.description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, room.id)}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Room Info */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <GroupIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {room.participantCount || 0} participants
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {new Date(room.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Room Code */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LinkIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontFamily="monospace">
                        {room.room_code}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText(room.room_code)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Action Buttons */}
                  <Box display="flex" gap={1}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleJoinRoom(room.room_code)}
                    >
                      Join Room
                    </Button>
                    {userRole === 'admin' && (
                      <Button
                        variant="outlined"
                        onClick={() => handleOpenInviteDrawer(room.id)}
                      >
                        Invite
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Room Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleCopyLink}>
          <LinkIcon sx={{ mr: 1 }} fontSize="small" />
          Copy Room Link
        </MenuItem>
        {selectedRoom && (
          <MenuItem onClick={() => handleOpenInviteDrawer(selectedRoom)}>
            <GroupIcon sx={{ mr: 1 }} fontSize="small" />
            Invite Users
          </MenuItem>
        )}
        <MenuItem onClick={handleLeaveRoom}>
          <LockIcon sx={{ mr: 1 }} fontSize="small" />
          Leave Room
        </MenuItem>
      </Menu>

      {/* Create Room Dialog */}
      <CreateRoomDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          setCreateDialogOpen(false);
          fetchCompanyRooms();
        }}
      />

      {/* Invite Drawer */}
      <InviteDrawer
        open={inviteDrawerOpen}
        onClose={() => setInviteDrawerOpen(false)}
        roomId={selectedRoom}
        roomTitle={rooms.find(r => r.id === selectedRoom)?.title || ''}
      />
    </Box>
  );
};

export default CanvasDashboard;