import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';

interface CreateRoomDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
    settings: {
      allowDrawing: true,
      allowShapes: true,
      allowText: true,
      allowStickyNotes: true,
      maxUsers: 50
    }
  });

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const CANVAS_API = `${API_BASE_URL}/api/canvas`;

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login first');
      return;
    }

    if (!formData.title.trim()) {
      setError('Room title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${CANVAS_API}/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Room created successfully! Room code: ${data.room?.room_code}`);
        onSuccess();
        resetForm();
      } else {
        setError(data.error || 'Failed to create room');
      }
    } catch (error) {
      setError('Error creating room');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      is_public: false,
      settings: {
        allowDrawing: true,
        allowShapes: true,
        allowText: true,
        allowStickyNotes: true,
        maxUsers: 50
      }
    });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Canvas Room</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Room Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              />
            }
            label="Make room public (anyone with link can join)"
            sx={{ mt: 2 }}
          />

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
            Room Settings
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.settings.allowDrawing}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, allowDrawing: e.target.checked }
                    })}
                  />
                }
                label="Allow Drawing"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.settings.allowShapes}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, allowShapes: e.target.checked }
                    })}
                  />
                }
                label="Allow Shapes"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.settings.allowText}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, allowText: e.target.checked }
                    })}
                  />
                }
                label="Allow Text"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.settings.allowStickyNotes}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, allowStickyNotes: e.target.checked }
                    })}
                  />
                }
                label="Allow Sticky Notes"
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Maximum Users"
            type="number"
            value={formData.settings.maxUsers}
            onChange={(e) => setFormData({
              ...formData,
              settings: { ...formData.settings, maxUsers: parseInt(e.target.value) || 50 }
            })}
            margin="normal"
            inputProps={{ min: 1, max: 100 }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.title.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Room'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateRoomDialog;