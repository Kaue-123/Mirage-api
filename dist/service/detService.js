"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetService = void 0;
const axios_1 = __importDefault(require("axios"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const data_source_1 = require("../db/data-source");
const Enterprises_1 = require("../entities/Enterprises");
const cnpjFormatado_1 = require("./cnpjFormatado");
const ContentMessages_1 = require("../entities/ContentMessages");
class DetService {
    bearerToken;
    apiUrl = process.env.BASE_URL;
    certificadoCnpj = '34331182000103';
    async getCnpjsFromDatabase() {
        const cnpjRepository = await data_source_1.AppdataSource.getRepository(Enterprises_1.Enterprise);
        return await cnpjRepository.find();
    }
    PerfilProcuracao = null;
    NiOutorgante = null;
    constructor(bearerToken) {
        this.bearerToken = bearerToken;
    }
    getBearerToken() {
        return this.bearerToken;
    }
    setBearerToken(newToken) {
        console.log(`🔄 Atualizando Bearer Token: ${this.bearerToken} /\ ${newToken}`);
        this.bearerToken = newToken;
    }
    async start() {
        try {
            console.log('Iniciando DetService...');
            const cnpjsProcurados = await this.getCnpjsFromDatabase();
            if (cnpjsProcurados.length === 0) {
                console.log('Nenhum CNPJ encontrado no banco de dados.');
                return;
            }
            for (const cnpjProcurado of cnpjsProcurados) {
                console.log(`Processando CNPJ Procurado: ${cnpjProcurado.Cnpj}`);
                this.NiOutorgante = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado.Cnpj);
                await this.verificarCadastro(cnpjProcurado.Cnpj);
                const servicosHabilitados = await this.servicosHabilitados(cnpjProcurado);
                if (!servicosHabilitados) {
                    console.log(`Nenhum serviço habilitado encontrado para o CNPJ ${cnpjProcurado.Cnpj}. Pulando...`);
                    continue;
                }
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
                    ...(this.NiOutorgante && { 'NiOutorgante': this.NiOutorgante }),
                    ...(this.PerfilProcuracao && { 'PerfilProcuracao': this.PerfilProcuracao }),
                },
                data,
            });
            const contentType = response.headers['content-Type'];
            if (typeof contentType === 'string' && !contentType.includes('application/json')) {
                throw new Error(`Resposta inesperada da API: Não é JSON. Tipo: ${contentType}`);
            }
            if (response.status === 204) {
                console.warn(`API retornou 204 No Content para ${url}`);
                return [];
            }
            const newToken = response.headers['set-token'];
            if (newToken && newToken !== this.bearerToken) {
                this.setBearerToken(newToken);
            }
            return response.data;
        }
        catch (error) {
            if (error.response) {
                console.error(`Erro na requisição para ${url}:`, {
                    status: error.response.status,
                    data: error.response.data || error.message,
                });
            }
            else {
                console.error(`Erro ao fazer a requisição para ${url}:`, error.message);
            }
            throw error;
        }
    }
    // Verifia se os serviços estão habilitados para o CNPJ procurado (Retorna para ambos os CNPJ's)
    async servicosHabilitados(cnpjProcurado) {
        console.log(`Verificando serviços habilitados para o CNPJ procurado: ${cnpjProcurado.Cnpj}...`);
        const cnpjFormatado = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado.Cnpj);
        const servicosHabilitados = await this.makeRequest('GET', `/services/v1/procuracoes/servicos-habilitados/${this.certificadoCnpj}/${cnpjFormatado}`);
        if (servicosHabilitados && servicosHabilitados.length > 0) {
            console.log(`Serviços habilitados encontrados para o CNPJ ${cnpjFormatado}:`, servicosHabilitados);
            if (servicosHabilitados.token) {
                this.setBearerToken(servicosHabilitados.token);
                console.log(`Novo Bearer Token capturado e armazenado: ${this.bearerToken}`);
            }
            return servicosHabilitados;
        }
        else {
            console.log(`Nenhum serviço habilitado encontrado para o CNPJ ${cnpjFormatado}.`);
            return [];
        }
    }
    async verificarCadastro(cnpjProcurado) {
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        console.log(`Verificando cadastro do CNPJ: ${cnpjEmpregador}...`);
        this.PerfilProcuracao = "3";
        this.NiOutorgante = cnpjEmpregador;
        const url = `/services/v1/empregadores/${cnpjEmpregador}/cadastrado`;
        const response = await this.makeRequest('GET', url);
        console.log('Resposta da requisição:', response);
        if (!response || response === false || response === 'false' || response?.cadastro === false) {
            console.log(`CNPJ ${cnpjEmpregador} não cadastrado. Tentando cadastrar...`);
            const cadastroResponse = await this.empregadores(cnpjEmpregador);
            if (cadastroResponse) {
                console.log(`Parâmetros fixos: PerfilProcuracao=${this.PerfilProcuracao}, NiOutorgante=${this.NiOutorgante}`);
                return {
                    NiOutorgante: this.NiOutorgante,
                    PerfilProcuracao: this.PerfilProcuracao
                };
            }
            else {
                console.log("Erro ao cadastrar CNPJ");
                return { error: "Erro ao cadastrar CNPJ" };
            }
        }
        else {
            console.log(`CNPJ ${cnpjEmpregador} já cadastrado.`);
            console.log(`Parâmetros fixos: PerfilProcuracao=${this.PerfilProcuracao}, NiOutorgante=${this.NiOutorgante}`);
            return {
                NiOutorgante: this.NiOutorgante,
                PerfilProcuracao: this.PerfilProcuracao
            };
        }
    }
    async empregadores(cnpjProcurado) {
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        console.log(`Cadastrando empresa para o CNPJ: ${cnpjEmpregador}...`);
        const data = {
            tipoNI: 0,
            ni: cnpjEmpregador,
            PerfilProcuracao: 3,
            origemCadastro: 0,
            enviarMensagemResponsavel: false,
            palavraChave: "JEITO CYRELA DE SER",
            contatos: [
                {
                    nome: "KRS Calculo",
                    email: "det.cyrela@krscalculos.com.br",
                    origemCadastro: 0,
                    telefone: "1129672888",
                }
            ]
        };
        const url = `/services/v1/empregadores`;
        try {
            const response = await this.makeRequest('POST', url, data);
            if (response && typeof response === 'object' && Object.keys(response).length > 0) {
                console.log(`Empresa cadastrada com sucesso para o CNPJ ${cnpjEmpregador}:`, response);
                if (response.ni === cnpjEmpregador) {
                    console.log("Confirmação: O CNPJ cadastrado no DET corresponde ao enviado.");
                }
                else {
                    console.warn("Aviso: O CNPJ retornado pela API não bate com o enviado.");
                }
                return response;
            }
            else {
                console.log(`Erro ao cadastrar o CNPJ ${cnpjEmpregador}.`);
                return null;
            }
        }
        catch (error) {
            console.error(`Erro ao tentar cadastrar o CNPJ ${cnpjEmpregador}:`, error);
            return null;
        }
    }
    // Verifica se há mensagens não lidas na caixa postal do empregador (Retorna para ambos os CNPJ's)
    async mensagensNaoLidas(cnpjProcurado) {
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        console.log(`Verificando mensagens não lidas para o CNPJ: ${cnpjEmpregador}...`);
        const url = `/services/v1/caixapostal/${cnpjEmpregador}/nao-lidas`;
        const response = await this.makeRequest('GET', url);
        const quantidadeMensagem = typeof response === "number" ? response : response?.quantidade || 0;
        console.log("Resposta da requisição:", quantidadeMensagem);
        if (quantidadeMensagem > 0) {
            console.log(`Aviso: O CNPJ: ${cnpjEmpregador} tem ${quantidadeMensagem} mensagens não lidas.`);
            await this.atualizarCaixaPostal(cnpjEmpregador, "S");
        }
        else {
            console.log(`Nenhuma nova mensagem para o CNPJ: ${cnpjEmpregador}.`);
            await this.atualizarCaixaPostal(cnpjEmpregador, "N");
        }
        return { quantidade: quantidadeMensagem };
    }
    // Serviços Autorizados, é o acesso da caixa postal do empregador. Sendo true, o acesso retorna a rota da caixa postal (Retorna apenas para os CNPJ's que possuem procuração)
    async servicosAutorizados(cnpjProcurado) {
        const cnpjCertificado = this.certificadoCnpj;
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        const url = `/services/v1/procuracoes/servico-autorizado/${cnpjCertificado}/${cnpjEmpregador}/DET0003`;
        const response = await this.makeRequest('GET', url);
        if (response === true || response === 'true') {
            console.log(`Caixa postal acessada para o CNPJ: ${cnpjProcurado}`);
            return response;
        }
        else {
            console.log(`Sem acesso a caixa postal para o CNPJ: ${cnpjProcurado}`);
            return null;
        }
    }
    async caixaPostal(cnpjProcurado) {
        const cnpjEmpregador = (0, cnpjFormatado_1.limparCNPJ)(cnpjProcurado);
        console.log(`Consultando caixa postal do CNPJ: ${cnpjEmpregador}...`);
        const url = `/services/v1/caixapostal/${cnpjEmpregador}`;
        const response = await this.makeRequest("GET", url, cnpjProcurado);
        if (!response) {
            console.warn(`Nenhuma resposta válida para o CNPJ ${cnpjEmpregador}.`);
            return null;
        }
        if (!Array.isArray(response)) {
            console.error(`Erro: resposta inesperada da API para o CNPJ: ${cnpjEmpregador}`, response);
            return null;
        }
        console.log("Resposta bruta da API:", JSON.stringify(response, null, 2));
        const numeroMensagens = response.length;
        console.log(`Foram encontradas ${numeroMensagens} mensagens para o CNPJ: ${cnpjEmpregador}. Armazenando...`);
        return await this.saveMessagesToDatabase(cnpjEmpregador, response);
    }
    async atualizarCaixaPostal(cnpj, status) {
        await data_source_1.AppdataSource.getRepository(Enterprises_1.Enterprise)
            .createQueryBuilder()
            .update("enterprise")
            .set({ Caixa_Postal: status })
            .where("CNPJ = :cnpj", { cnpj })
            .execute();
        console.log(`Caixa_Postal atualizado para '${status}' no CNPJ: ${cnpj}`);
    }
    async saveMessagesToDatabase(cnpj, mensagens) {
        const messageRepository = data_source_1.AppdataSource.getRepository(ContentMessages_1.ContentMessages);
        const messagesToSave = mensagens.map((msg) => {
            const message = new ContentMessages_1.ContentMessages();
            message.uid = msg.uid || null;
            message.ni = cnpj;
            message.titulo = msg.titulo || null;
            const sanitizedText = (0, sanitize_html_1.default)(msg.conteudo || "Sem conteúdo disponível", {
                allowedTags: [],
                allowedAttributes: {
                    a: ['href'], // Permitir apenas 'href' nos links
                },
            });
            message.texto = sanitizedText || "Sem conteúdo disponível";
            message.remetente = msg.remetente || "Desconhecido";
            message.tipo = msg.tipo || null;
            message.situacao = msg.situacao || null;
            message.arquivada = msg.arquivada || null;
            message.dataHoraLeitura = new Date(msg.dataEnvio || Date.now());
            message.dataHoraCriacao = new Date(msg.dataEnvio || Date.now());
            message.dataHoraLeituraDeCursoPrazo = new Date(msg.dataEnvio || Date.now());
            message.codigoNotificacao = msg.codigoNotificacao || null;
            message.statusNotificacao = msg.statusNotificacao || null;
            message.sistemaOrigem = msg.sistemaOrigem || null;
            return message;
        });
        await messageRepository.save(messagesToSave);
        console.log(`Mensagens armazenadas no banco para o CNPJ: ${cnpj}`);
        return messagesToSave;
    }
}
exports.DetService = DetService;
//# sourceMappingURL=detService.js.map