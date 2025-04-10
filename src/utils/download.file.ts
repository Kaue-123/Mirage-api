import fs from 'fs';
import path from 'path';
import { Page } from 'puppeteer';

export class DownloadPDFContent {
    private static tempDownload = path.join(__dirname, '../PDFs')

    static async configureDownloadPath(page: Page, tempDownload: string): Promise<void> {
        if (!fs.existsSync(this.tempDownload)) {
            fs.mkdirSync(this.tempDownload, { recursive: true });
        }
        
        const client = await page.createCDPSession()
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: this.tempDownload,
        });
    }
}