import express from 'express';
import analyticsService from '../services/analyticsService.js';
import authService from '../services/authService.js';

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

// Generate company analytics (Admin only)
router.post('/company/generate', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can generate company analytics' });
    }
    
    const { period = 'weekly' } = req.body;
    
    const analytics = await analyticsService.generateCompanyAnalytics(req.user.companyId, period);
    
    res.json({
      success: true,
      message: 'Company analytics generated successfully',
      ...analytics
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate employee analytics
router.post('/employee/generate', authenticate, async (req, res) => {
  try {
    const { period = 'weekly' } = req.body;
    
    const analytics = await analyticsService.generateEmployeeAnalytics(req.user.userId, period);
    
    res.json({
      success: true,
      message: 'Employee analytics generated successfully',
      ...analytics
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Calculate leaderboard (Admin only)
router.post('/leaderboard/calculate', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can calculate leaderboard' });
    }
    
    const { period = 'weekly' } = req.body;
    
    const leaderboard = await analyticsService.calculateLeaderboard(req.user.companyId, period);
    
    res.json({
      success: true,
      message: 'Leaderboard calculated successfully',
      leaderboard
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current leaderboard
router.get('/leaderboard/current', authenticate, async (req, res) => {
  try {
    const { period = 'weekly', category } = req.query;
    
    const leaderboard = await analyticsService.getCurrentLeaderboard(
      req.user.companyId, 
      period, 
      category
    );
    
    res.json({
      success: true,
      leaderboard,
      period,
      category
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get employee rank
router.get('/employee/rank', authenticate, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    
    const rank = await analyticsService.getEmployeeRank(req.user.userId, period);
    
    res.json({
      success: true,
      rank,
      period
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate report
router.post('/reports/generate', authenticate, async (req, res) => {
  try {
    const { type = 'executive', period = 'monthly' } = req.body;
    
    let companyId = req.user.companyId;
    
    // For individual reports, use employee's own data
    if (type === 'individual') {
      const analytics = await analyticsService.generateEmployeeAnalytics(req.user.userId, period);
      return res.json({
        success: true,
        report: analytics.analysis.reports?.individual || {},
        type,
        period
      });
    }
    
    // For executive/manager reports, admin access required
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only admins can generate executive and manager reports' 
      });
    }
    
    const report = await analyticsService.generateReport(companyId, type, period);
    
    res.json({
      success: true,
      report,
      type,
      period
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get quick stats
router.get('/stats/quick', authenticate, async (req, res) => {
  try {
    let stats;
    
    if (req.user.role === 'admin') {
      stats = await analyticsService.getQuickStats(req.user.companyId);
    } else {
      // For employees, show personal stats
      const analytics = await analyticsService.generateEmployeeAnalytics(req.user.userId, 'weekly');
      stats = {
        productivityScore: analytics.analysis.metrics?.individual?.productivity_score || 0,
        tasksCompleted: analytics.analysis.metrics?.individual?.tasks_completed || 0,
        meetingsAttended: analytics.analysis.metrics?.individual?.meetings_attended || 0,
        emailsProcessed: analytics.analysis.metrics?.individual?.emails_processed || 0,
        currentRank: await analyticsService.getEmployeeRank(req.user.userId, 'weekly')
      };
    }
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get employee performance trends
router.get('/employee/trends', authenticate, async (req, res) => {
  try {
    const { metric = 'productivity', period = 'monthly' } = req.query;
    
    // This would typically fetch historical data from the database
    // For now, return mock trends data
    const trends = {
      metric,
      period,
      data: generateMockTrendsData(metric, period),
      summary: `Trend analysis for ${metric} over ${period}`
    };
    
    res.json({
      success: true,
      trends
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Compare team performance (Admin only)
router.get('/team/compare', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can compare team performance' });
    }
    
    const { departments, period = 'monthly' } = req.query;
    
    // This would fetch and compare data for specified departments
    const comparison = {
      period,
      departments: departments ? departments.split(',') : ['All'],
      metrics: generateMockComparisonData(departments, period)
    };
    
    res.json({
      success: true,
      comparison
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get productivity insights
router.get('/insights/productivity', authenticate, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    
    let insights;
    
    if (req.user.role === 'admin') {
      const analytics = await analyticsService.generateCompanyAnalytics(req.user.companyId, period);
      insights = analytics.analysis.insights;
    } else {
      const analytics = await analyticsService.generateEmployeeAnalytics(req.user.userId, period);
      insights = analytics.analysis.insights;
    }
    
    res.json({
      success: true,
      insights,
      period
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get recommendations
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    
    let recommendations;
    
    if (req.user.role === 'admin') {
      const analytics = await analyticsService.generateCompanyAnalytics(req.user.companyId, period);
      recommendations = analytics.analysis.recommendations;
    } else {
      const analytics = await analyticsService.generateEmployeeAnalytics(req.user.userId, period);
      recommendations = analytics.analysis.recommendations;
    }
    
    res.json({
      success: true,
      recommendations,
      period
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Export analytics data (Admin only)
router.get('/export', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can export analytics data' });
    }
    
    const { format = 'json', period = 'monthly' } = req.query;
    
    const analytics = await analyticsService.generateCompanyAnalytics(req.user.companyId, period);
    
    // Set headers for download
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`);
      
      // Convert to CSV (simplified example)
      const csvData = convertToCSV(analytics);
      return res.send(csvData);
    }
    
    // Default to JSON
    res.json({
      success: true,
      analytics,
      period,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Utility methods for mock data (in production, these would fetch real data)
function generateMockTrendsData(metric, period) {
  const data = [];
  const points = period === 'monthly' ? 30 : 7;
  
  for (let i = 0; i < points; i++) {
    data.push({
      date: new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 100) + 50 // Random value between 50-150
    });
  }
  
  return data;
}

function generateMockComparisonData(departments, period) {
  const depts = departments ? departments.split(',') : ['Engineering', 'Marketing', 'Sales', 'HR'];
  
  return depts.map(dept => ({
    department: dept,
    productivity: Math.floor(Math.random() * 40) + 60,
    completionRate: Math.floor(Math.random() * 30) + 70,
    satisfaction: Math.floor(Math.random() * 20) + 80
  }));
}

function convertToCSV(analytics) {
  // Simplified CSV conversion
  let csv = 'Metric,Value\n';
  
  if (analytics.analysis && analytics.analysis.metrics) {
    Object.entries(analytics.analysis.metrics).forEach(([key, value]) => {
      csv += `${key},${value}\n`;
    });
  }
  
  return csv;
}

export default router;