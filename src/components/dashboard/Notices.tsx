import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Info, AlertTriangle, XCircle, Search, Bell, Timer, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceConfig } from '../../types';

export default function Notices() {
  const [config, setConfig] = useState<AttendanceConfig>({ subjects: [], materials: [], results: [], notices: [] });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = attendanceService.subscribeToGlobalConfig((data) => {
      setConfig(data);
    });
    return () => unsub();
  }, []);

  const filteredNotices = (config.notices || [])
    .filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.publishedAt - a.publishedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Megaphone size={20} className="text-db" />
          <h2 className="text-lg font-bold text-dt">Official Notices</h2>
        </div>
        <div className="flex bg-wh border border-bc rounded-full px-4 py-1.5 shadow-ss">
          <Search size={16} className="text-lt mr-2 mt-0.5" />
          <input 
            type="text" 
            placeholder="Search notices..." 
            className="bg-transparent border-none focus:outline-none text-xs font-semibold w-full sm:w-40"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotices.length === 0 ? (
          <div className="bg-wh border border-bc rounded-rm py-16 text-center text-mt shadow-ss">
            <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 border border-bc">
              <Bell size={28} className="text-lt" />
            </div>
            <p className="text-sm font-bold text-dt">No active notices found.</p>
            <p className="text-[11px] mt-1 text-lt">Check back later for updates from administration.</p>
          </div>
        ) : (
          filteredNotices.map((n, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={n.id} 
              className="bg-wh border border-bc rounded-rm p-5 hover:border-db transition-all shadow-ss group flex gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                ${n.type === 'critical' ? 'bg-red-50 text-red-600' : 
                  n.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-db'}`}>
                {n.type === 'critical' ? <XCircle size={22} /> : n.type === 'warning' ? <AlertTriangle size={22} /> : <Bell size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight shadow-sm
                    ${n.type === 'critical' ? 'bg-red-100 text-red-700' : 
                      n.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-db'}`}>
                    {n.tag}
                  </span>
                  <span className="text-[10px] text-lt font-bold flex items-center gap-1 ml-auto">
                    <Timer size={12} /> {n.date}
                  </span>
                </div>
                <h3 className="text-[14px] font-bold text-dt leading-tight group-hover:text-db transition-colors">{n.title}</h3>
                <div className="mt-3 flex gap-4">
                  <div className="text-[11px] font-bold text-db flex items-center gap-1 opacity-80">
                    <Info size={12} /> Official Release
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="bg-bg border border-bc rounded-rs p-4 flex gap-3 italic">
        <Info size={16} className="text-db shrink-0 mt-0.5" />
        <p className="text-[11px] text-mt leading-relaxed">
          Official notices are published by the administration department. Please follow the instructions mentioned in alerts immediately. All information provided here is strictly for academic purposes.
        </p>
      </div>
    </div>
  );
}
