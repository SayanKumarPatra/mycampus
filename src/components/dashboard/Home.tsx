import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CalendarCheck, Notebook, Award, Megaphone, Users, Star, AlertTriangle, X, ChevronRight, TrendingUp, Bell, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { User, AttendanceConfig } from '../../types';
import { attendanceService as attSvc } from '../../services/attendanceService';
import { SUBJECTS } from '../../constants';
import { PageId } from './Dashboard';

import { getInitials } from '../../utils';

interface HomeProps {
  user: User;
  onNavigate: (page: PageId) => void;
}

export default function Home({ user, onNavigate }: HomeProps) {
  const [stats, setStats] = useState({ pct: 0, present: 0, total: 0 });
  const [greeting, setGreeting] = useState('');
  const [recentNotices, setRecentNotices] = useState<any[]>([]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning,' : h < 17 ? 'Good Afternoon,' : 'Good Evening,');
    
    // Create a function to process data once both are available
    const processData = (attendanceData: any, config: AttendanceConfig) => {
      // Set notices
      const notices = (config.notices || [])
        .sort((a, b) => b.publishedAt - a.publishedAt)
        .slice(0, 3);
      setRecentNotices(notices);
      
      let total = 0, present = 0;
      
      SUBJECTS.forEach((subj, idx) => {
        const subjConfig = config.subjects.find(c => c.code === subj.code) || { code: subj.code, totalClasses: 0 };
        
        const subjPresent = (attendanceData.records || []).reduce((acc: number, r: any) => {
          const s = r.subjects?.[idx];
          return acc + (s && s.status === 'present' ? 1 : 0);
        }, 0);
        
        const subjTotal = Math.max(subjPresent, subjConfig.totalClasses);
        
        present += subjPresent;
        total += subjTotal;
      });

      setStats({ 
        total, 
        present, 
        pct: total ? Math.round((present / total) * 100) : 0 
      });
    };

    let currentAttData: any = { records: [] };
    let currentConfig: AttendanceConfig = { subjects: [], materials: [], results: [], notices: [], routine: [], faculties: [] };

    const init = async () => {
      currentAttData = await attSvc.getAttendance(user.id);
      processData(currentAttData, currentConfig);
    };

    init();

    const unsub = attSvc.subscribeToGlobalConfig((config) => {
      currentConfig = config;
      processData(currentAttData, currentConfig);
    });

    return () => unsub();
  }, [user.id]);

  const quicklinks: { id: PageId; label: string; icon: any; color: string }[] = [
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck, color: 'bg-db/10 text-db' },
    { id: 'notes', label: 'Notes', icon: Notebook, color: 'bg-blue-50 text-blue-600' },
    { id: 'results', label: 'Results', icon: Award, color: 'bg-[#fff0e0] text-[#c06010]' },
    { id: 'notices', label: 'Notices', icon: Megaphone, color: 'bg-red-50 text-red-600' },
    { id: 'routine', label: 'Routine', icon: Calendar, color: 'bg-teal-50 text-teal-600' },
    { id: 'faculty', label: 'Faculty', icon: Users, color: 'bg-green-50 text-green-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-db2 via-db to-db rounded-rl p-4 relative overflow-hidden shadow-sm">
        <div className="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-sf/10 pointer-events-none" />
        <div className="absolute bottom-[-40px] left-[-20px] w-32 h-32 rounded-full bg-wh/5 pointer-events-none" />
        


        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
             <div className="w-14 h-14 rounded-full border-2 border-wh/40 bg-sf overflow-hidden flex items-center justify-center font-rajdhani text-xl font-bold text-db shrink-0 shadow-lg">
                {user.photo ? <img src={user.photo} className="w-full h-full object-cover" /> : getInitials(user.name)}
             </div>
             <div className="min-w-0 flex-1">
                <span className="text-[10px] text-wh/70 font-medium whitespace-nowrap block">{greeting}</span>
                <h2 className="font-rajdhani text-xl font-bold text-wh leading-tight mt-0.5 truncate pr-8 sm:pr-2" title={user.name}>{user.name}</h2>
                <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                  <p className="text-[9px] text-wh/60 uppercase tracking-wide font-bold truncate shrink-0">{user.department}</p>
                  <span className="w-1 h-1 rounded-full bg-wh/20 shrink-0" />
                  <p className="text-[9px] text-wh/60 uppercase tracking-wide font-bold truncate">{user.semester}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 relative z-10">
          {[
            { label: 'Attendance', value: stats.total > 0 ? `${stats.pct}%` : '0%', id: 'attendance' },
            { label: 'Present', value: stats.present, id: 'attendance' },
            { label: 'Absent', value: stats.total > stats.present ? stats.total - stats.present : 0, id: 'attendance' }
          ].map((s, i) => (
            <button 
              key={i}
              onClick={() => onNavigate(s.id as PageId)}
              className="bg-wh/10 border border-wh/15 rounded-rm p-3 text-center transition-all hover:bg-wh/20 group"
            >
              <span className="block font-rajdhani text-2xl font-bold text-wh leading-none whitespace-nowrap group-hover:scale-110 transition-transform">{s.value}</span>
              <span className="text-[9px] text-wh/60 font-bold uppercase tracking-wide mt-2 leading-none block whitespace-nowrap opacity-80">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold text-dt flex items-center gap-2">
            <TrendingUp size={18} className="text-db" />
            Quick Access
          </h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quicklinks.map((link, i) => (
            <button 
              key={i} 
              onClick={() => onNavigate(link.id)}
              className="bg-wh border border-bc rounded-rm p-3.5 flex flex-col items-center gap-2 transition-all hover:border-db hover:shadow-sm group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${link.color}`}>
                <link.icon size={20} />
              </div>
              <span className="text-[10px] font-bold text-dt leading-tight text-center">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notices */}
        <div>
           <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-dt flex items-center gap-2">
              <Megaphone size={18} className="text-db" />
              Recent Notices
            </h3>
            <button onClick={() => onNavigate('notices')} className="text-xs font-bold text-sf hover:underline">View All</button>
          </div>
          <div className="bg-wh border border-bc rounded-rm overflow-hidden shadow-ss">
             <div className="bg-db p-2.5 flex items-center gap-2">
                <Bell size={16} className="text-sf" />
                <span className="text-xs font-bold text-wh flex-1">Official Announcements</span>
                <span className="px-2 py-0.5 bg-sf text-db text-[9px] font-bold rounded-full">EIILM</span>
             </div>
             <div className="divide-y divide-bc">
                {recentNotices.length === 0 ? (
                  <div className="p-8 text-center text-[11px] text-mt italic">
                    No active notices published yet.
                  </div>
                ) : (
                  recentNotices.map((n, index) => (
                    <div 
                      key={n.id} 
                      onClick={() => onNavigate('notices')}
                      className="p-3.5 flex gap-3 items-start hover:bg-bg/50 cursor-pointer transition-colors"
                    >
                       <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                         n.type === 'critical' ? 'bg-red-600' : 
                         n.type === 'warning' ? 'bg-amber-500' : 
                         'bg-db'
                       }`} />
                       <div className="flex-1 min-w-0">
                          <h4 className="text-[12px] font-semibold text-dt leading-tight truncate">{n.title}</h4>
                          <p className="text-[10px] text-lt mt-1">{n.date}</p>
                       </div>
                       <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                         n.type === 'critical' ? 'bg-red-100 text-red-600' : 
                         n.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                         'bg-blue-100 text-db'
                       }`}>{n.tag}</span>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>

        {/* Progress */}
        <div>
           <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-dt flex items-center gap-2">
              <TrendingUp size={18} className="text-db" />
              Attendance Overview
            </h3>
            <span className="px-2.5 py-0.5 bg-db/10 text-db text-[10px] font-bold rounded-full uppercase tracking-tighter">{user.semester}</span>
          </div>
          <div className="bg-wh border border-bc rounded-rm p-4 shadow-ss space-y-4">
             <div className="flex flex-col items-center">
                <div className="relative w-24 h-24">
                   <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle className="text-bc" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50"/>
                      <circle className="text-db transition-all duration-1000 ease-out" strokeWidth="8" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * stats.pct) / 100} strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50"/>
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-rajdhani text-2xl font-bold text-db leading-none">{stats.pct}%</span>
                      <span className="text-[9px] text-lt uppercase font-bold tracking-tighter">Total</span>
                   </div>
                </div>
             </div>
             
             <div className="space-y-2">
                {[
                  { label: 'Attended', value: `${stats.present} / ${stats.total}`, color: 'text-db' },
                  { label: 'Absent', value: stats.total - stats.present, color: 'text-red-500' },
                  { label: 'Min. Required', value: '75%', color: 'text-sf' },
                  { label: 'Status', value: stats.total ? (stats.pct >= 75 ? 'SAFE ✓' : 'AT RISK !') : 'NO DATA', color: stats.total ? (stats.pct >= 75 ? 'text-green-600' : 'text-red-600') : 'text-lt' }
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2.5 bg-bg rounded-rs text-[11px]">
                     <span className="font-bold text-mt uppercase tracking-tight">{s.label}</span>
                     <span className={`font-extrabold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
             </div>

             <button 
               onClick={() => onNavigate('attendance')}
               className="btn-primary py-2.5 text-xs"
             >
                <CalendarCheck size={14} />
                Mark Daily Attendance
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
