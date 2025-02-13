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
        empresa.nome = parsedData.data.Nome_Empresa;
        empresa.cnpj = parsedData.data.CNPJ ?? null;
        empresa.sociedade = parsedData.data.Sociedade;
        empresa.ativaOuInativa = parsedData.data.Ativa_ou_Inativa;
        empresa.Gestao = parsedData.data.Gestao;
        empresa.Procuracao = parsedData.data.Procuracao ?? null;
        empresa.DataOutorga = parsedData.data.Data_Outorga;
        empresa.CaixaPostal = parsedData.data.Caixa_Postal;
        empresa.Notificacao = parsedData.data.Notificacao;
        empresa.FraseDeSeguranca = parsedData.data.Frase_de_seguranca;
        

        if (empresaData.Procuração === "S/Proc" || empresaData.Procuração === undefined) { 
          empresa.DataOutorga = null;
          empresa.CaixaPostal = null;
          empresa.Notificacao = null;
          empresa.FraseDeSeguranca = null;
        }
        // Validando e atribuindo a matriz se existir
    
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
