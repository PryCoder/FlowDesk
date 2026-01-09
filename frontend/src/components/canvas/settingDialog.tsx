import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Typography,
  Divider
} from '@mui/material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  currentSettings: any;
  onSave: (settings: any) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  roomId,
  currentSettings,
  onSave
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(currentSettings);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const CANVAS_API = `${API_BASE_URL}/api/canvas`;

  useEffect(() => {
    if (open) {
      setSettings(currentSettings);
      setError('');
    }
  }, [open, currentSettings]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${CANVAS_API}/${roomId}/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        const data = await res.json();
        onSave(data.room.settings);
        onClose();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to update settings');
      }
    } catch (error) {
      setError('Error updating settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Room Settings</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Canvas Tools
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.allowDrawing}
                  onChange={(e) => setSettings({
                    ...settings,
                    allowDrawing: e.target.checked
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
                  checked={settings.allowShapes}
                  onChange={(e) => setSettings({
                    ...settings,
                    allowShapes: e.target.checked
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
                  checked={settings.allowText}
                  onChange={(e) => setSettings({
                    ...settings,
                    allowText: e.target.checked
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
                  checked={settings.allowStickyNotes}
                  onChange={(e) => setSettings({
                    ...settings,
                    allowStickyNotes: e.target.checked
                  })}
                />
              }
              label="Allow Sticky Notes"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <TextField
          fullWidth
          label="Maximum Users"
          type="number"
          value={settings.maxUsers}
          onChange={(e) => setSettings({
            ...settings,
            maxUsers: parseInt(e.target.value) || 50
          })}
          margin="normal"
          inputProps={{ min: 1, max: 100 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={settings.readOnly}
              onChange={(e) => setSettings({
                ...settings,
                readOnly: e.target.checked
              })}
            />
          }
          label="Read-only mode"
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;