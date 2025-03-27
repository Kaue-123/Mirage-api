import { AppdataSource } from "../db/data-source";
import { Enterprise } from "../entities/Enterprises";

export async function updateRegisterEnterprise(cnpj: string) {
    const repository = AppdataSource.getRepository(Enterprise);

    const empresa = await repository.findOne({
        where:
        { Cnpj: cnpj }
    }
    );

    if (!empresa) {
        console.warn(`CNPJ ${cnpj} não encontrado no banco de dados.`);
        return;
    }

    empresa.Procuracao = "Realizado";
    empresa.Notificacao = "N";
    empresa.Caixa_Postal = "N";
    empresa.FraseDeSeguranca = "JEITO CYRELA DE SER";
    empresa.Data_Outorga = new Date();



    await repository.save(empresa)
    console.log(`Cadastro da empresa ${cnpj} atualizado com sucesso.`);
}