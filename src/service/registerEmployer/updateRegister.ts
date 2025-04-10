import axios from "axios";
import { AppdataSource } from "../../db/data-source";
import { Enterprise } from "../../entities/Enterprises";
import { cleanCNPJ } from "../../utils/replaceCNPJ/cnpjFormatado";

export class updateRegisterClient {
   

    async updateRegister(cnpjProcurado: string) {
        const registerEmpregador = cleanCNPJ(cnpjProcurado)
        console.log(`Atualizando cadastro do empregador: ${registerEmpregador}...`)


        const updateData = {
            enviarMensagemResponsavel: false,
            ni: registerEmpregador,
            origemCadastro: 0,
            palavraChave: "JEITO CYRELA DE SER",
            tipoNI: 0,
            contatos: [
                {
                    email: "det.cyrela@krscalculos.com.br",
                    nome: "KRS Calculo",
                    origemCadastro: 0,
                    telefone: "1131818255"
                }
            ]
        }; 
        
        const url = `/services/v1/empregadores`
        try {
            
        } catch (error) {
            
        }
    }
}