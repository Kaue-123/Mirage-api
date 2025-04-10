import { AppdataSource } from "../data-source";
import { Enterprise } from "../../domain/entities/Enterprises";

export class UpdateEnterprise {
    private repository = AppdataSource.getRepository(Enterprise);

    async getAllCnpjs(): Promise<Enterprise[]> {
        return await this.repository.find();
    }

    async updateMailBox(cnpj: string, status: "S" | "N") {
        await this.repository.createQueryBuilder()
            .update(Enterprise)
            .set({ Caixa_Postal: status })
            .where("CNPJ = :cnpj", { cnpj })
            .execute();
        
        console.log(`Caixa_Postal atualizado para '${status}' no CNPJ: ${cnpj}`);
    }

    async updateUserStatus(cnpj: string, Data_Outorga: Date) {
        await this.repository.createQueryBuilder()
            .update(Enterprise)
            .set({
                Procuracao: "Realizado",
                FraseDeSeguranca: "JEITO CYRELA DE SER",
                Data_Outorga: Data_Outorga
            })
            .where("CNPJ = :cnpj", { cnpj })
            .execute();
    }
}
