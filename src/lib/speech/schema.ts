/** Formato da análise de um discurso/comunicado (resposta estruturada da IA, validada com zod). */
import { z } from "zod";

export const STANCES = ["Restritivo", "Lig. restritivo", "Neutro", "Lig. expansionista", "Expansionista"] as const;

export const AnalysisSchema = z.object({
  orador: z.string().describe("Quem fala e cargo, se identificável; vazio se não for claro."),
  tom: z.enum(STANCES).describe("Tom de política monetária na escala de 5 níveis."),
  confianca: z.enum(["baixa", "média", "alta"]).describe("Confiança na classificação do tom."),
  resumo: z.array(z.string()).describe("3 a 5 pontos principais, em português de Portugal."),
  citacoes: z
    .array(
      z.object({
        texto: z.string().describe("Frase copiada LITERALMENTE do texto original, na língua original."),
        porque: z.string().describe("Porque esta frase sustenta o tom, em português."),
      }),
    )
    .describe("2 a 5 frases-chave que sustentam a classificação."),
  mudancas: z.string().describe("O que muda face à leitura atual do banco central e às análises anteriores."),
  direcao_futura: z.string().describe("O que o texto sugere sobre as próximas decisões (sem previsões de preço)."),
  dados_a_vigiar: z
    .array(z.object({ indicador: z.string(), porque: z.string() }))
    .describe("Indicadores que o orador indica como decisivos para as próximas decisões."),
  sugestao_leitura: z
    .object({ postura: z.enum(STANCES), justificacao: z.string() })
    .nullable()
    .describe("Sugestão de nova leitura do banco central SE divergir da atual; null caso contrário."),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

/** O que fica guardado na base de dados: a análise + verificação das citações + metadados. */
export interface StoredAnalysis extends Analysis {
  citacoes_verificadas: (boolean | null)[]; // null = não foi possível verificar (ex.: PDF)
  custo_tokens: { entrada: number; saida: number };
  via_reserva: boolean; // respondida pelo modelo de reserva (fallback)
}
