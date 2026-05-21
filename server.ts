import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser middleware
app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Robust Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Chatbot API Endpoint
app.post('/api/chatbot', async (req, res) => {
  const { messages, userContext, portalConfig } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid or missing messages array' });
  }

  try {
    // Format messages for the Gemini API: role is "user" or "model"
    const contents = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Construct a comprehensive and highly contextual system instruction
    const systemInstruction = `You are "MyCampus Assistant Bot" - a highly intelligent, premium, friendly student support chatbot virtual assistant. You represent the "MyCampus Student Portal"/MyCampus Hub.

BACKGROUND & DEVELOPER DETAILS:
- Developed and designed proudly by "HabaJaba Tech" (Based in West Bengal, India).
- CEO & Founder of HabaJaba Tech: Sayan Kumar Patra. Sayan is the primary developer of this beautiful portal.
- Contact / Support Line: Sayan Kumar Patra (Phone/WhatsApp: +91 8145775413).
- If the user asks for help, wants to report issues, correct database, or register complex requests, tell them Sayan is directly available on WhatsApp at +91 8145775413, or they can click the direct floating chat connection buttons.

CURRENT STUDENT CONTEXT:
- Name: ${userContext?.name || 'Student'}
- Roll Number: ${userContext?.roll || 'Unknown'}
- Email: ${userContext?.email || 'Unknown'}
- Status: Active Student Portal Session.

PORTAL DYNAMIC CONTENT (LIVE DATA FROM DATABASE):
Use this actual live metadata to answer user questions about current faculty, notices, and class routine:

1. Class Routine Scheduler:
${JSON.stringify(portalConfig?.routine || [], null, 2)}

2. Faculty Members Directory:
${JSON.stringify(portalConfig?.faculties || [], null, 2)}

3. Latest Portal Notices / Announcements:
${JSON.stringify(portalConfig?.notices || [], null, 2)}

4. Dynamic Student Exam Results:
${JSON.stringify(portalConfig?.results || [], null, 2)}

5. List of Core Academic Subjects:
Data Structure using C (DSC-2), Business Communication (MIN-2), Financial Institution & Services (MDC-2), Introduction to Database (SEC-2), Understanding India-II (VAC-2), English (AEC-2), Advance Excel (AE-1), Mathematics (MATH-1), Web Technology (WT-1), Mentor Session (MENT-1).

PWA MAIN INSTALLATION GUIDELINE:
- This is a progressive web app (PWA) compiled to fit both mobile and desktop perfectly.
- To Download/Install:
  * Android / PC: There is an authentic Google Play styled "Download Now" badge on the Login and Signup pages. Also, once logged in, there is a dedicated yellow Google Play Store download button in the desktop/mobile top bar (next to the green Support Chat icon). Clicking this installs the app instantly to their device.
  * iOS (Safari): Tape the Safari "Share" button, then select "Add to Home Screen".

COMMUNICATION & LANGUAGE RULES:
- If the user asks in Bengali (Bangla) or Banglish, answer them beautifully, politely, and warmly in Bengali/Banglish. If query is in English, reply in crisp English.
- Avoid sounding overly technical or robotic. Be human, cheerful, and encouraging.
- When listing schedules, subjects, or faculty emails, present them in clean, easily readable Markdown lists or bold key points so it fits small mobile frames.
- Always be proud of MyCampus Hub, Sayan Kumar Patra, and HabaJaba Tech!`;

    // Query Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const replyText = response.text || "I'm processing MyCampus data. Could you try asking again in a second?";
    res.json({ reply: replyText });

  } catch (error: any) {
    console.error('[Chatbot API Error]:', error);
    res.status(500).json({ error: error.message || 'Error communicating with Gemini' });
  }
});

// Vite / static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MyCampus Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
