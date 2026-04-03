"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, SOUND_URLS, initializeAudio } from '@/lib/sounds';
import { AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IntroSequenceProps {
  onAccept: () => void;
}

export function IntroSequence({ onAccept }: IntroSequenceProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [showButtons, setShowButtons] = useState(false);
  const [declinedCount, setDeclinedCount] = useState(0);

  const messages = [
    "AVISO: O SISTEMA DETECTOU UM INDIVÍDUO COM POTENCIAL LATENTE.",
    "ANALISANDO O FLUXO DE MANA...",
    "CONDIÇÕES PARA O DESPERTAR ATENDIDAS.",
    "VOCÊ FOI ESCOLHIDO PELO ARQUITETO PARA SER O NOVO CAÇADOR DO SISTEMA AURA.",
    "ESTA É UMA CHANCE ÚNICA DE REESCREVER SEUS LIMITES BIOLÓGICOS.",
    "VOCÊ ACEITA O DESAFIO E O FARDO DA EVOLUÇÃO CONSTANTE?"
  ];

  const startIntro = async () => {
    await initializeAudio();
    playSound(SOUND_URLS.CLICK, 0.4);
    playSound(SOUND_URLS.CONFIRM, 0.4);
    setHasStarted(true);
  };

  useEffect(() => {
    if (hasStarted && textIndex < messages.length) {
      let charIndex = 0;
      const currentMsg = messages[textIndex];
      setIsTyping(true);
      setDisplayText(""); 
      
      const typingInterval = setInterval(() => {
        const nextChar = currentMsg[charIndex];
        
        if (nextChar !== " " && nextChar !== undefined) {
          playSound(SOUND_URLS.KEYBOARD, 0.2);
        }

        setDisplayText(currentMsg.substring(0, charIndex + 1));
        charIndex++;

        if (charIndex === currentMsg.length) {
          clearInterval(typingInterval);
          setIsTyping(false);
          
          if (textIndex < messages.length - 1) {
            setTimeout(() => {
              setTextIndex(prev => prev + 1);
            }, 1800);
          } else {
            setShowButtons(true);
          }
        }
      }, 70); 

      return () => clearInterval(typingInterval);
    }
  }, [hasStarted, textIndex]);

  const handleDecline = () => {
    playSound(SOUND_URLS.CLICK, 0.4);
    playSound(SOUND_URLS.BEEP, 0.4);
    setDeclinedCount(prev => prev + 1);
  };

  const handleAccept = () => {
    playSound(SOUND_URLS.CLICK, 0.4);
    playSound(SOUND_URLS.LEVEL_UP, 0.5);
    onAccept();
  };

  const getDeclineMessage = () => {
    if (declinedCount === 0) return "RECUSAR";
    if (declinedCount === 1) return "CERTEZA?";
    if (declinedCount === 2) return "MORTE CERTA";
    return "PENALIDADE ATIVA";
  };

  return (
    <div className="fixed inset-0 bg-[#030406] z-[600] flex flex-col items-center justify-center p-8 overflow-hidden font-mono">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,191,255,0.05)_0%,transparent_80%)] pointer-events-none" />
      <div className="scanline opacity-20" />
      
      {!hasStarted ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center space-y-8"
        >
          <div className="relative w-32 h-32 mx-auto mb-10 flex items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
            />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border border-primary/20 rounded-full border-t-primary/60"
            />
            <div className="w-20 h-20 rounded-full border-2 border-primary/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,191,255,0.3)] bg-primary/5">
              <Zap className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-primary font-orbitron tracking-widest aura-text-neon uppercase">HUNTER DETECTADO: SISTEMA AURA ATIVO</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] font-orbitron">AGUARDANDO INTERAÇÃO DO CAÇADOR</p>
          </div>
          <Button 
            onClick={startIntro}
            className="w-full h-16 bg-primary text-black font-black text-lg italic uppercase rounded-2xl shadow-[0_0_40px_rgba(0,191,255,0.4)] transition-all transform hover:scale-105 active:scale-95 font-orbitron"
          >
            ENTRAR NO SISTEMA
          </Button>
        </motion.div>
      ) : (
        <div className="w-full max-w-lg space-y-12 relative z-10">
          <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-primary/30 rounded-full blur-3xl"
            />
            
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-[-10px] border border-primary/40 rounded-full border-t-primary/80 border-b-primary/20"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 border border-primary/20 rounded-full border-l-primary/60 border-r-primary/10"
            />

            <motion.div 
              animate={{ scale: [0.85, 1.1, 0.85], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-16 h-16 bg-primary/40 rounded-full shadow-[0_0_50px_rgba(0,191,255,0.8)] border border-primary/60 flex items-center justify-center"
            >
              <div className="absolute inset-1.5 bg-primary/20 rounded-full blur-xl" />
              <div className="w-4 h-4 bg-white/50 rounded-full blur-[1px] shadow-[0_0_10px_white]" />
            </motion.div>

            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_15px_#00BFFF]" />
            </motion.div>
          </div>

          <div className="min-h-[160px] flex items-center justify-center">
            <motion.p 
              key={textIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg md:text-xl font-light text-primary text-center leading-relaxed tracking-tight aura-text-neon font-mono italic"
            >
              {displayText}
              {isTyping && (
                <motion.span 
                  animate={{ opacity: [0, 1, 0] }} 
                  transition={{ duration: 0.8, repeat: Infinity }} 
                  className="inline-block w-2 h-6 bg-primary ml-1 align-middle" 
                />
              )}
            </motion.p>
          </div>

          <AnimatePresence>
            {showButtons && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4"
              >
                <Button 
                  onClick={handleAccept}
                  className="w-full h-16 bg-primary text-black font-black text-lg italic uppercase rounded-2xl shadow-[0_0_30px_rgba(0,191,255,0.5)] border-b-4 border-primary/40 active:border-b-0 active:translate-y-1 transition-all font-orbitron"
                >
                  ACEITAR O DESAFIO
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={handleDecline}
                  className={cn(
                    "w-full h-12 text-white/30 font-black uppercase tracking-[0.3em] text-[10px] hover:text-red-500 transition-colors font-orbitron",
                    declinedCount > 0 && "text-red-500 animate-pulse"
                  )}
                >
                  {getDeclineMessage()}
                </Button>

                {declinedCount >= 3 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="text-[9px] text-red-500 font-black uppercase leading-tight font-mono font-light">
                      AVISO: RECUSAR O SISTEMA RESULTARÁ EM MISSÃO DE PENALIDADE IMINENTE. NÃO HÁ ESCAPATÓRIA.
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <p className="text-[8px] text-white/30 font-black uppercase tracking-[1em] font-orbitron drop-shadow-[0_0_8px_rgba(0,191,255,0.4)]">
          FLUXO DE MANA ATIVO
        </p>
      </div>
    </div>
  );
}
