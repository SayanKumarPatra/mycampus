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
  LogOut as LogOutIcon
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

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export type PageId = 'home' | 'attendance' | 'notes' | 'results' | 'notices' | 'routine' | 'faculty';

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationStatus, setLocationStatus] = useState<'checking' | 'at-campus' | 'outside' | 'denied'>('checking');
  const [attConfig, setAttConfig] = useState<AttendanceConfig>({ subjects: [], materials: [] });
  const [punchTime, setPunchTime] = useState<{in: string | null, out: string | null}>(() => {
    const savedStr = localStorage.getItem(`punch_data_${user.id}`);
    if (savedStr) {
      const saved = JSON.parse(savedStr);
      if (saved.date === new Date().toISOString().slice(0, 10)) {
        return saved.times;
      }
    }
    return { in: null, out: null };
  });

  // Save punch data whenever it changes
  useEffect(() => {
    localStorage.setItem(`punch_data_${user.id}`, JSON.stringify({
      date: new Date().toISOString().slice(0, 10),
      times: punchTime
    }));
  }, [punchTime, user.id]);

  // Campus DN-9 Coordinates (EIILM Salt Lake)
  const CAMPUS_COORDS = { lat: 22.5726, lng: 88.4348 };

  useEffect(() => {
    setAttConfig(attendanceService.getGlobalConfig());
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Auto-reset at midnight if the app is open
      if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
        setPunchTime({ in: null, out: null });
      }
    }, 1000);
    
    // Geolocation monitoring
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const dist = calculateDistance(
            pos.coords.latitude, 
            pos.coords.longitude, 
            CAMPUS_COORDS.lat, 
            CAMPUS_COORDS.lng
          );
          
          if (dist < 0.25) { // 250 meters for better accuracy at DN-9
            if (locationStatus !== 'at-campus') {
              setLocationStatus('at-campus');
              setPunchTime(prev => {
                // Only set In time if it's the first entry of the day
                if (!prev.in) {
                  return { ...prev, in: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                }
                return prev;
              });
            }
          } else {
            // Only set Out time if they were previously at campus and had an In time
            if (locationStatus === 'at-campus') {
              setLocationStatus('outside');
              setPunchTime(prev => {
                if (prev.in) {
                  return { ...prev, out: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                }
                return prev;
              });
            } else if (locationStatus === 'checking') {
              setLocationStatus('outside');
            }
          }
        },
        () => setLocationStatus('denied'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return () => {
        clearInterval(timer);
        navigator.geolocation.clearWatch(watchId);
      };
    }
    
    return () => clearInterval(timer);
  }, [locationStatus, user.id]);

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

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
    { id: 'notices', label: 'Notices', icon: Megaphone, section: 'Academic' },
    { id: 'routine', label: 'Routine', icon: Calendar, section: 'Academic' },
  ];

  const sections = ['Main', 'Academic'];

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
           <button className="w-9 h-9 bg-wh/10 text-wh rounded-rs flex items-center justify-center relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-sf rounded-full border border-db" />
           </button>
           <button onClick={onLogout} className="w-9 h-9 bg-wh/10 text-wh rounded-rs flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors">
              <LogOutIcon size={20} />
           </button>
        </div>
      </header>

      {/* Info Bar */}
      <div className="bg-db2 border-b border-wh/5 px-4 h-10 flex items-center justify-between shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-sf" />
            <span className="text-[10px] font-bold text-wh/90 whitespace-nowrap">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-[10px] text-wh/40 font-bold uppercase tracking-wider ml-1">
              {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric' })}
            </span>
          </div>
          
          <div className="h-3 w-px bg-wh/10" />
          
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${locationStatus === 'at-campus' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${locationStatus === 'at-campus' ? 'text-green-400' : 'text-red-400'}`}>
              {locationStatus === 'at-campus' ? 'Campus DN-9' : 'Outside'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1">
            <LogIn size={10} className="text-sf" />
            <span className="text-[10px] text-wh/60 font-bold uppercase tracking-tighter">In:</span>
            <span className="text-[10px] text-wh font-bold">{punchTime.in || '--:--'}</span>
          </div>
          <div className="flex items-center gap-1">
            <LogOutIcon size={10} className="text-sf" />
            <span className="text-[10px] text-wh/60 font-bold uppercase tracking-tighter">Out:</span>
            <span className="text-[10px] text-wh font-bold">{punchTime.out || '--:--'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-[240px] bg-wh border-r border-bc shrink-0">
          <div className="p-4 bg-gradient-to-br from-db to-db2 border-b border-bc shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-wh/40 bg-sf overflow-hidden flex items-center justify-center font-rajdhani text-lg font-bold text-db shrink-0">
                {user.photo ? <img src={user.photo} className="w-full h-full object-cover" /> : getInitials(user.name)}
              </div>
              <div className="min-w-0">
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
                      setActivePage(p.id as PageId);
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
             <p className="text-[9px] text-lt uppercase font-bold tracking-widest mb-1.5">MyCampus Portal</p>
             <p className="text-[8px] text-lt leading-relaxed italic px-2">
               “This is an independent student-made platform and is not officially affiliated with EIILM Kolkata.”
             </p>
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
                <div className="p-5 pt-8 bg-gradient-to-br from-db to-db2 relative">
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="absolute top-4 right-4 w-7 h-7 bg-wh/10 text-wh rounded-md flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-14 h-14 rounded-full border-2 border-wh/40 bg-sf overflow-hidden flex items-center justify-center font-rajdhani text-xl font-bold text-db shrink-0">
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
                            setActivePage(p.id as PageId);
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
                  <p className="text-[10px] text-lt uppercase font-bold tracking-widest mb-2">MyCampus Student Hub</p>
                  <p className="text-[9px] text-lt leading-relaxed italic px-2">
                    “This is an independent student-made platform and is not officially affiliated with EIILM Kolkata.”
                  </p>
                </footer>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-bg relative z-0">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activePage === 'home' && <Home user={user} onNavigate={setActivePage} isAtCampus={locationStatus === 'at-campus'} />}
                {activePage === 'attendance' && <Attendance user={user} />}
                {activePage === 'notes' && <Notes />}
                {activePage === 'results' && <Results />}
                {activePage === 'notices' && <Notices />}
                {activePage === 'routine' && <Routine />}
                {activePage === 'faculty' && <Faculty />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
