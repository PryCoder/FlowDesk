import supabase from '../utils/supabaseClient.js';
import googleClient from '../utils/googleClient.js';

export class MeetService {
  constructor() {
    this.meetScopes = [
      'https://www.googleapis.com/auth/meetings.space.created'
    ];
  }

  // -------------------- Authentication --------------------
  getMeetAuthUrl() {
    return googleClient.getAuthUrl(this.meetScopes);
  }

  async handleMeetCallback(code) {
    try {
      const tokens = await googleClient.getTokens(code);
      
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
      throw new Error(`MeetService.handleMeetCallback: ${error.message}`);
    }
  }

  // -------------------- Meeting Management --------------------
  async createMeeting(userId, meetingData, tokens) {
    try {
      const meet = googleClient.getMeetClient(tokens);
      
      const meetingConfig = {
        conferenceId: meetingData.conferenceId || `meet-${Date.now()}`,
        config: {
          accessType: meetingData.accessType || 'OPEN',
          entryPointAccess: meetingData.entryPointAccess || 'ALL'
        }
      };

      const response = await meet.conferences.create({
        requestBody: meetingConfig
      });

      const meeting = response.data;
      
      // Save to database
      const { data: savedMeeting } = await supabase
        .from('meet_conferences')
        .insert({
          user_id: userId,
          google_meet_id: meeting.conferenceId,
          meeting_uri: meeting.meetingUri,
          join_url: meeting.joinUrl,
          conference_data: meeting,
          title: meetingData.title,
          description: meetingData.description,
          start_time: meetingData.startTime,
          end_time: meetingData.endTime,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return {
        success: true,
        meeting: savedMeeting,
        googleMeet: meeting
      };
    } catch (error) {
      throw new Error(`MeetService.createMeeting: ${error.message}`);
    }
  }

  async createScheduledMeeting(userId, meetingData, tokens) {
    try {
      // First create calendar event with Meet conference
      const calendarService = await import('./calendarService.js');
      
      const eventWithMeet = {
        title: meetingData.title,
        description: meetingData.description,
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        timeZone: meetingData.timeZone || 'UTC',
        location: meetingData.location,
        attendees: meetingData.attendees,
        createMeet: true
      };

      const result = await calendarService.default.createEvent(
        userId, 
        'primary', 
        eventWithMeet, 
        tokens
      );

      // Extract Meet details from the created event
      const meetDetails = {
        meetingUri: result.googleEvent.hangoutLink,
        conferenceId: result.googleEvent.conferenceData?.conferenceId,
        joinUrl: result.googleEvent.hangoutLink
      };

      return {
        success: true,
        event: result.event,
        meeting: meetDetails
      };
    } catch (error) {
      throw new Error(`MeetService.createScheduledMeeting: ${error.message}`);
    }
  }

  async getUserMeetings(userId, filters = {}) {
    try {
      let query = supabase
        .from('meet_conferences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters.upcoming) {
        query = query.gte('start_time', new Date().toISOString());
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data;
    } catch (error) {
      throw new Error(`MeetService.getUserMeetings: ${error.message}`);
    }
  }

  async getMeetingById(meetingId) {
    try {
      const { data, error } = await supabase
        .from('meet_conferences')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`MeetService.getMeetingById: ${error.message}`);
    }
  }

  async updateMeeting(meetingId, updates, tokens) {
    try {
      const meet = googleClient.getMeetClient(tokens);
      
      // Update meeting configuration if needed
      if (updates.conferenceConfig) {
        await meet.conferences.patch({
          conferenceId: updates.googleMeetId,
          requestBody: {
            config: updates.conferenceConfig
          }
        });
      }

      // Update in database
      const { data: updatedMeeting } = await supabase
        .from('meet_conferences')
        .update({
          title: updates.title,
          description: updates.description,
          start_time: updates.startTime,
          end_time: updates.endTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', meetingId)
        .select()
        .single();

      return {
        success: true,
        meeting: updatedMeeting
      };
    } catch (error) {
      throw new Error(`MeetService.updateMeeting: ${error.message}`);
    }
  }

  async endMeeting(meetingId, tokens) {
    try {
      const meet = googleClient.getMeetClient(tokens);
      
      // Get meeting details first
      const { data: meeting } = await supabase
        .from('meet_conferences')
        .select('google_meet_id')
        .eq('id', meetingId)
        .single();

      if (meeting?.google_meet_id) {
        await meet.conferences.end({
          conferenceId: meeting.google_meet_id
        });
      }

      // Mark as ended in database
      const { data: endedMeeting } = await supabase
        .from('meet_conferences')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', meetingId)
        .select()
        .single();

      return {
        success: true,
        meeting: endedMeeting
      };
    } catch (error) {
      throw new Error(`MeetService.endMeeting: ${error.message}`);
    }
  }

  // -------------------- Meeting Analytics --------------------
  async getMeetingAnalytics(userId, period = '30d') {
    try {
      const date = new Date();
      let startDate;
      switch (period) {
        case '7d': startDate = new Date(date.setDate(date.getDate() - 7)); break;
        case '30d': startDate = new Date(date.setDate(date.getDate() - 30)); break;
        case '90d': startDate = new Date(date.setDate(date.getDate() - 90)); break;
        default: startDate = new Date(date.setDate(date.getDate() - 30));
      }

      const { data: meetings, error } = await supabase
        .from('meet_conferences')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const analytics = {
        totalMeetings: meetings.length,
        upcomingMeetings: meetings.filter(m => new Date(m.start_time) > new Date()).length,
        completedMeetings: meetings.filter(m => m.status === 'ended').length,
        averageMeetingDuration: this.calculateAverageMeetingDuration(meetings),
        meetingsByDay: this.groupMeetingsByDay(meetings),
        mostActiveHours: this.getMostActiveHours(meetings)
      };

      return analytics;
    } catch (error) {
      throw new Error(`MeetService.getMeetingAnalytics: ${error.message}`);
    }
  }

  calculateAverageMeetingDuration(meetings) {
    const completedMeetings = meetings.filter(m => m.start_time && m.end_time);
    
    if (completedMeetings.length === 0) return 0;

    const totalDuration = completedMeetings.reduce((acc, meeting) => {
      const start = new Date(meeting.start_time);
      const end = new Date(meeting.end_time);
      return acc + (end - start);
    }, 0);

    return totalDuration / completedMeetings.length / (1000 * 60); // in minutes
  }

  groupMeetingsByDay(meetings) {
    return meetings.reduce((acc, meeting) => {
      const date = meeting.created_at.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
  }

  getMostActiveHours(meetings) {
    const hours = meetings.reduce((acc, meeting) => {
      const hour = new Date(meeting.start_time).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(hours)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((acc, [hour, count]) => {
        acc[`${hour}:00`] = count;
        return acc;
      }, {});
  }

  // -------------------- Quick Meeting --------------------
  async createQuickMeeting(userId, title = 'Quick Meeting') {
    try {
      const quickMeetingData = {
        title: title,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
      };

      // This would typically use stored tokens for the user
      // For now, we'll create a database entry without Google Meet integration
      const { data: quickMeeting } = await supabase
        .from('meet_conferences')
        .insert({
          user_id: userId,
          title: quickMeetingData.title,
          start_time: quickMeetingData.startTime,
          end_time: quickMeetingData.endTime,
          join_url: `https://meet.google.com/new?authuser=0`, // Generic link
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return {
        success: true,
        meeting: quickMeeting,
        message: 'Quick meeting created. Connect Google Meet for full integration.'
      };
    } catch (error) {
      throw new Error(`MeetService.createQuickMeeting: ${error.message}`);
    }
  }
}

export default new MeetService();