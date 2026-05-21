import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Notebook, 
  Award, 
  Megaphone, 
  Calendar, 
  Menu, 
  X, 
  LogOut,
  Bell,
  ChevronRight,
  Star,
  Users,
  Clock,
  MapPin,
  LogIn,
  LogOut as LogOutIcon,
  CreditCard,
  User as UserIcon,
  MessageCircle
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
import { usePWAInstall } from '../../hooks/usePWAInstall';

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
  const { isInstallable, triggerInstall } = usePWAInstall();
  const [activePage, setActivePage] = useState<PageId>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attConfig, setAttConfig] = useState<AttendanceConfig>({ subjects: [], materials: [] });
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const triggerPageChange = (page: PageId) => {
    if (page === activePage) return;
    setActivePage(page);
  };

  useEffect(() => {
    // Handle home screen context menu shortcuts
    const params = new URLSearchParams(window.location.search);
    const shortcut = params.get('shortcut');
    if (shortcut) {
      const pageId = shortcut.toLowerCase() as PageId;
      const validPages: PageId[] = ['home', 'attendance', 'notes', 'results', 'notices', 'routine', 'faculty', 'profile'];
      if (validPages.includes(pageId)) {
        setActivePage(pageId);
        // Prune the query param to keep the url neat and avoid resetting active option on subsequent triggers
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
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, section: 'Main' },
    { 
      id: 'notes', 
      label: 'Study Notes', 
      icon: Notebook, 
      section: 'Main', 
      badge: (attConfig.materials?.length || 0) > 0 ? attConfig.materials.length.toString() : undefined 
    },
    { id: 'results', label: 'Exam Results', icon: Award, section: 'Main' },
    { id: 'faculty', label: 'Faculty', icon: Users, section: 'Main' },
    { id: 'profile', label: 'My Profile', icon: UserIcon, section: 'Main' },
    { id: 'notices', label: 'Notices', icon: Megaphone, section: 'Academic' },
    { id: 'routine', label: 'Routine', icon: Calendar, section: 'Academic' },
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
           {/* Custom Google Play install button next to Support Chatbot */}
           {isInstallable && (
             <button 
               onClick={triggerInstall}
               className="w-9 h-9 bg-[#ffa75e]/10 text-[#ff9d4d] border border-[#ff9d4d]/20 rounded-rs flex items-center justify-center relative hover:bg-[#ffa75e]/25 transition-all cursor-pointer group"
               title="Download MyCampus Web App"
             >
                {/* Google Play Styled Icon inside Header */}
                <svg className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.6 1.8C3.1 2.3 2.8 3.1 2.8 4.2V35.8C2.8 36.9 3.1 37.7 3.6 38.2L3.8 38.4L22.2 20L3.8 1.6L3.6 1.8Z" fill="#00E5FF" />
                  <path d="M28.3 26.1L22.2 20L3.8 38.4C4.4 39 5.3 39.1 6.4 38.5L28.3 26.1Z" fill="#FF3D00" />
                  <path d="M28.3 13.9L6.4 1.5C5.3 0.9 4.4 1 3.8 1.6L22.2 20L28.3 13.9Z" fill="#4CAF50" />
                  <path d="M34.4 17.4C35.2 17.9 35.6 18.9 35.6 20C35.6 21.1 35.2 22.1 34.4 22.6L28.3 26.1L22.2 20L28.3 13.9L34.4 17.4Z" fill="#FFC107" />
                </svg>
             </button>
           )}

           <button 
             onClick={() => setIsChatbotOpen(true)}
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
          
          <footer className="p-4 border-t border-bc text-center">
             <p className="text-[10px] font-bold text-dt uppercase tracking-wide">MyCampus Student Hub</p>
             <p className="text-[8px] text-lt leading-relaxed italic mt-1 px-1">
               "This is an independent student-made platform and is not officially affiliated with EIILM Kolkata."
             </p>
             <div className="mt-2.5 pt-2 border-t border-dashed border-bc/60">
               <p className="text-[9px] text-mt">Developed by <span className="font-bold text-sf">HabaJaba Tech</span></p>
               <p className="text-[8px] text-lt font-mono">CEO & Founder: Sayan Kumar Patra</p>
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
                <footer className="p-5 border-t border-bc text-center">
                  <p className="text-[10px] font-bold text-dt uppercase tracking-wide">MyCampus Student Hub</p>
                  <p className="text-[9px] text-lt leading-relaxed italic mt-1 px-1">
                    "This is an independent student-made platform and is not officially affiliated with EIILM Kolkata."
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-dashed border-bc/60">
                    <p className="text-[9px] text-mt">Developed by <span className="font-bold text-sf">HabaJaba Tech</span></p>
                    <p className="text-[8px] text-lt font-mono">CEO & Founder: Sayan Kumar Patra</p>
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
            {/* Mobile Bottom Navigation Bar - Premium Glassmorphic Design (Flat at bottom) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-wh/80 backdrop-blur-xl border-t border-bc/50 px-4 pt-1.5 pb-2 shadow-[0_-8px_32px_rgba(0,0,0,0.04)] flex items-center justify-around h-[72px] z-30 rounded-t-[20px]">
        {[
          { id: 'home', label: 'Home', icon: LayoutDashboard },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
          { 
            id: 'notes', 
            label: 'Notes', 
            icon: Notebook, 
            badge: (attConfig.materials?.length || 0) > 0 ? attConfig.materials.length.toString() : undefined 
          },
        ].map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => triggerPageChange(item.id as PageId)}
              className="flex flex-col items-center justify-center flex-1 h-full relative transition-all active:scale-95 group focus:outline-none"
            >
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 z-10">
                <item.icon 
                  size={19} 
                  className={`transition-all duration-300 ${isActive ? 'text-db scale-110' : 'text-mt/60 group-hover:text-mt'}`} 
                />
                
                {item.badge && (
                  <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] bg-red-500 text-wh font-black text-[8px] flex items-center justify-center px-1 rounded-full border border-wh shadow-sm">
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <motion.div 
                    layoutId="mobileActiveBubble"
                    className="absolute inset-0 bg-gradient-to-tr from-db/15 to-db/5 border border-db/10 shadow-[0_4px_12px_rgba(93,14,49,0.04),inset_0_1px_1px_rgba(255,255,255,0.7)] rounded-[14px]"
                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                  />
                )}
              </div>
              
              <span className={`text-[8.5px] font-black tracking-wide mt-0.5 transition-all uppercase ${isActive ? 'text-db text-[9px] opacity-100' : 'text-mt/50 opacity-80'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Mobile Menu Toggle button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full relative transition-all active:scale-95 group focus:outline-none"
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 text-mt/60 group-hover:text-mt">
            <Menu size={19} />
          </div>
          <span className="text-[8.5px] font-bold text-mt/50 tracking-wide mt-0.5 uppercase opacity-80">
            Menu
          </span>
        </button>
      </div>  </div>
      
      {/* Support Chatbot Modal Panel */}
      <SupportChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} user={user} />
    </div>
  );
}
