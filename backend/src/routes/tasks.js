import express from 'express';
import taskService from '../services/taskService.js';
import authService from '../services/authService.js';
import taskAgent from '../agents/taskAgent.js';

const router = express.Router();

// Middleware to verify token
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    const decoded = await authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};
// ==================== TASK STATUS UPDATE ====================
router.patch('/:taskId/status', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status is required' 
      });
    }

    console.log(`[TaskRoutes] Updating task ${taskId} status to: ${status}`);

    const task = await taskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        error: 'Task not found' 
      });
    }

    // Check access permissions
    const canAccess = req.user.role === 'admin' || 
                     task.assigned_to === req.user.userId || 
                     task.created_by === req.user.userId;
    
    if (!canAccess) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to this task' 
      });
    }

    // Update task status
    const updatedTask = await taskService.updateTaskStatus(taskId, status);

    // Generate AI completion analysis if task is being completed
    let completionAnalysis = null;
    if (status === 'completed') {
      try {
        const analysisResult = await taskAgent.analyzeTaskCompletion({
          task: updatedTask,
          userContext: {
            userId: req.user.userId,
            role: req.user.role
          }
        });

        if (analysisResult.success) {
          completionAnalysis = analysisResult.analysis;
          
          // Update task with completion insights
          await taskService.updateTask(taskId, {
            completion_analysis: completionAnalysis.insights,
            performance_metrics: completionAnalysis.metrics,
            skill_improvements: completionAnalysis.skillImprovements
          });
        }
      } catch (analysisError) {
        console.warn('[TaskRoutes] Completion analysis failed:', analysisError.message);
      }
    }

    // Emit real-time status update
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(req.user.companyId).emit('task_status_updated', {
          taskId,
          status,
          updatedBy: req.user.userId,
          completionAnalysis: completionAnalysis?.insights
        });

        // Notify assigned user specifically
        if (task.assigned_to && task.assigned_to !== req.user.userId) {
          io.to(`user_${task.assigned_to}`).emit('task_assignment_updated', {
            taskId,
            taskTitle: task.title,
            newStatus: status,
            updatedBy: req.user.userId
          });
        }
      }
    } catch (socketError) {
      console.warn('[TaskRoutes] Socket.io not available for real-time updates');
    }

    res.json({
      success: true,
      message: `Task status updated to ${status}`,
      task: updatedTask,
      completionAnalysis: completionAnalysis?.insights || null,
      performanceMetrics: completionAnalysis?.metrics || null
    });

  } catch (error) {
    console.error('[TaskRoutes] Status update error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== DELETE TASK ====================
router.delete('/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log(`[TaskRoutes] Deleting task: ${taskId}`);

    const task = await taskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false, 
        error: 'Task not found' 
      });
    }

    // Check access permissions - only admin or task creator can delete
    const canDelete = req.user.role === 'admin' || task.created_by === req.user.userId;
    
    if (!canDelete) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied - only admins or task creators can delete tasks' 
      });
    }

    // Delete the task
    await taskService.deleteTask(taskId);

    // Emit real-time deletion notification
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(req.user.companyId).emit('task_deleted', {
          taskId,
          taskTitle: task.title,
          deletedBy: req.user.userId
        });

        // Notify assigned user if different from deleter
        if (task.assigned_to && task.assigned_to !== req.user.userId) {
          io.to(`user_${task.assigned_to}`).emit('assigned_task_deleted', {
            taskId,
            taskTitle: task.title,
            deletedBy: req.user.userId
          });
        }
      }
    } catch (socketError) {
      console.warn('[TaskRoutes] Socket.io not available for real-time notifications');
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      deletedTask: {
        id: taskId,
        title: task.title
      }
    });

  } catch (error) {
    console.error('[TaskRoutes] Delete task error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Enhanced AI Task Generation with Better Error Handling
router.post('/ai/generate', authenticate, async (req, res) => {
  try {
    const { description, intelligenceType = 'strategic', complexity = 'medium', context } = req.body;
    
    if (!description) {
      return res.status(400).json({ success: false, error: 'Task description is required' });
    }

    console.log(`[TaskRoutes] Generating AI task with intelligence: ${intelligenceType}`);
    
    const result = await taskAgent.generateIntelligentTask({
      description,
      intelligenceType,
      complexity,
      context: {
        ...context,
        userId: req.user.userId,
        companyId: req.user.companyId,
        userRole: req.user.role
      }
    });

    if (!result.success) {
      console.warn('[TaskRoutes] AI generation failed, using fallback');
      return res.status(400).json({ 
        success: false, 
        error: 'AI task generation failed',
        fallbackUsed: result.fallbackUsed || false
      });
    }

    res.json({
      success: true,
      message: 'AI task generated successfully',
      task: result.task,
      intelligenceType,
      aiInsights: result.task.ai_insights,
      usage: result.usage,
      fallbackUsed: result.fallbackUsed || false
    });
  } catch (error) {
    console.error('[TaskRoutes] AI generate error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: 'AI service temporarily unavailable',
      fallback: true
    });
  }
});

// Multi-Agent Task Orchestration with Fallback
router.post('/ai/orchestrate', authenticate, async (req, res) => {
  try {
    const { objective, teamSize, deadline, constraints } = req.body;
    
    if (!objective) {
      return res.status(400).json({ success: false, error: 'Objective is required' });
    }

    console.log(`[TaskRoutes] Orchestrating multi-agent workflow for: ${objective}`);
    
    const orchestration = await taskAgent.orchestrateMultiAgentWorkflow({
      objective,
      teamSize: teamSize || 3,
      deadline,
      constraints,
      companyContext: {
        companyId: req.user.companyId,
        userId: req.user.userId,
        userRole: req.user.role
      }
    });

    // Emit real-time orchestration progress
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(req.user.companyId).emit('ai_orchestration_complete', {
          objective,
          workflow: orchestration.workflow,
          agents: orchestration.agents,
          fallbackUsed: orchestration.fallbackUsed || false
        });
      }
    } catch (socketError) {
      console.warn('[TaskRoutes] Socket.io not available for real-time updates');
    }

    res.json({
      success: true,
      message: 'Multi-agent orchestration completed',
      orchestration,
      fallbackUsed: orchestration.fallbackUsed || false
    });
  } catch (error) {
    console.error('[TaskRoutes] Orchestration error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: 'Orchestration service temporarily unavailable',
      fallback: true
    });
  }
});

