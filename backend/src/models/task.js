import supabase from '../utils/supabaseClient.js';

export class TaskModel {
  static async create(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) throw new Error(`TaskModel - create: ${error.message}`);
    return data;
  }

  static async createMultiple(tasksData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert(tasksData)
      .select();

    if (error) throw new Error(`TaskModel - createMultiple: ${error.message}`);
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:employees!tasks_assigned_to_fkey (
          id,
          first_name,
          last_name,
          email,
          department
        ),
        creator:employees!tasks_created_by_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(`TaskModel - getById: ${error.message}`);
    return data;
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`TaskModel - update: ${error.message}`);
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`TaskModel - delete: ${error.message}`);
    return { success: true };
  }

  static async getUserTasks(userId, filters = {}) {
    const { 
      status, 
      priority, 
      category,
      deadlineFrom,
      deadlineTo,
      hasAI,
      limit = 50,
      page = 1
    } = filters;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:employees!tasks_assigned_to_fkey (
          first_name,
          last_name,
          email,
          department
        ),
        creator:employees!tasks_created_by_fkey (
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (deadlineFrom) {
      query = query.gte('deadline', deadlineFrom);
    }

    if (deadlineTo) {
      query = query.lte('deadline', deadlineTo);
    }

    if (hasAI !== undefined) {
      if (hasAI) {
        query = query.not('ai_recommendations', 'is', null);
      } else {
        query = query.is('ai_recommendations', null);
      }
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`TaskModel - getUserTasks: ${error.message}`);

    return {
      tasks: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  static async getCompanyTasks(companyId, filters = {}) {
    const { 
      status, 
      department,
      priority,
      limit = 100,
      page = 1
    } = filters;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:employees!tasks_assigned_to_fkey (
          first_name,
          last_name,
          email,
          department
        ),
        creator:employees!tasks_created_by_fkey (
          first_name,
          last_name,
          email
        )
      `, { count: 'exact' })
      .eq('company_id', companyId)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (department) {
      query = query.eq('assignee.department', department);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`TaskModel - getCompanyTasks: ${error.message}`);

    return {
      tasks: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  static async updateStatus(id, status, progress = null) {
    const updateData = { status };
    
    if (progress !== null) {
      updateData.progress = Math.max(0, Math.min(100, progress));
    }

    if (status === 'completed') {
      updateData.progress = 100;
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`TaskModel - updateStatus: ${error.message}`);
    return data;
  }

  static async assignTask(id, assigneeId) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        assigned_to: assigneeId,
        status: 'pending'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`TaskModel - assignTask: ${error.message}`);
    return data;
  }

  static async updateAIRecommendations(id, aiData) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ai_breakdown: aiData.breakdown,
        ai_timeline: aiData.timeline,
        ai_resources: aiData.resources,
        ai_risks: aiData.risks,
        ai_recommendations: aiData.recommendations,
        ai_optimization: aiData.optimization,
        task_score: aiData.taskScore,
        last_analyzed: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`TaskModel - updateAIRecommendations: ${error.message}`);
    return data;
  }

  // Analytics Methods
  static async getTaskStats(userId, period = '30d') {
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
      .from('tasks')
      .select('status, priority, category, progress, created_at, completed_at, deadline')
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .gte('created_at', startDate.toISOString());

    if (error) throw new Error(`TaskModel - getTaskStats: ${error.message}`);

    const stats = {
      total: data.length,
      byStatus: {},
      byPriority: {},
      byCategory: {},
      completed: 0,
      overdue: 0,
      averageProgress: 0,
      completionRate: 0
    };

    let totalProgress = 0;
    const now = new Date();

    data.forEach(task => {
      // Count by status
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;

      // Count by priority
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;

      // Count by category
      stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;

      // Count completed
      if (task.status === 'completed') {
        stats.completed++;
      }

      // Count overdue
      if (task.deadline && new Date(task.deadline) < now && task.status !== 'completed') {
        stats.overdue++;
      }

      // Calculate progress
      totalProgress += task.progress || 0;
    });

    if (data.length > 0) {
      stats.averageProgress = totalProgress / data.length;
      stats.completionRate = (stats.completed / data.length) * 100;
    }

    return stats;
  }

  static async getCompanyTaskStats(companyId, period = '30d') {
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
      .from('tasks')
      .select(`
        status,
        priority,
        progress,
        completed_at,
        deadline,
        assignee:employees!tasks_assigned_to_fkey (
          department
        )
      `)
      .eq('company_id', companyId)
      .gte('created_at', startDate.toISOString());

    if (error) throw new Error(`TaskModel - getCompanyTaskStats: ${error.message}`);

    const stats = {
      total: data.length,
      byStatus: {},
      byPriority: {},
      byDepartment: {},
      completed: 0,
      overdue: 0,
      averageProgress: 0,
      completionRate: 0
    };

    let totalProgress = 0;
    const now = new Date();

    data.forEach(task => {
      // Count by status
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;

      // Count by priority
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;

      // Count by department
      const department = task.assignee?.department || 'Unassigned';
      stats.byDepartment[department] = (stats.byDepartment[department] || 0) + 1;

      // Count completed
      if (task.status === 'completed') {
        stats.completed++;
      }

      // Count overdue
      if (task.deadline && new Date(task.deadline) < now && task.status !== 'completed') {
        stats.overdue++;
      }

      // Calculate progress
      totalProgress += task.progress || 0;
    });

    if (data.length > 0) {
      stats.averageProgress = totalProgress / data.length;
      stats.completionRate = (stats.completed / data.length) * 100;
    }

    return stats;
  }

  static async getUpcomingDeadlines(userId, days = 7) {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:employees!tasks_assigned_to_fkey (
          first_name,
          last_name
        )
      `)
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .gte('deadline', startDate.toISOString())
      .lte('deadline', endDate.toISOString())
      .neq('status', 'completed')
      .order('deadline')
      .limit(20);

    if (error) throw new Error(`TaskModel - getUpcomingDeadlines: ${error.message}`);
    return data;
  }

  static async getOverdueTasks(userId) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:employees!tasks_assigned_to_fkey (
          first_name,
          last_name
        )
      `)
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .lt('deadline', now)
      .neq('status', 'completed')
      .order('deadline')
      .limit(50);

    if (error) throw new Error(`TaskModel - getOverdueTasks: ${error.message}`);
    return data;
  }

  static async getRecentCompletedTasks(userId, limit = 10) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:employees!tasks_assigned_to_fkey (
          first_name,
          last_name
        )
      `)
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`TaskModel - getRecentCompletedTasks: ${error.message}`);
    return data;
  }

  // Search Methods
  static async searchTasks(userId, searchTerm, options = {}) {
    const { limit = 20, status, priority } = options;

    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:employees!tasks_assigned_to_fkey (
          first_name,
          last_name
        )
      `)
      .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) throw new Error(`TaskModel - searchTasks: ${error.message}`);
    return data;
  }

  // Bulk Operations
  static async bulkUpdateStatus(ids, status) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ status })
      .in('id', ids)
      .select();

    if (error) throw new Error(`TaskModel - bulkUpdateStatus: ${error.message}`);
    return data;
  }

  static async bulkAssignTasks(ids, assigneeId) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ assigned_to: assigneeId })
      .in('id', ids)
      .select();

    if (error) throw new Error(`TaskModel - bulkAssignTasks: ${error.message}`);
    return data;
  }
}

export default TaskModel;