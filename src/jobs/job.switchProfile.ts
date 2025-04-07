import { Page } from 'puppeteer';
import { AppdataSource } from '../db/data-source';
import { Enterprise } from '../entities/Enterprises';

export class MessageDownloader {
    private page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async acessarMensagensNaoLidas(cnpj: string): Promise<void> {
        const enterpriseRepository = AppdataSource.getRepository(Enterprise)

        if (enterpriseRepository) {
            console.error("Erro ao obter repositório de empresas.");
            return;
        }

        await this.page.waitForSelector('.is-secondary.slim_button.br-button', { visible: true });
        await this.page.click('.is-secondary.slim_button.br-button');
        console.log("Botão 'Trocar Perfil' clicado.");


        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });


        await this.page.waitForSelector('.ng-arrow-wrapper', { visible: true })
        await this.page.click('.ng-arrow-wrapper')
        console.log("Botão de trocar tipo de perfil selecionado")


        await this.page.waitForSelector('.ng-dropdown-panel .ng-option', { visible: true });
        const options = await this.page.$$('.ng-dropdown-panel .ng-option');
        for (const option of options) {
            const text = await this.page.evaluate(el => el.textContent, option);
            if (text?.trim() === "Procurador") {
                await option.click();
                console.log("Perfil 'Procurador' selecionado.");
                break;
            }
        }


        await this.page.waitForSelector("input[placeholder='Informe CNPJ ou CPF']", { visible: true });
        await this.page.click("input[placeholder='Informe CNPJ ou CPF']");
        await this.page.evaluate(() => document.querySelector("input[placeholder='Informe CNPJ ou CPF']")?.setAttribute("value", ""));
        await this.page.type("input[placeholder='Informe CNPJ ou CPF']", cnpj, { delay: 30 });

        await this.page.waitForSelector('br-button is-primary', { visible: true })
        await this.page.click('br-button is-primary')
        console.log("Botão para selecionar perfil clicado.")

        await this.page.waitForNavigation({ waitUntil: 'networkidle2' });


        
        
        }
    }

