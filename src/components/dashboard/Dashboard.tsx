import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Fingerprint, 
  BookOpen, 
  Trophy, 
  BellRing, 
  CalendarDays, 
  Menu, 
  X, 
  LogOut,
  Bell,
  ChevronRight,
  Star,
  GraduationCap,
  Clock,
  MapPin,
  LogIn,
  LogOut as LogOutIcon,
  CreditCard,
  User as UserIcon,
  MessageCircle,
  Smartphone,
  Laptop,
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, AttendanceConfig } from '../../types';
import { getInitials } from '../../utils';
import { attendanceService } from '../../services/attendanceService';
import Home from './Home';
import Attendance from './Attendance';
import Notes from './Notes';
import Results from './Results';
import Notices from './Notices';
import Routine from './Routine';
import Faculty from './Faculty';
import Profile from './Profile';
import SupportChatbot from './SupportChatbot';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: (updatedUser: User) => void;
}

const parseTimeToMinutes = (timeStr: string): number | null => {
  const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3].toUpperCase();
  
  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
};

const isCurrentTimeInClass = (currentTime: Date, classTimeRange: string): boolean => {
  const parts = classTimeRange.split(/[-–]|to/i);
  if (parts.length < 2) return false;
  const startMin = parseTimeToMinutes(parts[0]);
  const endMin = parseTimeToMinutes(parts[1]);
  if (startMin === null || endMin === null) return false;
  
  const currentMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  
  if (startMin <= endMin) {
    return currentMin >= startMin && currentMin < endMin;
  } else {
    return currentMin >= startMin || currentMin < endMin;
  }
};

export type PageId = 'home' | 'attendance' | 'notes' | 'results' | 'notices' | 'routine' | 'faculty' | 'profile';

