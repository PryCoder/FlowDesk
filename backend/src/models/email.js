import supabase from '../utils/supabaseClient.js';

export class EmailModel {
  static async create(emailData) {
    const { data, error } = await supabase
      .from('emails')
      .insert(emailData)
      .select()
      .single();

    if (error) throw new Error(`EmailModel - create: ${error.message}`);
    return data;
  }

  static async createMultiple(emailsData) {
    const { data, error } = await supabase
      .from('emails')
      .insert(emailsData)
      .select();

    if (error) throw new Error(`EmailModel - createMultiple: ${error.message}`);
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`EmailModel - getById: ${error.message}`);
    return data;
  }

  static async getByGmailId(gmailId, userId) {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('gmail_id', gmailId)
      .eq('user_id', userId)
      .single();

    if (error) throw new Error(`EmailModel - getByGmailId: ${error.message}`);
    return data;
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('emails')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`EmailModel - update: ${error.message}`);
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`EmailModel - delete: ${error.message}`);
    return { success: true };
  }

  static async getUserEmails(userId, filters = {}) {
    const { 
      priority, 
      sentiment, 
      has_meeting, 
      status,
      search,
      limit = 50,
      page = 1,
      dateFrom,
      dateTo
    } = filters;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('emails')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(from, to)
      .order('processed_at', { ascending: false });

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (sentiment) {
      query = query.eq('sentiment', sentiment);
    }

    if (has_meeting !== undefined) {
      query = query.eq('has_meeting', has_meeting);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,body.ilike.%${search}%,from.ilike.%${search}%`);
    }

    if (dateFrom) {
      query = query.gte('processed_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('processed_at', dateTo);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`EmailModel - getUserEmails: ${error.message}`);

    return {
      emails: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  static async getEmailsWithMeetings(userId, limit = 20) {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .eq('has_meeting', true)
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`EmailModel - getEmailsWithMeetings: ${error.message}`);
    return data;
  }

  static async getEmailsByPriority(userId, priority, limit = 50) {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .eq('priority', priority)
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`EmailModel - getEmailsByPriority: ${error.message}`);
    return data;
  }

  static async getEmailsBySentiment(userId, sentiment, limit = 50) {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .eq('sentiment', sentiment)
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`EmailModel - getEmailsBySentiment: ${error.message}`);
    return data;
  }

  static async markAsProcessed(id, status = 'processed') {
    const { data, error } = await supabase
      .from('emails')
      .update({ 
        status,
        processed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`EmailModel - markAsProcessed: ${error.message}`);
    return data;
  }

  static async bulkMarkAsProcessed(ids, status = 'processed') {
    const { data, error } = await supabase
      .from('emails')
      .update({ 
        status,
        processed_at: new Date().toISOString()
      })
      .in('id', ids)
      .select();

    if (error) throw new Error(`EmailModel - bulkMarkAsProcessed: ${error.message}`);
    return data;
  }

  // Analytics Methods
  static async getEmailStats(userId, period = '30d') {
    const date = new Date();
    let startDate;

    switch (period) {
      case '7d':
        startDate = new Date(date.setDate(date.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(date.setDate(date.getDate() - 30));
        break;
      case '90d':
        startDate = new Date(date.setDate(date.getDate() - 90));
        break;
      default:
        startDate = new Date(date.setDate(date.getDate() - 30));
    }

    const { data, error } = await supabase
      .from('emails')
      .select('priority, sentiment, has_meeting, status, processed_at')
      .eq('user_id', userId)
      .gte('processed_at', startDate.toISOString());

    if (error) throw new Error(`EmailModel - getEmailStats: ${error.message}`);

    const stats = {
      total: data.length,
      byPriority: {},
      bySentiment: {},
      withMeetings: 0,
      byStatus: {},
      dailyCount: {}
    };

    data.forEach(email => {
      // Count by priority
      stats.byPriority[email.priority] = (stats.byPriority[email.priority] || 0) + 1;

      // Count by sentiment
      stats.bySentiment[email.sentiment] = (stats.bySentiment[email.sentiment] || 0) + 1;

      // Count emails with meetings
      if (email.has_meeting) {
        stats.withMeetings++;
      }

      // Count by status
      stats.byStatus[email.status] = (stats.byStatus[email.status] || 0) + 1;

      // Count by day
      const day = email.processed_at.split('T')[0];
      stats.dailyCount[day] = (stats.dailyCount[day] || 0) + 1;
    });

    return stats;
  }

  static async getCompanyEmailStats(companyId, period = '30d') {
    const date = new Date();
    let startDate;

    switch (period) {
      case '7d':
        startDate = new Date(date.setDate(date.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(date.setDate(date.getDate() - 30));
        break;
      case '90d':
        startDate = new Date(date.setDate(date.getDate() - 90));
        break;
      default:
        startDate = new Date(date.setDate(date.getDate() - 30));
    }

    // Get all employees in company
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id')
      .eq('company_id', companyId)
      .eq('active', true);

    if (employeesError) throw new Error(`EmailModel - getCompanyEmailStats: ${employeesError.message}`);

    const employeeIds = employees.map(emp => emp.id);

    const { data, error } = await supabase
      .from('emails')
      .select('priority, sentiment, has_meeting, user_id, processed_at')
      .in('user_id', employeeIds)
      .gte('processed_at', startDate.toISOString());

    if (error) throw new Error(`EmailModel - getCompanyEmailStats: ${error.message}`);

    const stats = {
      total: data.length,
      byPriority: {},
      bySentiment: {},
      withMeetings: 0,
      byEmployee: {},
      averagePerEmployee: 0
    };

    data.forEach(email => {
      // Count by priority
      stats.byPriority[email.priority] = (stats.byPriority[email.priority] || 0) + 1;

      // Count by sentiment
      stats.bySentiment[email.sentiment] = (stats.bySentiment[email.sentiment] || 0) + 1;

      // Count emails with meetings
      if (email.has_meeting) {
        stats.withMeetings++;
      }

      // Count by employee
      stats.byEmployee[email.user_id] = (stats.byEmployee[email.user_id] || 0) + 1;
    });

    if (employeeIds.length > 0) {
      stats.averagePerEmployee = stats.total / employeeIds.length;
    }

    return stats;
  }

  static async getRecentEmails(userId, limit = 10) {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`EmailModel - getRecentEmails: ${error.message}`);
    return data;
  }

  static async getUnprocessedEmails(userId, limit = 20) {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('processed_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`EmailModel - getUnprocessedEmails: ${error.message}`);
    return data;
  }

  // Search Methods
  static async searchEmails(userId, searchTerm, options = {}) {
    const { limit = 20, priority, sentiment } = options;

    let query = supabase
      .from('emails')
      .select('*')
      .eq('user_id', userId)
      .or(`subject.ilike.%${searchTerm}%,body.ilike.%${searchTerm}%,from.ilike.%${searchTerm}%`)
      .limit(limit);

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (sentiment) {
      query = query.eq('sentiment', sentiment);
    }

    const { data, error } = await query;

    if (error) throw new Error(`EmailModel - searchEmails: ${error.message}`);
    return data;
  }

  // Gmail Sync Methods
  static async isEmailSynced(gmailId, userId) {
    const { data, error } = await supabase
      .from('emails')
      .select('id')
      .eq('gmail_id', gmailId)
      .eq('user_id', userId)
      .single();

    return !!(data && !error);
  }

  static async getSyncStatus(userId) {
    const { data, error } = await supabase
      .from('emails')
      .select('processed_at')
      .eq('user_id', userId)
      .order('processed_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`EmailModel - getSyncStatus: ${error.message}`);
    }

    return {
      lastSynced: data?.processed_at || null,
      hasEmails: !!data
    };
  }
}

export default EmailModel;