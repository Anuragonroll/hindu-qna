const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const AIChat = require('../models/AIChat');
const Question = require('../models/Question');
const { auth } = require('../middleware/auth');

let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

let groq;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// System prompt for Hindu Q&A
const systemPrompt = `You are a Hinduism expert. Answer concisely.

IMPORTANT RULES:
1. Cite specific scriptures with chapter/verse (e.g., Bhagavad Gita 2.47)
2. Format shlokas in \`\`\`sanskrit code blocks
3. ALWAYS mention the source website where the information can be verified
4. Be respectful of all traditions

Known reliable sources for Hinduism:
- Hinduism Stack Exchange (hinduism.stackexchange.com)
- The Spiritual Scientist (thespiritualscientist.com)
- Vedic Scriptures Online (vedabase.io)
- Swami Vivekananda writings
- ISKCON Desire Tree (iskcondesiretree.com)
- Hindu Website (hinduwebsite.com)
- Sri Sri Ravi Shankar teachings
- Geeta Press Gorakhpur publications
- Digital Library of India

When you cite a source, format it like:
**Source:** [Website Name](URL)

Example answer format:
"The Gayatri Mantra is from the Rigveda (3.62.10).

\`\`\`sanskrit
ॐ भूर्भुवः स्वः
तत्सवितुर्वरेण्यं
भर्गो देवस्य धीमहि
धियो यो नः प्रचोदयात्
\`\`\`

This mantra is one of the most important Vedic mantras...

**Source:** [Hinduism Stack Exchange](https://hinduism.stackexchange.com/questions/...)"`;

// Semantic search function
async function semanticSearch(query, limit = 5) {
  try {
    const questions = await Question.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { body: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('tags', 'name')
    .limit(limit);

    return questions;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Chat with AI using Google Gemini
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    let chat = await AIChat.findOne({ sessionId });
    if (!chat) {
      chat = new AIChat({
        user: req.user._id,
        sessionId,
        messages: []
      });
    }

    const relatedQuestions = await semanticSearch(message, 3);
    
    let context = '';
    if (relatedQuestions.length > 0) {
      context = '\n\nRelated questions from our community:\n';
      relatedQuestions.forEach((q, i) => {
        context += `${i + 1}. ${q.title}\n`;
      });
    }

    chat.messages.push({ role: 'user', content: message });

    let assistantMessage;

    const messages = [
      { role: 'system', content: systemPrompt + context },
      ...chat.messages.slice(-4).map(m => ({ role: m.role, content: m.content }))
    ];

    // Try Groq first (fast, generous free tier)
    if (groq && process.env.GROQ_API_KEY) {
      try {
        const completion = await groq.chat.completions.create({
          messages,
          model: 'llama-3.3-70b-versatile',
          max_tokens: 4000,
          temperature: 0.7
        });
        assistantMessage = completion.choices[0].message.content;
      } catch (groqError) {
        console.error('Groq API error:', groqError.message);
      }
    }

    // Fallback to Gemini
    if (!assistantMessage && genAI && process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const chatHistory = chat.messages.slice(-4).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));
        const chatSession = model.startChat({
          history: [
            { role: 'user', parts: [{ text: 'You are a Hinduism expert.' }] },
            { role: 'model', parts: [{ text: 'Ready to answer Hinduism questions.' }] },
            ...chatHistory
          ],
          generationConfig: { maxOutputTokens: 4000, temperature: 0.7 }
        });
        const result = await chatSession.sendMessage(systemPrompt + context + '\n\nUser question: ' + message);
        assistantMessage = result.response.text();
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError.message);
      }
    }

    // Fallback message
    if (!assistantMessage) {
      assistantMessage = `Thank you for your question about "${message}".

The AI assistant is temporarily unavailable. Here's what I can tell you:

**Related questions from our community:**
${relatedQuestions.map((q, i) => `${i + 1}. ${q.title}`).join('\n') || 'No related questions found yet.'}

Please try again later or search the existing questions on the platform.`;
    }

    chat.messages.push({ role: 'assistant', content: assistantMessage });
    chat.context = { relatedQuestions: relatedQuestions.map(q => q._id) };
    await chat.save();

    res.json({
      message: assistantMessage,
      relatedQuestions,
      sessionId: chat.sessionId
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ message: 'AI service error' });
  }
});

// Get chat history
router.get('/history/:sessionId', auth, async (req, res) => {
  try {
    const chat = await AIChat.findOne({ 
      sessionId: req.params.sessionId,
      user: req.user._id 
    });

    if (!chat) {
      return res.json({ messages: [] });
    }

    res.json({ messages: chat.messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's chat sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await AIChat.find({ user: req.user._id })
      .select('sessionId createdAt')
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete chat session
router.delete('/sessions/:sessionId', auth, async (req, res) => {
  try {
    await AIChat.findOneAndDelete({ 
      sessionId: req.params.sessionId,
      user: req.user._id 
    });

    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
