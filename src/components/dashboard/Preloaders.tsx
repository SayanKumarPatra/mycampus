import React, { useEffect, useState } from 'react';
import { 
  Terminal, 
  Database, 
  Coffee, 
  Binary,
  Activity,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

const preloaderStyle = `
@keyframes orbitGlow {
  0%, 100% { transform: scale(1); opacity: 0.25; }
  50% { transform: scale(1.1); opacity: 0.5; }
}
`;

// ==========================================
// 1. BRAND NEW STARTUP SPLASH SCREEN PRELOADER (3.8s FOR SUPERSLOW GENTLE GRAVITY MOTION)
// ==========================================
export function AppPreloader({ onComplete }: { onComplete: () => void }) {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Exactly at 1300ms, trigger "My Campus" text entrance
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 1300);

    // 3.8 seconds complete duration
    const timer = setTimeout(() => {
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(timer);
    };
  }, [onComplete]);

  // DOUBLE BOUNCE / TOSS GRAVITY KEYFRAMES FOR SMALLER SYMBOLS (Gentler and slower)
  const dynamicGravityVariants = (delay: number) => ({
    hidden: { y: "100vh", opacity: 0, rotate: 0 },
    visible: {
      y: ["100vh", "-35vh", "25vh", "-15vh", "120vh"], 
      opacity: [0, 1, 1, 1, 0],
      rotate: [0, 160, 210, 320, 480],
      transition: {
        duration: 3.6,
        times: [0, 0.35, 0.55, 0.75, 1],
        ease: ["easeOut", "easeIn", "easeOut", "easeIn"],
        delay: delay
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-db flex flex-col items-center justify-center z-50 select-none overflow-hidden">
      <style>{preloaderStyle}</style>

      {/* Ambient Radial Color Underlayer */}
      <div 
        className="absolute w-[450px] h-[450px] bg-sf/10 rounded-full filter blur-[110px] pointer-events-none"
        style={{ animation: 'orbitGlow 3s ease-in-out infinite' }}
      />

      {/* Floating Mini Symbols in a horizontal line */}
      <div className="flex gap-8 sm:gap-14 items-center justify-center absolute inset-x-0 top-1/3 z-20 px-8">
        
        {/* ICON 1: C++ */}
        <motion.div 
          variants={dynamicGravityVariants(0.0)}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center pointer-events-none relative"
        >
          <div className="absolute w-8 h-8 bg-sky-400/20 rounded-full filter blur-md pointer-events-none" />
          <Terminal size={38} className="text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.85)] relative z-10" />
          <span className="text-[9px] font-black tracking-widest text-sky-300 font-mono mt-2 opacity-90">C++</span>
        </motion.div>

        {/* ICON 2: JAVA */}
        <motion.div 
          variants={dynamicGravityVariants(0.08)}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center pointer-events-none relative"
        >
          <div className="absolute w-8 h-8 bg-[#ff9d4d]/20 rounded-full filter blur-md pointer-events-none" />
          <Coffee size={38} className="text-[#ff9d4d] drop-shadow-[0_0_12px_rgba(255,157,77,0.85)] relative z-10" />
          <span className="text-[9px] font-black tracking-widest text-[#ffa75e] font-mono mt-2 opacity-90">JAVA</span>
        </motion.div>

        {/* ICON 3: PYTHON */}
        <motion.div 
          variants={dynamicGravityVariants(0.16)}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center pointer-events-none relative"
        >
          <div className="absolute w-8 h-8 bg-yellow-400/20 rounded-full filter blur-md pointer-events-none" />
          <Binary size={38} className="text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.85)] relative z-10" />
          <span className="text-[9px] font-black tracking-widest text-yellow-300 font-mono mt-2 opacity-90">PYTHON</span>
        </motion.div>

        {/* ICON 4: DATABASE */}
        <motion.div 
          variants={dynamicGravityVariants(0.24)}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center pointer-events-none relative"
        >
          <div className="absolute w-8 h-8 bg-emerald-400/20 rounded-full filter blur-md pointer-events-none" />
          <Database size={38} className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.85)] relative z-10" />
          <span className="text-[9px] font-black tracking-widest text-emerald-300 font-mono mt-2 opacity-90">DATABASE</span>
        </motion.div>

      </div>

      {/* RISING TEXT CONTAINER: "MY CAMPUS" */}
      {/* Rises elegantly from bottom as the icons make their final drop */}
      <div className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-30 pointer-events-none mt-10">
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={showText ? { y: 0, opacity: 1, scale: 1 } : { y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 180, damping: 15 }}
          className="text-center"
        >
          <h1 className="font-rajdhani text-4xl sm:text-5xl font-black text-wh tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            MY <span className="text-sf">CAMPUS</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-mono font-bold text-wh/50 tracking-[0.3em] uppercase mt-1">
            EIILM ACADEMICS PORTAL
          </p>
        </motion.div>
      </div>

    </div>
  );
}

// ==========================================
// 2. QUICK SECTION NAVIGATION SWITCHER LOADER
// ==========================================
export function ActionPreloader({ pageId, onClose }: { pageId: string; onClose: () => void }) {
  const getPageContext = () => {
    switch (pageId) {
      case 'attendance':
        return {
          title: "COMPILING ATTENDANCE LEDGER",
          desc: "Refreshing monthly metrics, tracking roll percentages...",
          icon: <Activity className="text-sf animate-pulse shrink-0" size={24} />,
        };
      default:
        return {
          title: "COMPILING MATERIAL ROSTER",
          desc: "Refreshing assets...",
          icon: <FileText className="text-emerald-400 animate-bounce shrink-0" size={24} />,
        };
    }
  };

  const info = getPageContext();

  useEffect(() => {
    const t = setTimeout(() => {
      onClose();
    }, 400);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-db/75 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-wh border border-bc rounded-rl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex gap-4 items-center">
          <div className="p-3 bg-bg border border-bc/60 rounded-rm shrink-0 flex items-center justify-center">
            {info.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-rajdhani text-sm font-black text-dt uppercase">{info.title}</h3>
            <p className="text-[10px] text-mt/80 mt-1">{info.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
