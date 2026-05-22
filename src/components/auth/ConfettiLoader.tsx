import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface ConfettiLoaderProps {
  onComplete?: () => void;
}

interface Particle {
  id: number;
  type: 'dot' | 'square' | 'ribbon';
  color: string;
  size: number;
  dx: number;
  dy: number;
  wind: number;
  duration: number;
  delay: number;
  rotate: number;
  pathD?: string;
}

const COLORS = [
  '#FF3B30', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#4CD964', // Green
  '#5AC8FA', // Cyan/Blue
  '#AF52DE', // Purple
  '#FF2D55', // Pink
  '#00E5FF', // Neon Cyan
  '#FF007F', // Neon Rose
];

export default function ConfettiLoader({ onComplete }: ConfettiLoaderProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Generate confetti waves
  useEffect(() => {
    const list: Particle[] = [];
    const count = 75; // Total particles in a single immersive burst

    for (let i = 0; i < count; i++) {
      const typeRand = Math.random();
      const type = typeRand < 0.35 ? 'dot' : typeRand < 0.7 ? 'square' : 'ribbon';
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size = Math.floor(Math.random() * 8) + 6; // 6px to 14px

      // Polar coordinates for explosion outward from the center
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 200 + 100; // Force of the initial pop
      const dx = Math.cos(angle) * velocity;
      // Shoot upwards slightly more than downwards
      const dy = Math.sin(angle) * velocity - (Math.random() * 80 + 40);

      const wind = (Math.random() - 0.5) * 80; // Side drift
      const duration = Math.random() * 1.8 + 1.2; // 1.2s to 3s
      const delay = Math.random() * 0.4; // Slightly staggered popup
      const rotate = Math.random() * 360 + 360; // 360 to 720 deg spin

      // Curvy ribbon path
      let pathD;
      if (type === 'ribbon') {
        const h = Math.random() > 0.5;
        pathD = h 
          ? "M 2 8 Q 8 2, 14 8 T 26 8" 
          : "M 2 2 Q 8 14, 14 2 T 26 2";
      }

      list.push({
        id: i,
        type,
        color,
        size,
        dx,
        dy,
        wind,
        duration,
        delay,
        rotate,
        pathD,
      });
    }

    setParticles(list);
  }, []);

  return (
    <div className="fixed inset-0 bg-transparent flex flex-col items-center justify-center z-50 pointer-events-none select-none overflow-hidden">
      {/* Confetti Spawner Center */}
      <div className="relative w-1 h-1 flex items-center justify-center">
        {particles.map((p) => {
          if (p.type === 'dot') {
            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: [0, p.dx, p.dx + p.wind],
                  y: [0, p.dy, p.dy + 450],
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 1, 0.4],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.1, 0.8, 0.25, 1], // Custom overshoot pop then slide down
                  repeat: Infinity,
                  repeatDelay: Math.random() * 0.5,
                }}
                className="absolute rounded-full shadow-lg"
                style={{
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                }}
              />
            );
          } else if (p.type === 'square') {
            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
                animate={{
                  x: [0, p.dx, p.dx + p.wind],
                  y: [0, p.dy, p.dy + 450],
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 1, 0.3],
                  rotate: [0, p.rotate / 2, p.rotate],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.1, 0.8, 0.25, 1],
                  repeat: Infinity,
                  repeatDelay: Math.random() * 0.5,
                }}
                className="absolute shadow-md"
                style={{
                  width: `${p.size * 1.2}px`,
                  height: `${p.size * 0.8}px`,
                  backgroundColor: p.color,
                  borderRadius: '1.5px',
                }}
              />
            );
          } else {
            // Unique Ribbon/Spiral particles
            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
                animate={{
                  x: [0, p.dx, p.dx + p.wind],
                  y: [0, p.dy, p.dy + 450],
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.1, 1, 0.3],
                  rotate: [0, p.rotate, p.rotate * 1.5],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.1, 0.8, 0.25, 1],
                  repeat: Infinity,
                  repeatDelay: Math.random() * 0.5,
                }}
                className="absolute flex items-center justify-center"
              >
                <svg
                  width={p.size * 2.5}
                  height={p.size * 1.5}
                  viewBox="0 0 28 12"
                  fill="none"
                  className="overflow-visible"
                >
                  <path
                    d={p.pathD}
                    stroke={p.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            );
          }
        })}
      </div>

      {/* Central Interactive Feedback to make the loading feel magical */}
    </div>
  );
}
