"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseImportController = void 0;
const EnterpriseRepository_1 = require("../repository/EnterpriseRepository");
const Enterprises_1 = require("../entities/Enterprises");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const schema_1 = require("../lib/schema");
class EnterpriseImportController {
    enterpriseRepository = new EnterpriseRepository_1.EnterpriseRepository();
    async importPlanilha(request, reply) {
        try {
            const filePath = path.join(__dirname, '..', 'PlanilhaJson', 'convertToJson.json');
            if (!fs.existsSync(filePath)) {
                reply.status(404).send({ error: "Arquivo JSON não encontrado" });
                return;
            }
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const enterpriseData = JSON.parse(fileContent);
            for (const empresaData of enterpriseData) {
                // Validação com Zod
                const parsedData = schema_1.enterpriseSchema.safeParse(empresaData);
                if (!parsedData.success) {
                    reply.status(400).send({ message: "Dados inválidos", errors: parsedData.error.errors });
                    return;
                }
                // Criando e preenchendo a entidade Empresa
                const empresa = new Enterprises_1.Enterprise();
                empresa.Nome = parsedData.data.Nome_Empresa;
                empresa.Cnpj = parsedData.data.CNPJ ?? null; // Já vem limpo do schema
                empresa.Sociedade = parsedData.data.Sociedade;
                empresa.Status = parsedData.data.Status;
                empresa.Gestao = parsedData.data.Gestao;
                empresa.Tipo = parsedData.data.Tipo;
                empresa.Procuracao = parsedData.data.Procuracao ?? null;
                empresa.Data_Outorga = parsedData.data.Data_Outorga;
                empresa.Caixa_Postal = parsedData.data.Caixa_Postal;
                empresa.Notificacao = parsedData.data.Notificacao;
                empresa.FraseDeSeguranca = parsedData.data.Frase_de_seguranca;
                empresa.id_matriz = parsedData.data.ID_Matriz ?? null;
                // Verificação de campos opcionais
                if (empresaData.Procuração === "S/Proc" || empresaData.Procuração === undefined) {
                    empresa.Data_Outorga = empresa.Data_Outorga || null;
                    empresa.Caixa_Postal = empresa.Caixa_Postal || null;
                    empresa.Notificacao = empresa.Notificacao || null;
                    empresa.FraseDeSeguranca = empresa.FraseDeSeguranca || null;
                }
                // Validando e atribuindo a matriz se existir
                if (empresa.Tipo === "Filial" && empresa.Cnpj) {
                    const cnpjBase = empresa.Cnpj.substring(0, 8); // Base CNPJ (8 primeiros dígitos)
                    const matriz = await this.enterpriseRepository.findMatrizByCnpjBase(cnpjBase);
                    if (matriz) {
                        empresa.id_matriz = matriz.id;
                    }
                }
                else if (empresa.Tipo === "Matriz") {
                    empresa.id_matriz = null;
                }
                console.log("Repositório:", this.enterpriseRepository);
                console.log("Métodos disponíveis:", Object.keys(this.enterpriseRepository));
                // Salvando a empresa
                await this.enterpriseRepository.save(empresa);
            }
            reply.send({ message: 'Planilha importada com sucesso!' });
        }
        catch (error) {
            reply.status(500).send({ message: 'Erro ao importar arquivo JSON', error: error.message });
        }
    }
}
exports.EnterpriseImportController = EnterpriseImportController;
//# sourceMappingURL=importEnterpriseController.js.map