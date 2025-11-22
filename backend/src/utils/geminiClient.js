import { GoogleGenAI } from '@google/genai';
import config from '../../rec/index.js';

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: config.gemini.apiKey });

export const getGeminiModel = (modelName = 'gemini-2.5-flash') => {
  // In the new SDK, we don't need a separate getGenerativeModel method
  return { modelName };
};

export const generateText = async (prompt, modelName = 'gemini-2.5-flash') => {
  try {
    const response = await genAI.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text || '';
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate text with Gemini');
  }
};

export const generateStructuredOutput = async (prompt, schema, modelName = 'gemini-2.5-flash') => {
  try {
    const structuredPrompt = `
      ${prompt}

      Please format your response as valid JSON that matches this schema:
      ${JSON.stringify(schema, null, 2)}

      Return ONLY the JSON object, no additional text or explanations.
    `;

    const response = await genAI.models.generateContent({
      model: modelName,
      contents: structuredPrompt,
    });

    const text = response.text || '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);

    // Fallback: try to parse the whole response
    return JSON.parse(text);
  } catch (error) {
    console.error('Gemini Structured Output Error:', error);
    throw new Error('Failed to generate structured output with Gemini');
  }
};

export const analyzeSentiment = async (text) => {
  const prompt = `
    Analyze the sentiment of the following text and return a JSON object with:
    - sentiment: "positive", "negative", or "neutral"
    - confidence: a number between 0 and 1
    - key_phrases: array of key emotional phrases
    - tone: description of the tone

    Text: "${text}"
  `;

  const schema = {
    sentiment: "string",
    confidence: "number",
    key_phrases: ["string"],
    tone: "string"
  };

  return await generateStructuredOutput(prompt, schema);
};

export const summarizeText = async (text, maxLength = 500) => {
  const prompt = `
    Summarize the following text in about ${maxLength} characters:

    "${text}"

    Provide a concise summary that captures the main points.
  `;

  return await generateText(prompt);
};

export const extractEntities = async (text, entityTypes = ['people', 'dates', 'tasks', 'decisions']) => {
  const prompt = `
    Extract the following entities from the text: ${entityTypes.join(', ')}

    Text: "${text}"

    Return a JSON object with arrays for each entity type.
  `;

  const schema = entityTypes.reduce((acc, type) => {
    acc[type] = ["string"];
    return acc;
  }, {});

  return await generateStructuredOutput(prompt, schema);
};

export default {
  getGeminiModel,
  generateText,
  generateStructuredOutput,
  analyzeSentiment,
  summarizeText,
  extractEntities
};
