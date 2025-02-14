import puppeteer, { Page } from "puppeteer";
import axios from 'axios';

const API_KEY = process.env.API_KEY || "";

 export class LoginService { 
     async loginWithCertificate(): Promise<Page> {
         const browser = await puppeteer.launch( {
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


         await page.waitForSelector('#botao')
            await page.click('#botao')
         
         await page.waitForSelector('#login-certificate', { visible: true})
            await page.click('#login-certificate')

         const captchaFieldValue = await page.$("#captcha");
          if (captchaFieldValue) {
            console.log("Captcha encontrado");
            const captchaSolution = await this.solveCaptcha(page);
            await page.type("#captcha", captchaSolution);
          } else {
            console.log("Captcha não encontrado");
          }
         return page;
     } 
     private async solveCaptcha(page: Page): Promise<string> { 
        console.log("Resolvendo captcha");

        try {
            const captchaImage = await page.$eval('img[src*="captcha"]', (img: any) => img.src)
    
            const response = await axios.post("http://2captcha.com/in.php", null, {
                params: {
                    key: API_KEY,
                    method: "base64",
                    body: captchaImage.split(",")[1],
                    json: 1,
                }
            })
    
            if (response.data.status !== 1) {
                throw new Error("Erro ao enviar captcha para o 2captcha");
            }
            const requestIdForCaptcha = response.data.request;
    
            let solution;
            while (true) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const solutionResponse = await axios.get("http://2captcha.com/res.php", {
                    params: {
                        key: API_KEY,
                        action: "get",
                        id: requestIdForCaptcha,
                        json: 1,
                    },
                });
                if (solutionResponse.data.status === 1) {
                    solution = solutionResponse.data.request;
                    break;
                }
                console.log(`Captcha resolvido: ${solution}`);
                return solution
            }
          } catch (error) {
            console.log("Erro ao resolver captcha", error);
            return "";
        }
    }
}