import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageCircle, HelpCircle, ArrowUpRight, PhoneCall, Check, Sparkles } from 'lucide-react';
import { User } from '../../types';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default support WhatsApp link
  const supportPhone = '918145775413'; // Sayan Kumar Patra / HabaJaba Tech Support
  const getWhatsAppLink = (customText?: string) => {
    const defaultText = `Hi Sayan, I'm using the MyCampus Hub (ID: ${user.roll || 'Student'}) and need assistance with the portal.`;
    const text = encodeURIComponent(customText || defaultText);
    return `https://wa.me/${supportPhone}?text=${text}`;
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setMessages([
          {
            sender: 'bot',
            text: `Hi ${user.name}! 👋 Welcome to the MyCampus Help Desk, developed by Sayan Kumar Patra & the HabaJaba Tech team.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            sender: 'bot',
            text: `আমি এখানে যেকোনো সমস্যায় সাহায্য করতে প্রস্তুত। সিলেক্ট করো তোমার প্রশ্ন বা সমস্যা:`,
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

  const handleFAQClick = (question: string, answer: string, waText: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user's question message
    setMessages(prev => [...prev, { sender: 'user', text: question, time: timeStr }]);
    
    setIsTyping(true);
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCustom: true
      }]);
      setIsTyping(false);
    }, 600);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setMessages(prev => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `Got your message! For immediate and personalized resolution regarding "${userText}", Sayan matches directly with you on WhatsApp. Let's open a direct chat token for quick help!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
      
      // Prompt direct WhatsApp redirect after a small delay
      setTimeout(() => {
        window.open(getWhatsAppLink(`Hi Sayan, I need help with "${userText}" on MyCampus Student Hub.`), '_blank');
      }, 1000);
    }, 800);
  };

  const FAQS = [
    {
      q: '📅 Class Routine Problem',
      a: 'রুটিন সংক্রান্ত সমস্যা: MyCampus-এ তোমাদের ক্লাস শিডিউল সরাসরি একাডেমিক ডাটাবেজ থেকে আপডেট হয়। কোনো ক্লাস টাইম পরিবর্তন করতে হলে বা ভুল ডাটা দেখালে নিচে হোয়াটস্যাপ বোতামে ক্লিক করে ডেভেলপার সায়নকে মেসেজ পাঠাও। উনি ডাটাবেজ ঠিক করে দেবেন।',
      wa: 'Hi Sayan, our class routine has inaccurate lecture timings. Could you please check the database configuration?'
    },
    {
      q: '📝 Attendance Records Help',
      a: 'অ্যাটেনডেন্স সংক্রান্ত সমস্যা: তুমি প্রতিদিনের প্রেজেন্ট/অ্যাবসেন্ট সরাসরি ড্যাশবোর্ড থেকে রেজিস্টার করতে পারবে। যদি রিকনসিল করতে কোনো ক্লাস বাদ পড়ে যায় বা ভুল হয়ে থাকে, তবে আমাদের হোয়াটস্যাপ এডমিন সাপোর্টে যোগাযোগ করো।',
      wa: 'Hi Sayan, I need assistance correcting my attendance history. Some of my marked classes are not reflecting properly.'
    },
    {
      q: '🛡️ Login & Student Registration',
      a: 'অ্যাক্সেস সমস্যা: কোনো ক্লাসের বন্ধু যদি লগইন করতে বা সাইন-আপ করতে সমস্যা ফেস করে, তবে এডমিন প্যানেল থেকে পেন্ডিং রিকুয়েস্ট অ্যাপ্রুভ করতে হবে।',
      wa: 'Hi Sayan, one of my classmates is having issues registering/logging in to MyCampus. Could you help review.'
    },
    {
      q: '✨ Add New Feature Idea',
      a: 'নতুন আইডিয়া বা ফিচার রিকুয়েস্ট: MyCampus-এ কোনো সুন্দর নতুন ফিচার ডিজাইন করাতে চাইলে সরাসরি হাবা-জাবা টেক টিমের সাথে শেয়ার করো! আমরা দারুণ দারুণ ফিচার বানাতে সক্ষম।',
      wa: 'Hi Sayan, I have a cool new feature idea or UX design enhancement for MyCampus Hub!'
    }
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
                    <p className="text-[10px] text-green-400 font-extrabold tracking-widest uppercase">HabaJaba Chatbot</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-wh/10 text-wh hover:bg-wh/20 flex items-center justify-center transition-all cursor-pointer"
                id="close-chatbot-btn"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messaging Body */}
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
                    
                    {/* Extra context actions for Bot replies if custom trigger occurs */}
                    {m.isCustom && (
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
                    <span className="text-sf">MyCampus Bot is typing</span>
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
                        onClick={() => handleFAQClick(faq.q, faq.a, faq.wa)}
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