// AI-Powered Task Optimization with Enhanced Error Handling
router.post('/:taskId/ai/optimize', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { optimizationType = 'efficiency' } = req.body;

    console.log(`[TaskRoutes] Optimizing task ${taskId} for: ${optimizationType}`);
    
    const task = await taskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Check access
    if (task.assigned_to !== req.user.userId && 
        task.created_by !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied to this task' });
    }

    const result = await taskAgent.optimizeTask({
      task,
      optimizationType,
      userContext: {
        userId: req.user.userId,
        role: req.user.role
      }
    });

    if (!result.success) {
      console.warn(`[TaskRoutes] Optimization failed for task ${taskId}`);
      return res.status(400).json({ 
        success: false, 
        error: 'AI optimization failed',
        fallbackUsed: result.fallbackUsed || false
      });
    }

    res.json({
      success: true,
      message: `Task optimized for ${optimizationType}`,
      optimization: result.optimization,
      originalTask: task,
      optimizedTask: result.optimization.optimizedTask,
      usage: result.usage,
      fallbackUsed: result.fallbackUsed || false
    });
  } catch (error) {
    console.error('[TaskRoutes] Optimization error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: 'Optimization service temporarily unavailable',
      fallback: true
    });
  }
});

// ==================== DYNAMIC PREDICTIONS ROUTE ====================

router.get('/ai/predictions/dynamic', authenticate, async (req, res) => {
  try {
    const { timeframe = '30d', predictionType = 'completion', includePatterns = 'true' } = req.query;

    console.log(`[TaskRoutes] Generating dynamic predictions for user: ${req.user.userId}`);
    
    const result = await taskAgent.generateDynamicPredictions({
      userId: req.user.userId,
      companyId: req.user.companyId,
      timeframe,
      predictionType,
      includePatterns: includePatterns === 'true'
    });

    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dynamic prediction generation failed',
        fallbackUsed: result.fallbackUsed || false
      });
    }

    res.json({
      success: true,
      message: 'Dynamic predictions generated successfully',
      predictions: result,
      timeframe,
      confidence: result.confidenceScore,
      dynamic: result.dynamic || false,
      personalized: result.personalized || false,
      fallbackUsed: result.fallbackUsed || false
    });
  } catch (error) {
    console.error('[TaskRoutes] Dynamic prediction error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: 'Prediction service temporarily unavailable',
      fallback: true
    });
  }
});

