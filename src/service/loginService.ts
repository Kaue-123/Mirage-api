import puppeteer from 'puppeteer-extra';
import { Page, ElementHandle } from 'puppeteer';
import axios from 'axios';
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha-anti-captcha');

const API_KEY = process.env.API_KEY || "";  // Chave de API do AntiCaptcha

export class LoginService {
    async loginWithCertificate(): Promise<any> {
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            userDataDir: 'C:\\Users\\Kauê Carmo\\AppData\\Local\\Google\\Chrome\\User Data\\Default',
            args: ['--start-maximized', 
                '--ignore-certificate-errors',
                '--force-device-scale-factor=0.9',
            ],
            defaultViewport: { width: 1360, height: 768 }, 
        });

        const page: Page = await browser.newPage();
        await page.setViewport({ width: 1360, height: 768 });

        await page.goto('https://det.sit.trabalho.gov.br/login?r=%2Fservicos%2Fdet%2Findex.html');

        await page.waitForSelector('#botao');
        await page.click('#botao');

        await page.waitForSelector('#login-certificate', { visible: true });
        await page.click('#login-certificate');

        
        // const sitekey = await page.evaluate(() => {
        //     const iframe = document.querySelector('iframe[src*="hcaptcha"]') as HTMLIFrameElement;
        //     if (!iframe) return null;
        
        //     const url = new URL(iframe.src);
        //     const sitekeyFromUrl = url.searchParams.get('sitekey') || url.hash.split('sitekey=')[1]?.split('&')[0];
        //     return sitekeyFromUrl;
            
        // });

        // console.log("teste", sitekey)
    
        // console.log("SiteKey encontrada", sitekey)

        const { data } = await axios.post('https://api.anti-captcha.com/createTask', {
            clientKey: API_KEY,
            task: {
                type: "HCaptchaEnterpriseTaskProxyless",
                websiteURL: "https://det.sit.trabalho.gov.br/login?r=%2Fservicos%2Fdet%2Findex.html",
                websiteKey: "93b08d40-d46c-400a-ba07-6f91cda815b9"
            }
        });

        if (!data.taskId) {
            console.error("Erro ao criar tarefa no AntiCaptcha", data);
            return page;
        }

        console.log("TaskId criada", data.taskId);

        let token
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000));  // Aguardar 5 segundos

            const { data: solutionResponse } = await axios.post('https://api.anti-captcha.com/getTaskResult', {
                clientKey: API_KEY,
                taskId: data.taskId
            });

            if (solutionResponse.errorId !== 0) {
                console.error("Erro ao obter solução do captcha", solutionResponse);
                break;
            }

            if (solutionResponse.status === "ready") {
                token = solutionResponse.solution.gRecaptchaResponse;
                break;
            }
        }

        if (!token) {
            console.error("Token não encontrado");
            return page;
        }

        await page.evaluate((token) => {
          const captchaInput = document.querySelector('[name="h-captcha-response"]') as HTMLInputElement ;
            if (captchaInput) {
                captchaInput.value = token;
                // document.querySelector('form').submit();
            } else {
                console.error("Input do captcha não encontrado");
            }
          }, token);
    }
    
}
    //     // Aguarda até que as divs com captchas estejam visíveis
    //     await page.waitForSelector('.task-grid', { visible: true, timeout: 120000 });

    //     // Captura todas as imagens de captcha dentro das divs .task-grid
    //     const captchaImages = await page.$$('.interface-wrapper'); 

    //     if (captchaImages.length > 0) {
    //         console.log(`${captchaImages.length} imagens de captcha encontradas`);

    //         // Itera pelas imagens e tenta identificar a correta
    //         for (let i = 0; i < captchaImages.length; i++) {
    //             // Usando getProperty para acessar o atributo 'src'
    //             const imageSrcHandle = await captchaImages[i].getProperty('src');
    //             const imageSrc = await imageSrcHandle.jsonValue();

    //             if (imageSrc && imageSrc.includes('captcha')) { // Verifica se o src da imagem contém 'captcha' no URL
    //                 console.log(`Captcha encontrado na imagem ${i + 1}`);
                    
    //                 // Aqui você pode implementar a lógica para enviar essa imagem para o AntiCaptcha ou resolver de outra forma
    //                 const captchaSolutionValue = await this.solveCaptcha(page, imageSrc);  // Passando o src para a função de resolução do captcha
    //                 await page.type('input[name="h-captcha-response"]', captchaSolutionValue);  
    //                 break;
    //             }
    //         }
    //     } else {
    //         console.log("Nenhuma imagem de captcha encontrada.");
    //     }

    //     return page;
     

    // private async solveCaptcha(page: Page, captchaImageSrc: string): Promise<string> { 
    //     console.log("Resolvendo captcha");

    //     try {
    //         // Enviando a imagem do captcha para a API AntiCaptcha
    //         const response = await axios.post("https://api.anti-captcha.com/createTask", {
    //             clientKey: API_KEY,  // Sua chave de API do AntiCaptcha
    //             task: {
    //                 type: "ImageToTextTask",  // Tipo de tarefa para resolver o captcha
    //                 body: captchaImageSrc.split(",")[1],  // Captcha em base64
    //             }
    //         });

    //         if (response.data.errorId !== 0) {
    //             throw new Error(`Erro ao criar tarefa: ${response.data.errorDescription}`);
    //         }

    //         const taskId = response.data.taskId;

    //         // Aguardar a solução do captcha
    //         let solution;
    //         while (true) {
    //             await new Promise(resolve => setTimeout(resolve, 5000));  // Aguardar 5 segundos

    //             const solutionResponse = await axios.post("https://api.anti-captcha.com/getTaskResult", {
    //                 clientKey: API_KEY,
    //                 taskId: taskId,
    //             });

    //             if (solutionResponse.data.errorId !== 0) {
    //                 throw new Error(`Erro ao obter solução: ${solutionResponse.data.errorDescription}`);
    //             }

    //             if (solutionResponse.data.status === "ready") {
    //                 solution = solutionResponse.data.solution.text;
    //                 break;
    //             }
    //         }

    //         console.log(`Captcha resolvido: ${solution}`);
    //         return solution;
    //     } catch (error) {
    //         console.log("Erro ao resolver captcha", error);
    //         return "";
    //     }
    // }