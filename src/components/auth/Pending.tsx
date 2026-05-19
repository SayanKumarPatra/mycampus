import { useState, useEffect } from 'react';
import { Clock, Check, RefreshCw, LogOut, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../../types';
import { userService } from '../../services/userService';
import AuthLayout from './AuthLayout';

interface PendingProps {
  user: User;
  onApproved: (user: User) => void;
  onLogout: () => void;
}

export default function Pending({ user, onApproved, onLogout }: PendingProps) {
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const freshUser = await userService.getUser(user.email);
      if (freshUser && freshUser.status === 'approved') {
        onApproved(freshUser);
      }
    } finally {
      setTimeout(() => setChecking(false), 800);
    }
  };

  return (
    <AuthLayout>
       <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-[#fff8f0] rounded-full flex items-center justify-center mx-auto mb-5 border-3 border-sf animate-bounce-slow">
          <Clock className="text-sf" size={40} />
        </div>
        
        <h2 className="font-rajdhani text-2xl font-bold text-db mb-1.5">Registration Submitted!</h2>
        <p className="text-[13px] text-mt leading-relaxed mb-6">
          Hello <strong>{user.name}</strong>, your account is pending admin approval.
        </p>

        <div className="bg-bg rounded-rm p-4 text-left mb-6 space-y-3">
          <div className="flex items-center gap-3 text-xs">
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
               <Check size={14} />
            </div>
            <span className="text-dt font-medium">Form Submitted Successfully</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="w-6 h-6 rounded-full bg-orange-50 text-[#c07a20] flex items-center justify-center shrink-0 font-bold border border-orange-100">
               2
            </div>
            <span className="text-dt font-medium">Waiting for Admin Approval</span>
          </div>
          <div className="flex items-center gap-3 text-xs opacity-40">
            <div className="w-6 h-6 rounded-full bg-bc text-mt flex items-center justify-center shrink-0 font-bold">
               3
            </div>
            <span className="text-dt font-medium">Account Activated — You Can Login</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center">
          <button 
            onClick={checkStatus} 
            disabled={checking}
            className="px-5 py-2.5 bg-wh border border-bc rounded-rs text-xs font-semibold text-mt hover:border-db hover:text-db flex items-center gap-2 transition-all"
          >
            <RefreshCw size={14} className={checking ? 'spin-anim' : ''} />
            Check Status
          </button>
          <button 
            onClick={onLogout}
            className="px-5 py-2.5 bg-wh border border-bc rounded-rs text-xs font-semibold text-mt hover:border-db hover:text-db flex items-center gap-2 transition-all"
          >
            <LogOut size={14} />
            Back to Login
          </button>
        </div>

        <div className="mt-5 p-3.5 bg-orange-50 border border-orange-100 rounded-rs text-[11px] text-[#7a4a10] leading-relaxed text-left flex gap-2.5">
          <Info size={16} className="shrink-0 text-sf" />
          <p>
            <strong>Note:</strong> Once approved, you can login from any device using your email and password.
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
