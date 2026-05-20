import React, { useState, useRef } from 'react';
import { UserPlus, Mail, Lock, Eye, EyeOff, User as UserIcon, IdCard, Phone, School, Building, Camera, Loader2, ShieldAlert } from 'lucide-react';
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
        </div>
      </motion.div>
    </AuthLayout>
  );
}
