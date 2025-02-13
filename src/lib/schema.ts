import { z } from 'zod';

function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, ""); 
  if (cleaned.length !== 14) return cnpj; 
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export const enterpriseSchema = z.object({
  Nome_Empresa: z.string().min(1, "Nome é obrigatório"), 
  CNPJ: z.union([z.string(), z.number()]) 
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined) return null; 
      const cnpjString = String(val); // Converte número para string
      return formatCNPJ(cnpjString); // Formata para o padrão correto
    })
    .superRefine((val, ctx) => {
      if (!val) return; // Permite nulo

      if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `CNPJ inválido: "${val}". Formato esperado: 00.000.000/0000-00`,
        });
      }
    }),
  Sociedade: z.string().min(1, "Sociedade é obrigatória"), 
  Status: z.string().min(1, "Ativa/Inativa é obrigatório"), 
  Tipo: z.string().min(1, "Tipo é obrigatório"),
  Gestao: z.string().min(1, "Gestão é obrigatória"), 
  Procuracao: z.string().nullable().optional(), 
  Data_Outorga: z.string().nullable().optional().transform((value) => value ? new Date(value) : null), 
  Caixa_Postal: z.enum(["S", "N"]).nullable().optional(), 
  Notificacao: z.enum(["S", "N"]).nullable().optional(), 
  Frase_de_seguranca: z.string().nullable().optional(), 
  matriz_id: z.string().nullable().optional(), 
});


