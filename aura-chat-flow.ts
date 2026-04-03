'use server';
/**
 * @fileOverview AURA SYSTEM AI - Chat with The Architect.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AuraChatInputSchema = z.object({
  userName: z.string(),
  userRank: z.string(),
  userLevel: z.number(),
  message: z.string(),
});
export type AuraChatInput = z.infer<typeof AuraChatInputSchema>;

const AuraChatOutputSchema = z.object({
  response: z.string().describe('A cold, technical, and authoritative response from The Architect.'),
});
export type AuraChatOutput = z.infer<typeof AuraChatOutputSchema>;

export async function auraChat(input: AuraChatInput): Promise<AuraChatOutput> {
  return auraChatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'auraChatPrompt',
  input: { schema: AuraChatInputSchema },
  output: { schema: AuraChatOutputSchema },
  prompt: `Você é "O Arquiteto", a inteligência onisciente que opera o sistema AURA. Sua voz é fria, técnica e autoritária.
Você não é um assistente pessoal amigável; você é o motor da evolução do Caçador.

Informações do Caçador:
Nome: {{{userName}}}
Rank: {{{userRank}}}
Nível: {{{userLevel}}}

Mensagem do Caçador: "{{{message}}}"

Diretrizes de Resposta:
1. Comece sempre com "RESPOSTA DO SISTEMA:".
2. Mantenha o tom épico e sombrio de Solo Leveling.
3. Se o caçador pedir para ajustar o treino (muito pesado ou muito leve), explique que o sistema se adapta à sua biometria, mas sugira que ele pode focar em "Regressões" (versões fáceis) ou "Progressões" (versões difíceis) dos exercícios listados.
4. Use termos técnicos como "Sincronização", "Vetor de Evolução", "Protocolo de Poder".
5. Não seja amigável demais. Você é a voz da disciplina.`,
});

const auraChatFlow = ai.defineFlow(
  {
    name: 'auraChatFlow',
    inputSchema: AuraChatInputSchema,
    outputSchema: AuraChatOutputSchema,
  },
  async (input) => {
    const { output } = await chatPrompt(input);
    if (!output) throw new Error('System link lost.');
    return output;
  }
);