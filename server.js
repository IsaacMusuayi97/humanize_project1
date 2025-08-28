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

   const textHumanized =
    completion.choices?.[0]?.message?.content?.trim() ||
    completion.choices?.[0]?.messages?.[0]?.content?.trim();
  return textHumanized;
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});


