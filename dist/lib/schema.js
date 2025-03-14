"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterpriseSchema = void 0;
const zod_1 = require("zod");
function cleanCNPJ(cnpj) {
    return cnpj.replace(/\D/g, ""); // Remove tudo que não é dígito
}
exports.enterpriseSchema = zod_1.z.object({
    Nome_Empresa: zod_1.z.string().min(1, "Nome é obrigatório"),
    CNPJ: zod_1.z.union([zod_1.z.string(), zod_1.z.number()])
        .nullable()
        .optional()
        .transform((val) => {
        if (val === null || val === undefined)
            return null;
        const cnpjString = String(val); // Converte número para string
        return cleanCNPJ(cnpjString); // Remove a formatação
    }),
    Sociedade: zod_1.z.string().nullable().optional(),
    Status: zod_1.z.string().min(1, "Ativa/Inativa é obrigatório"),
    Tipo: zod_1.z.string().min(1, "Tipo é obrigatório"),
    Gestao: zod_1.z.string().nullable().optional(),
    Procuracao: zod_1.z.string().nullable().optional(),
    Data_Outorga: zod_1.z.string().nullable().optional().transform((value) => value ? new Date(value) : null),
    Caixa_Postal: zod_1.z.enum(["S", "N"]).nullable().optional(),
    Notificacao: zod_1.z.enum(["S", "N"]).nullable().optional(),
    Frase_de_seguranca: zod_1.z.string().nullable().optional(),
    ID_Matriz: zod_1.z.number().nullable().optional(),
});
//# sourceMappingURL=schema.js.map