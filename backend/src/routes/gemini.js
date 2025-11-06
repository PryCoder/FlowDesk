import express from "express";
import axios from "axios";

const router = express.Router();

// Gemini API base URL and key
const GEMINI_API_URL = "https://api.openai.com/v1/responses"; // update if needed
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// -------------------- Sentiment Analysis --------------------
router.post("/sentiment", async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: "Text is required" });

  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        model: "gemini-1",
        input: `Analyze the sentiment of this text and respond with Positive, Neutral, or Negative:\n\n"${text}"`,
      },
      {
        headers: {
          "Authorization": `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const sentiment = response.data.output_text || "Unknown";
    res.json({ sentiment });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to analyze sentiment" });
  }
});

// -------------------- Suggested Reply --------------------
router.post("/suggest-reply", async (req, res) => {
  const { emailSnippet, tone } = req.body;

  if (!emailSnippet || !tone) {
    return res.status(400).json({ error: "Email snippet and tone are required" });
  }

  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        model: "gemini-1",
        input: `Generate a ${tone} professional email reply to the following email:\n\n"${emailSnippet}"`,
      },
      {
        headers: {
          "Authorization": `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const suggestedReply = response.data.output_text || "";
    res.json({ suggestedReply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate suggested reply" });
  }
});

export default router;
