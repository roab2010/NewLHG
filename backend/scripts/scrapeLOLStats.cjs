const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const players = [
    { name: 'doanh hyy', tag: '1405', url: 'https://www.deeplol.gg/summoner/vn/doanh%20hyy-1405' },
    { name: 'YoneMin999', tag: '999', url: 'https://www.deeplol.gg/summoner/vn/YoneMin999-999' },
    { name: 'TALE12', tag: '2640', url: 'https://www.deeplol.gg/summoner/vn/TALE12-2640' },
    { name: 'Trảm Tình', tag: 'adc', url: 'https://www.deeplol.gg/summoner/vn/Tr%E1%BA%A3m%20T%C3%ACnh-adc' },
    { name: 'Young B', tag: '2010', url: 'https://www.deeplol.gg/summoner/vn/Young%20B-2010' },
    { name: 'Xun Won Tới Chơi', tag: '2404', url: 'https://www.deeplol.gg/summoner/vn/Xun%20Won%20T%E1%BB%9Bi%20Ch%C6%A1i-2404' },
    { name: 'LHE Shadow', tag: '2010', url: 'https://www.deeplol.gg/summoner/vn/LHE%20Shadow-2010' }
];

async function scrapeLOLStats() {
    console.log('Starting LOL stats scraper...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];
    const page = await browser.newPage();
    // Optimizing scraping speed by blocking unneeded resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if(['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())){
            req.abort();
        } else {
            req.continue();
        }
    });

    for (const player of players) {
        try {
            console.log(`Scraping LOL stats for ${player.nickname}...`);
            await page.goto(player.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            
            // Need to wait enough time for JS to render the stats
            await new Promise(r => setTimeout(r, 6000));
            
            const html = await page.content();
            const $ = cheerio.load(html);

            const profileIcon = $('.p__info img').first().attr('src') || '';

            const soloBox = $('.sc-hMQzmg.bYvuSn').filter((i, el) => $(el).text().includes('Solo'));
            const soloRank = soloBox.find('.tier_color').text().trim() || 'Unranked';
            const soloLP = soloBox.find('.sc-hNNYia').text().trim() || '0 LP';
            const soloWinRateText = soloBox.find('.sc-juGFGr').filter((i, el) => $(el).text().includes('Win Rate')).text() || '';
            const soloWinRate = soloWinRateText.replace('Win Rate ', '') || '0%';

            const flexBox = $('.sc-hMQzmg.bYvuSn').filter((i, el) => $(el).text().includes('Flex'));
            const flexRank = flexBox.find('.tier_color').text().trim() || 'Unranked';
            const flexLP = flexBox.find('.sc-hNNYia').text().trim() || '0 LP';
            const flexWinRateText = flexBox.find('.sc-juGFGr').filter((i, el) => $(el).text().includes('Win Rate')).text() || '';
            const flexWinRate = flexWinRateText.replace('Win Rate ', '') || '0%';
            
            // For KDA, we'll try to find the overall KDA
            const kdaElement = $('.kda_color').first();
            const kda = kdaElement.length ? kdaElement.text().replace(' KDA', '') : '0.00';

            const soloMatchesText = soloBox.find('.sc-juGFGr').first().text() || '0W 0L';
            const matchesPlayed = soloMatchesText.split(' ').reduce((acc, val) => {
                const num = parseInt(val.replace(/\D/g, ''));
                return isNaN(num) ? acc : acc + num;
            }, 0);

            console.log(`- ${player.name}: Solo: ${soloRank}, Flex: ${flexRank}`);

            results.push({
                nickname: player.name,
                tag: player.tag,
                profileIcon,
                rank: soloRank, // Keep legacy 'rank' for backward compatibility
                lp: soloLP,
                winRate: soloWinRate,
                soloRank,
                soloLP,
                soloWinRate,
                flexRank,
                flexLP,
                flexWinRate,
                kda,
                matchesPlayed,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error(`Failed to scrape ${player.name}:`, error.message);
            // Push empty fallback so website doesn't crash
            results.push({
                nickname: player.name,
                tag: player.tag,
                rank: 'Unranked',
                lp: '0 LP',
                winRate: '0%',
                kda: '0.00',
                matchesPlayed: 0,
                updatedAt: new Date().toISOString()
            });
        }
    }

    await browser.close();

    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.join(dataDir, 'lolstats.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Successfully saved ${results.length} LOL stats to ${outputPath}`);
}

scrapeLOLStats();
