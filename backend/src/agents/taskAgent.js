import { generateText } from '../utils/geminiClient.js';
import { StateGraph, END, Annotation } from '@langchain/langgraph';

class TaskAgent {
  constructor() {
    this.description = "AI agent for task analysis, breakdown, timeline planning, and success recommendations";
    this.setupAgents();
  }

  setupAgents() {
    // Correct schema using Annotation.Root
    const schema = Annotation.Root({
      task: Annotation({ default: {} }),
      breakdown: Annotation({ default: {} }),
      timeline: Annotation({ default: {} }),
      resources: Annotation({ default: {} }),
      risks: Annotation({ default: {} }),
      recommendations: Annotation({ default: {} }),
      dependencies: Annotation({ default: {} }),
      successMetrics: Annotation({ default: {} }),
      optimization: Annotation({ default: {} }),
    });

    const workflow = new StateGraph(schema);

    workflow.addNode("analyzeTask", this.analyzeTask.bind(this));
    workflow.addNode("breakdownTask", this.breakdownTask.bind(this));
    workflow.addNode("createTimeline", this.createTimeline.bind(this));
    workflow.addNode("identifyDependencies", this.identifyDependencies.bind(this));
    workflow.addNode("suggestResources", this.suggestResources.bind(this));
    workflow.addNode("analyzeRisks", this.analyzeRisks.bind(this));
    workflow.addNode("defineMetrics", this.defineSuccessMetrics.bind(this));
    workflow.addNode("generateRecommendations", this.generateRecommendations.bind(this));
    workflow.addNode("optimizeApproach", this.optimizeApproach.bind(this));

    workflow.addEdge("analyzeTask", "breakdownTask");
    workflow.addEdge("breakdownTask", "createTimeline");
    workflow.addEdge("createTimeline", "identifyDependencies");
    workflow.addEdge("identifyDependencies", "suggestResources");
    workflow.addEdge("suggestResources", "analyzeRisks");
    workflow.addEdge("analyzeRisks", "defineMetrics");
    workflow.addEdge("defineMetrics", "generateRecommendations");
    workflow.addEdge("generateRecommendations", "optimizeApproach");
    workflow.addEdge("optimizeApproach", END);

    workflow.setEntryPoint("analyzeTask");

    this.agent = workflow.compile();
  }

  // --- Async processing methods ---
  async analyzeTask(state) { /* same as your original */ }
  async breakdownTask(state) { /* same as your original */ }
  async createTimeline(state) { /* same as your original */ }
  async identifyDependencies(state) { /* same as your original */ }
  async suggestResources(state) { /* same as your original */ }
  async analyzeRisks(state) { /* same as your original */ }
  async defineSuccessMetrics(state) { /* same as your original */ }
  async generateRecommendations(state) { /* same as your original */ }
  async optimizeApproach(state) { /* same as your original */ }

  // --- Utilities ---
  safeJsonParse(str, defaultValue = null) {
    try { return JSON.parse(str); } 
    catch (error) { console.error('JSON Parse Error:', error); return defaultValue; }
  }

  async process(taskData, options = {}) {
    const { title, description, deadline, priority = "Medium", assignedTo, category, estimatedHours, context = "" } = taskData;

    const initialState = {
      task: { title, description, deadline, priority, assignedTo, category, estimatedHours, context, createdAt: new Date().toISOString() }
    };

    const result = await this.agent.invoke(initialState);
    const taskScore = this.calculateTaskScore(result);

    return { ...result, taskScore, processingInfo: { processedAt: new Date().toISOString(), agentVersion: "1.0", options } };
  }

  calculateTaskScore(analysis) {
    let score = 50;
    const complexityScores = { "Simple": 20, "Moderate": 0, "Complex": -10, "Very Complex": -20 };

    if (analysis.task.analysis) {
      score += complexityScores[analysis.task.analysis.complexity] || 0;
    }

    if (analysis.risks && analysis.risks.risks) {
      const highRisks = analysis.risks.risks.filter(r => r.probability === "High" && r.impact === "High").length;
      score -= highRisks * 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  async quickEstimate(taskDescription) { /* same as your original */ }
  async generateSubtasks(taskDescription) { /* same as your original */ }
}

export default new TaskAgent();
