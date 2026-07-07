"use client";

import React, { useEffect, useRef } from 'react';
import { useStore, SeverityType } from '@/utils/store';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export default function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const systemLoad = useStore((state) => state.systemLoad);
  const systemSeverity = useStore((state) => state.systemSeverity);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic configuration based on system load & severity
    const getParticleCount = (load: number) => {
      return Math.min(30 + Math.floor(load * 0.5), 80); // Cap at 80 for performance
    };

    const getParticleSpeed = (severity: SeverityType) => {
      switch (severity) {
        case 'critical': return 1.5;
        case 'high': return 1.0;
        case 'medium': return 0.6;
        case 'low':
        default: return 0.3;
      }
    };

    const getParticleColor = (severity: SeverityType) => {
      switch (severity) {
        case 'critical': return 'rgba(239, 68, 68, 0.08)'; // critical red
        case 'high': return 'rgba(249, 115, 22, 0.08)'; // high orange
        case 'medium': return 'rgba(245, 158, 11, 0.08)'; // warning amber
        case 'low':
        default: return 'rgba(14, 165, 233, 0.06)'; // cool blue
      }
    };

    let particleCount = getParticleCount(systemLoad);
    let speedMultiplier = getParticleSpeed(systemSeverity);
    let particleColor = getParticleColor(systemSeverity);

    const particles: Particle[] = [];

    // Initialize particles
    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speedMultiplier,
          vy: (Math.random() - 0.5) * speedMultiplier,
          size: Math.random() * 2 + 1,
        });
      }
    };

    initParticles();

    // Resize handler
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw particle connections (flow-field lines)
      ctx.strokeStyle = particleColor;
      ctx.lineWidth = 0.5;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Update position
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce boundaries
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Draw particle node
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [systemLoad, systemSeverity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendingMode: 'screen' }}
    />
  );
}
