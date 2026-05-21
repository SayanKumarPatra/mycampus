import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageCircle, HelpCircle, ArrowUpRight, PhoneCall, Sparkles } from 'lucide-react';
import { User, AttendanceConfig } from '../../types';
import { attendanceService } from '../../services/attendanceService';

interface SupportChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

interface Message {
  sender: 'bot' | 'user';
  text: string;
  time: string;
  isCustom?: boolean;
}

export default function SupportChatbot({ isOpen, onClose, user }: SupportChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [config, setConfig] = useState<AttendanceConfig | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default support WhatsApp link
  const supportPhone = '918145775413'; // Sayan Kumar Patra / HabaJaba Tech Support
  const getWhatsAppLink = (customText?: string) => {
    const defaultText = `Hi Sayan, I'm using the MyCampus Hub (ID: ${user.roll || 'Student'}) and need assistance with the portal.`;
    const text = encodeURIComponent(customText || defaultText);
    return `https://wa.me/${supportPhone}?text=${text}`;
  };

  // Subscribing to the live portal configs to keep data accurate
  useEffect(() => {
    const unsub = attendanceService.subscribeToGlobalConfig((data) => {
      setConfig(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setMessages([
          {
            sender: 'bot',
            text: `Hi ${user.name}! 👋 Welcome to the MyCampus Help Desk, powered by Gemini AI and Sayan Kumar Patra's HabaJaba Tech team!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            sender: 'bot',
            text: `আমি এখানে রুটিন, ফ্যাকাল্টি, নোটিশ বোর্ড এবং যেকোনো বিষয়ে সাহায্য করতে প্রস্তুত। সিলেক্ট করো তোমার জন্য প্রস্তুত কোনো প্রশ্ন অথবা টাইপ করো:`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setIsTyping(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen, user.name, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Direct client-side API call to Gemini (no backend required)
  const executeClientDirectQuery = async (updatedMessages: Message[], apiKeyToUse: string): Promise<boolean> => {
    try {
      // 1. Map messages to standard API structures
      const slicedMessages = updatedMessages.slice(-15);
      const contents = slicedMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // 2. Build contextual system instruction matching server.ts exactly
      const systemInstructionText = `You are "MyCampus Assistant Bot" - a highly intelligent, premium, friendly student support chatbot virtual assistant. You represent the "MyCampus Student Portal"/MyCampus Hub.

BACKGROUND & DEVELOPER DETAILS:
- Developed and designed proudly by "HabaJaba Tech" (Based in West Bengal, India).
- CEO & Founder of HabaJaba Tech: Sayan Kumar Patra. Sayan is the primary developer of this beautiful portal.
- Contact / Support Line: Sayan Kumar Patra (Phone/WhatsApp: +91 8145775413).
- If the user asks for help, wants to report issues, correct database, or register complex requests, tell them Sayan is directly available on WhatsApp at +91 8145775413.

CURRENT STUDENT CONTEXT:
- Name: ${user.name || 'Student'}
- Roll Number: ${user.roll || 'Unknown'}
- Email: ${user.email || 'Unknown'}
- Status: Active Student Portal Session.

PORTAL DYNAMIC CONTENT (LIVE DATA FROM DATABASE):
1. Class Routine Scheduler:
${JSON.stringify(config?.routine || [], null, 2)}

2. Faculty Members Directory:
${JSON.stringify(config?.faculties || [], null, 2)}

3. Latest Portal Notices / Announcements:
${JSON.stringify(config?.notices || [], null, 2)}

4. Dynamic Student Exam Results:
${JSON.stringify(config?.results || [], null, 2)}

5. List of Core Academic Subjects:
Data Structure using C (DSC-2), Business Communication (MIN-2), Financial Institution & Services (MDC-2), Introduction to Database (SEC-2), Understanding India-II (VAC-2), English (AEC-2), Advance Excel (AE-1), Mathematics (MATH-1), Web Technology (WT-1), Mentor Session (MENT-1).

PWA MAIN INSTALLATION GUIDELINE:
- This is a progressive web app (PWA) compiled to fit both mobile and desktop perfectly.
- To Download/Install: Click the yellow Google Play button next to Chat icon.

COMMUNICATION & LANGUAGE RULES:
- If the user asks in Bengali (Bangla) or Banglish, answer them beautifully, politely, and warmly in Bengali/Banglish. If query is in English, reply in crisp English.
- Be helpful, cheerful, and proud of MyCampus Hub, Sayan Kumar Patra, and HabaJaba Tech!`;

      // 3. Request Google's Gemini REST API directly
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyToUse}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          systemInstruction: {
            parts: [{ text: systemInstructionText }]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Direct API response error status: ${response.status}`);
      }

      const resJson = await response.json();
      const replyText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

      if (replyText) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isCustom: true
        }]);
        return true;
      }
    } catch (err) {
      console.error('[PWA Direct Gemini Query Catch]:', err);
    }
    return false;
  };

  const queryChatbotAPI = async (updatedMessages: Message[]) => {
    setIsTyping(true);

    // Dynamic keys priority: 1. Master Key set by Admin in DB, 2. Environmental key
    const adminMasterKey = config?.geminiApiKey || '';
    const clientKey = adminMasterKey || ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || '';

    try {
      // 1. Attempt Server route query
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages,
          userContext: {
            name: user.name,
            roll: user.roll,
            email: user.email,
          },
          portalConfig: config,
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isCustom: true
        }]);
        setIsTyping(false);
        return;
      } else {
        throw new Error('Server returned error status, fallback needed');
      }
    } catch (err) {
      console.warn('[Server Chatbot is offline / static environment. Swapping to local client direct fallback engine]');
      
      // 2. If server API failed (e.g. they copied code to purely static web hosting like GitHub, Netlify or static Vercel), execute direct client path
      if (clientKey) {
        const directSuccess = await executeClientDirectQuery(updatedMessages, clientKey);
        if (directSuccess) {
          setIsTyping(false);
          return;
        }
      }

      // 3. Ultimate Fallback: Direct instructions for Admin to inject master key
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `নমস্কার ${user.name}! 👋 

বর্তমানে এই অ্যাপ্লিকেশনটিতে কোনো সচল Google Gemini API Key কনফিগার করা নেই। 

**চ্যাটবটটি সচল করার সহজ উপায়:**
১. আপনি যদি এডমিন হন, ওপরে ডানদিকের **Admin Panel > Chatbot (AI)** ট্যাবে গিয়ে আপনার ওয়ান-টাইম **Google Gemini API Key** সেট করুন। এর ফলে সমস্ত শিক্ষার্থীদের জন্য এটি স্বয়ংক্রিয়ভাবে চালু হয়ে যাবে!
২. অথবা, যেকোনো সহায়তার জন্য সরাসরি আমাদের প্রধান ডেভেলপার **সায়ন কুমার পাত্র (Sayan Kumar Patra)** এর সাথে WhatsApp-এ যোগাযোগ করতে পারেন: **+91 8145775413**।`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCustom: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFAQClick = (question: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = [...messages, { sender: 'user' as const, text: question, time: timeStr }];
    setMessages(updated);
    queryChatbotAPI(updated);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = [...messages, { sender: 'user' as const, text: userText, time: timeStr }];
    
    setMessages(updated);
    setInputValue('');
    queryChatbotAPI(updated);
  };

  const FAQS = [
    { q: '📅 Today\'s Class Routine / আজকের ক্লাস রুটিন' },
    { q: '📝 My Attendance Status / আমার অ্যাটেনডেন্স রেকর্ড' },
    { q: '🛡️ Contact Developer Sayan Patra / সায়নের সাথে যোগাযোগ' },
    { q: '✨ How to Download MyCampus App / অ্যাপ ডাউনলোড করার উপায়' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-db/80 backdrop-blur-sm z-50"
            id="chatbot-backdrop"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="fixed inset-x-4 bottom-4 top-16 md:bottom-12 md:top-auto md:right-12 md:left-auto md:w-[420px] max-h-[640px] h-[calc(100vh-100px)] bg-wh border border-bc rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 font-nunito"
            id="chatbot-container"
          >
            {/* Header */}
            <div className="p-4 bg-db border-b border-wh/5 flex items-center justify-between shadow-ss shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center relative">
                  <MessageCircle size={22} className="text-green-400" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-db animate-pulse" />
                </div>
                <div>
                  <h3 className="font-rajdhani text-[16px] font-black text-wh tracking-wider uppercase leading-tight">MyCampus Support</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <p className="text-[10px] text-green-400 font-extrabold tracking-widest uppercase">
                      {config?.geminiApiKey ? 'AI Core Active' : 'HabaJaba Chatbot'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-wh/10 text-wh hover:bg-wh/20 flex items-center justify-center transition-all cursor-pointer"
                  id="close-chatbot-btn"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messaging interface */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-bg/50 no-scrollbar">
              {messages.map((m, idx) => (
                <div 
                  key={idx}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-lt">
                    {m.sender === 'bot' && <span className="text-sf">MyCampus Bot</span>}
                    <span>{m.time}</span>
                  </div>
                  <div 
                    className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed font-semibold shadow-ss
                      ${m.sender === 'user' 
                        ? 'bg-db text-wh rounded-tr-none' 
                        : 'bg-wh border border-bc text-dt rounded-tl-none'
                      }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    
                    {/* Extra context actions for Bot replies */}
                    {m.isCustom && (m.text.includes('+91 8145775413') || m.text.includes('Sayan') || m.text.includes('WhatsApp')) && (
                      <div className="mt-3.5 pt-3 border-t border-dashed border-bc/60">
                        <a 
                          href={getWhatsAppLink()}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 p-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-black uppercase tracking-wider"
                        >
                          <PhoneCall size={14} />
                          Contact Sayan on WhatsApp
                          <ArrowUpRight size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-lt">
                    <span className="text-sf">MyCampus Bot is thinking</span>
                  </div>
                  <div className="bg-wh border border-bc rounded-2xl rounded-tl-none p-3.5 flex items-center gap-1 shadow-ss">
                    <span className="w-2 h-2 bg-lt rounded-full animate-bounce shrink-0" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-lt rounded-full animate-bounce shrink-0" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-lt rounded-full animate-bounce shrink-0" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Quick FAQ Suggestion Chips always visible near bottom to support the user */}
              {messages.length > 0 && !isTyping && (
                <div className="pt-4 border-t border-bc">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Sparkles size={12} className="text-sf" />
                    <p className="text-[10px] font-black text-mt uppercase tracking-widest">Select Question to auto-resolve:</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {FAQS.map((faq, i) => (
                      <button
                        key={i}
                        onClick={() => handleFAQClick(faq.q)}
                        className="w-full text-left p-3 bg-wh border border-bc hover:border-green-400 hover:bg-green-50/20 rounded-xl transition-all flex items-center justify-between text-xs font-bold text-dt group"
                      >
                        <span className="truncate pr-2">{faq.q}</span>
                        <ArrowUpRight size={14} className="text-lt group-hover:text-green-500 transition-colors shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Dedicated WhatsApp Hot-link Banner */}
            <div className="px-4 py-3 bg-green-500/5 border-t border-green-500/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-green-600 shrink-0" />
                <span className="text-[10px] font-bold text-green-800 uppercase tracking-widest">Direct WhatsApp Bridge</span>
              </div>
              <a 
                href={getWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-black text-green-700 hover:text-green-800 hover:underline transition-all"
              >
                Open Chat
                <ArrowUpRight size={12} />
              </a>
            </div>

            {/* Chat Input form */}
            <form onSubmit={handleSendMessage} className="p-3.5 bg-wh border-t border-bc flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Ask our support anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-4 py-2 bg-bg border border-bc rounded-xl text-sm font-semibold outline-none focus:border-green-400 focus:ring-3 focus:ring-green-500/10 transition-all text-dt"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 rounded-xl bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                id="send-chatbot-msg"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

