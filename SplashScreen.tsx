"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const duration = 3500;
    const intervalTime = 35;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsBooting(false);
            setTimeout(onComplete, 800);
          }, 400);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  const bootMessages = [
    "CALIBRANDO AURA...",
    "SINCRONIZANDO ARQUITETO...",
    "ESTABILIZANDO PORTAL...",
    "ACESSANDO DUNGEON...",
    "DESPERTANDO..."
  ];

  const currentMessage = bootMessages[Math.min(Math.floor((progress / 100) * bootMessages.length), bootMessages.length - 1)];

  return (
    <div className="fixed inset-0 bg-[#030406] flex flex-col items-center justify-center z-[500] p-10 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,191,255,0.15)_0%,transparent_70%)]" />
        <div className="scanline opacity-20" />
        
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,191,255,0.05)_0%,transparent_80%)]"
        />
      </div>

      <AnimatePresence>
        {isBooting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            className="flex flex-col items-center justify-center w-full max-w-lg relative z-10"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-16"
            >
              <div className="w-44 h-44 border border-primary/10 rounded-full flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360, opacity: [0.4, 0.8, 0.4] }}
                  transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, opacity: { duration: 2, repeat: Infinity } }}
                  className="absolute inset-0 border-t-2 border-b-2 border-primary/40 rounded-full blur-[2px] will-change-transform"
                />
                
                <div className="w-32 h-32 border-2 border-primary rounded-full shadow-[0_0_60px_rgba(0,191,255,0.5)] flex items-center justify-center bg-primary/5">
                   <motion.div 
                     animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.5, 1, 0.5] }}
                     transition={{ duration: 3, repeat: Infinity }}
                     className="w-24 h-24 border border-primary/20 rounded-full will-change-transform"
                   />
                </div>
                
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-10px] border-r-2 border-primary/60 rounded-full will-change-transform" 
                />
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-center space-y-10 w-full"
            >
              <div className="space-y-1">
                <motion.h1 
                  animate={{ 
                    textShadow: [
                      "0 0 10px rgba(0,191,255,0.6)",
                      "0 0 20px rgba(0,191,255,0.8)",
                      "0 0 10px rgba(0,191,255,0.6)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl font-black text-primary uppercase italic tracking-normal font-orbitron"
                  style={{ letterSpacing: '0.1em', fontVariantLigatures: 'none' }}
                >
                  AURA FITNESS
                </motion.h1>
                <p className="text-[10px] tracking-[0.8em] text-primary/40 uppercase font-orbitron font-black ml-[0.8em]">
                  VETOR DE EVOLUÇÃO ATIVO
                </p>
              </div>
              
              <div className="space-y-6 w-full max-w-xs mx-auto">
                <div className="flex justify-between items-center px-1">
                  <motion.span 
                    key={currentMessage}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] font-black text-primary uppercase font-orbitron tracking-widest"
                  >
                    {currentMessage}
                  </motion.span>
                  <span className="text-[10px] font-mono font-bold text-primary/60">{Math.round(progress)}%</span>
                </div>
                
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px] relative">
                  <motion.div 
                    className="h-full bg-primary shadow-[0_0_15px_rgba(0,191,255,0.8)] rounded-full aura-progress-sweep will-change-transform"
                    style={{ scaleX: progress / 100, transformOrigin: 'left' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-12 text-center">
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          className="text-[9px] text-white/50 uppercase tracking-[1.2em] italic font-orbitron ml-[1.2em]"
        >
          ARQUITETURA DA EVOLUÇÃO
        </motion.p>
      </div>
    </div>
  );
}
