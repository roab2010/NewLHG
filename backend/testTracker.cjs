const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrape() {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
        
        await page.goto('https://tracker.gg/cs2/profile/steam/76561199042104680/overview', { waitUntil: 'networkidle2' });
        const html = await page.content();
        fs.writeFileSync('trackerHtml.html', html);
        
        await browser.close();
    } catch (e) {
        console.error(e);
    }
}
scrape();
