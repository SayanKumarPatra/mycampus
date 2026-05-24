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
    <div className="flex min-h-screen bg-slate-50/70 w-full">
      {/* Form Area - Perfect compact viewport layout with centered design and max-width boundaries */}
      <div className="flex-1 flex flex-col bg-white md:bg-slate-50/50 overflow-y-auto px-4 py-4 sm:py-6 md:px-12 justify-center items-center w-full">
        <div className="w-full max-w-[460px] my-auto py-4 md:py-5 px-4 md:px-8 md:bg-white md:border md:border-slate-200/80 md:rounded-rl md:shadow-md transition-all duration-300">
          
          {/* Responsive Header Image Banner (Extremely compact to save vertical space and prevent scroll) */}
          <div className="relative w-full h-[58px] sm:h-[68px] mb-3 rounded-rm overflow-hidden border border-bc/50 shadow-sm bg-slate-100 group">
            <img 
              src={bannerSrc} 
              alt="MyCampus Portal Logo Banner" 
              onError={handleImageError}
              className="w-full h-full object-cover object-[center_30%] md:object-[center_35%] transition-transform duration-500 group-hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
            {/* Subtle right-aligned shadow to ensure EIILM text is readable while keeping 75% of the image completely clear */}
            <div className="absolute inset-y-0 right-0 w-[55%] bg-gradient-to-l from-black/85 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-3 flex items-center">
              <span className="text-[8.5px] sm:text-[9.5px] text-sf bg-black/40 border border-white/20 backdrop-blur-md px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm">
                EIILM KOLKATA
              </span>
            </div>
          </div>

          {/* Unified Title Branding Header - Shown on BOTH Mobile & Desktop */}
          <div className="flex items-center gap-2.5 mb-3.5 pb-2.5 border-b border-bc">
            <div className="w-8 h-8 rounded-rm bg-db/5 border border-db/10 flex items-center justify-center text-[16px] shrink-0">
              🎓
            </div>
            <div>
              <h1 className="font-rajdhani text-xl font-black leading-none tracking-tighter">
                <span className="text-db">My</span>
                <span className="text-sf italic">Campus</span>
              </h1>
              <p className="text-[9px] text-mt font-bold uppercase tracking-wider mt-0.5">Smart Student Portal</p>
            </div>
          </div>
          
          {children}
        </div>
      </div>
    </div>
  );
}
