import { FastifyRequest, FastifyReply } from "fastify";
import { EnterpriseRepository } from "../repository/EnterpriseRepository";
import { Enterprise } from "../entities/CnpjMatriz";


import * as fs from "fs";
import * as path from "path";

import { enterpriseSchema } from "../lib/schema";


export class EnterpriseImportController {
  private enterpriseRepository = new EnterpriseRepository();

  async importPlanilha(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const filePath = path.join(__dirname, '..', 'PlanilhaJson', 'convertToJson.json');
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const enterpriseData: any[] = JSON.parse(fileContent);

      if (!fs.existsSync(filePath)) {
        reply.status(404).send({ error: "Arquivo JSON não encontrado" });
        return;
      }

      for (const empresaData of enterpriseData) {
        // Validação com Zod
        const parsedData = enterpriseSchema.safeParse(empresaData);
        if (!parsedData.success) {
          reply.status(400).send({ message: "Dados inválidos", errors: parsedData.error.errors });
          return;
        }

        // Criando e preenchendo a entidade Empresa
        const empresa = new Enterprise();
        empresa.Nome = parsedData.data.Nome_Empresa;
        empresa.Cnpj = parsedData.data.CNPJ ?? null;
        empresa.Sociedade = parsedData.data.Sociedade;
        empresa.Status = parsedData.data.Status;
        empresa.Gestao = parsedData.data.Gestao;
        empresa.Tipo = parsedData.data.Tipo; 
        empresa.Procuracao = parsedData.data.Procuracao ?? null;
        empresa.Data_Outorga = parsedData.data.Data_Outorga;
        empresa.Caixa_Postal = parsedData.data.Caixa_Postal;
        empresa.Notificacao = parsedData.data.Notificacao;
        empresa.FraseDeSeguranca = parsedData.data.Frase_de_seguranca;
        

        if (empresaData.Procuração === "S/Proc" || empresaData.Procuração === undefined) { 
          empresa.Data_Outorga = null;
          empresa.Caixa_Postal = null;
          empresa.Notificacao = null;
          empresa.FraseDeSeguranca = null;
        }
        // Validando e atribuindo a matriz se existir
        
        if (empresa.Tipo === "Filial") {
         const matriz = await this.enterpriseRepository.findByCnpj(empresa.Cnpj.substring(0, 8))
         if (matriz) {
            empresa.id_matriz = matriz.id;
         }; 
        }

        console.log("Repositório:", this.enterpriseRepository);
        console.log("Métodos disponíveis:", Object.keys(this.enterpriseRepository));
        // Salvando a empresa
        await this.enterpriseRepository.save(empresa);
      }

      reply.send({ message: 'Planilha importada com sucesso!' });
    } catch (error) {
      reply.status(500).send({ message: 'Erro ao importar arquivo JSON', error: error.message });
    }
  }
}
