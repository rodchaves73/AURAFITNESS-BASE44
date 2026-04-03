
"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export function ShadowMonarchOverlay() {
  // Gerar partículas de forma determinística mas aleatória para performance
  const particles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: `${Math.random() * 100}vw`,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 15
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Living Shadow Smoke */}
      <motion.div 
        animate={{ 
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#14071f20_0%,transparent_100%)] blur-[80px]"
      />

      {/* Shadow Eyes - Occasional blinking presence */}
      <div className="absolute top-[25%] left-[10%] shadow-eye-soft" />
      <div className="absolute top-[25%] right-[10%] shadow-eye-soft" />
      <div className="absolute bottom-[40%] left-[20%] shadow-eye-soft" style={{ animationDelay: '4s' }} />

      {/* Drifting Motes */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '110vh', x: p.x, opacity: 0 }}
          animate={{ 
            y: '-10vh', 
            opacity: [0, 0.2, 0],
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            delay: p.delay,
            ease: "linear"
          }}
          className="absolute w-1 h-1 bg-primary/10 rounded-full blur-[1px]"
        />
      ))}

      {/* Subtle Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
}
