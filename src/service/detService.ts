import { Page } from "puppeteer";
import { AppdataSource } from "../db/data-source";
import { Enterprise } from "../entities/CnpjMatriz";
import { ExistResponse } from "./procuracaoExistente";

export class DetService {
    private procuracaoService: ExistResponse;

    constructor() {
        this.procuracaoService = new ExistResponse(); 
    }

    async start(page: Page) {
        try {
            console.log("Iniciando DetService...");

            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            await page.waitForFunction(() => window.location.href.includes("https://det.sit.trabalho.gov.br/servicos"), { timeout: 60000 });
            console.log("Login confirmado. Selecionando perfil...");

            await page.waitForSelector('.button', { visible: true });
            await page.click('.button');
            await new Promise(resolve => setTimeout(resolve, 5000));

            await page.waitForSelector('.ng-select', { visible: true });
            await page.click('.ng-select');
            await new Promise(resolve => setTimeout(resolve, 5000));

            await page.waitForSelector('.ng-option', { visible: true });

            await page.evaluate(() => {
                const options = Array.from(document.querySelectorAll('.ng-option')) as HTMLElement[];
                const option = options.find(option => option.innerText.includes('Procurador'));
                if (option) option.click();
            });

            const enterpriseRepository = AppdataSource.getRepository(Enterprise);
            const empresas = await enterpriseRepository.find({
                order: { id: "ASC" },
            });

            if (!empresas.length) {
                throw new Error("Nenhum CNPJ encontrado no banco de dados.");
            }

            // Habilitar a interceptação de requisições
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                console.log('Interceptando requisição:', request.url())
                request.continue();
            });

            page.on('response', async (response) => {
                const url = response.url();
                const status = response.status();
                const responseBody = await response.text();
                console.log(`Resposta recebida ${url} com status ${status}`)

                if (url.includes('procuracoes/servicos-habilitados') && status !== 200) {
                    console.warn(`Erro de API para o CNPJ: ${empresas[0].Cnpj}:`, responseBody); 
                    if (responseBody.includes('não possui procuração')) {
                        console.warn(`CNPJ ${empresas[0].Cnpj} não possui procuração.`); 
                    }
                }

                // Resposta positiva - CNPJ com procuração
                if (url.includes('procuracoes/existe') && status === 200) {
                    const responseJson = await response.json();
                    if (responseJson.existe === true) {
                        console.log(`CNPJ ${empresas[0].Cnpj} possui procuração válida.`); 
                    }
                }
            });

            // Para cada CNPJ encontrado no banco de dados, realiza o fluxo de seleção e verificação
            for (const empresa of empresas) {   
                console.log("Tentando CNPJ:", empresa.Cnpj);  

                await page.waitForSelector('input[placeholder="Informe CNPJ ou CPF"]', { visible: true });
                await page.click('input[placeholder="Informe CNPJ ou CPF"]', { clickCount: 3 });
                await page.keyboard.press('Backspace');
                await page.type('input[placeholder="Informe CNPJ ou CPF"]', empresa.Cnpj);  

                console.log("CNPJ inserido, clicando no botão Selecionar...");

                await page.waitForSelector('.br-button.is-primary', { visible: true });
                await page.click('.br-button.is-primary');

                // Aguardar a resposta da API que confirma se o CNPJ possui procuração ou não
                console.log("Aguardando resposta da API após clicar em Selecionar...");
                try {
                    const possuiProc = await this.procuracaoService.checkoutExist(empresa.Cnpj); // Chama o serviço de procuração
                    if (possuiProc) {
                        console.log(`CNPJ ${empresa.Cnpj} possui procuração válida.`);
                    } else {
                        console.warn(`CNPJ ${empresa.Cnpj} não possui procuração.`);
                    }
                } catch (error) {
                    console.error("Erro ao verificar a procuração:", error.message);
                    continue; // Pula para o próximo CNPJ em caso de erro
                }

                console.log("CNPJ validado com sucesso, prosseguindo...");
            }

        } catch (error) {
            console.error("Erro no DetService:", error.message);
        }
    }
}
