import express from 'express';
import taskService from '../services/taskService.js';

const router = express.Router();

// Middleware to verify token
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Import authService for middleware
import authService from '../services/authService.js';

// Create a new task
router.post('/', authenticate, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      companyId: req.user.companyId
    };
    
    const task = await taskService.createTask(taskData, req.user.userId);
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate AI analysis for task
router.post('/:taskId/analyze', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await taskService.getTaskById(taskId);
    
    // Check if user has access to this task
    if (task.assigned_to !== req.user.userId && 
        task.created_by !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this task' });
    }
    
    const result = await taskService.generateTaskAnalysis(taskId);
    
    // Emit real-time update via Socket.io
    const io = req.app.get('io');
    io.to(req.user.companyId).emit('task_analyzed', {
      taskId,
      analysis: result.analysis
    });
    
    res.json({
      success: true,
      message: 'Task analysis generated successfully',
      ...result
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      deadlineFrom: req.query.deadlineFrom,
      deadlineTo: req.query.deadlineTo,
      hasAI: req.query.hasAI === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    
    const tasks = await taskService.getUserTasks(req.user.userId, filters);
    
    res.json({
      success: true,
      tasks,
      count: tasks.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get specific task
router.get('/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await taskService.getTaskById(taskId);
    
    // Check if user has access to this task
    if (task.assigned_to !== req.user.userId && 
        task.created_by !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this task' });
    }
    
    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task
router.put('/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updateData = req.body;
    
    // Verify user has access to this task
    const task = await taskService.getTaskById(taskId);
    if (task.assigned_to !== req.user.userId && 
        task.created_by !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this task' });
    }
    
    const updatedTask = await taskService.updateTask(taskId, updateData);
    
    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update task status
router.patch('/:taskId/status', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, progress } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Verify user has access to this task
    const task = await taskService.getTaskById(taskId);
    if (task.assigned_to !== req.user.userId && 
        task.created_by !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this task' });
    }
    
    const updatedTask = await taskService.updateTaskStatus(taskId, status, progress);
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(req.user.companyId).emit('task_updated', {
      taskId,
      status,
      progress
    });
    
    res.json({
      success: true,
      message: 'Task status updated successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Assign task to another user
router.patch('/:taskId/assign', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assigneeId } = req.body;
    
    if (!assigneeId) {
      return res.status(400).json({ error: 'Assignee ID is required' });
    }
    
    // Only task creator or admin can reassign
    const task = await taskService.getTaskById(taskId);
    if (task.created_by !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only task creator or admin can reassign tasks' });
    }
    
    const updatedTask = await taskService.assignTask(taskId, assigneeId);
    
    res.json({
      success: true,
      message: 'Task assigned successfully',
      task: updatedTask
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get company tasks (Admin only)
router.get('/company/all', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access company tasks' });
    }
    
    const filters = {
      status: req.query.status,
      department: req.query.department,
      period: req.query.period
    };
    
    const tasks = await taskService.getCompanyTasks(req.user.companyId, filters);
    
    res.json({
      success: true,
      tasks,
      count: tasks.length
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get task analytics
router.get('/analytics/personal', authenticate, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const analytics = await taskService.getTaskAnalytics(req.user.userId, period);
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get company task analytics (Admin only)
router.get('/analytics/company', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can access company analytics' });
    }
    
    const { period = '30d' } = req.query;
    
    const analytics = await taskService.getCompanyTaskAnalytics(req.user.companyId, period);
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Quick task estimation
router.post('/quick/estimate', authenticate, async (req, res) => {
  try {
    const { taskDescription } = req.body;
    
    if (!taskDescription) {
      return res.status(400).json({ error: 'Task description is required' });
    }
    
    const estimate = await taskService.quickTaskEstimate(taskDescription);
    
    res.json({
      success: true,
      estimate
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate subtasks
router.post('/quick/subtasks', authenticate, async (req, res) => {
  try {
    const { taskDescription } = req.body;
    
    if (!taskDescription) {
      return res.status(400).json({ error: 'Task description is required' });
    }
    
    const subtasks = await taskService.generateSubtasks(taskDescription);
    
    res.json({
      success: true,
      subtasks
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task
router.delete('/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Only task creator or admin can delete
    const task = await taskService.getTaskById(taskId);
    if (task.created_by !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only task creator or admin can delete tasks' });
    }
    
    await taskService.updateTask(taskId, { status: 'cancelled' });
    
    res.json({
      success: true,
      message: 'Task cancelled successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk update tasks
router.post('/bulk/update', authenticate, async (req, res) => {
  try {
    const { taskIds, updateData } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'Task IDs array is required' });
    }
    
    const results = [];
    for (const taskId of taskIds) {
      try {
        const task = await taskService.getTaskById(taskId);
        
        // Check access
        if (task.assigned_to !== req.user.userId && 
            task.created_by !== req.user.userId &&
            req.user.role !== 'admin') {
          results.push({ success: false, taskId, error: 'Access denied' });
          continue;
        }
        
        const updatedTask = await taskService.updateTask(taskId, updateData);
        results.push({ success: true, taskId, task: updatedTask });
      } catch (error) {
        results.push({ success: false, taskId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${results.filter(r => r.success).length} tasks`,
      results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;