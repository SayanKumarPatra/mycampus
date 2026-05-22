import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldAlert, Terminal, Database, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { hashPw } from '../../utils';
import AuthLayout from './AuthLayout';
import ConfettiLoader from './ConfettiLoader';

interface LoginProps {
  onLogin: (user: User) => void;
  onSwitchToRegister: () => void;
  onOpenAdmin: () => void;
}

export default function Login({ onLogin, onSwitchToRegister, onOpenAdmin }: LoginProps) {
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password Recovery States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotResult, setForgotResult] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleRetrievePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanForgotEmail = forgotEmail.trim().toLowerCase();
    if (!cleanForgotEmail) {
      setForgotError('Please enter your email.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const user = await userService.getUser(cleanForgotEmail);
      if (!user) {
        setForgotError('নিবন্ধিত ইমেইল পাওয়া যায়নি। দয়া করে সঠিক ইমেইল দিন।');
      } else if (user.plainPassword) {
        setForgotResult(user.plainPassword);
      } else {
        setForgotError('পাসওয়ার্ডটি সরাসরি উদ্ধার করা সম্ভব হয়নি। দয়া করে এডমিনের সাথে যোগাযোগ করুন।');
      }
    } catch (err) {
      console.error(err);
      setForgotError('সিস্টেমে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setForgotLoading(false);
    }
  };

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

        {/* Onboarding Guide for New Students */}
        <div className="mb-5 p-3.5 bg-sky-50/60 border border-sky-100 rounded-rs">
          <div className="flex items-center gap-1.5 text-sky-800 text-[10px] font-black uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>নতুনদের জন্য লগইন নির্দেশিকা / Student Guide</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 bg-sky-100 text-sky-800 text-[9px] font-black rounded-full flex items-center justify-center shrink-0 mt-0.5">
                ১
              </span>
              <div>
                <p className="text-[11px] font-bold text-dt leading-none">একাউন্ট তৈরি করুন (Create Account)</p>
                <p className="text-[9.5px] text-mt mt-0.5 leading-normal">
                  প্রথমে নিচের <button type="button" onClick={onSwitchToRegister} className="text-sf font-black hover:underline focus:outline-none">Create Account</button> বাটনে ক্লিক করে সঠিক তথ্য দিয়ে রেজিস্ট্রেশন করুন।
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-full flex items-center justify-center shrink-0 mt-0.5">
                ২
              </span>
              <div>
                <p className="text-[11px] font-bold text-dt leading-none">লগইন করুন (Sign In)</p>
                <p className="text-[9.5px] text-mt mt-0.5 leading-normal">
                  রেজিস্ট্রেশন সম্পূর্ণ হওয়ার পর আপনার নিবন্ধিত সঠিক ইমেইল ও পাসওয়ার্ড দিয়ে নিচের ফরমে লগইন করুন।
                </p>
              </div>
            </div>
          </div>
        </div>

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
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-dt uppercase tracking-wider">Password</label>
              <button 
                type="button" 
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotResult('');
                  setForgotError('');
                }}
                className="text-[10px] text-sf font-black uppercase hover:underline hover:text-db transition-colors tracking-wide animate-pulse"
              >
                Forgot? / ভুলে গেছেন?
              </button>
            </div>
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

        <hr className="my-5 border-bc" />

        <div className="mt-5 pt-4 border-t border-bc text-center">
          <p className="text-[11px] font-bold text-dt tracking-wide">MyCampus Student Hub</p>
          <p className="text-[9px] text-lt leading-relaxed italic mt-1.5 px-3">
            "This is an independent student-made platform and is not officially affiliated with EIILM Kolkata."
          </p>

          {/* Premium Developer Tribute & Contact Profile */}
          <div className="mt-5 p-3.5 bg-gradient-to-br from-[#0c142c] to-[#04091a] rounded-rm border border-[#1b264f] text-left relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-20 h-20 bg-sf/5 rounded-full filter blur-xl" />
            <div className="absolute -bottom-6 -left-6 w-14 h-14 bg-db/5 rounded-full filter blur-md" />
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black text-sf uppercase tracking-widest bg-sf/10 border border-sf/20 px-2 py-0.5 rounded-full">
                    👑 Lead Architect
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h4 className="text-[13px] font-black text-wh tracking-wide uppercase font-rajdhani">
                  Sayan Kumar Patra
                </h4>
                <p className="text-[9.5px] text-slate-300 font-semibold mt-0.5">
                  CEO & Founder, <span className="text-sf font-black">HabaJaba Tech</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">EIILM Student</span>
                <span className="text-[8px] text-sf font-bold italic mt-0.5 block">Portal Creator</span>
              </div>
            </div>
          </div>
          
          {/* Extremely Discreet Admin Entrance */}
          <div className="mt-4 flex justify-center">
            <button 
              onClick={onOpenAdmin}
              className="text-[9px] text-lt/60 hover:text-db transition-all flex items-center gap-1 opacity-50 hover:opacity-100 uppercase tracking-widest font-bold"
              title="System Database Control"
            >
              <ShieldAlert size={10} />
              <span>Admin Gateway</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Confetti Loader Overlay on login (Visual replacement requested by user) */}
      {loading && <ConfettiLoader />}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-sm rounded-rm border border-bc shadow-xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-db via-sf to-[#FF5E00]" />
            
            <h3 className="font-rajdhani text-lg font-black text-db mb-1 flex items-center gap-1.5 uppercase mt-1">
              🔑 Password Recovery / পাসওয়ার্ড পুনরুদ্ধার
            </h3>
            <p className="text-[10.5px] text-mt mb-4 font-semibold leading-relaxed">
              নিচের ঘরে আপনার একাউন্টের নিবন্ধিত ইমেইল দিন। আমরা যাচাই করে আপনার পাসওয়ার্ড দেখাব।
            </p>

            {forgotError && (
              <div className="p-2.5 bg-red-50 border border-red-100 rounded-rs text-red-600 text-[11px] font-bold mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotResult ? (
              <div className="p-4 bg-slate-50 border border-bc rounded-rs mb-4 text-center">
                <p className="text-[9px] text-mt uppercase font-extrabold tracking-wider mb-2">Your Registered Password is:</p>
                <p className="text-xl font-black text-sf tracking-wider font-mono bg-white px-4 py-2 rounded-rs border border-bc inline-block select-all shadow-xs">
                  {forgotResult}
                </p>
                <div className="mt-3.5 pt-2 border-t border-dashed border-bc/60">
                  <p className="text-[10px] text-emerald-600 font-bold leading-normal">
                    ✓ পাসওয়ার্ডটি কপি করে লগইন ফর্মে ব্যবহার করুন।
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRetrievePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-dt uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-lt" size={17} />
                    <input 
                      type="email" 
                      required
                      className="inp pl-9 text-xs" 
                      placeholder="your@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={forgotLoading}
                  className="w-full btn-primary text-xs py-2.5 h-10 flex items-center justify-center gap-2 font-black uppercase tracking-wider"
                >
                  {forgotLoading ? "Checking Database..." : "Password খুঁজুন / Recovery Password"}
                </button>
              </form>
            )}

            <div className="mt-4 pt-3 border-t border-bc flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotEmail('');
                  setForgotResult('');
                  setForgotError('');
                }}
                className="px-4 py-2 text-xs font-black text-mt hover:text-db uppercase tracking-wider transition-colors border border-bc rounded-rs hover:bg-slate-50"
              >
                Close / বন্ধ করুন
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AuthLayout>
  );
}
