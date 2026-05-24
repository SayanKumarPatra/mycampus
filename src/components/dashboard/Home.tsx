import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Fingerprint, Trophy, BellRing, CalendarDays, GraduationCap, Star, AlertTriangle, X, ChevronRight, TrendingUp, Bell, Calendar, BookOpen, CheckSquare, Square, Sliders, CheckCircle, ChevronDown, ChevronUp, Coffee, Copy, Check, ExternalLink, QrCode, Sparkles, Heart, MessageSquare, ThumbsUp, Send, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [paymentToast, setPaymentToast] = useState('');
  const [donateAmount, setDonateAmount] = useState('30');

  // Support Report states
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportName, setReportName] = useState(user.name);
  const [reportAmt, setReportAmt] = useState('30');
  const [reportApp, setReportApp] = useState('phonepe');
  const [reportRef, setReportRef] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Feedback states
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('Map Experience');
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleReportSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportRef.trim()) return;
    
    setIsReportSubmitting(true);
    try {
      const config = globalConfig || { subjects: [], materials: [], results: [], notices: [], routine: [], faculties: [] };
      const previousReports = config.reportedSupporters || [];
      
      const newReport: any = {
        id: `rep_${Date.now()}`,
        name: reportName.trim() || user.name,
        amount: Number(reportAmt) || 30,
        appUsed: reportApp,
        refNo: reportRef.trim(),
        message: reportMsg.trim(),
        status: 'pending',
        createdAt: Date.now()
      };
      
      const updatedConfig = {
        ...config,
        reportedSupporters: [newReport, ...previousReports]
      };
      
      await attSvc.saveGlobalConfig(updatedConfig);
      setReportRef('');
      setReportMsg('');
      setReportSuccess(true);
      setTimeout(() => setReportSuccess(false), 8000);
      setShowReportForm(false);
    } catch (err) {
      console.error("Failed to report support:", err);
    } finally {
      setIsReportSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;
    
    setIsFeedbackSubmitting(true);
    try {
      const config = globalConfig || { subjects: [], materials: [], results: [], notices: [], routine: [], faculties: [] };
      const previousFeedbacks = config.feedbacks || [];
      
      const newFeedback: any = {
        id: `fb_${Date.now()}`,
        name: user.name,
        roll: user.roll,
        rating: feedbackRating,
        comment: feedbackComment.trim(),
        category: feedbackCategory,
        createdAt: Date.now()
      };
      
      const updatedConfig = {
        ...config,
        feedbacks: [newFeedback, ...previousFeedbacks]
      };
      
      await attSvc.saveGlobalConfig(updatedConfig);
      setFeedbackComment('');
      setFeedbackSuccess(true);
      setTimeout(() => setFeedbackSuccess(false), 5000);
    } catch (err) {
      console.error("Failed to save feedback:", err);
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleUPIPayment = (app: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'amazonpay' | 'fampay' | 'navi' | 'generic') => {
    const upiId = 'Q423031154@ybl';
    
    // Parse input amount to double-precision secure format
    const parsedAmount = parseFloat(donateAmount);
    const cleanAmount = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount.toFixed(2) : '30.00';
    
    // Standard secure universal UPI deep link matching user's exact working pattern: upi://pay?pa=Q423031154@ybl&pn=Rahul&cu=INR&am=...
    const upiLink = `upi://pay?pa=${upiId}&pn=Rahul&cu=INR&am=${cleanAmount}`;
    
    // Auto-copy UPI ID to clipboard as a high-reliability fallback
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upiId);
      }
    } catch (e) {
      console.warn("Auto-copy bypassed", e);
    }

    if (isMobileDevice()) {
      // Modern Indian mobile browsers and UPI apps restrict custom URI schemes (like phonepe://, tez://) to prevent phishing.
      // Launching with the standard, universal UPI protocol 'upi://' is 100% stable, compliant, and prevents payment limits or freezing!
      // This triggers the native operating system chooser modal allowing the user to select their desired app.
      const deepLink = upiLink;

      const labels: Record<string, string> = {
        gpay: 'Google Pay',
        phonepe: 'PhonePe',
        paytm: 'Paytm UPI',
        bhim: 'BHIM UPI',
        amazonpay: 'Amazon Pay',
        fampay: 'FamPay',
        navi: 'Navi UPI',
        generic: 'UPI Chooser'
      };

      const appLabel = labels[app] || 'UPI UI';
      setPaymentToast(`${appLabel} চালুর উদ্যোগ নেওয়া হচ্ছে... পরিমাণ: ₹${cleanAmount}`);
      setTimeout(() => setPaymentToast(''), 4000);
      window.location.href = deepLink;
    } else {
      // Desktop experience
      setPaymentToast(`UPI ID কপি করা হয়েছে! কিউআর স্ক্যান করে পেমেন্ট সম্পূর্ণ করুন। পরিমাণ: ₹${cleanAmount}`);
      setCopied(true);
      setShowQR(true);
      setTimeout(() => {
        setPaymentToast('');
        setCopied(false);
      }, 5000);
    }
  };

  const handleCopyUPI = () => {
    const upiId = 'Q423031154@ybl';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upiId).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = upiId;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const [greeting, setGreeting] = useState('');
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [globalConfig, setGlobalConfig] = useState<AttendanceConfig | null>(null);
  const [activeSyllabusCode, setActiveSyllabusCode] = useState<string>('');
  const [showAllSyllabus, setShowAllSyllabus] = useState<boolean>(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState<boolean>(false);
  const [showTopicsChecklist, setShowTopicsChecklist] = useState<boolean>(false);

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
      
      // Save full config for syllabus tracking
      setGlobalConfig(config);
      
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
    { id: 'attendance', label: 'Attendance', icon: Fingerprint, color: 'bg-db/10 text-db' },
    { id: 'notes', label: 'Notes', icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
    { id: 'results', label: 'Results', icon: Trophy, color: 'bg-[#fff0e0] text-[#c06010]' },
    { id: 'notices', label: 'Notices', icon: BellRing, color: 'bg-red-50 text-red-600' },
    { id: 'routine', label: 'Routine', icon: CalendarDays, color: 'bg-teal-50 text-teal-600' },
    { id: 'faculty', label: 'Faculty', icon: GraduationCap, color: 'bg-green-50 text-green-600' },
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
                <span className="text-xs sm:text-[13px] text-wh font-extrabold tracking-wide block">{greeting}</span>
                <h2 className="font-rajdhani text-xl font-bold text-wh leading-tight mt-0.5 truncate pr-8 sm:pr-2" title={user.name}>{user.name}</h2>
                <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                  <p className="text-[9px] text-wh/60 uppercase tracking-wide font-bold truncate shrink-0">{user.department}</p>
                  <span className="w-1 h-1 rounded-full bg-wh/20 shrink-0" />
                  <p className="text-[9px] text-wh/60 uppercase tracking-wide font-bold truncate">{user.semester}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 relative z-10">
          {[
            { label: 'Attendance', value: stats.total > 0 ? `${stats.pct}%` : '0%', id: 'attendance' },
            { label: 'Total Classes', value: stats.total, id: 'attendance' },
            { label: 'Present', value: stats.present, id: 'attendance' },
            { label: 'Absent', value: stats.total > stats.present ? stats.total - stats.present : 0, id: 'attendance' }
          ].map((s, i) => (
            <button 
              key={i}
              onClick={() => onNavigate(s.id as PageId)}
              className="bg-wh/10 border border-wh/15 rounded-rm p-2.5 sm:p-3 text-center transition-all hover:bg-wh/20 group"
            >
              <span className="block font-rajdhani text-xl sm:text-2xl font-bold text-wh leading-none whitespace-nowrap group-hover:scale-110 transition-transform">{s.value}</span>
              <span className="text-[8.5px] sm:text-[9px] text-wh/70 font-extrabold uppercase tracking-wider mt-2.5 leading-none block whitespace-nowrap opacity-90">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Syllabus & Progress Tracker with Premium Compact Card Layout */}
      <div className="bg-gradient-to-br from-db via-db2 to-db3 text-white border border-wh/10 rounded-rl p-2.5 sm:p-3 shadow-md relative space-y-2 z-10">
        
        {/* Top Minimal Header */}
        <div className="flex items-center justify-between gap-1 border-b border-wh/10 pb-1.5">
          <div className="flex items-center gap-1 min-w-0">
            <BookOpen size={11} className="text-sf2 shrink-0" />
            <h3 className="text-[9.5px] font-black uppercase tracking-wider text-white truncate">
              Syllabus / সিলেবাস ট্র্যাকার
            </h3>
          </div>
          
          <button
            onClick={() => {
              setShowAllSyllabus(!showAllSyllabus);
              setShowSubjectDropdown(false);
            }}
            className="flex items-center gap-1 py-0.5 px-1.5 rounded-full border border-wh/20 bg-wh/10 text-[8px] sm:text-[9px] font-black uppercase hover:bg-wh/20 transition-all select-none shrink-0"
          >
            <span>{showAllSyllabus ? '👀 Single View' : '📚 View All / একসাথে সব'}</span>
          </button>
        </div>

        {/* Unified Selector Row Or All-Grid */}
        {!showAllSyllabus ? (
          <div className="space-y-1.5">
            {/* Custom Interactive Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                className="w-full flex items-center justify-between py-1.5 px-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-rm transition-all text-[10px] font-black text-white select-none cursor-pointer"
              >
                <span className="truncate flex items-center gap-1">
                  <span className="text-sf font-rajdhani text-[11px] font-black tracking-normal shrink-0 mr-1">
                    {activeSyllabusCode || 'SELECT'}
                  </span>
                  <span className="opacity-95 text-white/90">
                    - {activeSyllabusCode ? (SUBJECTS.find(s => s.code === activeSyllabusCode)?.name || '') : 'Select Subject / সাবজেক্ট সিলেক্ট করুন'}
                  </span>
                </span>
                <ChevronDown size={11} className={`text-sf transition-transform duration-200 shrink-0 ml-1 ${showSubjectDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Subject Selection Absolute Menu Dropdown Container */}
              {showSubjectDropdown && (
                <div className="absolute top-[105%] left-0 right-0 bg-white border border-bc rounded-rm shadow-lg py-1 z-30 max-h-[160px] overflow-y-auto animate-fadeIn text-dt">
                  {SUBJECTS.map((sj) => {
                    const scnf = (globalConfig?.subjects || []).find(sc => sc.code === sj.code);
                    const subTopics = scnf?.topics || [];
                    const subCompleted = subTopics.filter(t => t.completed);
                    return (
                      <button
                        key={sj.code}
                        onClick={() => {
                          setActiveSyllabusCode(sj.code);
                          setShowSubjectDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-[9.5px] hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-bc last:border-0 ${
                          activeSyllabusCode === sj.code ? 'bg-sf/10 font-black text-db' : 'font-bold'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="font-rajdhani text-[10px] font-black text-db block leading-none mb-0.5">{sj.code}</span>
                          <span className="truncate block opacity-85 leading-normal">{sj.name}</span>
                        </div>
                        <span className="text-[9px] font-bold text-sf bg-sf/15 py-0.5 px-1 rounded-full shrink-0">
                          {subCompleted.length}/{subTopics.length} Done
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Render selected subject details in simplified extremely slim card */}
            {activeSyllabusCode && (() => {
              const currentSubj = SUBJECTS.find(s => s.code === activeSyllabusCode);
              if (!currentSubj) return null;
              const sConf = (globalConfig?.subjects || []).find(sc => sc.code === activeSyllabusCode);
              const topics = sConf?.topics || [];
              const completed = topics.filter(t => t.completed);

              return (
                <div className="space-y-1.5 bg-wh/5 border border-wh/10 p-2 rounded-rm text-[11px]">
                  {/* Total summary */}
                  <div className="flex items-center justify-between text-[9.5px] text-white/90 font-bold border-b border-white/5 pb-1">
                    <span>Syllabus Topics / মোট চ্যাপ্টার:</span>
                    <span className="text-sf font-black">{completed.length} of {topics.length} Done ({topics.length} টির মধ্যে {completed.length} টি শেষ)</span>
                  </div>

                  {/* List of chapters with clean status */}
                  <div className="grid grid-cols-1 gap-1 max-h-[120px] overflow-y-auto pr-1">
                    {topics.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-1.5 rounded border flex items-center justify-between gap-2 transition-all ${
                          t.completed
                            ? 'border-[#42b883]/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-white/5 bg-white/5 text-white/85'
                        }`}
                      >
                        <span className={`text-[9.5px] font-extrabold truncate ${t.completed ? 'text-emerald-200' : 'text-white/90'}`}>
                          {t.name}
                        </span>
                        {t.completed ? (
                          <span className="text-[7.5px] bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded font-black max-w-max">Done / শেষ</span>
                        ) : (
                          <span className="text-[7.5px] bg-white/5 text-white/40 px-1 py-0.5 rounded font-bold max-w-max">Pending</span>
                        )}
                      </div>
                    ))}
                    {topics.length === 0 && (
                      <div className="text-center py-2 text-white/40 italic text-[9px]">
                        No syllabus outline added yet / চ্যাপ্টার তালিকা যুক্ত করা হয়নি
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* View All Mode with highly condensed rows showing completed chapters directly */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 animate-fadeIn text-white">
            {SUBJECTS.map((sj) => {
              const scnf = (globalConfig?.subjects || []).find(sc => sc.code === sj.code);
              const subTopics = scnf?.topics || [];
              const subCompleted = subTopics.filter(t => t.completed);

              return (
                <div
                  key={sj.code}
                  onClick={() => {
                    setActiveSyllabusCode(sj.code);
                    setShowAllSyllabus(false);
                  }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-rm flex flex-col gap-1 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between gap-1 text-[9.5px] font-black text-sf uppercase">
                    <span className="truncate block">
                      {sj.code} - {sj.name}
                    </span>
                    <span className="text-white shrink-0 font-rajdhani">
                      {subCompleted.length} / {subTopics.length} Done
                    </span>
                  </div>

                  {/* Compact Complete Listing lines */}
                  <div className="text-[8.5px] leading-tight text-white/70 bg-black/10 p-1.5 rounded border border-white/5 space-y-0.5">
                    <span className="text-emerald-400 font-extrabold block text-[7.5px] uppercase">
                      ✅ সম্পন্ন / Done ({subCompleted.length} টি):
                    </span>
                    {subCompleted.length > 0 ? (
                      <p className="truncate text-[8.5px] text-white/90 font-bold">
                        {subCompleted.map(t => t.name).join(', ')}
                      </p>
                    ) : (
                      <span className="text-[8px] text-white/30 italic block">None completed yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
              <BellRing size={18} className="text-db" />
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
                <Fingerprint size={14} />
                Mark Daily Attendance
             </button>
          </div>
        </div>
      </div>

      {/* Developer Donation Section */}
      <div className="bg-[#5d0e31] rounded-rl p-6 text-wh relative overflow-hidden shadow-xl mt-6 border border-wh/10">
        <div className="absolute top-[-30px] right-[-30px] w-36 h-36 rounded-full bg-sf/5 pointer-events-none" />
        <div className="absolute bottom-[-40px] left-[-10px] w-24 h-24 rounded-full bg-wh/5 pointer-events-none" />
        
        {/* Animated Toast/Banner inside Card */}
        <AnimatePresence>
          {paymentToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 bg-sf/20 border border-sf/40 py-2.5 px-4 rounded-rs text-[12px] font-bold text-sf flex items-center gap-2 shadow-md relative z-20"
            >
              <div className="w-2 h-2 rounded-full bg-sf shrink-0 animate-ping" />
              <span>{paymentToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Motivation Text & Copy Block */}
          <div className="min-w-0 md:col-span-7 space-y-4 w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sf/20 flex items-center justify-center text-sf shrink-0 animate-pulse">
                <Coffee size={18} className="stroke-[2.5]" />
              </div>
              <h3 className="font-rajdhani text-[16px] sm:text-[18px] font-black text-wh tracking-tight leading-tight uppercase">
                ডেভলপারকে উপহার দিন (Support Developer)
              </h3>
            </div>
            
            <p className="text-[12px] sm:text-[13px] text-wh/90 leading-relaxed font-semibold">
              আমাদের এই স্বাধীন <span className="text-sf font-black uppercase">MyCampus</span> প্ল্যাটফর্মকে সচল রাখতে এবং নতুন আপডেট নিয়ে আসতে সাহায্য করুন! নিচে দেওয়া QR কোড স্ক্যান করে অথবা UPI ID কপি করে যেকোনো পেমেন্ট অ্যাপ (Google Pay, PhonePe, Paytm) দিয়ে আপনার ইচ্ছেমতো উপহার পাঠাতে পারেন। আপনার যেকোনো সাহায্যই আমাদের অনেক অনুপ্রাণিত করে। ❤️
            </p>

            {/* Custom Amount Input block */}
            <div className="bg-white/10 p-4 rounded-rm border border-white/10 space-y-3.5 text-white">
              <div>
                <span className="text-[11px] font-black uppercase text-sf flex items-center gap-1">
                  <Coffee size={12} className="shrink-0" /> উপহারের পরিমাণ (Enter Gift Amount in ₹):
                </span>
                
                <div className="relative flex items-center bg-white/5 border border-white/20 hover:border-white/40 focus-within:border-sf rounded-rs px-3.5 py-2 mt-1.5 transition-all">
                  <span className="text-sm font-black text-white/50 mr-2">₹</span>
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val || parseInt(val) >= 0) {
                        setDonateAmount(val);
                      }
                    }}
                    placeholder="এখানে পরিমাণ লিখুন (যেমন: 30, 50, 100)"
                    className="w-full bg-transparent outline-none border-none text-sm font-black text-white placeholder:text-white/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Enhanced Copy Helper */}
              <div>
                <span className="text-[10px] font-black uppercase text-wh/70 block mb-1.5">
                  ইউপিআই আইডি কপি করুন (Copy UPI ID):
                </span>
                <button 
                  type="button"
                  onClick={handleCopyUPI}
                  className="w-full flex items-center justify-between py-2.5 px-4 rounded-rs bg-white text-[11px] font-extrabold text-slate-800 hover:bg-slate-50 transition-all border border-slate-200/50 shadow-md cursor-pointer select-none active:scale-[0.98] group"
                >
                  <span className="font-mono tracking-wide text-sf font-black break-all mr-2">Q423031154@ybl</span>
                  {copied ? (
                    <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200/50 uppercase tracking-wider shrink-0">
                      <Check size={11} className="stroke-[3]" />
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-black text-[#5d0e31] bg-[#5d0e31]/5 px-2 py-1 rounded border border-[#5d0e31]/10 uppercase tracking-wider shrink-0 group-hover:bg-[#5d0e31]/10">
                      <Copy size={11} />
                      Tap to Copy
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Direct, Elegant QR Code Box Side Column */}
          <div className="md:col-span-5 flex flex-col items-center justify-center w-full">
            <div className="bg-white p-3 rounded-rm ring-4 ring-wh/5 shadow-2xl shrink-0 border border-slate-100 flex flex-col items-center w-fit max-w-full">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=154x154&data=upi://pay?pa=Q423031154%40ybl%26pn%3DRahul%26cu%3DINR%26am%3D${!isNaN(parseFloat(donateAmount)) && parseFloat(donateAmount) > 0 ? parseFloat(donateAmount).toFixed(2) : '30.00'}`}
                alt="Donate UPI QR"
                className="w-[144px] h-[144px] object-cover pointer-events-auto rounded-sm mb-1"
                referrerPolicy="no-referrer"
              />
              <span className="text-[8px] font-black text-slate-800 tracking-tight text-center uppercase font-mono px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded">
                YBL UPI QR
              </span>
            </div>
            
            <div className="mt-3 text-center space-y-1">
              <h4 className="text-[12px] font-extrabold text-sf flex items-center justify-center gap-1">
                <QrCode size={12} /> Scan the QR Code / স্ক্যান করুন
              </h4>
              <p className="text-[10px] text-wh/75 max-w-xs font-semibold leading-relaxed">
                যেকোনো ইউপিআই অ্যাপ (Google Pay, PhonePe, Paytm, BHIM) দিয়ে এই QR কোডটি স্ক্যান করে উপহার দিতে পারেন।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestion / Feedback Section */}
      <div className="bg-wh border border-bc rounded-rl p-5 md:p-6 shadow-sm mt-6">
        <div className="flex items-center gap-2 mb-4 border-b border-bc pb-3">
          <div className="w-8 h-8 rounded-full bg-db/5 border border-db/10 flex items-center justify-center text-db shrink-0">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="font-rajdhani text-[15px] sm:text-[17px] font-black text-slate-800 tracking-tight leading-tight uppercase">
              ফিডব্যাক বা সাজেশন বাক্স (App Suggestions / Feedback)
            </h3>
            <p className="text-[10px] text-mt mt-1 font-semibold">আপনার মতামত আমাদের অ্যাপ আরো উন্নত করতে সাহায্য করবে / Help us improve</p>
          </div>
        </div>

        {feedbackSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-green-50 border border-green-200 rounded-rs text-center"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2 text-green-600">
              <Check size={20} className="stroke-[3]" />
            </div>
            <h4 className="text-xs font-black text-green-800 uppercase tracking-wide">ধন্যবাদ! ফিডব্যাক সফল হয়েছে</h4>
            <p className="text-[10.5px] text-green-700 mt-1">আপনার মূল্যবান সাজেশন ও ফিডব্যাক অ্যাডমিন প্যানেলে পাঠানো হয়েছে।</p>
          </motion.div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-dt uppercase tracking-wider block">ফিডব্যাকের ধরন / Category</label>
                <div className="relative">
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="inp h-9 px-3 text-xs pr-8 appearance-none bg-wh focus:ring-1 focus:ring-db focus:border-db font-medium cursor-pointer"
                  >
                    <option value="Feature Request">💡 ফিচার অনুরোধ / Feature Request</option>
                    <option value="Bug Report">🐛 সমস্যা বা বাগ রিপোর্ট / Bug Report</option>
                    <option value="App Experience">⭐ সার্বিক অভিজ্ঞতা / App Experience</option>
                    <option value="Miscellaneous">💬 অন্যান্য মতামত / Miscellaneous</option>
                  </select>
                  <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Star rating selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-dt uppercase tracking-wider block">রেটিং দিন / Give Rating</label>
                <div className="flex items-center gap-1.5 h-9 bg-slate-50 border border-bc rounded-rs px-3.5">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const ratingValue = idx + 1;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFeedbackRating(ratingValue)}
                        className={`transition-all hover:scale-115 active:scale-90`}
                      >
                        <Star 
                          size={18} 
                          className={`${
                            ratingValue <= feedbackRating 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-slate-200 hover:text-yellow-200'
                          } transition-colors cursor-pointer`} 
                        />
                      </button>
                    );
                  })}
                  <span className="text-[10.5px] font-black font-mono text-slate-500 ml-2">
                    {feedbackRating}/5
                  </span>
                </div>
              </div>
            </div>

            {/* Comment field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-dt uppercase tracking-wider block">আপনার মন্তব্য / Suggestion Message</label>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="অ্যাপ সম্পর্কিত আপনার মন্তব্য বা সাজেশন এখানে লিখুন (যেমন: অমুক ফিচার যুক্ত করলে ভালো হতো বা ওই পেজ খুলছে না)..."
                rows={3}
                required
                className="inp p-3 text-xs resize-none placeholder:text-slate-400 focus:ring-1 focus:ring-db focus:border-db"
              />
            </div>

            <button
              type="submit"
              disabled={isFeedbackSubmitting}
              className="w-full sm:w-auto h-9 px-5 bg-db hover:bg-db2 text-white font-extrabold text-[11px] tracking-wider uppercase rounded shadow-ss transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isFeedbackSubmitting ? (
                <>মতামত পাঠানো হচ্ছে... ⏳</>
              ) : (
                <>
                  <Send size={12} />
                  মতামত জমা দিন 🚀
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
