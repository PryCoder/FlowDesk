// services/meetingService.js
import supabase from '../utils/supabaseClient.js';
import meetingAgent from '../agents/meetingAgent.js';

let integrationService;
setTimeout(async () => {
  const module = await import('./integrationService.js');
  integrationService = module.default;
}, 0);

export class MeetingService {
  constructor() {
    this.maxTranscriptLength = 10000;
  }

  /** Create a new meeting record */
  async createMeeting(meetingData, userId) {
    try {
      const payload = {
        company_id: meetingData.companyId || null,
        title: (meetingData.title || 'Untitled Meeting').trim(),
        description: meetingData.description || null,
        scheduled_start: meetingData.scheduled_start || null,
        scheduled_end: meetingData.scheduled_end || null,
        created_by: userId,
        participants: meetingData.participants || [],
        agenda: meetingData.agenda || [],
        summary: meetingData.summary || null,
        action_items: meetingData.action_items || meetingData.actionItems || [],
        decisions: meetingData.decisions || null,
        sentiment_analysis: meetingData.sentiment_analysis || meetingData.sentiment || null,
        participants_analysis: meetingData.participants_analysis || meetingData.participantsAnalysis || null,
        follow_up_recommendations: meetingData.follow_up_recommendations || meetingData.followUps || null,
        status: meetingData.status || 'scheduled',
        video_link: meetingData.video_link || null,
        google_calendar_event_id: meetingData.google_calendar_event_id || null,
      };

      const { data, error } = await supabase
        .from('meetings')
        .insert(payload)
        .select(`
          *,
          creator:employees!meetings_created_by_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(`MeetingService.createMeeting: ${err.message}`);
    }
  }

  /** Update meeting */
  async updateMeeting(meetingId, updates) {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', meetingId)
        .select(`
          *,
          creator:employees!meetings_created_by_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(`MeetingService.updateMeeting: ${err.message}`);
    }
  }

  /** Process a meeting transcript using AI analysis */
  async processMeetingTranscript(meetingId, transcript, options = {}) {
    try {
      if (!transcript) throw new Error('Transcript is required');
      if (transcript.length > this.maxTranscriptLength) {
        transcript = transcript.substring(0, this.maxTranscriptLength);
      }

      const analysis = await meetingAgent.process({
        transcript,
        audioDuration: options.audioDuration,
        participants: options.participants || [],
        meetingTitle: options.meetingTitle || '',
      });

      const updatePayload = {
        transcript,
        summary: analysis.summary || null,
        action_items: analysis.actionItems || [],
        decisions: analysis.decisions || null,
        sentiment_analysis: analysis.sentiment || null,
        participants_analysis: analysis.participants || null,
        follow_up_recommendations: analysis.followUps || null,
        processed_at: new Date().toISOString(),
        status: 'processed',
      };

      const { data, error } = await supabase
        .from('meetings')
        .update(updatePayload)
        .eq('id', meetingId)
        .select()
        .single();

      if (error) throw error;

      if (
        options.createTasksFromActions &&
        analysis.actionItems &&
        analysis.actionItems.length > 0
      ) {
        await this.createTasksFromActionItems(
          analysis.actionItems,
          meetingId,
          options.companyId
        );
      }

      return { meeting: data, analysis };
    } catch (err) {
      console.error('processMeetingTranscript error:', err);
      try {
        await supabase
          .from('meetings')
          .update({ status: 'processing_failed', error_message: err.message })
          .eq('id', meetingId);
      } catch (uErr) {
        console.error('Failed to mark meeting as failed:', uErr.message);
      }
      throw new Error(`MeetingService.processMeetingTranscript: ${err.message}`);
    }
  }

  /** Create tasks from action items */
  async createTasksFromActionItems(actionItems, meetingId, companyId) {
    try {
      const tasks = actionItems.map((item) => ({
        title: item.task,
        assigned_to: item.owner || null,
        due_date: item.due || null,
        meeting_id: meetingId,
        company_id: companyId,
        status: 'pending',
      }));

      const { error } = await supabase.from('tasks').insert(tasks);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('createTasksFromActionItems error:', err.message);
      return false;
    }
  }

  /** Get meetings for a user */
  async getUserMeetings(userId, options = {}) {
    try {
      const { dateFrom, dateTo, status, limit = 50, type = 'all' } = options;
  
      // Fix: properly format the JSON contains filter
      const participantFilter = `participants.cs.[${JSON.stringify(userId)}]`;
  
      let query = supabase
        .from('meetings')
        .select(`
          *,
          creator:employees!meetings_created_by_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .or(`created_by.eq.${userId},${participantFilter}`)
        .order('scheduled_start', { ascending: type !== 'past' })
        .limit(limit);
  
      const now = new Date().toISOString();
      if (type === 'upcoming' || !type || type === 'all') {
        query = query.gte('scheduled_start', dateFrom || now);
      } else if (type === 'past') {
        query = query.lte('scheduled_start', dateTo || now);
      }
  
      if (dateFrom) query = query.gte('scheduled_start', dateFrom);
      if (dateTo) query = query.lte('scheduled_start', dateTo);
      if (status) query = query.eq('status', status);
  
      const { data, error } = await query;
      if (error) throw error;
  
      return data.filter(
        (m) =>
          m.created_by === userId ||
          (m.participants && m.participants.includes(userId))
      );
    } catch (err) {
      throw new Error(`MeetingService.getUserMeetings: ${err.message}`);
    }
  }
  
  /** Get meeting by ID */
  async getMeetingById(meetingId, userId = null) {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          creator:employees!meetings_created_by_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('id', meetingId)
        .single();

      if (error) throw error;

      if (
        userId &&
        data.created_by !== userId &&
        (!data.participants || !data.participants.includes(userId))
      ) {
        throw new Error('Access denied to this meeting');
      }

      return data;
    } catch (err) {
      throw new Error(`MeetingService.getMeetingById: ${err.message}`);
    }
  }

  /** Add participants */
  async addMeetingParticipants(meetingId, participantIds) {
    try {
      const { data: currentMeeting, error: fetchError } = await supabase
        .from('meetings')
        .select('participants')
        .eq('id', meetingId)
        .single();

      if (fetchError) throw fetchError;

      const current = currentMeeting.participants || [];
      const newParticipants = [...new Set([...current, ...participantIds])];

      const { data, error } = await supabase
        .from('meetings')
        .update({
          participants: newParticipants,
          updated_at: new Date().toISOString(),
        })
        .eq('id', meetingId)
        .select(`
          *,
          creator:employees!meetings_created_by_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      throw new Error(`MeetingService.addMeetingParticipants: ${err.message}`);
    }
  }

  /** Get next meeting */
  async getNextMeeting(userId) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          creator:employees!meetings_created_by_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .or(`created_by.eq.${userId},participants.cs.{${userId}}`)
        .gte('scheduled_start', now)
        .eq('status', 'scheduled')
        .order('scheduled_start', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (err) {
      throw new Error(`MeetingService.getNextMeeting: ${err.message}`);
    }
  }

  /** Get pending tasks */
  async getPendingTasks(userId) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', userId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      throw new Error(`MeetingService.getPendingTasks: ${err.message}`);
    }
  }

  /** Find open slots */
  async findOpenSlots(meetings, date = new Date()) {
    const slots = [];
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(17, 0, 0, 0);

    const busySlots = meetings.map((m) => ({
      start: new Date(m.scheduled_start),
      end: new Date(m.scheduled_end),
    }));

    let currentTime = new Date(dayStart);
    while (currentTime < dayEnd) {
      const slotEnd = new Date(currentTime);
      slotEnd.setHours(currentTime.getHours() + 1);

      const isConflict = busySlots.some(
        (b) =>
          (currentTime >= b.start && currentTime < b.end) ||
          (slotEnd > b.start && slotEnd <= b.end)
      );

      if (!isConflict) slots.push(new Date(currentTime));
      currentTime.setHours(currentTime.getHours() + 1);
    }

    return slots;
  }

  /** Delete meeting */
  async deleteMeeting(meetingId) {
    const { error } = await supabase.from('meetings').delete().eq('id', meetingId);
    if (error) throw error;
    return true;
  }
}

const meetingService = new MeetingService();
export default meetingService;
