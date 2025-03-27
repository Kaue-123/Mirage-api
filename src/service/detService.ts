import axios from "axios";
import sanitizeHtml from 'sanitize-html';
import { AppdataSource } from "../db/data-source";
import { Enterprise } from "../entities/Enterprises";
import { cleanCNPJ } from "./replaceCNPJ/cnpjFormatado";
import { ContentMessages } from "../entities/ContentMessages";
import { Notifications } from "../entities/Notifications";



export class DetService {
    private apiUrl = process.env.BASE_URL;
    private certificadoCnpj = '34331182000103';

    private async getCnpjsFromDatabase(): Promise<Enterprise[]> {
        const cnpjRepository = await AppdataSource.getRepository(Enterprise);
        return await cnpjRepository.find();
    }

    private PerfilProcuracao: string | null = null
    private NiOutorgante: string | null = null

    constructor(private bearerToken: string) { }
    getBearerToken() {
        return this.bearerToken;
    }


    setBearerToken(newToken: string) {
        console.log(`Atualizando Bearer Token: ${newToken}`);
        this.bearerToken = newToken;
    }

    async start(): Promise<void> {
        try {
            console.log('Iniciando DetService...');

            const cnpjsProcurados = await this.getCnpjsFromDatabase();

            if (cnpjsProcurados.length === 0) {
                console.log('Nenhum CNPJ encontrado no banco de dados.');
                return;
            }
            for (const cnpjProcurado of cnpjsProcurados) {
                console.log(`Processando CNPJ Procurado: ${cnpjProcurado.Cnpj}`);


                this.NiOutorgante = cleanCNPJ(cnpjProcurado.Cnpj)

                await this.checkRegistration(cnpjProcurado.Cnpj);


                const servicosHabilitados = await this.enableServices(cnpjProcurado);
                if (!servicosHabilitados) {
                    console.log(`Nenhum serviço habilitado encontrado para o CNPJ ${cnpjProcurado.Cnpj}. Pulando...`);
                    continue;
                }
                await this.unreadsMessages(cnpjProcurado.Cnpj);
                console.log(`Processamento finalizado para o CNPJ Procurado: ${cnpjProcurado.Cnpj}`);
            }
        } catch (error) {
            console.error('Erro no DetService:', error);
        }
    }



    private async makeRequest(method: 'GET' | 'POST', url: string, data: any = null) {
        try {
            const response = await axios({
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

        } catch (error) {
            if (error.response) {
                console.error(`Erro na requisição para ${url}:`, {
                    status: error.response.status,
                    data: error.response.data || error.message,
                })
            } else {
                console.error(`Erro ao fazer a requisição para ${url}:`, error.message);
            }
            throw error;
        }
    }

    // Verifia se os serviços estão habilitados para o CNPJ procurado (Retorna para ambos os CNPJ's)
    async enableServices(cnpjProcurado: Enterprise) {
        console.log(`Verificando serviços habilitados para o CNPJ procurado: ${cnpjProcurado.Cnpj}...`);

        const cnpjFormatado = cleanCNPJ(cnpjProcurado.Cnpj);

        const servicosHabilitados = await this.makeRequest(
            'GET',
            `/services/v1/procuracoes/servicos-habilitados/${this.certificadoCnpj}/${cnpjFormatado}`
        );

        if (servicosHabilitados && servicosHabilitados.length > 0) {
            console.log(`Serviços habilitados encontrados para o CNPJ ${cnpjFormatado}:`, servicosHabilitados);

            if (servicosHabilitados.token) {
                this.setBearerToken(servicosHabilitados.token)
                console.log(`Novo Bearer Token capturado e armazenado: ${this.bearerToken}`)
            }
            return servicosHabilitados;
        } else {
            console.log(`Nenhum serviço habilitado encontrado para o CNPJ ${cnpjFormatado}.`);
            return [];
        }
    }

    async checkRegistration(cnpjProcurado: string) {
        const cnpjEmpregador = cleanCNPJ(cnpjProcurado);
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
            } else {
                console.log("Erro ao cadastrar CNPJ");
                return { error: "Erro ao cadastrar CNPJ" };
            }
        } else {

            console.log(`CNPJ ${cnpjEmpregador} já cadastrado.`);
            console.log(`Parâmetros fixos: PerfilProcuracao=${this.PerfilProcuracao}, NiOutorgante=${this.NiOutorgante}`);
            return {
                NiOutorgante: this.NiOutorgante,
                PerfilProcuracao: this.PerfilProcuracao
            };
        }
    }




