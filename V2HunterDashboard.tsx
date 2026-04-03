"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserState, getXpForNextLevel, calculateProgression } from '@/lib/system-logic';
import { 
  User, Home, Utensils, Target, Send, 
  Shield, ChevronRight, Sparkles, LogOut,
  Coins, Timer, X, ChevronLeft, AlertTriangle, Eye, EyeOff, Zap, ShoppingBag, Camera, Sword, Lock, Skull
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generatePersonalizedDailyQuest, GeneratePersonalizedDailyQuestOutput } from '@/ai/flows/generate-personalized-daily-quest-flow';
import { generatePenaltyQuest, GeneratePenaltyQuestOutput } from '@/ai/flows/generate-penalty-quest-flow';
import { ShadowMonarchOverlay } from './ShadowMonarchOverlay';
import { DungeonTransition } from './DungeonTransition';
import { playSound, SOUND_URLS, initializeAudio } from '@/lib/sounds';

interface HunterDashboardProps {
  user: UserState;
  onUpdateUser: (update: Partial<UserState>) => void;
  onReset: () => void;
}

type TabType = 'home' | 'diet' | 'quests' | 'raid' | 'status' | 'store';

const ARCHITECT_QUOTES = [
  "A dor é apenas o sistema reescrevendo seus limites.",
  "O poder não é dado, é extraído da exaustão.",
  "Um Caçador que não evolui é apenas uma prey.",
  "O Sistema detectou um vetor de preguiça. Elimine-o.",
  "Rank S não é um título, é um estado de espírito.",
  "Erga-se. A Dungeon não espera por hesitantes.",
];

/**
 * Sistema de Faíscas de Mana para Incursões de Rank-S
 */
const DangerParticles = () => {
  const particles = Array.from({ length: 18 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 70,
    y: (Math.random() - 0.5) * 70,
    scale: Math.random() * 0.9 + 0.3,
    duration: Math.random() * 0.5 + 0.3,
    delay: Math.random() * 1.5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0.7, 0], 
            x: [0, p.x * 0.6, p.x], 
            y: [0, p.y * 0.6, p.y], 
            scale: [0, p.scale * 1.3, p.scale, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            ease: "easeOut",
            delay: p.delay
          }}
          className="absolute w-1 h-1 bg-red-500 rounded-full blur-[0.5px] shadow-[0_0_10px_#ff0000, 0_0_15px_#ff4500]"
        />
      ))}
    </div>
  );
};

