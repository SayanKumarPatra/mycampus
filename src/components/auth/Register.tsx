import React, { useState, useRef } from 'react';
import { UserPlus, Mail, Lock, Eye, EyeOff, User as UserIcon, IdCard, Phone, School, Building, Camera, Loader2, ShieldAlert, Terminal, Database, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { User as UserType } from '../../types';
import { userService } from '../../services/userService';
import { hashPw } from '../../utils';
import AuthLayout from './AuthLayout';

interface RegisterProps {
  onRegistered: (user: UserType) => void;
  onSwitchToLogin: () => void;
}

export default function Register({ onRegistered, onSwitchToLogin }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    roll: '',
    email: '',
    dept: '',
    sem: '',
    phone: '',
    pass: '',
    cpass: ''
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [showCPass, setShowCPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo too large. Max 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, roll, email, dept, sem, phone, pass, cpass } = formData;
    
    // Trimming and cleaning inputs
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    const cleanCPass = cpass.trim();

    if (!name || !roll || !cleanEmail || !dept || !sem || !phone || !cleanPass) {
      setError('Please fill all required fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (cleanPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (cleanPass !== cleanCPass) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const existing = await userService.getUser(cleanEmail);
      if (existing) {
        setError('This email is already registered. Please login.');
        setLoading(false);
        return;
      }

      const id = 'u' + Date.now() + Math.random().toString(36).slice(2, 6);
      const newUser: UserType = {
        id,
        name: name.trim(),
        roll: roll.trim().toUpperCase(),
        email: cleanEmail,
        department: dept,
        semester: sem,
        phone: phone.trim(),
        photo: photo,
        passwordHash: hashPw(cleanPass),
        plainPassword: cleanPass,
        status: 'pending',
        registeredAt: Date.now()
      };

      await userService.saveUser(newUser);
      onRegistered(newUser);
    } catch (err) {
      console.error("Register Error:", err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full py-4"
      >
        <h2 className="font-rajdhani text-2xl font-bold text-db mb-1">MyCampus Account 🎓</h2>
        <p className="text-xs text-mt mb-6">Join the Smart Student Portal</p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-rs text-red-600 text-[12px] font-semibold mb-4 flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3.5 p-3.5 border-2 border-dashed border-bc rounded-rm bg-bg cursor-pointer hover:border-db hover:bg-bg2 transition-all mb-4"
        >
          <div className="w-14 h-14 rounded-full bg-bg2 flex items-center justify-center border-2 border-bc overflow-hidden shrink-0">
            {photo ? <img src={photo} className="w-full h-full object-cover" /> : <Camera size={24} className="text-mt" />}
          </div>
          <div>
            <div className="text-[13px] font-bold text-db">Upload Your Photo</div>
            <div className="text-[11px] text-mt mt-0.5">Click to select · JPG/PNG · Max 2MB</div>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Full Name *</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                <input 
                  className="inp pl-9 py-2.5" 
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Roll No *</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                <input 
                  className="inp pl-9 py-2.5" 
                  placeholder="Roll No"
                  value={formData.roll}
                  onChange={(e) => setFormData({...formData, roll: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
              <input 
                type="email"
                className="inp pl-9 py-2.5" 
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Dept *</label>
              <div className="relative">
                 <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                 <select 
                   className="inp pl-9 py-2.5 appearance-none pr-8 bg-no-repeat bg-[right_10px_center] bg-[length:12px]" 
                   value={formData.dept}
                   onChange={(e) => setFormData({...formData, dept: e.target.value})}
                 >
                   <option value="">Select</option>
                   <option>BCA</option>
                 </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Sem *</label>
              <div className="relative">
                 <School className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                 <select 
                   className="inp pl-9 py-2.5 appearance-none pr-8"
                   value={formData.sem}
                   onChange={(e) => setFormData({...formData, sem: e.target.value})}
                 >
                   <option value="">Select</option>
                   {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={`${s}st Sem`}>{s}{s===1?'st':s===2?'nd':s===3?'rd':'th'} Sem</option>)}
                 </select>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Phone *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
              <input 
                type="tel"
                className="inp pl-9 py-2.5" 
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Pass *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                <input 
                  type={showPass ? "text" : "password"}
                  className="inp pl-9 py-2.5 pr-8" 
                  placeholder="6+ chars"
                  value={formData.pass}
                  onChange={(e) => setFormData({...formData, pass: e.target.value})}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-lt">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Confirm *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                <input 
                  type={showCPass ? "text" : "password"}
                  className="inp pl-9 py-2.5 pr-8" 
                  placeholder="Repeat"
                  value={formData.cpass}
                  onChange={(e) => setFormData({...formData, cpass: e.target.value})}
                />
                <button type="button" onClick={() => setShowCPass(!showCPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-lt">
                  {showCPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary mt-2"
          >
            {loading ? <Loader2 size={18} className="spin-anim" /> : <UserPlus size={18} />}
            Submit Registration
          </button>
        </form>

        <div className="text-center mt-4 text-[13px] text-mt">
          Have account? <button onClick={onSwitchToLogin} className="text-sf font-bold hover:underline">Login Here</button>
        </div>

        <div className="mt-6 pt-5 border-t border-bc text-center">
          <p className="text-[11px] font-bold text-dt tracking-wide">MyCampus Student Hub</p>
          <p className="text-[9px] text-lt leading-relaxed italic mt-1.5 px-3">
            "This is an independent student-made platform and is not officially affiliated with EIILM Kolkata."
          </p>
          <div className="mt-3.5 pt-3 border-t border-dashed border-bc/60">
            <p className="text-[10px] text-mt">Developed by <span className="font-bold text-sf">HabaJaba Tech</span></p>
            <p className="text-[9px] text-lt font-mono mt-0.5">CEO & Founder: Sayan Kumar Patra</p>
          </div>

          {/* Authentic Google Play styled download badge linked to absolute PWA installation prompt */}
          <div className="mt-4 flex flex-col items-center justify-center">
            <button
              type="button"
              id="pwa-playstore-download-btn-reg"
              onClick={() => {
                if ((window as any).triggerPwaInstall) {
                  (window as any).triggerPwaInstall();
                } else {
                  alert("Student portal PWA engine is starting up. Please click again in a brief second!");
                }
              }}
              className="flex items-center gap-3 bg-[#0f0f14] hover:bg-[#1f1f29] text-white border border-white/10 hover:border-[#ff9d4d]/30 px-5 py-2 rounded-xl transition-all shadow-md group active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.6 1.8C3.1 2.3 2.8 3.1 2.8 4.2V35.8C2.8 36.9 3.1 37.7 3.6 38.2L3.8 38.4L22.2 20L3.8 1.6L3.6 1.8Z" fill="#00E5FF" />
                <path d="M28.3 26.1L22.2 20L3.8 38.4C4.4 39 5.3 39.1 6.4 38.5L28.3 26.1Z" fill="#FF3D00" />
                <path d="M28.3 13.9L6.4 1.5C5.3 0.9 4.4 1 3.8 1.6L22.2 20L28.3 13.9Z" fill="#4CAF50" />
                <path d="M34.4 17.4C35.2 17.9 35.6 18.9 35.6 20C35.6 21.1 35.2 22.1 34.4 22.6L28.3 26.1L22.2 20L28.3 13.9L34.4 17.4Z" fill="#FFC107" />
              </svg>
              <div className="text-left leading-none">
                <p className="text-[8px] uppercase tracking-wider font-semibold text-white/50">Google Play Styled</p>
                <p className="text-[13px] font-bold text-white group-hover:text-[#ff9d4d] transition-colors mt-0.5">Download Now</p>
              </div>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Floating PNG Icon & Symbols Preloader Overlay on Registration (Transparent & Text-free) */}
      {loading && (
        <div className="fixed inset-0 bg-transparent flex flex-col items-center justify-center z-50 select-none pointer-events-none">
          <div className="flex flex-col items-center pointer-events-none">
            
            {/* Horizontal array of floating academic symbols */}
            <div className="flex gap-8 sm:gap-12 items-center justify-center mb-8">
              {/* Terminal / C++ */}
              <motion.div
                animate={{ y: [-10, 10] }}
                transition={{ duration: 4.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <div className="absolute w-8 h-8 bg-sky-400/10 rounded-full filter blur-md pointer-none" />
                <Terminal size={32} className="text-sky-600 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
              </motion.div>

              {/* Database / DBMS */}
              <motion.div
                animate={{ y: [10, -10] }}
                transition={{ duration: 4.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <div className="absolute w-8 h-8 bg-emerald-400/10 rounded-full filter blur-md pointer-none" />
                <Database size={32} className="text-emerald-600 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              </motion.div>

              {/* Layers / BCA */}
              <motion.div
                animate={{ y: [-8, 8] }}
                transition={{ duration: 4.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <div className="absolute w-8 h-8 bg-amber-400/10 rounded-full filter blur-md pointer-none" />
                <Layers size={32} className="text-amber-600 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
              </motion.div>
            </div>

            {/* Central PWA PNG Banner and floating animation */}
            <motion.div
              animate={{ y: [-10, 10], scale: [0.99, 1.01, 0.99] }}
              transition={{
                duration: 3.6,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className="relative py-4 px-6 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-sf/10 rounded-full filter blur-2xl transform scale-110 pointer-events-none" />
              <div className="flex items-center justify-center select-none relative z-10">
                <span className="font-rajdhani text-3xl sm:text-4xl font-black text-[#5a0c35] tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)]">My</span>
                <span className="font-rajdhani text-3xl sm:text-4xl font-black bg-gradient-to-r from-[#FF9500] to-[#FF5E00] bg-clip-text text-transparent ml-1 tracking-tight drop-shadow-[0_2px_10px_rgba(255,94,0,0.15)]">Campus</span>
              </div>
            </motion.div>

          </div>
        </div>
      )}
    </AuthLayout>
  );
}
