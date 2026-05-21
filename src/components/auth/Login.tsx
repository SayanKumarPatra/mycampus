import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldAlert, Terminal, Database, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { hashPw } from '../../utils';
import AuthLayout from './AuthLayout';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
  onOpenAdmin: () => void;
}

export default function Login({ onLogin, onSwitchToRegister, onOpenAdmin }: LoginProps) {
  const { isInstallable, triggerInstall } = usePWAInstall();
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await userService.getUser(cleanEmail);
      if (!user) {
        setError('No account found. Please register first.');
      } else if (user.passwordHash !== hashPw(cleanPassword)) {
        setError('Incorrect password. Please try again.');
      } else if (user.status === 'rejected') {
        setError('Your account has been rejected. Contact admin.');
      } else {
        onLogin(user);
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError('Connection error. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <h2 className="font-rajdhani text-2xl font-bold text-db mb-1">Welcome</h2>
        <p className="text-xs text-mt mb-6">Login to Smart Student Portal</p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-rs text-red-600 text-[12px] font-semibold mb-4 flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={18} />
              <input 
                type="email" 
                className="inp" 
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                className="inp pr-10" 
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lt hover:text-db transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? <LogIn size={18} className="spin-anim" /> : <LogIn size={18} />}
            Login to Portal
          </button>
        </form>

        <div className="text-center mt-5 text-[13px] text-mt">
          No account? <button onClick={onSwitchToRegister} className="text-sf font-bold hover:underline">Create Account</button>
        </div>

        <hr className="my-6 border-bc" />

        <button 
          onClick={onOpenAdmin}
          className="w-full p-3 border border-dashed border-[#c4a060] rounded-rs text-[#8a6a20] text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-[#fdf7ed] transition-all"
        >
          <ShieldAlert size={16} />
          Admin Panel — Database Control
        </button>
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
          {isInstallable && (
            <div className="mt-4 flex flex-col items-center justify-center">
              <button
                type="button"
                id="pwa-playstore-download-btn"
                onClick={triggerInstall}
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
          )}
        </div>
      </motion.div>

      {/* Floating PNG Icon & Symbols Preloader Overlay on login (Transparent & Text-free) */}
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
                <div className="absolute w-8 h-8 bg-sky-400/10 rounded-full filter blur-md pointer-events-none" />
                <Terminal size={32} className="text-sky-600 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]" />
              </motion.div>

              {/* Database / DBMS */}
              <motion.div
                animate={{ y: [10, -10] }}
                transition={{ duration: 4.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <div className="absolute w-8 h-8 bg-emerald-400/10 rounded-full filter blur-md pointer-events-none" />
                <Database size={32} className="text-emerald-600 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              </motion.div>

              {/* Layers / BCA */}
              <motion.div
                animate={{ y: [-8, 8] }}
                transition={{ duration: 4.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <div className="absolute w-8 h-8 bg-amber-400/10 rounded-full filter blur-md pointer-events-none" />
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
