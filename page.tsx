
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserState } from '@/lib/system-logic';
import { Toaster } from '@/components/ui/toaster';
import { SplashScreen } from '@/components/system/SplashScreen';
import { IntroSequence } from '@/components/system/IntroSequence';
import { Onboarding } from '@/components/system/Onboarding';
import { HunterDashboard } from '@/components/system/HunterDashboard';
import { BackgroundMusic } from '@/components/system/BackgroundMusic';
import { ParticleBackground } from '@/components/system/ParticleBackground';
import { InstallPWA } from '@/components/system/InstallPWA';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

/**
 * @fileOverview O Coração do Aura System - Versão de Persistência Blindada.
 * Gerencia a sobrevivência dos dados do Caçador entre reinicializações do portal.
 */

export default function Home() {
  const [screen, setScreen] = useState<'intro' | 'splash' | 'onboarding' | 'dashboard' | 'loading'>('loading');
  const [userState, setUserState] = useState<UserState | null>(null);
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();

  // Referência estável para o documento do usuário no Firestore
  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: cloudUserData, isLoading: isDocLoading } = useDoc<UserState>(userDocRef);

  // 1. CARREGAMENTO INICIAL DE MEMÓRIA (Nexus Local)
  useEffect(() => {
    const accepted = localStorage.getItem('aura_intro_accepted') === 'true';
    setIntroSeen(accepted);
    
    const savedLocal = localStorage.getItem('shadow_hunter_system_v2');
    if (savedLocal) {
      try {
        const parsedData = JSON.parse(savedLocal);
        setUserState(parsedData);
      } catch (e) {
        console.warn("Nexus: Fragmento de memória local corrompido.");
      }
    }
  }, []);

  // 2. SINCRONIZAÇÃO NUVEM -> LOCAL
  useEffect(() => {
    if (cloudUserData) {
      setUserState(cloudUserData);
      localStorage.setItem('shadow_hunter_system_v2', JSON.stringify(cloudUserData));
      // Se temos dados na nuvem, o usuário definitivamente já passou pelo sistema
      localStorage.setItem('aura_intro_accepted', 'true');
      setIntroSeen(true);
    }
  }, [cloudUserData]);

  // 3. MATRIZ DE ROTEAMENTO (Decide qual HUD exibir)
  useEffect(() => {
    // Protocolo de Segurança: Não tomar decisões enquanto o Auth estiver em fluxo
    if (isUserLoading || introSeen === null) {
      setScreen('loading');
      return;
    }

    // PROTOCOLO: USUÁRIO AUTENTICADO NO FIREBASE
    if (user) {
      // Blindagem: Se logado, forçar introSeen como true para evitar loop visual
      if (!introSeen) {
        localStorage.setItem('aura_intro_accepted', 'true');
        setIntroSeen(true);
      }

      if (!isSplashComplete) {
        setScreen('splash');
        return;
      }

      // Se estamos buscando na nuvem e não temos cache local: Loading
      if (isDocLoading && !userState) {
        setScreen('loading');
        return;
      }

      // Se temos dados (nuvem ou cache local), Dashboard.
      if (cloudUserData || userState) {
        setScreen('dashboard');
      } else if (!isDocLoading) {
        // Se a busca na nuvem terminou e não achou nada (Novo Usuário Google)
        setScreen('onboarding');
      }
      return;
    }

    // PROTOCOLO: USUÁRIO NÃO AUTENTICADO (Visitante ou Novo Caçador)
    if (!introSeen) {
      setScreen('intro');
    } else {
      if (!isSplashComplete) {
        setScreen('splash');
        return;
      }

      // Verifica se há memória de um visitante anterior ou cache do sistema
      if (userState) {
        setScreen('dashboard');
      } else {
        // Se aceitou a intro mas não tem dados, vai para o Onboarding
        setScreen('onboarding');
      }
    }
  }, [user, cloudUserData, isUserLoading, isDocLoading, isSplashComplete, introSeen, userState]);

  const handleAcceptIntro = () => {
    localStorage.setItem('aura_intro_accepted', 'true');
    setIntroSeen(true);
    setScreen('splash');
  };

  const handleSplashComplete = () => {
    setIsSplashComplete(true);
  };

  const handleOnboardingComplete = (userData: Partial<UserState>) => {
    const newUser = { ...userData, id: user?.uid || 'guest' } as UserState;
    setUserState(newUser);
    
    // Persistência em Duas Camadas
    localStorage.setItem('shadow_hunter_system_v2', JSON.stringify(newUser));
    localStorage.setItem('aura_intro_accepted', 'true');
    setIntroSeen(true);
    
    if (user && db) {
      setDoc(doc(db, 'users', user.uid), newUser, { merge: true });
    }
    
    setScreen('dashboard');
  };

  const handleUpdateUser = (update: Partial<UserState>) => {
    if (!userState) return;
    const updatedUser = { ...userState, ...update };
    setUserState(updatedUser);
    localStorage.setItem('shadow_hunter_system_v2', JSON.stringify(updatedUser));
    
    if (user && db) {
      setDoc(doc(db, 'users', user.uid), updatedUser, { merge: true });
    }
  };

  const handleResetSystem = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Nexus: Falha ao encerrar conexão:", error);
    }

    const keys = [
      'shadow_hunter_system_v2',
      'aura_daily_quest_v2',
      'aura_intro_accepted',
      'aura_last_login',
      'shadow_hunter_system_v1',
      'aura_daily_quest_v1'
    ];
    keys.forEach(key => localStorage.removeItem(key));

    setIntroSeen(false);
    setIsSplashComplete(false);
    setUserState(null);
    setScreen('intro');
  };

  return (
    <main className="min-h-screen bg-[#030406] relative">
      <ParticleBackground />
      <InstallPWA />

      {isSplashComplete && <BackgroundMusic />}

      <AnimatePresence>
        {screen === 'loading' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#030406] z-[700] flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_20px_rgba(0,191,255,0.3)]" />
            <span className="text-[10px] font-black text-primary/50 uppercase tracking-[0.5em] font-orbitron">Sincronizando Nexus</span>
          </motion.div>
        )}
      </AnimatePresence>

      {screen === 'intro' && (
        <IntroSequence onAccept={handleAcceptIntro} />
      )}

      {screen === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      
      {isSplashComplete && screen === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      
      {isSplashComplete && screen === 'dashboard' && userState && (
        <HunterDashboard 
          user={userState} 
          onUpdateUser={handleUpdateUser} 
          onReset={handleResetSystem}
        />
      )}
      
      <Toaster />
    </main>
  );
}
