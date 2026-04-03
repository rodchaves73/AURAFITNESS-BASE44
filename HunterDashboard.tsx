"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { UserState, getXpForNextLevel, updateHunterStats, ACHIEVEMENTS_LIST, calculateProgression } from '@/lib/system-logic';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { generatePersonalizedDailyQuest, GeneratePersonalizedDailyQuestOutput } from '@/ai/flows/generate-personalized-daily-quest-flow';
import { GeneratePenaltyQuestOutput } from '@/ai/flows/generate-penalty-quest-flow';
import { getSystemBroadcast } from '@/ai/flows/system-broadcast-flow';
import { listCalendarEvents, createWorkoutEvent } from '@/lib/google-calendar';
import { 
  User, Utensils, Target, Sparkles,
  ChevronLeft, Timer, Coins, Home, X, Zap, Camera, Activity, Brain, Star, ShoppingBag, Sword, Lock, AlertTriangle, Trophy, Medal, Flame, Clock, Award, Dumbbell, Crown, Skull, Shield, Calendar as CalendarIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea } from "@/components/ui/scroll-area";
import { DungeonTransition } from '@/components/system/v2/DungeonTransition';
import { playSound, SOUND_URLS, initializeAudio } from '@/lib/sounds';

interface HunterDashboardProps {
  user: UserState;
  onUpdateUser: (update: Partial<UserState>) => void;
  onReset: () => void;
}

/**
 * Componente de Faíscas de Mana para a Incursão (Raid)
 */
const RaidSparks = () => {
  const sparks = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 60,
    y: (Math.random() - 0.5) * 60,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 0.6 + 0.3,
    delay: Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible">
      {sparks.map((s) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 0.8, 0], 
            x: [0, s.x * 0.7, s.x], 
            y: [0, s.y * 0.7, s.y], 
            scale: [0, 1.2, 0.8, 0] 
          }}
          transition={{ 
            duration: s.duration, 
            repeat: Infinity, 
            ease: "easeOut",
            delay: s.delay
          }}
          className="absolute rounded-full bg-red-500"
          style={{ 
            width: s.size, 
            height: s.size, 
            boxShadow: "0 0 10px #ff0000, 0 0 15px #ff4500",
            filter: "blur(0.5px)"
          }}
        />
      ))}
    </div>
  );
};

const AchievementIcon = ({ id, Unlocked }: { id: string, Unlocked: boolean }) => {
  const baseClass = cn("w-10 h-10 transition-all duration-500", 
    Unlocked ? "text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.7)]" : "text-white/10"
  );
  switch (id) {
    case 'first_dungeon': return <Sword className={baseClass} />;
    case 'strength_initiate': return <Activity className={baseClass} />;
    case 'strength_master': return <Dumbbell className={baseClass} />;
    case 'squat_initiate': return <Zap className={baseClass} />;
    case 'squat_master': return <Flame className={baseClass} />;
    case 'plank_initiate': return <Shield className={baseClass} />;
    case 'plank_master': return <Target className={baseClass} />;
    case 'time_warrior': return <Clock className={baseClass} />;
    case 'time_legend': return <Timer className={baseClass} />;
    case 'rank_s_hunter': return <Trophy className={baseClass} />;
    case 'streak_7': return <Medal className={baseClass} />;
    case 'streak_30': return <Crown className={baseClass} />;
    default: return <Award className={baseClass} />;
  }
};

