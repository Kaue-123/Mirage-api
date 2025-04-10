"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetController = void 0;
const detService_1 = require("../service/detService");
const data_source_1 = require("../db/data-source");
const Enterprises_1 = require("../entities/Enterprises");
// Função para aguardar um delay em milissegundos
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class DetController {
    static async verificarProcuracao(request, reply) {
        try {
            let bearerToken = request.headers['authorization']?.replace('Bearer ', '');
            if (!bearerToken) {
                return reply.status(401).send({ message: "Token de autenticação não encontrado" });
            }
            const detService = new detService_1.DetService(bearerToken);
            const cnpjsProcurados = await data_source_1.AppdataSource.getRepository(Enterprises_1.Enterprise).find();
            if (cnpjsProcurados.length === 0) {
                return reply.status(404).send({ message: "Nenhum CNPJ encontrado no banco de dados." });
            }
            const resultados = [];
            const cnpjsComProcuracao = [];
            const cnpjsComMensagens = [];
            const cnpjsComNotificacoes = [];
            const cnpjsCadastrados = [];
            const mensagensNaoLidasResumo = [];
            let cnpjProcessados = 0;
            const batchSize = 2300; // Quantidade de CNPJs por lote
            const delay = 30000; // 30 segundos de delay para cada consulta por lote
            // const cnpjJaConsultado = new Set<string>()
            // const downloadContent = new MessageDownloader()
            for (let i = 0; i < cnpjsProcurados.length; i += batchSize) {
                const batch = cnpjsProcurados.slice(i, i + batchSize);
                console.log(`Processando lote de ${batch.length} CNPJs...`);
                for (const cnpjProcurado of batch) {
                    console.log(`Processando CNPJ: ${cnpjProcurado.Cnpj}`);
                    bearerToken = detService.getBearerToken();
                    console.log(`Bearer Token atual: ${bearerToken}`);
                    if (!bearerToken) {
                        return reply.status(401).send({ message: "Token de autenticação não encontrado" });
                    }
                    const servicosHabilitados = await detService.enableServices(cnpjProcurado);
                    if (servicosHabilitados.length === 0) {
                        console.log(`CNPJ ${cnpjProcurado.Cnpj} sem procuração.`);
                        resultados.push({
                            cnpj: cnpjProcurado.Cnpj,
                            status: "Sem procuração",
                        });
                    }
                    else if (servicosHabilitados.length === 5) {
                        console.log(`CNPJ ${cnpjProcurado.Cnpj} com procuração. Seguindo para mensagens não lidas...`);
                        cnpjsComProcuracao.push(cnpjProcurado.Cnpj);
                        const resultadoCadastro = await detService.checkRegistration(cnpjProcurado.Cnpj);
                        if (resultadoCadastro?.error) {
                            console.log(`Erro ao tentar cadastrar CNPJ ${cnpjProcurado.Cnpj}, pulando para o próximo cnpj`);
                            continue;
                        }
                        if (resultadoCadastro?.NiOutorgante) {
                            console.log(`CNPJ ${cnpjProcurado.Cnpj} já estava cadastrado ou foi cadastrado agora.`);
                            cnpjsCadastrados.push(cnpjProcurado.Cnpj);
                        }
                        else {
                            console.log(`Erro no cadastro do CNPJ ${cnpjProcurado.Cnpj}`);
                            continue;
                        }
                        const mensagensNaoLidas = await detService.unreadsMessages(cnpjProcurado.Cnpj);
                        if (mensagensNaoLidas.quantidade > 0) {
                            console.log(`CNPJ ${cnpjProcurado.Cnpj} com mensagens não lidas.`);
                            cnpjsComMensagens.push(cnpjProcurado.Cnpj);
                            mensagensNaoLidasResumo.push({
                                cnpj: cnpjProcurado.Cnpj,
                                mensagensNaoLidas
                            });
                        }
                        else {
                            console.log(`CNPJ ${cnpjProcurado.Cnpj} sem mensagens não lidas.`);
                        }
                        const notificacoes = await detService.notifications(cnpjProcurado.Cnpj);
                        if (!notificacoes) {
                            console.log(`Nenhuma notificação encontrada para o CNPJ ${cnpjProcurado}`);
                        }
                        else if (notificacoes.length > 0) {
                            console.log(`Foram encontradas ${notificacoes.length} notificações`);
                        }
                        const servicoAutorizado = await detService.authorizedService(cnpjProcurado.Cnpj);
                        const caixaPostal = await detService.mailBox(cnpjProcurado.Cnpj);
                        resultados.push({
                            cnpj: cnpjProcurado.Cnpj,
                            status: "Com procuração",
                            servicosHabilitados,
                            mensagensNaoLidas,
                            notificacoes,
                            servicoAutorizado,
                            caixaPostal
                        });
                    }
                    else {
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
            }
            else {
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
        }
        catch (error) {
            console.error("Erro ao verificar procuração e mensagens:", error);
            return reply.status(500).send({
                message: "Erro ao verificar procuração e mensagens não lidas",
                error: error.message
            });
        }
    }
}
exports.DetController = DetController;
//# sourceMappingURL=verificacaoController.js.map