// ==================== PERSONALIZED RECOMMENDATIONS ROUTE ====================

router.get('/ai/recommendations/personalized', authenticate, async (req, res) => {
  try {
    const { type = 'adaptive', limit = 5, includeSkills = 'true' } = req.query;

    console.log(`[TaskRoutes] Getting personalized recommendations for user: ${req.user.userId}`);
    
    const result = await taskAgent.getPersonalizedRecommendations({
      userId: req.user.userId,
      companyId: req.user.companyId,
      recommendationType: type,
      limit: parseInt(limit),
      includeSkills: includeSkills === 'true',
      userContext: {
        role: req.user.role,
        skills: req.user.skills || [],
        preferences: req.user.preferences || {}
      }
    });

    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Personalized recommendation generation failed',
        fallbackUsed: result.fallbackUsed || false
      });
    }

    res.json({
      success: true,
      message: 'Personalized recommendations generated successfully',
      recommendations: result,
      type,
      relevanceScore: result.relevanceScore,
      personalizationLevel: result.personalizationLevel || 'medium',
      adaptive: result.adaptive || false,
      skillTargeted: result.skillTargeted || false,
      fallbackUsed: result.fallbackUsed || false
    });
  } catch (error) {
    console.error('[TaskRoutes] Personalized recommendation error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: 'Recommendation service temporarily unavailable',
      fallback: true
    });
  }
});

// ==================== INTELLIGENT DASHBOARD ROUTE ====================

router.get('/ai/dashboard/intelligent', authenticate, async (req, res) => {
  try {
    const { timeframe = '30d', includeTrends = 'true', includeBenchmarks = 'true' } = req.query;

    console.log(`[TaskRoutes] Generating intelligent dashboard for user: ${req.user.userId}`);
    
    // Get user's tasks for analysis
    const tasks = await taskService.getUserTasks(req.user.userId, {
      timeframe,
      includeCompleted: true
    });

    const result = await taskAgent.generateIntelligentDashboard({
      userId: req.user.userId,
      companyId: req.user.companyId,
      tasks: tasks || [],
      timeframe,
      includeTrends: includeTrends === 'true',
      includeBenchmarks: includeBenchmarks === 'true'
    });

    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'Intelligent dashboard generation failed',
        fallbackUsed: result.fallbackUsed || false
      });
    }

    res.json({
      success: true,
      message: 'Intelligent dashboard generated successfully',
      dashboard: result.dashboard,
      intelligent: result.intelligent || false,
      adaptive: result.adaptive || false,
      timeframe,
      fallbackUsed: result.fallbackUsed || false
    });
  } catch (error) {
    console.error('[TaskRoutes] Intelligent dashboard error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: 'Dashboard service temporarily unavailable',
      fallback: true
    });
  }
});

