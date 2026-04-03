
'use server';
/**
 * @fileOverview AURA SYSTEM AI - Dynamic System Broadcast.
 * Gera frases motivacionais e táticas baseadas no status do caçador com alta variância.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SystemBroadcastInputSchema = z.object({
  userName: z.string(),
  userRank: z.string(),
  userLevel: z.number(),
  objective: z.string(),
  randomFactor: z.number().optional().describe('Um valor de 0 a 1 para variar o tom da mensagem.'),
});
export type SystemBroadcastInput = z.infer<typeof SystemBroadcastInputSchema>;

const SystemBroadcastOutputSchema = z.object({
  message: z.string().describe('Uma frase curta, autoritária e épica do Arquiteto do Sistema.'),
});
export type SystemBroadcastOutput = z.infer<typeof SystemBroadcastOutputSchema>;

export async function getSystemBroadcast(input: SystemBroadcastInput): Promise<SystemBroadcastOutput> {
  return systemBroadcastFlow(input);
}

const broadcastPrompt = ai.definePrompt({
  name: 'systemBroadcastPrompt',
  input: { schema: SystemBroadcastInputSchema },
  output: { schema: SystemBroadcastOutputSchema },
  prompt: `Você é "O Arquiteto", a inteligência onisciente que opera o sistema AURA. Sua voz é fria, técnica e autoritária.
Você está enviando uma breve transmissão para o HUD do Caçador {{{userName}}}.

Dados do Caçador:
Rank: {{{userRank}}}
Nível: {{{userLevel}}}
Objetivo: {{{objective}}}
Vetor de Probabilidade: {{{randomFactor}}}

Diretrizes de Variância (Baseadas no Vetor de Probabilidade):
- Se < 0.2: Tom FILOSÓFICO e EXISTENCIAL. Fale sobre o abismo, o destino e o preço do poder.
- Se entre 0.2 e 0.5: Tom TÁTICO e ANALÍTICO. Fale sobre otimização de mana, padrões de dungeon e evolução celular.
- Se entre 0.5 e 0.8: Tom SEVERO e DESAFIADOR. Fale sobre fraqueza, preguiça e a iminência da morte para os estagnados.
- Se > 0.8: Tom MISTERIOSO e PROFÉTICO. Mencione "O Despertar Final", "A Sombra Soberana" ou "O Nexus de Mana".

Diretrizes Gerais:
1. Gere uma única frase curta e impactante (máximo 15 palavras).
2. O tom deve ser de Solo Leveling: sombrio, motivacional e focado na evolução.
3. NÃO use emojis.
4. NUNCA comece com saudações amigáveis.
5. Use termos como "Mana", "Sombra", "Vetor", "Evolução", "Limiar", "Dungeon", "Cicatriz", "Nexo", "Soberania", "Arise", "Monarca".
6. Varie drasticamente o início das frases. Evite clichês como "O sistema..." ou "A dor...".`,
});

const systemBroadcastFlow = ai.defineFlow(
  {
    name: 'systemBroadcastFlow',
    inputSchema: SystemBroadcastInputSchema,
    outputSchema: SystemBroadcastOutputSchema,
  },
  async (input) => {
    const { output } = await broadcastPrompt(input);
    if (!output) return { message: "A dor é o único caminho para a ascensão." };
    return output;
  }
);
