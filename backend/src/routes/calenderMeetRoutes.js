import express from 'express';
import calendarService from '../services/calendarService.js';
import meetService from '../services/meetService.js';
import tokenService from '../services/tokenService.js';
import authService from '../services/authService.js';

const router = express.Router();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = await authService.verifyToken(token);
    if (!decoded?.userId) return res.status(401).json({ error: 'Invalid or expired token' });

    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid token' });
  }
};
// ==================== TOKEN MANAGEMENT ROUTES ====================

// Get user's connected services
router.get('/connected-services', authenticate, async (req, res) => {
  try {
    const services = await tokenService.getUserConnectedServices(req.user.userId);
    res.json({ success: true, services });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Disconnect a service
router.delete('/disconnect/:service', authenticate, async (req, res) => {
  try {
    const { service } = req.params;
    const result = await tokenService.deleteUserTokens(req.user.userId, service);
    res.json({ success: true, message: `${service} disconnected successfully` });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== CALENDAR ROUTES ====================

// Get Calendar Auth URL
router.get('/calendar/auth-url', authenticate, (req, res) => {
  try {
    const authUrl = calendarService.getCalendarAuthUrl();
    res.json({ success: true, authUrl });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Handle Calendar Callback
router.post('/calendar/callback', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n📅 [${requestId}] CALENDAR CALLBACK STARTED`);
    console.log(`👤 User: ${req.user.userId}`);
    
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization code is required' 
      });
    }

    // Exchange code for tokens
    const result = await calendarService.handleCalendarCallback(code);
    
    // Store tokens in database
    await tokenService.storeUserTokens(
      req.user.userId, 
      'calendar', 
      result.tokens
    );

    console.log(`✅ [${requestId}] CALENDAR AUTH SUCCESS for user ${req.user.userId}`);
    
    res.json({
      success: true,
      message: 'Calendar connected successfully',
      service: 'calendar'
    });
    
  } catch (error) {
    console.error(`💥 [CALENDAR CALLBACK] Failed:`, error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Sync User Calendars
router.post('/calendar/sync-calendars', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n📅 [${requestId}] SYNC CALENDARS STARTED`);
    console.log(`👤 User: ${req.user.userId}`);
    
    const tokens = await tokenService.getUserTokens(req.user.userId, 'calendar');
    const result = await calendarService.syncUserCalendars(req.user.userId, tokens);
    
    console.log(`✅ [${requestId}] SYNC CALENDARS SUCCESS: ${result.total} calendars synced`);
    
    res.json(result);
  } catch (error) {
    console.error(`💥 [${requestId}] SYNC CALENDARS FAILED:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Sync Calendar Events
router.post('/calendar/sync-events', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n📅 [${requestId}] SYNC EVENTS STARTED`);
    
    const { calendarId, timeMin, timeMax, maxResults = 100 } = req.body;
    const tokens = await tokenService.getUserTokens(req.user.userId, 'calendar');
    
    const result = await calendarService.syncCalendarEvents(
      req.user.userId, 
      calendarId, 
      tokens, 
      timeMin, 
      timeMax
    );
    
    console.log(`✅ [${requestId}] SYNC EVENTS SUCCESS: ${result.total} events synced`);
    
    res.json(result);
  } catch (error) {
    console.error(`💥 [${requestId}] SYNC EVENTS FAILED:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Create Event
router.post('/calendar/events', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n📅 [${requestId}] CREATE EVENT STARTED`);
    
    const { calendarId, eventData } = req.body;
    const tokens = await tokenService.getUserTokens(req.user.userId, 'calendar');
    
    const result = await calendarService.createEvent(
      req.user.userId, 
      calendarId, 
      eventData, 
      tokens
    );
    
    console.log(`✅ [${requestId}] CREATE EVENT SUCCESS: ${result.event.title}`);
    
    res.json(result);
  } catch (error) {
    console.error(`💥 [${requestId}] CREATE EVENT FAILED:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get User Events
router.get('/calendar/events', authenticate, async (req, res) => {
  try {
    const filters = req.query;
    const events = await calendarService.getUserEvents(req.user.userId, filters);
    res.json({ success: true, events });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== MEET ROUTES ====================

// Get Meet Auth URL
router.get('/meet/auth-url', authenticate, (req, res) => {
  try {
    const authUrl = meetService.getMeetAuthUrl();
    res.json({ success: true, authUrl });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Handle Meet Callback
router.post('/meet/callback', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n🎥 [${requestId}] MEET CALLBACK STARTED`);
    console.log(`👤 User: ${req.user.userId}`);
    
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization code is required' 
      });
    }

    const result = await meetService.handleMeetCallback(code);
    
    await tokenService.storeUserTokens(
      req.user.userId, 
      'meet', 
      result.tokens
    );

    console.log(`✅ [${requestId}] MEET AUTH SUCCESS for user ${req.user.userId}`);
    
    res.json({
      success: true,
      message: 'Google Meet connected successfully',
      service: 'meet'
    });
    
  } catch (error) {
    console.error(`💥 [MEET CALLBACK] Failed:`, error);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create Meeting
router.post('/meet/meetings', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n🎥 [${requestId}] CREATE MEETING STARTED`);
    
    const { meetingData } = req.body;
    const tokens = await tokenService.getUserTokens(req.user.userId, 'meet');
    
    const result = await meetService.createMeeting(req.user.userId, meetingData, tokens);
    
    console.log(`✅ [${requestId}] CREATE MEETING SUCCESS: ${result.meeting.title}`);
    
    res.json(result);
  } catch (error) {
    console.error(`💥 [${requestId}] CREATE MEETING FAILED:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Create Scheduled Meeting (with Calendar integration)
router.post('/meet/scheduled-meetings', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n🎥 [${requestId}] CREATE SCHEDULED MEETING STARTED`);
    
    const { meetingData } = req.body;
    const tokens = await tokenService.getUserTokens(req.user.userId, 'calendar');
    
    const result = await meetService.createScheduledMeeting(req.user.userId, meetingData, tokens);
    
    console.log(`✅ [${requestId}] CREATE SCHEDULED MEETING SUCCESS`);
    
    res.json(result);
  } catch (error) {
    console.error(`💥 [${requestId}] CREATE SCHEDULED MEETING FAILED:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get User Meetings
router.get('/meet/meetings', authenticate, async (req, res) => {
  try {
    const filters = req.query;
    const meetings = await meetService.getUserMeetings(req.user.userId, filters);
    res.json({ success: true, meetings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== COMBINED OPERATIONS ====================

// Sync all user data (Calendar + Meet + Gmail)
router.post('/sync-all', authenticate, async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  
  try {
    console.log(`\n🔄 [${requestId}] FULL SYNC STARTED for user ${req.user.userId}`);
    
    const results = {};
    const tokens = await tokenService.getValidTokensForUser(req.user.userId);

    // Sync calendars if available
    if (tokens.calendar) {
      try {
        results.calendars = await calendarService.syncUserCalendars(req.user.userId, tokens.calendar);
        console.log(`✅ [${requestId}] Calendars synced: ${results.calendars.total}`);
      } catch (error) {
        console.error(`❌ [${requestId}] Calendar sync failed:`, error.message);
        results.calendars = { error: error.message };
      }
    }

    // Sync events for primary calendar
    if (tokens.calendar) {
      try {
        results.events = await calendarService.syncCalendarEvents(req.user.userId, 'primary', tokens.calendar);
        console.log(`✅ [${requestId}] Events synced: ${results.events.total}`);
      } catch (error) {
        console.error(`❌ [${requestId}] Events sync failed:`, error.message);
        results.events = { error: error.message };
      }
    }

    // Get meetings
    if (tokens.meet) {
      try {
        results.meetings = await meetService.getUserMeetings(req.user.userId, { limit: 50 });
        console.log(`✅ [${requestId}] Meetings retrieved: ${results.meetings.length}`);
      } catch (error) {
        console.error(`❌ [${requestId}] Meetings retrieval failed:`, error.message);
        results.meetings = { error: error.message };
      }
    }

    console.log(`✅ [${requestId}] FULL SYNC COMPLETED`);
    
    res.json({
      success: true,
      message: 'Full sync completed',
      results,
      services: Object.keys(tokens)
    });
    
  } catch (error) {
    console.error(`💥 [${requestId}] FULL SYNC FAILED:`, error);
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;