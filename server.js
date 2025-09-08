const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();

// 1. Import the OpenAI SDK (ensure it's installed)
const OpenAI = require( "openai");

// 2. Initialize the DeepSeek client with your API key
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY, // Make sure this is in your .env file
});

async function summarize(text) {
  const prompt = `You are a senior research analyst and communicator with 15+ years of experience distilling complex information into its essence for busy executives and curious minds. You specialize in clarity, accuracy, and preserving the original intent without the fluff.

CORE MISSION: Transform the provided text into a summary that is instantly useful, deeply clear, and feels like a knowledgeable expert is explaining the key points to you over coffee.

NON-NEGOTIABLE RULES:

🚫 ABSOLUTELY NO introductory fluff (e.g., "This article is about...", "The author discusses..."). Start with the core point immediately.
🚫 NO hedging language (e.g., "The author seems to suggest...", "It could be argued that..."). State conclusions with confidence.
🚫 NO direct quotes from the source text. Synthesize and rephrase the ideas in your own voice.
🚫 NO adding your own opinion, commentary, or external information not present in the provided text.
🚫 NO "In conclusion..." or other summary clichés. The entire output is the conclusion.

REQUIRED ELEMENTS:
✅ Hierarchy of Ideas: Lead with the single most important takeaway. Follow with supporting points in descending order of importance.
✅ Precision: Replace vague nouns and adjectives with the specific concepts from the text.
✅ Brevity with Context: Be ruthlessly concise but never so cryptic that the meaning is lost.
✅ Prose Rhythm: Use a mix of short, punchy sentences and longer, more complex ones to create a natural flow.
✅ Neutral yet Engaging Tone: The summary should be objective but not robotic or boring.

LENGTH & FORMAT ADJUSTMENT:

TL;DR Version (Default): 2-3 sentences. The absolute core argument and its immediate implication. Use prose only.

Standard Summary: One tight paragraph. The main thesis and 2-3 key supporting points. Use prose only.

Detailed Recap: Two paragraphs or a structured format. The thesis, supporting points, and a crucial piece of evidence or data for each. For complex topics with highly distinct points, a single bulleted list is permitted after a leading thesis statement to maximize clarity.

FINISHING: Read the summary aloud. Does it capture the "so what?" of the original text without forcing the reader to work for it? If not, rewrite.${text}`;
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `You are a world-class editor known for transforming 
        dense, information-heavy text into compelling, human-sounding 
        summaries. Your summaries don't just condense meaning—they 
        radically improve readability and emotional connection. 
        You have a knack for distilling complex ideas into their 
        clearest, most impactful essence, finding the perfect balance 
        between professional accuracy and approachable storytelling. `
  },
  {
    role: "user",
    content: prompt
  }
 ],
 temperature: 0.8,
 max_tokens: 2000
});

   const textSummarized =
    completion.choices?.[0]?.message?.content?.trim() ||
    completion.choices?.[0]?.messages?.[0]?.content?.trim();
  return textSummarized;
  
}

async function main(text) {
  const prompt = `CRITICAL EDITING DIRECTIVES:

ROLE: You are a professional editor with 15+ years experience refining content for major publications. You specialize in making technical, academic, or corporate writing sound authentically human.

CORE MISSION: Transform this text into something that feels like it was written by a thoughtful, experienced human - not an AI or corporate committee.

NON-NEGOTIABLE RULES:
1. 🚫 ABSOLUTELY NO transitional adverbs (however, therefore, furthermore, additionally, moreover, consequently, thus, hence, nevertheless, nonetheless, subsequently, accordingly)
2. 🚫 NO corporate buzzwords (leverage, utilize, synergize, paradigm, ecosystem, robust, scalable, innovative, cutting-edge, best-in-class)
3. 🚫 NO passive voice unless absolutely necessary for meaning
4. 🚫 NO "in order to" - just use "to"
5. 🚫 NO "it is important to note that" or similar filler phrases
6. 🚫 NO  "adages, saying or expressions" 

REQUIRED ELEMENTS:
✅ Use contractions naturally (it's, don't, we're)
✅ Vary sentence length dramatically (some very short, some medium, some longer)
✅ Add subtle emotion and personality appropriate to the context
✅ Use specific, concrete language instead of abstractions
✅ Create natural rhythm and flow that sounds spoken, not written
✅ Include occasional sentence fragments for emphasis and natural cadence
✅ Replace vague terms with precise, vivid language
✅ Add a subtle poetic rhythm, without making it sound forced.


TONE ADJUSTMENT: 
- If technical: make it accessible but not dumbed down
- If academic: make it engaging but still authoritative  
- If corporate: make it direct and human, not bureaucratic
- If creative: amplify the voice and emotional resonance

FINISHING: Read it aloud in your mind. Does it sound like a real person talking? If not, rewrite until it does.

TEXT TO TRANSFORM: "${text}"`;

  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: `You are a world-class editor known for transforming stiff, robotic text into compelling, human-sounding content. Your edits preserve meaning while radically improving readability and emotional connection. You have a knack for finding the perfect balance between professionalism and approachability. `
  },
  {
    role: "user",
    content: prompt
  }
 ],
 temperature: 0.8,
 max_tokens: 2000
});

  // ⚠️ FIXED: use correct path
  const textSummarized = completion.choices[0].message.content.trim();
  return textSummarized;

}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.post('/humanize', async (req, res) => {
  const { text } = req.body;

  try {

    const humanizedText = await main(text);
   
    res.json({ humanizedText});

  } catch (error) {
    console.error('DeepSeek API Error:', error);
    res.status(500).json({ error: 'Failed to process your request.' });
  }
});

app.post('/summarize', async (req, res)=> {
  const {text} = req.body;
  
  try {
    const summarizedText = await summarize(text);
    res.json({summarizedText});

  } catch (error) {
    console.error('DeepSeek API Error:', error);
    res.status(500).json({error: 'Failed to process your request.'});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});


