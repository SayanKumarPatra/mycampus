import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import webpush from 'web-push';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, onValue } from 'firebase/database';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser middleware
app.use(express.json());

// Initialize Firebase App for Server-Side sync & Web Push
const firebaseConfig = {
  apiKey: "AIzaSyAtsrglY37vRNbZN7BfZj8bwiH68DoelZs",
  authDomain: "database-529ec.firebaseapp.com",
  databaseURL: "https://database-529ec-default-rtdb.firebaseio.com/",
  projectId: "database-529ec",
  storageBucket: "database-529ec.firebasestorage.app",
  messagingSenderId: "59037304674",
  appId: "1:59037304674:web:b75bd1bfa92d9de8a84e3b"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

// Load consistent VAPID keys to prevent invalidation on restart
let vapidKeys = {
  publicKey: '',
  privateKey: ''
};

async function initVapidKeys() {
  try {
    const configRef = ref(db, 'configs/vapidKeys');
    const snapshot = await get(configRef);
    if (snapshot.exists()) {
      vapidKeys = snapshot.val();
    } else {
      const keys = webpush.generateVAPIDKeys();
      await set(configRef, keys);
      vapidKeys = keys;
    }
    webpush.setVapidDetails(
      'mailto:sayankumarpatra2006@gmail.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
    console.log("[MyCampus WebPush] Loaded consistent VAPID keys!");
  } catch (error) {
    console.error("[MyCampus WebPush] Error initializing keys, fallback auto-gen:", error);
    const keys = webpush.generateVAPIDKeys();
    vapidKeys = keys;
    webpush.setVapidDetails(
      'mailto:sayankumarpatra2006@gmail.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }
}

// Subscribe user endpoint
app.get('/api/notification/vapid-public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post('/api/notification/subscribe', async (req, res) => {
  const { subscription, userId } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Subscription data is invalid.' });
  }

  try {
    const endpointHash = Buffer.from(subscription.endpoint).toString('base64').replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
    const subRef = ref(db, `configs/subscriptions/${endpointHash}`);
    await set(subRef, {
      subscription,
      userId: userId || 'anonymous',
      updatedAt: Date.now()
    });
    res.json({ success: true });
  } catch (error) {
    console.error("[MyCampus WebPush] Save subscription error:", error);
    res.status(500).json({ error: 'Failed to register subscription.' });
  }
});

// Trigger and broadcast notification directly from application actions
app.post('/api/notification/send', async (req, res) => {
  const { title, body, url } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required for broadcasting.' });
  }

  try {
    console.log(`[MyCampus WebPush API] Active push broadcast request received. Title: "${title}"`);
    await broadcastNotification({
      title,
      body,
      url: url || '#home'
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("[MyCampus WebPush API] Active broadcast failed:", error);
    res.status(500).json({ error: error.message || 'Active broadcast fail' });
  }
});

// Broadcast Web Push to all registered browser notification endpoints
async function broadcastNotification(payload: { title: string, body: string, url: string }) {
  try {
    const subsRef = ref(db, 'configs/subscriptions');
    const snapshot = await get(subsRef);
    if (!snapshot.exists()) {
      console.log("[MyCampus WebPush] No active subscriptions found for broadcast.");
      return;
    }
    const subscriptions = snapshot.val();
    const keys = Object.keys(subscriptions);
    console.log(`[MyCampus WebPush] Attempting to dispatch broadcast to ${keys.length} subscribers...`);

    const promises = keys.map(async (key) => {
      const subInfo = subscriptions[key];
      const pushSubscription = subInfo.subscription;
      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );
      } catch (err: any) {
        console.warn(`[MyCampus WebPush] Send failed for subscriber ${key}. Status:`, err.statusCode);
        // If subscription has expired or unsubscribed, remove from DB to keep it clean!
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[MyCampus WebPush] Expired endpoint detected. Removing subscription ${key}.`);
          const dRef = ref(db, `configs/subscriptions/${key}`);
          await set(dRef, null);
        }
      }
    });

    await Promise.all(promises);
    console.log("[MyCampus WebPush] Broadcast completed successfully!");
  } catch (error) {
    console.error("[MyCampus WebPush] Broadcast failure:", error);
  }
}

// Listen to Realtime DB updates to automatically trigger Web Push broadcast
let lastRegisteredNoticeId: string | null = null;
let lastRegisteredAlertId: string | null = null;

function setupDbListeners() {
  const configRef = ref(db, 'configs/attendance');
  onValue(configRef, async (snapshot) => {
    if (!snapshot.exists()) return;
    const config = snapshot.val();

    // Check notices updates
    if (config.notices && Array.isArray(config.notices) && config.notices.length > 0) {
      const sorted = [...config.notices].sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
      const latestNotice = sorted[0];
      if (latestNotice && latestNotice.id) {
        if (lastRegisteredNoticeId === null) {
          // Store first state on server startup without sending old ones
          lastRegisteredNoticeId = latestNotice.id;
        } else if (lastRegisteredNoticeId !== latestNotice.id) {
          lastRegisteredNoticeId = latestNotice.id;
          const now = Date.now();
          const ageMs = now - (latestNotice.publishedAt || now);
          // Only send if it was published in the last 15 minutes to avoid obsolete spam
          if (ageMs < 15 * 60 * 1000) {
            console.log(`[MyCampus WebPush] New Notice: "${latestNotice.title}". Broadcasting!`);
            await broadcastNotification({
              title: `MyCampus - ${latestNotice.tag || 'নতুন নোটিশ publicado'} 🔔`,
              body: latestNotice.title,
              url: '#notices'
            });
          }
        }
      }
    }

    // Check special administrative alerts
    if (config.deviceNotification && config.deviceNotification.id) {
      const latestAlert = config.deviceNotification;
      if (lastRegisteredAlertId === null) {
        lastRegisteredAlertId = latestAlert.id;
      } else if (lastRegisteredAlertId !== latestAlert.id) {
        lastRegisteredAlertId = latestAlert.id;
        const now = Date.now();
        const ageMs = now - (latestAlert.publishedAt || now);
        if (ageMs < 15 * 60 * 1000) {
          console.log(`[MyCampus WebPush] Administrative Alert: "${latestAlert.title}". Broadcasting!`);
          await broadcastNotification({
            title: latestAlert.title,
            body: latestAlert.body,
            url: '#home'
          });
        }
      }
    }
  }, (err) => {
    console.error("[MyCampus WebPush] Realtime DB listener error:", err);
  });
}

// Initialize WebPush Engine on startup
initVapidKeys().then(() => {
  setupDbListeners();
});

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

  // Check if Gemini Client is initialized successfully (env key first, then DB master key)
  let ai = getGeminiClient();
  const dbApiKey = portalConfig?.geminiApiKey;
  if (!ai && dbApiKey && dbApiKey.trim() !== '') {
    try {
      ai = new GoogleGenAI({
        apiKey: dbApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (err) {
      console.error("[MyCampus Server] Dynamic DB Key Init Error:", err);
    }
  }

  if (!ai) {
    return res.json({
      reply: `নমস্কার ${userContext?.name || 'শিক্ষার্থী'}! 👋 আমি MyCampus AI অ্যাসিস্ট্যান্ট। 

বর্তমানে এই অ্যাপ্লিকেশনে কোনো সচল Google Gemini API Key কনফিগার করা নেই। 

**চ্যাটবটটি সচল করার উপায়:**
১. আপনি যদি এডমিন হন, ওপরে ডানদিকের **Admin Panel > Chatbot (AI)** ট্যাবে গিয়ে আপনার ওয়ান-টাইম **Google Gemini API Key** সেট করুন। এর ফলে সমস্ত শিক্ষার্থীদের জন্য এটি স্বয়ংক্রিয়ভাবে চালু হয়ে যাবে!
২. অথবা, আপনি আমাদের প্রধান ডেভেলপার **সায়ন কুমার পাত্র (Sayan Kumar Patra)** এর সাথে WhatsApp-এ সরাসরি যোগাযোগ করতে পারেন: **+91 8145775413**।`
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
