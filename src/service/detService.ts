import axios from "axios";
import { AppdataSource } from "../db/data-source";
import { Enterprise } from "../entities/CnpjMatriz";
import { formatarCnpj, limparCNPJ } from "./cnpjFormatado";



export class DetService {
    private apiUrl = process.env.BASE_URL;
    private certificadoCnpj = '34331182000103';

    private async getCnpjsFromDatabase(): Promise<Enterprise[]> {
        const cnpjRepository = await AppdataSource.getRepository(Enterprise);
        return await cnpjRepository.find();
    }


    constructor(private bearerToken: string) { }

    async start(): Promise<void> {
        try {
            console.log('Iniciando DetService...');

            const cnpjsProcurados = await this.getCnpjsFromDatabase();

            if (cnpjsProcurados.length === 0) {
                console.log('Nenhum CNPJ encontrado no banco de dados.');
                return;
            }

            await this.selecionarPerfil();

            for (const cnpjProcurado of cnpjsProcurados) {
                console.log(`Processando CNPJ Procurado: ${cnpjProcurado.Cnpj}`);


                const existeProcuracao = await this.existeProcuracao(cnpjProcurado.Cnpj);
                if (!existeProcuracao) {
                    console.log(`Não existe procuração para o CNPJ ${cnpjProcurado.Cnpj}. Pulando...`);
                    continue; // Se não houver procuração, pula para o próximo CNPJ
                }

                const verificarService = await this.serviceCnpj(cnpjProcurado.Cnpj);
                if (!verificarService) {
                    console.log(`Nenhuma consulta encontrada para o CNPJ ${cnpjProcurado.Cnpj}. Pulando...`);
                    continue;
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
                },
                data,
                maxRedirects: 0,
            });

            console.log(`Resposta bruta da API ${url}`, response.data)


            if (typeof response.data !== 'object') {
                throw new Error(`Resposta inesperada da API: Não é JSON válido`);
             }

            console.log(`Resposta da rota ${url}:`, response.data);

            const newToken = response.headers['set-token'];
            if (newToken && newToken !== this.bearerToken) {
                this.bearerToken = newToken;
                console.log('Novo Bearer Token capturado:', newToken);
            }

            return response.data;
        } catch (error) {
            console.error(`Erro na requisição para ${url}:`, error.response?.data || error.message);
            throw error;
        }
    }

    async selecionarPerfil() {
        console.log(`Selecionando perfil de Procurador para o CNPJ do certificado: ${this.certificadoCnpj}...`);
        return await this.makeRequest('GET', `/services/v1/empregadores/${this.certificadoCnpj}/cadastrado`, { perfil: 'Procurador' });
    }


// Verifica se existe procuração para o CNPJ procurado
    async existeProcuracao(cnpjProcurado: string): Promise<boolean> {
       try {
         console.log(`Verificando se existe procuração para o CNPJ: ${cnpjProcurado}...`);
         const response = await this.makeRequest('GET', `/services/v1/procuracoes/existe/${cnpjProcurado}`);
 
         if (response && typeof response.exists !== "undefined") {
             return response.exists === true
         } else {
             console.warn(`Resposta inesperada ao verificar procuração para CNPJ ${cnpjProcurado}:`, response);
             return false;
         }
        
       } catch (error) {
              console.error(`Erro ao verificar procuração para o CNPJ ${cnpjProcurado}:`, error.message);
              return false;
       }
    }


// Verifia se os serviços estão habilitados para o CNPJ procurado (Retorna para ambos os CNPJ's)
    async servicosHabilitados(cnpjProcurado: Enterprise) {
        console.log(`Verificando serviços habilitados para o CNPJ procurado: ${cnpjProcurado.Cnpj}...`);

        const cnpjFormatado = limparCNPJ(cnpjProcurado.Cnpj);

        const servicosHabilitados = await this.makeRequest(
            'GET',
            `/services/v1/procuracoes/servicos-habilitados/${this.certificadoCnpj}/${cnpjFormatado}`
        );

        if (servicosHabilitados && servicosHabilitados.length > 0) {
            console.log(`Serviços habilitados encontrados para o CNPJ ${cnpjFormatado}:`, servicosHabilitados);
            return servicosHabilitados;
        } else {
            console.log(`Nenhum serviço habilitado encontrado para o CNPJ ${cnpjFormatado}.`);
            return [];
        }
    }


// Retorna os dados da consulta para o CNPJ procurado, em referência a empresa (Retorna apenas para os CNPJ's que não possuem procuração)
    async serviceCnpj(cnpjProcurado: string) {
        const cnpjConsulta = formatarCnpj(cnpjProcurado);
        console.log(`Verificando consulta para o CNPJ: ${cnpjConsulta}...`);


        const url = `/services/v1/cnpj/${cnpjConsulta}`;
        const response = await this.makeRequest('GET', url);

        if (response && response.length === 11) {
            const camposObrigatorios = [
                "cnpj",
                "nomeEmpresarial",
                "cpfResponsavel",
                "logradouro",
                "numero",
                "complemento",
                "bairro",
                "municipio",
                "cep",
                "uf",
                "emailRfb",
                "telefoneRfb"
            ]

            const camposFaltantes = camposObrigatorios.filter(campo => !response[campo]);
            if (camposFaltantes.length > 0) {
                console.error(`Campos obrigatórios não preenchidos: ${camposFaltantes.join(', ')}`);
                return null
            }

            console.log(`Consulta encontrada para o CNPJ ${cnpjConsulta}:`, response);
            return response;
        }

    }


