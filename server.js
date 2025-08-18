const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();

const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Configuration
const HUMANIZATION_SETTINGS = {
  TARGET_AI_SCORE: 5,
  MAX_RETRIES: 2,
  TEMPERATURE_RANGE: [0.85, 0.95]
};

// === Agent Prompts ===
const PROMPTS = {
  HUMANIZER: `You are a professional human writer. Rewrite the following text so it sounds completely natural and human. 
  Use casual, clear, and engaging language. Include contractions where appropriate, vary sentence lengths, 
  and make it easy to read. Avoid robotic or overly formal phrasing. Keep the original meaning intact.`,
  
  CRITIC: `You are a critic. Review the text below and provide 2–3 practical suggestions to improve:
  - Tone (make it sound friendly, human, or professional depending on context)
  - Clarity (avoid confusing sentences or jargon)
  - Flow (make sentences and paragraphs smooth)

  Do not rewrite the text; only give concise, actionable feedback.`,
  
  LEGAL: `You are a legal and neutrality reviewer. Check the text for:
  - Offensive or biased language
  - Potential legal or privacy risks
  - Statements that could be misinterpreted

  Provide up to 3 bullet points if issues exist, or reply "No issues" if text is safe.
`,
  
  CONSISTENCY: `You are a consistency reviewer. Check the text for:
  - Consistent tone (formal, casual, friendly, etc.)
  - Uniform use of terms and vocabulary
  - Smooth paragraph and sentence style

  Provide 2-3 short bullet points for improvements, or reply "Consistent" if text is already fine.
`,
  
  META: `You are a meta reviewer. You have:
  - The original humanized text
  - Critic feedback
  - Legal feedback
  - Consistency feedback

  Your task: produce a final rewritten text that:
  - Addresses all feedback points
  - Reads naturally and human-like
  - Varies sentence lengths and word choices
  - Keeps meaning intact and engaging

  Write only the final text, ready for use.
`
};

// === Utility: run an "agent" ===
async function runAgent(systemMessage, inputText, temperature = 0.9) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: inputText }
    ]
  });

  
  return response.choices[0].message.content.trim();
}

// === Endpoint ===
app.post('/humanize', async (req, res) => {
  const { text, tone = 'neutral', strictness = 1 } = req.body;
  if (!text) return res.status(400).json({ error: "Text input required" });

  try {
    let humanizedText = text;

    for (let attempt = 0; attempt < HUMANIZATION_SETTINGS.MAX_RETRIES; attempt++) {
      // Step 1: Humanizer
      humanizedText = await runAgent(PROMPTS.HUMANIZER, humanizedText, HUMANIZATION_SETTINGS.TEMPERATURE_RANGE[1]);

      // Step 2: Critics
      const criticFeedback = await runAgent(PROMPTS.CRITIC, humanizedText);
      const legalFeedback = await runAgent(PROMPTS.LEGAL, humanizedText);
      const consistencyFeedback = await runAgent(PROMPTS.CONSISTENCY, humanizedText);

      // Step 3: Meta Reviewer combines everything
      const finalText = await runAgent(
        PROMPTS.META,
        `Text:\n${humanizedText}\n\nCritic:\n${criticFeedback}\n\nLegal:\n${legalFeedback}\n\nConsistency:\n${consistencyFeedback}`
      );

      humanizedText = finalText; // Update for next retry
    }

    res.json({
      humanizedText,
      attempts: HUMANIZATION_SETTINGS.MAX_RETRIES,
      reviewers: ["Critic", "Legal", "Consistency", "Meta"]
    });

  } catch (error) {
    console.error("Humanization Error:", error);
    res.status(500).json({
      error: "Humanization failed",
      solution: "Try reducing strictness or splitting long text",
      technical: error.message
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🕵️ Multi-Agent Humanizer active on port ${process.env.PORT || 3000}`);
});
