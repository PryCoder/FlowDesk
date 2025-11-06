import analyticsAgent from '../agents/analyticsAgent.js';
import supabase from '../utils/supabaseClient.js';

export class AnalyticsService {
  constructor() {
    this.leaderboardPeriods = ['daily', 'weekly', 'monthly'];
  }

  // Data Collection
  async collectEmployeeData(companyId, period = 'weekly') {
    try {
      console.log(`📊 Collecting analytics data for company ${companyId}, period: ${period}`);

      // Get date range based on period
      const dateRange = this.getDateRange(period);
      
      // Collect comprehensive data
      const [employees, tasks, meetings, emails, analytics] = await Promise.all([
        this.getEmployeesData(companyId),
        this.getTasksData(companyId, dateRange),
        this.getMeetingsData(companyId, dateRange),
        this.getEmailsData(companyId, dateRange),
        this.getExistingAnalytics(companyId, dateRange)
      ]);

      const rawData = {
        employees,
        tasks,
        meetings,
        emails,
        analytics,
        period,
        dateRange,
        companyId,
        collectedAt: new Date().toISOString()
      };

      return rawData;
    } catch (error) {
      throw new Error(`Analytics Service - collectEmployeeData: ${error.message}`);
    }
  }

  // Analytics Processing
  async generateCompanyAnalytics(companyId, period = 'weekly') {
    try {
      const rawData = await this.collectEmployeeData(companyId, period);
      const analysis = await analyticsAgent.process(rawData);

      // Store analytics results
      await this.storeAnalyticsResults(companyId, analysis, period);

      return {
        rawData,
        analysis,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Analytics Service - generateCompanyAnalytics: ${error.message}`);
    }
  }

  async generateEmployeeAnalytics(employeeId, period = 'weekly') {
    try {
      const employeeData = await this.getEmployeeSpecificData(employeeId, period);
      const analysis = await analyticsAgent.process(employeeData);

      // Store individual analytics
      await this.storeEmployeeAnalytics(employeeId, analysis, period);

      return {
        employeeData,
        analysis,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Analytics Service - generateEmployeeAnalytics: ${error.message}`);
    }
  }

  // Leaderboard Management
  async calculateLeaderboard(companyId, period = 'weekly') {
    try {
      if (!this.leaderboardPeriods.includes(period)) {
        throw new Error(`Invalid period. Must be one of: ${this.leaderboardPeriods.join(', ')}`);
      }

      const analytics = await this.generateCompanyAnalytics(companyId, period);
      const leaderboardData = analytics.analysis.leaderboard;

      // Store leaderboard results
      await this.storeLeaderboard(companyId, leaderboardData, period);

      return leaderboardData;
    } catch (error) {
      throw new Error(`Analytics Service - calculateLeaderboard: ${error.message}`);
    }
  }

