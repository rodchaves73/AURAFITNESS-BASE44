"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

const BOOT_MESSAGES = [
  "AURA INITIALIZING...",
  "SYNCING CORE...",
  "CALIBRATING PROTOCOLS...",
  "DETERMINING RANK...",
  "EVOLUTION SYSTEM ONLINE"
];

export function V2SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 1200);
          return 100;
        }
        return prev + 1.5;
      });
    }, 40);

    const msgInterval = setInterval(() => {
      setMsgIdx((prev) => (prev < BOOT_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 800);

    return () => {
      clearInterval(interval);
      clearInterval(msgInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#030406] flex flex-col items-center justify-center z-[500] p-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#00F0FF10,transparent_70%)]" />
        <div className="scanline" />
      </div>

      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mb-20"
      >
        <div className="w-48 h-48 rounded-full border border-primary/20 flex items-center justify-center aura-ring-pulse">
           <div className="w-36 h-36 border-4 border-primary rounded-full shadow-[0_0_60px_rgba(0,240,255,0.4)]" />
           <motion.div 
             animate={{ rotate: 360 }}
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
             className="absolute inset-0 border-t-2 border-primary rounded-full opacity-60"
           />
        </div>
      </motion.div>

      <div className="text-center w-full max-w-xs space-y-10 relative z-10">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter aura-text-neon uppercase italic">
            AURA
          </h1>
          <p className="text-[10px] tracking-[1em] text-primary/40 uppercase font-orbitron">
            SYSTEM HUD
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1 font-orbitron">
            <span className="text-[9px] text-primary/70 animate-pulse">{BOOT_MESSAGES[msgIdx]}</span>
            <span className="text-[10px] text-primary">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden aura-progress-sweep">
             <motion.div 
               className="h-full bg-primary"
               style={{ width: `${progress}%` }}
             />
          </div>
        </div>
      </div>
    </div>
  );
}