// services/integrationService.js
import { google } from 'googleapis';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const DEFAULT_TIMEOUT = 60_000;

// -------------------- GOOGLE CALENDAR -------------------- //
export async function addToGoogleCalendar(meeting, accessToken, options = {}) {
  try {
    if (!accessToken) {
      throw new Error('Google access token required');
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    auth.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth });

    // Validate and format dates
    const startTime = new Date(meeting.scheduled_start);
    const endTime = new Date(meeting.scheduled_end || meeting.scheduled_start);
    
    if (!meeting.scheduled_end) {
      // Default to 1 hour if no end time provided
      endTime.setHours(endTime.getHours() + 1);
    }

    const event = {
      summary: meeting.title,
      description: meeting.description || `Meeting created via Meeting Assistant`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: (options.attendees || []).map(email => ({ email })),
      conferenceData: options.createMeet ? {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      } : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 10 },
          { method: 'email', minutes: 60 }
        ]
      }
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: options.createMeet ? 1 : 0,
      sendUpdates: options.sendUpdates || 'all',
    });

    return {
      ok: true,
      eventId: res.data.id,
      hangoutLink: res.data.hangoutLink || res.data.conferenceData?.entryPoints?.[0]?.uri || null,
      htmlLink: res.data.htmlLink
    };
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return {
      ok: false,
      error: error.message,
      details: error.response?.data
    };
  }
}

export async function updateGoogleCalendarEvent(eventId, meeting, accessToken) {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth });

    const startTime = new Date(meeting.scheduled_start);
    const endTime = new Date(meeting.scheduled_end || meeting.scheduled_start);
    
    if (!meeting.scheduled_end) {
      endTime.setHours(endTime.getHours() + 1);
    }

    const event = {
      summary: meeting.title,
      description: meeting.description,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      resource: event,
    });

    return { ok: true };
  } catch (error) {
    console.error('Google Calendar update error:', error);
    return { ok: false, error: error.message };
  }
}

// -------------------- EMPLOYEE/USER MANAGEMENT -------------------- //
export async function getCompanyEmployees(companyId, accessToken) {
  try {
    const USERS_API = process.env.USERS_API || 'http://localhost:3001/api';
    
    const response = await fetch(`${USERS_API}/companies/${companyId}/employees`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch employees: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different response structures
    if (data.success && data.employees) {
      return data.employees;
    } else if (Array.isArray(data)) {
      return data;
    } else if (data.data) {
      return data.data;
    } else {
      console.warn('Unexpected employee data format:', data);
      return [];
    }
  } catch (error) {
    console.error('getCompanyEmployees error:', error);
    throw new Error(`Failed to fetch company employees: ${error.message}`);
  }
}

export async function getUserProfile(userId, accessToken) {
  try {
    const USERS_API = process.env.USERS_API || 'http://localhost:3001/api';
    
    const response = await fetch(`${USERS_API}/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return data.user || data.data || data;
  } catch (error) {
    console.error('getUserProfile error:', error);
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }
}

// -------------------- AUDIO TRANSCRIPTION -------------------- //
export async function transcribeAudio(filePath, { model = 'base', language = 'en', timeout = DEFAULT_TIMEOUT } = {}) {
  if (!fs.existsSync(filePath)) throw new Error('Audio file does not exist');

  const whisperCmd = process.env.WHISPER_CMD || 'whisper';
  return new Promise((resolve, reject) => {
    const args = [filePath, '--model', model, '--language', language];
    const proc = spawn(whisperCmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let transcript = '';
    let stderr = '';

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('Transcription timed out'));
    }, timeout);

    proc.stdout.on('data', (d) => {
      transcript += d.toString();
    });

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        if (!transcript.trim()) {
          const txtPath = path.join(path.dirname(filePath), `${path.basename(filePath)}.txt`);
          if (fs.existsSync(txtPath)) {
            const fileText = fs.readFileSync(txtPath, 'utf8');
            resolve(fileText.trim());
            return;
          }
        }
        resolve(transcript.trim());
      } else {
        console.error('whisper stderr:', stderr);
        reject(new Error(`Whisper failed with exit ${code}`));
      }
    });
  });
}

// -------------------- NOTION / TRELLO SYNC -------------------- //
export async function syncMeetingData(meeting, user) {
  // Notion
  try {
    if (user.notionToken && user.notionDatabaseId && (meeting.action_items || []).length > 0) {
      for (const action of meeting.action_items) {
        const body = {
          parent: { database_id: user.notionDatabaseId },
          properties: {
            Name: { title: [{ text: { content: action.task || 'Action item' } }] },
            Status: { select: { name: 'To Do' } },
          },
        };
        if (user.userId) body.properties.Assigned = { people: [{ id: user.userId }] };

        const r = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.notionToken}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!r.ok) {
          const err = await r.text();
          console.warn('Notion create page error:', err);
        }
      }
    }
  } catch (err) {
    console.warn('Notion sync error:', err.message);
  }

  // Trello
  try {
    if (user.trelloKey && user.trelloToken && user.trelloListId && (meeting.action_items || []).length > 0) {
      for (const action of meeting.action_items) {
        await fetch(
          `https://api.trello.com/1/cards?key=${user.trelloKey}&token=${user.trelloToken}&idList=${user.trelloListId}&name=${encodeURIComponent(
            action.task || 'Meeting Task'
          )}`
        );
      }
    }
  } catch (err) {
    console.warn('Trello sync error:', err.message);
  }

  return true;
}

// -------------------- AI GENERATION (OLLAMA) -------------------- //
export async function generateWithOllama(prompt, model = 'mistral', { timeout = 30_000 } = {}) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ model, prompt, stream: false }),
    });

    clearTimeout(id);

    if (!response.ok) {
      const t = await response.text();
      console.error('Ollama non-ok response:', t);
      return '';
    }

    const data = await response.json();
    return data.response || data.output || '';
  } catch (err) {
    console.error('Ollama error:', err.message || err);
    return '';
  }
}

// -------------------- CRUD-BASED NOTIFICATION SYSTEM -------------------- //
export async function sendNotification(toUser, subject, message, metadata = {}) {
  try {
    const NOTIFY_API = process.env.NOTIFY_API || null;
    if (!NOTIFY_API) {
      console.warn('NO NOTIFY_API configured; skipping notification');
      return false;
    }

    const payload = {
      userId: toUser.id,
      title: subject,
      message,
      type: 'meeting',
      status: 'unread',
      metadata,
      createdAt: new Date().toISOString(),
    };

    const res = await fetch(NOTIFY_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SYSTEM_TOKEN || ''}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Notification service error: ${errText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Notification send error:', error.message);
    return false;
  }
}

const integrationService = {
  addToGoogleCalendar,
  updateGoogleCalendarEvent,
  getCompanyEmployees,
  getUserProfile,
  transcribeAudio,
  syncMeetingData,
  generateWithOllama,
  sendNotification,
};

export default integrationService;