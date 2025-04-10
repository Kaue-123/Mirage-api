// import { Page } from 'puppeteer';
// import { AppdataSource } from '../db/data-source';
// import { Enterprise } from '../entities/Enterprises';
// import { DownloadPDFContent } from '../utils/download.file';

// export class MessageDownloader {
//     private page: Page;

  
//     constructor(page: Page) {
//         this.page = page;
//     }
    
//     async acessarMensagensNaoLidas(cnpj: string): Promise<void> {
//         const enterpriseRepository = AppdataSource.getRepository(Enterprise)

//         if (!enterpriseRepository) {
//             console.error("Erro ao obter repositório de empresas.");
//             return;
//         }

//         await this.page.waitForSelector('.is-secondary.slim_button.br-button', { visible: true });
//         await this.page.click('.is-secondary.slim_button.br-button');
//         console.log("Botão 'Trocar Perfil' clicado.");


//         await this.page.waitForNavigation({ waitUntil: 'networkidle2' });


//         await this.page.waitForSelector('.ng-arrow-wrapper', { visible: true })
//         await this.page.click('.ng-arrow-wrapper')
//         console.log("Botão de trocar tipo de perfil selecionado")


//         await this.page.waitForSelector('.ng-dropdown-panel .ng-option', { visible: true });
//         const options = await this.page.$$('.ng-dropdown-panel .ng-option');
//         for (const option of options) {
//             const text = await this.page.evaluate(el => el.textContent, option);
//             if (text?.trim() === "Procurador") {
//                 await option.click();
//                 console.log("Perfil 'Procurador' selecionado.");
//                 break;
//             }
//         }


//         await this.page.waitForSelector("input[placeholder='Informe CNPJ ou CPF']", { visible: true });
//         await this.page.click("input[placeholder='Informe CNPJ ou CPF']");
//         await this.page.evaluate(() => document.querySelector("input[placeholder='Informe CNPJ ou CPF']")?.setAttribute("value", ""));
//         await this.page.type("input[placeholder='Informe CNPJ ou CPF']", cnpj, { delay: 30 });

//         await this.page.waitForSelector('br-button.is-primary', { visible: true })
//         await this.page.click('br-button.is-primary')
//         console.log("Botão para selecionar perfil clicado.")
//         await this.page.waitForNavigation({ waitUntil: 'networkidle2' });


//         await this.page.waitForSelector(".cardListItem.is-amplo")
//         await this.page.click(".cardListItem.is-amplo")
//         await this.page.waitForNavigation({ waitUntil: 'networkidle2' })

//         await this.page.waitForSelector('.tabela.mensagens')
//         await this.page.click(".tabela.mensagens")
//         await this.page.waitForNavigation({ waitUntil: 'networkidle2'})


//         await this.page.waitForSelector(".fa.fa-ellipsis-v")
//         await this.page.click(".fa.fa-ellipsis-v")
//         await this.page.waitForNavigation({ waitUntil: 'networkidle2'})

//         await this.page.waitForSelector(".dropdown-item")

//         const pastaDestino = "C:\\Users\\Kaue\\OneDrive - Envoy\\Área de Trabalho\\Mirage-api\\src\\PDFS";
//         await DownloadPDFContent.configureDownloadPath(this.page, pastaDestino);

//         if (!pastaDestino) { 
//             console.error("Erro ao salvar arquivo no diretório de PDFs")
//         }
//         await this.page.click(".dropdown-item")
//         await this.page.waitForNavigation({ waitUntil: 'networkidle2'})



        
//     }
// }

