import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
}

interface Particle {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  shape: 'square' | 'circle';
}

const COLORS = [
  '#a855f7', // purple
  '#ec4899', // pink
  '#f97316', // orange
  '#22c55e', // green
  '#3b82f6', // blue
  '#eab308', // yellow
  '#ef4444', // red
  '#06b6d4', // cyan
];

export function Confetti({ active, duration = 3000, particleCount = 50 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.8,
        duration: 2 + Math.random(),
        size: Math.random() * 8 + 4,
        shape: Math.random() > 0.5 ? 'square' : 'circle',
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), duration + 1000);
      return () => clearTimeout(timer);
    } else {
      setParticles([]);
    }
  }, [active, duration, particleCount]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
