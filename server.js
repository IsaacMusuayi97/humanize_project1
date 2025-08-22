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
  HUMANIZER: `You are a professional human rewriter. Rewrite the following text in a way that mimics natural, high-quality human writing.
  Keep the tone professional but not overly polished.
  Vary sentence structure, insert reasoning, and avoid generic or robotic phrasing.`,

  Enhancer: `Enhance the following professional content by adding natural reasoning and context.
  Include cause-effect logic, light elaboration, and smooth transitions.
  Keep it concise, but make it feel like a human explaining a point.`,

  Structural: `Rephrase this content with structural variety to avoid robotic rhythm.
  Mix long and short sentences, vary punctuation, and include natural rhetorical questions where appropriate.`,

  Sanitizer: `Scan the text and replace overused AI-like phrases (e.g., "in conclusion", "it is important to note") 
  with more natural professional alternatives.
  Keep meaning intact while sounding like a human.`,

  Expansion: `Expand the content slightly by adding small clarifications, examples, or human-like elaborations.
  Keep it professional, but don’t be afraid to add mild digressions or hedges.`,

  Synomyne: `You are an human editor. Replace as many as words as possible with their synomyne if the change does not alter the meaning `,

  Optimizer: `Optimize the text so it reads naturally while reducing AI-detection likelihood.
  Avoid uniform sentence length, introduce slight imperfections, and allow small quirks.
  Keep tone professional, but not mechanically polished.`,
};

// === Utility: run an "agent" ===
async function runAgent(systemMessage, inputText, temperature = 0.9) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',   // ✅ corrected model name
    temperature,
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: inputText }
    ]
  });

  return response.choices[0].message?.content?.trim() || "";
}

// === Endpoint ===
app.post('/humanize', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text input required" });

  try {
    let humanizedText = text;

    for (let attempt = 0; attempt < HUMANIZATION_SETTINGS.MAX_RETRIES; attempt++) {
         // Step 1: Humanizer
      humanizedText = await runAgent(PROMPTS.HUMANIZER, humanizedText, HUMANIZATION_SETTINGS.TEMPERATURE_RANGE[1]);

      // Step 2: Enhancer (takes output of Humanizer)
      humanizedText = await runAgent(PROMPTS.Enhancer, humanizedText);

      // Step 3: Structural (takes output of Enhancer)
      humanizedText = await runAgent(PROMPTS.Structural, humanizedText);

      // Step 4: Sanitizer (takes output of Structural)
      humanizedText = await runAgent(PROMPTS.Sanitizer, humanizedText);

      // Step 5: Expansion (takes output of Sanitizer)
      humanizedText = await runAgent(PROMPTS.Expansion, humanizedText);

      humanizedText = await runAgent(PROMPTS.Synomyne, humanizedText);

      // Step 6: Optimizer (takes output of Expansion)
      humanizedText = await runAgent(PROMPTS.Optimizer, humanizedText);

    }

    res.json({
      humanizedText,
      attempts: HUMANIZATION_SETTINGS.MAX_RETRIES,
      reviewers: ["Humanizer", "Enhancer", "Structural", "Sanitizer", "Expansion", "Synomyne", "Optimizer"]
    });

  } catch (error) {
    console.error("Humanization Error:", error);
    res.status(500).json({
      error: "Humanization failed",
      solution: "Try reducing text length or retries",
      technical: error.message
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🕵️ Multi-Agent Humanizer active on port ${process.env.PORT || 3000}`);
});
