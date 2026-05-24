import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Key, Eye, EyeOff, Users as UsersIcon, Clock, CheckCircle, ShieldAlert, Calendar, GraduationCap, Building, Phone, Trash2, Search, Notebook, Award, Megaphone, MapPin, Mail, CreditCard, IndianRupee, Pencil, BookOpen, Sliders, CheckSquare, Square, Plus, Sparkles, Bell, Trophy, Star, MessageSquare } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all' | 'attendance' | 'materials' | 'results' | 'notices' | 'routine' | 'faculty' | 'chatbot' | 'device_notifications' | 'feedbacks'>('pending');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [updateMsg, setUpdateMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [attConfig, setAttConfig] = useState<AttendanceConfig>({ subjects: [], materials: [], results: [], notices: [], routine: [], faculties: [] });
  const [newDeviceNotification, setNewDeviceNotification] = useState({ title: '', body: '' });
  const [newMaterial, setNewMaterial] = useState({ subjectCode: '', title: '', driveLink: '' });
  const [newResult, setNewResult] = useState({ title: '', link: '' });
  const [newNotice, setNewNotice] = useState({ title: '', tag: 'Academic', type: 'info' as 'info' | 'critical' | 'warning' });
  const [newRoutine, setNewRoutine] = useState({ day: 'Monday', time: '', subj: '', room: '', prof: '', isBreak: false });
  const [newFaculty, setNewFaculty] = useState({ name: '', designation: '', subjects: '', email: '', phone: '', image: '' });

  const [selectedSyllabusSubject, setSelectedSyllabusSubject] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [editingSyllabusTopicIdx, setEditingSyllabusTopicIdx] = useState<number | null>(null);

  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null);

  useEffect(() => {
    if (isLogged) {
      const unsubConfig = attendanceService.subscribeToGlobalConfig((data) => {
        setAttConfig(data);
      });
      const unsubUsers = userService.subscribeToUsers((data) => {
        setUsers(data);
      });
      return () => {
        unsubConfig();
        unsubUsers();
      };
    }
  }, [isLogged]);

  const handleUpdateAttConfig = async (code: string, delta: number) => {
    const newConfig = { ...attConfig };
    const subjects = attConfig.subjects ? [...attConfig.subjects] : [];
    const idx = subjects.findIndex(s => s.code === code);
    if (idx !== -1) {
      subjects[idx] = {
        ...subjects[idx],
        totalClasses: Math.max(0, (subjects[idx].totalClasses ?? 0) + delta)
      };
    } else {
      subjects.push({ 
        code, 
        totalClasses: Math.max(0, delta),
        syllabusProgress: 0,
        currentTopic: '',
        topics: []
      });
    }
    newConfig.subjects = subjects;
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setUpdateMsg(`Attendance updated for ${code} ✓`);
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleUpdateSyllabus = async (
    code: string, 
    fields: { 
      syllabusProgress?: number; 
      currentTopic?: string; 
      topics?: { name: string; completed: boolean }[] 
    }
  ) => {
    const newConfig = { ...attConfig };
    const subjects = attConfig.subjects ? [...attConfig.subjects] : [];
    const idx = subjects.findIndex(s => s.code === code);
    
    if (idx !== -1) {
      subjects[idx] = { 
        ...subjects[idx], 
        syllabusProgress: fields.syllabusProgress !== undefined ? fields.syllabusProgress : (subjects[idx].syllabusProgress ?? 0),
        currentTopic: fields.currentTopic !== undefined ? fields.currentTopic : (subjects[idx].currentTopic ?? ''),
        topics: fields.topics !== undefined ? fields.topics : (subjects[idx].topics ?? [])
      };
    } else {
      subjects.push({ 
        code, 
        totalClasses: 0, 
        syllabusProgress: fields.syllabusProgress !== undefined ? fields.syllabusProgress : 0,
        currentTopic: fields.currentTopic !== undefined ? fields.currentTopic : '',
        topics: fields.topics !== undefined ? fields.topics : []
      });
    }
    
    newConfig.subjects = subjects;
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
  };

  const handleToggleWeekendAttendance = async (day: 'saturday' | 'sunday') => {
    const newConfig = { ...attConfig };
    if (day === 'saturday') {
      newConfig.allowSaturdayAttendance = !newConfig.allowSaturdayAttendance;
    } else {
      newConfig.allowSundayAttendance = !newConfig.allowSundayAttendance;
    }
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setUpdateMsg(`${day === 'saturday' ? 'Saturday' : 'Sunday'} attendance status updated ✓`);
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.subjectCode || !newMaterial.title || !newMaterial.driveLink) return;

    const newConfig = { ...attConfig };
    if (editingMaterialId) {
      newConfig.materials = (newConfig.materials || []).map(m => {
        if (m.id === editingMaterialId) {
          return { ...m, ...newMaterial };
        }
        return m;
      });
      setEditingMaterialId(null);
      setUpdateMsg('Study material updated successfully ✓');
    } else {
      const material = {
        id: `mat_${Date.now()}`,
        ...newMaterial,
        uploadedAt: Date.now()
      };
      newConfig.materials = [...(newConfig.materials || []), material];
      setUpdateMsg('Study material added ✓');
    }

    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setNewMaterial({ subjectCode: '', title: '', driveLink: '' });
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteMaterial = async (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.materials = (newConfig.materials || []).filter(m => m.id !== id);
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    if (editingMaterialId === id) {
      setEditingMaterialId(null);
      setNewMaterial({ subjectCode: '', title: '', driveLink: '' });
    }
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResult.title || !newResult.link) return;

    const newConfig = { ...attConfig };
    if (editingResultId) {
      newConfig.results = (newConfig.results || []).map(r => {
        if (r.id === editingResultId) {
          return { ...r, ...newResult };
        }
        return r;
      });
      setEditingResultId(null);
      setUpdateMsg('Exam result link updated ✓');
    } else {
      const result = {
        id: `res_${Date.now()}`,
        ...newResult,
        publishedAt: Date.now()
      };
      newConfig.results = [...(newConfig.results || []), result];
      setUpdateMsg('Exam result link added ✓');
    }

    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setNewResult({ title: '', link: '' });
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteResult = async (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.results = (newConfig.results || []).filter(r => r.id !== id);
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    if (editingResultId === id) {
      setEditingResultId(null);
      setNewResult({ title: '', link: '' });
    }
  };

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.tag) return;

    const newConfig = { ...attConfig };
    if (editingNoticeId) {
      newConfig.notices = (newConfig.notices || []).map(n => {
        if (n.id === editingNoticeId) {
          return { ...n, ...newNotice, publishedAt: Date.now() };
        }
        return n;
      });
      setEditingNoticeId(null);
      setUpdateMsg('Global notice updated successfully ✓');
    } else {
      const notice = {
        id: `notice_${Date.now()}`,
        ...newNotice,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        publishedAt: Date.now()
      };
      newConfig.notices = [...(newConfig.notices || []), notice];
      setUpdateMsg('Notice published ✓');
    }

    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);

    // Broadcast active Push notification immediately via server REST API call (Wakes up Cloud Run instantly)
    try {
      await fetch('/api/notification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `MyCampus - ${newNotice.tag || 'নতুন নোটিশ'} 🔔`,
          body: newNotice.title,
          url: '#notices'
        })
      });
    } catch (err) {
      console.warn("Active notice push broadcast failed:", err);
    }

    setNewNotice({ title: '', tag: 'Academic', type: 'info' });
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteNotice = async (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.notices = (newConfig.notices || []).filter(n => n.id !== id);
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    if (editingNoticeId === id) {
      setEditingNoticeId(null);
      setNewNotice({ title: '', tag: 'Academic', type: 'info' });
    }
  };

  const handlePostDeviceNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceNotification.title || !newDeviceNotification.body) return;

    const newConfig = { ...attConfig };
    const alertItem = {
      id: `dev_alert_${Date.now()}`,
      title: newDeviceNotification.title.trim(),
      body: newDeviceNotification.body.trim(),
      publishedAt: Date.now()
    };

    newConfig.deviceNotification = alertItem;
    newConfig.deviceNotificationHistory = [
      alertItem,
      ...(newConfig.deviceNotificationHistory || [])
    ];

    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);

    // Broadcast active Push notification immediately via server REST API call (Wakes up Cloud Run instantly)
    try {
      await fetch('/api/notification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: alertItem.title,
          body: alertItem.body,
          url: '#home'
        })
      });
    } catch (err) {
      console.warn("Active device alert push broadcast failed:", err);
    }

    setNewDeviceNotification({ title: '', body: '' });
    setUpdateMsg('ডিভাইস নোটিফিকেশন সফলভাবে পাঠানো হয়েছে ✓');
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteDeviceNotification = async (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.deviceNotificationHistory = (newConfig.deviceNotificationHistory || []).filter(item => item.id !== id);
    if (newConfig.deviceNotification?.id === id) {
      delete newConfig.deviceNotification;
    }
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setUpdateMsg('ডিভাইস অ্যালার্ট ডিলিট করা হয়েছে ✓');
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleApproveSupporter = async (report: any) => {
    const currentSupporters = attConfig.supporters || [];
    const currentReported = attConfig.reportedSupporters || [];
    
    const supporterItem = {
      id: `sup_${Date.now()}`,
      name: report.name,
      amount: Number(report.amount) || 30,
      message: report.message || '',
      createdAt: Date.now()
    };
    
    const updatedReported = currentReported.map(r => 
      r.id === report.id ? { ...r, status: 'approved' } : r
    );
    
    const newConfig = {
      ...attConfig,
      supporters: [supporterItem, ...currentSupporters],
      reportedSupporters: updatedReported
    };
    
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setUpdateMsg(`Approved support from ${report.name}! ✓`);
    setTimeout(() => setUpdateMsg(''), 3000);
  };

  const handleRejectSupporter = async (reportId: string, name: string) => {
    const currentReported = attConfig.reportedSupporters || [];
    const updatedReported = currentReported.map(r => 
      r.id === reportId ? { ...r, status: 'rejected' } : r
    );
    const newConfig = {
      ...attConfig,
      reportedSupporters: updatedReported
    };
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setUpdateMsg(`Rejected support from ${name}.`);
    setTimeout(() => setUpdateMsg(''), 3000);
  };

  const handleDeleteSupporterItem = async (supId: string) => {
    const currentSupporters = attConfig.supporters || [];
    const updated = currentSupporters.filter(s => s.id !== supId);
    const newConfig = {
      ...attConfig,
      supporters: updated
    };
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setUpdateMsg('Deleted supporter from wall.');
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteReportItem = async (repId: string) => {
    const currentReported = attConfig.reportedSupporters || [];
    const updated = currentReported.filter(r => r.id !== repId);
    const newConfig = {
      ...attConfig,
      reportedSupporters: updated
    };
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setUpdateMsg('Deleted reported record.');
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleModerateFeedback = async (feedbackId: string) => {
    const currentFeedbacks = attConfig.feedbacks || [];
    const updated = currentFeedbacks.filter(f => f.id !== feedbackId);
    const newConfig = {
      ...attConfig,
      feedbacks: updated
    };
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setUpdateMsg('Feedback deleted successfully.');
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleAddRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutine.time || !newRoutine.subj) return;

    const newConfig = { ...attConfig };
    if (editingRoutineId) {
      newConfig.routine = (newConfig.routine || []).map(r => {
        if (r.id === editingRoutineId) {
          return { ...r, ...newRoutine };
        }
        return r;
      });
      setEditingRoutineId(null);
      setUpdateMsg('Routine details updated ✓');
    } else {
      const routineItem = {
        id: `rout_${Date.now()}`,
        ...newRoutine
      };
      newConfig.routine = [...(newConfig.routine || []), routineItem];
      setUpdateMsg('Routine updated ✓');
    }

    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setNewRoutine({ day: newRoutine.day, time: '', subj: '', room: '', prof: '', isBreak: false });
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteRoutine = async (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.routine = (newConfig.routine || []).filter(r => r.id !== id);
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    if (editingRoutineId === id) {
      setEditingRoutineId(null);
      setNewRoutine({ day: 'Monday', time: '', subj: '', room: '', prof: '', isBreak: false });
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.designation) return;

    const subjectsArray = (newFaculty.subjects || '').split(',').map(s => s.trim()).filter(s => s !== '');

    const newConfig = { ...attConfig };
    if (editingFacultyId) {
      newConfig.faculties = (newConfig.faculties || []).map(f => {
        if (f.id === editingFacultyId) {
          return {
            ...f,
            name: newFaculty.name,
            designation: newFaculty.designation,
            subjects: subjectsArray,
            email: newFaculty.email,
            phone: newFaculty.phone,
            image: newFaculty.image
          };
        }
        return f;
      });
      setEditingFacultyId(null);
      setUpdateMsg('Faculty profile updated successfully ✓');
    } else {
      const faculty = {
        id: `fac_${Date.now()}`,
        name: newFaculty.name,
        designation: newFaculty.designation,
        subjects: subjectsArray,
        email: newFaculty.email,
        phone: newFaculty.phone,
        image: newFaculty.image,
        addedAt: Date.now()
      };
      newConfig.faculties = [...(newConfig.faculties || []), faculty];
      setUpdateMsg('Faculty added ✓');
    }

    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    setNewFaculty({ name: '', designation: '', subjects: '', email: '', phone: '', image: '' });
    setTimeout(() => setUpdateMsg(''), 2000);
  };

  const handleDeleteFaculty = async (id: string) => {
    const newConfig = { ...attConfig };
    newConfig.faculties = (newConfig.faculties || []).filter(f => f.id !== id);
    setAttConfig(newConfig);
    await attendanceService.saveGlobalConfig(newConfig);
    if (editingFacultyId === id) {
      setEditingFacultyId(null);
      setNewFaculty({ name: '', designation: '', subjects: '', email: '', phone: '', image: '' });
    }
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
      const matchesSearch = 
        (u.name || '').toLowerCase().includes(q) || 
        (u.roll || '').toLowerCase().includes(q) || 
        (u.email || '').toLowerCase().includes(q);
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
            <span className="text-[9px] font-black text-lt uppercase tracking-widest">Academic & AI Control</span>
          </div>
          <div className="flex overflow-x-auto no-scrollbar">
            {[
              { id: 'attendance', label: 'Attendance', icon: Calendar },
              { id: 'materials', label: 'Materials', icon: Notebook },
              { id: 'results', label: 'Results', icon: Award },
              { id: 'notices', label: 'Notices', icon: Megaphone },
              { id: 'device_notifications', label: 'Device Alerts 🔔', icon: Bell },
              { id: 'feedbacks', label: 'Feedbacks 💬', icon: MessageSquare },
              { id: 'routine', label: 'Routine', icon: Calendar },
              { id: 'faculty', label: 'Faculty', icon: GraduationCap },
              { id: 'chatbot', label: 'Chatbot (AI)', icon: ShieldCheck }
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
                    <div className="flex items-center justify-between border-b border-bc pb-4">
                      <div className="flex items-center gap-2">
                         <Calendar size={18} className="text-db" />
                         <h3 className="text-base font-bold text-dt">Attendance & Syllabus Progress Control</h3>
                      </div>
                      <span className="text-[10px] bg-sky-50 text-sky-700 font-extrabold uppercase border border-sky-100 px-3 py-1 rounded-full tracking-wider">
                        Realtime Tracker
                      </span>
                    </div>

                    {/* Weekend/Holiday Attendance Override Section */}
                    <div className="bg-amber-50/50 border border-amber-200/50 rounded-rs p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      <div>
                        <h4 className="text-[12px] font-bold text-amber-900 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-amber-600 shrink-0" />
                          উইকেন্ড হলিডে সেটিংস (Weekend Holiday Settings)
                        </h4>
                        <p className="text-[10px] text-amber-700/80 mt-1 leading-relaxed">
                          শনিবার ও রবিবারকে ডিফল্ট হিসেবে ছুটির দিন (হলিডে) বিবেচনা করা হয়। ছাত্রছাত্রীরা এই দিনগুলিতে কোনো ক্লাস অ্যাটেন্ডেন্স দিতে পারবে না, যদি না আপনি নিচের সুইচটি অন করে সাময়িকভাবে ওই দিনের ক্লাস অনুমোদন করেন।
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 md:justify-end">
                        {/* Saturday Toggle */}
                        <div className="flex items-center gap-2.5 bg-wh border border-bc px-3 py-2 rounded-rs shadow-ss">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-extrabold text-dt">Saturday</span>
                            <span className="text-[8.5px] font-bold text-lt uppercase">শনিবার</span>
                          </div>
                          <button
                            onClick={() => handleToggleWeekendAttendance('saturday')}
                            className={`w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                              attConfig.allowSaturdayAttendance ? 'bg-green-600' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 bg-wh rounded-full shadow-md transform transition-transform duration-200 ${
                                attConfig.allowSaturdayAttendance ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Sunday Toggle */}
                        <div className="flex items-center gap-2.5 bg-wh border border-bc px-3 py-2 rounded-rs shadow-ss">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-extrabold text-dt">Sunday</span>
                            <span className="text-[8.5px] font-bold text-lt uppercase">রবিবার</span>
                          </div>
                          <button
                            onClick={() => handleToggleWeekendAttendance('sunday')}
                            className={`w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none ${
                              attConfig.allowSundayAttendance ? 'bg-green-600' : 'bg-slate-300'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 bg-wh rounded-full shadow-md transform transition-transform duration-200 ${
                                attConfig.allowSundayAttendance ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Pane: Subject List & Class Counters */}
                      <div className="lg:col-span-6 space-y-4">
                        <div className="flex items-center gap-1.5 text-dt text-xs font-black uppercase tracking-wider mb-2">
                          <Sliders size={14} className="text-db" />
                          <span>Class Counts & Selection / সাবজেক্ট সিলেক্ট করুন</span>
                        </div>
                        <p className="text-[11px] text-mt leading-relaxed bg-bg p-3 rounded-rs border border-bc">
                          নিচের তালিকা থেকে সাবজেক্টের পরিচালিত মোট ক্লাস সংখ্যা পরিবর্তন ইডিট (<b>-</b> / <b>+</b>) করুন, এবং সিলেবাসের অগ্রগতি ট্র্যাকিংয়ের জন্য কার্ডে ক্লিক করুন।
                        </p>
                        
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                          {SUBJECTS.map((s) => {
                            const config = (attConfig.subjects || []).find(c => c.code === s.code) || { code: s.code, totalClasses: 0, syllabusProgress: 0, currentTopic: '', topics: [] };
                            const subCompleted = config.topics ? config.topics.filter(t => t.completed).length : 0;
                            const subTotal = config.topics ? config.topics.length : 0;
                            const isSelected = selectedSyllabusSubject === s.code;
                            
                            return (
                              <div 
                                key={s.code} 
                                onClick={() => setSelectedSyllabusSubject(s.code)}
                                className={`p-3.5 border rounded-rs transition-all cursor-pointer flex flex-col gap-2.5 ${
                                  isSelected 
                                    ? 'border-sf bg-gradient-to-br from-sf/5 to-transparent ring-[1.5px] ring-sf/40 shadow-sm' 
                                    : 'border-bc bg-bg/50 hover:bg-bg'
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                     <h4 className={`text-[12px] font-bold leading-tight ${isSelected ? 'text-db' : 'text-dt'}`}>{s.name}</h4>
                                     <p className="text-[9.5px] text-lt uppercase font-black tracking-normal mt-0.5">{s.code}</p>
                                  </div>
                                  <div className="flex items-center gap-2 font-mono shrink-0" onClick={(e) => e.stopPropagation()}>
                                     <button 
                                       onClick={() => handleUpdateAttConfig(s.code, -1)}
                                       className="w-7 h-7 rounded-full border border-bc flex items-center justify-center text-mt hover:bg-wh hover:text-red-500 transition-all font-bold text-xs"
                                     >
                                       -
                                     </button>
                                     <div className="text-center min-w-[34px] flex flex-col justify-center">
                                       <span className="font-rajdhani text-sm font-black text-db leading-none">
                                         {config.totalClasses}
                                       </span>
                                       <span className="text-[7.5px] text-lt uppercase font-black tracking-tighter leading-none mt-1">Class</span>
                                     </div>
                                     <button 
                                       onClick={() => handleUpdateAttConfig(s.code, 1)}
                                       className="w-7 h-7 rounded-full border border-bc flex items-center justify-center text-mt hover:bg-wh hover:text-db transition-all font-bold text-xs"
                                     >
                                       +
                                     </button>
                                  </div>
                                </div>
                                
                                {/* Progress Indicator on List Item */}
                                <div className="pt-2 border-t border-bc/60 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className="text-[9px] text-[#42b883] font-black uppercase shrink-0 mr-1">Syllabus:</span>
                                    <span className="text-[9.5px] font-bold text-db bg-sfl px-1.5 py-0.5 rounded border border-[#5d0e31]/10">
                                      {subCompleted} of {subTotal} Chapters Completed
                                    </span>
                                  </div>
                                  
                                  <span className={`text-[8.5px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full shrink-0 ${
                                    isSelected ? 'bg-sf/20 text-db' : 'bg-slate-200/50 text-lt'
                                  }`}>
                                    {isSelected ? 'Selected ✓' : 'Edit'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Pane: Selected Subject Syllabus detailed editor */}
                      <div className="lg:col-span-6 lg:sticky lg:top-4 bg-slate-50/50 border border-bc/80 rounded-rm p-5 space-y-4">
                        {selectedSyllabusSubject ? (() => {
                          const sObj = SUBJECTS.find(s => s.code === selectedSyllabusSubject);
                          const config = (attConfig.subjects || []).find(c => c.code === selectedSyllabusSubject) || { code: selectedSyllabusSubject, totalClasses: 0, syllabusProgress: 0, currentTopic: '', topics: [] };
                          const topics = config.topics || [];
                          
                          return (
                            <div className="space-y-4">
                              <div className="border-b border-bc pb-3">
                                <span className="text-[8.5px] font-black uppercase tracking-wider text-sf bg-sf/10 border border-sf/20 px-2.5 py-0.5 rounded-full">
                                  Syllabus Configuration / সিলেবাস সেটিংস
                                </span>
                                <h3 className="text-[13px] font-black text-db tracking-wider uppercase mt-1.5 leading-tight">
                                  {sObj?.name}
                                </h3>
                                <p className="text-[9.5px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                                  Subject Code: <span className="text-dt font-black">{selectedSyllabusSubject}</span>
                                </p>
                              </div>

                              {/* Topics Checklist Builder */}
                              <div className="p-3 bg-white border border-bc rounded-rs space-y-4">
                                <label className="text-[10px] font-black text-dt uppercase tracking-wider block border-b border-bc/40 pb-1.5 flex justify-between items-center">
                                  <span>📋 Syllabus Topics Checklist / সাবজেক্টের মূল অধ্যায়সমূহ</span>
                                  {editingSyllabusTopicIdx !== null && (
                                    <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider animate-pulse">
                                      Editing Mode / এডিট মোড
                                    </span>
                                  )}
                                </label>
                                
                                <div className="flex gap-2 items-center w-full">
                                  <input 
                                    type="text" 
                                    placeholder={editingSyllabusTopicIdx !== null ? "অধ্যায়ের মোডিফাইড নাম লিখুন..." : "অধ্যায়ের নাম লিখুন (যেমন: Unit 1: Stack)"} 
                                    value={newTopicName}
                                    onChange={(e) => setNewTopicName(e.target.value)}
                                    className="px-3 py-1.5 border border-bc rounded-rs text-xs font-nunito text-dt bg-bg outline-none transition-all focus:border-db focus:bg-wh focus:ring-2 focus:ring-db/10 h-8.5 flex-1 min-w-0"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (newTopicName.trim()) {
                                          if (editingSyllabusTopicIdx !== null) {
                                            const updatedTopics = topics.map((item, i) => 
                                              i === editingSyllabusTopicIdx ? { ...item, name: newTopicName.trim() } : item
                                            );
                                            handleUpdateSyllabus(selectedSyllabusSubject, { topics: updatedTopics });
                                            setEditingSyllabusTopicIdx(null);
                                          } else {
                                            const updatedTopics = [...topics, { name: newTopicName.trim(), completed: false }];
                                            handleUpdateSyllabus(selectedSyllabusSubject, { topics: updatedTopics });
                                          }
                                          setNewTopicName('');
                                        }
                                      }
                                    }}
                                  />
                                  <div className="flex gap-1 items-center shrink-0">
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        if (newTopicName.trim()) {
                                          if (editingSyllabusTopicIdx !== null) {
                                            const updatedTopics = topics.map((item, i) => 
                                              i === editingSyllabusTopicIdx ? { ...item, name: newTopicName.trim() } : item
                                            );
                                            handleUpdateSyllabus(selectedSyllabusSubject, { topics: updatedTopics });
                                            setEditingSyllabusTopicIdx(null);
                                          } else {
                                            const updatedTopics = [...topics, { name: newTopicName.trim(), completed: false }];
                                            handleUpdateSyllabus(selectedSyllabusSubject, { topics: updatedTopics });
                                          }
                                          setNewTopicName('');
                                        }
                                      }}
                                      className="bg-db hover:bg-db2 text-white font-extrabold text-[10px] uppercase rounded-rs px-3 h-8.5 flex items-center justify-center gap-1 transition-all cursor-pointer border border-transparent shadow-sm"
                                    >
                                      {editingSyllabusTopicIdx !== null ? (
                                        <>
                                          <ShieldCheck size={12} className="text-white" />
                                          <span>Save</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={11} className="text-white" />
                                          <span>Add</span>
                                        </>
                                      )}
                                    </button>
                                    {editingSyllabusTopicIdx !== null && (
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          setEditingSyllabusTopicIdx(null);
                                          setNewTopicName('');
                                        }}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] uppercase rounded-rs px-2.5 h-8.5 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Topics Render Checklist */}
                                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                                  {topics.length === 0 ? (
                                    <p className="text-[10px] text-lt italic text-center py-4">
                                      কোনো সাব-টপিক যুক্ত করা হয়নি। উপরে লিখে Add বাটনে ক্লিক করুন।
                                    </p>
                                  ) : (
                                    topics.map((t, idx) => (
                                      <div key={idx} className={`flex items-center justify-between gap-2 p-1.5 border rounded-rs hover:border-bc transition-colors ${editingSyllabusTopicIdx === idx ? 'bg-amber-50/25 border-amber-300 ring-1 ring-amber-300/30' : 'bg-bg border-bc/60'}`}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updatedTopics = topics.map((item, i) => i === idx ? { ...item, completed: !item.completed } : item);
                                            handleUpdateSyllabus(selectedSyllabusSubject, { topics: updatedTopics });
                                          }}
                                          className="flex items-center gap-2 text-left min-w-0 flex-1 hover:text-db transition-colors"
                                        >
                                          {t.completed ? (
                                            <CheckSquare size={14} className="text-emerald-500 shrink-0" />
                                          ) : (
                                            <Square size={14} className="text-slate-400 shrink-0" />
                                          )}
                                          <span className={`text-[11px] font-bold leading-tight truncate ${t.completed ? 'text-emerald-600 font-extrabold' : 'text-dt'}`}>
                                            {t.name}
                                          </span>
                                        </button>
                                        
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingSyllabusTopicIdx(idx);
                                              setNewTopicName(t.name);
                                            }}
                                            className={`p-1 rounded-full transition-colors ${editingSyllabusTopicIdx === idx ? 'text-amber-600 hover:bg-amber-100' : 'text-slate-400 hover:text-db hover:bg-slate-100'}`}
                                            title="Edit topic"
                                          >
                                            <Pencil size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedTopics = topics.filter((_, i) => i !== idx);
                                              handleUpdateSyllabus(selectedSyllabusSubject, { topics: updatedTopics });
                                              if (editingSyllabusTopicIdx === idx) {
                                                setEditingSyllabusTopicIdx(null);
                                                setNewTopicName('');
                                              }
                                            }}
                                            className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors shrink-0"
                                            title="Delete topic"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })() : (
                          <div className="border border-dashed border-bc/80 rounded-rm p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                            <BookOpen size={40} className="text-lt mb-3 animate-bounce" />
                            <h4 className="text-[11px] font-black uppercase text-dt tracking-wider">No Subject Selected</h4>
                            <p className="text-[10px] text-mt mt-1 max-w-xs leading-normal">
                              বাম প্যানেলের তালিকা থেকে যেকোনো একটি সাবজেক্টে ক্লিক করে সিলেবাস ট্র্যাকার কনফিগার করুন।
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'materials' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                   >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bc">
                      <div className="flex items-center gap-2">
                         <Notebook size={18} className="text-db" />
                         <h3 className="text-base font-bold text-dt">Study Materials Control</h3>
                      </div>
                      {editingMaterialId && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Editing Mode / এডিট মোড
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Interactive Sticky Form */}
                      <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
                        <form onSubmit={handleAddMaterial} className={`border rounded-rs p-4 space-y-4 transition-all duration-300 ${editingMaterialId ? 'border-amber-400 bg-amber-50/10 shadow-sm' : 'border-bc bg-bg/50'}`}>
                          <div>
                            <h4 className="text-[11px] font-bold text-db uppercase tracking-wider mb-2">
                              {editingMaterialId ? 'Edit Material / ম্যাটেরিয়াল এডিট করুন' : 'Upload New Material / নতুন আপলোড'}
                            </h4>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-dt uppercase tracking-wider">Target Subject</label>
                              <select 
                                className="inp h-10 px-3 bg-wh"
                                value={newMaterial.subjectCode}
                                onChange={e => setNewMaterial({...newMaterial, subjectCode: e.target.value})}
                              >
                                <option value="">Select Subject</option>
                                {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                              </select>
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-dt uppercase tracking-wider">Document Title</label>
                              <input 
                                className="inp h-10 px-3 bg-wh"
                                placeholder="e.g. Unit 1 Complete Notes"
                                value={newMaterial.title}
                                onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-dt uppercase tracking-wider">Google Drive Link</label>
                              <input 
                                className="inp h-10 px-3 bg-wh"
                                placeholder="https://drive.google.com/share/..."
                                value={newMaterial.driveLink}
                                onChange={e => setNewMaterial({...newMaterial, driveLink: e.target.value})}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-2">
                            <button type="submit" className={`btn-primary h-11 flex items-center justify-center gap-2 w-full transition-all ${editingMaterialId ? 'bg-amber-600 hover:bg-amber-700 shadow-md border-amber-700' : ''}`}>
                               <Notebook size={16} />
                               {editingMaterialId ? 'Save Changes / আপডেট সেভ' : 'Upload Academic Material'}
                            </button>
                            {editingMaterialId && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingMaterialId(null);
                                  setNewMaterial({ subjectCode: '', title: '', driveLink: '' });
                                }}
                                className="h-10 border border-bc text-[11px] font-bold text-mt hover:bg-bg hover:text-dt rounded-rs transition-colors w-full"
                              >
                                Cancel / ড্রাফট বাতিল
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* Right: Scrollable Material Item Grid */}
                      <div className="lg:col-span-7 space-y-3">
                        <div className="flex items-center justify-between pb-1">
                          <h4 className="text-[10px] font-black text-lt uppercase tracking-widest bg-bg px-2.5 py-1 rounded border border-bc">
                            Document Bank ({(attConfig.materials || []).length})
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                           {(attConfig.materials || []).map(m => (
                             <div key={m.id} className={`flex items-center justify-between p-3.5 bg-wh border rounded-rs shadow-ss transition-all duration-300 ${editingMaterialId === m.id ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400' : 'border-bc hover:border-db'}`}>
                               <div className="min-w-0 pr-2">
                                 <h4 className="text-[13px] font-bold text-dt truncate">{m.title}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                   <span className="text-[9px] text-sf font-black uppercase tracking-wider">{m.subjectCode}</span>
                                   <span className="text-[10px] text-lt">|</span>
                                   <a href={m.driveLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-db hover:underline truncate">View Drive Link</a>
                                 </div>
                               </div>
                               <div className="flex items-center gap-1 shrink-0">
                                 <button 
                                   onClick={() => {
                                     setEditingMaterialId(m.id);
                                     setNewMaterial({ subjectCode: m.subjectCode, title: m.title, driveLink: m.driveLink });
                                   }}
                                   className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${editingMaterialId === m.id ? 'bg-amber-100 text-amber-700' : 'text-db hover:bg-db/5'}`}
                                   title="Edit"
                                 >
                                   <Pencil size={15} />
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteMaterial(m.id)}
                                   className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-all"
                                   title="Delete"
                                 >
                                   <Trash2 size={15} />
                                 </button>
                               </div>
                             </div>
                           ))}
                           {(attConfig.materials || []).length === 0 && (
                             <div className="py-12 text-center border-2 border-dashed border-bc rounded-rs w-full">
                                <Notebook size={36} className="mx-auto mb-2 text-bc opacity-50" />
                                <p className="text-xs text-mt italic">No materials have been uploaded yet.</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'results' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bc">
                      <div className="flex items-center gap-2">
                         <Award size={18} className="text-db" />
                         <h3 className="text-base font-bold text-dt">Exam Results Manager</h3>
                      </div>
                      {editingResultId && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Editing Result / এডিট মোড
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Form Column */}
                      <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
                        <form onSubmit={handleAddResult} className={`border rounded-rs p-4 space-y-4 transition-all duration-300 ${editingResultId ? 'border-amber-400 bg-amber-50/10' : 'border-bc bg-bg/50'}`}>
                          <div>
                            <h4 className="text-[11px] font-bold text-db uppercase tracking-wider mb-2">
                              {editingResultId ? 'Edit Result Link / রেজাল্ট এডিট করুন' : 'Publish Semester Result / নতুন রেজাল্ট'}
                            </h4>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-dt uppercase tracking-wider">Result / Semester Name</label>
                              <input 
                                className="inp h-10 px-3 bg-wh"
                                placeholder="e.g. BCA 1st Sem Results 2026"
                                value={newResult.title}
                                onChange={e => setNewResult({...newResult, title: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-dt uppercase tracking-wider">Publication URL</label>
                              <input 
                                className="inp h-10 px-3 bg-wh"
                                placeholder="Link to PDF or Result Portal"
                                value={newResult.link}
                                onChange={e => setNewResult({...newResult, link: e.target.value})}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-2">
                            <button type="submit" className={`btn-primary h-11 flex items-center justify-center gap-2 w-full transition-all ${editingResultId ? 'bg-amber-600 hover:bg-amber-700 border-amber-700' : ''}`}>
                               <Award size={16} />
                               {editingResultId ? 'Save Result Changes / সেভ করুন' : 'Publish Semester Result'}
                            </button>
                            {editingResultId && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingResultId(null);
                                  setNewResult({ title: '', link: '' });
                                }}
                                className="h-10 border border-bc text-[11px] font-bold text-mt hover:bg-bg hover:text-dt rounded-rs transition-colors w-full"
                              >
                                Cancel / বাতিল
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* List Column */}
                      <div className="lg:col-span-7 space-y-3">
                        <h4 className="text-[10px] font-black text-lt uppercase tracking-widest bg-bg px-2.5 py-1 rounded border border-bc w-fit">
                          Result Logs ({(attConfig.results || []).length})
                        </h4>
                        <div className="space-y-2">
                           {(attConfig.results || []).map(r => (
                             <div key={r.id} className={`flex items-center justify-between p-4 bg-wh border rounded-rs shadow-ss transition-all duration-300 ${editingResultId === r.id ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400' : 'border-bc hover:border-db'}`}>
                               <div className="min-w-0 pr-2">
                                 <h4 className="text-[13px] font-bold text-dt truncate">{r.title}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                   <p className="text-[10px] text-mt">Published: {new Date(r.publishedAt).toLocaleDateString()}</p>
                                   <span className="text-[10px] text-lt">|</span>
                                   <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-db hover:underline truncate">Open Link</a>
                                 </div>
                               </div>
                               <div className="flex items-center gap-1 shrink-0">
                                 <button 
                                   onClick={() => {
                                     setEditingResultId(r.id);
                                     setNewResult({ title: r.title, link: r.link });
                                   }}
                                   className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${editingResultId === r.id ? 'bg-amber-100 text-amber-700' : 'text-db hover:bg-db/5'}`}
                                   title="Edit"
                                 >
                                   <Pencil size={15} />
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteResult(r.id)}
                                   className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-all"
                                   title="Delete"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                               </div>
                             </div>
                           ))}
                           {(attConfig.results || []).length === 0 && (
                             <div className="py-12 text-center border-2 border-dashed border-bc rounded-rs bg-bg/10">
                                <Award size={36} className="mx-auto mb-2 text-bc opacity-50" />
                                <p className="text-xs text-mt italic">Database is empty. No results found.</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'notices' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bc">
                      <div className="flex items-center gap-2">
                         <Megaphone size={18} className="text-db" />
                         <h3 className="text-base font-bold text-dt">Campus Notice Board Control</h3>
                      </div>
                      {editingNoticeId && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Editing Notice / নোটিশ এডিট
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Form Column */}
                      <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
                        <form onSubmit={handleAddNotice} className={`border rounded-rs p-4 space-y-4 transition-all duration-300 ${editingNoticeId ? 'border-amber-400 bg-amber-50/10' : 'border-bc bg-bg/50'}`}>
                          <div>
                            <h4 className="text-[11px] font-bold text-db uppercase tracking-wider mb-2">
                              {editingNoticeId ? 'Edit Global Notice / নোটিশ সংশোধন করুন' : 'Broadcast Global Notice / নতুন নোটিশ'}
                            </h4>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-dt uppercase tracking-wider">Notice Heading</label>
                              <input 
                                className="inp h-10 px-3 bg-wh"
                                placeholder="Global Campus Event / Holiday Alert"
                                value={newNotice.title}
                                onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-dt uppercase tracking-wider">Tag / Category</label>
                                <input 
                                  className="inp h-10 px-3 bg-wh"
                                  placeholder="e.g. EVENT"
                                  value={newNotice.tag}
                                  onChange={e => setNewNotice({...newNotice, tag: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-dt uppercase tracking-wider">Severity Level</label>
                                <select 
                                  className="inp h-10 px-3 bg-wh"
                                  value={newNotice.type}
                                  onChange={e => setNewNotice({...newNotice, type: e.target.value as any})}
                                >
                                  <option value="info">Info (Standard)</option>
                                  <option value="warning">Warning (Medium)</option>
                                  <option value="critical">Critical (High)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-2">
                            <button type="submit" className={`btn-primary h-11 flex items-center justify-center gap-2 w-full transition-all ${editingNoticeId ? 'bg-amber-600 hover:bg-amber-700 border-amber-700' : ''}`}>
                               <Megaphone size={16} />
                               {editingNoticeId ? 'Save Notice Changes / সংশোধন করুন' : 'Blast Global Notice'}
                            </button>
                            {editingNoticeId && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingNoticeId(null);
                                  setNewNotice({ title: '', tag: 'Academic', type: 'info' });
                                }}
                                className="h-10 border border-bc text-[11px] font-bold text-mt hover:bg-bg hover:text-dt rounded-rs transition-colors w-full"
                              >
                                Cancel / ড্রাফট বাতিল
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* List Column */}
                      <div className="lg:col-span-7 space-y-3">
                        <h4 className="text-[10px] font-black text-lt uppercase tracking-widest bg-bg px-2.5 py-1 rounded border border-bc w-fit">
                          Notice Archive ({(attConfig.notices || []).length})
                        </h4>
                        <div className="space-y-2">
                           {(attConfig.notices || []).map(n => (
                             <div key={n.id} className={`flex items-center justify-between p-4 bg-wh border rounded-rs shadow-ss transition-all duration-300 ${editingNoticeId === n.id ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400' : 'border-bc hover:border-db'}`}>
                               <div className="min-w-0 pr-2">
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
                               <div className="flex items-center gap-1 shrink-0">
                                 <button 
                                   onClick={() => {
                                     setEditingNoticeId(n.id);
                                     setNewNotice({ title: n.title, tag: n.tag, type: n.type });
                                   }}
                                   className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${editingNoticeId === n.id ? 'bg-amber-100 text-amber-700' : 'text-db hover:bg-db/5'}`}
                                   title="Edit"
                                 >
                                   <Pencil size={15} />
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteNotice(n.id)}
                                   className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0"
                                   title="Delete"
                                 >
                                   <Trash2 size={18} />
                                 </button>
                               </div>
                             </div>
                           ))}
                           {(attConfig.notices || []).length === 0 && (
                             <div className="py-12 text-center border-2 border-dashed border-bc rounded-rs bg-bg/10">
                                <Megaphone size={36} className="mx-auto mb-2 text-bc opacity-50" />
                                <p className="text-xs text-mt italic">No active notices found in history.</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'routine' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bc">
                      <div className="flex items-center gap-2">
                         <Calendar size={18} className="text-db" />
                         <h3 className="text-base font-bold text-dt">Weekly Routine Manager</h3>
                      </div>
                      {editingRoutineId && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Editing Slot / ক্লাস পরিবর্তন মোড
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Input Form */}
                      <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
                        <form onSubmit={handleAddRoutine} className={`border rounded-rs p-4 space-y-4 transition-all duration-300 ${editingRoutineId ? 'border-amber-400 bg-amber-50/10' : 'border-bc bg-bg/50'}`}>
                          <div>
                            <h4 className="text-[11px] font-bold text-db uppercase tracking-wider mb-2">
                              {editingRoutineId ? 'Edit Routine Slot / সেশন এডিট করুন' : 'Add Class to Routine / নতুন সেশন অ্যাড'}
                            </h4>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-dt uppercase tracking-wider">Target Weekday</label>
                                <select 
                                  className="inp h-10 px-3 bg-wh"
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
                                  className="inp h-10 px-3 bg-wh"
                                  placeholder="e.g. 10:00 - 11:00 AM"
                                  value={newRoutine.time}
                                  onChange={e => setNewRoutine({...newRoutine, time: e.target.value})}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-dt uppercase tracking-wider">Class / Activity Name</label>
                                <input 
                                  className="inp h-10 px-3 bg-wh"
                                  placeholder="e.g. Software Engineering"
                                  value={newRoutine.subj}
                                  onChange={e => setNewRoutine({...newRoutine, subj: e.target.value})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-dt uppercase tracking-wider">Location / Lab / Room</label>
                                <input 
                                  className="inp h-10 px-3 bg-wh"
                                  placeholder="e.g. Lab 3A / Online"
                                  value={newRoutine.room}
                                  onChange={e => setNewRoutine({...newRoutine, room: e.target.value})}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-1.5">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-dt uppercase tracking-wider">Faculty In-Charge</label>
                                <input 
                                  className="inp h-10 px-3 bg-wh"
                                  placeholder="e.g. Prof. Kumar"
                                  value={newRoutine.prof}
                                  onChange={e => setNewRoutine({...newRoutine, prof: e.target.value})}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <input 
                                type="checkbox"
                                id="isBreak"
                                className="w-4 h-4 rounded border-bc focus:ring-db text-db cursor-pointer"
                                checked={newRoutine.isBreak}
                                onChange={e => setNewRoutine({...newRoutine, isBreak: e.target.checked})}
                              />
                              <label htmlFor="isBreak" className="text-[11px] font-bold text-dt uppercase cursor-pointer select-none">Holiday / Break Period / বিরতি</label>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-2">
                            <button type="submit" className={`btn-primary h-11 flex items-center justify-center gap-2 w-full transition-all ${editingRoutineId ? 'bg-amber-600 hover:bg-amber-700 border-amber-700' : ''}`}>
                               <Calendar size={16} />
                               {editingRoutineId ? 'Save Routine Changes / আপডেট করুন' : 'Add to Weekly Schedule'}
                            </button>
                            {editingRoutineId && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingRoutineId(null);
                                  setNewRoutine({ day: 'Monday', time: '', subj: '', room: '', prof: '', isBreak: false });
                                }}
                                className="h-10 border border-bc text-[11px] font-bold text-mt hover:bg-bg hover:text-dt rounded-rs transition-colors w-full"
                              >
                                Cancel / ড্রাফট বাতিল
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* Right: Listed routines */}
                      <div className="lg:col-span-7 space-y-6">
                         {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                           const dayRoutines = (attConfig.routine || []).filter(r => r.day === day);
                           if (dayRoutines.length === 0) return null;
                           return (
                             <div key={day} className="space-y-3 bg-bg/15 p-3 rounded-rs border border-bc">
                               <div className="flex items-center gap-2 border-b border-bc pb-2 mb-2">
                                 <div className="w-1.5 h-4 bg-db rounded-full" />
                                 <h4 className="text-[11px] font-black text-dt uppercase tracking-widest">{day}</h4>
                               </div>
                               <div className="grid grid-cols-1 gap-2.5">
                                 {dayRoutines.map(r => (
                                   <div key={r.id} className={`flex items-center justify-between p-3.5 bg-wh border rounded-rs shadow-ss transition-all duration-300 ${editingRoutineId === r.id ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400' : 'border-bc hover:border-db'}`}>
                                     <div className="min-w-0 pr-2">
                                       <div className="flex items-center gap-2">
                                         <Clock size={11} className="text-db" />
                                         <span className="text-[10px] font-bold text-mt bg-bg px-2 py-0.5 rounded border border-bc">{r.time}</span>
                                       </div>
                                       <h5 className={`text-[13px] font-bold mt-1.5 ${r.isBreak ? 'text-red-500 italic bg-red-50 px-2 py-0.5 rounded border border-red-100 w-fit' : 'text-dt'} truncate`}>
                                         {r.subj}
                                       </h5>
                                       {!r.isBreak && (
                                         <p className="text-[10px] text-lt mt-1 font-semibold flex items-center gap-1.5 flex-wrap">
                                            <MapPin size={10} className="text-sf" /> 
                                            <span>{r.room}</span> 
                                            <span className="w-1 h-1 rounded-full bg-bc" />
                                            <span>{r.prof}</span>
                                         </p>
                                       )}
                                     </div>
                                     <div className="flex items-center gap-1 shrink-0">
                                       <button 
                                         onClick={() => {
                                           setEditingRoutineId(r.id);
                                           setNewRoutine({ day: r.day, time: r.time, subj: r.subj, room: r.room || '', prof: r.prof || '', isBreak: r.isBreak || false });
                                         }}
                                         className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${editingRoutineId === r.id ? 'bg-amber-100 text-amber-700' : 'text-db hover:bg-db/5'}`}
                                         title="Edit"
                                       >
                                         <Pencil size={14} />
                                       </button>
                                       <button 
                                         onClick={() => handleDeleteRoutine(r.id)}
                                         className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-all"
                                         title="Delete"
                                       >
                                         <Trash2 size={15} />
                                       </button>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           );
                         })}
                         {(attConfig.routine || []).length === 0 && (
                           <div className="py-12 text-center bg-bg/20 border border-dashed border-bc rounded-rm w-full">
                              <Calendar size={36} className="mx-auto mb-2 text-bc opacity-50" />
                              <p className="text-xs text-mt font-bold">Academic schedule is empty.</p>
                           </div>
                         )}
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'faculty' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bc">
                      <div className="flex items-center gap-2">
                         <GraduationCap size={18} className="text-db" />
                         <h3 className="text-base font-bold text-dt">Faculty Directory Control</h3>
                      </div>
                      {editingFacultyId && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Editing Profile / ফ্যাকাল্টি এডিট
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Form */}
                      <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
                        <form onSubmit={handleAddFaculty} className={`border rounded-rs p-4 space-y-4 transition-all duration-300 ${editingFacultyId ? 'border-amber-400 bg-amber-50/10' : 'border-bc bg-bg/50'}`}>
                          <div>
                            <h4 className="text-[11px] font-bold text-db uppercase tracking-wider mb-2">
                              {editingFacultyId ? 'Edit Faculty Profile / প্রফাইল পরিবর্তন করুন' : 'Register New Faculty / নতুন ফ্যাকাল্টি'}
                            </h4>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-dt uppercase tracking-wider">Faculty Member Name</label>
                              <input 
                                className="inp h-10 px-3 bg-wh"
                                placeholder="e.g. Dr. Satadruti Sen"
                                value={newFaculty.name}
                                onChange={e => setNewFaculty({...newFaculty, name: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-dt uppercase tracking-wider">Current Designation</label>
                              <input 
                                className="inp h-10 px-3 bg-wh"
                                placeholder="e.g. Professor & HOD"
                                value={newFaculty.designation}
                                onChange={e => setNewFaculty({...newFaculty, designation: e.target.value})}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-dt uppercase tracking-wider">Expertise Subjects (Comma Separated)</label>
                              <input 
                                className="inp h-10 px-3 bg-wh"
                                placeholder="Cyber Security, Cloud Computing, AI..."
                                value={newFaculty.subjects}
                                onChange={e => setNewFaculty({...newFaculty, subjects: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-dt uppercase tracking-wider">Email</label>
                                 <input 
                                   type="email"
                                   className="inp h-10 px-3 bg-wh"
                                   placeholder="name@eiilm.edu"
                                   value={newFaculty.email}
                                   onChange={e => setNewFaculty({...newFaculty, email: e.target.value})}
                                 />
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-black text-dt uppercase tracking-wider">Phone / WhatsApp</label>
                                 <input 
                                   className="inp h-10 px-3 bg-wh"
                                   placeholder="+91 98300..."
                                   value={newFaculty.phone}
                                   onChange={e => setNewFaculty({...newFaculty, phone: e.target.value})}
                                 />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-dt uppercase tracking-wider">Avatar / Photo URL</label>
                              <input 
                                className="inp h-10 px-3 bg-wh"
                                placeholder="https://..."
                                value={newFaculty.image}
                                onChange={e => setNewFaculty({...newFaculty, image: e.target.value})}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 pt-2">
                            <button type="submit" className={`btn-primary h-11 flex items-center justify-center gap-2 w-full transition-all ${editingFacultyId ? 'bg-amber-600 hover:bg-amber-700 border-amber-700' : ''}`}>
                               <GraduationCap size={16} />
                               {editingFacultyId ? 'Save Profile Changes / প্রফাইল সেভ' : 'Register Faculty Profile'}
                            </button>
                            {editingFacultyId && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingFacultyId(null);
                                  setNewFaculty({ name: '', designation: '', subjects: '', email: '', phone: '', image: '' });
                                }}
                                className="h-10 border border-bc text-[11px] font-bold text-mt hover:bg-bg hover:text-dt rounded-rs transition-colors w-full"
                              >
                                Cancel / ড্রাফট বাতিল
                              </button>
                            )}
                          </div>
                        </form>
                      </div>

                      {/* Right List */}
                      <div className="lg:col-span-7 space-y-3">
                        <h4 className="text-[10px] font-black text-lt uppercase tracking-widest bg-bg px-2.5 py-1 rounded border border-bc w-fit">
                          Campus Faculty Directory ({(attConfig.faculties || []).length})
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                           {(attConfig.faculties || []).map(f => (
                             <div key={f.id} className={`flex items-center gap-4 p-4 bg-wh border rounded-rs shadow-ss transition-all duration-300 ${editingFacultyId === f.id ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400' : 'border-bc hover:border-db'}`}>
                               <div className="w-14 h-14 rounded-full border border-bc overflow-hidden shrink-0 shadow-sm bg-bg">
                                 <img src={f.image || 'https://images.unsplash.com/photo-1544015759-113461472019?w=120'} className="w-full h-full object-cover" alt="Faculty Avatar" />
                               </div>
                               <div className="flex-1 min-w-0 pr-2">
                                 <h4 className="text-[14px] font-bold text-dt truncate">{f.name}</h4>
                                 <p className="text-[11px] text-db font-bold truncate tracking-tight">{f.designation}</p>
                                 <div className="flex flex-wrap gap-1.5 mt-1.5">
                                   {f.subjects && f.subjects.map((sub, i) => (
                                     <span key={i} className="text-[9px] bg-bg border border-bc text-sf px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{sub}</span>
                                   ))}
                                 </div>
                               </div>
                               <div className="flex items-center gap-1 shrink-0">
                                 <button 
                                   onClick={() => {
                                     setEditingFacultyId(f.id);
                                     setNewFaculty({
                                       name: f.name,
                                       designation: f.designation,
                                       subjects: (f.subjects || []).join(', '),
                                       email: f.email || '',
                                       phone: f.phone || '',
                                       image: f.image || ''
                                     });
                                   }}
                                   className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${editingFacultyId === f.id ? 'bg-amber-100 text-amber-700' : 'text-db hover:bg-db/5'}`}
                                   title="Edit"
                                 >
                                   <Pencil size={14} />
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteFaculty(f.id)}
                                   className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-all"
                                   title="Delete"
                                 >
                                   <Trash2 size={15} />
                                 </button>
                               </div>
                             </div>
                           ))}
                           {(attConfig.faculties || []).length === 0 && (
                             <div className="py-16 text-center border-2 border-dashed border-bc rounded-rs bg-bg/10 w-full">
                                <GraduationCap size={44} className="mx-auto mb-3 text-bc opacity-50" />
                                <p className="text-xs text-mt font-bold">Faculty list is empty. Add profiles to show to students.</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'device_notifications' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-bc">
                      <div className="flex items-center gap-2">
                         <Bell size={18} className="text-db" />
                         <h3 className="text-base font-bold text-dt">গলোবাল ডিভাইস পুশ নোটিফিকেশন / Device Alerts Control</h3>
                      </div>
                    </div>

                    <p className="text-[11px] text-mt leading-relaxed bg-bg p-3.5 rounded-rs border border-bc font-semibold">
                      📢 এই সেকশন থেকে পাঠানো নোটিফিকেশনগুলি সরাসরি স্টুডেন্টদের মোবাইলের হোম স্ক্রীন বা লক স্ক্রীমে পপ-আপ (Push Notification) আকারে যাবে। ফোন লক থাকলেও রিয়েলটাইমে নোটিফিকেশন রিসিভ হবে!
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Form block */}
                      <form onSubmit={handlePostDeviceNotification} className="lg:col-span-5 border border-bc rounded-rs p-4 space-y-4 bg-bg/50">
                        <div>
                          <h4 className="text-[11px] font-bold text-db uppercase tracking-wider mb-2">ব্রডকাস্ট নোটিফিকেশন এড করুন / Broadcast New Alert</h4>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-dt uppercase tracking-wider"> নোটিফিকেশন টাইটেল / Alert Title</label>
                            <input 
                              type="text"
                              className="inp h-9 px-3 text-xs"
                              placeholder="e.g., জরুরি ক্লাস পরিবর্তন! 🔔"
                              value={newDeviceNotification.title}
                              onChange={(e) => setNewDeviceNotification({ ...newDeviceNotification, title: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-dt uppercase tracking-wider"> নোটিফিকেশন মেসেজ / Alert Message Body</label>
                            <textarea 
                              rows={4}
                              className="inp p-3 text-xs resize-none"
                              placeholder="মেসেজটি এখানে লিখুন যা সরাসরি স্টুডেন্টদের লক স্ক্রিনে দেখা যাবে..."
                              value={newDeviceNotification.body}
                              onChange={(e) => setNewDeviceNotification({ ...newDeviceNotification, body: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full h-9 bg-db hover:bg-db2 text-white font-extrabold text-[11px] tracking-wider uppercase rounded shadow-ss transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Bell size={13} />
                          ডিভাইস নোটিফিকেশন পাঠান 🚀
                        </button>
                      </form>

                      {/* History block */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="p-1 px-2 border-b border-bc bg-slate-50 flex items-center gap-2 rounded-t-rs">
                          <Clock size={14} className="text-dt" />
                          <span className="text-[11px] font-black uppercase text-dt tracking-wider">নোটিফিকেশনের ইতিহাস / Push Alerts History</span>
                        </div>

                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                          {(attConfig.deviceNotificationHistory || []).map((notif) => (
                            <div key={notif.id} className="p-3 bg-bg/45 border border-bc rounded-rs space-y-2 hover:border-db transition-colors relative group">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h5 className="text-[12px] font-bold text-slate-800">{notif.title}</h5>
                                  <p className="text-[10.5px] text-slate-600 leading-normal mt-1">{notif.body}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDeviceNotification(notif.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors self-start cursor-pointer"
                                  title="Delete Alert"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                              <div className="text-[8.5px] text-slate-400 font-bold font-mono">
                                {new Date(notif.publishedAt).toLocaleString()}
                              </div>
                            </div>
                          ))}

                          {(attConfig.deviceNotificationHistory || []).length === 0 && (
                            <div className="py-12 text-center border-2 border-dashed border-bc rounded-rs bg-bg/15">
                              <Bell size={36} className="mx-auto mb-2 text-bc opacity-50" />
                              <p className="text-xs text-mt italic">কোনো ইতিহাস পাওয়া যায়নি।</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : activeTab === 'chatbot' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex items-center gap-2">
                       <ShieldCheck size={18} className="text-db" />
                       <h3 className="text-sm font-bold text-dt">Support Chatbot AI Config</h3>
                    </div>
                    
                    <p className="text-[11px] text-mt leading-relaxed bg-bg p-3 rounded-rs border border-bc">
                      এখানে প্রোভাইড করা <strong>Google Gemini API Key</strong> টি সমস্ত স্টুডেন্টদের জন্য গ্লোবাল এপিআই কী হিসেবে কাজ করবে। ফলে কোনো স্টুডেন্টকে আলাদা করে লোকাল সেটিংস বা কি দিতে হবে না।
                    </p>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-dt uppercase tracking-widest block font-bold">
                          Master Gemini API Key
                        </label>
                        <input 
                          type="password"
                          className="inp h-10 px-3 font-mono"
                          placeholder="AIzaSy... (Enter Gemini API Key)"
                          value={attConfig.geminiApiKey || ''}
                          onChange={async (e) => {
                            const newConfig = { ...attConfig, geminiApiKey: e.target.value.trim() };
                            setAttConfig(newConfig);
                            await attendanceService.saveGlobalConfig(newConfig);
                            setUpdateMsg('Master Gemini API Key updated ✓');
                            setTimeout(() => setUpdateMsg(''), 2000);
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-lt leading-normal font-semibold">
                        * এই কী টি রিয়েলটাইমে ফায়ারবেস ডেটাবেসে সংরক্ষিত হবে এবং এটি সুরক্ষিত উপায়ে সবার চ্যাটবটে কাজ করবে।
                      </p>
                    </div>
                  </motion.div>
                ) : activeTab === 'feedbacks' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-6"
                  >
                    <div className="flex items-center justify-between border-b border-bc pb-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={18} className="text-db" />
                        <h3 className="text-sm font-bold text-dt">Student Feedbacks & Suggestions</h3>
                      </div>
                      <span className="px-2.5 py-1 bg-db/5 border border-db/10 text-db text-[11px] font-black font-mono rounded-full">
                        Total: {(attConfig.feedbacks || []).length} Feedbacks
                      </span>
                    </div>

                    <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                      {(attConfig.feedbacks || []).map((fb) => (
                        <div key={fb.id} className="p-4 bg-bg/40 border border-bc rounded-rs space-y-3 relative group hover:border-db/35 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-[12px] font-bold text-slate-800">{fb.name}</h4>
                                <span className="text-[9.5px] px-1.5 bg-slate-100 text-slate-500 rounded font-bold font-mono">
                                  {fb.roll}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-yellow-400 mt-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} size={10} className={i < fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} />
                                ))}
                                <span className="text-[9px] text-slate-400 font-bold ml-1.5 font-mono">
                                  {new Date(fb.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 text-[8.5px] font-black uppercase bg-db/5 text-db rounded border border-db/10">
                              {fb.category}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-wh p-3 rounded-sm border border-bc/50 whitespace-pre-line">
                            "{fb.comment}"
                          </p>

                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => handleModerateFeedback(fb.id)}
                              className="py-1 px-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 text-[9.5px] font-bold rounded-rs transition-colors flex items-center gap-1 cursor-pointer select-none active:scale-[0.98]"
                            >
                              <Trash2 size={11} /> Delete Feedback / মুছুন
                            </button>
                          </div>
                        </div>
                      ))}

                      {(attConfig.feedbacks || []).length === 0 && (
                        <div className="py-16 text-center border-2 border-dashed border-bc rounded-rs bg-bg/15">
                          <MessageSquare size={36} className="mx-auto mb-2 text-bc opacity-50" />
                          <p className="text-xs text-mt italic font-bold">কোনো সাজেশন বা ফিডব্যাক জমা পড়েনি।</p>
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
