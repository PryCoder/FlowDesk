import supabase from '../utils/supabaseClient.js';

export class MeetingModel {
  static async create(meetingData) {
    // Ensure JSON columns are initialized to valid types
    const payload = {
      ...meetingData,
      participants: meetingData.participants || [],
      agenda: meetingData.agenda || {},
      summary: meetingData.summary || {},
      action_items: meetingData.action_items || [],
      decisions: meetingData.decisions || {},
      sentiment_analysis: meetingData.sentiment_analysis || {},
      participants_analysis: meetingData.participants_analysis || {},
      follow_up_recommendations: meetingData.follow_up_recommendations || [],
      status: meetingData.status || 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('meetings')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(`MeetingModel - create: ${error.message}`);
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        employees!meetings_created_by_fkey (
          first_name,
          last_name,
          email,
          department
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(`MeetingModel - getById: ${error.message}`);
    return data;
  }

  static async update(id, updateData) {
    const payload = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('meetings')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`MeetingModel - update: ${error.message}`);
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`MeetingModel - delete: ${error.message}`);
    return { success: true };
  }

  static async getUserMeetings(userId, filters = {}) {
    const { status, dateFrom, dateTo, limit = 50, page = 1 } = filters;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('meetings')
      .select(`
        *,
        employees!meetings_created_by_fkey (
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
      .or(`created_by.eq.${userId},participants.cs.{${userId}}`)
      .range(from, to)
      .order('start_time', { ascending: false });

    if (status) query = query.eq('status', status);
    if (dateFrom) query = query.gte('start_time', dateFrom);
    if (dateTo) query = query.lte('start_time', dateTo);

    const { data, error, count } = await query;

    if (error) throw new Error(`MeetingModel - getUserMeetings: ${error.message}`);

    return {
      meetings: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  static async getCompanyMeetings(companyId, filters = {}) {
    const { status, dateFrom, dateTo, limit = 100, page = 1 } = filters;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('meetings')
      .select(`
        *,
        employees!meetings_created_by_fkey (
          first_name,
          last_name,
          email,
          department
        )
      `, { count: 'exact' })
      .eq('company_id', companyId)
      .range(from, to)
      .order('start_time', { ascending: false });

    if (status) query = query.eq('status', status);
    if (dateFrom) query = query.gte('start_time', dateFrom);
    if (dateTo) query = query.lte('start_time', dateTo);

    const { data, error, count } = await query;

    if (error) throw new Error(`MeetingModel - getCompanyMeetings: ${error.message}`);

    return {
      meetings: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  static async addParticipants(meetingId, participants) {
    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('participants')
      .eq('id', meetingId)
      .single();

    if (fetchError) throw new Error(`MeetingModel - addParticipants: ${fetchError.message}`);

    const updatedParticipants = [...new Set([...(meeting.participants || []), ...participants])];

    const { data, error } = await supabase
      .from('meetings')
      .update({ participants: updatedParticipants, updated_at: new Date().toISOString() })
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw new Error(`MeetingModel - addParticipants: ${error.message}`);
    return data;
  }

  static async removeParticipants(meetingId, participants) {
    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('participants')
      .eq('id', meetingId)
      .single();

    if (fetchError) throw new Error(`MeetingModel - removeParticipants: ${fetchError.message}`);

    const updatedParticipants = (meeting.participants || []).filter(p => !participants.includes(p));

    const { data, error } = await supabase
      .from('meetings')
      .update({ participants: updatedParticipants, updated_at: new Date().toISOString() })
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw new Error(`MeetingModel - removeParticipants: ${error.message}`);
    return data;
  }

  static async updateStatus(meetingId, status) {
    const { data, error } = await supabase
      .from('meetings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw new Error(`MeetingModel - updateStatus: ${error.message}`);
    return data;
  }

  static async updateAnalysis(meetingId, analysisData) {
    const payload = {
      ...analysisData,
      processed_at: new Date().toISOString(),
      status: 'processed'
    };

    const { data, error } = await supabase
      .from('meetings')
      .update(payload)
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw new Error(`MeetingModel - updateAnalysis: ${error.message}`);
    return data;
  }
}

export default MeetingModel;
