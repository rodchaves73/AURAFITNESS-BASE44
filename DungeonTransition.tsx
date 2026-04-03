"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, SOUND_URLS } from '@/lib/sounds';

interface DungeonTransitionProps {
  onComplete: () => void;
}

const RUNES = ["ᛟ", "ᚦ", "ᚹ", "ᚷ", "ᛞ", "ᚱ", "ᚲ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛋ"];

// Componente do D20 Holográfico
const D20Icon = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24 text-primary drop-shadow-[0_0_15px_rgba(0,191,255,0.8)]">
    <path 
      d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
      className="opacity-40"
    />
    <path d="M50 5 L50 35 M50 95 L50 65" stroke="currentColor" strokeWidth="1" />
    <path d="M10 25 L40 45 M90 25 L60 45" stroke="currentColor" strokeWidth="1" />
    <path d="M10 75 L40 55 M90 75 L60 55" stroke="currentColor" strokeWidth="1" />
    <path d="M40 45 L60 45 L50 35 Z" fill="currentColor" className="opacity-20" stroke="currentColor" strokeWidth="1" />
    <path d="M40 45 L40 55 L50 65 L60 55 L60 45 Z" fill="none" stroke="currentColor" strokeWidth="1" />
    <text x="50" y="54" fontSize="12" fontWeight="900" textAnchor="middle" fill="currentColor" className="font-orbitron">20</text>
  </svg>
);

// Componente do Dragão Estilizado (Representação de Asa e Poder)
const DragonSilhouette = ({ rotation }: { rotation: number }) => (
  <motion.div 
    style={{ rotate: rotation }}
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
  >
    <div className="relative translate-y-[-110px]">
      <svg viewBox="0 0 100 100" className="w-16 h-16 text-primary/80 filter blur-[0.5px]">
        <path 
          d="M50 10 C60 10 80 30 90 50 C80 45 60 40 50 60 C40 40 20 45 10 50 C20 30 40 10 50 10 Z" 
          fill="currentColor" 
          className="opacity-60"
        />
        <path 
          d="M50 20 C55 20 65 30 70 40 C65 38 55 35 50 45 C45 35 35 38 30 40 C35 30 45 20 50 20 Z" 
          fill="black" 
          className="opacity-40"
        />
        <circle cx="50" cy="15" r="2" fill="white" className="animate-pulse" />
      </svg>
    </div>
  </motion.div>
);

export function DungeonTransition({ onComplete }: DungeonTransitionProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    playSound(SOUND_URLS.PORTAL_WHOOSH, 0.7);

    const timers = [
      setTimeout(() => setStep(1), 800),   
      setTimeout(() => setStep(2), 1800),  
      setTimeout(() => setStep(3), 2800),  
      setTimeout(() => {
        playSound(SOUND_URLS.CONFIRM, 0.5);
        onComplete();
      }, 4000) 
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete]);

  const messages = [
    "SINCRO COM O TRIUNVIRATO",
    "ESTABILIZANDO DRAGÕES",
    "DESPERTANDO O SELO 20",
    "INSTÂNCIA CARREGADA"
  ];

  const runeElements = useMemo(() => {
    return RUNES.map((rune, i) => {
      const angle = (i / RUNES.length) * (Math.PI * 2);
      const radius = 160; 
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      return { rune, x, y, delay: i * 0.05 };
    });
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#020203] z-[1000] flex flex-col items-center justify-center p-6 text-center overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="scanline" />
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,191,255,0.2)_0%,transparent_70%)]" 
        />
      </div>

      <div className="relative z-10 space-y-12 w-full max-w-lg flex flex-col items-center">
        
        <div className="relative flex justify-center items-center w-80 h-80">
          
          <AnimatePresence>
            {step >= 1 && (
              <motion.div 
                initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 360, scale: 1 }}
                transition={{ rotate: { duration: 15, repeat: Infinity, ease: "linear" }, opacity: { duration: 1.5 } }}
                className="absolute inset-0 flex items-center justify-center will-change-transform"
              >
                {runeElements.map((item, i) => (
                  <motion.span
                    key={i}
                    className="absolute font-orbitron text-xl font-bold aura-text-neon select-none"
                    style={{
                      transform: `translate(${item.x}px, ${item.y}px) rotate(${i * (360 / RUNES.length)}deg)`
                    }}
                  >
                    {item.rune}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {step >= 1 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 will-change-transform"
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <DragonSilhouette rotation={0} />
                  <DragonSilhouette rotation={120} />
                  <DragonSilhouette rotation={240} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            animate={{ 
              rotate: -360,
              scale: step >= 2 ? [1, 1.1, 0.95] : 1,
              boxShadow: step >= 2 
                ? ["0 0 40px rgba(0,191,255,0.4)", "0 0 120px rgba(0,191,255,0.7)", "0 0 40px rgba(0,191,255,0.4)"]
                : "0 0 20px rgba(0,191,255,0.1)"
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, ease: "easeInOut", repeat: Infinity },
              boxShadow: { duration: 2.5, repeat: Infinity }
            }}
            className="w-48 h-48 rounded-full border border-primary/20 flex items-center justify-center relative z-20 bg-black/40 backdrop-blur-md will-change-transform"
          >
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(0,191,255,0.2),transparent_50%,rgba(0,191,255,0.3),transparent)] animate-spin-slow blur-xl" />
            
            <motion.div 
              style={{ transformStyle: "preserve-3d" }}
              animate={{ 
                rotateX: [0, 10, -10, 0],
                rotateY: [0, -10, 10, 0]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <D20Icon />
            </motion.div>
          </motion.div>
        </div>

        <div className="space-y-6 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2 will-change-transform"
            >
              <h2 className="text-2xl font-black text-primary uppercase tracking-[0.3em] font-orbitron aura-text-neon italic">
                {messages[step]}
              </h2>
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-[0.2em] font-bold">
                {step === 0 ? "INVOCANDO O TRIUNVIRATO DE DRAGÕES" : 
                 step === 1 ? "ESTABILIZANDO MATRIZ DE DESTINO" : 
                 step === 2 ? "COLAPSANDO BARREIRA DIMENSIONAL" : "SINCRONIZAÇÃO COMPLETA"}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-3 h-1.5 w-48 mx-auto">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.1, width: 20 }}
                animate={{ 
                  opacity: step >= i ? 1 : 0.1, 
                  width: step >= i ? 40 : 20,
                  backgroundColor: '#00BFFF'
                }}
                className="h-full rounded-full shadow-[0_0_10px_rgba(0,191,255,0.5)] transition-all duration-500"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