    async empregadores(cnpjProcurado: string) {
        const cnpjEmpregador = cleanCNPJ(cnpjProcurado);
        console.log(`Cadastrando empresa para o CNPJ: ${cnpjEmpregador}...`);


        const data = {
            tipoNI: 0,
            ni: cnpjEmpregador,
            PerfilProcuracao: 3,
            origemCadastro: 0,
            enviarMensagemResponsavel: false,
            palavraChave: "JEITO CYRELA DE SER",
            contatos: [  // Array de contatos dentro do objeto principal
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
                } else {
                    console.warn("Aviso: O CNPJ retornado pela API não bate com o enviado.");
                }

                return response;
            } else {
                console.log(`Erro ao cadastrar o CNPJ ${cnpjEmpregador}.`);
                return null;
            }
        } catch (error) {
            console.error(`Erro ao tentar cadastrar o CNPJ ${cnpjEmpregador}:`, error);
            return null;
        }
    }

    // Verifica se há mensagens não lidas na caixa postal do empregador (Retorna para ambos os CNPJ's)
    async unreadsMessages(cnpjProcurado: string) {
        const cnpjEmpregador = cleanCNPJ(cnpjProcurado);
        console.log(`Verificando mensagens não lidas para o CNPJ: ${cnpjEmpregador}...`);

        const url = `/services/v1/caixapostal/${cnpjEmpregador}/nao-lidas`;
        const response = await this.makeRequest('GET', url);


        const quantidadeMensagem = typeof response === "number" ? response : response?.quantidade || 0
        console.log("Resposta da requisição:", quantidadeMensagem);

        if (quantidadeMensagem > 0) {
            console.log(`Aviso: O CNPJ: ${cnpjEmpregador} tem ${quantidadeMensagem} mensagens não lidas.`);


            await this.updateMailBox(cnpjEmpregador, "S");
        } else {
            console.log(`Nenhuma nova mensagem para o CNPJ: ${cnpjEmpregador}.`);


            await this.updateMailBox(cnpjEmpregador, "N");
        }

        return { quantidade: quantidadeMensagem };
    }


    // Serviços Autorizados, é o acesso da caixa postal do empregador. Sendo true, o acesso retorna a rota da caixa postal (Retorna apenas para os CNPJ's que possuem procuração)
    async authorizedService(cnpjProcurado: string) {
        const cnpjCertificado = this.certificadoCnpj
        const cnpjEmpregador = cleanCNPJ(cnpjProcurado);


        const url = `/services/v1/procuracoes/servico-autorizado/${cnpjCertificado}/${cnpjEmpregador}/DET0003`;

        const response = await this.makeRequest('GET', url);


        if (response === true || response === 'true') {
            console.log(`Caixa postal acessada para o CNPJ: ${cnpjProcurado}`);
            return response;
        } else {
            console.log(`Sem acesso a caixa postal para o CNPJ: ${cnpjProcurado}`);
            return null;
        }
    }




    async mailBox(cnpjProcurado: string) {
        const cnpjEmpregador = cleanCNPJ(cnpjProcurado);
        console.log(`Consultando caixa postal do CNPJ: ${cnpjEmpregador}...`);


        const url = `/services/v1/caixapostal/${cnpjEmpregador}`;
        const response = await this.makeRequest("GET", url, cnpjProcurado);

        if (!response) {
            console.warn(`Nenhuma resposta válida para o CNPJ ${cnpjEmpregador}.`);
            return null;
        }

        if (!Array.isArray(response)) {
            console.error(`Erro: resposta inesperada da API para o CNPJ: ${cnpjEmpregador}`, response)
            return null
        }

        console.log("Resposta bruta da API:", JSON.stringify(response, null, 2));


        const numeroMensagens = response.length
        console.log(`Foram encontradas ${numeroMensagens} mensagens para o CNPJ: ${cnpjEmpregador}. Armazenando...`)
        return await this.saveMessagesToDatabase(cnpjEmpregador, response);
    }


     async notifications(cnpjProcurado: string) {
         const cnpjEmpregador = cleanCNPJ(cnpjProcurado)
         console.log(`Consultando notificações do CNPJ: ${cnpjEmpregador}...`);

         const url = `services/empregador/v1/notificacoes?tipoNi=0&ni=${cnpjEmpregador}`
         const response = await this.makeRequest('GET', url, cnpjProcurado)

         if (!response) {
             console.warn(`Acesso inválido para rota de notificações do CNPj: ${cnpjEmpregador}`)
             return null;
         }

         if (!Array.isArray(response)) {
             console.error(`Erro: resposta inesperada da API para o CNPJ: ${cnpjEmpregador}`, response)
             return null
         }

         const numeroNotificacoes = response.length
         console.log(`Foram encontradas ${numeroNotificacoes} notificações para o CNPJ: ${cnpjEmpregador}. Armazenando...`)
         return await this.saveNotificacoesToDatabase(cnpjEmpregador, response)
     }


    async updateMailBox(cnpj: string, status: "S" | "N") {
        await AppdataSource.getRepository(Enterprise)
            .createQueryBuilder()
            .update("enterprise")
            .set(
                { Caixa_Postal: status }
            )
            .where("CNPJ = :cnpj",
                { cnpj }
            )
            .execute();

        console.log(`Caixa_Postal atualizado para '${status}' no CNPJ: ${cnpj}`);
    }


    private cleanTextContent = (html: string) => {
        let sanitizedText = sanitizeHtml(html, {
            allowedTags: ['b', 'i', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'strong', 'em', ''],
            allowedAttributes: {
                a: ['href', 'name', 'target'],
                '*': ['style'],
            },
            disallowedTagsMode: ' ',
            allowedSchemes: ['http', 'https']
        });

        sanitizedText = sanitizedText.replace(/\n/g, '<br>');
        sanitizedText = sanitizedText.replace(/[\n\t\r]+/g, ' ');
        sanitizedText = sanitizedText.replace(/\s+/g, ' ').trim();

        return sanitizedText;
    };

    private async saveMessagesToDatabase(cnpj: string, mensagens: any[]) {
        const messageRepository = AppdataSource.getRepository(ContentMessages);

        const messagesToSave = mensagens.map((msg) => {
            const message = new ContentMessages();
            message.uid = msg.uid || null
            message.ni = cnpj;
            message.titulo = msg.titulo || null

            // const sanitizedText = this.cleanTextContent(msg.texto || "Sem conteúdo disponível");
            message.texto = this.cleanTextContent(msg.texto || "Sem conteudo disponivel")


            message.remetente = msg.remetente || "Desconhecido"
            message.tipo = msg.tipo || null
            message.situacao = msg.situacao || null
            message.arquivada = msg.arquivada || null
            message.dataHoraLeitura = new Date(msg.dataEnvio || Date.now());
            message.dataHoraCriacao = new Date(msg.dataEnvio || Date.now());
            message.dataHoraLeituraDeCursoPrazo = new Date(msg.dataEnvio || Date.now());
            message.codigoNotificacao = msg.codigoNotificacao || null
            message.statusNotificacao = msg.statusNotificacao || null
            message.sistemaOrigem = msg.sistemaOrigem || null
            return message;
        });

        await messageRepository.save(messagesToSave);
        console.log(`Mensagens armazenadas no banco para o CNPJ: ${cnpj}`);
        return messagesToSave;
    }

    private async saveNotificacoesToDatabase(ni: string, notificacoes: any[]) {
        const notificacoesRepository = AppdataSource.getRepository(Notifications);

        const saveNotifications = notificacoes.map((msg) => {
            const notifications = new Notifications()
            notifications.codigo = msg.codigo
            notifications.ri = msg.ri
            notifications.cpfAuditor = msg.cpfAuditor
            notifications.tipoGeracao = msg.tipoGeracao
            notifications.tipoAbrangencia = msg.tipoAbrangencia
            notifications.titulo = msg.titulo
            notifications.status = msg.status
            notifications.tipoNi = msg.tipoNI
            notifications.ni = msg.ni
            notifications.dataEnvio = msg.dataEnvio
            notifications.estabelecimentos = msg.estabelecimentos
            notifications.enderecos = msg.enderecos
            notifications.contatos = msg.contatos
            notifications.auditores = msg.auditores
            notifications.observacoes = msg.observacoes
            notifications.entregas = msg.entregas
            notifications.itens = msg.itens
            notifications.rascunho = msg.rascunho
            notifications.uid = msg.uid
            notifications.rascunhoArquivoUri = msg.rascunhoArquivoUri
            notifications.dataPrazoEntregaPadrao = msg.dataPrazoEntregaPadrao
            notifications.dataPeriodoInicioPadrao = msg.dataPeriodoInicioPadrao
            notifications.dataPeriodoFimPadrao = msg.dataPeriodoFimPadrao
            notifications.textosInformativosPadraoAtivos = msg.textosInformativosPadraoAtivos
            notifications.itemDataProximaEntrega = msg.itemDataProximaEntrega
            notifications.itemAlertaEmpregador = msg.itemAlertaEmpregador
            notifications.updatedAt = msg.updatedAt
            notifications.clientId = msg.clientId
            notifications.horaPrazoEntregaPadrao = msg.horaPrazoEntregaPadrao
            return notifications
        });
        await notificacoesRepository.save(saveNotifications);
        console.log(`Mensagens armazenadas no banco para o CNPJ: ${ni}`);
        return saveNotifications;
    }
}




