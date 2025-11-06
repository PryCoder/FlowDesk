import taskAgent from '../agents/taskAgent.js';
import supabase from '../utils/supabaseClient.js';

export class TaskService {
  constructor() {
    this.taskStatuses = ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'];
  }

  // Task Creation and Management
  async createTask(taskData, createdBy) {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          company_id: taskData.companyId,
          title: taskData.title,
          description: taskData.description,
          assigned_to: taskData.assignedTo,
          created_by: createdBy,
          priority: taskData.priority || 'medium',
          status: 'pending',
          deadline: taskData.deadline,
          category: taskData.category,
          estimated_hours: taskData.estimatedHours,
          tags: taskData.tags || []
        })
        .select()
        .single();

      if (error) throw new Error(`Task creation failed: ${error.message}`);

      // Generate AI analysis if requested
      if (taskData.generateAIRecommendations) {
        await this.generateTaskAnalysis(task.id);
      }

      return task;
    } catch (error) {
      throw new Error(`Task Service - createTask: ${error.message}`);
    }
  }

  async generateTaskAnalysis(taskId) {
    try {
      const task = await this.getTaskById(taskId);
      if (!task) throw new Error('Task not found');

      const analysis = await taskAgent.process({
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        priority: task.priority,
        assignedTo: task.assigned_to,
        context: `Category: ${task.category}, Estimated Hours: ${task.estimated_hours}`
      });

      // Update task with AI analysis
      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update({
          ai_breakdown: analysis.breakdown,
          ai_timeline: analysis.timeline,
          ai_resources: analysis.resources,
          ai_risks: analysis.risks,
          ai_recommendations: analysis.recommendations,
          ai_optimization: analysis.optimization,
          task_score: analysis.taskScore,
          last_analyzed: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw new Error(`Failed to update task with AI analysis: ${error.message}`);

      return {
        task: updatedTask,
        analysis: analysis
      };
    } catch (error) {
      throw new Error(`Task Service - generateTaskAnalysis: ${error.message}`);
    }
  }

  // Task Retrieval
  async getUserTasks(userId, filters = {}) {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:employees!tasks_assigned_to_fkey(first_name, last_name, email),
          creator:employees!tasks_created_by_fkey(first_name, last_name, email)
        `)
        .or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.deadlineFrom) {
        query = query.gte('deadline', filters.deadlineFrom);
      }
      if (filters.deadlineTo) {
        query = query.lte('deadline', filters.deadlineTo);
      }
      if (filters.hasAI) {
        query = query.not('ai_recommendations', 'is', null);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Task Service - getUserTasks: ${error.message}`);
    }
  }

  async getTaskById(taskId) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:employees!tasks_assigned_to_fkey(first_name, last_name, email, department),
          creator:employees!tasks_created_by_fkey(first_name, last_name, email)
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Task Service - getTaskById: ${error.message}`);
    }
  }

  async getCompanyTasks(companyId, filters = {}) {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:employees!tasks_assigned_to_fkey(first_name, last_name, email, department),
          creator:employees!tasks_created_by_fkey(first_name, last_name, email)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.department) {
        query = query.eq('assignee.department', filters.department);
      }
      if (filters.period) {
        const date = new Date();
        switch (filters.period) {
          case 'week':
            date.setDate(date.getDate() - 7);
            break;
          case 'month':
            date.setDate(date.getDate() - 30);
            break;
          case 'quarter':
            date.setDate(date.getDate() - 90);
            break;
        }
        query = query.gte('created_at', date.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Task Service - getCompanyTasks: ${error.message}`);
    }
  }

  // Task Updates
  async updateTask(taskId, updateData) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Task Service - updateTask: ${error.message}`);
    }
  }

  async updateTaskStatus(taskId, status, progress = null) {
    try {
      if (!this.taskStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${this.taskStatuses.join(', ')}`);
      }

      const updateData = { status };
      if (progress !== null) {
        updateData.progress = Math.max(0, Math.min(100, progress));
      }

      if (status === 'completed') {
        updateData.progress = 100;
        updateData.completed_at = new Date().toISOString();
      }

      return await this.updateTask(taskId, updateData);
    } catch (error) {
      throw new Error(`Task Service - updateTaskStatus: ${error.message}`);
    }
  }

  async assignTask(taskId, assigneeId) {
    try {
      return await this.updateTask(taskId, {
        assigned_to: assigneeId,
        status: 'pending' // Reset status when reassigning
      });
    } catch (error) {
      throw new Error(`Task Service - assignTask: ${error.message}`);
    }
  }

  // Task Analytics
  async getTaskAnalytics(userId, period = '30d') {
    try {
      const tasks = await this.getUserTasks(userId, { period });

      const analytics = {
        total: tasks.length,
        byStatus: this.groupBy(tasks, 'status'),
        byPriority: this.groupBy(tasks, 'priority'),
        byCategory: this.groupBy(tasks, 'category'),
        completionRate: this.calculateCompletionRate(tasks),
        averageCompletionTime: this.calculateAverageCompletionTime(tasks),
        overdue: this.countOverdueTasks(tasks),
        upcomingDeadlines: this.countUpcomingDeadlines(tasks),
        aiAdoption: this.calculateAIAdoption(tasks)
      };

      return analytics;
    } catch (error) {
      throw new Error(`Task Service - getTaskAnalytics: ${error.message}`);
    }
  }

  async getCompanyTaskAnalytics(companyId, period = '30d') {
    try {
      const tasks = await this.getCompanyTasks(companyId, { period });

      const analytics = {
        total: tasks.length,
        byStatus: this.groupBy(tasks, 'status'),
        byPriority: this.groupBy(tasks, 'priority'),
        byDepartment: this.groupByDepartment(tasks),
        completionRate: this.calculateCompletionRate(tasks),
        averageTaskScore: this.calculateAverageTaskScore(tasks),
        teamPerformance: this.calculateTeamPerformance(tasks)
      };

      return analytics;
    } catch (error) {
      throw new Error(`Task Service - getCompanyTaskAnalytics: ${error.message}`);
    }
  }

  // Utility Methods
  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key] || 'Unknown';
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  groupByDepartment(tasks) {
    return tasks.reduce((result, task) => {
      const department = task.assignee?.department || 'Unassigned';
      result[department] = (result[department] || 0) + 1;
      return result;
    }, {});
  }

  calculateCompletionRate(tasks) {
    const completed = tasks.filter(t => t.status === 'completed').length;
    return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
  }

  calculateAverageCompletionTime(tasks) {
    const completedTasks = tasks.filter(t => 
      t.status === 'completed' && t.created_at && t.completed_at
    );

    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((total, task) => {
      const created = new Date(task.created_at);
      const completed = new Date(task.completed_at);
      return total + (completed - created);
    }, 0);

    return totalTime / completedTasks.length / (1000 * 60 * 60 * 24); // Convert to days
  }

  countOverdueTasks(tasks) {
    const now = new Date();
    return tasks.filter(task => 
      task.deadline && 
      new Date(task.deadline) < now && 
      task.status !== 'completed'
    ).length;
  }

  countUpcomingDeadlines(tasks) {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks.filter(task => 
      task.deadline && 
      new Date(task.deadline) > now &&
      new Date(task.deadline) <= nextWeek &&
      task.status !== 'completed'
    ).length;
  }

  calculateAIAdoption(tasks) {
    const withAI = tasks.filter(t => t.ai_recommendations).length;
    return tasks.length > 0 ? (withAI / tasks.length) * 100 : 0;
  }

  calculateAverageTaskScore(tasks) {
    const scoredTasks = tasks.filter(t => t.task_score !== null);
    if (scoredTasks.length === 0) return 0;
    
    return scoredTasks.reduce((sum, task) => sum + task.task_score, 0) / scoredTasks.length;
  }

  calculateTeamPerformance(tasks) {
    const performance = {};
    
    tasks.forEach(task => {
      if (task.assignee) {
        const assigneeId = task.assignee.id;
        if (!performance[assigneeId]) {
          performance[assigneeId] = {
            name: `${task.assignee.first_name} ${task.assignee.last_name}`,
            department: task.assignee.department,
            total: 0,
            completed: 0,
            score: 0
          };
        }
        
        performance[assigneeId].total++;
        if (task.status === 'completed') {
          performance[assigneeId].completed++;
        }
        if (task.task_score) {
          performance[assigneeId].score += task.task_score;
        }
      }
    });

    // Calculate completion rates and average scores
    Object.values(performance).forEach(user => {
      user.completionRate = (user.completed / user.total) * 100;
      user.averageScore = user.score / user.total;
    });

    return performance;
  }

  // Quick Methods
  async quickTaskEstimate(taskDescription) {
    try {
      const estimate = await taskAgent.quickEstimate(taskDescription);
      return estimate;
    } catch (error) {
      throw new Error(`Task Service - quickTaskEstimate: ${error.message}`);
    }
  }

  async generateSubtasks(taskDescription) {
    try {
      const subtasks = await taskAgent.generateSubtasks(taskDescription);
      return subtasks;
    } catch (error) {
      throw new Error(`Task Service - generateSubtasks: ${error.message}`);
    }
  }
}

export default new TaskService();