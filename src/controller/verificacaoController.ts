import { FastifyRequest, FastifyReply } from "fastify";
import { DetService } from "../service/detService";
import { AppdataSource } from "../db/data-source";
import { Enterprise } from "../entities/CnpjMatriz";



// Função para aguardar um delay em milissegundos
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export class DetController {
    static async verificarProcuracao(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const bearerToken = request.headers['authorization']?.replace('Bearer ', '');

            if (!bearerToken) {
                return reply.status(401).send({ message: "Token de autenticação não encontrado" });
            }

            const detService = new DetService(bearerToken);
            const cnpjsProcurados = await AppdataSource.getRepository(Enterprise).find();

            if (cnpjsProcurados.length === 0) {
                return reply.status(404).send({ message: "Nenhum CNPJ encontrado no banco de dados." });
            }

            const resultados = [];
            const batchSize = 10; // Quantidade de CNPJs por lote
            const delay = 60000; // 1 minuto de delay para cada consulta por lote

            for (let i = 0; i < cnpjsProcurados.length; i += batchSize) {
                const batch = cnpjsProcurados.slice(i, i + batchSize);
                console.log(`Processando lote de ${batch.length} CNPJs...`);

                for (const cnpjProcurado of batch) {
                    console.log(`Processando CNPJ: ${cnpjProcurado.Cnpj}`);

                  
                    const servicosHabilitados = await detService.servicosHabilitados(cnpjProcurado);

                    if (servicosHabilitados.length === 0) {
                        console.log(`CNPJ ${cnpjProcurado.Cnpj} sem procuração. Verificando mensagens...`);

                       
                        const messages = await detService.messages(cnpjProcurado.Cnpj);

                       
                        if (Array.isArray(messages) && messages.some(msg => msg.codigo === 110)) {
                            console.log(`CNPJ ${cnpjProcurado.Cnpj} com código 110. Interrompendo e passando para o próximo.`);
                            resultados.push({ cnpj: cnpjProcurado.Cnpj, status: "Interrompido - Código 110" });
                            continue;
                        }

                        resultados.push({ 
                            cnpj: cnpjProcurado.Cnpj, 
                            status: "Sem procuração", 
                            messages 
                        });

                    } else if (servicosHabilitados.length === 5) {
                        console.log(`CNPJ ${cnpjProcurado.Cnpj} com procuração. Seguindo para consulta completa...`);

                        // Se tem procuração, segue 
                        // const consultaCompleta = await detService.consultaCompleta(cnpjProcurado.Cnpj);
                        const mensagensNaoLidas = await detService.mensagensNaoLidas(cnpjProcurado.Cnpj);
                        const servicoAutorizado = await detService.servicosAutorizados(cnpjProcurado.Cnpj);
                        const caixaPostal = await detService.caixaPostal(cnpjProcurado.Cnpj);

                        resultados.push({
                            cnpj: cnpjProcurado.Cnpj,
                            status: "Com procuração",
                            servicosHabilitados,
                            // consultaCompleta,
                            mensagensNaoLidas,
                            servicoAutorizado,
                            caixaPostal
                        });
                    } else {
                        console.log(`CNPJ ${cnpjProcurado.Cnpj} com retorno inesperado em serviços habilitados.`);
                        resultados.push({ 
                            cnpj: cnpjProcurado.Cnpj, 
                            status: "Erro - Retorno inesperado em serviços habilitados" 
                        });
                    }
                }

                if (i + batchSize < cnpjsProcurados.length) {
                    console.log("Aguardando 1 minuto para processar o próximo lote...");
                    await sleep(delay);
                }
            }

            return reply.send({
                message: "Resultados da verificação para os CNPJs processados:",
                resultados
            });

        } catch (error) {
            console.error("Erro ao verificar procuração e mensagens:", error);
            return reply.status(500).send({
                message: "Erro ao verificar procuração e mensagens não lidas",
                error: error.message
            });
        }
    }
}