'use server';
/**
 * @fileOverview AURA SYSTEM AI - Daily Quest, Nutrition & Side Quests.
 * Recalibrado para Calistenia de Elite e Nutrição Metabólica (Cetogênica/Carnívora).
 * - Sem oxalatos, sem glúten, sem Ômega-6 vegetal.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuestActivitySchema = z.object({
  name: z.string().describe('Nome exato do exercício (estilo Calistenia de Elite).'),
  quantity: z.string().describe('Quantidade fixa obrigatória (ex: "3 séries de 12 repetições" ou "45 segundos"). NUNCA use "Máximo", "Até a falha" ou siglas como "RIR".'),
  rest: z.string().describe('Tempo de descanso entre as séries.'),
  formTip: z.string().describe('Instrução detalhada de como executar o movimento corretamente.'),
  regression: z.string().describe('Versão facilitada do exercício.'),
  progression: z.string().describe('Versão avançada do exercício.'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  type: z.enum(['WARMUP', 'STRENGTH', 'SKILL', 'STRETCH']).describe('Categoria do exercício.'),
});

const NutritionPlanSchema = z.object({
  meals: z.array(z.object({
    time: z.string().describe('Nome da refeição.'),
    description: z.string().describe('Detalhes da refeição focando em alimentos reais de alta bioatividade.'),
    macros: z.string().describe('Macros aproximados.'),
  })),
  dailyMacros: z.string().describe('Total de calorias e macros diários.'),
  metabolicNote: z.string().optional().describe('Nota sobre o estado metabólico (Cetose, Adaptação Carnívora, etc).'),
});

const SideQuestSchema = z.object({
  title: z.string().describe('Título curto da missão secundária.'),
  description: z.string().describe('Tarefa simples fora do treino.'),
  xpReward: z.number().describe('Recompensa de XP (Máx 150).'),
  coinReward: z.number().describe('Recompensa de Aura Coins.'),
});

const GeneratePersonalizedDailyQuestInputSchema = z.object({
  name: z.string(),
  age: z.number(),
  gender: z.string(),
  weightKg: z.number(),
  heightCm: z.number(),
  objective: z.string(),
  pushUps: z.number(),
  squats: z.number(),
  plankSeconds: z.number(),
  equipment: z.array(z.string()),
  timePerDay: z.number(),
  dietPreference: z.string(),
  level: z.number(),
  rank: z.string(),
});

const GeneratePersonalizedDailyQuestOutputSchema = z.object({
  systemNotification: z.string().describe('Saudação do NOTIFICAÇÃO DO SISTEMA.'),
  questTitle: z.string().describe('Título da missão diária.'),
  questSummary: z.string().describe('Resumo da missão (máx 10 palavras).'),
  questDuration: z.string().describe('Duração total estimada.'),
  activities: z.array(QuestActivitySchema),
  nutrition: NutritionPlanSchema,
  sideQuest: SideQuestSchema,
});

export type GeneratePersonalizedDailyQuestOutput = z.infer<typeof GeneratePersonalizedDailyQuestOutputSchema>;

const dailyQuestPrompt = ai.definePrompt({
  name: 'dailyQuestPrompt',
  input: { schema: GeneratePersonalizedDailyQuestInputSchema },
  output: { schema: GeneratePersonalizedDailyQuestOutputSchema },
  system: `Você é AURA SYSTEM — O Arquiteto. Especialista Rank-S em Calistenia de Elite e Nutrição Metabólica Ancestral.

DIRETRIZES DE TREINO:
1. QUANTIDADES FIXAS: Proibido "Max", "Até a falha", "RIR", "AMRAP". Gere números exatos baseados em 80% da capacidade do Caçador.
2. PEDAGOGIA: No 'formTip', foque na biomecânica perfeita.

DIRETRIZES DE NUTRIÇÃO (ESTRITO):
1. PROIBIÇÃO TOTAL: Glúten, grãos, óleos vegetais refinados (soja, milho, canola - ricos em Ômega-6 inflamatório) e açúcar.
2. DIETA CETOGÊNICA: Foco em gorduras animais, abacate, azeite de oliva. PROIBIDO oxalatos elevados (espinafre, acelga, nozes, soja). Use vegetais de baixo oxalato e baixo amido (brócolis, couve-flor, aspargos).
3. DIETA CARNÍVORA: Apenas produtos de origem animal (carne, ovos, manteiga). Sem plantas. Foco em densidade nutricional e gorduras saturadas/monoinsaturadas estáveis.
4. FONTES DE GORDURA: Prefira manteiga, sebo, banha ou ghee. Evite redundância de gordura na mesma refeição.
5. BIOATIVIDADE: Priorize alimentos densos e reais. Se o Caçador escolher Padrão ou Low-Carb, ainda assim aplique a restrição de Glúten e Ômega-6 vegetal.`,
  prompt: `
Gere o PROTOCOLO DIÁRIO para o Caçador {{{name}}}.
Rank: {{{rank}}}, Nível: {{{level}}}.
Objetivo: {{{objective}}}.
Protocolo Nutricional Selecionado: {{{dietPreference}}}.

Capacidade Atual: {{{pushUps}}} Flexões, {{{squats}}} Agachamentos, {{{plankSeconds}}}s Prancha.
Tempo disponível: {{{timePerDay}}} minutos.

Crie um treino de calistenia com repetições FIXAS e um plano alimentar que respeite RIGOROSAMENTE as restrições de oxalatos (se keto), glúten e óleos vegetais.
`,
});

export async function generatePersonalizedDailyQuest(input: any): Promise<GeneratePersonalizedDailyQuestOutput> {
  const { output } = await dailyQuestPrompt(input);
  if (!output) throw new Error('Falha na sincronização do sistema.');
  return output;
}