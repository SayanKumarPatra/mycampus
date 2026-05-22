import React from 'react';
import { motion } from 'motion/react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const slides = [
    {
      title: "MyCampus",
      sub: "Smart Student Portal",
      badge: "📋 Designed for EIILM Kolkata Students",
      icon: "🎓"
    },
    {
      title: "Smart Attendance Tracking",
      sub: "Mark daily attendance subject-wise. View weekly & monthly heatmaps with instant analytics.",
      badge: "Real-time Sync",
      icon: "📅"
    },
    {
      title: "Study Materials",
      sub: "Access lecture notes, study materials and resources uploaded directly by your faculty.",
      badge: "12 Resources Available",
      icon: "📚"
    },
    {
      title: "Official Notices",
      sub: "Get instant updates on exam dates, events, holidays and all official college announcements.",
      badge: "Stay Updated",
      icon: "📢"
    }
  ];

  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [bannerSrc, setBannerSrc] = React.useState('https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjLPg4TERLB7-eH0JCqcZlm_NSqM35vNUIX0q7x9PbusmLrsNvWXn4quFF6S0P3-8NYqXnzEm9S-_rVw-N3XQ7MNb-5esolg6tiLYdiy1hhdALDHyd_5FX_jV76PAR2BBcpDgPCku-jWRAp9Wq1XR7IcEVznh13xunfwpLpUj0HmYf942cbTtWjrZzNeeM/s1068/IMG_20260522_211836.jpg');

  const handleImageError = () => {
    if (bannerSrc !== 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&h=160&q=80') {
      setBannerSrc('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&h=160&q=80');
    }
  };

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop Only */}
      <div className="hidden lg:flex flex-col w-[42%] bg-db relative overflow-hidden">
        <motion.div 
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div key={idx} className={`min-w-full h-full flex flex-col items-center justify-center p-10 text-center relative z-10 
              ${idx === 0 ? 'bg-gradient-to-br from-[#071540] via-db to-db2' : 
                idx === 1 ? 'bg-gradient-to-br from-[#1a0050] via-[#2d1b69] to-db' :
                idx === 2 ? 'bg-gradient-to-br from-[#071a30] via-[#0e3460] to-[#0a2a5c]' :
                'bg-gradient-to-br from-[#400000] via-[#8b1a1a] to-[#c07010]'}`}>
              
              <div className="absolute top-[-80px] right-[-60px] w-64 h-64 rounded-full bg-sf/10" />
              <div className="absolute bottom-[-50px] left-[-40px] w-40 h-40 rounded-full bg-wh/5" />
              
              {idx === 0 ? (
                <div className="mb-6">
                  <div className="font-rajdhani text-7xl font-black italic tracking-tighter flex items-center leading-none">
                    <span className="text-wh">My</span>
                    <span className="text-sf">Campus</span>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-rm bg-wh/12 border-2 border-wh/20 flex items-center justify-center text-4xl mb-6 backdrop-blur-sm">
                  {slide.icon}
                </div>
              )}

              <h2 className="font-rajdhani text-3xl font-bold text-wh mb-2 tracking-wide uppercase">
                {slide.title}
              </h2>
              <p className="text-wh/70 text-sm max-w-md mb-4">{slide.sub}</p>
              <div className="px-3.5 py-1 bg-sf/20 border border-sf/40 rounded-full text-[10px] text-sf2 font-bold uppercase">
                {slide.badge}
              </div>
            </div>
          ))}
        </motion.div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {slides.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === i ? 'w-5 bg-sf' : 'w-1.5 bg-wh/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 flex flex-col bg-wh overflow-y-auto px-6 py-8 sm:px-10">
        <div className="w-full max-w-sm mx-auto my-auto py-3">
          
          {/* Responsive Header Image Banner (Ultra Low Height, Elegant) */}
          <div className="relative w-full h-[54px] sm:h-[64px] mb-5 rounded-rm overflow-hidden border border-bc/60 shadow-xs bg-slate-100 group">
            <img 
              src={bannerSrc} 
              alt="MyCampus Portal Logo Banner" 
              onError={handleImageError}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Subtle right-aligned shadow to ensure EIILM text is readable while keeping 75% of the image completely clear */}
            <div className="absolute inset-y-0 right-0 w-[50%] bg-gradient-to-l from-black/70 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <span className="text-[8px] sm:text-[9px] text-sf bg-white/10 border border-white/25 backdrop-blur-md px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm">
                EIILM KOLKATA
              </span>
            </div>
          </div>

          {/* Unified Title Branding Header - Shown on BOTH Mobile & Desktop */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-bc">
            <div className="w-10 h-10 rounded-rm bg-db/5 border border-db/10 flex items-center justify-center text-xl shrink-0">
              🎓
            </div>
            <div>
              <h1 className="font-rajdhani text-2xl font-black leading-none tracking-tighter">
                <span className="text-db">My</span>
                <span className="text-sf italic">Campus</span>
              </h1>
              <p className="text-[10px] text-mt font-bold uppercase tracking-wider mt-1">Smart Student Portal</p>
            </div>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
