import React, { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, 
  Phone, 
  Building, 
  School, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle, 
  IdCard, 
  Mail, 
  Sparkles,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { getInitials, hashPw } from '../../utils';

interface ProfileProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
}

export default function Profile({ user, onUserUpdate }: ProfileProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    dept: user.department || '',
    sem: user.semester || '',
    password: user.plainPassword || ''
  });
  const [showPass, setShowPass] = useState(false);
  const [photo, setPhoto] = useState<string | null>(user.photo || null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with incoming real-time user object changes
  useEffect(() => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      dept: user.department || '',
      sem: user.semester || '',
      password: user.plainPassword || ''
    });
    setPhoto(user.photo || null);
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Photo too large. Max 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, phone, dept, sem, password } = formData;

    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Phone number cannot be empty.');
      return;
    }
    if (!dept) {
      setErrorMsg('Please select or specify your department.');
      return;
    }
    if (!sem) {
      setErrorMsg('Please select your semester.');
      return;
    }
    if (!password.trim() || password.trim().length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updatedUser: User = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
        department: dept,
        semester: sem,
        photo: photo,
        plainPassword: password.trim(),
        passwordHash: hashPw(password.trim())
      };

      await userService.saveUser(updatedUser);
      onUserUpdate(updatedUser);
      setSuccessMsg('Profile updated successfully ✓');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Update Profile Error:', err);
      setErrorMsg('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-rajdhani text-2xl font-bold text-db tracking-tight">Student Profile</h2>
          <p className="text-xs text-mt uppercase font-bold tracking-widest mt-0.5">Manage your personal information</p>
        </div>
        <div className="p-2 bg-sfl rounded-rs border border-sf/20 shrink-0">
          <Sparkles className="text-sf" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Visual Card Preview with Uploader */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-wh border border-bc rounded-rm p-6 shadow-ss flex flex-col items-center text-center relative overflow-hidden group">
            {/* Ambient Background Blur Circle */}
            <div className="absolute top-[-40px] right-[-40px] w-32 h-32 rounded-full bg-sfl/80 pointer-events-none" />
            <div className="absolute bottom-[-30px] left-[-30px] w-24 h-24 rounded-full bg-bg pointer-events-none" />
            
            {/* Avatar Uploader container */}
            <div className="relative z-10 mb-4 mt-2">
              <div className="w-24 h-24 rounded-full border-4 border-wh bg-sf shadow-ss overflow-hidden flex items-center justify-center font-rajdhani text-3xl font-bold text-db shrink-0">
                {photo ? (
                  <img src={photo} className="w-full h-full object-cover" />
                ) : (
                  getInitials(formData.name)
                )}
              </div>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-db text-wh border-2 border-wh flex items-center justify-center shadow-ss hover:bg-db2 hover:scale-105 active:scale-95 transition-all"
                title="Change Avatar"
              >
                <Camera size={14} />
              </button>
              <input 
                ref={fileInputRef} 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoChange} 
              />
            </div>

            {/* Profile Info Text */}
            <h3 className="text-base font-bold text-dt truncate max-w-full relative z-10">{formData.name || 'Your Name'}</h3>
            <p className="text-xs text-db font-bold uppercase tracking-wider relative z-10 px-2.5 py-0.5 bg-sfl rounded-full mt-1.5">{formData.dept || 'Select Dept'} · {formData.sem || 'Select Sem'}</p>
            
            <div className="w-full border-t border-bc/60 mt-5 pt-4 text-left space-y-2.5 relative z-10">
              <div className="flex items-center gap-2.5 text-xs text-mt">
                <IdCard size={14} className="text-lt min-w-4" />
                <span className="font-bold text-dt">Roll:</span>
                <span className="font-semibold text-dt/80">{user.roll}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-mt">
                <Mail size={14} className="text-lt min-w-4" />
                <span className="font-bold text-dt truncate" title={user.email}>Email:</span>
                <span className="font-semibold text-dt/80 truncate flex-1 block">{user.email}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-bg2/40 border border-bc rounded-rm text-[11px] text-mt italic leading-normal flex items-start gap-2">
            <Sparkles size={16} className="text-sf shrink-0 mt-0.5" />
            <span>Note: Changes here will update your profile across the MyCampus platform and be visible in any classes or submissions you are part of.</span>
          </div>
        </div>

        {/* Right Column: Editable Profile Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="bg-wh border border-bc rounded-rm p-6 shadow-ss space-y-5">
            <h3 className="text-xs font-black text-dt uppercase tracking-widest pb-2 border-b border-bc">Edit Profile Information</h3>

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-50 border border-green-100 rounded-rs text-green-700 text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-100 rounded-rs text-red-600 text-xs font-bold"
              >
                <span>{errorMsg}</span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-dt uppercase tracking-wider">Full Name *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                  <input 
                    type="text"
                    className="inp pl-9 py-2.5 h-10 w-full"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-dt uppercase tracking-wider">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                  <input 
                    type="text"
                    className="inp pl-9 py-2.5 h-10 w-full"
                    placeholder="e.g. +91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-dt uppercase tracking-wider">Department *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                  <select 
                    className="inp pl-9 py-2 h-10 pr-8 bg-no-repeat bg-[right_10px_center] bg-[length:12px]"
                    value={formData.dept}
                    onChange={(e) => setFormData({...formData, dept: e.target.value})}
                  >
                    <option value="">Select Department</option>
                    <option value="BCA">BCA (Bachelor of Computer Apps)</option>
                    <option value="BBA">BBA (Bachelor of Business Admin)</option>
                    <option value="MCA">MCA (Master of Computer Apps)</option>
                    <option value="MBA">MBA (Master of Business Admin)</option>
                  </select>
                </div>
              </div>

              {/* Semester */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-dt uppercase tracking-wider">Semester *</label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                  <select 
                    className="inp pl-9 py-2 h-10 pr-8 bg-no-repeat bg-[right_10px_center] bg-[length:12px]"
                    value={formData.sem}
                    onChange={(e) => setFormData({...formData, sem: e.target.value})}
                  >
                    <option value="">Select Semester</option>
                    <option value="1st Sem">1st Semester</option>
                    <option value="2nd Sem">2nd Semester</option>
                    <option value="3rd Sem">3rd Semester</option>
                    <option value="4th Sem">4th Semester</option>
                    <option value="5th Sem">5th Semester</option>
                    <option value="6th Sem">6th Semester</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-dt uppercase tracking-wider">Account Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                  <input 
                    type={showPass ? "text" : "password"}
                    className="inp pl-9 pr-10 py-2.5 h-10 w-full font-sans text-xs"
                    placeholder="Enter new password (min. 6 characters)"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPass(!showPass)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lt hover:text-db transition-colors cursor-pointer"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Read-only email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-dt uppercase tracking-wider">Registered Email (Read Only)</label>
                <div className="relative opacity-70">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                  <input 
                    type="text"
                    className="inp pl-9 py-2.5 h-10 w-full bg-bg cursor-not-allowed select-none text-xs text-mt"
                    value={user.email}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary !w-full sm:!w-auto px-6 py-2.5 h-10 flex items-center justify-center gap-2 cursor-pointer font-bold text-[13px] tracking-wide"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin-anim" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
