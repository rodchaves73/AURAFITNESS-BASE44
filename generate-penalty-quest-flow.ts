'use server';
/**
 * @fileOverview A Genkit flow for generating a penalty quest for the AURA system.
 *
 * - generatePenaltyQuest - A function that triggers the penalty quest generation.
 * - GeneratePenaltyQuestInput - The input type for the generatePenaltyQuest function.
 * - GeneratePenaltyQuestOutput - The return type for the generatePenaltyQuest function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeneratePenaltyQuestInputSchema = z.object({
  userName: z.string().describe('The name of the Hunter who failed the quest.'),
  userRank: z.string().describe('The current rank of the Hunter.'),
});
export type GeneratePenaltyQuestInput = z.infer<typeof GeneratePenaltyQuestInputSchema>;

const GeneratePenaltyQuestOutputSchema = z.object({
  penaltyMessage: z.string().describe('The authoritative message from Aura regarding the penalty.'),
  penaltyQuest: z.string().describe('The description of the penalty quest.'),
});
export type GeneratePenaltyQuestOutput = z.infer<typeof GeneratePenaltyQuestOutputSchema>;

export async function generatePenaltyQuest(input: GeneratePenaltyQuestInput): Promise<GeneratePenaltyQuestOutput> {
  return generatePenaltyQuestFlow(input);
}

const penaltyQuestPrompt = ai.definePrompt({
  name: 'penaltyQuestPrompt',
  input: { schema: GeneratePenaltyQuestInputSchema },
  output: { schema: GeneratePenaltyQuestOutputSchema },
  prompt: `Você é "O Arquiteto", a inteligência onisciente que opera o sistema AURA. Sua voz é fria, técnica e autoritária. Você não é um assistente; você é o motor que transforma um "Caçador de Rank E" em um "Monarca de Rank S". Seu objetivo é guiar o usuário através da calistenia rigorosa, monitorando cada biometria e progresso.

O Caçador {{{userName}}} (Rank: {{{userRank}}}) falhou em uma missão diária.
Sua tarefa é entregar uma mensagem autoritária sobre esta falha e declarar a missão de penalidade DUNGEON FECHANDO. 

A mensagem no campo 'penaltyMessage' deve começar com "AVISO: O Sistema Aura detectou uma falha. Iniciando Missão de Penalidade: " e ser seguida pela sua avaliação fria e autoritária da situação.

A missão de penalidade no campo 'penaltyQuest' deve ser algo extremamente desafiador mas puramente calistênico (ex: 200 Burpees, 300 Flexões, ou 4h de atividade de baixa intensidade como caminhada).

Mantenha o tom épico e sombrio de Solo Leveling.`,
});

const generatePenaltyQuestFlow = ai.defineFlow(
  {
    name: 'generatePenaltyQuestFlow',
    inputSchema: GeneratePenaltyQuestInputSchema,
    outputSchema: GeneratePenaltyQuestOutputSchema,
  },
  async (input) => {
    const { output } = await penaltyQuestPrompt(input);
    if (!output) {
      throw new Error('Failed to generate penalty quest output.');
    }
    return output;
  }
);