function HolographicStatCard({ label, value, icon: Icon, colorClass, suffix = "" }: { label: string, value: string | number, icon: any, colorClass: string, suffix?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [12, -12]);
  const rotateY = useTransform(x, [-100, 100], [-12, 12]);
  const rotateXSpring = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const rotateYSpring = useSpring(rotateY, { stiffness: 300, damping: 30 });

  return (
    <motion.div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left - rect.width / 2);
        y.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX: rotateXSpring, rotateY: rotateYSpring, transformStyle: "preserve-3d" }}
      className="group relative overflow-hidden rounded-[1.5rem] border border-white/5 bg-black/60 p-5 shadow-2xl transition-all hover:border-primary/30"
    >
      <div className="absolute top-0 left-0 w-8 h-[2px] bg-primary/40 group-hover:w-full transition-all duration-700" />
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-primary/40 group-hover:h-full transition-all duration-700" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-white/10 rounded-br-2xl" />
      
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,191,255,0.4) 1px, transparent 0)',
          backgroundSize: '12px 12px'
        }} 
      />

      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,191,255,0.25)_50%)] bg-[length:100%_4px]" />

      <div className="relative z-10 flex flex-col items-center gap-3" style={{ transform: "translateZ(50px)" }}>
        <div className={cn("p-3.5 rounded-2xl bg-black/40 border border-white/5 shadow-[inset_0_0_15px_rgba(255,255,255,0.02)] transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(0,191,255,0.3)] group-hover:border-primary/20", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-0.5">
             <motion.span 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="text-4xl font-black font-orbitron text-white leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(0,191,255,0.4)]"
             >
               {value}
             </motion.span>
             {suffix && <span className="text-xs font-black text-white/30 font-orbitron">{suffix}</span>}
          </div>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] font-orbitron mt-2 group-hover:text-primary/70 transition-colors group-hover:tracking-[0.4em] duration-500">{label}</p>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      <div className="absolute top-3 right-3 flex gap-1">
        <div className="w-1 h-1 bg-primary/40 rounded-full animate-pulse" />
        <div className="w-1 h-1 bg-primary/20 rounded-full" />
      </div>
    </motion.div>
  );
}

