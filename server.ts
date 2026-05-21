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

// Initialize Gemini Client Lazily with robust checks
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "" || key === "MY_GEMINI_API_KEY") {
    console.warn("[MyCampus Server] Warning: GEMINI_API_KEY is not configured or is set to placeholder.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Robust Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', keyStatus: !!process.env.GEMINI_API_KEY, time: new Date().toISOString() });
});

// Chatbot API Endpoint
app.post('/api/chatbot', async (req, res) => {
  const { messages, userContext, portalConfig } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid or missing messages array' });
  }

  // Check if Gemini Client is initialized successfully
  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      reply: `নমস্কার ${userContext?.name || 'শিক্ষার্থী'}! 👋 আমি MyCampus AI অ্যাসিস্ট্যান্ট। 

আপনার পোর্টালে চ্যাটবটটি সচল করতে **GEMINI_API_KEY** যোগ করা প্রয়োজন। 

**কিভাবে আপনার API Key যোগ করবেন:**
১. গুগল এআই স্টুডিও-র (Google AI Studio) ডানদিকের কোণায় **Settings** (গিয়ার আইকন) থেকে **Secrets** অপশনে যান।
২. সেখানে **GEMINI_API_KEY** নামে একটি নতুন সিক্রেট যোগ করুন এবং আপনার জেমিনি এপিআই কী দিন।

**পোর্টালে কোনো সাহায্য প্রয়োজন হলে:**
আপনি সরাসরি আমাদের প্রধান ডেভেলপার **সায়ন কুমার পাত্র (Sayan Kumar Patra)** এর সাথে WhatsApp-এ যোগাযোগ করতে পারেন: **+91 8145775413**।`
    });
  }

  try {
    // Format messages for the Gemini API: role is "user" or "model" limit to last 15 messages for token control
    const slicedMessages = messages.slice(-15);
    const contents = slicedMessages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    // Construct a comprehensive and highly contextual system instruction
    const systemInstruction = `You are "MyCampus Assistant Bot" - a highly intelligent, premium, friendly student support chatbot virtual assistant. You represent the "MyCampus Student Portal"/MyCampus Hub.

BACKGROUND & DEVELOPER DETAILS:
- Developed and designed proudly by "HabaJaba Tech" (Based in West Bengal, India).
- CEO & Founder of HabaJaba Tech: Sayan Kumar Patra. Sayan is the primary developer of this beautiful portal.
- Contact / Support Line: Sayan Kumar Patra (Phone/WhatsApp: +91 8145775413).
- If the user asks for help, wants to report issues, correct database, or register complex requests, tell them Sayan is directly available on WhatsApp at +91 8145775413.

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

    const replyText = response.text || "আরেকবার জিজ্ঞেস করুন দয়া করে, আমি ডেটা প্রসেস করছি।";
    res.json({ reply: replyText });

  } catch (error: any) {
    console.error('[Chatbot API Error]:', error);
    // Respond cleanly instead of 500 so the user gets instructions and fallback options
    res.json({
      reply: `নমস্কার ${userContext?.name || 'শিক্ষার্থী'}! 👋 আমি দুঃখিত, জেমিনি এপিআই কানেকশনে একটি ত্রুটি দেখা দিয়েছে (${error?.message || 'API Error'})।

দয়া করে চেক করে নিন যে আপনার **Google AI Studio Secrets Settings** এ দেওয়া **GEMINI_API_KEY** টি ক্যাশ বা অ্যাক্টিভ আছে কিনা এবং কোটা শেষ হয়ে যায়নি তো?

যেকোনো সরাসরি প্রয়োজনে আপনি সরাসরি আমাদের ডেভেলপার **সায়ন কুমার পাত্র (Sayan Kumar Patra)** এর সাথে WhatsApp-এ কানেক্ট করতে পারেন: **+91 8145775413**।`
    });
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
