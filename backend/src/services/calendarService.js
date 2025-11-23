import supabase from '../utils/supabaseClient.js';
import googleClient from '../utils/googleClient.js';

export class CalendarService {
  constructor() {
    this.calendarScopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];
  }

  // -------------------- Authentication --------------------
  getCalendarAuthUrl() {
    return googleClient.getAuthUrl(this.calendarScopes);
  }

  async handleCalendarCallback(code) {
    try {
      const tokens = await googleClient.getTokens(code);
      
      // Store tokens securely
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        scope: tokens.scope,
        token_type: tokens.token_type
      };

      return {
        success: true,
        tokens: tokenData
      };
    } catch (error) {
      throw new Error(`CalendarService.handleCalendarCallback: ${error.message}`);
    }
  }

  // -------------------- Calendar Management --------------------
  async syncUserCalendars(userId, tokens) {
    try {
      const calendar = googleClient.getCalendarClient(tokens);
      
      const response = await calendar.calendarList.list();
      const calendars = response.data.items || [];

      const syncedCalendars = [];
      
      for (const cal of calendars) {
        const { data: savedCalendar, error } = await supabase
          .from('user_calendars')
          .upsert({
            user_id: userId,
            google_calendar_id: cal.id,
            calendar_name: cal.summary,
            description: cal.description,
            timezone: cal.timeZone,
            background_color: cal.backgroundColor,
            foreground_color: cal.foregroundColor,
            access_role: cal.accessRole,
            primary: cal.primary || false,
            synced_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error) syncedCalendars.push(savedCalendar);
      }

      return {
        success: true,
        calendars: syncedCalendars,
        total: syncedCalendars.length
      };
    } catch (error) {
      throw new Error(`CalendarService.syncUserCalendars: ${error.message}`);
    }
  }

  // -------------------- Event Management --------------------
  async syncCalendarEvents(userId, calendarId, tokens, timeMin = null, timeMax = null) {
    try {
      const calendar = googleClient.getCalendarClient(tokens);
      
      const params = {
        calendarId: calendarId,
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime'
      };

      if (timeMin) params.timeMin = timeMin;
      if (timeMax) params.timeMax = timeMax;

      const response = await calendar.events.list(params);
      const events = response.data.items || [];

      const syncedEvents = [];
      
      for (const event of events) {
        const eventData = this.extractEventData(event, calendarId);
        
        const { data: savedEvent, error } = await supabase
          .from('calendar_events')
          .upsert({
            user_id: userId,
            google_event_id: event.id,
            calendar_id: calendarId,
            title: eventData.title,
            description: eventData.description,
            start_time: eventData.start,
            end_time: eventData.end,
            location: eventData.location,
            attendees: eventData.attendees,
            organizer: eventData.organizer,
            meeting_link: eventData.meetingLink,
            status: eventData.status,
            recurring_event_id: event.recurringEventId,
            event_data: eventData.raw,
            synced_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error) syncedEvents.push(savedEvent);
      }

      return {
        success: true,
        events: syncedEvents,
        total: syncedEvents.length
      };
    } catch (error) {
      throw new Error(`CalendarService.syncCalendarEvents: ${error.message}`);
    }
  }

  extractEventData(event, calendarId) {
    return {
      id: event.id,
      title: event.summary || 'No Title',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      attendees: event.attendees || [],
      organizer: event.organizer || {},
      meetingLink: event.hangoutLink || '',
      status: event.status,
      calendarId: calendarId,
      raw: event
    };
  }

  async createEvent(userId, calendarId, eventData, tokens) {
    try {
      const calendar = googleClient.getCalendarClient(tokens);
      
      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'UTC'
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'UTC'
        },
        location: eventData.location,
        attendees: eventData.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 }
          ]
        },
        conferenceData: eventData.createMeet ? {
          createRequest: {
            requestId: `meet-${Date.now()}`
          }
        } : undefined
      };

      const response = await calendar.events.insert({
        calendarId: calendarId,
        resource: event,
        conferenceDataVersion: 1
      });

      const createdEvent = response.data;
      
      // Save to database
      const { data: savedEvent } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          google_event_id: createdEvent.id,
          calendar_id: calendarId,
          title: createdEvent.summary,
          description: createdEvent.description,
          start_time: createdEvent.start.dateTime,
          end_time: createdEvent.end.dateTime,
          location: createdEvent.location,
          attendees: createdEvent.attendees,
          organizer: createdEvent.organizer,
          meeting_link: createdEvent.hangoutLink,
          status: createdEvent.status,
          event_data: createdEvent,
          synced_at: new Date().toISOString()
        })
        .select()
        .single();

      return {
        success: true,
        event: savedEvent,
        googleEvent: createdEvent
      };
    } catch (error) {
      throw new Error(`CalendarService.createEvent: ${error.message}`);
    }
  }

  async updateEvent(eventId, updates, tokens) {
    try {
      const calendar = googleClient.getCalendarClient(tokens);
      
      // First get the existing event
      const existingEvent = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId
      });

      const updatedEvent = {
        ...existingEvent.data,
        ...updates
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: updatedEvent
      });

      // Update in database
      const { data: dbEvent } = await supabase
        .from('calendar_events')
        .update({
          title: updatedEvent.summary,
          description: updatedEvent.description,
          start_time: updatedEvent.start?.dateTime,
          end_time: updatedEvent.end?.dateTime,
          location: updatedEvent.location,
          attendees: updatedEvent.attendees,
          event_data: updatedEvent,
          updated_at: new Date().toISOString()
        })
        .eq('google_event_id', eventId)
        .select()
        .single();

      return {
        success: true,
        event: dbEvent
      };
    } catch (error) {
      throw new Error(`CalendarService.updateEvent: ${error.message}`);
    }
  }

  async deleteEvent(eventId, tokens) {
    try {
      const calendar = googleClient.getCalendarClient(tokens);
      
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });

      // Delete from database
      await supabase
        .from('calendar_events')
        .delete()
        .eq('google_event_id', eventId);

      return { success: true };
    } catch (error) {
      throw new Error(`CalendarService.deleteEvent: ${error.message}`);
    }
  }

  // -------------------- Event Queries --------------------
  async getUserEvents(userId, filters = {}) {
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

      if (filters.calendarId) query = query.eq('calendar_id', filters.calendarId);
      if (filters.startDate) query = query.gte('start_time', filters.startDate);
      if (filters.endDate) query = query.lte('end_time', filters.endDate);
      if (filters.hasMeeting) query = query.not('meeting_link', 'is', null);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error(`CalendarService.getUserEvents: ${error.message}`);
    }
  }

  async getUpcomingEvents(userId, days = 7) {
    try {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`CalendarService.getUpcomingEvents: ${error.message}`);
    }
  }

  async getEventsWithMeetings(userId) {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .not('meeting_link', 'is', null)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`CalendarService.getEventsWithMeetings: ${error.message}`);
    }
  }

  // -------------------- Analytics --------------------
  async getCalendarAnalytics(userId, period = '30d') {
    try {
      const date = new Date();
      let startDate;
      switch (period) {
        case '7d': startDate = new Date(date.setDate(date.getDate() - 7)); break;
        case '30d': startDate = new Date(date.setDate(date.getDate() - 30)); break;
        case '90d': startDate = new Date(date.setDate(date.getDate() - 90)); break;
        default: startDate = new Date(date.setDate(date.getDate() - 30));
      }

      const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString());

      if (error) throw error;

      const analytics = {
        totalEvents: events.length,
        eventsWithMeetings: events.filter(e => e.meeting_link).length,
        busyDays: this.getBusyDays(events),
        eventTypes: this.groupBy(events, 'title'),
        averageEventDuration: this.calculateAverageDuration(events),
        upcomingEvents: events.filter(e => new Date(e.start_time) > new Date()).length
      };

      return analytics;
    } catch (error) {
      throw new Error(`CalendarService.getCalendarAnalytics: ${error.message}`);
    }
  }

  getBusyDays(events) {
    return events.reduce((acc, event) => {
      const date = event.start_time.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  }

  calculateAverageDuration(events) {
    if (events.length === 0) return 0;
    
    const totalDuration = events.reduce((acc, event) => {
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);
      return acc + (end - start);
    }, 0);

    return totalDuration / events.length / (1000 * 60); // in minutes
  }

  groupBy(array, key) {
    return array.reduce((acc, item) => {
      const group = item[key] || 'Unknown';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});
  }
}

export default new CalendarService();