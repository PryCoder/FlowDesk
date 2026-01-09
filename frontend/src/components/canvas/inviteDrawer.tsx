import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Group as GroupIcon,
  Email as EmailIcon
} from '@mui/icons-material';

interface Employee {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  position?: string;
}

interface InviteDrawerProps {
  open: boolean;
  onClose: () => void;
  roomId: string | null;
  roomTitle: string;
}

const InviteDrawer: React.FC<InviteDrawerProps> = ({ open, onClose, roomId, roomTitle }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailInvite, setEmailInvite] = useState('');
  const [permissions, setPermissions] = useState({
    canDraw: true,
    canEdit: true,
    canInvite: false
  });

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const CANVAS_API = `${API_BASE_URL}/api/canvas`;
  const USERS_API = `${API_BASE_URL}/api/auth`;

  // Fetch employees
  useEffect(() => {
    if (open && roomId) {
      fetchEmployees();
    }
  }, [open, roomId]);

  const fetchEmployees = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${USERS_API}/company/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const handleInviteSelected = async () => {
    if (!roomId || selectedEmployees.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const invitationData = {
        userIds: selectedEmployees,
        permissions
      };

      const res = await fetch(`${CANVAS_API}/${roomId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invitationData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Invited ${selectedEmployees.length} employee(s) successfully`);
        setSelectedEmployees([]);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to send invitations');
      }
    } catch (error) {
      setError('Error sending invitations');
      console.error(error);
    } finally {
      setInviting(false);
    }
  };

  const handleEmailInvite = async () => {
    if (!roomId || !emailInvite.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const invitationData = {
        email: emailInvite.trim(),
        permissions
      };

      const res = await fetch(`${CANVAS_API}/${roomId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invitationData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Invitation sent to ${emailInvite}`);
        setEmailInvite('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      setError('Error sending invitation');
      console.error(error);
    } finally {
      setInviting(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 400 } }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6">Invite to Canvas Room</Typography>
            <Typography variant="body2" color="text.secondary">
              {roomTitle}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Email Invite */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <EmailIcon sx={{ mr: 1, fontSize: 16 }} />
            Invite by Email
          </Typography>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              placeholder="Enter email address"
              size="small"
              value={emailInvite}
              onChange={(e) => setEmailInvite(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleEmailInvite}
              disabled={!emailInvite.trim() || inviting}
              startIcon={inviting ? <CircularProgress size={20} /> : <SendIcon />}
            >
              Send
            </Button>
          </Box>
        </Paper>

        {/* Permissions */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <GroupIcon sx={{ mr: 1, fontSize: 16 }} />
            Permissions for Invited Users
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            <Chip
              label="Can Draw"
              color={permissions.canDraw ? "primary" : "default"}
              onClick={() => setPermissions({ ...permissions, canDraw: !permissions.canDraw })}
              size="small"
            />
            <Chip
              label="Can Edit"
              color={permissions.canEdit ? "primary" : "default"}
              onClick={() => setPermissions({ ...permissions, canEdit: !permissions.canEdit })}
              size="small"
            />
            <Chip
              label="Can Invite"
              color={permissions.canInvite ? "primary" : "default"}
              onClick={() => setPermissions({ ...permissions, canInvite: !permissions.canInvite })}
              size="small"
            />
          </Box>
        </Paper>

        {/* Employee List Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1">
            Company Employees
            <Badge
              badgeContent={selectedEmployees.length}
              color="primary"
              sx={{ ml: 1 }}
            />
          </Typography>
          <Button
            size="small"
            onClick={handleSelectAll}
            disabled={loading || filteredEmployees.length === 0}
          >
            {selectedEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>

        {/* Search */}
        <TextField
          placeholder="Search employees..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Employee List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : filteredEmployees.length === 0 ? (
            <Box textAlign="center" p={3}>
              <PersonAddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">
                {searchQuery ? 'No employees found' : 'No employees available'}
              </Typography>
            </Box>
          ) : (
            <List dense>
              {filteredEmployees.map((employee) => (
                <ListItem
                  key={employee.id}
                  button
                  onClick={() => handleEmployeeSelect(employee.id)}
                  selected={selectedEmployees.includes(employee.id)}
                >
                  <Checkbox
                    edge="start"
                    checked={selectedEmployees.includes(employee.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemText
                    primary={`${employee.first_name} ${employee.last_name}`}
                    secondary={
                      <>
                        {employee.email}
                        {employee.department && (
                          <Chip
                            label={employee.department}
                            size="small"
                            sx={{ ml: 1, height: 20 }}
                          />
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {selectedEmployees.includes(employee.id) && (
                      <CheckIcon color="primary" />
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" gap={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleInviteSelected}
              disabled={selectedEmployees.length === 0 || inviting}
              startIcon={
                inviting ? <CircularProgress size={20} /> : <SendIcon />
              }
            >
              Invite Selected ({selectedEmployees.length})
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default InviteDrawer;