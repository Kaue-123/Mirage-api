"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetService = void 0;
const axios_1 = require("axios");
const data_source_1 = require("../db/data-source");
const CnpjMatriz_1 = require("../entities/CnpjMatriz");
const cnpjFormatado_1 = require("./cnpjFormatado");
class DetService {
    bearerToken;
    apiUrl = process.env.BASE_URL;
    certificadoCnpj = '34331182000103';
    async getCnpjsFromDatabase() {
        const cnpjRepository = await data_source_1.AppdataSource.getRepository(CnpjMatriz_1.Enterprise);
        return await cnpjRepository.find();
    }
    constructor(bearerToken) {
        this.bearerToken = bearerToken;
    }
    async start() {
        try {
            console.log('Iniciando DetService...');
            const cnpjsProcurados = await this.getCnpjsFromDatabase();
            if (cnpjsProcurados.length === 0) {
                console.log('Nenhum CNPJ encontrado no banco de dados.');
                return;
            }
            await this.selectProfile();
            for (const cnpjProcurado of cnpjsProcurados) {
                console.log(`Processando CNPJ Procurado: ${cnpjProcurado.Cnpj}`);
                const existeProcuracao = await this.existeProcuracao(cnpjProcurado.Cnpj);
                if (!existeProcuracao) {
                    console.log(`Não existe procuração para o CNPJ ${cnpjProcurado.Cnpj}. Pulando...`);
                    continue; // Se não houver procuração, pula para o próximo CNPJ
                }
                const servicosHabilitados = await this.servicosHabilitados(cnpjProcurado);
                if (!servicosHabilitados) {
                    console.log(`Nenhum serviço habilitado encontrado para o CNPJ ${cnpjProcurado.Cnpj}. Pulando...`);
                    continue;
                }
                await this.messages(cnpjProcurado.Cnpj);
                await this.mensagensNaoLidas(cnpjProcurado.Cnpj);
                console.log(`Processamento finalizado para o CNPJ Procurado: ${cnpjProcurado.Cnpj}`);
            }
        }
        catch (error) {
            console.error('Erro no DetService:', error);
        }
    }
    async makeRequest(method, url, data = null) {
        try {
            const response = await (0, axios_1.default)({
                method,
                url: `${this.apiUrl}${url}`,
                headers: {
                    Authorization: `Bearer ${this.bearerToken}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                data,
            });
            const contentType = response.headers['Content-Type'];
            if (typeof contentType === 'string' && !contentType.includes('application/json')) {
                throw new Error(`Resposta inesperada da API: Não é JSON. Tipo: ${contentType}`);
            }
            // console.log(`Resposta da rota ${url}:`, response.);
            const newToken = response.headers['set-token'];
            if (newToken && newToken !== this.bearerToken) {
                this.bearerToken = newToken;
            }
            return response.data;
        }
        catch (error) {
            if (error.response) {
                console.error(`Erro na requisição para ${url}:`, error.response.data || error.message);
            }
            else {
                console.error(`Erro ao fazer a requisição para ${url}:`, error.message);
            }
            throw error;
        }
    }
    async selectProfile() {
        console.log(`Selecionando perfil de Procurador para o CNPJ do certificado: ${this.certificadoCnpj}...`);
        return await this.makeRequest('GET', `/services/v1/empregadores/${this.certificadoCnpj}/cadastrado`, { perfil: 'Procurador' });
    }
    // Verifica se existe procuração para o CNPJ procurado
    async existeProcuracao(cnpjProcurado) {
        try {
            console.log(`Verificando se existe procuração para o CNPJ: ${cnpjProcurado}...`);
            const response = await this.makeRequest('GET', `/services/v1/procuracoes/existe/${cnpjProcurado}`);
            if (response && response.exists === true) {
                return true;
            }
            else {
                console.warn(`Resposta inesperada ao verificar procuração para CNPJ ${cnpjProcurado}:`, response);
                return false;
            }
        }
        catch (error) {
            if (error.response?.status === 403) {
                console.error(`Operação não autorizada para o CNPJ ${cnpjProcurado}. Verifique a procuração ou o perfil de acesso.`);
            }
            else {
                console.error(`Erro ao verificar procuração para o CNPJ ${cnpjProcurado}:`, error.message);
            }
            return false;
        }
    }
    // Verifia se os serviços estão habilitados para o CNPJ procurado (Retorna para ambos os CNPJ's)
    async servicosHabilitados(cnpjProcurado) {
        console.log(`Verificando serviços habilitados para o CNPJ procurado: ${cnpjProcurado.Cnpj}...`);
        const cnpjFormatado = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado.Cnpj);
        const servicosHabilitados = await this.makeRequest('GET', `/services/v1/procuracoes/servicos-habilitados/${this.certificadoCnpj}/${cnpjFormatado}`);
        if (servicosHabilitados && servicosHabilitados.length > 0) {
            console.log(`Serviços habilitados encontrados para o CNPJ ${cnpjFormatado}:`, servicosHabilitados);
            return servicosHabilitados;
        }
        else {
            console.log(`Nenhum serviço habilitado encontrado para o CNPJ ${cnpjFormatado}.`);
            return [];
        }
    }
    // Rota retornada para exibir erros de mensagens (Retorna apenas para os CNPJ's que não possuem procuração)
    async messages(cnpjProcurado) {
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        console.log(`Verificando avisos para o CNPJ: ${cnpjEmpregador}...`);
        const url = `/services/v1/messages`;
        const response = await this.makeRequest('GET', url);
        if (response && response.key === "perfil.inscricaoSemProcuracao") {
            console.log(`CNPJ ${cnpjEmpregador} não possui procuração.`);
            console.log(response.key);
            return;
        }
    }
    // Caso o CNPJ contenha um certificado válido, e a procuração esteja realizada, o método consultaCompleta é chamado (Retorna apenas para os CNPJ's que possuem procuração)
    async consultaCompleta(cnpjProcurado) {
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        console.log(`Verificando consulta completa para o CNPJ: ${cnpjEmpregador}...`);
        const url = `/services/v1/empregadores/${cnpjEmpregador}?tipoConsulta=completa`;
        const response = await this.makeRequest('GET', url);
        if (response && Array.isArray(response)) {
            const arrayResponse = response.find((cadastro) => cadastro.ni === cnpjEmpregador);
            if (arrayResponse) {
                const dadosConsulta = {
                    tipoNI: arrayResponse.tipoNI || null,
                    ni: arrayResponse.ni || null,
                    razaoSocial: arrayResponse.razaoSocial || null,
                    palavraChave: arrayResponse.palavraChave || null,
                    origemCadastro: arrayResponse.origemCadastro || null,
                    enviarMensagemResponsavel: arrayResponse.enviarMensagemResponsavel || false,
                    contatos: arrayResponse.contatos || [],
                    emailRfb: arrayResponse.emailRfb || null,
                    telefoneRfb: arrayResponse.telefoneRfb || null,
                };
                console.log(`Consulta completa encontrada para o CNPJ ${cnpjEmpregador}:`, response);
                const contato = arrayResponse.contatos.length > 0 ? arrayResponse.contatos : [
                    {
                        nome: "KRS Calculo",
                        email: "det.cyrela@krscalculos.com.br",
                        telefone: "1129672888"
                    }
                ];
                console.log("Contato preenchido: ", contato);
                return { dadosConsulta, contato };
            }
            else {
                console.log(`CNPJ ${cnpjEmpregador} não encontrado na resposta.`);
            }
        }
        else {
            console.log("Resposta não contem dados válidos");
        }
    }
    // Cadastra o empregador, e a partir disso é possível verificar se o CNPJ está cadastrado, após a finalização da consulta (Retorna apenas para os CNPJ's que possuem procuração)
    async cadastroEmpregador(cnpjProcurado) {
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        console.log(`Verificando cadastro de empregador para o CNPJ: ${cnpjEmpregador}...`);
        const url = `/services/v1/empregadores/${cnpjProcurado}/cadastrado`;
        const response = await this.makeRequest('GET', url);
        if (response && response.cadastrado === true) {
            console.log(`Empregador cadastrado para o CNPJ ${cnpjEmpregador}.`);
            return response;
        }
        else {
            console.log(`Empregador não cadastrado para o CNPJ ${cnpjEmpregador}.`);
            return null;
        }
    }
    // Verifica se há mensagens não lidas na caixa postal do empregador (Retorna para ambos os CNPJ's)
    async mensagensNaoLidas(cnpjProcurado) {
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        console.log(`Verificando mensagens não lidas para o CNPJ: ${cnpjEmpregador}...`);
        const url = `/services/v1/caixapostal/${cnpjEmpregador}/nao-lidas`;
        const response = await this.makeRequest('GET', url);
        if (response && response.quantidade > 0) {
            console.log(`Aviso: O CNPJ: ${cnpjEmpregador} tem ${response.quantidade} mensagens não lidas.`);
        }
        else {
            console.log(`Nenhuma nova mensagem para o CNPJ: ${cnpjEmpregador}.`);
            return { quantidade: 0 };
        }
    }
    // Serviços Autorizados, é o acesso da caixa postal do empregador. Sendo true, o acesso retorna a rota da caixa postal (Retorna apenas para os CNPJ's que possuem procuração)
    async servicosAutorizados(cnpjProcurado) {
        const cnpjCertificado = this.certificadoCnpj;
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        console.log(`Verificando serviços autorizados para o CNPJ: ${cnpjEmpregador}...`);
        const url = `/services/v1/procuracoes/servicos-autorizados/${cnpjCertificado}/${cnpjEmpregador}/DET003`;
        const response = await this.makeRequest('GET', url);
        if (response === 'true') {
            console.log(`Serviços autorizados para o CNPJ: ${cnpjProcurado}`);
            return response;
        }
        else {
            console.log(`Nenhum serviço autorizado encontrado para o CNPJ: ${cnpjProcurado}`);
            return null;
        }
    }
    // Caixa postal retorna as mensagens recebidas para o empregador (Retorna apenas para os CNPJ's que possuem procuração)
    async caixaPostal(cnpjProcurado) {
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        console.log(`Verificando caixa postal para o CNPJ: ${cnpjEmpregador}...`);
        const url = `/services/v1/caixapostal/${cnpjEmpregador}`;
        const response = await this.makeRequest('GET', url);
        if (response && response.resultado === 'null') {
            console.log(`Nenhuma mensagem encontrada para o CNPJ ${cnpjEmpregador}.`);
            return null;
        }
        // Caso haja mensagem, retorna a estrutura conforme solicitado
        if (response && Array.isArray(response.resultado)) {
            const mensagens = response.resultado.map((mensagem) => ({
                ni: mensagem.ni || "",
                tipoNi: mensagem.tipoNi || "",
                titulo: mensagem.titulo || "",
                texto: mensagem.texto || "",
                remetente: mensagem.remetente || "",
                tipo: mensagem.tipo || "",
                arquivada: mensagem.arquivada,
                situacao: mensagem.situacao || "",
                dataHoraLeitura: mensagem.dataHoraLeitura || "",
                dataHoraLeituraDecursoPrazo: mensagem.dataHoraLeituraDecursoPrazo,
                dataHoraCriacao: mensagem.dataHoraCriacao || "",
                codigoNotificacao: mensagem.codigoNotificacao,
                statusNotificacao: mensagem.statusNotificacao,
                uid: mensagem.uid,
                sistemaOrigem: mensagem.sistemaOrigem,
                uidNotificacao: mensagem.uidNotificacao,
                uidAviso: mensagem.uidAviso || null,
            }));
            console.log(`Mensagens encontradas para o CNPJ ${cnpjEmpregador}:`, mensagens);
            return mensagens;
        }
        else {
            console.log("Resposta não contém mensagens válidas.");
            return null;
        }
    }
}
exports.DetService = DetService;
//# sourceMappingURL=detService.js.map