export default function Dashboard({ user, onLogout, onUserUpdate }: DashboardProps) {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attConfig, setAttConfig] = useState<AttendanceConfig>({ subjects: [], materials: [] });
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied'
  );
  const [showNotificationPopover, setShowNotificationPopover] = useState(false);
  const [showNotificationGuide, setShowNotificationGuide] = useState(false);
  const [guideTab, setGuideTab] = useState<'android' | 'ios' | 'pc'>('android');

  // Sync state permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    // Auto detect platform for instruction guide default
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setGuideTab('ios');
      } else if (/android/.test(ua)) {
        setGuideTab('android');
      } else {
        setGuideTab('pc');
      }
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('দুঃখিত, আপনার ডিভাইসে নোটিফিকেশন সাপোর্ট পাওয়া যায়নি।');
      return;
    }
    
    // If permission has already been denied, showing native prompt won't work. Open the helper guide directly!
    if (Notification.permission === 'denied') {
      setShowNotificationGuide(true);
      return;
    }
    
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        const title = 'MyCampus - নোটিফিকেশন সচল ✓';
        const body = 'এখন নতুন কোনো নোটিশ অ্যাড করা হলে তা সরাসরি আপনার মোবাইলের হোম স্ক্রীন অথবা লক স্ক্রীনে নোটিফিকেশন আকারে চলে আসবে! 🔔';
        
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200]
          } as any);
        } else {
          new Notification(title, {
            body,
            icon: '/icon.svg'
          });
        }
      }
    } catch (err) {
      console.error("Permission request error:", err);
    }
  };

  const triggerTestNotification = async () => {
    if (notificationPermission !== 'granted') {
      requestNotificationPermission();
      return;
    }
    
    const title = 'MyCampus - টেস্ট অ্যালার্ট 🧪';
    const body = 'অভিনন্দন! আপনার ডিভাইসে পুশ নোটিফিকেশন সিস্টেম চমৎকারভাবে কাজ করছে।';
    
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, {
          body,
          icon: '/icon.svg',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200]
        } as any);
      } catch (err) {
        new Notification(title, { body, icon: '/icon.svg' });
      }
    } else {
      new Notification(title, { body, icon: '/icon.svg' });
    }
  };

  // Real-time Standalone Administrative Device Notification triggers
  useEffect(() => {
    if (!attConfig.deviceNotification) return;
    
    const latestNotif = attConfig.deviceNotification;
    const lastNotifiedAlertId = localStorage.getItem('mycampus_last_notified_alert_id');
    
    if (lastNotifiedAlertId !== latestNotif.id) {
      localStorage.setItem('mycampus_last_notified_alert_id', latestNotif.id);
      
      // If was first load, skip triggering on start to prevent alert fatigue
      if (!lastNotifiedAlertId) {
        return;
      }
      
      const now = Date.now();
      const ageMs = now - (latestNotif.publishedAt || now);
      const isVeryRecent = ageMs < 15 * 60 * 1000; // 15 mins
      
      if (isVeryRecent && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const triggerAlert = async () => {
          const title = latestNotif.title;
          const body = latestNotif.body;
          
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.ready;
              reg.showNotification(title, {
                body,
                icon: '/icon.svg',
                badge: '/favicon.ico',
                vibrate: [200, 100, 200],
                tag: latestNotif.id,
                renotify: true
              } as any);
            } catch (err) {
              new Notification(title, { body, icon: '/icon.svg' });
            }
          } else {
            new Notification(title, { body, icon: '/icon.svg' });
          }
        };
        
        triggerAlert();
      }
    }
  }, [attConfig.deviceNotification]);

  // Real-time Push Notification Dispatcher for any newly added notices from firebase database config updates
  useEffect(() => {
    if (!attConfig.notices || attConfig.notices.length === 0) return;
    
    // Sort notices by publishedAt desc to get the mathematically latest one
    const sortedNotices = [...attConfig.notices].sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
    const latestNotice = sortedNotices[0];
    
    if (!latestNotice) return;
    
    const lastNotifiedId = localStorage.getItem('mycampus_last_notified_id');
    
    // If the latest notice ID is different from the one we already notified about
    if (lastNotifiedId !== latestNotice.id) {
      localStorage.setItem('mycampus_last_notified_id', latestNotice.id);
      
      // If lastNotifiedId didn't exist in local storage, it means the client just loaded the app.
      // We do not want to trigger a notification for an existing notice upon first page render.
      // We only notify if the app was already open and a NEW notice is added.
      if (!lastNotifiedId) {
        return;
      }
      
      // Guard against old notices triggering again by checking if the publication was within the last 15 minutes
      const now = Date.now();
      const ageMs = now - (latestNotice.publishedAt || now);
      const isVeryRecent = ageMs < 15 * 60 * 1000; // 15 minutes
      
      if (isVeryRecent && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const triggerPushStr = async () => {
          const title = `MyCampus - ${latestNotice.tag || 'নতুন নোটিশ'}`;
          const body = latestNotice.title;
          
          if ('serviceWorker' in navigator) {
            try {
              const reg = await navigator.serviceWorker.ready;
              reg.showNotification(title, {
                body,
                icon: '/icon.svg',
                badge: '/favicon.ico',
                vibrate: [200, 100, 200],
                tag: latestNotice.id,
                renotify: true
              } as any);
            } catch (err) {
              new Notification(title, { body, icon: '/icon.svg' });
            }
          } else {
            new Notification(title, { body, icon: '/icon.svg' });
          }
        };
        
        triggerPushStr();
      }
    }
  }, [attConfig.notices]);

  const triggerPageChange = (page: PageId) => {
    window.location.hash = page;
  };

  const handleCloseChatbot = () => {
    if (window.location.hash.includes('/support')) {
      window.location.hash = activePage;
    } else {
      setIsChatbotOpen(false);
    }
  };

  // Synchronize state with URL hash
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (!hash) {
        window.location.hash = 'home';
        return;
      }
      
      const cleanHash = hash.replace('#', '');
      const parts = cleanHash.split('/');
      const pagePart = parts[0] as PageId;
      
      const validPages: PageId[] = ['home', 'attendance', 'notes', 'results', 'notices', 'routine', 'faculty', 'profile'];
      if (validPages.includes(pagePart)) {
        setActivePage(pagePart);
      }
      
      if (cleanHash.includes('/support')) {
        setIsChatbotOpen(true);
      } else {
        setIsChatbotOpen(false);
      }
    };

    window.addEventListener('hashchange', handleHashCheck);
    handleHashCheck();

    return () => {
      window.removeEventListener('hashchange', handleHashCheck);
    };
  }, []);

  useEffect(() => {
    // Handle home screen context menu shortcuts
    const params = new URLSearchParams(window.location.search);
    const shortcut = params.get('shortcut');
    if (shortcut) {
      const pageId = shortcut.toLowerCase() as PageId;
      const validPages: PageId[] = ['home', 'attendance', 'notes', 'results', 'notices', 'routine', 'faculty', 'profile'];
      if (validPages.includes(pageId)) {
        window.location.hash = pageId;
        // Prune the query param to keep the url neat
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    const unsub = attendanceService.subscribeToGlobalConfig(setAttConfig);
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  interface NavPage {
    id: string;
    label: string;
    icon: React.ElementType;
    section: string;
    badge?: string;
    badgeColor?: string;
  }

  const pages: NavPage[] = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard, section: 'Main' },
    { id: 'attendance', label: 'Attendance', icon: Fingerprint, section: 'Main' },
    { 
      id: 'notes', 
      label: 'Study Notes', 
      icon: BookOpen, 
      section: 'Main', 
      badge: (attConfig.materials?.length || 0) > 0 ? attConfig.materials.length.toString() : undefined 
    },
    { id: 'results', label: 'Exam Results', icon: Trophy, section: 'Main' },
    { id: 'faculty', label: 'Faculty', icon: GraduationCap, section: 'Main' },
    { id: 'profile', label: 'My Profile', icon: UserIcon, section: 'Main' },
    { id: 'notices', label: 'Notices', icon: BellRing, section: 'Academic' },
    { id: 'routine', label: 'Routine', icon: CalendarDays, section: 'Academic' },
  ];

  const sections = ['Main', 'Academic'];

  const getActiveClass = () => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = daysOfWeek[currentTime.getDay()];
    const dayRoutine = (attConfig.routine || []).filter(r => r.day === currentDayName);
    const active = dayRoutine.find(r => isCurrentTimeInClass(currentTime, r.time));
    return active || null;
  };

  const activeClass = getActiveClass();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-[64px] bg-db shrink-0 flex items-center px-4 gap-4 shadow-lg z-30 lg:z-10 border-b border-wh/5">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden w-10 h-10 bg-wh/10 text-wh rounded-rs flex items-center justify-center shrink-0"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="min-w-0">
            <h1 className="font-rajdhani text-[20px] font-black leading-tight tracking-tight">
              <span className="text-wh">My</span>
              <span className="text-sf italic">Campus</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              <p className="text-[9px] text-wh/60 uppercase font-bold tracking-wider">Smart Student Portal</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">

            {/* Real-time Push Notification Indicator & Activator */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationPopover(!showNotificationPopover)}
                className={`w-9 h-9 border rounded-rs flex items-center justify-center relative hover:scale-[1.03] transition-all cursor-pointer ${
                  notificationPermission === 'granted' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                    : notificationPermission === 'denied'
                      ? 'bg-slate-500/10 text-slate-400 border-transparent hover:bg-slate-500/15'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 animate-pulse'
                }`}
                title={
                  notificationPermission === 'granted' 
                    ? "Notifications Active (Tap to test)" 
                    : "Enable Push Notifications"
                }
              >
                <Bell size={18} className={notificationPermission !== 'granted' && notificationPermission !== 'denied' ? 'animate-bounce' : ''} />
                
                {/* Visual indicator badges */}
                {notificationPermission === 'granted' ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full border border-db" />
                ) : notificationPermission === 'denied' ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-slate-500 rounded-full border border-db" />
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full border border-db animate-ping" />
                )}
              </button>

              <AnimatePresence>
                {showNotificationPopover && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotificationPopover(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-wh border border-bc rounded-rm shadow-2xl p-4 z-50 text-left cursor-default overflow-hidden"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-bc">
                        <span className="text-[11px] font-black uppercase text-db tracking-wider font-rajdhani">ডিভাইস অ্যালার্ট সিস্টেম</span>
                        <button 
                          onClick={() => setShowNotificationPopover(false)}
                          className="text-mt hover:text-dt transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="py-3.5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full shrink-0 ${
                            notificationPermission === 'granted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            <Bell size={16} className="stroke-[2.5]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[12px] font-extrabold text-slate-800 leading-tight">
                              {notificationPermission === 'granted' ? 'নোটিফিকেশন সচল আছে ✓' : 'সরাসরি মোবাইলে নোটিশ পাবেন! 🔔'}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                              {notificationPermission === 'granted'
                                ? 'নতুন কোনো নোটিশ বা ছুটির আপডেট প্রকাশ পেলে তা সরাসরি আপনার মোবাইলের হোম স্ক্রীন বা লক স্ক্রীমে চলে আসবে।'
                                : 'পোর্টালে জরুরি আপডেট বা নোটিশ প্রকাশের সাথে সাথে মোবাইলে পুশ নোটিফিকেশন পেতে দ্রুত এটি সচল করুন!'}
                            </p>
                          </div>
                        </div>

                        {notificationPermission === 'denied' && (
                          <div className="space-y-2">
                            <div className="p-2.5 bg-red-50 border border-red-100/70 rounded text-[9.5px] text-red-700 font-bold leading-relaxed">
                              ⚠️ আপনি নোটিফিকেশন ব্লক করেছেন। আপনার ব্রাউজার অথবা মোবাইল সেটিংস থেকে এই সাইটের জন্য নোটিফিকেশন পারমিশন "Allow" করুন।
                            </div>
                            <button
                              onClick={() => {
                                setShowNotificationGuide(true);
                                setShowNotificationPopover(false);
                              }}
                              className="w-full text-center text-db font-extrabold text-[10px] py-1 bg-db/5 hover:bg-db/10 border border-db/15 rounded transition-all cursor-pointer"
                            >
                              ⚙️ সেটিংস পরিবর্তন করার গাইড দেখুন
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-bc">
                        {notificationPermission === 'granted' ? (
                          <button
                            onClick={() => {
                              triggerTestNotification();
                              setShowNotificationPopover(false);
                            }}
                            className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold py-2 px-3 rounded shadow-ss transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                          >
                            🧪 টেস্ট অ্যালার্ট পাঠান
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              requestNotificationPermission();
                              setShowNotificationPopover(false);
                            }}
                            className="flex-1 text-center bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold py-2 px-3 rounded shadow-ss transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                          >
                            🔔 পারমিশন সচল করুন
                          </button>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => {
                window.location.hash = `${activePage}/support`;
              }}
             className="w-9 h-9 bg-green-500/10 text-green-400 border border-green-500/20 rounded-rs flex items-center justify-center relative hover:bg-green-500/20 transition-all cursor-pointer"
             title="Need Help? Open Support Chatbot"
           >
              <MessageCircle size={18} className="animate-pulse" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-400 rounded-full border border-db" />
           </button>
           <button onClick={onLogout} className="w-9 h-9 bg-wh/10 text-wh rounded-rs flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors">
              <LogOutIcon size={18} />
           </button>
        </div>
      </header>

      {/* Info Bar */}
      <div className="bg-db2 border-b border-wh/5 px-4 h-10 flex items-center justify-center shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 justify-center">
          <Clock size={12} className="text-sf animate-pulse" />
          <span className="text-[10px] font-black text-wh/95 tracking-wide whitespace-nowrap">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-wh/20 block" />
          <span className="text-[10px] text-wh/70 font-bold uppercase tracking-wider">
            {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          {activeClass ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-wh/20 block" />
              <span className="flex items-center gap-1.5 text-[9.5px] font-extrabold text-green-400 bg-green-950/40 border border-green-800/40 px-2 py-0.5 rounded-full whitespace-nowrap animate-pulse uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 block shrink-0" />
                <span>{activeClass.isBreak ? `Break: ${activeClass.subj}` : `${activeClass.subj} ${activeClass.room ? `[Rm ${activeClass.room}]` : ''}`}</span>
              </span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-wh/20 block" />
              <span className="flex items-center gap-1.5 text-[9.5px] font-bold text-wh/40 bg-wh/5 border border-wh/10 px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wider">
                <span className="w-1.2 h-1.2 rounded-full bg-wh/20 block shrink-0" />
                <span>No Classes Running</span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-[240px] bg-wh border-r border-bc shrink-0">
          <div 
            onClick={() => triggerPageChange('profile')}
            className="p-4 bg-gradient-to-br from-db to-db2 border-b border-bc shadow-sm cursor-pointer hover:from-db2 hover:to-db3 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-wh/40 bg-sf overflow-hidden flex items-center justify-center font-rajdhani text-lg font-bold text-db shrink-0 group-hover:scale-105 transition-transform">
                {user.photo ? <img src={user.photo} className="w-full h-full object-cover" /> : getInitials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-wh truncate">{user.name}</h2>
                <p className="text-[10px] text-wh/60 truncate">Roll: {user.roll}</p>
                <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 bg-sf rounded-full w-fit">
                   <Star size={8} className="text-db fill-db" />
                   <span className="text-[9px] font-bold text-db uppercase">{user.semester}</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-4 overflow-y-auto">
            {sections.map(sec => (
              <div key={sec} className="mb-4">
                <h3 className="px-4 text-[9px] font-extrabold text-lt uppercase tracking-widest mb-1.5">{sec} Menu</h3>
                {pages.filter(p => p.section === sec).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      triggerPageChange(p.id as PageId);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold transition-all border-l-3
                      ${activePage === p.id 
                        ? 'bg-db/10 border-db text-db font-bold' 
                        : 'border-transparent text-mt hover:bg-bg hover:text-db'}`}
                  >
                    <p.icon size={20} className={activePage === p.id ? 'text-db' : 'text-mt'} />
                    {p.label}
                    {p.badge && (
                      <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] text-wh font-bold ${p.badgeColor || 'bg-sf'}`}>
                        {p.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
            <div className="mt-4 border-t border-bc pt-4">
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-50 transition-all border-l-3 border-transparent"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </nav>
          
          <footer className="p-4 border-t border-bc bg-slate-950 text-slate-300 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-12 h-12 bg-sf/5 rounded-full filter blur-md" />
             <p className="text-[10px] font-black text-wh uppercase tracking-wider relative z-10 text-center">
               MyCampus Student Hub
             </p>
             <p className="text-[8px] text-slate-400 leading-relaxed italic mt-1 relative z-10 text-center">
               "Independent student-made platform, not officially affiliated with EIILM Kolkata."
             </p>
             <div className="mt-3 pt-2.5 border-t border-slate-900 flex flex-col gap-1 relative z-10">
               <div className="flex items-center justify-between">
                 <p className="text-[9px] text-slate-400 font-semibold">Developed by <span className="text-sf font-black">HabaJaba Tech</span></p>
               </div>
               <div className="flex items-center justify-between">
                 <p className="text-[8px] text-wh font-black uppercase tracking-wide">Sayan Kumar Patra</p>
                 <a 
                   href="https://wa.me/918145775413" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="text-[8px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 hover:underline"
                 >
                   <span>+91 81457 75413</span>
                 </a>
               </div>
             </div>
          </footer>
        </aside>

        {/* Sidebar - Mobile Drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-dt/60 backdrop-blur-sm z-40 lg:hidden"
              />
              <motion.aside 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-wh z-50 lg:hidden flex flex-col shadow-2xl"
              >
                <div 
                  onClick={() => {
                    triggerPageChange('profile');
                    setIsSidebarOpen(false);
                  }}
                  className="p-5 pt-8 bg-gradient-to-br from-db to-db2 relative cursor-pointer hover:from-db2 hover:to-db3 transition-all duration-300 group"
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSidebarOpen(false);
                    }}
                    className="absolute top-4 right-4 w-7 h-7 bg-wh/10 text-wh rounded-md flex items-center justify-center z-10"
                  >
                    <X size={18} />
                  </button>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-14 h-14 rounded-full border-2 border-wh/40 bg-sf overflow-hidden flex items-center justify-center font-rajdhani text-xl font-bold text-db shrink-0 group-hover:scale-105 transition-transform">
                      {user.photo ? <img src={user.photo} className="w-full h-full object-cover" /> : getInitials(user.name)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-wh">{user.name}</h2>
                      <p className="text-[11px] text-wh/60">Roll: {user.roll}</p>
                      <div className="mt-1 px-3 py-0.5 bg-sf rounded-full w-fit">
                         <span className="text-[10px] font-bold text-db uppercase">{user.semester}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <nav className="flex-1 py-4 overflow-y-auto">
                   {sections.map(sec => (
                    <div key={sec} className="mb-4">
                      <h3 className="px-5 text-[10px] font-extrabold text-lt uppercase tracking-widest mb-2">{sec} Menu</h3>
                      {pages.filter(p => p.section === sec).map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            triggerPageChange(p.id as PageId);
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold transition-all border-l-3
                            ${activePage === p.id 
                              ? 'bg-db/10 border-db text-db font-bold' 
                              : 'border-transparent text-mt hover:bg-bg hover:text-db'}`}
                        >
                          <p.icon size={20} className={activePage === p.id ? 'text-db' : 'text-mt'} />
                          {p.label}
                          {p.badge && (
                            <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] text-wh font-bold ${p.badgeColor || 'bg-sf'}`}>
                              {p.badge}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="mt-4 border-t border-bc pt-4">
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-5 py-3 text-[14px] font-bold text-red-600 hover:bg-red-50 border-l-3 border-transparent"
                    >
                      <LogOut size={20} />
                      Logout
                    </button>
                  </div>
                </nav>
                <footer className="p-5 border-t border-bc bg-slate-950 text-slate-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-sf/5 rounded-full filter blur-md" />
                  <p className="text-[10px] font-black text-wh uppercase tracking-wider relative z-10 text-center">
                    MyCampus Student Hub
                  </p>
                  <p className="text-[8px] text-slate-400 leading-relaxed italic mt-1 relative z-10 text-center">
                    "Independent student-made platform, not officially affiliated with EIILM Kolkata."
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-slate-900 flex flex-col gap-1 relative z-10">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] text-slate-400 font-semibold">Developed by <span className="text-sf font-black">HabaJaba Tech</span></p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] text-wh font-black uppercase tracking-wide">Sayan Kumar Patra</p>
                      <a 
                        href="https://wa.me/918145775413" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[8px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 hover:underline"
                      >
                        <span>+91 81457 75413</span>
                      </a>
                    </div>
                  </div>
                </footer>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-bg relative z-0">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-28 lg:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activePage === 'home' && <Home user={user} onNavigate={triggerPageChange} />}
                {activePage === 'attendance' && <Attendance user={user} />}
                {activePage === 'notes' && <Notes />}
                {activePage === 'results' && <Results />}
                {activePage === 'notices' && <Notices />}
                {activePage === 'routine' && <Routine />}
                {activePage === 'faculty' && <Faculty />}
                {activePage === 'profile' && <Profile user={user} onUserUpdate={onUserUpdate} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar - Premium Glassmorphic Capsule Layout */}
        {(() => {
          const mobileTabs = [
            { id: 'home', label: 'Home', icon: LayoutDashboard },
            { id: 'attendance', label: 'Class', icon: Fingerprint },
            { 
              id: 'notes', 
              label: 'Notes', 
              icon: BookOpen, 
              badge: (attConfig.materials?.length || 0) > 0 ? attConfig.materials.length.toString() : undefined 
            },
            { 
              id: 'notices', 
              label: 'Notices', 
              icon: BellRing, 
              badge: (attConfig.notices?.length || 0) > 0 ? attConfig.notices.length.toString() : undefined 
            },
            { id: 'profile', label: 'Profile', icon: UserIcon }
          ];

          return (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-wh/90 backdrop-blur-xl border-t border-bc px-3.5 pt-2 pb-safe-bottom shadow-[0_-8px_32px_rgba(0,0,0,0.06)] flex items-center justify-around h-[66px] z-30 rounded-t-[22px]">
              {mobileTabs.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => triggerPageChange(item.id as PageId)}
                    className="flex flex-col items-center justify-center flex-1 h-full py-1 relative active:scale-[0.96] group focus:outline-none z-10 select-none cursor-pointer"
                  >
                    {/* Glassmorphic Capsule Active Highlighting Layer */}
                    {isActive && (
                      <motion.div
                        layoutId="glassyActiveBubble"
                        className="absolute inset-x-1.5 inset-y-1 bg-db/[0.08] backdrop-blur-md border border-db/15 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.7),0_3px_12px_rgba(93,14,49,0.06)] rounded-[16px] z-0"
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      />
                    )}

                    {/* Tab Elements - Icon and Label Layer */}
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <div className="relative">
                        <item.icon 
                          size={19} 
                          className={`transition-all duration-300 ${isActive ? 'text-db scale-105' : 'text-mt/60 group-hover:text-db/80'}`} 
                        />
                        
                        {item.badge && (
                          <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] bg-red-500 text-wh font-black text-[7.5px] flex items-center justify-center px-1 rounded-full border border-wh shadow-sm">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <span 
                        className={`text-[8.5px] font-black tracking-wide mt-1.5 transition-all uppercase leading-none ${
                          isActive 
                            ? 'text-db font-black scale-105' 
                            : 'text-mt/55 group-hover:text-db/75'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>
      
      {/* Support Chatbot Modal Panel */}
      <SupportChatbot isOpen={isChatbotOpen} onClose={handleCloseChatbot} user={user} />

      {/* Premium Multi-Platform Notification Settings Guide Modal */}
      <AnimatePresence>
        {showNotificationGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationGuide(false)}
              className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[24px] shadow-2xl p-5 overflow-hidden z-20 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-bc shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-full bg-db/10 text-db">
                    <ShieldAlert size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">ডিভাইস সেটিংস গাইড</h3>
                    <p className="text-[10px] text-slate-500 font-bold">পুশ নোটিফিকেশন সচল করার নিয়ম</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationGuide(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Informative Header Banner */}
              <div className="mt-3 p-3 bg-amber-500/[0.06] border border-amber-500/15 rounded-xl flex gap-2.5 shrink-0">
                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-amber-950 font-bold leading-relaxed">
                  নিরাপত্তার কারণে কোনো ওয়েবসাইট বা ব্রাউজার আপনার ফোনের প্রধান সেটিংস অ্যাপ সরাসরি ওপেন করতে পারে না। তবে নিচে দেওয়া খুব সহজ স্টেপগুলো অনুসরণ করে আপনি কয়েক সেকেন্ডের মধ্যেই পারমিশন সচল করে নিতে পারবেন।
                </p>
              </div>

              {/* Device Tabs Selector */}
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl mt-4 shrink-0">
                <button
                  onClick={() => setGuideTab('android')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    guideTab === 'android' ? 'bg-white text-db shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Smartphone size={13} />
                  Android
                </button>
                <button
                  onClick={() => setGuideTab('ios')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    guideTab === 'ios' ? 'bg-white text-db shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Smartphone size={13} />
                  iOS / iPad
                </button>
                <button
                  onClick={() => setGuideTab('pc')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    guideTab === 'pc' ? 'bg-white text-db shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Laptop size={13} />
                  PC / Desktop
                </button>
              </div>

              {/* Steps Scrollable Container */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 font-sans max-h-[50vh] pr-1 mt-2">
                {guideTab === 'android' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">১</div>
                      <div>
                        <h4 className="text-[12px] font-extrabold text-slate-800">ব্রাউজারের লক আইকন ট্যাপ করুন</h4>
                        <p className="text-[10.5px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                          উপরে যেখানে ব্রাউজারের অ্যাড্রেস বার বা ওয়েবসাইটের নাম (যেমন- mycampus.com) লেখা রয়েছে, তার ঠিক বাম পাশে থাকা <strong className="text-slate-800">🔒 তালা আইকন (Lock Icon)</strong> টি স্পর্শ বা ট্যাপ করুন।
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">২</div>
                      <div>
                        <h4 className="text-[12px] font-extrabold text-slate-800">সাইট পারমিশন বা সেটিংস-এ যান</h4>
                        <p className="text-[10.5px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                          পপআপ মেনু থেকে <strong className="text-slate-800">"Permissions" (পারমিশন)</strong> অথবা <strong className="text-slate-800">"Site Settings" (সাইট সেটিংস)</strong> অপশনটিতে প্রবেশ করুন।
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">৩</div>
                      <div>
                        <h4 className="text-[12px] font-extrabold text-slate-800">নোটিফিকেশন Allow বা সচল করুন</h4>
                        <p className="text-[10.5px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                          সেখানে <strong className="text-slate-800">"Notifications" (নোটিফিকেশন)</strong> খুঁজে বের করে তার সুইচটি সচল করুন অথবা <strong className="text-slate-800">"Allow" / "অনুমতি দিন"</strong> সিলেক্ট করুন। তারপর পেজটি একবার রিফ্রেশ করুন!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {guideTab === 'ios' && (
                  <div className="space-y-3">
                    <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-900 font-bold leading-relaxed mb-1 flex gap-2">
                      <span className="text-blue-500 font-black">ℹ️</span>
                      আইফোনে পুশ নোটিফিকেশন পেতে সাইটটিকে আপনার হোম স্ক্রীনে যোগ করতে হবে।
                    </div>
                    
                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">১</div>
                      <div>
                        <h4 className="text-[12px] font-extrabold text-slate-800">Safari ব্রাউজারের 'শেয়ার' বাটনে ক্লিক করুন</h4>
                        <p className="text-[10.5px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                          সাফারি ব্রাউজারের নিচের দিকে থাকা <strong className="text-slate-800">Share Button 📤 (শেয়ার বাটন)</strong>-এ আলতো চাপ দিন।
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">২</div>
                      <div>
                        <h4 className="text-[12px] font-extrabold text-slate-800">"Add to Home Screen" সিলেক্ট করুন</h4>
                        <p className="text-[10.5px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                          শেয়ার সিট স্ক্রল করে নিচে যান এবং <strong className="text-slate-800">"Add to Home Screen" (হোম স্ক্রীনে যোগ করুন)</strong> অপশনটিতে ক্লিক করুন ও উপরে 'Add' দিন।
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">৩</div>
                      <div>
                        <h4 className="text-[12px] font-extrabold text-slate-800">হোম স্ক্রীন অ্যাপ থেকে পারমিশন দিন</h4>
                        <p className="text-[10.5px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                          এখন ব্রাউজার বন্ধ করে আপনার আইফোনের হোম স্ক্রীনে তৈরি হওয়া নতুন <strong className="text-slate-800">MyCampus অ্যাপটি</strong> ওপেন করুন এবং অ্যালার্ট সিস্টেমের মাধ্যমে সহজেই পুশ নোটিফিকেশন সচল করে নিন।
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {guideTab === 'pc' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">১</div>
                      <div>
                        <h4 className="text-[12px] font-extrabold text-slate-800">URL-এর তালা আইকনে (🔒) ক্লিক করুন</h4>
                        <p className="text-[10.5px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                          পিসির ব্রাউজারের উপরে এড্রেস বারের বাম পাশে থাকা <strong className="text-slate-800">তালা আইকন (🔒 Lock icon)</strong> বা সেটিংস ব্যাজ অপশনে ক্লিক করুন।
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">২</div>
                      <div>
                        <h4 className="text-[12px] font-extrabold text-slate-800">Notifications অপশনটি 'Allow' করুন</h4>
                        <p className="text-[10.5px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                          সেখানে <strong className="text-slate-800">"Notifications"</strong> অপশনটির পাশে থাকা ড্রপডাউন বা সিলেক্ট বক্স থেকে <strong className="text-slate-800">"Allow" (অনুমতি দিন)</strong> অপশন সিলেক্ট করুন।
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">৩</div>
                      <div>
                        <h4 className="text-[12px] font-extrabold text-slate-800">পেজ রিফ্রেশ করুন</h4>
                        <p className="text-[10.5px] text-slate-500 font-bold mt-0.5 leading-relaxed">
                          ব্রাউজারের রিফ্রেশ বাটন (Reload 🔄) অথবা কিবোর্ড থেকে <strong className="text-slate-800">F5 / Ctrl+R</strong> চেপে পেজটি রিলোড দিলেই নোটিফিকেশন পারমিশন সচল হয়ে যাবে!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Close / Ok Action Button */}
              <div className="pt-3 border-t border-bc mt-auto shrink-0 flex justify-end">
                <button
                  onClick={() => setShowNotificationGuide(false)}
                  className="bg-db hover:bg-db/90 text-white text-[11px] font-extrabold py-2 px-6 rounded-lg transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
                >
                  বুঝেছি, ধন্যবাদ!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