// Enhanced Task Creation with AI Features
router.post('/', authenticate, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      assigned_to, 
      priority, 
      deadline, 
      category,
      estimatedHours,
      generateAIInsights = false,
      autoOptimize = false
    } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Title and description are required' 
      });
    }
    
    const taskData = {
      title,
      description,
      assigned_to,
      priority: priority || 'medium',
      status: 'pending',
      deadline,
      category,
      estimatedHours,
      companyId: req.user.companyId,
      generateAIRecommendations: generateAIInsights
    };
    
    console.log(`[TaskRoutes] Creating task: ${title}`);
    
    let task = await taskService.createTask(taskData, req.user.userId);
    
    let aiInsightsGenerated = false;
    let optimizationApplied = false;

    // Generate AI insights if requested
    if (generateAIInsights) {
      try {
        const aiResult = await taskAgent.analyzeTaskComplexity({
          task: task
        });
        
        if (aiResult.success) {
          // Update task with AI insights
          task = await taskService.updateTask(task.id, {
            ai_complexity_score: aiResult.analysis?.complexityScore,
            ai_recommendations: aiResult.analysis?.keyFactors || []
          });
          aiInsightsGenerated = true;
        }
      } catch (aiError) {
        console.warn('[TaskRoutes] AI insight generation failed:', aiError.message);
      }
    }

    // Auto-optimize if requested
    if (autoOptimize) {
      try {
        const optimizationResult = await taskAgent.optimizeTask({
          task,
          optimizationType: 'efficiency'
        });
        
        if (optimizationResult.success) {
          task = await taskService.updateTask(task.id, {
            ai_optimization: optimizationResult.optimization?.suggestions || []
          });
          optimizationApplied = true;
        }
      } catch (optError) {
        console.warn('[TaskRoutes] Auto-optimization failed:', optError.message);
      }
    }

    // Emit real-time notification to assigned employee
    try {
      const io = req.app.get('io');
      if (io && assigned_to) {
        io.to(`user_${assigned_to}`).emit('new_task_assigned', {
          taskId: task.id,
          taskTitle: task.title,
          assignedBy: req.user.userId,
          priority: task.priority,
          deadline: task.deadline,
          aiInsights: task.ai_recommendations
        });
      }
    } catch (socketError) {
      console.warn('[TaskRoutes] Socket.io not available for real-time notifications');
    }
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
      aiGenerated: aiInsightsGenerated,
      optimized: optimizationApplied
    });
  } catch (error) {
    console.error('[TaskRoutes] Task creation error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get tasks for specific employee
router.get('/employee/:employeeId', authenticate, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Check if user has access (admin or the employee themselves)
    if (req.user.role !== 'admin' && req.user.userId !== employeeId) {
      return res.status(403).json({ success: false, error: 'Access denied to these tasks' });
    }
    
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      deadlineFrom: req.query.deadlineFrom,
      deadlineTo: req.query.deadlineTo,
      hasAI: req.query.hasAI === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : 50
    };
    
    console.log(`[TaskRoutes] Getting tasks for employee: ${employeeId}`);
    
    const tasks = await taskService.getUserTasks(employeeId, filters);
    
    // Add AI-powered insights for each task
    const tasksWithAIInsights = tasks.map((task) => {
      if (task.ai_recommendations) {
        return {
          ...task,
          ai_insights: {
            complexity: task.ai_complexity_score,
            recommendations: task.ai_recommendations,
            optimization: task.ai_optimization
          }
        };
      }
      return task;
    });
    
    res.json({
      success: true,
      tasks: tasksWithAIInsights,
      count: tasks.length,
      employeeId,
      aiEnhanced: tasks.some(t => t.ai_recommendations)
    });
  } catch (error) {
    console.error('[TaskRoutes] Get employee tasks error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get user's tasks with AI dashboard
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
    
    console.log(`[TaskRoutes] Getting tasks for user: ${req.user.userId}`);
    
    const tasks = await taskService.getUserTasks(req.user.userId, filters);
    
    // Generate AI-powered dashboard insights
    let aiDashboard = {
      productivityScore: 0,
      focusAreas: [],
      recommendations: ['Enable AI features for enhanced insights'],
      predictedCompletion: {},
      weeklyTrend: {},
      skillDevelopment: [],
      workloadAnalysis: {}
    };

    try {
      const dashboardResult = await taskAgent.generatePersonalDashboard({
        userId: req.user.userId,
        tasks: tasks,
        timeframe: '30d'
      });

      if (dashboardResult.success) {
        aiDashboard = dashboardResult.dashboard;
      }
    } catch (dashboardError) {
      console.warn('[TaskRoutes] AI dashboard generation failed:', dashboardError.message);
    }
    
    res.json({
      success: true,
      tasks: tasks || [],
      count: tasks?.length || 0,
      aiDashboard
    });
  } catch (error) {
    console.error('[TaskRoutes] Get user tasks error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// AI-Powered Task Completion
router.patch('/:taskId/complete', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { actualHours, challenges, learnings } = req.body;
    
    console.log(`[TaskRoutes] Completing task: ${taskId}`);
    
    const task = await taskService.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    if (task.assigned_to !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied to this task' });
    }
    
    // Update task status
    const updatedTask = await taskService.updateTaskStatus(taskId, 'completed', 100);
    
    let completionAnalysis = ['Basic completion recorded'];
    let performanceMetrics = {};
    let skillImprovements = [];

    // Generate AI completion analysis
    try {
      const analysisResult = await taskAgent.analyzeTaskCompletion({
        task: updatedTask,
        actualHours,
        challenges,
        learnings,
        userContext: {
          userId: req.user.userId,
          role: req.user.role
        }
      });

      if (analysisResult.success) {
        completionAnalysis = analysisResult.analysis?.insights || ['Analysis completed'];
        performanceMetrics = analysisResult.analysis?.metrics || {};
        skillImprovements = analysisResult.analysis?.skillImprovements || [];
      }
    } catch (analysisError) {
      console.warn('[TaskRoutes] Completion analysis failed:', analysisError.message);
    }

    let finalTask = updatedTask;
    
    // Update task with completion data
    finalTask = await taskService.updateTask(taskId, {
      actual_hours: actualHours,
      completion_analysis: completionAnalysis,
      performance_metrics: performanceMetrics,
      skill_improvements: skillImprovements
    });
    
    // Emit completion analytics
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(req.user.companyId).emit('task_completed_with_insights', {
          taskId,
          performance: performanceMetrics.performanceScore || 8.0,
          insights: completionAnalysis,
          skillGains: skillImprovements
        });
      }
    } catch (socketError) {
      console.warn('[TaskRoutes] Socket.io not available for real-time updates');
    }
    
    res.json({
      success: true,
      message: 'Task completed successfully',
      task: finalTask,
      completionAnalysis,
      performanceMetrics
    });
  } catch (error) {
    console.error('[TaskRoutes] Task completion error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// AI-Powered Bulk Task Management
router.post('/ai/bulk-optimize', authenticate, async (req, res) => {
  try {
    const { taskIds, optimizationGoal } = req.body;
    
    if (!taskIds || !Array.isArray(taskIds)) {
      return res.status(400).json({ success: false, error: 'Task IDs array is required' });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can perform bulk optimizations' });
    }
    
    console.log(`[TaskRoutes] Bulk optimizing ${taskIds.length} tasks for: ${optimizationGoal}`);
    
    const result = await taskAgent.optimizeTaskBatch({
      taskIds,
      optimizationGoal: optimizationGoal || 'efficiency',
      companyContext: req.user.companyId
    });

    if (!result.success) {
      console.warn('[TaskRoutes] Bulk optimization failed');
      return res.status(400).json({ 
        success: false, 
        error: 'Bulk optimization failed',
        fallbackUsed: result.fallbackUsed || false
      });
    }
    
    // Apply optimizations
    const results = [];
    for (const optimization of result.optimizations) {
      try {
        const updatedTask = await taskService.updateTask(optimization.taskId, {
          priority: optimization.suggestedPriority,
          deadline: optimization.suggestedDeadline,
          ai_optimization_reason: optimization.reason
        });
        results.push({ success: true, taskId: optimization.taskId, task: updatedTask });
      } catch (error) {
        results.push({ success: false, taskId: optimization.taskId, error: error.message });
      }
    }
    
    res.json({
      success: true,
      message: 'Bulk optimization completed',
      optimizationSummary: result.summary,
      results,
      efficiencyGain: result.summary?.efficiencyGain || '15%',
      usage: result.usage,
      fallbackUsed: result.fallbackUsed || false
    });
  } catch (error) {
    console.error('[TaskRoutes] Bulk optimization error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: 'Bulk optimization service temporarily unavailable',
      fallback: true
    });
  }
});

// AI Task Agent Health and Capabilities
router.get('/ai/capabilities', authenticate, async (req, res) => {
  try {
    const capabilities = await taskAgent.getCapabilities();
    
    res.json({
      success: true,
      capabilities: {
        ...capabilities,
        availableForRole: req.user.role,
        userSpecificFeatures: req.user.role === 'admin' 
          ? ['bulk_optimization', 'company_analytics', 'team_insights'] 
          : ['personal_optimization', 'skill_development', 'productivity_insights']
      }
    });
  } catch (error) {
    console.error('[TaskRoutes] Capabilities check error:', error.message);
    res.status(400).json({ 
      success: false, 
      error: 'Unable to retrieve capabilities',
      fallback: true
    });
  }
});

// Enhanced health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Advanced Task Management API with AI Agentic Features',
    timestamp: new Date().toISOString(),
    features: {
      aiAgentic: [
        'intelligent_task_generation',
        'multi_agent_orchestration', 
        'ai_optimization',
        'predictive_analytics',
        'smart_recommendations',
        'completion_analysis',
        'bulk_optimization'
      ],
      roleBased: {
        admin: ['bulk_operations', 'company_insights', 'team_analytics'],
        employee: ['personal_optimization', 'skill_development', 'productivity_insights']
      },
      realTime: ['notifications', 'progress_updates', 'ai_insights'],
      fallbackSupport: true
    }
  });
});

export default router;