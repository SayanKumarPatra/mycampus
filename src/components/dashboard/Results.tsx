import React, { useState, useEffect } from 'react';
import { Award, Download, ExternalLink, Info, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceConfig } from '../../types';

export default function Results() {
  const [config, setConfig] = useState<AttendanceConfig>({ subjects: [], materials: [], results: [] });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setConfig(attendanceService.getGlobalConfig());
  }, []);

  const filteredResults = (config.results || []).filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.publishedAt - a.publishedAt);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Award size={20} className="text-db" />
          <h2 className="text-lg font-bold text-dt">Examination Results</h2>
        </div>
        <div className="flex bg-wh border border-bc rounded-full px-3 py-1.5 shadow-ss">
          <Search size={16} className="text-lt mr-2 mt-0.5" />
          <input 
            type="text" 
            placeholder="Search results..." 
            className="bg-transparent border-none focus:outline-none text-xs font-semibold w-full sm:w-40"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-wh border border-bc rounded-rm overflow-hidden shadow-ss">
        {filteredResults.length === 0 ? (
          <div className="py-16 text-center text-mt">
            <Award size={48} className="mx-auto mb-4 text-bc opacity-50" />
            <p className="text-sm">No exam results published yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-bc">
            {filteredResults.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-bg/50 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Award size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-dt truncate">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-lt">
                    <span className="font-bold text-sf uppercase tracking-tighter">Official Result</span>
                    <span className="w-1 h-1 rounded-full bg-bc"></span>
                    <span>Published: {new Date(item.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <a 
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 border border-bc rounded-rs flex items-center gap-2 text-[11px] font-bold text-db hover:bg-db hover:text-wh hover:border-db transition-all shrink-0 shadow-ss"
                >
                  <ExternalLink size={14} />
                  <span>View Result</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-orange-50 border border-orange-100 rounded-rs flex gap-3">
         <Info size={18} className="text-sf shrink-0 mt-0.5" />
         <p className="text-[11px] text-[#7a4a10] leading-relaxed">
            All result links are managed by the administration. For any discrepancies in marks or difficulties in accessing the links, please contact the controller of examinations.
         </p>
      </div>
    </div>
  );
}
