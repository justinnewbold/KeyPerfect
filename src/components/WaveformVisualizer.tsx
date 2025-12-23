import React, { useRef, useEffect, useState, useCallback } from 'react';
import { getAudioContext } from '../utils/audioEngine';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  color?: string;
  height?: number;
  barCount?: number;
  className?: string;
}

export function WaveformVisualizer({
  isPlaying,
  color = '#a855f7', // purple-500
  height = 60,
  barCount = 32,
  className = '',
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initAnalyser = useCallback(() => {
    if (isInitialized) return;

    try {
      const ctx = getAudioContext();

      // Create analyser if it doesn't exist
      if (!analyserRef.current) {
        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 64;
        analyserRef.current.smoothingTimeConstant = 0.8;

        // Note: In a real implementation, you'd connect this to the audio source
        // For now, we'll simulate the visualization
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio analyser:', error);
    }
  }, [isInitialized]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const canvasHeight = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, canvasHeight);

    // Generate visualizer bars
    const barWidth = width / barCount;
    const barGap = 2;

    for (let i = 0; i < barCount; i++) {
      // Generate pseudo-random values that animate smoothly when playing
      let barHeight: number;

      if (isPlaying) {
        // Animated bars when playing
        const time = Date.now() / 100;
        const wave = Math.sin(time + i * 0.5) * 0.3 + 0.5;
        const random = Math.random() * 0.3;
        barHeight = (wave + random) * canvasHeight * 0.8;
      } else {
        // Static low bars when not playing
        barHeight = canvasHeight * 0.1;
      }

      const x = i * barWidth;
      const y = (canvasHeight - barHeight) / 2;

      // Draw bar with gradient
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, `${color}40`);

      ctx.fillStyle = gradient;
      ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight);
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [isPlaying, barCount, color]);

  useEffect(() => {
    if (isPlaying) {
      initAnalyser();
      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Draw static state
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, draw, initAnalyser]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth * 2; // 2x for retina
        canvas.height = height * 2;
        canvas.style.width = '100%';
        canvas.style.height = `${height}px`;
        draw();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height, draw]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full ${className}`}
      style={{ height }}
    />
  );
}

// Simpler bar visualizer for inline use
export function SimpleVisualizer({
  isPlaying,
  barCount = 5,
  className = '',
}: {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center gap-0.5 h-4 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-purple-500 rounded-full transition-all duration-150 ${
            isPlaying ? 'animate-pulse' : ''
          }`}
          style={{
            height: isPlaying
              ? `${Math.random() * 60 + 40}%`
              : '20%',
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  );
}
