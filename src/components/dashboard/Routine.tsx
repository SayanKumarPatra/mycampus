import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceConfig } from '../../types';

export default function Routine() {
  const [config, setConfig] = useState<AttendanceConfig>({ subjects: [], materials: [], results: [], notices: [], routine: [] });
  const [activeDay, setActiveDay] = useState('Monday');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const unsub = attendanceService.subscribeToGlobalConfig((data) => {
      setConfig(data);
    });
    return () => unsub();
  }, []);

  const dayRoutine = (config.routine || []).filter(r => r.day === activeDay);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-dt flex items-center gap-2">
          <Calendar size={20} className="text-db" />
          Class Routine
        </h2>
      </div>

      <div className="flex bg-wh border border-bc rounded-rs overflow-x-auto shadow-ss no-scrollbar">
         {days.map((d, i) => (
           <button 
             key={d} 
             onClick={() => setActiveDay(d)}
             className={`px-5 py-3 text-[11.5px] font-extrabold uppercase whitespace-nowrap transition-all border-r border-bc last:border-r-0
               ${activeDay === d ? 'bg-db text-wh' : 'text-mt hover:bg-bg'}`}
           >
             {d}
           </button>
         ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {dayRoutine.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center text-mt bg-wh border border-bc border-dashed rounded-rm"
            >
              <Calendar size={48} className="mx-auto mb-4 text-bc opacity-50" />
              <p className="text-sm font-bold text-dt">No classes scheduled</p>
              <p className="text-[11px] mt-1 text-lt">Enjoy your day off or check other days.</p>
            </motion.div>
          ) : (
            dayRoutine.map((r, i) => (
              <motion.div 
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-wh border border-bc rounded-rm p-4 shadow-ss flex gap-4 transition-all hover:border-db 
                   ${r.isBreak ? 'bg-bg/40 opacity-70 border-dashed' : ''}`}
              >
                 <div className="shrink-0 pt-0.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${r.isBreak ? 'bg-lt' : 'bg-db'}`} />
                    <div className="w-[1px] h-full bg-bc mx-auto mt-1" />
                 </div>
                 <div className="flex-1">
                    <div className="flex items-center gap-2 text-[10px] text-mt font-bold mb-1">
                       <Clock size={12} className="text-lt" />
                       {r.time}
                    </div>
                    <h4 className={`text-[14px] font-bold ${r.isBreak ? 'text-lt italic' : 'text-dt'}`}>
                       {r.subj}
                    </h4>
                    {!r.isBreak && (
                       <div className="mt-3 flex flex-wrap gap-4">
                          <div className="flex items-center gap-1.5 text-[10px] text-mt">
                             <MapPin size={12} className="text-db" />
                             {r.room}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-mt">
                             <span className="w-1.5 h-1.5 rounded-full bg-sf" />
                             {r.prof}
                          </div>
                       </div>
                    )}
                 </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
      
      <div className="bg-bg border border-bc rounded-rl p-4 flex gap-3">
         <Info size={16} className="text-db shrink-0 mt-0.5" />
         <p className="text-[11px] text-mt leading-relaxed italic">
            The class routine is strictly maintained by the academic department. Any sudden changes or cancellations will be notified via the official notices section.
         </p>
      </div>
    </div>
  );
}