// Rota retornada para exibir erros de mensagens (Retorna apenas para os CNPJ's que não possuem procuração)
    async messages(cnpjProcurado: string) {
        const avisosCnpj = formatarCnpj(cnpjProcurado);
        console.log(`Verificando avisos para o CNPJ: ${avisosCnpj}...`);

        const url = `services/v1/messages`;
        const response = await this.makeRequest('GET', url);

        if (response && Array.isArray(response)) {
            const avisoProcuracao = response.find((aviso) => aviso.key === "perfil.inscricaoSemProcuracao");

            if (avisoProcuracao) {
                console.log(`Aviso: ${avisoProcuracao.text}`);
                return;
            }
        }
    }


// Caso o CNPJ contenha um certificado válido, e a procuração esteja realizada, o método consultaCompleta é chamado (Retorna apenas para os CNPJ's que possuem procuração)
    async consultaCompleta(cnpjProcurado: string) {
        const tipoConsulta = formatarCnpj(cnpjProcurado);
        console.log(`Verificando consulta completa para o CNPJ: ${tipoConsulta}...`);

        const url = `/services/v1/empregadores/${tipoConsulta}?tipoConsulta=completa`;
        const response = await this.makeRequest('GET', url);

        if (response && Array.isArray(response)) {
            const arrayResponse = response.find((cadastro) => cadastro.ni === tipoConsulta);

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
                }
                console.log(`Consulta completa encontrada para o CNPJ ${tipoConsulta}:`, response);

                const contato = arrayResponse.contatos.length > 0 ? arrayResponse.contatos : [
                    {
                        nome: "KRS Calculo",
                        email: "det.cyrela@krscalculos.com.br",
                        telefone: "1129672888"
                    }
                ];
                console.log("Contato preenchido: ", contato);

                return { dadosConsulta, contato };
            } else {
                console.log(`CNPJ ${tipoConsulta} não encontrado na resposta.`);
            }
        } else {
            console.log("Resposta não contem dados válidos");
        }

    }


// Cadastra o empregador, e a partir disso é possível verificar se o CNPJ está cadastrado, após a finalização da consulta (Retorna apenas para os CNPJ's que possuem procuração)
    async cadastroEmpregador(cnpjProcurado: string) {
        const cnpjEmpregador = formatarCnpj(cnpjProcurado);
        console.log(`Verificando cadastro de empregador para o CNPJ: ${cnpjEmpregador}...`);

        const url = `/services/v1/empregadores/${cnpjProcurado}/cadastrado`;
        const response = await this.makeRequest('GET', url);

        if (response && response.cadastrado === true) {
            console.log(`Empregador cadastrado para o CNPJ ${cnpjEmpregador}.`);
            return response;
        } else {
            console.log(`Empregador não cadastrado para o CNPJ ${cnpjEmpregador}.`);
            return null;
        }
    }

// Verifica se há mensagens não lidas na caixa postal do empregador (Retorna para ambos os CNPJ's)
    async mensagensNaoLidas(cnpjProcurado: string) {
        const cnpjFormatado = formatarCnpj(cnpjProcurado);
        console.log(`Verificando mensagens não lidas para o CNPJ: ${cnpjFormatado}...`);

        const url = `/services/v1/caixapostal/${cnpjFormatado}/nao-lidas`;
        const response = await this.makeRequest('GET', url);

        if (response && response.quantidade > 0) {
            console.log(`Aviso: O CNPJ: ${cnpjFormatado} tem ${response.quantidade} mensagens não lidas.`);
        } else {
            console.log(`Nenhuma nova mensagem para o CNPJ: ${cnpjFormatado}.`);
            return { quantidade: 0 }
        }
    }


// Serviços Autorizados, é o acesso da caixa postal do empregador. Sendo true, o acesso retorna a rota da caixa postal (Retorna apenas para os CNPJ's que possuem procuração)
    async servicosAutorizados(cnpjProcurado: string) {
        const cnpjCertificado = this.certificadoCnpj
        const autorizados = formatarCnpj(cnpjProcurado);
        console.log(`Verificando serviços autorizados para o CNPJ: ${autorizados}...`);

        const url = `/services/v1/procuracoes/servicos-autorizados/${cnpjCertificado}/${autorizados}/DET003`;
        const response = await this.makeRequest('GET', url);

        if (response === 'true') {
            console.log(`Serviços autorizados para o CNPJ: ${cnpjProcurado}`);
            return response;
        } else {
            console.log(`Nenhum serviço autorizado encontrado para o CNPJ: ${cnpjProcurado}`);
            return null;
        }
    }

// Caixa postal retorna as mensagens recebidas para o empregador (Retorna apenas para os CNPJ's que possuem procuração)
async caixaPostal(cnpjProcurado: string) {
    const caixaPostalCnpj = formatarCnpj(cnpjProcurado);
    console.log(`Verificando caixa postal para o CNPJ: ${caixaPostalCnpj}...`);

    const url = `/services/v1/caixapostal/${caixaPostalCnpj}`;
    const response = await this.makeRequest('GET', url);

    if (response && response.resultado === 'null') {
        console.log(`Nenhuma mensagem encontrada para o CNPJ ${caixaPostalCnpj}.`);
        return null;
    }

    // Caso haja mensagem, retorna a estrutura conforme solicitado
    if (response && Array.isArray(response.resultado)) {
        const mensagens = response.resultado.map((mensagem: any) => ({
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

        console.log(`Mensagens encontradas para o CNPJ ${caixaPostalCnpj}:`, mensagens);
        return mensagens;
    } else {
        console.log("Resposta não contém mensagens válidas.");
        return null;
    }
}

}
