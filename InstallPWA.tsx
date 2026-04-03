
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playSound, SOUND_URLS } from '@/lib/sounds';

/**
 * @fileOverview Componente de Instalação PWA.
 * Detecta suporte e exibe o prompt de instalação no HUD do Caçador.
 */
export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Impede que o navegador mostre o prompt padrão imediatamente
      e.preventDefault();
      // Salva o evento para ser disparado depois
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verifica se o app já está instalado (standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    playSound(SOUND_URLS.CONFIRM, 0.5);
    
    // Mostra o prompt de instalação
    deferredPrompt.prompt();
    
    // Aguarda a resposta do Caçador
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('Nexus: O Caçador aceitou a instalação do sistema.');
    }
    
    // Limpa o prompt
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleClose = () => {
    playSound(SOUND_URLS.CLICK, 0.3);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-6 right-6 z-[600] md:max-w-xs md:left-auto"
        >
          <div className="shadow-panel p-4 flex items-center gap-4 border-primary/30 bg-black/80 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
              <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full bg-primary shadow-[0_0_10px_#00BFFF]"
              />
            </div>

            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-primary animate-bounce" />
            </div>

            <div className="flex-1">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-widest font-orbitron">Instalar Sistema</h4>
              <p className="text-[9px] text-white/60 font-medium uppercase font-orbitron">Acesse o HUD em Rank-S</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleInstallClick}
                className="h-8 px-4 bg-primary text-black font-black text-[9px] uppercase font-orbitron rounded-lg shadow-[0_0_15px_rgba(0,191,255,0.4)]"
              >
                INSTALAR
              </Button>
              <button 
                onClick={handleClose}
                className="text-[8px] text-white/30 uppercase font-orbitron hover:text-white transition-colors"
              >
                FECHAR
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
