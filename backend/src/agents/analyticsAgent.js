import { generateText } from '../utils/geminiClient.js';
import { StateGraph, END } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';

class AnalyticsAgent {
  constructor() {
    this.description = "AI agent for productivity analytics, insights generation, and leaderboard calculations";
    this.setupAgents();
  }

  setupAgents() {
    // Define state schema using Annotation (recommended approach)
    const stateSchema = Annotation.Root({
      rawData: Annotation({
        default: () => null
      }),
      metrics: Annotation({
        default: () => null
      }),
      insights: Annotation({
        default: () => null
      }),
      trends: Annotation({
        default: () => null
      }),
      recommendations: Annotation({
        default: () => null
      }),
      leaderboard: Annotation({
        default: () => null
      }),
      predictions: Annotation({
        default: () => null
      }),
      reports: Annotation({
        default: () => null
      })
    });

    // Alternative approach using Zod schema (uncomment if you prefer this)
    /*
    import { z } from 'zod';
    const stateSchema = z.object({
      rawData: z.any().optional().default(null),
      metrics: z.any().optional().default(null),
      insights: z.any().optional().default(null),
      trends: z.any().optional().default(null),
      recommendations: z.any().optional().default(null),
      leaderboard: z.any().optional().default(null),
      predictions: z.any().optional().default(null),
      reports: z.any().optional().default(null),
    });
    */

    const workflow = new StateGraph(stateSchema);

    workflow.addNode("processMetrics", this.processMetrics.bind(this));
    workflow.addNode("generateInsights", this.generateInsights.bind(this));
    workflow.addNode("analyzeTrends", this.analyzeTrends.bind(this));
    workflow.addNode("calculateLeaderboard", this.calculateLeaderboard.bind(this));
    workflow.addNode("generatePredictions", this.generatePredictions.bind(this));
    workflow.addNode("createReports", this.createReports.bind(this));
    workflow.addNode("provideRecommendations", this.provideRecommendations.bind(this));

    workflow.addEdge("processMetrics", "generateInsights");
    workflow.addEdge("generateInsights", "analyzeTrends");
    workflow.addEdge("analyzeTrends", "calculateLeaderboard");
    workflow.addEdge("calculateLeaderboard", "generatePredictions");
    workflow.addEdge("generatePredictions", "createReports");
    workflow.addEdge("createReports", "provideRecommendations");
    workflow.addEdge("provideRecommendations", END);

    workflow.setEntryPoint("processMetrics");

    this.agent = workflow.compile();
  }

  async processMetrics(state) {
    const prompt = `
      Process and analyze these employee productivity metrics:
      
      RAW DATA: ${JSON.stringify(state.rawData, null, 2)}
      
      Calculate comprehensive metrics including:
      
      INDIVIDUAL METRICS:
      - Task completion rate and velocity
      - Meeting participation and engagement
      - Email response time and volume
      - Focus time vs meeting time ratio
      - Project completion rate
      - Quality scores (if available)
      
      TEAM METRICS:
      - Collaboration density
      - Cross-team dependencies
      - Knowledge sharing frequency
      - Team velocity trends
      
      ORGANIZATIONAL METRICS:
      - Overall productivity trends
      - Department performance comparisons
      - Resource utilization rates
      - Bottleneck identification
      
      Format as structured JSON metrics
    `;

    const metrics = await generateText(prompt);
    return { 
      ...state, 
      metrics: this.safeJsonParse(metrics, { individual: {}, team: {}, organizational: {} })
    };
  }

  async generateInsights(state) {
    const prompt = `
      Generate actionable insights from these productivity metrics:
      
      METRICS: ${JSON.stringify(state.metrics, null, 2)}
      RAW DATA CONTEXT: ${JSON.stringify(state.rawData, null, 2)}
      
      Provide deep insights on:
      
      PERFORMANCE INSIGHTS:
      - Top performers and their habits
      - Performance bottlenecks
      - Productivity patterns
      - Time management effectiveness
      - Collaboration effectiveness
      
      BEHAVIORAL INSIGHTS:
      - Work habit correlations
      - Meeting impact on productivity
      - Communication patterns
      - Focus time optimization
      
      ORGANIZATIONAL INSIGHTS:
      - Team dynamics and synergies
      - Department performance drivers
      - Resource allocation effectiveness
      - Process efficiency opportunities
      
      Format as JSON insights with evidence and impact scores
    `;

    const insights = await generateText(prompt);
    return { 
      ...state, 
      insights: this.safeJsonParse(insights, { performance: [], behavioral: [], organizational: [] })
    };
  }

  async analyzeTrends(state) {
    const prompt = `
      Analyze trends and patterns over time from this data:
      
      METRICS: ${JSON.stringify(state.metrics, null, 2)}
      INSIGHTS: ${JSON.stringify(state.insights, null, 2)}
      RAW DATA TIMELINE: ${JSON.stringify(state.rawData?.timeline || {}, null, 2)}
      
      Identify:
      
      TIME-BASED TRENDS:
      - Weekly/Monthly productivity cycles
      - Seasonal patterns
      - Growth/decline trajectories
      - Anomalies and outliers
      
      Format as JSON trends analysis
    `;

    const trends = await generateText(prompt);
    return { 
      ...state, 
      trends: this.safeJsonParse(trends, { time_based: [], comparative: [], predictive: [] })
    };
  }

