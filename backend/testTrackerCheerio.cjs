const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function scrape() {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
        
        await page.goto('https://tracker.gg/cs2/profile/steam/76561199042104680/overview', { waitUntil: 'networkidle2' });
        const html = await page.content();
        const $ = cheerio.load(html);
        
        const title = $('title').text();
        console.log("Title: ", title);
        
        const kd = $('span[title="K/D Ratio"]').parent().find('.value').text().trim() || 'N/A';
        const winPct = $('span[title="Win %"]').parent().find('.value').text().trim() || 'N/A';
        const headshotPct = $('span[title="Headshot %"]').parent().find('.value').text().trim() || 'N/A';
        
        console.log("K/D: ", kd);
        console.log("Win %: ", winPct);
        console.log("Headshot %: ", headshotPct);
        
        // Find other stats
        $('.numbers .value').each((i, el) => {
             console.log($(el).text().trim());
        });

        await browser.close();
    } catch (e) {
        console.error(e);
    }
}
scrape();
