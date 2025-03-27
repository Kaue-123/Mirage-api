import { FastifyRequest, FastifyReply } from "fastify";
import { DetService } from "../service/detService";
import { AppdataSource } from "../db/data-source";
import { Enterprise } from "../entities/Enterprises";

// Função para aguardar um delay em milissegundos
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export class DetController {
    static async verificarProcuracao(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            let bearerToken = request.headers['authorization']?.replace('Bearer ', '');

            if (!bearerToken) {
                return reply.status(401).send({ message: "Token de autenticação não encontrado" });
            }


            const detService = new DetService(bearerToken);
            const cnpjsProcurados = await AppdataSource.getRepository(Enterprise).find();

            if (cnpjsProcurados.length === 0) {
                return reply.status(404).send({ message: "Nenhum CNPJ encontrado no banco de dados." });
            }

            const resultados = [];
            const cnpjsComProcuracao = [];
            const cnpjsComMensagens = [];
            let cnpjProcessados = 0

            const mensagensNaoLidasResumo = []
            const batchSize = 2300; // Quantidade de CNPJs por lote
            const delay = 30000; // 30 segundos de delay para cada consulta por lote

            for (let i = 0; i < cnpjsProcurados.length; i += batchSize) {
                const batch = cnpjsProcurados.slice(i, i + batchSize);
                console.log(`Processando lote de ${batch.length} CNPJs...`);

                for (const cnpjProcurado of batch) {
                    console.log(`Processando CNPJ: ${cnpjProcurado.Cnpj}`);


                    // if (cnpjProcurado) {
                    //     console.log("Esse cnpj ja foi consultado, passando para o proximo")
                    //     continue
                    // }
                    
                    bearerToken = detService.getBearerToken();
                    console.log(`Bearer Token atual: ${bearerToken}`);

                    if (!bearerToken) {
                        return reply.status(401).send({ message: "Token de autenticação não encontrado" });
                    }

                    

                    // await detService.verificarCadastro(cnpjProcurado.Cnpj)
                    // await atualizarCadastroEmpresa(cnpjProcurado.Cnpj)


                    const servicosHabilitados = await detService.enableServices(cnpjProcurado);
                    if (servicosHabilitados.length === 0) {
                        console.log(`CNPJ ${cnpjProcurado.Cnpj} sem procuração.`);

                        resultados.push({
                            cnpj: cnpjProcurado.Cnpj,
                            status: "Sem procuração",
                        });
                    } else if (servicosHabilitados.length === 5) {
                        console.log(`CNPJ ${cnpjProcurado.Cnpj} com procuração. Seguindo para mensagens não lidas...`);
                        cnpjsComProcuracao.push(cnpjProcurado.Cnpj);

                        await detService.checkRegistration(cnpjProcurado.Cnpj)      

                        const mensagensNaoLidas = await detService.unreadsMessages(cnpjProcurado.Cnpj);

                        if (mensagensNaoLidas.quantidade > 0) {
                            console.log(`CNPJ ${cnpjProcurado.Cnpj} com mensagens não lidas.`);
                            cnpjsComMensagens.push(cnpjProcurado.Cnpj);

                            mensagensNaoLidasResumo.push({ 
                                cnpj: cnpjProcurado.Cnpj,
                                mensagensNaoLidas
                            })
                        } else {
                            console.log(`CNPJ ${cnpjProcurado.Cnpj} sem mensagens não lidas.`);
                        }
                        const servicoAutorizado = await detService.authorizedService(cnpjProcurado.Cnpj);

                        const caixaPostal = await detService.mailBox(cnpjProcurado.Cnpj, )

                        resultados.push({
                            cnpj: cnpjProcurado.Cnpj,
                            status: "Com procuração",
                            servicosHabilitados,
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
                    console.log("Aguardando 30 segundos para processar o próximo lote...");
                    await sleep(delay);
                }
            }


            if (mensagensNaoLidasResumo.length > 0) {
                console.log("\n===== RESUMO DAS MENSAGENS NÃO LIDAS =====");
                console.log(mensagensNaoLidasResumo);
            } else {
                console.log("Nenhuma mensagem não lida encontrada nos CNPJs processados.");
            }

            console.log("\n===== RESUMO FINAL =====");
            console.log(`Total de CNPJs com procuração: ${cnpjsComProcuracao.length}`);
            console.log(`Total de CNPJs com mensagens novas: ${cnpjsComMensagens.length}`);
            console.log("CNPJs que possuem mensagens novas:");
            console.log(cnpjsComMensagens);


            return reply.send({
                message: "Resultados da verificação para os CNPJs processados:",
                totalComProcuracao: cnpjsComProcuracao.length,
                totalComMensagens: cnpjsComMensagens.length,
                cnpjsComMensagens,
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