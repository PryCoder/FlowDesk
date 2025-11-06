import meetingAgent from './meetingAgent.js';
import emailAgent from './emailAgent.js';
import taskAgent from './taskAgent.js';
import analyticsAgent from './analyticsAgent.js';

// Master agent orchestrator
class AgentOrchestrator {
  constructor() {
    this.agents = {
      meeting: meetingAgent,
      email: emailAgent,
      task: taskAgent,
      analytics: analyticsAgent
    };
  }

  async processWorkflow(type, data, options = {}) {
    try {
      const agent = this.agents[type];
      if (!agent) {
        throw new Error(`Unknown agent type: ${type}`);
      }

      console.log(`🔄 Processing ${type} workflow...`);
      const result = await agent.process(data, options);
      console.log(`✅ ${type} workflow completed`);
      
      return result;
    } catch (error) {
      console.error(`❌ ${type} workflow failed:`, error);
      throw error;
    }
  }

  // Batch processing for multiple items
  async batchProcess(type, items, options = {}) {
    const results = [];
    for (const item of items) {
      try {
        const result = await this.processWorkflow(type, item, options);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message, data: item });
      }
    }
    return results;
  }

  // Get agent status
  getAgentStatus() {
    return Object.keys(this.agents).map(agentName => ({
      name: agentName,
      available: true,
      description: this.agents[agentName].description || `${agentName} Agent`
    }));
  }
}

export default new AgentOrchestrator();