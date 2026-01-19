import React, { useState } from 'react';
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
  employees: Employee[];
}

const InviteDrawer: React.FC<InviteDrawerProps> = ({ open, onClose, roomId, roomTitle, employees }) => {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
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

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
  const CANVAS_API = `${API_BASE_URL}/api/canvas`;

  // Employee selection
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

  // Filter employees by search query
  const filteredEmployees = employees.filter(emp =>
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generic API call to invite
  const sendInvite = async (body: any) => {
    if (!roomId) {
      setError('Room ID is missing.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first.');
      return;
    }

    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${CANVAS_API}/${roomId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));
console.log(data);
      if (res.ok) {
        // Success
        if (body.userIds) {
          setSuccess(`Invited ${body.userIds.length} employee(s) successfully`);
          setSelectedEmployees([]);
        } else if (body.email) {
          setSuccess(`Invitation sent to ${body.email}`);
          setEmailInvite('');
        }
      } else {
        setError(data.error || `Failed to invite. Status code: ${res.status}`);
      }
    } catch (err: any) {
      console.error('Network error:', err);
      setError('Network error while sending invitation');
    } finally {
      setInviting(false);
      // auto-clear success/error after 3s
      setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
    }
  };

  // Invite selected employees
  const handleInviteSelected = () => {
    if (selectedEmployees.length === 0) return;
    sendInvite({ userIds: selectedEmployees, permissions });
  };

  // Invite by email
  const handleEmailInvite = () => {
    if (!emailInvite.trim()) return;
    sendInvite({ email: emailInvite.trim(), permissions });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 400 } }}>
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6">Invite to Canvas Room</Typography>
            <Typography variant="body2" color="text.secondary">{roomTitle}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>

        {/* Error / Success */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Email Invite */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            <EmailIcon sx={{ mr: 1, fontSize: 16 }} /> Invite by Email
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
            <GroupIcon sx={{ mr: 1, fontSize: 16 }} /> Permissions for Invited Users
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

        {/* Employee Search & List */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1">
            Company Employees
            <Badge badgeContent={selectedEmployees.length} color="primary" sx={{ ml: 1 }} />
          </Typography>
          <Button size="small" onClick={handleSelectAll} disabled={filteredEmployees.length === 0}>
            {selectedEmployees.length === filteredEmployees.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>

        <TextField
          placeholder="Search employees..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />

        <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          {filteredEmployees.length === 0 ? (
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
                      <Typography component="div" variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                        {employee.email}
                        {employee.department && <Chip label={employee.department} size="small" sx={{ ml: 1, height: 20 }} />}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    {selectedEmployees.includes(employee.id) && <CheckIcon color="primary" />}
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
            <Button fullWidth variant="outlined" onClick={onClose}>Cancel</Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleInviteSelected}
              disabled={selectedEmployees.length === 0 || inviting}
              startIcon={inviting ? <CircularProgress size={20} /> : <SendIcon />}
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
