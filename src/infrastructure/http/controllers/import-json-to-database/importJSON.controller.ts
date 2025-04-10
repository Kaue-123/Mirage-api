import { FastifyRequest, FastifyReply } from "fastify";
import { EnterpriseRepository } from "../../../../database/repositories/Enterprise.repository";
import { Enterprise } from "../../../../domain/entities/Enterprises";

import * as fs from "fs";
import * as path from "path";

import { enterpriseSchema } from "../../../../application/dtos/schema";

export class EnterpriseImportController {
  private enterpriseRepository = new EnterpriseRepository();

  async importPlanilha(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const filePath = path.join(__dirname, '..', 'PlanilhaJson', 'convertToJson.json');

      if (!fs.existsSync(filePath)) {
        reply.status(404).send({ error: "Arquivo JSON não encontrado" });
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const enterpriseData: any[] = JSON.parse(fileContent);

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
        } else if (empresa.Tipo === "Matriz") {
          empresa.id_matriz = null;
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
