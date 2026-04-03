export type Rank = 'E' | 'D' | 'C' | 'B' | 'B+' | 'A' | 'A+' | 'S' | 'MONARCH';

export interface HunterStats {
  str: number; // Força
  agi: number; // Agilidade
  end: number; // Resistência / Foco
  vit: number; // Vitalidade
  foc: number; // Foco Mental
  aur: number; // Aura
}

export type DietPreference = 'Padrão' | 'Cetogênica' | 'Carnívora' | 'Low-Carb' | 'Vegetariana';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  requirement: string;
  category: 'STRENGTH' | 'ENDURANCE' | 'AGILITY' | 'TIME' | 'PROGRESSION' | 'SPECIAL' | 'STREAK';
  unlockedAt?: string;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_dungeon', title: 'O DESPERTAR', description: 'Você sobreviveu à sua primeira incursão dimensional.', requirement: 'Complete 1 Dungeon', category: 'PROGRESSION' },
  { id: 'strength_initiate', title: 'FORÇA BRUTA', description: 'Seus músculos estão se adaptando à pressão do sistema.', requirement: '100 Flexões totais', category: 'STRENGTH' },
  { id: 'strength_master', title: 'MÚSCULOS DE FERRO', description: 'Sua força bruta é comparada à de um Cavaleiro de Elite.', requirement: '500 Flexões totais', category: 'STRENGTH' },
  { id: 'squat_initiate', title: 'BASE SÓLIDA', description: 'Suas pernas não tremem mais diante do perigo.', requirement: '200 Agachamentos totais', category: 'AGILITY' },
  { id: 'squat_master', title: 'SOBERANO DO LEG DAY', description: 'A gravidade é apenas uma sugestão para você.', requirement: '1000 Agachamentos totais', category: 'AGILITY' },
  { id: 'plank_initiate', title: 'ESTÁTUA DA SOMBRA', description: 'Sua resistência mental atingiu um novo patamar.', requirement: '500s de Prancha totais', category: 'ENDURANCE' },
  { id: 'plank_master', title: 'TITÃ DO CORE', description: 'Seu centro de gravidade é inabalável.', requirement: '1500s de Prancha totais', category: 'ENDURANCE' },
  { id: 'time_warrior', title: 'VIGOR INFINITO', description: 'O tempo na dungeon é sua nova casa.', requirement: '1 hora total em Dungeons', category: 'TIME' },
  { id: 'time_legend', title: 'CRONOS HUNTER', description: 'Você domina o fluxo temporal do treinamento.', requirement: '5 horas totais em Dungeons', category: 'TIME' },
  { id: 'rank_s_hunter', title: 'O MONARCA DAS SOMBRAS', description: 'Você se tornou o que os outros temem.', requirement: 'Alcance Rank S', category: 'SPECIAL' },
  { id: 'streak_7', title: 'DISCIPLINA ABSOLUTA', description: 'Sete dias de caça ininterrupta.', requirement: 'Sequência de 7 dias', category: 'STREAK' },
  { id: 'streak_30', title: 'ESPÍRITO INABALÁVEL', description: 'Um mês de evolução sem falhas. Você é um deus entre caçadores.', requirement: 'Sequência de 30 dias', category: 'STREAK' },
];

export interface UserState {
  name: string;
  profileImage?: string;
  age: number;
  gender: 'Masc' | 'Fem' | 'Outro';
  weightKg: number;
  heightCm: number;
  objective: string;
  pushUps: number;
  squats: number;
  plankSeconds: number;
  equipment: string[];
  timePerDay: number;
  trainingDays: string[];
  dietPreference: DietPreference;
  level: number;
  xp: number;
  rank: Rank;
  stats: HunterStats;
  streak?: number;
  coins?: number;
  unlockedShadowIds?: string[];
  lostXpTotal?: number;
  pendingMissionsCount?: number;
  shadowMonarchActive?: boolean;
  totalDungeonTime?: number;
  unlockedAchievementIds?: string[];
  totalPushUps?: number;
  totalSquats?: number;
  totalPlankSeconds?: number;
  totalDungeonsCompleted?: number;
  googleAccessToken?: string;
}

export function calculateRankFromStats(pushUps: number, squats: number, plank: number): Rank {
  if (pushUps >= 120 && squats >= 200 && plank >= 180) return 'MONARCH';
  const score = (pushUps * 3.5) + (squats * 2.5) + (plank * 1.5);
  if (score >= 1500) return 'S';
  if (score >= 1200) return 'A+';
  if (score >= 1000) return 'A';
  if (score >= 850) return 'B+';
  if (score >= 700) return 'B';
  if (score >= 400) return 'C';
  if (score >= 200) return 'D';
  return 'E';
}

export function calculateInitialRank(pushUps: number, squats: number, plank: number): Rank {
  const rank = calculateRankFromStats(pushUps, squats, plank);
  return rank === 'MONARCH' ? 'S' : rank;
}

export function getXpForNextLevel(level: number): number {
  return Math.floor(250 * Math.pow(1.35, level - 1));
}

export function calculateProgression(currentXp: number, currentLevel: number): { level: number; xp: number } {
  let level = currentLevel;
  let xp = currentXp;
  let nextLevelXp = getXpForNextLevel(level);
  while (xp >= nextLevelXp) {
    xp -= nextLevelXp;
    level++;
    nextLevelXp = getXpForNextLevel(level);
  }
  return { level, xp };
}

export function updateHunterStats(user: UserState): HunterStats {
  const levelBonus = (user.level - 1) * 2;
  return {
    str: 10 + Math.floor(user.pushUps / 5) + levelBonus,
    agi: 10 + Math.floor(user.squats / 10) + levelBonus,
    end: 10 + Math.floor(user.plankSeconds / 20) + levelBonus,
    vit: 10 + Math.floor(user.level * 1.5),
    foc: 10 + Math.floor(user.level * 1.2),
    aur: 5 + Math.floor(user.level / 2)
  };
}