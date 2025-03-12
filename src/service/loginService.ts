import puppeteer from 'puppeteer-extra';
import { Page } from 'puppeteer';
import axios from 'axios';

export class LoginService {
    async loginWithCertificate(): Promise<{ page: Page; bearerToken: string }> {
        const browser = await puppeteer.launch({
            headless: false,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            userDataDir: 'C:\\Users\\Kaue\\AppData\\Local\\Google\\Chrome\\User Data\\Default',
            args: [
                '--start-maximized',
                '--force-device-scale-factor=0.9',
                '--ignore-certificate-errors',
                '--allow-running-insecure-content',
                '--auto-select-certificate-for-urls={"pattern":"https://det.sit.trabalho.gov.br","filter":{}}',
                '--ssl-client-cert-file=C:\\Users\\Kaue\\Documentos\\Certificados\\cert.pem',
                '--ssl-client-key-file=C:\\Users\\Kaue\\Documentos\\Certificados\\key.pem',
                '--ssl-client-key-passphrase=27713412808'
            ],
            defaultViewport: { width: 1360, height: 768 },
        });

        const page: Page = await browser.newPage();
        await page.setViewport({ width: 1360, height: 768 });
        await page.goto('https://det.sit.trabalho.gov.br/login?r=%2Fservicos%2Fdet%2Findex.html');

        let bearerToken = '';

        // Iniciar login
        await page.waitForSelector('#botao');
        await page.click('#botao');
        await page.waitForSelector('#login-certificate', { visible: true, timeout: 40000 });
        await page.click('#login-certificate');

        console.log("Enviando hCaptcha para o 2Captcha...");
        const { data } = await axios.post('http://2captcha.com/in.php', null, {
            params: {
                key: "c60b640dd62d387ef1c4bcb792add8c6",
                method: 'hcaptcha',
                sitekey: '93b08d40-d46c-400a-ba07-6f91cda815b9',
                pageurl: 'https://det.sit.trabalho.gov.br/login?r=%2Fservicos%2Fdet%2Findex.html',
                json: 1
            }
        });

        if (data.status !== 1) {
            console.error("Erro ao enviar hCaptcha para 2Captcha", data);
            throw new Error("Falha no hCaptcha");
        }

        console.log("Captcha enviado. Task ID:", data.request);
        const taskId = data.request;

        let captchaToken;
        for (let i = 0; i < 30; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: solutionResponse } = await axios.get('http://2captcha.com/res.php', {
                params: {
                    key: "c60b640dd62d387ef1c4bcb792add8c6",
                    action: 'get',
                    id: taskId,
                    json: 1
                }
            });

            if (solutionResponse.status === 1) {
                captchaToken = solutionResponse.request;
                break;
            }
        }

        if (!captchaToken) {
            console.error("Token do captcha não encontrado");
            throw new Error("Falha ao resolver captcha");
        }


        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.evaluate((captchaToken) => {
            const captchaInput = document.querySelector('[name="h-captcha-response"]') as HTMLInputElement;
            if (captchaInput) {
                captchaInput.value = captchaToken;
                captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
                captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
                console.log("Token do captcha injetado.");
            } else {
                console.error("Input do captcha não encontrado");
            }
        }, captchaToken);

        await page.evaluate(() => {
            const form = document.querySelector("form");
            if (form) {
                form.submit();
                console.log("Formulário enviado.");
            }
        });


        page.on('response', async (response) => {
            const url = response.url();
            const status = response.status();

            // Verificar se a URL e o status são os esperados para pegar o Bearer Token
            if (status === 200 && url.includes('services/v1/empregadores')) {
                const tokenHeader = response.headers()['authorization'];
                if (tokenHeader && tokenHeader.startsWith('Bearer ')) {
                    bearerToken = tokenHeader.replace('Bearer ', '');
                    console.log("Bearer Token capturado da resposta:", bearerToken);
                }
            }
        });

        if (!bearerToken) {
            throw new Error("Bearer Token não capturado após login");
        }

        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        return { page, bearerToken };
    }
}