const FlameParticles = () => {
  const particles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x: Math.random() * 40 - 20,
    y: Math.random() * -50 - 20,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 1.5 + 0.5,
    delay: Math.random() * 2,
    color: Math.random() > 0.4 ? '#FFA500' : '#FF4500'
  }));

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 10, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0], 
            x: p.x, 
            y: p.y, 
            scale: [0, 1, 0] 
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            ease: "easeOut",
            delay: p.delay
          }}
          className="absolute rounded-full blur-[1px]"
          style={{ 
            width: p.size, 
            height: p.size, 
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}`
          }}
        />
      ))}
    </div>
  );
};

const DungeonGateIcon = () => (
  <div className="relative w-full h-full flex items-center justify-center">
    <FlameParticles />
    <svg viewBox="0 0 100 100" className="w-full h-full text-primary drop-shadow-[0_0_15px_rgba(0,191,255,0.6)]">
      {/* Stone Gate Frame */}
      <rect x="25" y="20" width="50" height="70" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M25 20 Q50 5 75 20" fill="none" stroke="currentColor" strokeWidth="4" />
      
      {/* Stone Doors */}
      <rect x="29" y="24" width="20" height="62" fill="currentColor" className="opacity-40" />
      <rect x="51" y="24" width="20" height="62" fill="currentColor" className="opacity-40" />
      
      {/* Torches */}
      <rect x="15" y="45" width="4" height="15" fill="#555" />
      <rect x="81" y="45" width="4" height="15" fill="#555" />
      <circle cx="17" cy="42" r="4" fill="#FFA500" className="animate-pulse" />
      <circle cx="83" cy="42" r="4" fill="#FFA500" className="animate-pulse" />
    </svg>
  </div>
);

export function V2HunterDashboard({ user, onUpdateUser, onReset }: HunterDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeQuest, setActiveQuest] = useState<GeneratePersonalizedDailyQuestOutput | null>(null);
  const [penaltyQuest, setPenaltyQuest] = useState<GeneratePenaltyQuestOutput | null>(null);
  const [completedActivities, setCompletedActivities] = useState<Set<number>>(new Set());
  const [sideQuestDone, setSideQuestDone] = useState(false);
  const [dungeonStarted, setDungeonStarted] = useState(false);
  const [showMissionBriefing, setShowMissionBriefing] = useState(false);
  const [showResetOverlay, setShowResetOverlay] = useState(false);
  const [showDungeonTransition, setShowDungeonTransition] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState("");
  const [showCoinLabel, setShowCoinLabel] = useState(false);
  const [statusViewActive, setStatusViewActive] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    initializeAudio();
    checkDailyPersistence();
    setQuote(ARCHITECT_QUOTES[Math.floor(Math.random() * ARCHITECT_QUOTES.length)]);
  }, []);

  const checkDailyPersistence = async () => {
    setLoading(true);
    const today = new Date().toDateString();
    const savedQuestData = localStorage.getItem('aura_daily_quest_v1');
    const lastLoginDate = localStorage.getItem('aura_last_login');
    
    setDungeonStarted(false);

    if (lastLoginDate && lastLoginDate !== today) {
      if (savedQuestData) {
        const { completed } = JSON.parse(savedQuestData);
        if (!completed) {
          const lostXp = 100 * user.level;
          onUpdateUser({ 
            xp: Math.max(0, user.xp - lostXp), 
            lostXpTotal: (user.lostXpTotal || 0) + lostXp,
            pendingMissionsCount: (user.pendingMissionsCount || 0) + 1
          });
          await triggerPenalty();
          setLoading(false);
          return;
        }
      }
    }

    localStorage.setItem('aura_last_login', today);

    if (savedQuestData) {
      const { quest, date, completedIndices, sideQuestDone: savedSideQuestDone } = JSON.parse(savedQuestData);
      if (date === today) {
        setActiveQuest(quest);
        setCompletedActivities(new Set(completedIndices || []));
        setSideQuestDone(!!savedSideQuestDone);
        setLoading(false);
        return;
      }
    }

    await fetchNewQuest();
    setLoading(false);
  };

  const triggerPenalty = async () => {
    try {
      const penalty = await generatePenaltyQuest({
        userName: user.name,
        userRank: user.rank,
      });
      setPenaltyQuest(penalty);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchNewQuest = async () => {
    try {
      const quest = await generatePersonalizedDailyQuest({
        name: user.name,
        age: user.age,
        gender: user.gender,
        weightKg: user.weightKg,
        heightCm: user.heightCm,
        objective: user.objective,
        pushUps: user.pushUps,
        squats: user.squats,
        plankSeconds: user.plankSeconds,
        equipment: user.equipment,
        timePerDay: user.timePerDay,
        dietPreference: user.dietPreference,
        level: user.level,
        rank: user.rank,
      });
      setActiveQuest(quest);
      setCompletedActivities(new Set());
      setSideQuestDone(false);
      saveQuestState(quest, false, [], false, false);
    } catch (error) {
      console.error(error);
    }
  };

  const saveQuestState = (quest: any, completed: boolean, indices: number[], sideDone: boolean, dungeonActive: boolean) => {
    localStorage.setItem('aura_daily_quest_v1', JSON.stringify({
      quest,
      date: new Date().toDateString(),
      completed,
      completedIndices: indices,
      sideQuestDone: sideDone,
      dungeonStarted: dungeonActive
    }));
  };

  const handleAction = (type: 'click' | 'confirm') => {
    if (type === 'click') playSound(SOUND_URLS.CLICK, 0.4);
    else playSound(SOUND_URLS.CONFIRM, 0.5);
  };

  const handleTabChange = (tab: TabType) => {
    handleAction('click');
    setActiveTab(tab);
    setStatusViewActive(false);
    setDungeonStarted(false);
    setShowMissionBriefing(false);
  };

  const handleToggleActivity = (idx: number) => {
    handleAction('click');
    const next = new Set(completedActivities);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setCompletedActivities(next);
    saveQuestState(activeQuest, false, Array.from(next), sideQuestDone, dungeonStarted);
  };

  const handleQuestCompletion = () => {
    handleAction('confirm');
    playSound(SOUND_URLS.LEVEL_UP, 0.6);
    const xpGained = 250 * user.level;
    const coinsGained = 50;
    const { level, xp } = calculateProgression(user.xp + xpGained, user.level);
    
    onUpdateUser({
      level, xp, streak: (user.streak || 0) + 1,
      coins: (user.coins || 0) + coinsGained,
    });

    saveQuestState(activeQuest, true, Array.from(completedActivities), sideQuestDone, false);
    setDungeonStarted(false);
    toast({ title: "SINCRONIZAÇÃO COMPLETA", description: `+${coinsGained} Aura Coins recebidos.` });
  };

  const startDungeonSequence = () => {
    handleAction('confirm');
    setShowMissionBriefing(false);
    setShowDungeonTransition(true);
  };

  const handleDungeonTransitionComplete = () => {
    setShowDungeonTransition(false);
    setDungeonStarted(true);
    saveQuestState(activeQuest, false, Array.from(completedActivities), sideQuestDone, true);
  };

  const nextXp = getXpForNextLevel(user.level);
  const xpPercent = (user.xp / nextXp) * 100;
  const isRaidUnlocked = user.rank === 'A' || user.rank === 'A+' || user.rank === 'S' || user.rank === 'MONARCH';

  const panelVariants = {
    initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  };

  if (penaltyQuest) {
    return (
      <div className="fixed inset-0 bg-[#020203] z-[1000] flex flex-col items-center justify-center p-6 space-y-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#ff450020_0%,transparent_70%)] pointer-events-none" />
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-red-500 text-center font-orbitron aura-text-neon">FALHA DO SISTEMA</h1>
        <div className="w-full max-w-md space-y-6 relative z-10">
          <div className="shadow-card-definitive p-8 text-center border-red-500/30 bg-red-500/5">
            <p className="text-lg font-bold text-white italic leading-relaxed font-mono">{penaltyQuest.penaltyQuest}</p>
          </div>
          <Button onClick={() => setPenaltyQuest(null)} className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black uppercase italic rounded-2xl border-b-4 border-red-900 shadow-[0_0_20px_rgba(255,69,0,0.4)]">RECONHECER PENALIDADE</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen text-foreground flex flex-col pb-32 transition-all duration-1000 bg-[#030406]")}>
      <div className="scanline" />
      
      {user.shadowMonarchActive && <ShadowMonarchOverlay />}

      {/* TOP HERO SECTION */}
      <header className="relative z-20 px-6 pt-10 pb-4 flex justify-between items-center w-full">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStatusViewActive(true)}>
          <div className="avatar-vortex-container scale-[0.35] -m-10">
            <div className="avatar-vortex-aura" />
            <div className="avatar-vortex-core">
              {user.profileImage ? (
                <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-full h-full text-primary" />
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] aura-text-neon font-orbitron">HUNTER STATUS</span>
            <span className="text-[10px] font-medium text-white/50 italic tracking-wider">{user.name.toUpperCase()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="shadow-panel px-3 py-1 flex items-center gap-2 border-primary/20 relative cursor-pointer bg-black/40 backdrop-blur-md rounded-xl"
            onClick={() => { setShowCoinLabel(!showCoinLabel); setTimeout(() => setShowCoinLabel(false), 2000); }}
            onMouseEnter={() => setShowCoinLabel(true)}
            onMouseLeave={() => setShowCoinLabel(false)}
          >
            <AnimatePresence>
              {showCoinLabel && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: -20 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-1/2 -translate-x-1/2 bg-black/80 text-[8px] font-black text-primary uppercase tracking-widest px-2 py-0.5 rounded border border-primary/20 whitespace-nowrap font-orbitron"
                >
                  AURA COINS
                </motion.div>
              )}
            </AnimatePresence>
            <Coins className="w-3 h-3 text-secondary" />
            <span className="text-xs font-black text-white font-mono">{user.coins || 0}</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleTabChange('store')}
            className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 backdrop-blur-md"
          >
            <ShoppingBag className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 px-6 space-y-8 relative z-10">
        <AnimatePresence mode="wait">
          {!statusViewActive && activeTab === 'home' && (
            <motion.div key="home" variants={panelVariants} initial="initial" animate="animate" exit="exit" className="space-y-8">
              <section className="text-center space-y-4 pt-4">
                <div className="avatar-vortex-container">
                  <div className="avatar-vortex-aura" />
                  <div className="avatar-vortex-core">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-primary/40" />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-4xl font-black uppercase tracking-tighter font-orbitron aura-text-neon italic">{user.name}</h2>
                  <div className="flex items-center justify-center gap-2 text-[10px] font-orbitron tracking-[0.4em] text-primary/80 uppercase font-black">
                    <span>NÍVEL {user.level} • RANK {user.rank === 'MONARCH' ? '???' : user.rank}</span>
                  </div>
                </div>
              </section>

              <div className="shadow-card-definitive p-6 aura-progress-sweep overflow-hidden relative border-primary/20">
                <div className="flex justify-between items-center mb-3 font-orbitron">
                  <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">Vetor de Evolução</span>
                  <span className="text-[10px] text-white/80 font-mono tracking-widest font-bold">{Math.round(user.xp)} / {nextXp} XP</span>
                </div>
                <div className="relative h-5 w-full overflow-hidden rounded-full bg-white/5 border border-white/10 p-[2px]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} className="h-full bg-gradient-to-r from-primary to-secondary relative rounded-full shadow-[0_0_15px_rgba(0,191,255,0.5)]" />
                </div>
              </div>

              <div className="shadow-card-definitive p-8 space-y-4 border-primary/10 bg-gradient-to-b from-primary/5 to-transparent text-center">
                <Sparkles className="w-5 h-5 text-primary mx-auto animate-pulse" />
                <p className="text-xl font-medium leading-relaxed italic text-white/95 font-inter">"{quote}"</p>
              </div>
            </motion.div>
          )}

          {statusViewActive && (
            <motion.div key="status" variants={panelVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pt-4 pb-20">
              <div className="flex justify-start">
                <Button variant="ghost" size="sm" onClick={() => setStatusViewActive(false)} className="text-primary text-[10px] font-black uppercase tracking-widest font-orbitron">
                  <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR AO HUD
                </Button>
              </div>
              <div className="avatar-vortex-container scale-90">
                <div className="avatar-vortex-aura" />
                <div className="avatar-vortex-core">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-primary/40" />
                  )}
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-white uppercase italic font-orbitron">{user.name}</h2>
                <p className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em] font-orbitron">Rank {user.rank === 'MONARCH' ? '???' : user.rank} Hunter</p>
              </div>
              <div className="pt-10 flex flex-col items-center gap-4">
                <Button variant="ghost" onClick={() => setShowResetOverlay(true)} className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest font-orbitron">
                  <AlertTriangle className="w-3 h-3 mr-2" /> REINICIAR PROTOCOLO DO SISTEMA
                </Button>
              </div>
            </motion.div>
          )}

          {!statusViewActive && activeTab === 'diet' && (
            <motion.div key="diet" variants={panelVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
               <h3 className="text-2xl font-black text-primary uppercase italic tracking-widest font-orbitron aura-text-neon">PROTOCOLO NUTRICIONAL</h3>
               <div className="grid gap-4 pb-10">
                  {activeQuest?.nutrition.meals.map((meal, idx) => (
                     <div key={idx} className="shadow-card-definitive p-6 space-y-3 border-primary/10 bg-black/40">
                        <span className="text-xs font-black text-primary uppercase font-orbitron tracking-widest italic">{meal.time}</span>
                        <p className="text-sm text-white/90 leading-relaxed font-inter font-medium">{meal.description}</p>
                     </div>
                  ))}
               </div>
            </motion.div>
          )}

          {!statusViewActive && activeTab === 'quests' && (
            <motion.div key="quests" variants={panelVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
               <h3 className="text-2xl font-black text-primary uppercase italic tracking-widest font-orbitron aura-text-neon">MISSÕES SECRETAS</h3>
               {activeQuest?.sideQuest && (
                  <div className={cn("shadow-card-definitive p-8 space-y-5 border-primary/20 bg-primary/5", sideQuestDone && "opacity-60")}>
                     <div className="flex items-center gap-3">
                        <Zap className="w-6 h-6 text-primary" />
                        <h4 className="text-xl font-black text-white italic uppercase font-orbitron tracking-tight">{activeQuest.sideQuest.title}</h4>
                     </div>
                     <p className="text-sm text-white/80 leading-relaxed font-inter italic">{activeQuest.sideQuest.description}</p>
                     {!sideQuestDone && (
                        <Button onClick={() => setSideQuestDone(true)} className="w-full bg-primary text-black font-black uppercase italic h-14 rounded-2xl shadow-[0_0_30px_rgba(0,191,255,0.5)]">CONCLUIR MISSÃO</Button>
                     )}
                  </div>
               )}
            </motion.div>
          )}

          {!statusViewActive && activeTab === 'raid' && (
            <motion.div key="raid" variants={panelVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Skull className="w-6 h-6 text-red-500 drop-shadow-[0_0_10px_#ff0000] animate-pulse" />
                  <DangerParticles />
                </div>
                <h3 className="text-xl font-black text-red-500 uppercase italic tracking-[0.2em] font-orbitron drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]">PROTOCOLO DE RAID</h3>
              </div>
              {!isRaidUnlocked ? (
                <motion.div 
                  animate={{ boxShadow: ["0 0 10px rgba(255,0,0,0.1)", "0 0 30px rgba(255,0,0,0.3)", "0 0 10px rgba(255,0,0,0.1)"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="shadow-panel p-8 flex flex-col items-center justify-center border-red-500/30 bg-red-500/5 space-y-6 relative overflow-hidden"
                >
                  <Lock className="w-10 h-10 text-red-500/40" />
                  <p className="text-sm text-white/70 italic text-center leading-relaxed font-orbitron uppercase tracking-widest">ACESSO BLOQUEADO</p>
                  <p className="text-[10px] text-white/40 uppercase font-orbitron mt-2 tracking-widest">DESBLOQUEIA NO RANK A</p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="shadow-panel p-6 border-red-500/30 bg-red-500/5">
                    <h4 className="text-lg font-black text-white uppercase italic font-orbitron">O DESPERTAR DO REI</h4>
                    <p className="text-sm text-white/80 italic mb-6">Incursão de Rank-S detectada. Prepare sua alma.</p>
                    <Button className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase italic rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.4)]">INICIAR RAID</Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!statusViewActive && activeTab === 'store' && (
            <motion.div key="store" variants={panelVariants} initial="initial" animate="animate" exit="exit" className="space-y-6 pt-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-primary animate-pulse" />
                <h3 className="text-xl font-black text-primary uppercase italic tracking-[0.2em] aura-text-neon font-orbitron">AURA STORE</h3>
              </div>
              <div className="shadow-panel p-8 flex flex-col items-center justify-center border-primary/20 bg-primary/5">
                <p className="text-sm text-white/70 italic text-center font-orbitron">MERCADO EM SINCRONIZAÇÃO...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* BOTTOM ACTION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-[#020203]/95 backdrop-blur-3xl border-t border-primary/20 px-6 pt-4 pb-10 flex justify-around items-end">
        <button onClick={() => handleTabChange('home')} className={cn("flex flex-col items-center gap-2 transition-all duration-300", !statusViewActive && activeTab === 'home' ? "text-primary scale-110" : "text-white/30")}>
          <Home className="w-7 h-7" /><span className="text-[9px] font-black font-orbitron uppercase tracking-widest">HOME</span>
        </button>
        <button onClick={() => handleTabChange('diet')} className={cn("flex flex-col items-center gap-2 transition-all duration-300", !statusViewActive && activeTab === 'diet' ? "text-primary scale-110" : "text-white/30")}>
          <Utensils className="w-7 h-7" /><span className="text-[9px] font-black font-orbitron uppercase tracking-widest">DIETA</span>
        </button>

        <div className="relative -top-8">
           <button 
             onClick={() => { handleAction('click'); setShowMissionBriefing(true); }}
             className="w-20 h-20 bg-black/80 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,191,255,0.7)] border-4 border-primary/40 relative z-10 evolve-btn-active p-4"
           >
              <DungeonGateIcon />
           </button>
           <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-primary font-orbitron tracking-tighter whitespace-nowrap aura-text-neon uppercase">DUNGEON</span>
        </div>

        <button onClick={() => handleTabChange('quests')} className={cn("flex flex-col items-center gap-2 transition-all duration-300", !statusViewActive && activeTab === 'quests' ? "text-primary scale-110" : "text-white/30")}>
          <Target className="w-7 h-7" /><span className="text-[9px] font-black font-orbitron uppercase tracking-widest">QUESTS</span>
        </button>
        <button onClick={() => handleTabChange('raid')} className={cn("flex flex-col items-center gap-2 transition-all duration-300", !statusViewActive && activeTab === 'raid' ? "text-primary scale-110" : "text-white/30")}>
          <div className="relative">
            <Skull className="w-7 h-7" />
            {activeTab === 'raid' && <DangerParticles />}
          </div>
          <span className="text-[9px] font-black font-orbitron uppercase tracking-widest">RAID</span>
        </button>
      </nav>

      {/* OVERLAYS */}
      <AnimatePresence>
        {showDungeonTransition && <DungeonTransition onComplete={handleDungeonTransitionComplete} />}
        {showMissionBriefing && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 bg-[#020203] z-[200] flex flex-col p-6 overflow-y-auto">
             <div className="flex justify-between items-center mb-6 pt-4">
                <h2 className="text-2xl font-black font-orbitron text-primary aura-text-neon uppercase italic">DUNGEON DETECTADA</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowMissionBriefing(false)} className="text-primary hover:text-primary hover:bg-primary/20 rounded-full w-12 h-12 transition-all duration-300 shadow-[0_0_20px_rgba(0,191,255,0.3)]"><X className="w-8 h-8" /></Button>
             </div>
             <div className="shadow-card-definitive p-10 space-y-8 border-primary/20 bg-primary/5">
                <h3 className="text-4xl font-black text-white italic uppercase font-orbitron leading-tight">{activeQuest?.questTitle}</h3>
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest font-bold">Duração</span>
                    <p className="text-3xl font-black text-primary font-orbitron aura-text-neon">{activeQuest?.questDuration}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest font-bold">Recompensa</span>
                    <p className="text-3xl font-black text-secondary font-orbitron">+50 Aura Coins</p>
                  </div>
                </div>
             </div>
             <div className="mt-auto py-10"><Button onClick={startDungeonSequence} className="w-full h-20 bg-primary text-black font-black text-xl uppercase italic rounded-3xl shadow-[0_0_60px_rgba(0,240,255,0.6)]">ENTRAR NA DUNGEON</Button></div>
          </motion.div>
        )}
        {showResetOverlay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#020203]/98 backdrop-blur-3xl z-[500] flex items-center justify-center p-6">
             <div className="shadow-panel p-12 max-w-md w-full border-red-500/50 text-center space-y-6">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                <h2 className="text-3xl font-black text-red-500 font-orbitron uppercase tracking-tighter aura-text-neon">RESETE TOTAL?</h2>
                <div className="flex flex-col gap-4 pt-4">
                  <Button onClick={() => { handleAction('confirm'); onReset(); setShowResetOverlay(false); }} className="h-14 bg-red-600 text-white font-black uppercase italic rounded-2xl">CONFIRMAR APAGAMENTO</Button>
                  <Button variant="ghost" onClick={() => setShowResetOverlay(false)} className="h-14 text-white/40 font-black uppercase tracking-widest">ABORTAR</Button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
