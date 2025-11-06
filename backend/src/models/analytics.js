import supabase from '../utils/supabaseClient.js';

export class AnalyticsModel {
  // Analytics Storage
  static async createAnalytics(analyticsData) {
    const { data, error } = await supabase
      .from('analytics')
      .insert(analyticsData)
      .select()
      .single();

    if (error) throw new Error(`AnalyticsModel - createAnalytics: ${error.message}`);
    return data;
  }

  static async getAnalyticsById(id) {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`AnalyticsModel - getAnalyticsById: ${error.message}`);
    return data;
  }

  static async getCompanyAnalytics(companyId, period = 'weekly', limit = 10) {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('company_id', companyId)
      .eq('period', period)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`AnalyticsModel - getCompanyAnalytics: ${error.message}`);
    return data;
  }

  static async getEmployeeAnalytics(employeeId, period = 'weekly', limit = 10) {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('period', period)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`AnalyticsModel - getEmployeeAnalytics: ${error.message}`);
    return data;
  }

  static async getLatestCompanyAnalytics(companyId, period = 'weekly') {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('company_id', companyId)
      .eq('period', period)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw new Error(`AnalyticsModel - getLatestCompanyAnalytics: ${error.message}`);
    return data;
  }

  static async getLatestEmployeeAnalytics(employeeId, period = 'weekly') {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('period', period)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw new Error(`AnalyticsModel - getLatestEmployeeAnalytics: ${error.message}`);
    return data;
  }

  // Leaderboard Methods
  static async createLeaderboardEntry(leaderboardData) {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert(leaderboardData)
      .select()
      .single();

    if (error) throw new Error(`AnalyticsModel - createLeaderboardEntry: ${error.message}`);
    return data;
  }

  static async createLeaderboardEntries(entries) {
    const { data, error } = await supabase
      .from('leaderboard')
      .insert(entries)
      .select();

    if (error) throw new Error(`AnalyticsModel - createLeaderboardEntries: ${error.message}`);
    return data;
  }

  static async getLeaderboard(companyId, period = 'weekly', category = 'productivity', limit = 20) {
    const { data, error } = await supabase
      .from('leaderboard')
      .select(`
        *,
        employee:employees (
          id,
          first_name,
          last_name,
          email,
          department,
          position
        )
      `)
      .eq('company_id', companyId)
      .eq('period', period)
      .eq('category', category)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw new Error(`AnalyticsModel - getLeaderboard: ${error.message}`);
    return data;
  }

  static async getEmployeeLeaderboardHistory(employeeId, period = 'weekly', limit = 10) {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('period', period)
      .order('calculated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`AnalyticsModel - getEmployeeLeaderboardHistory: ${error.message}`);
    return data;
  }

  static async clearLeaderboard(companyId, period) {
    const { error } = await supabase
      .from('leaderboard')
      .delete()
      .eq('company_id', companyId)
      .eq('period', period);

    if (error) throw new Error(`AnalyticsModel - clearLeaderboard: ${error.message}`);
    return { success: true };
  }

  // Statistics Methods
  static async getProductivityStats(companyId, period = '30d') {
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

    // Get tasks data
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status, progress, created_at, completed_at')
      .eq('company_id', companyId)
      .gte('created_at', startDate.toISOString());

    // Get meetings data
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('status, scheduled_start, scheduled_end')
      .eq('company_id', companyId)
      .gte('scheduled_start', startDate.toISOString());

    if (tasksError || meetingsError) {
      throw new Error(`AnalyticsModel - getProductivityStats: ${tasksError?.message || meetingsError?.message}`);
    }

    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      averageTaskProgress: 0,
      totalMeetings: meetings.length,
      completedMeetings: meetings.filter(m => m.status === 'completed').length,
      meetingEfficiency: 0,
      overallProductivity: 0
    };

    // Calculate average task progress
    if (tasks.length > 0) {
      const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
      stats.averageTaskProgress = totalProgress / tasks.length;
    }

    // Calculate meeting efficiency (completed vs scheduled)
    if (meetings.length > 0) {
      stats.meetingEfficiency = (stats.completedMeetings / meetings.length) * 100;
    }

    // Calculate overall productivity score
    const taskCompletionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;
    const meetingCompletionRate = stats.totalMeetings > 0 ? (stats.completedMeetings / stats.totalMeetings) * 100 : 0;
    
    stats.overallProductivity = (taskCompletionRate * 0.7) + (meetingCompletionRate * 0.3);

    return stats;
  }

  static async getEmployeePerformanceStats(employeeId, period = '30d') {
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

    // Get tasks data
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status, progress, priority, deadline, completed_at')
      .eq('assigned_to', employeeId)
      .gte('created_at', startDate.toISOString());

    // Get meetings data
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('status, scheduled_start')
      .or(`created_by.eq.${employeeId},participants.cs.{${employeeId}}`)
      .gte('scheduled_start', startDate.toISOString());

    if (tasksError || meetingsError) {
      throw new Error(`AnalyticsModel - getEmployeePerformanceStats: ${tasksError?.message || meetingsError?.message}`);
    }

    const stats = {
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        overdue: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length,
        averageProgress: 0,
        byPriority: {}
      },
      meetings: {
        total: meetings.length,
        attended: meetings.filter(m => m.status === 'completed').length,
        participationRate: 0
      },
      productivityScore: 0
    };

    // Calculate task statistics
    if (tasks.length > 0) {
      const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
      stats.tasks.averageProgress = totalProgress / tasks.length;

      // Count by priority
      tasks.forEach(task => {
        stats.tasks.byPriority[task.priority] = (stats.tasks.byPriority[task.priority] || 0) + 1;
      });
    }

    // Calculate meeting participation rate
    if (meetings.length > 0) {
      stats.meetings.participationRate = (stats.meetings.attended / meetings.length) * 100;
    }

    // Calculate productivity score
    const taskCompletionRate = stats.tasks.total > 0 ? (stats.tasks.completed / stats.tasks.total) * 100 : 0;
    const meetingParticipationRate = stats.meetings.total > 0 ? stats.meetings.participationRate : 0;
    
    stats.productivityScore = (taskCompletionRate * 0.6) + (meetingParticipationRate * 0.4);

    return stats;
  }

  static async getDepartmentStats(companyId, period = '30d') {
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

    // Get employees by department
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, department')
      .eq('company_id', companyId)
      .eq('active', true);

    if (employeesError) throw new Error(`AnalyticsModel - getDepartmentStats: ${employeesError.message}`);

    const departmentStats = {};

    // Initialize department stats
    employees.forEach(employee => {
      const dept = employee.department || 'Unassigned';
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          employeeCount: 0,
          totalTasks: 0,
          completedTasks: 0,
          averageProductivity: 0,
          meetingParticipation: 0
        };
      }
      departmentStats[dept].employeeCount++;
    });

    // Get task statistics by department
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        status,
        assignee:employees!tasks_assigned_to_fkey (
          department
        )
      `)
      .eq('company_id', companyId)
      .gte('created_at', startDate.toISOString());

    if (tasksError) throw new Error(`AnalyticsModel - getDepartmentStats: ${tasksError.message}`);

    tasks.forEach(task => {
      const dept = task.assignee?.department || 'Unassigned';
      if (departmentStats[dept]) {
        departmentStats[dept].totalTasks++;
        if (task.status === 'completed') {
          departmentStats[dept].completedTasks++;
        }
      }
    });

    // Calculate productivity for each department
    Object.keys(departmentStats).forEach(dept => {
      const stats = departmentStats[dept];
      if (stats.totalTasks > 0) {
        stats.averageProductivity = (stats.completedTasks / stats.totalTasks) * 100;
      }
    });

    return departmentStats;
  }

  // Trend Analysis
  static async getProductivityTrends(companyId, days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('analytics')
      .select('generated_at, metrics')
      .eq('company_id', companyId)
      .gte('generated_at', startDate.toISOString())
      .lte('generated_at', endDate.toISOString())
      .order('generated_at', { ascending: true });

    if (error) throw new Error(`AnalyticsModel - getProductivityTrends: ${error.message}`);

    const trends = data.map(item => ({
      date: item.generated_at.split('T')[0],
      productivity: item.metrics?.overallProductivity || 0,
      taskCompletion: item.metrics?.taskCompletionRate || 0,
      meetingEfficiency: item.metrics?.meetingEfficiency || 0
    }));

    return trends;
  }

  static async getEmployeeTrends(employeeId, days = 30) {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('analytics')
      .select('generated_at, productivity_score, tasks_completed, meetings_attended')
      .eq('employee_id', employeeId)
      .gte('generated_at', startDate.toISOString())
      .lte('generated_at', endDate.toISOString())
      .order('generated_at', { ascending: true });

    if (error) throw new Error(`AnalyticsModel - getEmployeeTrends: ${error.message}`);

    const trends = data.map(item => ({
      date: item.generated_at.split('T')[0],
      productivity: item.productivity_score || 0,
      tasksCompleted: item.tasks_completed || 0,
      meetingsAttended: item.meetings_attended || 0
    }));

    return trends;
  }

  // Data Cleanup
  static async cleanupOldAnalytics(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error: analyticsError } = await supabase
      .from('analytics')
      .delete()
      .lt('generated_at', cutoffDate.toISOString());

    const { error: leaderboardError } = await supabase
      .from('leaderboard')
      .delete()
      .lt('calculated_at', cutoffDate.toISOString());

    if (analyticsError || leaderboardError) {
      throw new Error(`AnalyticsModel - cleanupOldAnalytics: ${analyticsError?.message || leaderboardError?.message}`);
    }

    return { 
      success: true, 
      message: `Cleaned up analytics data older than ${daysToKeep} days` 
    };
  }

  // Summary Methods
  static async getSummaryStats(companyId) {
    const [productivityStats, departmentStats, latestAnalytics] = await Promise.all([
      this.getProductivityStats(companyId, '7d'),
      this.getDepartmentStats(companyId, '7d'),
      this.getLatestCompanyAnalytics(companyId, 'weekly')
    ]);

    return {
      productivity: productivityStats,
      departments: departmentStats,
      insights: latestAnalytics?.insights || {},
      recommendations: latestAnalytics?.recommendations || {}
    };
  }
}

export default AnalyticsModel;