  async getCurrentLeaderboard(companyId, period = 'weekly', category = 'productivity') {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select(`
          *,
          employee:employees(first_name, last_name, email, department, position)
        `)
        .eq('company_id', companyId)
        .eq('period', period)
        .order('rank', { ascending: true })
        .limit(20);

      if (error) throw error;

      // Filter by category if specified
      const filteredData = category ? 
        data.filter(item => item.metrics?.category === category) : 
        data;

      return filteredData;
    } catch (error) {
      throw new Error(`Analytics Service - getCurrentLeaderboard: ${error.message}`);
    }
  }

  // Data Retrieval Methods
  async getEmployeesData(companyId) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .eq('active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees data:', error);
      return [];
    }
  }

  async getTasksData(companyId, dateRange) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:employees!tasks_assigned_to_fkey(first_name, last_name, department),
          creator:employees!tasks_created_by_fkey(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching tasks data:', error);
      return [];
    }
  }

  async getMeetingsData(companyId, dateRange) {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          employees!meetings_created_by_fkey(first_name, last_name)
        `)
        .eq('company_id', companyId)
        .gte('scheduled_start', dateRange.start)
        .lte('scheduled_start', dateRange.end);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching meetings data:', error);
      return [];
    }
  }

  async getEmailsData(companyId, dateRange) {
    try {
      // Get emails through employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id')
        .eq('company_id', companyId);

      if (employeesError) throw employeesError;

      const employeeIds = employees.map(emp => emp.id);
      
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .in('user_id', employeeIds)
        .gte('processed_at', dateRange.start)
        .lte('processed_at', dateRange.end);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching emails data:', error);
      return [];
    }
  }

  async getExistingAnalytics(companyId, dateRange) {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('company_id', companyId)
        .gte('date', dateRange.start.split('T')[0])
        .lte('date', dateRange.end.split('T')[0]);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching existing analytics:', error);
      return [];
    }
  }

  async getEmployeeSpecificData(employeeId, period) {
    try {
      const dateRange = this.getDateRange(period);
      
      const [tasks, meetings, emails] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', employeeId)
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end),
        supabase
          .from('meetings')
          .select('*')
          .or(`created_by.eq.${employeeId},participants.cs.{${employeeId}}`)
          .gte('scheduled_start', dateRange.start)
          .lte('scheduled_start', dateRange.end),
        supabase
          .from('emails')
          .select('*')
          .eq('user_id', employeeId)
          .gte('processed_at', dateRange.start)
          .lte('processed_at', dateRange.end)
      ]);

      return {
        employeeId,
        tasks: tasks.data || [],
        meetings: meetings.data || [],
        emails: emails.data || [],
        period,
        dateRange
      };
    } catch (error) {
      throw new Error(`Analytics Service - getEmployeeSpecificData: ${error.message}`);
    }
  }

  // Storage Methods
  async storeAnalyticsResults(companyId, analysis, period) {
    try {
      const { error } = await supabase
        .from('analytics')
        .insert({
          company_id: companyId,
          period: period,
          metrics: analysis.metrics,
          insights: analysis.insights,
          trends: analysis.trends,
          predictions: analysis.predictions,
          reports: analysis.reports,
          recommendations: analysis.recommendations,
          generated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing analytics results:', error);
    }
  }

  async storeEmployeeAnalytics(employeeId, analysis, period) {
    try {
      // Calculate productivity score
      const productivityScore = this.calculateProductivityScore(analysis);

      const { error } = await supabase
        .from('analytics')
        .insert({
          employee_id: employeeId,
          period: period,
          metrics: analysis.metrics,
          productivity_score: productivityScore,
          tasks_completed: analysis.metrics?.individual?.tasks_completed || 0,
          meetings_attended: analysis.metrics?.individual?.meetings_attended || 0,
          emails_processed: analysis.metrics?.individual?.emails_processed || 0,
          generated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing employee analytics:', error);
    }
  }

  async storeLeaderboard(companyId, leaderboardData, period) {
    try {
      // Clear existing leaderboard for this period
      await supabase
        .from('leaderboard')
        .delete()
        .eq('company_id', companyId)
        .eq('period', period);

      // Prepare leaderboard entries
      const entries = [];
      
      Object.keys(leaderboardData).forEach(category => {
        const rankings = leaderboardData[category];
        rankings.forEach((entry, index) => {
          entries.push({
            company_id: companyId,
            employee_id: entry.employeeId,
            period: period,
            category: category,
            score: entry.score,
            rank: index + 1,
            metrics: entry.metrics,
            calculated_at: new Date().toISOString()
          });
        });
      });

      // Insert new leaderboard entries
      if (entries.length > 0) {
        const { error } = await supabase
          .from('leaderboard')
          .insert(entries);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error storing leaderboard:', error);
    }
  }

  // Utility Methods
  getDateRange(period) {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(start.getMonth() - 3);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  calculateProductivityScore(analysis) {
    // Simple productivity score calculation
    // In production, this would be more sophisticated
    let score = 50;

    const metrics = analysis.metrics?.individual;
    if (metrics) {
      if (metrics.tasks_completed > 0) score += 20;
      if (metrics.meetings_attended > 0) score += 15;
      if (metrics.emails_processed > 0) score += 15;
    }

    return Math.min(100, score);
  }

  // Reporting
  async generateReport(companyId, type = 'executive', period = 'monthly') {
    try {
      const analytics = await this.generateCompanyAnalytics(companyId, period);
      
      switch (type) {
        case 'executive':
          return analytics.analysis.reports?.executive || {};
        case 'manager':
          return analytics.analysis.reports?.manager || {};
        case 'individual':
          return analytics.analysis.reports?.individual || {};
        default:
          return analytics.analysis.reports?.executive || {};
      }
    } catch (error) {
      throw new Error(`Analytics Service - generateReport: ${error.message}`);
    }
  }

  // Quick Analytics
  async getQuickStats(companyId) {
    try {
      const [employees, tasks, meetings] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact' }).eq('company_id', companyId),
        supabase.from('tasks').select('id', { count: 'exact' }).eq('company_id', companyId),
        supabase.from('meetings').select('id', { count: 'exact' }).eq('company_id', companyId)
      ]);

      return {
        totalEmployees: employees.count || 0,
        totalTasks: tasks.count || 0,
        totalMeetings: meetings.count || 0,
        activeProjects: 0, // Would need projects table
        overallProductivity: 75 // Placeholder
      };
    } catch (error) {
      throw new Error(`Analytics Service - getQuickStats: ${error.message}`);
    }
  }

  async getEmployeeRank(employeeId, period = 'weekly') {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('period', period)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error getting employee rank:', error);
      return null;
    }
  }
}

export default new AnalyticsService();