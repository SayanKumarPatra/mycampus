import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Key, Eye, EyeOff, Users as UsersIcon, Clock, CheckCircle, ShieldAlert, Calendar, GraduationCap, Building, Phone, Trash2, Search, Notebook, Award, Megaphone, MapPin, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserStatus } from '../../types';
import { userService } from '../../services/userService';
import { attendanceService } from '../../services/attendanceService';
import { ADMIN_PASS, SUBJECTS } from '../../constants';
import { AttendanceConfig } from '../../types';
import { getInitials } from '../../utils';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isLogged, setIsLogged] = useState(false);
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all' | 'attendance' | 'materials' | 'results' | 'notices' | 'routine' | 'faculty'>('pending');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [attConfig, setAttConfig] = useState<AttendanceConfig>({ subjects: [], materials: [], results: [], notices: [], routine: [], faculties: [] });
  const [newMaterial, setNewMaterial] = useState({ subjectCode: '', title: '', driveLink: '' });
  const [newResult, setNewResult] = useState({ title: '', link: '' });
  const [newNotice, setNewNotice] = useState({ title: '', tag: 'Academic', type: 'info' as 'info' | 'critical' | 'warning' });
  const [newRoutine, setNewRoutine] = useState({ day: 'Monday', time: '', subj: '', room: '', prof: '', isBreak: false });
  const [newFaculty, setNewFaculty] = useState({ name: '', designation: '', subjects: '', email: '', phone: '', image: '' });

  useEffect(() => {
    if (isLogged) {
      setAttConfig(attendanceService.getGlobalConfig());
      return userService.subscribeToUsers((data) => {
        setUsers(data);
      });
    }
  }, [isLogged]);

  const handleUpdateAttConfig = (code: string, delta: number) => {
    const newConfig = { ...attConfig };
    const subjects = newConfig.subjects || [];
    const idx = subjects.findIndex(s => s.code === code);
    if (idx !== -1) {
      subjects[idx].totalClasses = Math.max(0, subjects[idx].totalClasses + delta);
    } else {
      subjects.push({ code, totalClasses: Math.max(0, delta) });
    }
    newConfig.subjects = subjects;
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
    setUpdateMsg(`Attendance updated for ${code} ✓`);
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.subjectCode || !newMaterial.title || !newMaterial.driveLink) return;

    const material = {
      id: `mat_${Date.now()}`,
      ...newMaterial,
      uploadedAt: Date.now()
    };

    const newConfig = { ...attConfig };
    newConfig.materials = [...(newConfig.materials || []), material];
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
    setNewMaterial({ subjectCode: '', title: '', driveLink: '' });
    setUpdateMsg('Study material added ✓');
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteMaterial = (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.materials = (newConfig.materials || []).filter(m => m.id !== id);
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
  };

  const handleAddResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResult.title || !newResult.link) return;

    const result = {
      id: `res_${Date.now()}`,
      ...newResult,
      publishedAt: Date.now()
    };

    const newConfig = { ...attConfig };
    newConfig.results = [...(newConfig.results || []), result];
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
    setNewResult({ title: '', link: '' });
    setUpdateMsg('Exam result link added ✓');
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteResult = (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.results = (newConfig.results || []).filter(r => r.id !== id);
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
  };

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.tag) return;

    const notice = {
      id: `notice_${Date.now()}`,
      ...newNotice,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      publishedAt: Date.now()
    };

    const newConfig = { ...attConfig };
    newConfig.notices = [...(newConfig.notices || []), notice];
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
    setNewNotice({ title: '', tag: 'Academic', type: 'info' });
    setUpdateMsg('Notice published ✓');
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteNotice = (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.notices = (newConfig.notices || []).filter(n => n.id !== id);
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
  };

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutine.time || !newRoutine.subj) return;

    const routineItem = {
      id: `rout_${Date.now()}`,
      ...newRoutine
    };

    const newConfig = { ...attConfig };
    newConfig.routine = [...(newConfig.routine || []), routineItem];
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
    setNewRoutine({ day: newRoutine.day, time: '', subj: '', room: '', prof: '', isBreak: false });
    setUpdateMsg('Routine updated ✓');
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteRoutine = (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.routine = (newConfig.routine || []).filter(r => r.id !== id);
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
  };

  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.designation) return;

    const faculty = {
      id: `fac_${Date.now()}`,
      ...newFaculty,
      subjects: newFaculty.subjects.split(',').map(s => s.trim()).filter(s => s !== ''),
      addedAt: Date.now()
    };

    const newConfig = { ...attConfig };
    newConfig.faculties = [...(newConfig.faculties || []), faculty];
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
    setNewFaculty({ name: '', designation: '', subjects: '', email: '', phone: '', image: '' });
    setUpdateMsg('Faculty added ✓');
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteFaculty = (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.faculties = (newConfig.faculties || []).filter(f => f.id !== id);
    setAttConfig(newConfig);
    attendanceService.saveGlobalConfig(newConfig);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_PASS) {
      setIsLogged(true);
      setError('');
    } else {
      setError('Incorrect admin password.');
    }
  };

  const handleStatusUpdate = async (email: string, status: UserStatus) => {
    try {
      await userService.updateStatus(email, status);
      setUpdateMsg(`User status updated to ${status}! ✓`);
      setTimeout(() => setUpdateMsg(''), 3000);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDeleteUser = async (email: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently DELETE ${name}? This action cannot be undone.`)) {
      try {
        await userService.deleteUser(email);
        setUpdateMsg(`User ${name} has been deleted permanently. ✓`);
        setTimeout(() => setUpdateMsg(''), 3000);
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  const stats = {
    total: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length
  };

  useEffect(() => {
    // If we have data but no pending users, switch to 'all' or 'approved' automatically
    if (users.length > 0 && stats.pending === 0 && activeTab === 'pending') {
      setActiveTab(stats.approved > 0 ? 'approved' : 'all');
    }
  }, [users.length, stats.pending, stats.approved]);

  const filteredUsers = users
    .filter(u => {
      const matchesTab = activeTab === 'all' ? true : u.status === activeTab;
      const q = searchQuery.toLowerCase();
      const matchesSearch = u.name.toLowerCase().includes(q) || u.roll.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    })
    .sort((a, b) => b.registeredAt - a.registeredAt);

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col">
      {/* Header */}
      <header className="h-[58px] bg-db px-5 flex items-center gap-3 shrink-0 shadow-lg z-10 transition-colors">
        <ShieldCheck className="text-sf" size={24} />
        <div className="flex-1">
          <h1 className="font-rajdhani text-[20px] font-black leading-tight tracking-tighter mt-1">
             <span className="text-wh">My</span>
             <span className="text-sf italic">Campus</span>
             <span className="text-wh/60 ml-2 text-xs font-normal uppercase tracking-widest italic">Admin</span>
          </h1>
          <p className="text-[9px] text-wh/40 uppercase tracking-widest font-bold -mt-0.5">Database Control Center</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 bg-wh/10 hover:bg-wh/20 text-wh rounded-rs transition-colors flex items-center justify-center">
          <X size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-5">
        {!isLogged ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-[360px] mx-auto mt-12 bg-wh rounded-rl p-8 shadow-sm text-center"
          >
            <div className="w-18 h-18 bg-db rounded-full flex items-center justify-center mx-auto mb-4 border-3 border-sf">
              <ShieldCheck className="text-wh" size={32} />
            </div>
            <h2 className="font-rajdhani text-xl font-bold text-db mb-1">Admin Verification</h2>
            <p className="text-xs text-mt mb-6">Enter admin password to manage student registrations</p>
            
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-rs text-red-600 text-[11px] font-semibold mb-4 text-left">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-bold text-dt uppercase tracking-wider">Admin Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                  <input 
                    type={showPass ? "text" : "password"}
                    className="inp pl-9 pr-10 py-2.5" 
                    placeholder="Enter password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-lt">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary">Verify & Login</button>
            </form>
          </motion.div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full w-fit">
              <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
              <span className="text-[11px] font-bold text-green-700">Live Realtime Updates</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total', value: stats.total, color: 'text-db' },
                { label: 'Pending', value: stats.pending, color: 'text-sf' },
                { label: 'Approved', value: stats.approved, color: 'text-green-600' }
              ].map((s, i) => (
                <div key={i} className="bg-wh rounded-rm p-4 text-center border border-bc shadow-ss hover:shadow-sm transition-all">
                  <span className={`block font-rajdhani text-3xl font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-[10px] font-bold text-mt uppercase tracking-tight">{s.label}</span>
                </div>
              ))}
            </div>

        <div className="flex bg-wh border border-bc rounded-rm overflow-hidden shadow-ss flex-col">
          <div className="p-3 border-b border-bc bg-bg/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={16} />
              <input 
                type="text"
                placeholder="Search database..."
                className="w-full bg-wh border border-bc rounded-rs pl-9 pr-4 py-2 text-[12px] focus:outline-none focus:border-db transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="bg-bg/30 px-3 py-1.5 border-b border-bc">
            <span className="text-[9px] font-black text-lt uppercase tracking-widest">Student Management</span>
          </div>
          <div className="flex overflow-x-auto no-scrollbar border-b border-bc">
            {[
              { id: 'pending', label: 'Pending', icon: Clock, badge: stats.pending },
              { id: 'approved', label: 'Approved', icon: CheckCircle, badge: stats.approved },
              { id: 'rejected', label: 'Rejected', icon: ShieldAlert, badge: stats.rejected },
              { id: 'all', label: 'All Users', icon: UsersIcon, badge: stats.total },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`shrink-0 py-3 px-4 text-[11px] font-bold flex items-center justify-center gap-2 transition-all border-r border-bc last:border-r-0
                  ${activeTab === t.id ? 'bg-db text-wh' : 'text-mt hover:bg-bg'}`}
              >
                <t.icon size={13} />
                {t.label}
                {t.badge > 0 && <span className={`px-1.5 py-0.5 text-wh text-[9px] rounded-full ${t.id === 'pending' ? 'bg-red-600' : 'bg-db'}`}>{t.badge}</span>}
              </button>
            ))}
          </div>

          <div className="bg-bg/30 px-3 py-1.5 border-b border-bc">
            <span className="text-[9px] font-black text-lt uppercase tracking-widest">Academic Control</span>
          </div>
          <div className="flex overflow-x-auto no-scrollbar">
            {[
              { id: 'attendance', label: 'Attendance', icon: Calendar },
              { id: 'materials', label: 'Materials', icon: Notebook },
              { id: 'results', label: 'Results', icon: Award },
              { id: 'notices', label: 'Notices', icon: Megaphone },
              { id: 'routine', label: 'Routine', icon: Calendar },
              { id: 'faculty', label: 'Faculty', icon: GraduationCap }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`shrink-0 py-3 px-4 text-[11px] font-bold flex items-center justify-center gap-2 transition-all border-r border-bc last:border-r-0
                  ${activeTab === t.id ? 'bg-db text-wh' : 'text-mt hover:bg-bg'}`}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

            <AnimatePresence>
              {updateMsg && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-2.5 bg-green-50 border border-green-200 rounded-rs text-green-700 text-[11px] font-bold text-center"
                >
                  {updateMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {activeTab === 'attendance' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex items-center gap-2 mb-2">
                       <Calendar size={18} className="text-db" />
                       <h3 className="text-sm font-bold text-dt">Total Classes Held (Global)</h3>
                    </div>
                    <p className="text-[11px] text-mt leading-relaxed bg-bg p-3 rounded-rs border border-bc">
                      Set how many classes have been conducted in total for each subject.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SUBJECTS.map((s) => {
                        const config = (attConfig.subjects || []).find(c => c.code === s.code) || { code: s.code, totalClasses: 0 };
                        return (
                          <div key={s.code} className="flex items-center justify-between p-3 bg-bg border border-bc rounded-rs">
                            <div className="min-w-0">
                               <h4 className="text-[12px] font-bold text-dt truncate">{s.name}</h4>
                               <p className="text-[10px] text-lt uppercase font-black">{s.code}</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <button 
                                 onClick={() => handleUpdateAttConfig(s.code, -1)}
                                 className="w-8 h-8 rounded-full border border-bc flex items-center justify-center text-mt hover:bg-wh hover:text-red-500 transition-all font-bold"
                               >
                                 -
                               </button>
                               <span className="w-10 text-center font-rajdhani text-xl font-bold text-db">
                                 {config.totalClasses}
                               </span>
                               <button 
                                 onClick={() => handleUpdateAttConfig(s.code, 1)}
                                 className="w-8 h-8 rounded-full border border-bc flex items-center justify-center text-mt hover:bg-wh hover:text-db transition-all font-bold"
                               >
                                 +
                               </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : activeTab === 'materials' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                   >
                    <div className="flex items-center gap-2">
                       <Notebook size={18} className="text-db" />
                       <h3 className="text-sm font-bold text-dt">Study Materials Management</h3>
                    </div>
                    
                    <form onSubmit={handleAddMaterial} className="bg-bg border border-bc rounded-rs p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Target Subject</label>
                          <select 
                            className="inp h-10 px-3"
                            value={newMaterial.subjectCode}
                            onChange={e => setNewMaterial({...newMaterial, subjectCode: e.target.value})}
                          >
                            <option value="">Select Subject</option>
                            {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Document Title</label>
                          <input 
                            className="inp h-10 px-3"
                            placeholder="e.g. Unit 1 Complete Notes"
                            value={newMaterial.title}
                            onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-dt uppercase tracking-wider">Google Drive Link</label>
                        <input 
                          className="inp h-10 px-3"
                          placeholder="https://drive.google.com/share/..."
                          value={newMaterial.driveLink}
                          onChange={e => setNewMaterial({...newMaterial, driveLink: e.target.value})}
                        />
                      </div>
                      <button type="submit" className="btn-primary h-11 flex items-center justify-center gap-2">
                         <Notebook size={16} />
                         Upload Academic Material
                      </button>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {(attConfig.materials || []).map(m => (
                         <div key={m.id} className="flex items-center justify-between p-3.5 bg-wh border border-bc rounded-rs shadow-ss hover:border-db transition-all group">
                           <div className="min-w-0">
                             <h4 className="text-[12px] font-bold text-dt truncate">{m.title}</h4>
                             <p className="text-[9px] text-sf font-black uppercase mt-0.5">{m.subjectCode}</p>
                           </div>
                           <button 
                             onClick={() => handleDeleteMaterial(m.id)}
                             className="w-9 h-9 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-all"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                       ))}
                       {(attConfig.materials || []).length === 0 && (
                         <div className="col-span-full py-12 text-center">
                            <Notebook size={40} className="mx-auto mb-3 text-bc opacity-50" />
                            <p className="text-xs text-mt italic">No materials have been uploaded yet.</p>
                         </div>
                       )}
                    </div>
                  </motion.div>
                ) : activeTab === 'results' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex items-center gap-2">
                       <Award size={18} className="text-db" />
                       <h3 className="text-sm font-bold text-dt">Exam Results Portal</h3>
                    </div>
                    
                    <form onSubmit={handleAddResult} className="bg-bg border border-bc rounded-rs p-4 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-dt uppercase tracking-wider">Result / Semester Name</label>
                        <input 
                          className="inp h-10 px-3"
                          placeholder="e.g. BCA 1st Sem Results 2026"
                          value={newResult.title}
                          onChange={e => setNewResult({...newResult, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-dt uppercase tracking-wider">Publication URL</label>
                        <input 
                          className="inp h-10 px-3"
                          placeholder="Link to PDF or Result Portal"
                          value={newResult.link}
                          onChange={e => setNewResult({...newResult, link: e.target.value})}
                        />
                      </div>
                      <button type="submit" className="btn-primary h-11 flex items-center justify-center gap-2">
                         <Award size={16} />
                         Publish New Result
                      </button>
                    </form>

                    <div className="space-y-3">
                       {(attConfig.results || []).map(r => (
                         <div key={r.id} className="flex items-center justify-between p-4 bg-wh border border-bc rounded-rs shadow-ss hover:border-db transition-all">
                           <div className="min-w-0">
                             <h4 className="text-[13px] font-bold text-dt truncate">{r.title}</h4>
                             <p className="text-[10px] text-mt mt-0.5">Published on: {new Date(r.publishedAt).toLocaleDateString()}</p>
                           </div>
                           <button 
                             onClick={() => handleDeleteResult(r.id)}
                             className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-all"
                           >
                             <Trash2 size={18} />
                           </button>
                         </div>
                       ))}
                       {(attConfig.results || []).length === 0 && (
                         <div className="py-12 text-center">
                            <Award size={40} className="mx-auto mb-3 text-bc opacity-50" />
                            <p className="text-xs text-mt italic">Database is empty. No results found.</p>
                         </div>
                       )}
                    </div>
                  </motion.div>
                ) : activeTab === 'notices' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex items-center gap-2">
                       <Megaphone size={18} className="text-db" />
                       <h3 className="text-sm font-bold text-dt">Campus Notice Board Control</h3>
                    </div>
                    
                    <form onSubmit={handleAddNotice} className="bg-bg border border-bc rounded-rs p-4 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-dt uppercase tracking-wider">Notice Heading</label>
                        <input 
                          className="inp h-10 px-3"
                          placeholder="Global Campus Event / Holiday Alert"
                          value={newNotice.title}
                          onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Tag / Category</label>
                          <input 
                            className="inp h-10 px-3"
                            placeholder="e.g. EVENT"
                            value={newNotice.tag}
                            onChange={e => setNewNotice({...newNotice, tag: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Severity Level</label>
                          <select 
                            className="inp h-10 px-3"
                            value={newNotice.type}
                            onChange={e => setNewNotice({...newNotice, type: e.target.value as any})}
                          >
                            <option value="info">Info (Standard)</option>
                            <option value="warning">Warning (Medium)</option>
                            <option value="critical">Critical (High)</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="btn-primary h-11 flex items-center justify-center gap-2">
                         <Megaphone size={16} />
                         Blast Global Notice
                      </button>
                    </form>

                    <div className="space-y-3">
                       {(attConfig.notices || []).map(n => (
                         <div key={n.id} className="flex items-center justify-between p-4 bg-wh border border-bc rounded-rs shadow-ss hover:border-db transition-all">
                           <div className="min-w-0">
                             <h4 className="text-[13px] font-bold text-dt truncate">{n.title}</h4>
                             <div className="flex items-center gap-3 mt-1.5">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tight shadow-sm ${
                                   n.type === 'critical' ? 'bg-red-500 text-wh' : 
                                   n.type === 'warning' ? 'bg-amber-100 text-amber-700' : 
                                   'bg-blue-500 text-wh'
                                }`}>{n.tag}</span>
                                <span className="text-[10px] text-mt font-bold">{n.date}</span>
                             </div>
                           </div>
                           <button 
                             onClick={() => handleDeleteNotice(n.id)}
                             className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0"
                           >
                             <Trash2 size={18} />
                           </button>
                         </div>
                       ))}
                       {(attConfig.notices || []).length === 0 && (
                         <div className="py-12 text-center border-2 border-dashed border-bc rounded-rs">
                            <Megaphone size={40} className="mx-auto mb-3 text-bc opacity-50" />
                            <p className="text-xs text-mt italic">No active notices found in history.</p>
                         </div>
                       )}
                    </div>
                  </motion.div>
                ) : activeTab === 'routine' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex items-center gap-2">
                       <Calendar size={18} className="text-db" />
                       <h3 className="text-sm font-bold text-dt">Weekly Routine Manager</h3>
                    </div>
                    
                    <form onSubmit={handleAddRoutine} className="bg-bg border border-bc rounded-rs p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Target Weekday</label>
                          <select 
                            className="inp h-10 px-3"
                            value={newRoutine.day}
                            onChange={e => setNewRoutine({...newRoutine, day: e.target.value})}
                          >
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Timing Slot</label>
                          <input 
                            className="inp h-10 px-3"
                            placeholder="e.g. 10:00 - 11:00 AM"
                            value={newRoutine.time}
                            onChange={e => setNewRoutine({...newRoutine, time: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Class / Activity Name</label>
                          <input 
                            className="inp h-10 px-3"
                            placeholder="e.g. Software Engineering"
                            value={newRoutine.subj}
                            onChange={e => setNewRoutine({...newRoutine, subj: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Location / Zoom / Lab</label>
                          <input 
                            className="inp h-10 px-3"
                            placeholder="e.g. Lab 3A / Online"
                            value={newRoutine.room}
                            onChange={e => setNewRoutine({...newRoutine, room: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Faculty In-Charge</label>
                          <input 
                            className="inp h-10 px-3"
                            placeholder="e.g. Prof. Kumar"
                            value={newRoutine.prof}
                            onChange={e => setNewRoutine({...newRoutine, prof: e.target.value})}
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <input 
                            type="checkbox"
                            id="isBreak"
                            className="w-4 h-4 rounded border-bc focus:ring-db text-db"
                            checked={newRoutine.isBreak}
                            onChange={e => setNewRoutine({...newRoutine, isBreak: e.target.checked})}
                          />
                          <label htmlFor="isBreak" className="text-[11px] font-bold text-dt uppercase cursor-pointer select-none">Holiday / Break Period</label>
                        </div>
                      </div>
                      <button type="submit" className="btn-primary h-11 flex items-center justify-center gap-2">
                         <Calendar size={16} />
                         Add to Weekly Schedule
                      </button>
                    </form>

                    <div className="grid grid-cols-1 gap-6">
                       {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                         const dayRoutines = (attConfig.routine || []).filter(r => r.day === day);
                         if (dayRoutines.length === 0) return null;
                         return (
                           <div key={day} className="space-y-3">
                             <div className="flex items-center gap-2">
                               <div className="w-1.5 h-4 bg-db rounded-full" />
                               <h4 className="text-[11px] font-black text-dt uppercase tracking-widest">{day}</h4>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               {dayRoutines.map(r => (
                                 <div key={r.id} className="flex items-center justify-between p-4 bg-bg/50 border border-bc rounded-rs hover:border-db transition-all group">
                                   <div className="min-w-0">
                                     <div className="flex items-center gap-2">
                                       <Clock size={11} className="text-lt" />
                                       <span className="text-[10px] font-bold text-mt">{r.time}</span>
                                     </div>
                                     <h5 className={`text-[13px] font-bold mt-1 ${r.isBreak ? 'text-lt italic line-through' : 'text-dt'} truncate`}>{r.subj}</h5>
                                     {!r.isBreak && (
                                       <p className="text-[10px] text-lt mt-1 font-semibold flex items-center gap-2">
                                          <MapPin size={10} /> 
                                          {r.room} 
                                          <span className="w-1 h-1 rounded-full bg-bc" />
                                          {r.prof}
                                       </p>
                                     )}
                                   </div>
                                   <button 
                                     onClick={() => handleDeleteRoutine(r.id)}
                                     className="w-9 h-9 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-all"
                                   >
                                     <Trash2 size={16} />
                                   </button>
                                 </div>
                               ))}
                             </div>
                           </div>
                         );
                       })}
                       {(attConfig.routine || []).length === 0 && (
                         <div className="py-12 text-center bg-bg/20 border-2 border-dashed border-bc rounded-rm">
                            <Calendar size={40} className="mx-auto mb-3 text-bc opacity-50" />
                            <p className="text-xs text-mt font-bold">Academic schedule is empty.</p>
                         </div>
                       )}
                    </div>
                  </motion.div>
                ) : activeTab === 'faculty' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex items-center gap-2">
                       <GraduationCap size={18} className="text-db" />
                       <h3 className="text-sm font-bold text-dt">Faculty Directory Control</h3>
                    </div>
                    
                    <form onSubmit={handleAddFaculty} className="bg-bg border border-bc rounded-rs p-4 space-y-4 shadow-inner">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Faculty Member Name</label>
                          <input 
                            className="inp h-10 px-3"
                            placeholder="e.g. Dr. Satadruti Sen"
                            value={newFaculty.name}
                            onChange={e => setNewFaculty({...newFaculty, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-dt uppercase tracking-wider">Current Designation</label>
                          <input 
                            className="inp h-10 px-3"
                            placeholder="e.g. Professor & HOD"
                            value={newFaculty.designation}
                            onChange={e => setNewFaculty({...newFaculty, designation: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-dt uppercase tracking-wider">Expertise Subjects (Comma Separated)</label>
                        <input 
                          className="inp h-10 px-3"
                          placeholder="Cyber Security, Cloud Computing, AI..."
                          value={newFaculty.subjects}
                          onChange={e => setNewFaculty({...newFaculty, subjects: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-dt uppercase tracking-wider">Official Email</label>
                           <input 
                             type="email"
                             className="inp h-10 px-3"
                             placeholder="name@eiilm.edu"
                             value={newFaculty.email}
                             onChange={e => setNewFaculty({...newFaculty, email: e.target.value})}
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black text-dt uppercase tracking-wider">Phone / WhatsApp</label>
                           <input 
                             className="inp h-10 px-3"
                             placeholder="+91 98300..."
                             value={newFaculty.phone}
                             onChange={e => setNewFaculty({...newFaculty, phone: e.target.value})}
                           />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-dt uppercase tracking-wider">Avatar / Photo URL</label>
                        <input 
                          className="inp h-10 px-3"
                          placeholder="https://..."
                          value={newFaculty.image}
                          onChange={e => setNewFaculty({...newFaculty, image: e.target.value})}
                        />
                      </div>
                      <button type="submit" className="btn-primary h-11 flex items-center justify-center gap-2">
                         <GraduationCap size={16} />
                         Register Faculty Profile
                      </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {(attConfig.faculties || []).map(f => (
                         <div key={f.id} className="flex items-center gap-4 p-4 bg-wh border border-bc rounded-rs shadow-ss hover:border-db transition-all group">
                           <div className="w-14 h-14 rounded-xl border border-bc overflow-hidden shrink-0 shadow-sm">
                             <img src={f.image || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <h4 className="text-[14px] font-bold text-dt truncate">{f.name}</h4>
                             <p className="text-[10px] text-db font-bold truncate tracking-tight">{f.designation}</p>
                             <div className="flex gap-2 mt-2">
                                <span className="w-6 h-6 bg-bg flex items-center justify-center rounded-full text-lt"><Mail size={12}/></span>
                                <span className="w-6 h-6 bg-bg flex items-center justify-center rounded-full text-lt"><Phone size={12}/></span>
                             </div>
                           </div>
                           <button 
                             onClick={() => handleDeleteFaculty(f.id)}
                             className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0 opacity-40 group-hover:opacity-100"
                            >
                             <Trash2 size={18} />
                           </button>
                         </div>
                       ))}
                       {(attConfig.faculties || []).length === 0 && (
                         <div className="col-span-full py-16 text-center">
                            <GraduationCap size={44} className="mx-auto mb-3 text-bc opacity-50" />
                            <p className="text-xs text-mt font-bold">Faculty list is empty. Add profiles to show to students.</p>
                         </div>
                       )}
                    </div>
                  </motion.div>
                ) : filteredUsers.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="py-16 text-center text-mt"
                  >
                     <UsersIcon size={48} className="mx-auto mb-3 text-bc" />
                     <p className="text-sm font-bold">No {activeTab} registrations found.</p>
                     {activeTab === 'pending' && stats.total > 0 && (
                       <p className="text-xs mt-2 text-lt">Check "Approved" or "All" tab to see registered students.</p>
                     )}
                  </motion.div>
                ) : (
                  filteredUsers.map((u) => (
                    <motion.div
                      key={u.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-wh border border-bc rounded-rm overflow-hidden shadow-ss hover:border-db transition-colors"
                    >
                      <div className="p-3.5 bg-bg flex items-center gap-3">
                        <div 
                          className={`w-12 h-12 rounded-full border-2 border-bc bg-wh flex items-center justify-center overflow-hidden shrink-0 font-rajdhani text-lg font-bold text-db ${u.photo ? 'cursor-pointer' : ''}`}
                          onClick={() => u.photo && setSelectedPhoto(u.photo)}
                        >
                          {u.photo ? <img src={u.photo} className="w-full h-full object-cover" /> : getInitials(u.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-dt truncate">{u.name}</h3>
                          <p className="text-[11px] text-mt truncate">{u.email}</p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase
                          ${u.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            u.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                          {u.status}
                        </div>
                      </div>
                      
                      <div className="p-3.5 grid grid-cols-2 gap-y-2 gap-x-4">
                        <div className="flex items-center gap-2 text-[11px] text-mt">
                          <UsersIcon size={14} className="text-db" />
                          Roll: <span className="font-bold text-dt">{u.roll}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-mt">
                          <Building size={14} className="text-db" />
                          Dept: <span className="font-bold text-dt">{u.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-mt">
                          <GraduationCap size={14} className="text-db" />
                          Sem: <span className="font-bold text-dt">{u.semester}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-mt">
                          <Phone size={14} className="text-db" />
                          Phone: <span className="font-bold text-dt">{u.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-mt">
                          <Key size={14} className="text-orange-500" />
                          Password: <span className="font-bold text-dt select-all">{u.plainPassword || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-wh border-t border-bc flex items-center justify-between gap-2">
                        <span className="text-[10px] text-lt flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(u.registeredAt).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          {u.status !== 'approved' && (
                            <button 
                              onClick={() => handleStatusUpdate(u.email, 'approved')}
                              className="px-3 py-1.5 bg-db text-wh text-[11px] font-bold rounded-rs hover:bg-db2 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteUser(u.email, u.name)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 text-[11px] font-bold rounded-rs hover:bg-red-100 transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 size={12} /> Delete Student
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Photo Viewer Overlay */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-db/90 z-[60] flex items-center justify-center p-6"
            onClick={() => setSelectedPhoto(null)}
          >
            <button className="absolute top-6 right-6 text-wh hover:rotate-90 transition-transform">
              <X size={32} />
            </button>
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="max-sm:w-full max-sm:aspect-square w-auto h-auto max-h-[80vh] bg-wh p-2 rounded-rl shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <img src={selectedPhoto} className="w-full h-full object-contain rounded-rm" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UsersLocalIcon({ size, className }: { size?: number, className?: string }) {
  return <UsersIcon size={size} className={className} />;
}
