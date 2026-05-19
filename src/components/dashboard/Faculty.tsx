import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Book, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceConfig } from '../../types';

export default function Faculty() {
  const [searchTerm, setSearchTerm] = useState('');
  const [config, setConfig] = useState<AttendanceConfig>({ subjects: [], materials: [], results: [], notices: [], routine: [], faculties: [] });

  useEffect(() => {
    const unsub = attendanceService.subscribeToGlobalConfig((data) => {
      setConfig(data);
    });
    return () => unsub();
  }, []);

  const facultyList = config.faculties || [];

  const filteredFaculty = facultyList.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-rajdhani text-2xl font-bold text-dt">Faculty Directory</h2>
          <p className="text-xs text-mt uppercase tracking-widest font-bold">Connect with your professors</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={18} />
          <input 
            type="text" 
            placeholder="Search name or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[260px] pl-10 pr-4 py-2.5 bg-wh border border-bc rounded-lg focus:outline-none focus:ring-2 focus:ring-db/20 focus:border-db text-sm font-semibold transition-all shadow-ss"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFaculty.map((f, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-wh border border-bc rounded-rl overflow-hidden shadow-ss transition-all hover:border-sf hover:shadow-md group"
          >
            <div className="p-4 flex gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full border-2 border-sf/20 overflow-hidden shadow-inner group-hover:border-sf transition-colors">
                  <img src={f.image} className="w-full h-full object-cover" alt={f.name} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sf rounded-full flex items-center justify-center text-db">
                  <Star size={12} className="fill-db" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-dt truncate">{f.name}</h3>
                <p className="text-[10px] text-sf font-bold uppercase tracking-wide leading-tight">{f.designation}</p>
                
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {f.subjects.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-bg border border-bc rounded-full text-[9px] font-bold text-mt flex items-center gap-1">
                      <Book size={8} />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-bc bg-bg/30">
              <a href={`mailto:${f.email}`} className="flex items-center justify-center gap-2 p-3 text-[10px] font-bold text-mt hover:bg-wh hover:text-db transition-colors border-r border-bc">
                <Mail size={14} className="text-db" />
                EMAIL
              </a>
              <a href={`tel:${f.phone}`} className="flex items-center justify-center gap-2 p-3 text-[10px] font-bold text-mt hover:bg-wh hover:text-db transition-colors">
                <Phone size={14} className="text-green-600" />
                CALL
              </a>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredFaculty.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4">
             <User size={32} className="text-lt" />
          </div>
          <h3 className="text-dt font-bold">No faculty member found</h3>
          <p className="text-mt text-xs">Try searching with a different name or subject.</p>
        </div>
      )}
    </div>
  );
}
