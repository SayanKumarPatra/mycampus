import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import { hashPw } from '../../utils';
import AuthLayout from './AuthLayout';

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
        <p className="text-center mt-3 text-[9px] text-lt leading-relaxed italic px-4">
          “This is an independent student-made platform and is not officially affiliated with EIILM Kolkata.”
        </p>
      </motion.div>
    </AuthLayout>
  );
}
