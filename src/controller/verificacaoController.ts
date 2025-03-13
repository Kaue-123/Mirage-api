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


                    const procuracao = await detService.existeProcuracao(cnpjProcurado.Cnpj);
                    const servicosHabilitados = await detService.servicosHabilitados(cnpjProcurado);
                    // const service = await detService.serviceCnpj(cnpjProcurado.Cnpj);
                    const messages = await detService.messages(cnpjProcurado.Cnpj);
                    const consultaCompleta = await detService.consultaCompleta(cnpjProcurado.Cnpj);
                    const cadastroEmpregador = await detService.cadastroEmpregador(cnpjProcurado.Cnpj);
                    const mensagensNaoLidas = await detService.mensagensNaoLidas(cnpjProcurado.Cnpj);
                    const servicoAutorizado = await detService.servicosAutorizados(cnpjProcurado.Cnpj);
                    const caixaPostal = await detService.caixaPostal(cnpjProcurado.Cnpj);


                    resultados.push({
                        cnpj: cnpjProcurado.Cnpj,
                        procuracao,
                        servicosHabilitados,
                        // service,
                        messages,
                        consultaCompleta,
                        cadastroEmpregador,
                        mensagensNaoLidas,
                        servicoAutorizado,
                        caixaPostal
                    });
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
