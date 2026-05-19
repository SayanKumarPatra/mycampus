import React, { useState, useEffect } from 'react';
import { Notebook, FileText, Download, ExternalLink, Search, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceConfig } from '../../types';
import { SUBJECTS } from '../../constants';

export default function Notes() {
  const [config, setConfig] = useState<AttendanceConfig>({ subjects: [], materials: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    setConfig(attendanceService.getGlobalConfig());
  }, []);

  const filteredMaterials = (config.materials || []).filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || m.subjectCode === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Notebook size={20} className="text-db" />
          <h2 className="text-lg font-bold text-dt">Study Materials</h2>
        </div>
        <div className="flex bg-wh border border-bc rounded-full px-3 py-1.5 shadow-ss">
          <Search size={16} className="text-lt mr-2 mt-0.5" />
          <input 
            type="text" 
            placeholder="Search notes..." 
            className="bg-transparent border-none focus:outline-none text-xs font-semibold w-full sm:w-40"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button 
          onClick={() => setSelectedSubject('all')}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
            selectedSubject === 'all' 
            ? 'bg-db text-wh border-db' 
            : 'bg-wh text-mt border-bc hover:border-db'
          }`}
        >
          All Subjects
        </button>
        {SUBJECTS.map(s => (
          <button 
            key={s.code}
            onClick={() => setSelectedSubject(s.code)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
              selectedSubject === s.code 
              ? 'bg-db text-wh border-db' 
              : 'bg-wh text-mt border-bc hover:border-db'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="bg-wh border border-bc rounded-rm overflow-hidden shadow-ss">
        {filteredMaterials.length === 0 ? (
          <div className="py-16 text-center text-mt">
            <Notebook size={48} className="mx-auto mb-4 text-bc opacity-50" />
            <p className="text-sm">No study materials found for your selection.</p>
          </div>
        ) : (
          <div className="divide-y divide-bc">
            {filteredMaterials.map((item, idx) => {
              const subj = SUBJECTS.find(s => s.code === item.subjectCode);
              return (
                <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-bg/50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-dt truncate">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-lt">
                      <span className="font-bold text-db uppercase tracking-tighter">{subj?.name || item.subjectCode}</span>
                      <span className="w-1 h-1 rounded-full bg-bc"></span>
                      <span>Shared by Admin</span>
                      <span className="w-1 h-1 rounded-full bg-bc"></span>
                      <span>{new Date(item.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a 
                    href={item.driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 border border-bc rounded-rs flex items-center justify-center text-mt hover:bg-db hover:text-wh hover:border-db transition-all shrink-0"
                    title="Open Google Drive Link"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
