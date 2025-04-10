"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginService = void 0;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const axios_1 = __importDefault(require("axios"));
class LoginService {
    certificadoCnpj = '34331182000103';
    bearerToken;
    apiUrl = process.env.BASE_URL;
    constructor() {
        this.bearerToken = '';
    }
    async loginWithCertificate() {
        const browser = await puppeteer_extra_1.default.launch({
            headless: false,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            userDataDir: 'C:\\Users\\Kaue\\AppData\\Local\\Google\\Chrome\\User Data\\Default',
            args: [
                '--start-maximized',
                '--force-device-scale-factor=0.9',
                '--ignore-certificate-errors',
                '--allow-running-insecure-content',
            ],
            defaultViewport: { width: 1360, height: 768 },
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1360, height: 768 });
        await page.goto('https://det.sit.trabalho.gov.br/login?r=%2Fservicos%2Fdet%2Findex.html');
        let bearerToken = '';
        // Iniciar login
        await page.waitForSelector('#botao');
        await page.click('#botao');
        await page.waitForSelector('#login-certificate', { visible: true, timeout: 40000 });
        await page.click('#login-certificate');
        console.log("[INFO] Enviando hCaptcha para o 2Captcha...");
        let taskId;
        try {
            const { data } = await axios_1.default.post('http://2captcha.com/in.php', null, {
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
            taskId = data.request;
        }
        catch (error) {
            console.error("[ERRO] Falha ao enviar o Captcha:", error.message);
            throw error;
        }
        try {
            let captchaToken;
            for (let i = 0; i < 60; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { data: solutionResponse } = await axios_1.default.get('http://2captcha.com/res.php', {
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
                const captchaInput = document.querySelector('[name="h-captcha-response"]');
                if (captchaInput) {
                    captchaInput.value = captchaToken;
                    captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
                    captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log("Token do captcha injetado.");
                }
                else {
                    console.error("Input do captcha não encontrado");
                }
            }, captchaToken);
        }
        catch (error) {
            console.error("Erro ao resolver o captcha", error.message);
        }
        await page.evaluate(() => {
            const form = document.querySelector("form");
            if (form) {
                form.submit();
                console.log("Formulário enviado.");
            }
        });
        await new Promise((resolve, reject) => {
            page.on('response', async (response) => {
                const url = response.url();
                const status = response.status();
                if (status === 200 && url.includes(`https://det.sit.trabalho.gov.br/services/v1/empregadores/${this.certificadoCnpj}/cadastrado`)) {
                    const tokenHeader = response.headers()['set-token'];
                    if (tokenHeader) {
                        this.bearerToken = tokenHeader;
                        console.log("Bearer Token capturado da resposta:", this.bearerToken);
                        resolve(true);
                    }
                }
            });
            setTimeout(() => {
                reject(new Error("Bearer Token não capturado após login"));
            }, 10000);
        });
        if (!this.bearerToken) {
            throw new Error("Bearer Token não capturado após login");
        }
        return { page, bearerToken: this.bearerToken };
    }
    getBearerToken() {
        return this.bearerToken;
    }
}
exports.LoginService = LoginService;
//# sourceMappingURL=loginService.js.map