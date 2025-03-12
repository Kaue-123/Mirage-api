import axios from "axios";
import { AppdataSource } from "../db/data-source";
import { Enterprise } from "../entities/CnpjMatriz";
import { timingSafeEqual } from "crypto";


function formatarCnpj(cnpj: string): string {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}


export class DetService {
    private apiUrl = process.env.BASE_URL;
    private certificadoCnpj = '34331182000103';

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

                // Passo 1: Verificar se existe procuração para o CNPJ
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


                const servicosHabilitados = await this.verificarServicosHabilitados(cnpjProcurado);
                if (!servicosHabilitados) {
                    console.log(`Nenhum serviço habilitado encontrado para o CNPJ ${cnpjProcurado.Cnpj}. Pulando...`);
                    continue;
                }

                await this.avisos(cnpjProcurado.Cnpj);

                await this.verificarMensagensNaoLidas(cnpjProcurado.Cnpj);

                console.log(`Processamento finalizado para o CNPJ Procurado: ${cnpjProcurado.Cnpj}`);
            }
        } catch (error) {
            console.error('Erro no DetService:', error);
        }
    }

    private async getCnpjsFromDatabase(): Promise<Enterprise[]> {
        const cnpjRepository = await AppdataSource.getRepository(Enterprise);
        return await cnpjRepository.find();
    }
    
    // private async processarCnpj(cnpjProcurado: Enterprise) {
    //     console.log(`Processando CNPJ: ${cnpjProcurado.Cnpj}`);

    //     const existeProcuracao = await this.existeProcuracao(cnpjProcurado.Cnpj);
    //     if (!existeProcuracao) {
    //         console.log(`Não existe procuração para o CNPJ ${cnpjProcurado.Cnpj}. Pulando...`);
    //         return null;
    //     }

    //     const verificarService = await this.serviceCnpj(cnpjProcurado.Cnpj);
    //     if (!verificarService) {
    //         console.log(`Nenhuma consulta encontrada para o CNPJ ${cnpjProcurado.Cnpj}. Pulando...`);
    //         return null;
    //     }

    //     const servicosHabilitados = await this.verificarServicosHabilitados(cnpjProcurado);
    //     if (!servicosHabilitados) {
    //         console.log(`Nenhum serviço habilitado encontrado para o CNPJ ${cnpjProcurado.Cnpj}. Pulando...`);
    //         return null;
    //     }

    //     await this.avisos(cnpjProcurado.Cnpj);
    //     await this.verificarMensagensNaoLidas(cnpjProcurado.Cnpj);

    //     console.log(`Processamento finalizado para o CNPJ: ${cnpjProcurado.Cnpj}`);

    //     return {
    //         cnpj: cnpjProcurado.Cnpj,
    //         procuracao: existeProcuracao,
    //         service: verificarService,
    //         servicosHabilitados,
    //     };
    // }

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
            });

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

    async existeProcuracao(cnpjProcurado: string): Promise<boolean> {
        console.log(`Verificando se existe procuração para o CNPJ: ${cnpjProcurado}...`);
        const response = await this.makeRequest('GET', `/services/v1/procuracoes/existe/${cnpjProcurado}`);

        // Se a resposta for "true" ou um valor afirmativo, retorna true
        return response && response.exists === true;
    }


    async verificarServicosHabilitados(cnpjProcurado: Enterprise) {
        console.log(`Verificando serviços habilitados para o CNPJ procurado: ${cnpjProcurado.Cnpj}...`);

        const cnpjFormatado = formatarCnpj(cnpjProcurado.Cnpj);

        const servicosHabilitados = await this.makeRequest(
            'GET',
            `/services/v1/procuracoes/servicos-habilitados/${this.certificadoCnpj}/${cnpjFormatado}`
        );

        if (servicosHabilitados && servicosHabilitados.length === 4) {
            console.log(`Serviços habilitados encontrados para o CNPJ ${cnpjFormatado}:`, servicosHabilitados);
            return servicosHabilitados;
        } else {
            console.log(`Nenhum serviço habilitado encontrado para o CNPJ ${cnpjFormatado}.`);
            return null;
        }
    }

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

    async avisos(cnpjProcurado: string) {
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
    async verificarMensagensNaoLidas(cnpjProcurado: string) {
        const cnpjFormatado = formatarCnpj(cnpjProcurado);
        console.log(`Verificando mensagens não lidas para o CNPJ: ${cnpjFormatado}...`);

        const url = `/services/v1/caixapostal/${cnpjFormatado}/nao-lidas`;
        const response = await this.makeRequest('GET', url);

        if (response && response.quantidade > 0) {
            console.log(`Aviso: O CNPJ ${cnpjFormatado} tem ${response.quantidade} mensagens não lidas.`);
        } else {
            console.log(`Nenhuma mensagem não lida para o CNPJ ${cnpjFormatado}.`);
        }

        return response;
    }

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
    async caixaPostal(cnpjProcurado: string) {
        const caixaPostalCnpj = formatarCnpj(cnpjProcurado);
        console.log(`Verificando caixa postal para o CNPJ: ${caixaPostalCnpj}...`);

        const url = `/services/v1/caixapostal/${caixaPostalCnpj}`;
        const response = await this.makeRequest('GET', url);

        if (response && response.resultado === 'null') {
            console.log(`Nenhuma mensagem encontrada para o CNPJ ${caixaPostalCnpj}.`);
            return null;
        }
    }
}