  async calculateLeaderboard(state) {
    const prompt = `
      Calculate comprehensive leaderboard rankings across multiple dimensions:
      
      METRICS: ${JSON.stringify(state.metrics, null, 2)}
      INSIGHTS: ${JSON.stringify(state.insights, null, 2)}
      TRENDS: ${JSON.stringify(state.trends, null, 2)}
      
      Create leaderboards for:
      
      PRODUCTIVITY LEADERBOARD:
      - Overall productivity score
      - Task completion rate
      - Project delivery speed
      - Quality of work
      
      COLLABORATION LEADERBOARD:
      - Team collaboration score
      - Knowledge sharing
      - Cross-team support
      - Mentorship impact
      
      INNOVATION LEADERBOARD:
      - Initiative and proactivity
      - Process improvements suggested
      - Innovation contributions
      - Problem-solving effectiveness
      
      WELLNESS LEADERBOARD:
      - Work-life balance
      - Sustainable pace
      - Stress management
      - Team supportiveness
      
      Format as JSON leaderboard with rankings and scores
    `;

    const leaderboard = await generateText(prompt);
    return { 
      ...state, 
      leaderboard: this.safeJsonParse(leaderboard, { productivity: [], collaboration: [], innovation: [], wellness: [] })
    };
  }

  async generatePredictions(state) {
    const prompt = `
      Generate predictions and forecasts based on current trends:
      
      COMPLETE ANALYSIS: ${JSON.stringify({
        metrics: state.metrics,
        insights: state.insights,
        trends: state.trends,
        leaderboard: state.leaderboard
      }, null, 2)}
      
      Provide predictions for:
      
      PERFORMANCE PREDICTIONS:
      - Individual performance trajectories
      - Team capacity forecasts
      - Project completion timelines
      - Skill development paths
      
      ORGANIZATIONAL PREDICTIONS:
      - Department growth projections
      - Resource needs forecasting
      - Bottleneck emergence predictions
      - Success probability for initiatives
      
      RISK PREDICTIONS:
      - Burnout risk indicators
      - Attrition probability
      - Performance decline warnings
      - Team dynamic changes
      
      Format as JSON predictions with confidence scores
    `;

    const predictions = await generateText(prompt);
    return { 
      ...state, 
      predictions: this.safeJsonParse(predictions, { performance: [], organizational: [], risks: [] })
    };
  }

  async createReports(state) {
    const prompt = `
      Create comprehensive analytics reports for different stakeholders:
      
      COMPLETE ANALYTICS: ${JSON.stringify({
        metrics: state.metrics,
        insights: state.insights,
        trends: state.trends,
        leaderboard: state.leaderboard,
        predictions: state.predictions
      }, null, 2)}
      
      Generate reports for:
      
      EXECUTIVE REPORT:
      - High-level summary
      - Key business impacts
      - Strategic recommendations
      - ROI analysis
      
      MANAGER REPORT:
      - Team performance overview
      - Individual development needs
      - Resource optimization opportunities
      - Team dynamics analysis
      
      INDIVIDUAL REPORT:
      - Personal performance insights
      - Strength and growth areas
      - Career development suggestions
      - Work habit recommendations
      
      Format as JSON reports with tailored content for each audience
    `;

    const reports = await generateText(prompt);
    return { 
      ...state, 
      reports: this.safeJsonParse(reports, { executive: {}, manager: {}, individual: {} })
    };
  }

  async provideRecommendations(state) {
    const prompt = `
      Provide actionable recommendations based on complete analytics:
      
      FULL ANALYTICS DATA: ${JSON.stringify({
        metrics: state.metrics,
        insights: state.insights,
        trends: state.trends,
        leaderboard: state.leaderboard,
        predictions: state.predictions,
        reports: state.reports
      }, null, 2)}
      
      Generate recommendations for:
      
      INDIVIDUAL RECOMMENDATIONS:
      - Productivity improvements
      - Skill development paths
      - Work habit optimizations
      - Career growth opportunities
      
      TEAM RECOMMENDATIONS:
      - Process improvements
      - Collaboration enhancements
      - Resource allocation optimizations
      - Team building activities
      
      ORGANIZATIONAL RECOMMENDATIONS:
      - Policy changes
      - Tool and resource investments
      - Training program development
      - Cultural initiatives
      
      Format as JSON recommendations with implementation priority
    `;

    const recommendations = await generateText(prompt);
    return { 
      ...state, 
      recommendations: this.safeJsonParse(recommendations, { individual: [], team: [], organizational: [] })
    };
  }

  // Utility method for safe JSON parsing
  safeJsonParse(str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch (error) {
      console.error('JSON Parse Error:', error);
      return defaultValue;
    }
  }

  // Main processing method
  async process(analyticsData, options = {}) {
    const {
      employees = [],
      tasks = [],
      meetings = [],
      emails = [],
      period = "weekly",
      dateRange = {},
      companyId
    } = analyticsData;

    const initialState = {
      rawData: {
        employees,
        tasks,
        meetings,
        emails,
        period,
        dateRange,
        companyId,
        totalEmployees: employees.length,
        totalTasks: tasks.length,
        totalMeetings: meetings.length,
        totalEmails: emails.length,
        processedAt: new Date().toISOString()
      }
    };

    const result = await this.agent.invoke(initialState);
    
    // Add processing metadata
    return {
      ...result,
      processingInfo: {
        processedAt: new Date().toISOString(),
        agentVersion: "1.0",
        period,
        options
      }
    };
  }

  // Quick team performance snapshot
  async quickTeamSnapshot(teamData) {
    const prompt = `
      Provide quick team performance snapshot:
      ${JSON.stringify(teamData)}
      
      Return: Top performer, Area for improvement, Quick recommendation
    `;
    return await generateText(prompt);
  }

  // Individual performance analysis
  async individualAnalysis(employeeData) {
    const prompt = `
      Analyze individual performance:
      ${JSON.stringify(employeeData)}
      
      Return strengths, growth areas, and recommendations as bullet points.
    `;
    return await generateText(prompt);
  }
}

// Export as instance
const analyticsAgent = new AnalyticsAgent();
export default analyticsAgent;