"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { UserState, DietPreference, calculateInitialRank } from '@/lib/system-logic';
import { Target, Loader2, User, Camera, ShieldCheck, Ghost } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound, SOUND_URLS } from '@/lib/sounds';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface OnboardingProps {
  onComplete: (data: Partial<UserState>) => void;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const DIET_OPTIONS: DietPreference[] = ['Padrão', 'Cetogênica', 'Carnívora', 'Low-Carb', 'Vegetariana'];
const OBJECTIVE_OPTIONS = [
  "Hipertrofia (Ganho de Massa)",
  "Emagrecimento (Perda de Gordura)",
  "Força Pura (Poder Explosivo)",
  "Resistência (Vigor Infinito)",
  "Habilidades (Aprender Skills)"
];

const ANALYSIS_STEPS = [
  "Sincronizando Biometria...",
  "Analisando Limites de Poder...",
  "Calculando Massa e Resistência...",
  "Avaliando Potencial de Evolução...",
  "DETERMINANDO RANK DO CAÇADOR...",
  "SINCRONIZANDO COM O ARQUITETO..."
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisText, setAnalysisText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const auth = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    profileImage: '',
    age: '' as any,
    gender: 'Masc' as any,
    weightKg: '' as any,
    heightCm: '' as any,
    objective: '',
    pushUps: '' as any,
    squats: '' as any,
    plankSeconds: '' as any,
    equipment: [] as string[],
    timePerDay: 30,
    trainingDays: [] as string[],
    dietPreference: 'Padrão' as DietPreference,
    googleAccessToken: ''
  });

  useEffect(() => {
    if (isAnalyzing) {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setTimeout(finalizeOnboarding, 800);
        }
        setAnalysisProgress(currentProgress);
        const stepIdx = Math.min(Math.floor((currentProgress / 100) * ANALYSIS_STEPS.length), ANALYSIS_STEPS.length - 1);
        setAnalysisText(ANALYSIS_STEPS[stepIdx]);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const handleGoogleLogin = async () => {
    playSound(SOUND_URLS.CLICK, 0.4);
    playSound(SOUND_URLS.CONFIRM, 0.5);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (result.user) {
        setFormData(prev => ({
          ...prev,
          name: result.user.displayName || '',
          profileImage: result.user.photoURL || '',
          googleAccessToken: token || ''
        }));
        
        if (token) localStorage.setItem('aura_google_token', token);

        setStep(1);
        toast({
          title: "Sincronia Estabelecida",
          description: "Sua alma e sua agenda foram vinculadas ao Nexus.",
        });
      }
    } catch (error: any) {
      console.error("Login failed:", error.code, error.message);
      toast({
        variant: "destructive",
        title: "Falha na Sincronização",
        description: "Erro ao conectar com o servidor.",
      });
    }
  };

  const nextStep = () => {
    playSound(SOUND_URLS.CLICK, 0.4);
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    playSound(SOUND_URLS.CLICK, 0.3);
    setStep(prev => Math.max(0, prev - 1));
  };

  const handleGuestEntry = () => {
    playSound(SOUND_URLS.CLICK, 0.4);
    setStep(1);
  };

  const handleSelectObjective = (opt: string) => {
    playSound(SOUND_URLS.CLICK, 0.4);
    setFormData({ ...formData, objective: opt });
  };

  const handleToggleDay = (d: string) => {
    playSound(SOUND_URLS.CLICK, 0.4);
    setFormData(prev => ({ 
      ...prev, 
      trainingDays: prev.trainingDays.includes(d) 
        ? prev.trainingDays.filter(x => x !== d) 
        : [...prev.trainingDays, d] 
    }));
  };

  const startAnalysis = () => {
    playSound(SOUND_URLS.CLICK, 0.4);
    setIsAnalyzing(true);
  };

  const finalizeOnboarding = () => {
    const pushUps = Number(formData.pushUps) || 0;
    const squats = Number(formData.squats) || 0;
    const plank = Number(formData.plankSeconds) || 0;
    const rank = calculateInitialRank(pushUps, squats, plank);
    
    onComplete({
      ...formData,
      age: Number(formData.age),
      weightKg: Number(formData.weightKg),
      heightCm: Number(formData.heightCm),
      pushUps, squats, plankSeconds: plank,
      level: 1, xp: 0, rank,
      stats: { str: 10 + Math.floor(pushUps / 5), agi: 10 + Math.floor(squats / 10), end: 10 + Math.floor(plank / 20), vit: 10, foc: 10, aur: 5 },
      coins: 0, streak: 0, unlockedAchievementIds: [],
      totalPushUps: 0, totalSquats: 0, totalPlankSeconds: 0, totalDungeonsCompleted: 0, totalDungeonTime: 0,
      googleAccessToken: formData.googleAccessToken
    });
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#030406]">
        <Card className="w-full max-w-md border-primary/40 bg-black/90 backdrop-blur-xl p-10 text-center space-y-8 shadow-[0_0_50px_rgba(0,191,255,0.2)]">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <div className="space-y-4">
            <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter font-orbitron aura-text-neon">{analysisText}</h2>
            <Progress value={analysisProgress} className="h-1.5" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#030406]">
      <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
          <div className="h-full bg-primary shadow-[0_0_10px_#00BFFF]" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <CardHeader className="text-center pt-8">
          <CardTitle className="text-2xl text-primary font-bold uppercase tracking-tight font-orbitron aura-text-neon">
            {step === 0 ? "NEXO DE IDENTIDADE" : step === 1 ? "O DESPERTAR" : step === 2 ? "PARÂMETROS" : step === 3 ? "PODER" : "O CAMINHO"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-4 space-y-6">
          {step === 0 && (
            <div className="space-y-8 text-center py-4">
              <div className="space-y-2">
                <p className="text-sm text-white/90 font-bold uppercase tracking-widest font-orbitron">VINCULAR ALMA AO SISTEMA?</p>
                <p className="text-[10px] text-white/40 italic font-mono uppercase tracking-[0.2em] leading-relaxed">Sincronize sua evolução e sua agenda Google para garantir persistência eterna.</p>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={handleGoogleLogin} 
                  className="w-full h-16 bg-white text-black hover:bg-white/90 font-black rounded-xl flex gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] justify-center transition-all hover:scale-[1.02]"
                >
                  <ShieldCheck className="w-6 h-6 text-primary" /> 
                  <span className="font-orbitron tracking-tight">VINCULAR COM GOOGLE</span>
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-[#0b0c10] px-4 text-white/20 font-orbitron tracking-[0.5em]">OU</span></div>
                </div>

                <Button 
                  variant="ghost" 
                  onClick={handleGuestEntry} 
                  className="w-full h-14 text-white/40 hover:text-primary hover:bg-primary/5 uppercase tracking-[0.3em] text-[10px] font-orbitron border border-white/5 rounded-xl transition-all"
                >
                  <Ghost className="w-4 h-4 mr-2" /> SEGUIR COMO VISITANTE
                </Button>
              </div>

              <p className="text-[9px] text-red-500/40 font-black uppercase tracking-widest leading-tight">
                AVISO: DADOS DE VISITANTE SÃO LOCAIS E PODEM SER EXPURGADOS PELO SISTEMA SE O ARMAZENAMENTO FOR LIMPO.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div onClick={() => { playSound(SOUND_URLS.CLICK, 0.4); fileInputRef.current?.click(); }} className="avatar-vortex-container scale-75 cursor-pointer group">
                  <div className="avatar-vortex-aura" />
                  <div className="avatar-vortex-core">
                    {formData.profileImage ? <img src={formData.profileImage} className="w-full h-full object-cover" alt="Profile" /> : <User className="w-12 h-12 text-primary/40" />}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
                    reader.readAsDataURL(file);
                  }
                }} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-orbitron tracking-widest">Nome do Caçador</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-black/40 border-primary/10 h-12" placeholder="Ex: Sung Jin-Woo" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-orbitron tracking-widest">Objetivo Principal</Label>
                <div className="grid gap-2">
                  {OBJECTIVE_OPTIONS.map((opt) => (
                    <Button key={opt} variant={formData.objective === opt ? "default" : "outline"} className={cn("justify-start h-auto py-3 text-[10px] uppercase tracking-wider font-orbitron", formData.objective === opt && "bg-primary/20 border-primary text-primary")} onClick={() => handleSelectObjective(opt)}>
                      <Target className="w-4 h-4 mr-3 text-primary" /> {opt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step >= 2 && step <= 4 && (
             <div className="space-y-4">
                {step === 2 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[10px] uppercase tracking-widest font-orbitron">Biometria Básica</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" placeholder="Idade" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="bg-black/40 border-white/5 h-12" />
                        <Input type="number" placeholder="Peso (kg)" value={formData.weightKg} onChange={(e) => setFormData({...formData, weightKg: e.target.value})} className="bg-black/40 border-white/5 h-12" />
                      </div>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[10px] uppercase tracking-widest font-orbitron">Altura (cm)</Label>
                      <Input type="number" placeholder="Altura (cm)" value={formData.heightCm} onChange={(e) => setFormData({...formData, heightCm: e.target.value})} className="bg-black/40 border-white/5 h-12" />
                    </div>
                  </div>
                )}
                {step === 3 && (
                   <div className="space-y-4">
                      <p className="text-[10px] text-white/50 uppercase italic font-mono mb-2">Informe seus limites atuais para calibração do Rank inicial.</p>
                      <div className="space-y-3">
                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-orbitron tracking-widest">Flexões Máximas</Label><Input type="number" placeholder="Ex: 30" value={formData.pushUps} onChange={(e) => setFormData({...formData, pushUps: e.target.value})} className="bg-black/40 border-white/5 h-12" /></div>
                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-orbitron tracking-widest">Agachamentos Máximos</Label><Input type="number" placeholder="Ex: 50" value={formData.squats} onChange={(e) => setFormData({...formData, squats: e.target.value})} className="bg-black/40 border-white/5 h-12" /></div>
                        <div className="space-y-1.5"><Label className="text-[10px] uppercase font-orbitron tracking-widest">Prancha (Segundos)</Label><Input type="number" placeholder="Ex: 60" value={formData.plankSeconds} onChange={(e) => setFormData({...formData, plankSeconds: e.target.value})} className="bg-black/40 border-white/5 h-12" /></div>
                      </div>
                   </div>
                )}
                {step === 4 && (
                   <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-widest font-orbitron">Dias de Treinamento</Label>
                        <div className="flex flex-wrap gap-2">
                           {WEEK_DAYS.map(d => <Button key={d} size="sm" variant={formData.trainingDays.includes(d) ? 'default' : 'outline'} className={cn("text-[10px] h-8 font-orbitron", formData.trainingDays.includes(d) && "bg-primary/20 border-primary text-primary")} onClick={() => handleToggleDay(d)}>{d}</Button>)}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-widest font-orbitron">Protocolo Alimentar</Label>
                        <Select value={formData.dietPreference} onValueChange={(v: any) => { playSound(SOUND_URLS.CLICK, 0.4); setFormData({...formData, dietPreference: v}); }}>
                           <SelectTrigger className="bg-black/40 border-white/5 h-12 font-mono"><SelectValue /></SelectTrigger>
                           <SelectContent className="bg-[#0b0c10] border-primary/20">{DIET_OPTIONS.map(d => <SelectItem key={d} value={d} className="text-white hover:bg-primary/10 font-mono">{d}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                   </div>
                )}
             </div>
          )}

          <div className="flex gap-4 pt-4">
            {step > 0 && <Button variant="ghost" onClick={prevStep} className="flex-1 uppercase font-orbitron text-[10px] text-white/40 hover:text-white">Voltar</Button>}
            {step > 0 && step < 4 && <Button onClick={nextStep} className="flex-1 uppercase font-orbitron text-[10px] bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30">Próximo</Button>}
            {step === 4 && <Button onClick={startAnalysis} className="flex-1 uppercase font-orbitron text-[10px] shadow-[0_0_15px_#00BFFF] bg-primary text-black font-black hover:bg-primary/90">SINCRONIZAR</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}