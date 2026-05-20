import { useState, useEffect } from 'react';
import { CalendarCheck, Pencil, ChartPie, History, Check, X, Info, ChevronRight, Loader2, RotateCcw, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, AttendanceRecord, AttendanceSubject, AttendanceConfig } from '../../types';
import { attendanceService } from '../../services/attendanceService';
import { SUBJECTS } from '../../constants';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface AttendanceProps {
  user: User;
}

export default function Attendance({ user }: AttendanceProps) {
  const [markedToday, setMarkedToday] = useState<Record<number, 'present' | 'absent' | 'not-marked'>>({});
  const [attData, setAttData] = useState<AttendanceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'subj'>('week');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [attConfig, setAttConfig] = useState<AttendanceConfig>({ subjects: [] });

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      const data = await attendanceService.getAttendance(user.id);
      setAttData(data.records);
      
      const today = getLocalDateString();
      const todayRec = data.records.find(r => r.date === today);
      if (todayRec) {
        const initial: Record<number, 'present' | 'absent' | 'not-marked'> = {};
        todayRec.subjects?.forEach((s, i) => {
          if (s.status !== 'not-marked') initial[i] = s.status as any;
        });
        setMarkedToday(initial);
      } else {
        setMarkedToday({});
      }
    };

    fetchAndSubscribe();

    const unsubConfig = attendanceService.subscribeToGlobalConfig((data) => {
      setAttConfig(data);
    });

    return () => {
      unsubConfig();
    };
  }, [user.id]);

  const handleMark = (idx: number, status: 'present' | 'absent') => {
    setMarkedToday(prev => ({ ...prev, [idx]: status }));
    setHasChanges(true);
  };

  const handleReset = (idx: number) => {
    setMarkedToday(prev => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const today = getLocalDateString();
    const record: AttendanceRecord = {
      date: today,
      subjects: SUBJECTS.map((s, i) => ({
        ...s,
        status: markedToday[i] || 'not-marked'
      })),
      savedAt: Date.now()
    };
    
    await attendanceService.saveAttendance(user.id, record);
    setAttData(prev => {
      const idx = prev.findIndex(p => p.date === today);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [...prev, record];
    });
    
    setTimeout(() => {
      setSaving(false);
      setHasChanges(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 600);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(22);
    doc.setTextColor(7, 21, 64); // #071540 (db color)
    doc.text('EIILM MyCampus', 14, 22);
    
    doc.setFontSize(16);
    doc.text('Attendance Report', 14, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Student: ${user.name}`, 14, 40);
    doc.text(`Roll No: ${user.roll}`, 14, 45);
    doc.text(`Department: ${user.department} | Semester: ${user.semester}`, 14, 50);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 55);
    
    // 1. Subject-wise Summary Table
    doc.setFontSize(14);
    doc.setTextColor(7, 21, 64);
    doc.text('Subject-wise Performance Summary', 14, 65);

    const summaryData = SUBJECTS.map((s, idx) => {
      const config = attConfig.subjects.find(c => c.code === s.code) || { code: s.code, totalClasses: 0 };
      const stats = attData.reduce((acc, curr) => {
        const subjAtt = curr.subjects?.[idx];
        if (subjAtt && subjAtt.status === 'present') {
          acc.present++;
        }
        return acc;
      }, { present: 0 });
      
      const denominator = Math.max(stats.present, config.totalClasses);
      const pct = denominator ? Math.round((stats.present / denominator) * 100) : 0;
      return [
        s.name,
        s.code,
        `${stats.present} / ${denominator}`,
        `${pct}%`,
        pct >= 75 ? 'Satisfactory' : 'Critical'
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [['Subject Name', 'Code', 'Attended', 'Percentage', 'Status']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [7, 21, 64] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 }
      }
    });

    // 2. Recent History Table
    const lastTable = (doc as any).lastAutoTable;
    const finalY = lastTable ? lastTable.finalY : 70;
    
    doc.setFontSize(14);
    doc.setTextColor(7, 21, 64);
    doc.text('Recent Attendance History', 14, finalY + 15);

    const historyData = [...attData]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30) // Show last 30 entries
      .map(r => {
        const p = (r.subjects || []).filter(s => s.status === 'present').length;
        const t = (r.subjects || []).filter(s => s.status !== 'not-marked').length;
        const pct = t ? Math.round((p/t)*100) : 0;
        return [
          new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
          `${p} / ${t}`,
          `${pct}%`,
          pct >= 75 ? 'Present' : 'Short Attend.'
        ];
      });

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Date', 'Classes Attended', 'Daily Percentage', 'Status']],
      body: historyData,
      theme: 'striped',
      headStyles: { fillColor: [100, 100, 100] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`Attendance_Report_${user.name.replace(/\s+/g, '_')}.pdf`);
  };

  // Weekly calculations
  const today = new Date();
  const dow = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dow);
  
  const weeklyRecords = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dk = getLocalDateString(d);
    const rec = attData.find(r => r.date === dk);
    let status = 'none';
    if (rec) {
      const p = (rec.subjects || []).filter(s => s.status === 'present').length;
      const t = (rec.subjects || []).filter(s => s.status !== 'not-marked').length;
      status = t > 0 ? (p/t >= 0.5 ? 'present' : 'absent') : 'none';
    }
    return { date: d.getDate(), dk, status, label: ['Su','Mo','Tu','We','Th','Fr','Sa'][i] };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-dt flex items-center gap-2">
          <CalendarCheck size={20} className="text-db" />
          Attendance Management
        </h2>
        <span className="px-3 py-1 bg-db/10 text-db text-[11px] font-bold rounded-full">
          {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-db to-db3 p-4 rounded-rl text-wh shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-wh/10 rounded-full blur-xl"></div>
          <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Overall Attendance</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-rajdhani font-bold">
              {(() => {
                let totalC = 0;
                let presentC = 0;
                attData.forEach(r => {
                  r.subjects?.forEach(s => {
                    if (s.status !== 'not-marked') {
                      totalC++;
                      if (s.status === 'present') presentC++;
                    }
                  });
                });
                return totalC ? Math.round((presentC / totalC) * 100) : 0;
              })()}%
            </span>
            <span className="text-[10px] font-bold">AVG</span>
          </div>
        </div>
        <div className="bg-wh border border-bc p-4 rounded-rl shadow-sm flex flex-col justify-between">
           <p className="text-[10px] font-bold text-lt uppercase tracking-widest">Total Presence</p>
           <div className="mt-2 flex items-baseline gap-1 text-dt">
             <span className="text-2xl font-rajdhani font-bold">
              {attData.reduce((acc, curr) => {
                const dayPresent = curr.subjects?.some(s => s.status === 'present');
                return acc + (dayPresent ? 1 : 0);
              }, 0)}
             </span>
             <span className="text-[10px] font-bold text-mt">DAYS</span>
           </div>
        </div>
      </div>

      {/* Mark Section */}
      <div className="bg-wh border border-bc rounded-rm p-4 sm:p-5 shadow-ss">
        <div className="flex items-center gap-2 mb-4">
          <Pencil size={18} className="text-db" />
          <h3 className="text-[14px] font-bold text-dt">Mark Today's Progress</h3>
        </div>
        
        <div className="space-y-2.5">
          {SUBJECTS.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-bg border border-bc rounded-rs gap-4">
              <div className="min-w-0">
                <h4 className="text-[12px] font-bold text-dt truncate">{s.name}</h4>
                <p className="text-[10px] text-lt mt-0.5">{s.code}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button 
                  onClick={() => handleMark(idx, 'present')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5
                    ${markedToday[idx] === 'present' ? 'bg-green-600 text-wh' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                >
                  <Check size={12} /> Present
                </button>
                <button 
                  onClick={() => handleMark(idx, 'absent')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5
                    ${markedToday[idx] === 'absent' ? 'bg-red-600 text-wh' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                >
                  <X size={12} /> Absent
                </button>
                {markedToday[idx] && (
                  <button 
                    onClick={() => handleReset(idx)}
                    className="p-1.5 rounded-md bg-bc/10 text-lt hover:bg-bc/20 transition-all"
                    title='Reset'
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-bc">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[11px] text-dt font-bold">
               <Info size={14} className="text-sf" />
               <span>Today's Session</span>
            </div>
            <span className="text-[10px] text-lt ml-5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
          </div>
          <div className="flex items-center gap-3">
             <AnimatePresence>
               {showSuccess && (
                 <motion.span 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0 }}
                   className="text-[11px] font-bold text-green-600 flex items-center gap-1"
                 >
                   <Check size={14} /> Updated Successfully
                 </motion.span>
               )}
             </AnimatePresence>
             <button 
               onClick={handleSave}
               disabled={saving || (!hasChanges && Object.keys(markedToday).length > 0)}
               className={`btn-primary !w-fit px-8 py-2.5 text-xs relative overflow-hidden transition-all
                 ${hasChanges ? 'ring-2 ring-db ring-offset-2' : ''}`}
             >
               {saving ? <Loader2 size={16} className="spin-anim" /> : <Check size={16} />}
               {saving ? 'Syncing...' : hasChanges ? 'Update Database' : 'Attendance Saved'}
             </button>
          </div>
        </div>
      </div>

      {/* Subject Wise Performance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SUBJECTS.map((s, idx) => {
          const config = attConfig.subjects.find(c => c.code === s.code) || { code: s.code, totalClasses: 0 };
          const stats = attData.reduce((acc, curr) => {
            const subjAtt = curr.subjects?.[idx];
            if (subjAtt && subjAtt.status === 'present') {
              acc.present++;
            }
            return acc;
          }, { present: 0 });
          
          const denominator = Math.max(stats.present, config.totalClasses);
          const pct = denominator ? Math.round((stats.present / denominator) * 100) : 0;
          
          return (
            <div key={idx} className="bg-wh border border-bc rounded-rm p-3.5 flex items-center gap-4 shadow-ss">
              <div className="flex-1 min-w-0">
                <h4 className="text-[12px] font-bold text-dt truncate">{s.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${pct >= 75 ? 'bg-db' : 'bg-red-500'}`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-dt">{pct}%</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-[9px] text-lt uppercase font-bold block mb-0.5">Classes</span>
                <span className="text-xs font-bold text-db">{stats.present}/{denominator}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reports Section */}
      <div>
        <div className="flex items-center gap-2 mb-3.5">
          <ChartPie size={18} className="text-db" />
          <h3 className="text-sm font-bold text-dt">Attendance Analytics</h3>
        </div>

        <div className="flex bg-wh border border-bc rounded-rs overflow-hidden shadow-ss mb-4">
           {['week', 'month', 'subj'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`flex-1 py-2.5 text-[11.5px] font-extrabold uppercase tracking-tight transition-all
                  ${activeTab === tab ? 'bg-db text-wh' : 'text-mt hover:bg-bg'}`}
             >
               {tab}ly
             </button>
           ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'week' && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 10 }}
              className="bg-wh border border-bc rounded-rm p-4 shadow-ss"
            >
              <h4 className="text-xs font-bold text-dt mb-4">Current Week Overview</h4>
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                 {weeklyRecords.map((r, i) => (
                   <div key={i} className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-lt">{r.label}</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border transition-all
                        ${r.status === 'present' ? 'bg-db text-wh border-db' : 
                          r.status === 'absent' ? 'bg-red-50 text-red-600 border-red-200' : 
                          'bg-bg text-lt border-bc'}
                        ${r.dk === getLocalDateString() ? 'ring-2 ring-offset-2 ring-sf' : ''}`}>
                         {r.date}
                      </div>
                   </div>
                 ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'month' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-wh border border-bc rounded-rm p-4 shadow-ss"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-dt">Monthly Report Grid</h4>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-db"></div>
                    <span className="text-[9px] font-bold text-lt">P</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-[9px] font-bold text-lt">A</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = String(now.getMonth() + 1).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day.toString().padStart(2, '0')}`;
                  const rec = attData.find(r => r.date === dateStr);
                  let bgColor = 'bg-bg';
                  if (rec) {
                    const p = (rec.subjects || []).filter(s => s.status === 'present').length;
                    const t = (rec.subjects || []).filter(s => s.status !== 'not-marked').length;
                    bgColor = t > 0 ? (p/t >= 0.5 ? 'bg-db' : 'bg-red-500') : 'bg-bc';
                  }
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square flex items-center justify-center rounded-sm text-[9px] font-bold border border-bc/30
                        ${bgColor === 'bg-db' ? 'text-wh' : bgColor === 'bg-red-500' ? 'text-wh' : 'text-lt'} ${bgColor}`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <History size={18} className="text-db" />
            <h3 className="text-sm font-bold text-dt">Recent History</h3>
          </div>
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 px-3 py-1.5 bg-wh border border-bc rounded-rs text-[11px] font-bold text-db hover:border-db transition-all shadow-sm"
          >
            <FileDown size={14} />
            Download PDF Report
          </button>
        </div>
        <div className="bg-wh border border-bc rounded-rm shadow-ss overflow-hidden">
           {attData.length === 0 ? (
             <div className="py-12 text-center text-mt">
                <CalendarCheck size={42} className="mx-auto mb-3 text-bc opacity-50" />
                <p className="text-sm">No attendance records yet.</p>
             </div>
           ) : (
             <div className="divide-y divide-bc">
                {[...attData].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 7).map((r, i) => {
                  const p = (r.subjects || []).filter(s => s.status === 'present').length;
                  const t = (r.subjects || []).filter(s => s.status !== 'not-marked').length;
                  const pct = t ? Math.round((p/t)*100) : 0;
                  return (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-bg/50 transition-colors">
                       <div>
                          <p className="text-[13px] font-bold text-dt leading-tight">
                            {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-lt mt-1">{p} present · {t-p} absent</p>
                       </div>
                       <div className={`font-rajdhani text-xl font-bold ${pct >= 75 ? 'text-db' : pct >= 50 ? 'text-sf' : 'text-red-600'}`}>
                          {pct}%
                       </div>
                    </div>
                  );
                })}
             </div>
           )}
        </div>
      </div>

    </div>
  );
}
