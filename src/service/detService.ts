import axios from 'axios';
import { config } from 'dotenv';
import { Page } from 'puppeteer';

config();

let cnpjCadastradoPosConsulta = ''

export class DetService {
    private apiUrl = process.env.BASE_URL;
    private certificadoCnpj = '34331182000103'; 

    
    constructor(private bearerToken: string) {}

    async start(page: Page): Promise<void> {
        try {
            console.log('Iniciando DetService...');

            const cnpjsProcurados = ['41.010.228/0001-40', '04.026.328/0001-38'];

            if (cnpjsProcurados.length === 0) {
                console.log('Nenhum CNPJ procurado encontrado.');
                return;
            }

            await this.selecionarPerfil();

            for (const cnpjProcurado of cnpjsProcurados) {
                const cleanCnpjProcurado = cnpjProcurado.replace(/\D/g, ''); 
                console.log(`Processando CNPJ Procurado: ${cleanCnpjProcurado}`);

                await this.verificarServicosHabilitados(cleanCnpjProcurado);
                await this.verificarProcuracao(cleanCnpjProcurado);
                await this.consultarDadosCNPJ(cleanCnpjProcurado);

                console.log(`Processamento finalizado para o CNPJ Procurado: ${cleanCnpjProcurado}`);
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
        }
    }

    async selecionarPerfil() {
        console.log(`Selecionando perfil de Procurador para o CNPJ do certificado: ${this.certificadoCnpj}...`);
        return await this.makeRequest('GET', `/services/v1/empregadores/${this.certificadoCnpj}/cadastrado`, { perfil: 'Procurador' });
    }

    async verificarServicosHabilitados(cnpjProcurado: string) {
        console.log(`Verificando serviços habilitados para o CNPJ procurado: ${cnpjProcurado}...`);
        return await this.makeRequest('GET', `/services/v1/procuracoes/servicos-habilitados/${this.certificadoCnpj}/${cnpjProcurado}`);
    }

    async verificarProcuracao(cnpjProcurado: string) {
        console.log(`Verificando se existe procuração para o CNPJ: ${cnpjProcurado}...`);
        return await this.makeRequest('GET', `/services/v1/procuracoes/existe/${cnpjProcurado}`);
    }

    async consultarDadosCNPJ(cnpjProcurado: string) {
        console.log(`Consultando dados do CNPJ: ${cnpjProcurado}...`);
        return await this.makeRequest('GET', `/services/v1/cnpj/${cnpjProcurado}`);
    }
}