export function HunterDashboard({ user, onUpdateUser, onReset }: HunterDashboardProps) {
  const [activeQuest, setActiveQuest] = useState<GeneratePersonalizedDailyQuestOutput | null>(null);
  const [penaltyQuest, setPenaltyQuest] = useState<GeneratePenaltyQuestOutput | null>(null);
  const [completedActivities, setCompletedActivities] = useState<Set<number>>(new Set());
  const [sideQuestCompleted, setSideQuestCompleted] = useState(false);
  const [dungeonStarted, setDungeonStarted] = useState(false);
  const [showDungeonTransition, setShowDungeonTransition] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMissionBriefing, setShowMissionBriefing] = useState(false);
  const [showResetOverlay, setShowResetOverlay] = useState(false);
  const [showAchievementsOverlay, setShowAchievementsOverlay] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'nutrition' | 'quests' | 'raid' | 'store'>('dashboard');
  const [statusViewActive, setStatusViewActive] = useState(false);
  const [quote, setQuote] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  const [dungeonTime, setDungeonTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerType, setTimerType] = useState<'work' | 'rest' | 'prep' | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const currentStats = updateHunterStats(user);

  useEffect(() => {
    checkDailyPersistence();
    fetchSystemBroadcast();
    initializeAudio();
    syncCalendar();
  }, []);

  const syncCalendar = async () => {
    const token = user.googleAccessToken || localStorage.getItem('aura_google_token');
    if (token) {
      setIsSyncingCalendar(true);
      const events = await listCalendarEvents(token);
      setCalendarEvents(events);
      setIsSyncingCalendar(false);
    }
  };

  const handleScheduleWorkout = async () => {
    const token = user.googleAccessToken || localStorage.getItem('aura_google_token');
    if (!token || !activeQuest) return;
    playSound(SOUND_URLS.CONFIRM, 0.5);
    const result = await createWorkoutEvent(token, activeQuest.questTitle, activeQuest.questSummary || "Treino diário", parseInt(activeQuest.questDuration) || 30);
    if (result) {
      toast({ title: "AGENDA ATUALIZADA", description: "O treino foi registrado no seu Google Calendar." });
      syncCalendar();
    }
  };

  const handleAction = (type: 'click' | 'confirm') => {
    if (type === 'click') playSound(SOUND_URLS.CLICK, 0.4);
    else playSound(SOUND_URLS.CONFIRM, 0.5);
  };

  const fetchSystemBroadcast = async () => {
    try {
      const { message } = await getSystemBroadcast({
        userName: user.name, userRank: user.rank, userLevel: user.level, objective: user.objective, randomFactor: Math.random()
      });
      setQuote(message);
    } catch (e) {
      setQuote("A dor é apenas o sistema reescrevendo seus limites.");
    }
  };

  useEffect(() => {
    let interval: any;
    if (dungeonStarted) {
      interval = setInterval(() => {
        setDungeonTime(prev => prev + 1);
        if (countdown !== null) {
          if (countdown > 0) {
            setCountdown(prev => (prev !== null ? prev - 1 : null));
          } else {
            if (timerType === 'prep' && activeExerciseIndex !== null) {
              const activity = activeQuest?.activities[activeExerciseIndex];
              if (activity) {
                setCountdown(parseInt(activity.quantity) || 30);
                setTimerType('work');
                playSound(SOUND_URLS.CONFIRM, 0.6);
              }
            } else if (timerType === 'work') {
              handleFinishManualExercise(activeExerciseIndex!);
            } else {
              setCountdown(null);
              setTimerType(null);
            }
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [dungeonStarted, countdown, activeExerciseIndex, timerType]);

  const checkDailyPersistence = async () => {
    setLoading(true);
    const today = new Date().toDateString();
    const savedQuestData = localStorage.getItem('aura_daily_quest_v2');
    if (savedQuestData) {
      const { quest, date, completedIndices, sideQuestCompleted: savedSide } = JSON.parse(savedQuestData);
      if (date === today) {
        setActiveQuest(quest);
        setCompletedActivities(new Set(completedIndices || []));
        setSideQuestCompleted(!!savedSide);
        setLoading(false);
        return;
      }
    }
    fetchNewQuest();
    setLoading(false);
  };

  const fetchNewQuest = async () => {
    try {
      const quest = await generatePersonalizedDailyQuest({
        name: user.name, age: user.age, gender: user.gender, weightKg: user.weightKg, heightCm: user.heightCm, objective: user.objective,
        pushUps: user.pushUps, squats: user.squats, plankSeconds: user.plankSeconds, equipment: user.equipment, timePerDay: user.timePerDay,
        dietPreference: user.dietPreference, level: user.level, rank: user.rank,
      });
      setActiveQuest(quest);
      saveQuestState(quest, false, [], false);
    } catch (error) { console.error(error); }
  };

  const saveQuestState = (quest: any, completed: boolean, indices: number[], sideDone: boolean) => {
    localStorage.setItem('aura_daily_quest_v2', JSON.stringify({
      quest, date: new Date().toDateString(), completed, completedIndices: indices, sideQuestCompleted: sideDone
    }));
  };

  const handleStartExercise = (idx: number) => {
    const activity = activeQuest?.activities[idx];
    if (!activity) return;
    setActiveExerciseIndex(idx);
    handleAction('click');
    if (activity.quantity.includes('s')) {
      setCountdown(5);
      setTimerType('prep');
    }
  };

  const handleFinishManualExercise = (idx: number) => {
    const next = new Set(completedActivities);
    next.add(idx);
    setCompletedActivities(next);
    setActiveExerciseIndex(null);
    handleAction('confirm');
    const activity = activeQuest?.activities[idx];
    if (activity?.rest) {
      setCountdown(parseInt(activity.rest) || 30);
      setTimerType('rest');
    }
    saveQuestState(activeQuest, next.size === activeQuest?.activities.length, Array.from(next), sideQuestCompleted);
  };

  const handleCollectRewards = () => {
    handleAction('confirm');
    playSound(SOUND_URLS.LEVEL_UP, 0.6);
    const xpGained = 250 * user.level;
    const coinsGained = 50;
    
    const { level, xp } = calculateProgression(user.xp + xpGained, user.level);
    
    onUpdateUser({
      level,
      xp,
      coins: (user.coins || 0) + coinsGained,
      streak: (user.streak || 0) + 1,
    });
    
    setDungeonStarted(false);
    toast({ 
      title: "RECOMPENSAS COLETADAS", 
      description: `+${xpGained} XP e +${coinsGained} Coins adicionados ao seu perfil.` 
    });
  };

  const handleTabChange = (tab: any) => {
    handleAction('click');
    setActiveTab(tab);
    setStatusViewActive(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const xpProgress = (user.xp / getXpForNextLevel(user.level)) * 100;

  return (
    <div className="min-h-screen relative flex flex-col shadow-bg-main overflow-hidden text-foreground">
      <div className="scanline" />

      <header className="relative z-20 px-6 pt-10 pb-4 flex justify-between items-center w-full">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { handleAction('click'); setStatusViewActive(true); }}>
          <div className="w-10 h-10 rounded-full border-2 border-primary/40 p-1 flex items-center justify-center bg-primary/5 overflow-hidden">
            {user.profileImage ? <img src={user.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" /> : <User className="w-full h-full text-primary" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] aura-text-neon font-orbitron">HUNTER STATUS</span>
            <span className="text-[10px] font-medium text-white/50 italic tracking-wider">{user.name.toUpperCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { handleAction('click'); setShowAchievementsOverlay(true); }} className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Medal className="w-5 h-5" />
          </Button>
          <div className="shadow-panel px-3 py-1 flex items-center gap-2 border-primary/20 bg-black/40 backdrop-blur-md rounded-xl">
            <Coins className="w-3 h-3 text-secondary" />
            <span className="text-xs font-black text-white font-mono">{user.coins || 0}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => handleTabChange('store')} className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <ShoppingBag className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-32 relative z-20 space-y-4">
        <AnimatePresence mode="wait">
          {!statusViewActive && activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-4">
              <section className="text-center space-y-4 py-4">
                <div className="avatar-vortex-container mx-auto">
                  <div className="avatar-vortex-aura" />
                  <div className="avatar-vortex-core">
                    {user.profileImage ? <img src={user.profileImage} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-primary/40" />}
                  </div>
                </div>
                <div className="space-y-1">
                  <h1 className="text-4xl font-black italic aura-text-neon uppercase tracking-tight font-orbitron leading-tight">{user.name}</h1>
                  <div className="flex items-center justify-center gap-4 font-orbitron">
                    <span className="text-[10px] text-primary/70 uppercase tracking-[0.2em] font-black">NÍVEL {user.level}</span>
                    <span className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-black">RANK {user.rank === 'MONARCH' ? '???' : user.rank}</span>
                  </div>
                </div>
              </section>

              <div className="w-full max-w-sm mx-auto space-y-2 p-4 shadow-panel bg-black/40 backdrop-blur-md">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] font-orbitron">VETOR DE EVOLUÇÃO</span>
                  <span className="text-[10px] font-mono text-white/80 font-bold">{Math.round(user.xp)} / {getXpForNextLevel(user.level)} XP</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0_0_10px_rgba(0,191,255,0.6)]" />
                </div>
              </div>

              <div className="shadow-panel p-6 space-y-3 border-primary/10 bg-gradient-to-b from-primary/5 to-transparent text-center">
                <Sparkles className="w-5 h-5 text-primary mx-auto animate-pulse" />
                <p className="text-lg font-medium leading-relaxed italic text-white/95 font-inter">"{quote}"</p>
              </div>
            </motion.div>
          )}

          {statusViewActive && (
            <motion.div key="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-6 pt-4 pb-10">
              <div className="flex justify-start">
                <Button variant="ghost" size="sm" onClick={() => { handleAction('click'); setStatusViewActive(false); }} className="text-primary text-[10px] font-black uppercase tracking-widest font-orbitron">
                  <ChevronLeft className="w-4 h-4 mr-1" /> VOLTAR AO HUD
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 perspective-1000">
                <HolographicStatCard label="FORÇA" value={currentStats.str} icon={Shield} colorClass="text-red-500" />
                <HolographicStatCard label="VITALIDADE" value={currentStats.vit} icon={Activity} colorClass="text-green-500" />
                <HolographicStatCard label="FOCO" value={currentStats.end} icon={Brain} colorClass="text-blue-500" />
                <HolographicStatCard label="AGILIDADE" value={currentStats.agi} icon={Star} colorClass="text-yellow-500" />
              </div>
              <div className="pt-10 flex flex-col items-center gap-4">
                <Button variant="ghost" onClick={() => { handleAction('click'); setShowResetOverlay(true); }} className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10 text-[10px] font-black uppercase tracking-widest font-orbitron">
                  <AlertTriangle className="w-3 h-3 mr-2" /> REINICIAR PROTOCOLO DO SISTEMA
                </Button>
              </div>
            </motion.div>
          )}

          {!statusViewActive && activeTab === 'nutrition' && (
            <motion.div key="nutrition" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-4">
               <h3 className="text-lg font-black text-primary uppercase italic tracking-[0.2em] aura-text-neon font-orbitron">PROTOCOLO NUTRICIONAL</h3>
               <div className="grid gap-4">
                 {activeQuest?.nutrition.meals.map((meal, idx) => (
                   <div key={idx} className="shadow-panel p-5 border-primary/10 bg-black/40 flex flex-col gap-3">
                     <div className="text-primary text-[11px] font-black uppercase tracking-widest font-orbitron">{meal.time}</div>
                     <p className="text-xs text-white/80 leading-relaxed font-mono italic">{meal.description}</p>
                   </div>
                 ))}
               </div>
            </motion.div>
          )}

          {!statusViewActive && activeTab === 'quests' && (
            <motion.div key="quests" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-4">
               <div className="flex items-center gap-2 mb-2"><Zap className="w-5 h-5 text-secondary animate-pulse" /><h3 className="text-lg font-black text-secondary uppercase italic tracking-[0.2em] aura-text-orange font-orbitron">MISSÕES SECRETAS</h3></div>
               
               {activeQuest?.sideQuest && (
                  <div className={cn("shadow-panel p-6 space-y-4 border-primary/20 bg-primary/5 transition-opacity duration-500", sideQuestCompleted && "opacity-40 grayscale")}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="text-sm font-black text-white italic uppercase font-orbitron tracking-tight">{activeQuest.sideQuest.title}</h4>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed font-inter italic">{activeQuest.sideQuest.description}</p>
                    
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase font-orbitron">+{activeQuest.sideQuest.xpReward} XP</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Coins className="w-3 h-3 text-secondary" />
                        <span className="text-[10px] font-black text-secondary uppercase font-orbitron">+{activeQuest.sideQuest.coinReward} COINS</span>
                      </div>
                    </div>

                    {!sideQuestCompleted && (
                      <Button 
                        onClick={() => {
                          handleAction('confirm');
                          setSideQuestCompleted(true);
                          onUpdateUser({
                            xp: user.xp + (activeQuest.sideQuest?.xpReward || 0),
                            coins: (user.coins || 0) + (activeQuest.sideQuest?.coinReward || 0)
                          });
                          saveQuestState(activeQuest, completedActivities.size === activeQuest.activities.length, Array.from(completedActivities), true);
                          toast({ title: "MISSÃO SECRETA CONCLUÍDA", description: `Recompensas sincronizadas com sua alma.` });
                        }} 
                        className="w-full h-12 bg-primary/10 hover:bg-primary/20 border border-primary/40 text-[10px] font-black uppercase font-orbitron text-primary shadow-[0_0_15px_rgba(0,191,255,0.2)]"
                      >
                        CONCLUIR MISSÃO
                      </Button>
                    )}
                  </div>
               )}

               <div className="shadow-panel p-5 border-primary/20 bg-primary/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /><h4 className="text-xs font-black text-white uppercase font-orbitron tracking-widest">Sincronia de Agenda</h4></div>
                    <Button variant="ghost" size="sm" onClick={() => { handleAction('click'); syncCalendar(); }} disabled={isSyncingCalendar} className="text-[8px] text-primary h-6 uppercase font-orbitron">{isSyncingCalendar ? "..." : "Sincronizar"}</Button>
                  </div>
                  <Button onClick={handleScheduleWorkout} className="w-full h-10 bg-primary/10 border border-primary/30 text-primary text-[10px] font-black uppercase font-orbitron">Agendar Treino Atual</Button>
               </div>
            </motion.div>
          )}

          {!statusViewActive && activeTab === 'raid' && (
            <motion.div key="raid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-6 text-center">
              <h3 className="text-3xl font-black text-[#FF0000] uppercase italic tracking-[0.2em] font-orbitron drop-shadow-[0_0_20px_rgba(255,0,0,1)]">PROTOCOLO DE RAID</h3>
              <div className="raid-neon-pulse p-10 flex flex-col items-center justify-center space-y-6 relative">
                <RaidSparks />
                <div className="relative z-10 flex flex-col items-center">
                  <Skull className="w-20 h-20 text-red-600 mb-4 animate-pulse drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]" />
                  <div className="absolute inset-0 pointer-events-none">
                    <RaidSparks />
                  </div>
                  <Lock className="w-8 h-8 text-red-600/60 mb-2" />
                  <h4 className="text-2xl font-black text-white uppercase font-orbitron tracking-tight">ACESSO BLOQUEADO</h4>
                  <p className="text-[12px] text-white/40 uppercase font-orbitron tracking-[0.3em] font-black">DESBLOQUEIA NO RANK A</p>
                </div>
              </div>
            </motion.div>
          )}

          {!statusViewActive && activeTab === 'store' && (
            <motion.div key="store" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-6 pt-4"><div className="flex items-center gap-2"><ShoppingBag className="w-6 h-6 text-primary animate-pulse" /><h3 className="text-xl font-black text-primary uppercase italic tracking-[0.2em] aura-text-neon font-orbitron">AURA STORE</h3></div><div className="shadow-panel p-8 text-center"><p className="text-sm text-white/70 italic font-orbitron">MERCADO EM SINCRONIZAÇÃO...</p></div></motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-xl border-t border-white/5 pt-3 pb-8 flex justify-around items-end">
        <button onClick={() => handleTabChange('dashboard')} className={cn("flex flex-col items-center p-2 transition-transform active:scale-90", activeTab === 'dashboard' ? "text-primary" : "text-white/30")}><Home className="w-6 h-6" /><span className="text-[9px] font-black mt-1 uppercase font-orbitron tracking-widest">HOME</span></button>
        <button onClick={() => handleTabChange('nutrition')} className={cn("flex flex-col items-center p-2 transition-transform active:scale-90", activeTab === 'nutrition' ? "text-secondary" : "text-white/30")}><Utensils className="w-6 h-6" /><span className="text-[9px] font-black mt-1 uppercase font-orbitron tracking-widest">DIETA</span></button>
        <div className="relative -top-4">
          <button onClick={() => handleTabChange('raid')} className={cn("w-16 h-16 bg-black/80 rounded-full shadow-[0_0_25px_rgba(255,0,0,0.4)] border-4 flex items-center justify-center p-2 transition-all active:scale-95 relative overflow-visible", activeTab === 'raid' ? "border-[#FF0000] shadow-[0_0_40px_rgba(255,0,0,0.8)]" : "border-red-900/40")}>
            <AnimatePresence>
              {activeTab === 'raid' && <RaidSparks />}
            </AnimatePresence>
            <Skull className={cn("w-10 h-10 relative z-10", activeTab === 'raid' ? "text-[#FF0000] drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]" : "text-red-900/60")} />
          </button>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-[#FF0000] uppercase font-orbitron tracking-tighter">RAID</span>
        </div>
        <button onClick={() => handleTabChange('quests')} className={cn("flex flex-col items-center p-2 transition-transform active:scale-90", activeTab === 'quests' ? "text-secondary" : "text-white/30")}><Target className="w-6 h-6" /><span className="text-[9px] font-black mt-1 uppercase font-orbitron tracking-widest">QUESTS</span></button>
        <button onClick={() => { handleAction('click'); setShowMissionBriefing(true); }} className="flex flex-col items-center p-2 transition-transform active:scale-90 text-white/30"><Sword className="w-6 h-6" /><span className="text-[9px] font-black mt-1 uppercase font-orbitron tracking-widest">DUNGEON</span></button>
      </footer>

      <AnimatePresence>
        {showAchievementsOverlay && (
          <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="fixed inset-0 bg-[#020203] z-[500] flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6 pt-4"><h2 className="text-xl font-black italic uppercase text-yellow-500 font-orbitron">CONQUISTAS</h2><Button variant="ghost" size="icon" onClick={() => setShowAchievementsOverlay(false)} className="text-primary"><X className="w-8 h-8" /></Button></div>
            <ScrollArea className="flex-1">
              <div className="grid gap-4 pr-4 pb-10">
                {ACHIEVEMENTS_LIST.map((achievement) => (
                  <div key={achievement.id} className={cn("shadow-panel p-4 flex gap-4 items-center border transition-all", user.unlockedAchievementIds?.includes(achievement.id) ? "border-yellow-500/40 bg-yellow-500/5" : "border-white/5 opacity-40 grayscale")}>
                    <AchievementIcon id={achievement.id} Unlocked={!!user.unlockedAchievementIds?.includes(achievement.id)} />
                    <div className="flex-1 space-y-1"><h4 className="text-xs font-black uppercase font-orbitron">{achievement.title}</h4><p className="text-[10px] text-white/70 italic leading-tight">{achievement.description}</p></div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{showDungeonTransition && <DungeonTransition onComplete={() => { setShowDungeonTransition(false); setDungeonStarted(true); setDungeonTime(0); }} />}</AnimatePresence>

      <AnimatePresence>{showMissionBriefing && (
        <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 bg-[#020203] z-[500] flex flex-col p-6 overflow-y-auto">
           <div className="flex justify-between items-start mb-6 pt-4"><h2 className="text-2xl font-black font-orbitron text-primary aura-text-neon uppercase italic tracking-tighter">MISSÃO DETECTADA</h2><Button variant="ghost" size="icon" onClick={() => setShowMissionBriefing(false)} className="text-primary"><X className="w-8 h-8" /></Button></div>
           <div className="dungeon-neon-pulse p-4 py-6 space-y-4 relative flex flex-col items-center text-center">
              <h3 className="text-xl font-bold text-white italic uppercase font-orbitron leading-tight">{activeQuest?.questTitle}</h3>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="flex flex-col"><span className="text-[10px] text-white/30 uppercase font-mono tracking-widest font-bold">DURAÇÃO</span><p className="text-3xl font-black text-primary font-orbitron">{activeQuest?.questDuration}</p></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/30 uppercase font-mono tracking-widest font-bold">RECOMPENSA</span>
                  <p className="text-3xl font-black text-secondary font-orbitron">50</p>
                  <span className="text-[8px] text-white/20 uppercase font-orbitron tracking-[0.2em] font-black -mt-1">AURA COINS</span>
                </div>
              </div>
           </div>
           <div className="mt-auto py-12 px-4"><Button onClick={() => { setShowMissionBriefing(false); setShowDungeonTransition(true); }} className="w-full h-20 bg-primary text-black font-black text-xl uppercase italic rounded-[2rem] shadow-[0_0_60px_rgba(0,240,255,0.5)] font-orbitron">ENTRAR NA DUNGEON</Button></div>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{showResetOverlay && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#020203]/98 backdrop-blur-3xl z-[500] flex items-center justify-center p-6"><div className="shadow-panel p-12 max-w-md w-full border-red-500/50 text-center space-y-6"><AlertTriangle className="w-16 h-16 text-red-500 mx-auto animate-pulse" /><h2 className="text-4xl font-black text-red-500 font-orbitron uppercase aura-text-neon">RESETE TOTAL?</h2><div className="flex flex-col gap-4 pt-4"><Button onClick={() => { handleAction('confirm'); onReset(); setShowResetOverlay(false); }} className="h-16 bg-red-600 text-white font-black uppercase italic rounded-2xl">CONFIRMAR</Button><Button variant="ghost" onClick={() => setShowResetOverlay(false)} className="h-16 text-white/40 font-black uppercase">CANCELAR</Button></div></div></motion.div>)}</AnimatePresence>

      <AnimatePresence>
        {dungeonStarted && activeQuest && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#02040a] z-[400] flex flex-col">
            <header className="px-6 py-8 flex justify-between items-center border-b border-white/5 bg-black/20">
              <Button variant="ghost" size="icon" onClick={() => setDungeonStarted(false)} className="text-primary"><ChevronLeft className="w-6 h-6" /></Button>
              <div className="flex items-center gap-2 text-primary font-mono text-lg font-black"><Timer className="w-4 h-4" />{formatTime(dungeonTime)}</div>
              {countdown !== null && <div className="text-2xl font-black text-secondary font-mono">{formatTime(countdown)}</div>}
            </header>
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4 pb-32">
                {activeQuest.activities.map((activity, idx) => (
                  <div key={idx} className={cn("shadow-panel p-5 flex flex-col gap-3", completedActivities.has(idx) && "opacity-40")}>
                    <div className="flex items-start gap-4">
                      <Checkbox checked={completedActivities.has(idx)} onCheckedChange={() => { const n = new Set(completedActivities); if(n.has(idx)) n.delete(idx); else n.add(idx); setCompletedActivities(n); }} className="mt-1 w-6 h-6 border-primary border-2" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1"><h4 className="font-black uppercase text-xs font-orbitron">{activity.name}</h4><span className="text-lg font-black text-primary font-mono">{activity.quantity}</span></div>
                        <p className="text-[10px] text-white/40 leading-relaxed font-mono font-bold uppercase">{activity.formTip}</p>
                      </div>
                    </div>
                    {!completedActivities.has(idx) && <Button onClick={() => handleStartExercise(idx)} className="h-10 bg-primary/20 text-primary border border-primary/40 font-black uppercase">INICIAR</Button>}
                  </div>
                ))}
              </div>
            </ScrollArea>
            {completedActivities.size === activeQuest.activities.length && (
              <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#02040a] to-transparent">
                <Button onClick={handleCollectRewards} className="w-full h-16 bg-primary text-black font-black text-lg italic uppercase rounded-2xl shadow-[0_0_50px_rgba(0,191,255,0.7)] font-orbitron">COLETAR RECOMPENSAS</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
