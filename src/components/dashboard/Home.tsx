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
    const upiId = 'BHARATPE09903189531@yesbankltd';
    
    // Parse input amount to double-precision secure format
    const parsedAmount = parseFloat(donateAmount);
    const cleanAmount = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount.toFixed(2) : '30.00';
    
    // URL-encoded NPCI parameters
    const encodedPn = encodeURIComponent('Sayan Kumar Patra');
    // Using simple/neutral transactional note to bypass Paytm/GPay anti-phishing/risk policy blocks (e.g. "Coffee for Developer" is restricted)
    const encodedTn = encodeURIComponent('MyCampus');
    
    // Standard secure universal UPI deep link
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodedPn}&tn=${encodedTn}&am=${cleanAmount}&cu=INR`;
    
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
    const upiId = 'BHARATPE09903189531@yesbankltd';
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
      <div className="bg-[#5d0e31] rounded-rl p-5 text-wh relative overflow-hidden shadow-md mt-6 border border-wh/10">
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

        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
          {/* Motivation Text & Interactive App Icons Grid */}
          <div className="min-w-0 flex-1 space-y-4 w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sf/20 flex items-center justify-center text-sf shrink-0">
                <Coffee size={18} className="stroke-[2.5]" />
              </div>
              <h3 className="font-rajdhani text-[16px] sm:text-[18px] font-black text-wh tracking-tight leading-tight uppercase">
                ডেভলপারকে উপহার দিন (Support Developer)
              </h3>
            </div>
            
            <p className="text-[12px] sm:text-[13px] text-wh/85 leading-relaxed font-semibold max-w-3xl">
              আমাদের এই স্বাধীন <span className="text-sf font-black uppercase">MyCampus</span> প্ল্যাটফর্মকে সচল রাখতে এবং নতুন আপডেট নিয়ে আসতে সাহায্য করুন!পরিমাণ পছন্দ করে পছন্দের পেমেন্ট অ্যাপে ক্লিক করুন। যেকোনো ক্ষুদ্র পরিমাণের উপহার ও অনেক বড় সাহায্য ডেকে আনে। ❤️
            </p>

            {/* NEW: Interactive Amount Input section with Chips & Custom keypad input */}
            <div className="bg-white/10 p-3.5 rounded-rm border border-white/10 max-w-xl space-y-2.5 text-white">
              <span className="text-[11px] font-black uppercase text-sf flex items-center gap-1 block">
                <Coffee size={12} className="shrink-0" /> পরিমাণ নির্বাচন করুন (Enter / Tap Amount):
              </span>
              <div className="flex flex-wrap gap-2 items-center">
                {['10', '20', '30', '50', '100', '200'].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDonateAmount(amt)}
                    type="button"
                    className={`px-3 py-1.5 rounded-sm text-[11px] font-black transition-all cursor-pointer select-none border ${
                      donateAmount === amt
                        ? 'bg-sf text-white border-sf shadow-ss scale-[1.03]'
                        : 'bg-white/5 hover:bg-white/10 text-white/90 border-white/10'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
                
                {/* Custom input */}
                <div className="relative flex items-center rounded-sm bg-white/5 border border-white/10 pl-2 py-0.5 w-[95px] h-[28px]">
                  <span className="text-[10px] font-black text-white/70">₹</span>
                  <input
                    type="number"
                    value={donateAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val || parseInt(val) >= 0) {
                        setDonateAmount(val);
                      }
                    }}
                    placeholder="অন্যান্য"
                    className="w-full bg-transparent outline-none border-none text-[10px] font-black text-white pl-1 pr-1 placeholder:text-white/40 placeholder:font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            {/* Grid of Famous Indian UPI Applications */}
            <div className="space-y-1 w-full max-w-3xl">
              <span className="text-[10px] font-black uppercase text-white/60 block">
                পেমেন্ট করার জন্য অ্যাপ নির্বাচন করুন (Select Payment App):
              </span>
              <div className="flex flex-wrap gap-2 w-full pt-1">
                {/* PhonePe */}
                <button
                  onClick={() => handleUPIPayment('phonepe')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-wh/95 text-slate-800 hover:bg-wh active:scale-95 transition-all shadow-ss cursor-pointer select-none border border-slate-200/50"
                >
                  <div className="w-5 h-5 rounded bg-[#5f259f] flex items-center justify-center shrink-0">
                    <span className="text-wh font-black text-[10px]">P</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-800 leading-none">PhonePe</span>
                </button>

                {/* Google Pay */}
                <button
                  onClick={() => handleUPIPayment('gpay')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-wh/95 text-slate-800 hover:bg-wh active:scale-95 transition-all shadow-ss cursor-pointer select-none border border-slate-200/50"
                >
                  <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-wh font-black text-[9px]">G</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-800 leading-none">Google Pay</span>
                </button>

                {/* Paytm */}
                <button
                  onClick={() => handleUPIPayment('paytm')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-wh/95 text-slate-800 hover:bg-wh active:scale-95 transition-all shadow-ss cursor-pointer select-none border border-slate-200/50"
                >
                  <div className="w-5 h-5 rounded bg-[#00baf2] flex items-center justify-center shrink-0">
                    <span className="text-wh font-semibold text-[8px] tracking-tighter">pay</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-800 leading-none">Paytm (Highly Stable)</span>
                </button>

                {/* FamPay */}
                <button
                  onClick={() => handleUPIPayment('fampay')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-wh/95 text-slate-800 hover:bg-wh active:scale-95 transition-all shadow-ss cursor-pointer select-none border border-slate-200/50"
                >
                  <div className="w-5 h-5 rounded bg-black flex items-center justify-center shrink-0">
                    <span className="text-amber-400 font-extrabold text-[8px]">Fam</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-800 leading-none">FamPay</span>
                </button>

                {/* Amazon Pay */}
                <button
                  onClick={() => handleUPIPayment('amazonpay')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-wh/95 text-slate-800 hover:bg-wh active:scale-95 transition-all shadow-ss cursor-pointer select-none border border-slate-200/50"
                >
                  <div className="w-5 h-5 rounded bg-[#ff9900] flex items-center justify-center shrink-0">
                    <span className="text-slate-900 font-black text-[10px]">a</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-800 leading-none">Amazon Pay</span>
                </button>

                {/* Navi */}
                <button
                  onClick={() => handleUPIPayment('navi')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-wh/95 text-slate-800 hover:bg-wh active:scale-95 transition-all shadow-ss cursor-pointer select-none border border-slate-200/50"
                >
                  <div className="w-5 h-5 rounded bg-[#00c29f] flex items-center justify-center shrink-0">
                    <span className="text-wh font-extrabold text-[10px]">N</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-800 leading-none">Navi UPI</span>
                </button>

                {/* BHIM UPI */}
                <button
                  onClick={() => handleUPIPayment('bhim')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-wh/95 text-slate-800 hover:bg-wh active:scale-95 transition-all shadow-ss cursor-pointer select-none border border-slate-200/50"
                >
                  <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center shrink-0">
                    <span className="text-orange-500 font-bold text-[8px]">B</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-800 leading-none">BHIM UPI</span>
                </button>
              </div>
            </div>

            {/* Copy utility */}
            <div className="flex flex-wrap items-center gap-2 pt-1 font-sans">
              <button 
                onClick={handleCopyUPI}
                className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-wh/10 border border-wh/15 text-[10px] font-bold text-wh hover:bg-wh/20 transition-all cursor-pointer select-none active:scale-95"
              >
                {copied ? (
                  <>
                    <Check size={11} className="text-green-400 stroke-[3]" />
                    <span className="text-green-400">Copied UPI ID ✓</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Copy UPI ID / ইউপিআই আইডি কপি করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action Tools: Pay Intent, QR Toggle */}
          <div className="flex flex-col sm:flex-row xl:flex-col items-stretch xl:items-end gap-2.5 shrink-0 w-full xl:w-auto self-stretch xl:self-center justify-center">
            {/* Pay Via App (UPI URI Scheme) */}
            <button
              onClick={() => handleUPIPayment('generic')}
              className="bg-sf hover:bg-sf/90 hover:-translate-y-0.5 active:translate-y-0 py-2.5 px-4 text-wh font-extrabold rounded-rs text-[12px] flex items-center justify-center gap-2 shadow-sm transition-all text-center select-none cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Pay via Any App / যেকোনো অ্যাপ</span>
            </button>

            {/* View QR Toggle */}
            <button
              onClick={() => setShowQR(!showQR)}
              className="py-2.5 px-4 bg-wh/10 border border-wh/20 hover:bg-wh/15 rounded-rs text-[11px] font-extrabold text-wh flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer select-none"
            >
              <QrCode size={14} />
              <span>{showQR ? "Hide QR Code" : "Show QR Code / কিউআর কোড"}</span>
            </button>
          </div>
        </div>

        {/* Expandable/Animatable QR Box Section */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-wh/10 mt-4 pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="bg-wh p-2.5 rounded-rm ring-4 ring-wh/5 shadow-md shrink-0 border border-slate-100 flex flex-col items-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=154x154&data=upi://pay?pa=BHARATPE09903189531%40yesbankltd%26pn%3DSayan%2520Kumar%2520Patra%26tn%3DMyCampus%26am%3D${!isNaN(parseFloat(donateAmount)) && parseFloat(donateAmount) > 0 ? parseFloat(donateAmount).toFixed(2) : '30.00'}%26cu%3DINR`}
                    alt="Donate UPI QR"
                    className="w-[140px] h-[140px] object-cover pointer-events-auto rounded-sm"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[8px] font-black text-slate-800 tracking-tight text-center uppercase font-mono mt-1 px-1 bg-slate-50 border border-slate-100 rounded">
                    BHARATPE QR
                  </span>
                </div>
                
                <div className="space-y-2 max-w-sm text-center sm:text-left">
                  <h4 className="text-[14px] font-extrabold text-sf2 flex items-center justify-center sm:justify-start gap-1">
                    <QrCode size={14} /> Scanner QR / স্ক্যান করুন
                  </h4>
                  <p className="text-[11px] text-wh/75 leading-relaxed font-semibold">
                    যেকোনো পেমেন্ট অ্যাপ (Google Pay, PhonePe, Paytm, BHIM, YONO) দিয়ে উপরের কিউআর কোডটি স্ক্যান করে আপনার ইচ্ছেমতো উপহার দিতে পারেন।
                  </p>
                  <p className="text-[9.5px] text-wh/50 tracking-wider uppercase font-bold">
                    * Supports standard secure UPI payments (No additional platform charges)
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🏆 SUPPORTERS SECTION & GRATITUDE WALL (দান ও কৃতজ্ঞতা ওয়াল) */}
      <div className="bg-gradient-to-br from-db via-[#211736] to-db text-white border border-yellow-500/20 rounded-rl p-5 shadow-lg relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-yellow-500/5 blur-xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-sf/5 blur-md pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-wh/10 pb-3">
          <div className="space-y-0.5">
            <h3 className="font-rajdhani text-lg sm:text-xl font-black text-amber-400 flex items-center gap-2 uppercase tracking-tight">
              <Sparkles className="animate-pulse text-amber-400 shrink-0" size={20} />
              উপহারদাতা কৃতজ্ঞতা ওয়াল (Supporters Wall)
            </h3>
            <p className="text-[11px] text-wh/70 font-semibold leading-none">
              যারা আমাদের সার্ভার সচল রাখতে এবং অ্যাপটি ভালোবাসে উপহার পাঠিয়েছেন ❤️
            </p>
          </div>
          
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-[11px] font-black uppercase shadow-md active:scale-95 transition-all select-none cursor-pointer self-start sm:self-center"
          >
            {showReportForm ? <X size={12} /> : <Coffee size={12} />}
            <span>{showReportForm ? 'Close / বন্ধ করুন' : 'Report Gift / উপহারটি জমা করুন'}</span>
          </button>
        </div>

        {/* Support reporting form */}
        <AnimatePresence>
          {showReportForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleReportSupport}
              className="bg-wh/5 border border-wh/10 rounded-rm p-3.5 space-y-3 overflow-hidden text-white"
            >
              <h4 className="text-[12px] font-black uppercase text-sf flex items-center gap-1.5">
                <Coffee size={13} /> পেমেন্ট রিপোর্ট জমা করুন (Verification Request)
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/70 uppercase">আপনার ডিসপ্লে নাম (Your Name)</label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="নিজের নাম লিখুন"
                    className="w-full bg-white border border-bc rounded pr-2 pl-2 py-1.5 text-[11px] font-bold outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/70 uppercase">পরিমাণ (Amount in ₹)</label>
                    <input
                      type="number"
                      required
                      min={10}
                      value={reportAmt}
                      onChange={(e) => setReportAmt(e.target.value)}
                      placeholder="₹30"
                      className="w-full bg-white border border-bc rounded pr-2 pl-2 py-1.5 text-[11px] font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-white/70 uppercase">পেমেন্ট অ্যাপ (UPI App)</label>
                    <select
                      value={reportApp}
                      onChange={(e) => setReportApp(e.target.value)}
                      className="w-full bg-white border border-bc rounded px-1.5 py-1.5 text-[11px] font-bold outline-none"
                    >
                      <option value="phonepe">PhonePe</option>
                      <option value="gpay">Google Pay</option>
                      <option value="paytm">Paytm</option>
                      <option value="bhim">BHIM UPI</option>
                      <option value="fampay">FamPay</option>
                      <option value="amazonpay">Amazon Pay</option>
                      <option value="navi">Navi</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/70 uppercase flex items-center gap-1">
                    UPI Reference ID / Transaction ID (UTR UTR) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={24}
                    value={reportRef}
                    onChange={(e) => setReportRef(e.target.value)}
                    placeholder="১২ সংখ্যার UPI UTR / Ref No লিখুন"
                    className="w-full bg-white text-slate-800 border border-bc rounded pr-2 pl-2 py-1.5 text-[11px] font-mono outline-none uppercase placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-white/70 uppercase">ছোট বার্তা (Message for Developer)</label>
                  <input
                    type="text"
                    maxLength={60}
                    value={reportMsg}
                    onChange={(e) => setReportMsg(e.target.value)}
                    placeholder="যেমন: অ্যাপটি ম্যাপ ট্র্যাকিং-এ খুব সাহায্য করছে! (ঐচ্ছিক)"
                    className="w-full bg-white text-slate-800 border border-bc rounded pr-2 pl-2 py-1.5 text-[11px] font-bold outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-wh/10">
                <span className="text-[9.5px] text-yellow-400/80 font-semibold leading-relaxed max-w-xs sm:max-w-md">
                  ⚠️ সঠিক UPI ট্রানজেকশন রিফারেন্স আইডি দিন। এডমিন ভেরিফাই করার পর সাকসেস হলে নাম কৃতজ্ঞতা দেওয়ালে লাইভ দেখা যাবে।
                </span>
                <button
                  type="submit"
                  disabled={isReportSubmitting}
                  className="bg-sf hover:bg-sf/90 text-white font-extrabold px-5 py-2 rounded text-[11px] shadow-sm select-none shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isReportSubmitting ? 'জমা হচ্ছে...' : 'রিপোর্ট সাবমিট করুন ✓'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Success toast for Support Report */}
        <AnimatePresence>
          {reportSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-green-500/10 border border-green-500/30 p-3.5 rounded-rm text-[11.5px] text-green-300 font-bold space-y-1"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle size={15} />
                <span>উপহার রিপোর্ট সফলভাবে রেকর্ড করা হয়েছে! 🎉</span>
              </div>
              <p className="font-semibold text-wh/75 text-[10px] pl-5">
                আমরা আপনার পেমেন্ট রেফারেন্স মিলিয়ে দেখে ১০ মিনিটের মধ্যে কৃতজ্ঞতা ওয়ালে আপনার নামটি সোনালী বর্ডারে সাজিয়ে দেবো। পাশে থাকার জন্য অনেক অনেক ধন্যবাদ! ❤️
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Approved Supporters Horizontal Frame / Grid Wall */}
        <div className="w-full">
          {(!globalConfig?.supporters || globalConfig.supporters.length === 0) ? (
            <div className="py-8 px-4 rounded-rm border border-wh/5 bg-wh/5 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-amber-400 shrink-0">
                <Coffee size={20} />
              </div>
              <span className="text-[12px] font-black text-amber-300">কৃতজ্ঞতা ওয়াল আপাতত ফাকা আছে</span>
              <p className="text-[10px] text-wh/60 max-w-md font-semibold">
                স্বাধীন MyCampus কে এগিয়ে নিতে ১ কাপ কফি উপহার দিন ও কৃতজ্ঞতা ওয়ালে নিজের নাম স্বর্ণাক্ষরে লিখে ফেলুন! ❤️
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {globalConfig.supporters.map((sup, idx) => {
                // Tier checks for fun display
                const isSuperstar = sup.amount >= 100;
                const isGold = sup.amount >= 50 && sup.amount < 100;
                
                return (
                  <motion.div
                    key={sup.id || idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.03 }}
                    className={`p-3 rounded-rm border relative overflow-hidden transition-all bg-[#0d091a] select-none ${
                      isSuperstar 
                        ? 'border-yellow-500 ring-2 ring-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.25)]' 
                        : isGold 
                        ? 'border-amber-500/60 shadow-md' 
                        : 'border-white/10'
                    }`}
                  >
                    {/* Glowing effect inside superstars */}
                    {isSuperstar && (
                      <div className="absolute -top-10 -right-10 w-20 h-20 bg-yellow-500/10 blur-xl pointer-events-none" />
                    )}
                    
                    <div className="flex items-center gap-2 relative z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        isSuperstar ? 'bg-yellow-500/20 text-yellow-500' : isGold ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {isSuperstar ? <Sparkles size={13} className="animate-spin duration-1000" /> : isGold ? <Trophy size={12} /> : <Heart size={12} className="fill-red-400" />}
                      </div>
                      
                      <div className="min-w-0 flex-1 leading-tight">
                        <span className="text-[11px] font-black text-white truncate block" title={sup.name}>
                          {sup.name}
                        </span>
                        
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9.5px] font-black tracking-tight text-yellow-400">
                            ₹{sup.amount}
                          </span>
                          <span className={`text-[8px] px-1 py-0.2 rounded-sm uppercase font-black tracking-wide ${
                            isSuperstar ? 'bg-yellow-500 text-slate-900' : isGold ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-white/60'
                          }`}>
                            {isSuperstar ? 'Superstar' : isGold ? 'Gold' : 'Donor'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {sup.message && (
                      <p className="text-[9px] text-wh/75 font-semibold italic mt-2 border-t border-wh/5 pt-1.5 leading-snug truncate" title={sup.message}>
                        "{sup.message}"
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 💬 USER FEEDBACK SYSTEM PANEL (ব্যবহারকারী মতামত ও রেটিং গ্যালারি) */}
      <div className="bg-white border border-slate-200 shadow-md rounded-rl p-5 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-9 h-9 rounded-full bg-db/10 text-db flex items-center justify-center shrink-0">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="font-rajdhani text-[16px] sm:text-[18px] font-black text-slate-800 tracking-tight uppercase leading-none">
              অ্যাপ রেটিং ও মতামত (Classmates Opinions & Feedback)
            </h3>
            <p className="text-[10.5px] text-slate-500 mt-1 font-semibold leading-none">
              MyCampus অ্যাপ ও ম্যাপ ট্র্যাকিং সার্ভিসটি ব্যবহারে আপনার অনুভূতি শেয়ার করুন সবার সাথে!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Left Col: Submit Feedbacks */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-100 rounded-rm p-4 space-y-4">
            <h4 className="text-[12px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <Smile size={14} className="text-db" /> আপনার মতামত দিন (Review Form)
            </h4>

            {feedbackSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-100 border border-green-200 text-green-700 p-4 rounded-rm text-[11.5px] font-bold text-center space-y-1.5"
              >
                <span>ধন্যবাদ! আপনার ফিডব্যাক সফলভাবে যুক্ত হয়েছে। 🎉</span>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  ক্যাম্পাসের বন্ধুদের করা রিভিউ ওয়ালে আপনার রেটিংটি এখন লাইভ দেখা যাচ্ছে।
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {/* Visual Interacitve Star Rating Box */}
                <div className="space-y-1 text-center bg-white border border-slate-100 rounded p-2.5 shadow-sm">
                  <span className="text-[9.5px] font-black uppercase text-slate-400 block mb-1">আপনার রেটিং (Tap to rate)</span>
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 transition-all hover:scale-125 focus:scale-95 text-yellow-400"
                      >
                        <Star
                          size={24}
                          className={`cursor-pointer ${
                            star <= feedbackRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-db mt-1.5 block">
                    {feedbackRating === 5 ? '💯 অসাধারণ! ৫/৫ রেটিং' : feedbackRating === 4 ? '⭐ খুব ভালো লেগেছে! ৪/৫' : feedbackRating === 3 ? '👍 ভালো লেগেছে! ৩/৫' : feedbackRating === 2 ? '⚠️ ঠিকঠাক আছে! ২/৫' : '❌ অনেক সংস্কার প্রয়োজন! ১/৫'}
                  </span>
                </div>

                {/* Category selectors */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">কোন বিষয়ের ফিডব্যাক? (Category)</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['General 💬', 'Map Experience 🗺️', 'Speed & Performance ⚡', 'UI Design ✨', 'Syllabus Tracker 📚'].map((cat) => {
                      const cleanName = cat.split(' ')[0] === 'Map' ? 'Map Experience' : cat.split(' ')[0] === 'Speed' ? 'Speed & Performance' : cat.split(' ')[0] === 'UI' ? 'UI Design' : cat.split(' ')[0] === 'Syllabus' ? 'Syllabus Tracker' : 'General';
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFeedbackCategory(cleanName)}
                          className={`px-2.5 py-1.5 rounded-full text-[9px] font-black transition-all cursor-pointer select-none border whitespace-nowrap ${
                            feedbackCategory === cleanName
                              ? 'bg-db border-db text-white shadow-ss'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Text comment */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">মন্তব্য লিখুন (Feedback Description)</span>
                  <textarea
                    required
                    maxLength={200}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="ম্যাপটি খুব চমৎকার কাজ করছে, অনেক ধন্যবাদ আমাদের ক্যাম্পাস অ্যাপ উপহার দেওয়ার জন্য... (বা আপনার ইচ্ছেমতো অনুভুতি)"
                    className="w-full bg-white border border-bc rounded pr-2.5 pl-2.5 py-2 text-[11px] font-bold text-slate-800 h-[85px] max-h-[85px] outline-none placeholder:text-slate-400 placeholder:font-semibold"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold leading-none">
                    <span>* Students only</span>
                    <span>{feedbackComment.length} / 200 chars</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isFeedbackSubmitting}
                  className="w-full bg-db hover:bg-db/90 text-white font-black py-2 rounded text-[11.5px] transition-all cursor-pointer shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5 select-none disabled:opacity-50"
                >
                  <Send size={12} />
                  <span>{isFeedbackSubmitting ? 'ফিডব্যাক সাবমিট হচ্ছে...' : 'ফিডব্যাক ও রেটিং পোষ্ট করুন'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Col: Feed and Stats */}
          <div className="lg:col-span-8 space-y-4">
            {/* Reviews Statistics header card */}
            {(() => {
              const reviews = globalConfig?.feedbacks || [];
              const count = reviews.length;
              const sum = reviews.reduce((acc, current) => acc + current.rating, 0);
              const avg = count ? (sum / count).toFixed(1) : '5.0';
              
              // Percent calculation
              const starCounts = [0, 0, 0, 0, 0]; // Index 0 for 1 star, Index 4 for 5 star
              reviews.forEach(r => starCounts[Math.min(4, Math.max(0, r.rating - 1))]++);
              
              return (
                <div className="bg-slate-50 border border-slate-100 rounded-rm p-3.5 flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="text-center sm:text-left space-y-1 shrink-0">
                    <span className="text-[10px] font-black uppercase text-slate-400">সামগ্রিক ব্যবহারকারী রেটিং</span>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-3xl font-extrabold text-slate-800 tracking-tighter">{avg}</span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-0.5 text-yellow-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11} className={i < Math.round(Number(avg)) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} />
                          ))}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 block">{count} classmates rated</span>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart (Compact, looking exact professional App store reviews layout) */}
                  <div className="flex-1 w-full max-w-xs space-y-1 font-sans">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const countForStars = starCounts[stars - 1];
                      const pct = count ? Math.round((countForStars / count) * 100) : stars === 5 ? 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                          <span className="w-2.5 text-right shrink-0">{stars}★</span>
                          <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-yellow-400 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-6 text-right shrink-0 opacity-80">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* List feedbacks container */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {(!globalConfig?.feedbacks || globalConfig.feedbacks.length === 0) ? (
                <div className="py-12 text-center text-slate-400 border border-slate-100 rounded-rm bg-slate-50/50">
                  <MessageSquare size={24} className="mx-auto text-slate-200 mb-2" />
                  <span className="text-[11.5px] font-bold">এখনো কোনো মতামত দেওয়া হয়নি</span>
                  <p className="text-[9.5px] mt-1">আপনার রেটিং ও মতামত যুক্ত করে প্রথম রিভিউ প্রদানকারী বন্ধু হন! 👍</p>
                </div>
              ) : (
                globalConfig.feedbacks.map((fb, idx) => (
                  <motion.div
                    key={fb.id || idx}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(6, idx) * 0.05 }}
                    className="p-3.5 border border-slate-100 rounded-rm bg-white hover:bg-slate-50/40 hover:border-slate-200/50 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3 text-[11px]">
                      <div className="flex items-center gap-2">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-db/10 border border-db/5 text-db font-rajdhani text-[11px] font-black uppercase flex items-center justify-center shrink-0">
                          {fb.name ? fb.name.substring(0, 2) : 'CM'}
                        </div>
                        <div className="leading-tight">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-800">{fb.name}</span>
                            <span className="text-[8px] px-1 bg-slate-100 border border-slate-200 text-slate-400 rounded-sm font-semibold tracking-wide font-mono uppercase">
                              {fb.roll || 'STUDENT'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {/* Stars rating */}
                            <div className="flex items-center gap-0.2 text-yellow-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={8} className={i < fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} />
                              ))}
                            </div>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-[8px] text-slate-400 font-bold">
                              {new Date(fb.createdAt).toLocaleDateString('bn-BD')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Category tag */}
                      <span className="px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wide bg-db/5 text-db border border-db/10 rounded-full shrink-0">
                        {fb.category || 'Feedback'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 font-bold leading-relaxed whitespace-pre-line pl-1.5 border-l-2 border-slate-200">
                      {fb.comment}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
