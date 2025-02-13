import puppeteer, { Page } from "puppeteer";

// export class LoginService { 
    // async loginWithCertificate(): Promise<Page> {
    //     const browser = await puppeteer.launch( {
    //         headless: false,
    //         args: ['--start-maximized'],
    //         defaultViewport: { width: 1366, height: 768 }, 
    //         ignoreHTTPSErrors: true
    //     });
    //     const page = await browser.newPage();

    //     await page.goto('https://det.sit.trabalho.gov.br/login?r=%2Fservicos%2Fdet%2Findex.html');


    //     await browser.close();
    //     return page;
    // }
//}