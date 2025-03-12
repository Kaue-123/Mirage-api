import { z } from 'zod';

function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, ""); // Remove tudo que não é dígito
}

export const enterpriseSchema = z.object({
  Nome_Empresa: z.string().min(1, "Nome é obrigatório"), 
  CNPJ: z.union([z.string(), z.number()]) 
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined) return null; 
      const cnpjString = String(val); // Converte número para string
      return cleanCNPJ(cnpjString); // Remove a formatação
    }),
  Sociedade: z.string().nullable().optional(),
  Status: z.string().min(1, "Ativa/Inativa é obrigatório"), 
  Tipo: z.string().min(1, "Tipo é obrigatório"),
  Gestao: z.string().nullable().optional(),
  Procuracao: z.string().nullable().optional(), 
  Data_Outorga: z.string().nullable().optional().transform((value) => value ? new Date(value) : null), 
  Caixa_Postal: z.enum(["S", "N"]).nullable().optional(), 
  Notificacao: z.enum(["S", "N"]).nullable().optional(), 
  Frase_de_seguranca: z.string().nullable().optional(), 
  ID_Matriz: z.number().nullable().optional(), 
});
